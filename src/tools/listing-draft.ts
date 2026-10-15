import type { CompRow, ExtractedSpecs } from "../types.js";
import type { PricePrediction } from "./tabpfn-price.js";
import { resolveMarketplaceCondition } from "../lib/conditions.js";

export type ShippingEstimate = {
  length_in: number;
  width_in: number;
  height_in: number;
  weight_lb: number;
  package_note: string;
};

export type ListingDraft = {
  title: string;
  description: string;
  item_specifics: Record<string, string>;
  shipping: ShippingEstimate;
  condition_label: string;
  condition_marketing_tip: string;
};

/** Conservative package defaults by product family — always verify before buying labels. */
const SHIPPING_BY_MODEL: Array<{ match: RegExp; ship: ShippingEstimate }> = [
  {
    match: /wh-1000xm5|airpods|buds|mx master/i,
    ship: {
      length_in: 10,
      width_in: 8,
      height_in: 4,
      weight_lb: 1.5,
      package_note:
        "Small accessory box. Weigh after packing; carriers bill by actual weight.",
    },
  },
  {
    match: /iphone|galaxy s|pixel/i,
    ship: {
      length_in: 8,
      width_in: 6,
      height_in: 3,
      weight_lb: 1,
      package_note:
        "Phone-sized mailer. Include bubble wrap; verify weight with case removed.",
    },
  },
  {
    match: /playstation|xbox|switch/i,
    ship: {
      length_in: 18,
      width_in: 14,
      height_in: 8,
      weight_lb: 10,
      package_note:
        "Console box is bulky. Measure your actual carton—oversize fees apply on some carriers.",
    },
  },
  {
    match: /macbook|laptop/i,
    ship: {
      length_in: 16,
      width_in: 12,
      height_in: 4,
      weight_lb: 6,
      package_note:
        "Use rigid laptop mailer. Weight varies with charger and box; weigh packed shipment.",
    },
  },
  {
    match: /ipad|tablet/i,
    ship: {
      length_in: 12,
      width_in: 10,
      height_in: 3,
      weight_lb: 2.5,
      package_note: "Tablet mailer; add padding for corners.",
    },
  },
];

function defaultShipping(): ShippingEstimate {
  return {
    length_in: 12,
    width_in: 10,
    height_in: 6,
    weight_lb: 3,
    package_note:
      "Generic electronics parcel. Measure and weigh your packed box before purchasing a label.",
  };
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

function buildOptimizedTitle(
  rawTitle: string,
  specs: ExtractedSpecs,
  conditionLabel: string,
): string {
  const parts = [
    specs.brand !== "Unknown" ? specs.brand : "",
    specs.model_family,
    specs.storage_gb ? `${specs.storage_gb}GB` : "",
    specs.carrier_lock === "unlocked" ? "Unlocked" : "",
    conditionLabel,
  ].filter(Boolean);
  const core = parts.join(" ").trim();
  return core.length > 20 ? core : rawTitle.trim();
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
  const title = buildOptimizedTitle(rawTitle, specs, cond.label);

  const storageLine = specs.storage_gb
    ? `Storage: ${specs.storage_gb}GB`
    : null;
  const lockLine =
    specs.carrier_lock === "unlocked"
      ? "Network: Unlocked"
      : specs.carrier_lock === "wifi_only"
        ? "Connectivity: Wi‑Fi"
        : null;

  const specifics: Record<string, string> = {
    Brand: specs.brand,
    Model: specs.model_family,
    Condition: cond.label,
    ...(storageLine ? { Storage: `${specs.storage_gb}GB` } : {}),
    ...(specs.carrier_lock === "unlocked" ? { "Carrier status": "Unlocked" } : {}),
    "Includes charger":
      specs.includes_charger ? "Yes (per listing)" : "Not stated—update if included",
  };

  const description = [
    `${title}`,
    "",
    "Item description",
    `Selling my ${specs.brand} ${specs.model_family} in ${cond.label.toLowerCase()} condition.`,
    cond.marketing_note,
    "",
    "What's included",
    specs.includes_charger
      ? "Device and charging accessories as shown in photos (update this list to match what you ship)."
      : "Please see photos for exactly what is included.",
    "",
    "Condition details",
    conditionDetail?.trim()
      ? conditionDetail.trim()
      : "Photos show actual item. Message me with questions before buying.",
    "",
    "Shipping",
    `Packed size about ${shipping.length_in}×${shipping.width_in}×${shipping.height_in} in, ~${shipping.weight_lb} lb.`,
    shipping.package_note,
    "",
    storageLine,
    lockLine,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title,
    description,
    item_specifics: specifics,
    shipping,
    condition_label: cond.label,
    condition_marketing_tip: cond.marketing_note,
  };
}
