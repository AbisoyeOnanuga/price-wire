import type { CompRow, ExtractedSpecs } from "../types.js";
import type { PricePrediction } from "./tabpfn-price.js";
import { resolveMarketplaceCondition } from "../lib/conditions.js";
import { formatProductSummary } from "../lib/format-product.js";
import { buildSellDescription } from "../lib/sell-copy.js";

export type ShippingEstimate = {
  length_in: number;
  width_in: number;
  height_in: number;
  weight_lb: number;
};

export type ListingDraft = {
  title: string;
  description: string;
  item_specifics: Record<string, string>;
  shipping: ShippingEstimate;
  condition_label: string;
  condition_marketing_tip: string;
};

const SHIPPING_BY_MODEL: Array<{ match: RegExp; ship: ShippingEstimate }> = [
  {
    match: /wh-1000xm5|airpods|buds|mx master/i,
    ship: { length_in: 10, width_in: 8, height_in: 4, weight_lb: 1.5 },
  },
  {
    match: /iphone|galaxy s|pixel/i,
    ship: { length_in: 8, width_in: 6, height_in: 3, weight_lb: 1 },
  },
  {
    match: /playstation|xbox|switch/i,
    ship: { length_in: 18, width_in: 14, height_in: 8, weight_lb: 10 },
  },
  {
    match: /macbook|laptop/i,
    ship: { length_in: 16, width_in: 12, height_in: 4, weight_lb: 6 },
  },
  {
    match: /ipad|tablet/i,
    ship: { length_in: 12, width_in: 10, height_in: 3, weight_lb: 2.5 },
  },
];

function defaultShipping(): ShippingEstimate {
  return { length_in: 12, width_in: 10, height_in: 6, weight_lb: 3 };
}

export function estimateShipping(
  title: string,
  specs: ExtractedSpecs,
): ShippingEstimate {
  const hay = `${title} ${specs.model_family} ${specs.brand}`;
  for (const row of SHIPPING_BY_MODEL) {
    if (row.match.test(hay)) return { ...row.ship };
  }
  return defaultShipping();
}

function buildOptimizedTitle(rawTitle: string, specs: ExtractedSpecs): string {
  const summary = formatProductSummary(specs);
  if (summary && summary !== "Item" && summary.length >= 8) {
    const withStorage =
      specs.storage_gb && !summary.toLowerCase().includes("gb")
        ? `${summary} ${specs.storage_gb}GB`
        : summary;
    const withUnlock =
      specs.carrier_lock === "unlocked" &&
      !withStorage.toLowerCase().includes("unlock")
        ? `${withStorage} Unlocked`
        : withStorage;
    return withUnlock.trim();
  }
  return rawTitle.trim().slice(0, 80);
}

export function buildListingDraft(
  rawTitle: string,
  specs: ExtractedSpecs,
  _prediction: PricePrediction,
  _comps: CompRow[],
  marketplaceConditionValue: string,
  conditionDetail?: string,
): ListingDraft {
  const cond = resolveMarketplaceCondition(marketplaceConditionValue);
  const shipping = estimateShipping(rawTitle, specs);
  const title = buildOptimizedTitle(rawTitle, specs);

  const brandLabel =
    specs.brand !== "Unknown" ? specs.brand : formatProductSummary(specs).split(/\s+/)[0] ?? "See title";

  const specifics: Record<string, string> = {
    Brand: brandLabel,
    Model: specs.model_family,
    ...(specs.storage_gb ? { Storage: `${specs.storage_gb}GB` } : {}),
    ...(specs.carrier_lock === "unlocked" ? { "Carrier status": "Unlocked" } : {}),
    ...(specs.includes_charger
      ? { "Includes charger": "Yes (confirm in photos)" }
      : {}),
  };

  const description = buildSellDescription(
    rawTitle,
    specs,
    marketplaceConditionValue,
    conditionDetail,
  );

  return {
    title,
    description,
    item_specifics: specifics,
    shipping,
    condition_label: cond.label,
    condition_marketing_tip: cond.marketing_note,
  };
}
