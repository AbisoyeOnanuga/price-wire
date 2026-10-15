import { MARKETPLACE_CONDITIONS } from "./conditions.js";

export const PLATFORM_IDS = ["ebay", "etsy", "stockx", "facebook"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export type PlatformMeta = {
  id: PlatformId;
  label: string;
  tagline: string;
  default?: boolean;
};

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "ebay",
    label: "eBay",
    tagline: "Title, item specifics, condition, and shipping for the listing form",
    default: true,
  },
  {
    id: "etsy",
    label: "Etsy",
    tagline: "Title, tags, materials, and handmade/vintage fields",
  },
  {
    id: "stockx",
    label: "StockX",
    tagline: "Sell flow: product match, size/box, and ask price",
  },
  {
    id: "facebook",
    label: "Facebook Marketplace",
    tagline: "Short title, condition, price, and local pickup notes",
  },
];

/** Map internal condition value → marketplace label shown on that platform's form. */
const EBAY_CONDITION: Record<string, string> = {
  new_sealed: "New",
  new_open_box: "Open box",
  like_new: "Used — Like New",
  excellent: "Used — Excellent",
  very_good: "Used — Very Good",
  good: "Used — Good",
  acceptable: "Used — Acceptable",
  fair: "Used — Fair",
  poor: "Used — Poor",
  for_parts: "For parts or not working",
  manufacturer_refurbished: "Manufacturer refurbished",
  seller_refurbished: "Seller refurbished",
};

const ETSY_CONDITION: Record<string, string> = {
  new_sealed: "New",
  new_open_box: "New",
  like_new: "Like new",
  excellent: "Like new",
  very_good: "Good",
  good: "Good",
  acceptable: "Fair",
  fair: "Fair",
  poor: "Poor",
  for_parts: "Poor",
  manufacturer_refurbished: "Like new",
  seller_refurbished: "Good",
};

const STOCKX_CONDITION: Record<string, string> = {
  new_sealed: "New",
  new_open_box: "New (open box)",
  like_new: "Used",
  excellent: "Used",
  very_good: "Used",
  good: "Used",
  acceptable: "Used",
  fair: "Used",
  poor: "Used",
  for_parts: "Used — defects",
  manufacturer_refurbished: "New",
  seller_refurbished: "Used",
};

const FACEBOOK_CONDITION: Record<string, string> = {
  new_sealed: "New",
  new_open_box: "New",
  like_new: "Used — Like new",
  excellent: "Used — Like new",
  very_good: "Used — Good",
  good: "Used — Good",
  acceptable: "Used — Fair",
  fair: "Used — Fair",
  poor: "Used — Poor",
  for_parts: "Used — Poor",
  manufacturer_refurbished: "Used — Like new",
  seller_refurbished: "Used — Good",
};

export function platformConditionLabel(
  platform: PlatformId,
  marketplaceConditionValue: string,
): string {
  const fallback =
    MARKETPLACE_CONDITIONS.find((c) => c.value === marketplaceConditionValue)
      ?.label ?? "Good";
  const maps: Record<PlatformId, Record<string, string>> = {
    ebay: EBAY_CONDITION,
    etsy: ETSY_CONDITION,
    stockx: STOCKX_CONDITION,
    facebook: FACEBOOK_CONDITION,
  };
  return maps[platform][marketplaceConditionValue] ?? fallback;
}

export function platformTitleLimit(platform: PlatformId): number | undefined {
  if (platform === "ebay") return 80;
  if (platform === "etsy") return 140;
  if (platform === "facebook") return 100;
  return undefined;
}

export function truncateTitle(title: string, max?: number): string {
  if (!max || title.length <= max) return title;
  return `${title.slice(0, max - 1).trimEnd()}…`;
}
