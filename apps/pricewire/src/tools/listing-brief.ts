import type { CompRow, ExtractedSpecs } from "../types.js";
import type { PricePrediction } from "./tabpfn-price.js";

export function buildListingBrief(
  title: string,
  specs: ExtractedSpecs,
  prediction: PricePrediction,
  comps: CompRow[],
): string {
  const platforms = [...new Set(comps.map((c) => c.platform))].join(", ");
  const methodLabel =
    prediction.method === "tabpfn"
      ? "TabPFN regression on comp features"
      : "median of pooled comps";

  return [
    `List "${title.trim()}" around $${prediction.suggested_price} (quick sale $${prediction.quick_sale_price}, hold $${prediction.hold_price}).`,
    `Based on ${comps.length} comps (${platforms || "seed data"}) using ${methodLabel}.`,
    `Highlight: ${specs.brand} ${specs.model_family}${specs.storage_gb ? ` ${specs.storage_gb}GB` : ""}, ${specs.condition_grade.replace("_", " ")}.`,
    `Confidence: ${prediction.confidence}. Lead with clear photos and model-specific keywords resellers search for.`,
  ].join(" ");
}
