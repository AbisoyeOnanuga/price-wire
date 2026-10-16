import type { ExtractedSpecs } from "../types.js";

/** One-line product label without duplicating brand in model_family. */
export function formatProductSummary(specs: ExtractedSpecs): string {
  const brand = specs.brand.trim();
  const model = specs.model_family.trim();
  if (brand === "Unknown" && model) return model;
  if (!model || brand === "Unknown") {
    return model || brand || "Item";
  }
  const modelLower = model.toLowerCase();
  const brandLower = brand.toLowerCase();
  let name =
    modelLower.startsWith(brandLower) || modelLower.includes(brandLower)
      ? model
      : `${brand} ${model}`;
  if (specs.storage_gb) {
    name += `, ${specs.storage_gb}GB`;
  }
  return name;
}
