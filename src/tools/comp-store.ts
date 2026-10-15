import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config, hasDatabase } from "../config.js";
import type { CompRow, ExtractedSpecs } from "../types.js";
import { CompRowSchema, ConditionGrade } from "../types.js";
import {
  cosineSimilarity,
  textEmbedding,
  vectorLiteral,
} from "../lib/embeddings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_CSV = path.resolve(
  __dirname,
  "../../sample-data/electronics-comps.csv",
);

let pool: pg.Pool | null = null;
let memoryComps: CompRow[] | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function loadSampleCompsFromCsv(): CompRow[] {
  const raw = fs.readFileSync(SAMPLE_CSV, "utf8");
  const lines = raw.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const rows: CompRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < header.length) continue;
    const rec: Record<string, string> = {};
    header.forEach((h, idx) => {
      rec[h] = cols[idx];
    });
    rows.push(
      CompRowSchema.parse({
        title: rec.title,
        brand: rec.brand,
        model_family: rec.model_family,
        storage_gb: rec.storage_gb ? Number(rec.storage_gb) : null,
        carrier_lock: rec.carrier_lock,
        condition_grade: ConditionGrade.parse(rec.condition_grade),
        includes_charger: rec.includes_charger === "true",
        platform: rec.platform,
        listed_price: rec.listed_price ? Number(rec.listed_price) : null,
        sold_price: Number(rec.sold_price),
        days_on_market: rec.days_on_market ? Number(rec.days_on_market) : null,
        source: rec.source as CompRow["source"],
      }),
    );
  }
  return rows;
}

function getMemoryComps(): CompRow[] {
  if (!memoryComps) {
    memoryComps = loadSampleCompsFromCsv();
  }
  return memoryComps;
}

function compSearchText(c: CompRow): string {
  return `${c.title} ${c.brand} ${c.model_family} ${c.platform}`;
}

function scoreComp(specs: ExtractedSpecs, comp: CompRow, queryVec: number[]): number {
  const text = compSearchText(comp);
  const sim = cosineSimilarity(queryVec, textEmbedding(text));
  let boost = 0;
  if (comp.brand.toLowerCase() === specs.brand.toLowerCase()) boost += 0.15;
  const modelA = comp.model_family.toLowerCase();
  const modelB = specs.model_family.toLowerCase();
  if (modelA === modelB) {
    boost += 0.35;
  } else if (modelA.includes(modelB) || modelB.includes(modelA)) {
    boost += 0.15;
  } else if (comp.brand.toLowerCase() !== specs.brand.toLowerCase()) {
    boost -= 0.25;
  }
  if (
    specs.storage_gb != null &&
    comp.storage_gb != null &&
    specs.storage_gb === comp.storage_gb
  ) {
    boost += 0.1;
  }
  return sim + boost;
}

export async function searchComps(
  specs: ExtractedSpecs,
  limit = 12,
): Promise<CompRow[]> {
  const queryText = `${specs.search_query} ${specs.brand} ${specs.model_family}`;
  const queryVec = textEmbedding(queryText);

  if (hasDatabase()) {
    try {
      const client = await getPool().connect();
      try {
        const { rows } = await client.query<{
          id: string;
          title: string;
          brand: string;
          model_family: string;
          storage_gb: number | null;
          carrier_lock: string;
          condition_grade: string;
          includes_charger: boolean;
          platform: string;
          listed_price: string | null;
          sold_price: string;
          days_on_market: number | null;
          source: string;
        }>(
          `
          SELECT id, title, brand, model_family, storage_gb, carrier_lock,
                 condition_grade, includes_charger, platform, listed_price,
                 sold_price, days_on_market, source,
                 1 - (embedding <=> $1::vector) AS score
          FROM comps
          WHERE brand ILIKE $2 OR model_family ILIKE $3
             OR search_text ILIKE '%' || $4 || '%'
          ORDER BY embedding <=> $1::vector
          LIMIT $5
          `,
          [
            vectorLiteral(queryVec),
            `%${specs.brand}%`,
            `%${specs.model_family}%`,
            specs.model_family,
            limit,
          ],
        );
        return rows.map((r) =>
          CompRowSchema.parse({
            id: r.id,
            title: r.title,
            brand: r.brand,
            model_family: r.model_family,
            storage_gb: r.storage_gb,
            carrier_lock: r.carrier_lock,
            condition_grade: r.condition_grade,
            includes_charger: r.includes_charger,
            platform: r.platform,
            listed_price: r.listed_price ? Number(r.listed_price) : null,
            sold_price: Number(r.sold_price),
            days_on_market: r.days_on_market,
            source: r.source,
          }),
        );
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn("Tiger search failed, using in-memory comps:", err);
    }
  }

  const ranked = getMemoryComps()
    .map((c) => ({ c, score: scoreComp(specs, c, queryVec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
  return ranked;
}

export async function upsertSerpComps(comps: CompRow[]): Promise<void> {
  if (!hasDatabase() || comps.length === 0) {
    memoryComps = [...comps, ...getMemoryComps()].slice(0, 200);
    return;
  }
  const client = await getPool().connect();
  try {
    for (const c of comps) {
      const search_text = compSearchText(c);
      const embedding = textEmbedding(search_text);
      await client.query(
        `
        INSERT INTO comps (
          title, brand, model_family, storage_gb, carrier_lock, condition_grade,
          includes_charger, platform, listed_price, sold_price, days_on_market,
          source, search_text, embedding
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::vector)
        `,
        [
          c.title,
          c.brand,
          c.model_family,
          c.storage_gb,
          c.carrier_lock,
          c.condition_grade,
          c.includes_charger,
          c.platform,
          c.listed_price,
          c.sold_price,
          c.days_on_market,
          c.source,
          search_text,
          vectorLiteral(embedding),
        ],
      );
    }
  } finally {
    client.release();
  }
}

export async function runSchema(): Promise<void> {
  if (!hasDatabase()) return;
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../../sql/schema.sql"),
    "utf8",
  );
  const client = await getPool().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

export async function seedFromCsv(): Promise<number> {
  const rows = loadSampleCompsFromCsv();
  if (!hasDatabase()) {
    memoryComps = rows;
    return rows.length;
  }
  await runSchema();
  const client = await getPool().connect();
  try {
    await client.query("TRUNCATE comps");
    for (const c of rows) {
      const search_text = compSearchText(c);
      const embedding = textEmbedding(search_text);
      await client.query(
        `
        INSERT INTO comps (
          title, brand, model_family, storage_gb, carrier_lock, condition_grade,
          includes_charger, platform, listed_price, sold_price, days_on_market,
          source, search_text, embedding
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::vector)
        `,
        [
          c.title,
          c.brand,
          c.model_family,
          c.storage_gb,
          c.carrier_lock,
          c.condition_grade,
          c.includes_charger,
          c.platform,
          c.listed_price,
          c.sold_price,
          c.days_on_market,
          c.source,
          search_text,
          vectorLiteral(embedding),
        ],
      );
    }
  } finally {
    client.release();
  }
  return rows.length;
}
