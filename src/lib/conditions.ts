import type { ConditionGrade } from "../types.js";

export type MarketplaceCondition = {
  value: string;
  label: string;
  helper_text: string;
  pricing_grade: ConditionGrade;
  marketing_note: string;
  requires_detail: boolean;
};

/** Seller-facing conditions (electronics). Detail required whenever the item is not sealed-new. */
export const MARKETPLACE_CONDITIONS: MarketplaceCondition[] = [
  {
    value: "new",
    label: "New",
    helper_text:
      "Factory sealed, never used. Photos of shrink wrap and labels are enough—no wear description needed.",
    pricing_grade: "new",
    marketing_note: "Lead with sealed packaging and included accessories in photos.",
    requires_detail: false,
  },
  {
    value: "open_box",
    label: "Open box",
    helper_text:
      "Unused but the box was opened. Say what is still inside (cables, manuals) and why the box is open.",
    pricing_grade: "new",
    marketing_note: "Buyers worry about missing parts—list everything in the box.",
    requires_detail: true,
  },
  {
    value: "used",
    label: "Used",
    helper_text:
      "Works as intended with normal wear. Describe scratches, battery health, or issues buyers will zoom in on.",
    pricing_grade: "good",
    marketing_note: "Honest wear notes build trust and reduce returns.",
    requires_detail: true,
  },
  {
    value: "refurbished",
    label: "Refurbished",
    helper_text:
      "Restored by manufacturer or seller. Note who refurbished it, warranty, and what was replaced or tested.",
    pricing_grade: "like_new",
    marketing_note: "Refurb buyers want paperwork and test results.",
    requires_detail: true,
  },
  {
    value: "for_parts",
    label: "For parts / not working",
    helper_text:
      "Sold as-is. List every fault (won’t power on, cracked screen, etc.) so the right buyer finds it.",
    pricing_grade: "poor",
    marketing_note: "Price for parts value; assume no returns.",
    requires_detail: true,
  },
];

const LEGACY_CONDITION_MAP: Record<string, string> = {
  new_sealed: "new",
  new_open_box: "open_box",
  like_new: "used",
  excellent: "used",
  very_good: "used",
  good: "used",
  acceptable: "used",
  fair: "used",
  poor: "used",
  manufacturer_refurbished: "refurbished",
  seller_refurbished: "refurbished",
  for_parts: "for_parts",
};

export function normalizeConditionValue(value?: string): string {
  if (!value) return "used";
  if (MARKETPLACE_CONDITIONS.some((c) => c.value === value)) return value;
  return LEGACY_CONDITION_MAP[value] ?? "used";
}

export function requiresConditionDetail(value?: string): boolean {
  const v = normalizeConditionValue(value);
  return (
    MARKETPLACE_CONDITIONS.find((c) => c.value === v)?.requires_detail ?? true
  );
}

export function resolveMarketplaceCondition(value?: string) {
  const normalized = normalizeConditionValue(value);
  return (
    MARKETPLACE_CONDITIONS.find((c) => c.value === normalized) ??
    MARKETPLACE_CONDITIONS.find((c) => c.value === "used")!
  );
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
