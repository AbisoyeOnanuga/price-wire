import type { ListingDraft } from "./listing-draft.js";
import type { PricePrediction } from "./tabpfn-price.js";
import {
  PLATFORMS,
  type PlatformId,
  platformConditionLabel,
  platformTitleLimit,
  truncateTitle,
} from "../lib/platforms.js";

export type ListingFormField = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  max_length?: number;
  multiline?: boolean;
};

export type ListingFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: ListingFormField[];
};

export type PlatformListingPacket = {
  platform: PlatformId;
  label: string;
  tagline: string;
  sections: ListingFormSection[];
  /** Title + description only — not a full marketplace form. */
  copy_essentials_text: string;
};

export type ListingSetup = {
  default_platform: PlatformId;
  platforms: Array<{ id: PlatformId; label: string; tagline: string }>;
  /** Price band for the site's price field (never mixed into description). */
  price_fields: ListingFormSection;
  packets: Record<PlatformId, PlatformListingPacket>;
};

function field(
  id: string,
  label: string,
  value: string,
  opts?: { hint?: string; max_length?: number; multiline?: boolean },
): ListingFormField {
  return {
    id,
    label,
    value,
    hint: opts?.hint,
    max_length: opts?.max_length,
    multiline: opts?.multiline,
  };
}

function essentialsText(title: string, description: string): string {
  return `Title\n${title}\n\nDescription\n${description}`.trim();
}

function buildPriceFields(prediction: PricePrediction): ListingFormSection {
  return {
    id: "pricing",
    title: "List price",
    description:
      "Enter these in the marketplace price field. Pricing research stays above; do not paste into the item description unless you are making a value case.",
    fields: [
      field("suggested_price", "Suggested", `$${prediction.suggested_price}`, {
        hint: "Default ask from similar sales",
      }),
      field("quick_sale_price", "Quick sale", `$${prediction.quick_sale_price}`, {
        hint: "If you need it gone faster",
      }),
      field("hold_price", "Hold firm", `$${prediction.hold_price}`, {
        hint: "If you can wait for a better offer",
      }),
    ],
  };
}

function coreSpecifics(draft: ListingDraft): string {
  return Object.entries(draft.item_specifics)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function ebaySections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("ebay", marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit("ebay"));
  const ship = draft.shipping;

  return [
    {
      id: "listing_copy",
      title: "Listing copy (slow fields first)",
      description:
        "eBay handles shipping services in its own UI. Focus on title, condition, item specifics, and description.",
      fields: [
        field("title", "Title", title, {
          max_length: 80,
          hint: "Priority #1 — search-friendly, under 80 characters",
        }),
        field("condition", "Condition", cond, {
          hint: "Match eBay’s condition dropdown",
        }),
        field("item_specifics", "Item specifics (core)", coreSpecifics(draft), {
          multiline: true,
          hint: "Brand, model, storage — skip blanks you do not need",
        }),
        field("description", "Description", draft.description, {
          multiline: true,
          hint: "Condition-driven copy; add photos, policies, and your shop voice",
        }),
      ],
    },
    {
      id: "package_optional",
      title: "Package size (only if prompted)",
      description:
        "Some flows ask for packed weight or dimensions for calculated shipping. Skip if eBay uses your business policy or flat rate.",
      fields: [
        field(
          "package_dims",
          "Dimensions (L × W × H)",
          `${ship.length_in} × ${ship.width_in} × ${ship.height_in} in`,
        ),
        field("package_weight", "Weight", `~${ship.weight_lb} lb packed`),
      ],
    },
  ];
}

function etsySections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("etsy", marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit("etsy"));
  const brand = draft.item_specifics.Brand ?? "Electronics";
  const model = draft.item_specifics.Model ?? "";

  const tags = [brand, model, "electronics", "used electronics", "tech resale"]
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 13)
    .join(", ");

  return [
    {
      id: "listing_copy",
      title: "Listing copy",
      fields: [
        field("title", "Title", title, { max_length: 140 }),
        field("description", "Description", draft.description, { multiline: true }),
        field("tags", "Tags (optional)", tags, {
          hint: "Up to 13 — only if you sell on Etsy",
        }),
      ],
    },
    {
      id: "etsy_details",
      title: "Extra Etsy fields (if required)",
      fields: [
        field("condition", "Condition", cond),
        field("who_made", "Who made it?", "Someone else"),
      ],
    },
  ];
}

function stockxSections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("stockx", marketplaceConditionValue);

  return [
    {
      id: "stockx_match",
      title: "Catalog match",
      description: "StockX is SKU-first — search, then confirm variant in their UI.",
      fields: [
        field(
          "search",
          "Search",
          `${draft.item_specifics.Brand ?? ""} ${draft.item_specifics.Model ?? draft.title}`.trim(),
        ),
        field("condition", "Condition", cond),
      ],
    },
  ];
}

function facebookSections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("facebook", marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit("facebook"));

  return [
    {
      id: "listing_copy",
      title: "Listing copy",
      description: "Delivery and meetup are set in Facebook’s UI, not here.",
      fields: [
        field("title", "Title", title, { max_length: 100 }),
        field("condition", "Condition", cond),
        field("description", "Description", draft.description, { multiline: true }),
      ],
    },
  ];
}

function buildPacket(
  platform: PlatformId,
  meta: { label: string; tagline: string },
  sections: ListingFormSection[],
  title: string,
  description: string,
): PlatformListingPacket {
  return {
    platform,
    label: meta.label,
    tagline: meta.tagline,
    sections,
    copy_essentials_text: essentialsText(title, description),
  };
}

export function buildListingSetup(
  draft: ListingDraft,
  prediction: PricePrediction,
  marketplaceConditionValue: string,
): ListingSetup {
  const price_fields = buildPriceFields(prediction);
  const packets = {} as Record<PlatformId, PlatformListingPacket>;

  for (const meta of PLATFORMS) {
    let sections: ListingFormSection[];
    let titleForCopy = draft.title;
    switch (meta.id) {
      case "ebay":
        titleForCopy = truncateTitle(draft.title, platformTitleLimit("ebay"));
        sections = ebaySections(draft, marketplaceConditionValue);
        break;
      case "etsy":
        titleForCopy = truncateTitle(draft.title, platformTitleLimit("etsy"));
        sections = etsySections(draft, marketplaceConditionValue);
        break;
      case "stockx":
        sections = stockxSections(draft, marketplaceConditionValue);
        break;
      case "facebook":
        titleForCopy = truncateTitle(draft.title, platformTitleLimit("facebook"));
        sections = facebookSections(draft, marketplaceConditionValue);
        break;
      default:
        sections = [];
    }
    packets[meta.id] = buildPacket(
      meta.id,
      meta,
      sections,
      titleForCopy,
      draft.description,
    );
  }

  return {
    default_platform: "ebay",
    platforms: PLATFORMS.map((p) => ({
      id: p.id,
      label: p.label,
      tagline: p.tagline,
    })),
    price_fields,
    packets,
  };
}
