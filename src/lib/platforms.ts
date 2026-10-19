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
    id: "etsy",
    label: "Etsy",
    tagline: "Paste title and story-led description. Tags and materials come next in Etsy’s form",
    default: true,
  },
  {
    id: "facebook",
    label: "Facebook Marketplace",
    tagline: "Title, condition, description. Price and pickup stay in Meta’s UI",
  },
  {
    id: "ebay",
    label: "eBay",
    tagline: "Title and description first. Shipping and category specifics after paste",
  },
  {
    id: "stockx",
    label: "StockX",
    tagline: "For resale SKUs with a catalog match. Set price on StockX after you paste copy",
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
