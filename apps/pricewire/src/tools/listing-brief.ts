import { confidenceLabel, pricingMethodLabel } from "../lib/conditions.js";
import type { CompRow, ExtractedSpecs } from "../types.js";
import type { PricePrediction } from "./tabpfn-price.js";

export function buildListingBrief(
  title: string,
  specs: ExtractedSpecs,
  prediction: PricePrediction,
  comps: CompRow[],
): string {
  const platforms = [...new Set(comps.map((c) => c.platform))].join(", ");
  const method = pricingMethodLabel(prediction.method);
  const conf = confidenceLabel(prediction.confidence);

  return [
    `Suggested list price: $${prediction.suggested_price} (quick sale $${prediction.quick_sale_price}, hold $${prediction.hold_price}).`,
    `Based on ${comps.length} similar sale${comps.length === 1 ? "" : "s"}${platforms ? ` on ${platforms}` : ""}. ${method}.`,
    `${specs.brand} ${specs.model_family}${specs.storage_gb ? `, ${specs.storage_gb}GB` : ""}.`,
    `Confidence: ${conf}.`,
  ].join(" ");
}
