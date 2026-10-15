/** Keep in sync with src/lib/marketplace-present.ts */

const MARKETPLACE_HOME: Record<string, string> = {
  ebay: "https://www.ebay.com",
  amazon: "https://www.amazon.com",
  etsy: "https://www.etsy.com",
  stockx: "https://stockx.com",
  facebook: "https://www.facebook.com/marketplace",
};

export function normalizeMarketplaceName(platform: string): string {
  const raw = platform.trim();
  if (!raw) return "Marketplace";
  const lower = raw.toLowerCase();
  if (lower.includes("ebay")) return "eBay";
  if (lower.includes("amazon")) return "Amazon";
  if (lower.includes("etsy")) return "Etsy";
  if (lower.includes("stockx")) return "StockX";
  if (lower.includes("facebook") || lower.includes("marketplace"))
    return "Facebook Marketplace";
  if (lower.includes("walmart")) return "Walmart";
  if (lower.includes("best buy") || lower.includes("bestbuy"))
    return "Best Buy";
  return raw.length > 28 ? `${raw.slice(0, 25)}…` : raw;
}

export function resolveListingUrl(
  platform: string,
  listingUrl?: string | null,
): string | null {
  if (listingUrl && /^https?:\/\//i.test(listingUrl)) return listingUrl;
  const key = platform.toLowerCase().replace(/\s+/g, "");
  for (const [name, href] of Object.entries(MARKETPLACE_HOME)) {
    if (key.includes(name)) return href;
  }
  return null;
}
