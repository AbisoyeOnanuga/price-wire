import type { ExtractedSpecs } from "../types.js";

const BRAND_ALIASES: Array<{ re: RegExp; brand: string }> = [
  { re: /\barduino\b/i, brand: "Arduino" },
  { re: /\braspberry\s*pi\b/i, brand: "Raspberry Pi" },
  { re: /\besp32\b/i, brand: "ESP32" },
  { re: /\badafruit\b/i, brand: "Adafruit" },
  { re: /\bsparkfun\b/i, brand: "SparkFun" },
  { re: /\bnvidia\b/i, brand: "NVIDIA" },
  { re: /\bintel\b/i, brand: "Intel" },
];

const BRAND_TOKENS = [
  "Apple",
  "Sony",
  "Samsung",
  "Nintendo",
  "Microsoft",
  "Canon",
  "Meta",
  "DJI",
  "Bose",
  "Logitech",
  "Valve",
  "GoPro",
  "ASUS",
  "Google",
  "Lenovo",
  "Dell",
  "HP",
  "Arduino",
  "Raspberry Pi",
];

const NOISE_WORDS =
  /\b(for sale|brand new|like new|open box|sealed|bnib|nib|obo|obo\.|read desc|please read)\b/gi;

export function sanitizeTitleForSearch(title: string): string {
  return title
    .replace(NOISE_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);
}

export function inferBrandFromTitle(title: string): string {
  const lower = title.toLowerCase();
  for (const { re, brand } of BRAND_ALIASES) {
    if (re.test(title)) return brand;
  }
  for (const b of BRAND_TOKENS) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return "Unknown";
}

/** Product line from title when models are not in the SKU table. */
export function inferModelFromTitle(title: string, brand: string): string {
  let rest = sanitizeTitleForSearch(title);
  if (brand !== "Unknown") {
    rest = rest.replace(new RegExp(brand.replace(/\s+/g, "\\s+"), "i"), "");
  }
  rest = rest.replace(/\d+\s*gb/gi, "").trim();
  const tokens = rest.split(/\s+/).filter(Boolean);
  if (tokens.length) return tokens.slice(0, 6).join(" ");
  return sanitizeTitleForSearch(title).slice(0, 60);
}

export function buildMarketplaceSearchQuery(
  rawTitle: string,
  specs: Pick<ExtractedSpecs, "brand" | "model_family" | "search_query">,
): string {
  const cleaned = sanitizeTitleForSearch(rawTitle);
  const fromSpecs = specs.search_query?.trim() ?? "";
  if (fromSpecs && !/\bunknown\b/i.test(fromSpecs)) return fromSpecs;
  if (cleaned.length >= 8) return cleaned;
  const parts = [specs.brand, specs.model_family]
    .filter((p) => p && p !== "Unknown")
    .join(" ")
    .trim();
  return parts || cleaned || rawTitle.trim().slice(0, 80);
}

export function enrichSpecsFromTitle(
  rawTitle: string,
  specs: ExtractedSpecs,
): ExtractedSpecs {
  let brand = specs.brand?.trim() || "Unknown";
  let model_family = specs.model_family?.trim() || "";

  if (brand === "Unknown") {
    brand = inferBrandFromTitle(rawTitle);
  }
  if (!model_family || model_family.length < 2) {
    model_family = inferModelFromTitle(rawTitle, brand);
  }
  if (brand === "Unknown" && model_family) {
    const first = model_family.split(/\s+/)[0];
    if (first && /^[A-Z]/.test(first) && first.length > 2) {
      brand = first;
    }
  }

  const search_query = buildMarketplaceSearchQuery(rawTitle, {
    ...specs,
    brand,
    model_family,
  });

  return {
    ...specs,
    brand,
    model_family,
    search_query,
  };
}
