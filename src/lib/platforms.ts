import { MARKETPLACE_CONDITIONS, normalizeConditionValue } from "./conditions.js";

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
    tagline: "Title and description first—eBay handles shipping in its own flow",
    default: true,
  },
  {
    id: "etsy",
    label: "Etsy",
    tagline: "Title and description; add Etsy-only fields only if you sell there",
  },
  {
    id: "stockx",
    label: "StockX",
    tagline: "Match the catalog, then set ask price in StockX",
  },
  {
    id: "facebook",
    label: "Facebook Marketplace",
    tagline: "Title, condition, description—price and delivery in Meta’s UI",
  },
];

const EBAY_CONDITION: Record<string, string> = {
  new: "New",
  open_box: "Open box",
  used: "Used",
  refurbished: "Manufacturer refurbished",
  for_parts: "For parts or not working",
};

const ETSY_CONDITION: Record<string, string> = {
  new: "New",
  open_box: "New",
  used: "Good",
  refurbished: "Like new",
  for_parts: "Poor",
};

const STOCKX_CONDITION: Record<string, string> = {
  new: "New",
  open_box: "New (open box)",
  used: "Used",
  refurbished: "New",
  for_parts: "Used — defects",
};

const FACEBOOK_CONDITION: Record<string, string> = {
  new: "New",
  open_box: "New",
  used: "Used — Good",
  refurbished: "Used — Like new",
  for_parts: "Used — Poor",
};

export function platformConditionLabel(
  platform: PlatformId,
  marketplaceConditionValue: string,
): string {
  const key = normalizeConditionValue(marketplaceConditionValue);
  const fallback =
    MARKETPLACE_CONDITIONS.find((c) => c.value === key)?.label ?? "Used";
  const maps: Record<PlatformId, Record<string, string>> = {
    ebay: EBAY_CONDITION,
    etsy: ETSY_CONDITION,
    stockx: STOCKX_CONDITION,
    facebook: FACEBOOK_CONDITION,
  };
  return maps[platform][key] ?? fallback;
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
