import { normalizeConditionValue } from "./conditions.js";
import { formatProductSummary } from "./format-product.js";
import type { ExtractedSpecs } from "../types.js";

function productLine(rawTitle: string, specs: ExtractedSpecs): string {
  const summary = formatProductSummary(specs).trim();
  if (summary && summary !== "Item" && !/^unknown\b/i.test(summary)) {
    return summary;
  }
  return sanitizeListingTitle(rawTitle);
}

function sanitizeListingTitle(title: string): string {
  return title
    .replace(/\b(for sale|obo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function benefitLine(specs: ExtractedSpecs): string {
  const hay = `${specs.brand} ${specs.model_family}`.toLowerCase();
  if (/arduino|esp32|raspberry|microcontroller|uno|nano/i.test(hay)) {
    return "Great for makers, students, and IoT projects—ready to drop into your next build.";
  }
  if (/iphone|galaxy|pixel|phone/i.test(hay)) {
    return "A solid phone for everyday use when you want the model without retail pricing.";
  }
  if (/headphone|airpods|buds|xm\d/i.test(hay)) {
    return "Comfortable daily listening with the sound profile this line is known for.";
  }
  if (/playstation|xbox|switch|steam deck/i.test(hay)) {
    return "Pick up and play—ideal if you have been waiting for the right price on this console.";
  }
  if (/macbook|laptop|thinkpad/i.test(hay)) {
    return "Portable power for school, work, or creative projects.";
  }
  return "Honest listing with clear photos so you know exactly what you are getting.";
}

/**
 * Paste-ready marketplace description (not a how-to guide).
 */
export function buildSellDescription(
  rawTitle: string,
  specs: ExtractedSpecs,
  marketplaceConditionValue: string,
  conditionDetail?: string,
): string {
  const cond = normalizeConditionValue(marketplaceConditionValue);
  const name = productLine(rawTitle, specs);
  const detail = conditionDetail?.trim();
  const hook = benefitLine(specs);

  switch (cond) {
    case "new":
      return [
        `${name} — brand new, never used.`,
        hook,
        detail ||
          "Factory-fresh unit; photos show the sealed packaging and everything included from the manufacturer.",
        "Ships fast with careful packaging. Message me if you have questions before buying.",
      ].join("\n\n");

    case "open_box":
      return [
        `${name} — open box, unused.`,
        hook,
        detail ||
          "Box was opened but the item was not used. Photos show every accessory still in the package.",
        "A smart buy if you want unused hardware without full retail.",
      ].join("\n\n");

    case "refurbished":
      return [
        `${name} — refurbished and tested.`,
        hook,
        detail ||
          "Professionally restored, cleaned, and checked before listing. See photos for cosmetic grade.",
        "Backed by clear photos—ask about warranty or testing notes if you need them.",
      ].join("\n\n");

    case "for_parts":
      return [
        `${name} — sold for parts or repair (please read).`,
        detail ||
          "Sold as-is; see photos for faults. Not listed as a fully working unit.",
        "Ideal for repair shops, tinkerers, and DIY projects that need this board or chassis.",
        "No returns on as-is items—price reflects parts value.",
      ].join("\n\n");

    case "used":
    default:
      return [
        `${name} — used, in working order.`,
        hook,
        detail ||
          "Normal wear from use; fully functional. Photos are of the actual item you will receive.",
        "Good value for buyers who want this model without paying new prices.",
      ].join("\n\n");
  }
}
