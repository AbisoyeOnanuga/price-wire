import { config } from "../config.js";
import type { CompRow, ExtractedSpecs } from "../types.js";

const CONDITION_NUM: Record<string, number> = {
  new: 5,
  like_new: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

const PLATFORM_NUM: Record<string, number> = {
  ebay: 1,
  amazon: 2,
  facebook: 3,
};

function compToFeatures(specs: ExtractedSpecs, c: CompRow): number[] {
  return [
    CONDITION_NUM[c.condition_grade] ?? 3,
    c.storage_gb ?? specs.storage_gb ?? 0,
    c.includes_charger ? 1 : 0,
    PLATFORM_NUM[c.platform] ?? 0,
    c.days_on_market ?? 7,
    c.listed_price ?? c.sold_price,
  ];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export type PricePrediction = {
  suggested_price: number;
  quick_sale_price: number;
  hold_price: number;
  confidence: "low" | "medium" | "high";
  method: "tabpfn" | "median_fallback";
};

async function predictWithTabpfn(
  specs: ExtractedSpecs,
  comps: CompRow[],
): Promise<number | null> {
  if (!config.tabpfnApiKey || comps.length < 3) return null;

  const X = comps.map((c) => compToFeatures(specs, c));
  const y = comps.map((c) => c.sold_price);
  const target = compToFeatures(specs, {
    ...comps[0],
    condition_grade: specs.condition_grade,
    storage_gb: specs.storage_gb,
    includes_charger: specs.includes_charger,
    listed_price: null,
    sold_price: median(y),
  });

  try {
    const res = await fetch("https://api.priorlabs.ai/v1/tabpfn/predict", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.tabpfnApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: "regression",
        X_train: X,
        y_train: y,
        X_test: [target],
      }),
    });
    if (!res.ok) {
      console.warn("TabPFN API error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { predictions?: number[] };
    const pred = data.predictions?.[0];
    return typeof pred === "number" ? pred : null;
  } catch (err) {
    console.warn("TabPFN request failed:", err);
    return null;
  }
}

function filterRelevantComps(specs: ExtractedSpecs, comps: CompRow[]): CompRow[] {
  const model = specs.model_family.toLowerCase();
  const sameModel = comps.filter((c) => {
    const m = c.model_family.toLowerCase();
    return m === model || m.includes(model) || model.includes(m);
  });
  return sameModel.length >= 2 ? sameModel : comps;
}

export async function predictPrice(
  specs: ExtractedSpecs,
  comps: CompRow[],
): Promise<PricePrediction> {
  const relevant = filterRelevantComps(specs, comps);
  const prices = relevant.map((c) => c.sold_price).filter((p) => p > 0);
  const med = median(prices);
  const spread = stddev(prices);

  let suggested = med;
  let method: PricePrediction["method"] = "median_fallback";

  const tabpfn = await predictWithTabpfn(specs, relevant);
  if (tabpfn != null && tabpfn > 0) {
    suggested = tabpfn;
    method = "tabpfn";
  }

  const confidence =
    relevant.length >= 8 && spread < suggested * 0.12
      ? "high"
      : relevant.length >= 4
        ? "medium"
        : "low";

  const quick = Math.round(suggested * 0.94);
  const hold = Math.round(suggested * 1.06);

  return {
    suggested_price: Math.round(suggested),
    quick_sale_price: quick,
    hold_price: hold,
    confidence,
    method,
  };
}
