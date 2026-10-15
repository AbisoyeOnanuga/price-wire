import { config } from "../config.js";
import type { CompRow, ExtractedSpecs } from "../types.js";
import { CompRowSchema, ConditionGrade } from "../types.js";

function parsePrice(text: string): number | null {
  const m = text.replace(/,/g, "").match(/\$?(\d+(?:\.\d{2})?)/);
  return m ? Number(m[1]) : null;
}

export async function fetchSerpComps(
  specs: ExtractedSpecs,
  limit = 6,
): Promise<CompRow[]> {
  if (!config.serpApiKey) {
    return [];
  }

  const q = `${specs.search_query} ${specs.condition_grade} used`;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "ebay");
  url.searchParams.set("ebay_domain", "ebay.com");
  url.searchParams.set("_nkw", q);
  url.searchParams.set("api_key", config.serpApiKey);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn("SerpApi error", res.status);
    return [];
  }

  const data = (await res.json()) as {
    organic_results?: Array<{
      title?: string;
      price?: { raw?: string; extracted?: number };
      condition?: string;
    }>;
  };

  const results = data.organic_results ?? [];
  const comps: CompRow[] = [];

  for (const item of results.slice(0, limit)) {
    const price =
      item.price?.extracted ??
      (item.price?.raw ? parsePrice(item.price.raw) : null);
    if (!price || !item.title) continue;

    let condition_grade = specs.condition_grade;
    const cond = (item.condition ?? "").toLowerCase();
    if (cond.includes("new")) condition_grade = ConditionGrade.parse("new");
    else if (cond.includes("used")) condition_grade = ConditionGrade.parse("good");

    comps.push(
      CompRowSchema.parse({
        title: item.title,
        brand: specs.brand,
        model_family: specs.model_family,
        storage_gb: specs.storage_gb,
        carrier_lock: specs.carrier_lock,
        condition_grade,
        includes_charger: specs.includes_charger,
        platform: "ebay",
        listed_price: price,
        sold_price: Math.round(price * 0.97),
        days_on_market: null,
        source: "serpapi",
      }),
    );
  }

  return comps;
}
