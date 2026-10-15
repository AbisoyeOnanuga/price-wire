import type { ConditionGrade } from "../types.js";

/** Marketplace-facing condition options (broader than pricing buckets). */
export const MARKETPLACE_CONDITIONS: Array<{
  value: string;
  label: string;
  pricing_grade: ConditionGrade;
  marketing_note: string;
}> = [
  {
    value: "new_sealed",
    label: "New — sealed in box",
    pricing_grade: "new",
    marketing_note: "Factory sealed; include photos of shrink wrap and labels.",
  },
  {
    value: "new_open_box",
    label: "New — open box",
    pricing_grade: "new",
    marketing_note: "Unused but packaging opened; show all included accessories.",
  },
  {
    value: "like_new",
    label: "Like new",
    pricing_grade: "like_new",
    marketing_note: "Minimal signs of use; near-new presentation in photos.",
  },
  {
    value: "excellent",
    label: "Excellent",
    pricing_grade: "like_new",
    marketing_note: "Very light wear only; call out any micro-scuffs honestly.",
  },
  {
    value: "very_good",
    label: "Very good",
    pricing_grade: "good",
    marketing_note: "Light cosmetic wear; works perfectly—show angles in photos.",
  },
  {
    value: "good",
    label: "Good",
    pricing_grade: "good",
    marketing_note: "Normal used wear; disclose scratches or scuffs clearly.",
  },
  {
    value: "acceptable",
    label: "Acceptable",
    pricing_grade: "fair",
    marketing_note: "Heavy cosmetic wear but fully functional; price accordingly.",
  },
  {
    value: "fair",
    label: "Fair",
    pricing_grade: "fair",
    marketing_note: "Visible wear; ideal for budget buyers—be explicit in text.",
  },
  {
    value: "poor",
    label: "Poor",
    pricing_grade: "poor",
    marketing_note: "Major cosmetic issues; only buy if function is solid.",
  },
  {
    value: "for_parts",
    label: "For parts / not working",
    pricing_grade: "poor",
    marketing_note: "Sold as-is; list every known fault; no returns implied.",
  },
  {
    value: "manufacturer_refurbished",
    label: "Manufacturer refurbished",
    pricing_grade: "like_new",
    marketing_note: "Include refurb warranty paperwork if you have it.",
  },
  {
    value: "seller_refurbished",
    label: "Seller refurbished",
    pricing_grade: "good",
    marketing_note: "Describe what was replaced or tested; set buyer expectations.",
  },
];

export function needsConditionDetail(value: string): boolean {
  return value !== "new_sealed" && value !== "new_open_box";
}

export function resolveMarketplaceCondition(value?: string) {
  const found =
    MARKETPLACE_CONDITIONS.find((c) => c.value === value) ??
    MARKETPLACE_CONDITIONS.find((c) => c.value === "good")!;
  return found;
}

export function pricingMethodLabel(method: "tabpfn" | "median_fallback"): string {
  if (method === "tabpfn") {
    return "Estimated from similar sales (TabPFN)";
  }
  return "Typical price from similar sales";
}

export function confidenceLabel(level: "low" | "medium" | "high"): string {
  if (level === "high") return "High — lots of close matches";
  if (level === "medium") return "Medium — review similar listings";
  return "Low — few close matches; double-check manually";
}
