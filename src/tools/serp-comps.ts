import { config } from "../config.js";
import {
  buildMarketplaceSearchQuery,
  sanitizeTitleForSearch,
} from "../lib/product-identity.js";
import type { CompRow, ExtractedSpecs } from "../types.js";
import { CompRowSchema, ConditionGrade } from "../types.js";

function parsePrice(text: string): number | null {
  const m = text.replace(/,/g, "").match(/\$?(\d+(?:\.\d{2})?)/);
  return m ? Number(m[1]) : null;
}

function platformLabel(source: string): string {
  const s = source.trim();
  if (!s) return "retail";
  return s.length > 32 ? `${s.slice(0, 29)}…` : s;
}

async function serpGet(
  params: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const url = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("api_key", config.serpApiKey);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn("SerpApi error", params.engine, res.status);
    return null;
  }
  return (await res.json()) as Record<string, unknown>;
}

function rowsFromGoogleShopping(
  specs: ExtractedSpecs,
  data: Record<string, unknown>,
  limit: number,
): CompRow[] {
  const results =
    (data.shopping_results as Array<{
      title?: string;
      source?: string;
      price?: string;
      extracted_price?: number;
      product_link?: string;
      link?: string;
      thumbnail?: string;
    }>) ?? [];

  const comps: CompRow[] = [];
  for (const item of results.slice(0, limit)) {
    const price =
      item.extracted_price ??
      (item.price ? parsePrice(item.price) : null);
    if (!price || !item.title) continue;

    comps.push(
      CompRowSchema.parse({
        title: item.title,
        brand: specs.brand,
        model_family: specs.model_family,
        storage_gb: specs.storage_gb,
        carrier_lock: specs.carrier_lock,
        condition_grade: ConditionGrade.parse("new"),
        includes_charger: specs.includes_charger,
        platform: platformLabel(item.source ?? "Google Shopping"),
        listed_price: price,
        sold_price: Math.round(price * 0.92),
        days_on_market: null,
        source: "serpapi",
        listing_url: item.product_link ?? item.link ?? null,
        thumbnail_url: item.thumbnail ?? null,
      }),
    );
  }
  return comps;
}

function rowsFromEbay(
  specs: ExtractedSpecs,
  data: Record<string, unknown>,
  limit: number,
): CompRow[] {
  const results =
    (data.organic_results as Array<{
      title?: string;
      link?: string;
      thumbnail?: string;
      price?: { raw?: string; extracted?: number };
      condition?: string;
    }>) ?? [];

  const comps: CompRow[] = [];
  for (const item of results.slice(0, limit)) {
    const price =
      item.price?.extracted ??
      (item.price?.raw ? parsePrice(item.price.raw) : null);
    if (!price || !item.title) continue;

    let condition_grade = specs.condition_grade;
    const cond = (item.condition ?? "").toLowerCase();
    if (cond.includes("new")) condition_grade = ConditionGrade.parse("new");
    else if (cond.includes("used"))
      condition_grade = ConditionGrade.parse("good");

    comps.push(
      CompRowSchema.parse({
        title: item.title,
        brand: specs.brand,
        model_family: specs.model_family,
        storage_gb: specs.storage_gb,
        carrier_lock: specs.carrier_lock,
        condition_grade,
        includes_charger: specs.includes_charger,
        platform: "eBay",
        listed_price: price,
        sold_price: Math.round(price * 0.97),
        days_on_market: null,
        source: "serpapi",
        listing_url: item.link ?? null,
        thumbnail_url: item.thumbnail ?? null,
      }),
    );
  }
  return comps;
}

/** Live retail (Google Shopping) + marketplace (eBay) snippets via SerpApi. */
async function runSerpPair(
  q: string,
  shoppingLimit: number,
  ebayLimit: number,
  specs: ExtractedSpecs,
): Promise<CompRow[]> {
  const [shoppingData, ebayData] = await Promise.all([
    serpGet({
      engine: "google_shopping",
      q,
      google_domain: "google.com",
      gl: "us",
      hl: "en",
    }),
    serpGet({
      engine: "ebay",
      ebay_domain: "ebay.com",
      _nkw: q,
    }),
  ]);

  const shopping = shoppingData
    ? rowsFromGoogleShopping(specs, shoppingData, shoppingLimit)
    : [];
  const ebay = ebayData ? rowsFromEbay(specs, ebayData, ebayLimit) : [];

  const seen = new Set<string>();
  const merged: CompRow[] = [];
  for (const row of [...shopping, ...ebay]) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return merged;
}

export async function fetchSerpComps(
  specs: ExtractedSpecs,
  limit = 10,
  rawTitle?: string,
): Promise<CompRow[]> {
  if (!config.serpApiKey) {
    return [];
  }

  const shoppingLimit = Math.max(4, Math.ceil(limit * 0.6));
  const ebayLimit = Math.max(3, limit - shoppingLimit);
  const primaryQ = buildMarketplaceSearchQuery(rawTitle ?? "", specs);
  const fallbackQ = rawTitle ? sanitizeTitleForSearch(rawTitle) : "";

  let merged = await runSerpPair(primaryQ, shoppingLimit, ebayLimit, specs);

  if (merged.length < 3 && fallbackQ && fallbackQ !== primaryQ) {
    const extra = await runSerpPair(
      fallbackQ,
      shoppingLimit,
      ebayLimit,
      specs,
    );
    const seen = new Set(merged.map((r) => r.title.toLowerCase()));
    for (const row of extra) {
      const key = row.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
      if (merged.length >= limit) break;
    }
  }

  return merged.slice(0, limit);
}
