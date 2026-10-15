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
  copy_all_text: string;
};

export type ListingSetup = {
  default_platform: PlatformId;
  platforms: Array<{ id: PlatformId; label: string; tagline: string }>;
  shared_sections: ListingFormSection[];
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

function flattenPacket(sections: ListingFormSection[]): string {
  return sections
    .flatMap((s) =>
      s.fields.map((f) => `${f.label}\n${f.value}`.trim()),
    )
    .join("\n\n");
}

function buildSharedSections(
  draft: ListingDraft,
  prediction: PricePrediction,
): ListingFormSection[] {
  const ship = draft.shipping;
  return [
    {
      id: "pricing",
      title: "Pricing",
      description: "Same numbers on every platform — pick the strategy that fits.",
      fields: [
        field("suggested_price", "List at", `$${prediction.suggested_price}`, {
          hint: "Default list price from similar sales",
        }),
        field("quick_sale_price", "Quick sale", `$${prediction.quick_sale_price}`, {
          hint: "Price to move faster",
        }),
        field("hold_price", "Hold firm", `$${prediction.hold_price}`, {
          hint: "If you can wait for the right buyer",
        }),
      ],
    },
    {
      id: "shipping",
      title: "Shipping (packed)",
      description: "Verify weight and dimensions before buying a label.",
      fields: [
        field(
          "package_dims",
          "Dimensions (L × W × H)",
          `${ship.length_in} × ${ship.width_in} × ${ship.height_in} in`,
        ),
        field("package_weight", "Weight", `~${ship.weight_lb} lb`),
        field("package_note", "Carrier note", ship.package_note, { multiline: true }),
      ],
    },
  ];
}

function ebaySections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("ebay", marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit("ebay"));
  const specifics = Object.entries(draft.item_specifics)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return [
    {
      id: "listing_details",
      title: "Item details",
      description: "Matches the eBay create listing flow (title → specifics → description).",
      fields: [
        field("title", "Title", title, {
          max_length: 80,
          hint: "eBay allows up to 80 characters",
        }),
        field("condition", "Condition", cond, {
          hint: "Pick the closest option in eBay’s condition dropdown",
        }),
        field("item_specifics", "Item specifics", specifics, {
          multiline: true,
          hint: "Paste into Brand, Model, Storage, etc.",
        }),
        field("description", "Description", draft.description, {
          multiline: true,
        }),
      ],
    },
    {
      id: "ebay_shipping",
      title: "Shipping preferences",
      fields: [
        field(
          "handling",
          "Handling time",
          "1 business day",
          { hint: "Adjust to your actual ship speed" },
        ),
        field(
          "service",
          "Suggested service",
          "USPS Ground Advantage or comparable (verify for your weight zone)",
        ),
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

  const tags = [
    brand.replace(/\s+/g, ""),
    model.replace(/\s+/g, ""),
    "electronics",
    "gadget",
    "tech",
    "resale",
    "vintage tech",
    "used electronics",
  ]
    .filter(Boolean)
    .slice(0, 13)
    .join(", ");

  return [
    {
      id: "etsy_about",
      title: "About this listing",
      fields: [
        field("title", "Title", title, { max_length: 140 }),
        field("description", "Description", draft.description, { multiline: true }),
        field("tags", "Tags (up to 13)", tags, {
          hint: "Comma-separated; Etsy uses tags for search",
        }),
      ],
    },
    {
      id: "etsy_details",
      title: "Item details",
      fields: [
        field("who_made", "Who made it?", "Someone else", {
          hint: "Resale / not handmade by you",
        }),
        field("when_made", "When was it made?", "2006–2009", {
          hint: "Pick the range that fits; update for your item",
        }),
        field("is_supply", "What is it?", "A finished product"),
        field("condition", "Condition", cond),
        field("materials", "Materials", "Plastic, metal, glass", {
          hint: "Optional — adjust for your device",
        }),
      ],
    },
  ];
}

function stockxSections(
  draft: ListingDraft,
  prediction: PricePrediction,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("stockx", marketplaceConditionValue);

  return [
    {
      id: "stockx_product",
      title: "Product match",
      description:
        "StockX is SKU-first — search their catalog, then confirm size/variant.",
      fields: [
        field("search", "Search catalog", `${draft.item_specifics.Brand ?? ""} ${draft.item_specifics.Model ?? draft.title}`.trim()),
        field("condition", "Condition", cond),
        field("box", "Box / accessories", "Original box if available — update to match photos"),
        field("size", "Size / variant", "Select in StockX UI (storage, color, or model variant)"),
      ],
    },
    {
      id: "stockx_sell",
      title: "Sell / ask",
      fields: [
        field("ask", "Lowest ask (starting point)", `$${prediction.suggested_price}`, {
          hint: "Compare to live asks before listing",
        }),
        field("notes", "Seller notes", draft.condition_marketing_tip, { multiline: true }),
      ],
    },
  ];
}

function facebookSections(
  draft: ListingDraft,
  prediction: PricePrediction,
  marketplaceConditionValue: string,
): ListingFormSection[] {
  const cond = platformConditionLabel("facebook", marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit("facebook"));

  return [
    {
      id: "fb_listing",
      title: "Marketplace listing",
      fields: [
        field("title", "Title", title, { max_length: 100 }),
        field("price", "Price", `$${prediction.suggested_price}`),
        field("condition", "Condition", cond),
        field("description", "Description", draft.description, { multiline: true }),
        field(
          "delivery",
          "Delivery",
          "Shipping or local pickup — set in Facebook after you paste this",
        ),
      ],
    },
  ];
}

function buildPacket(
  platform: PlatformId,
  meta: { label: string; tagline: string },
  platformSections: ListingFormSection[],
  shared: ListingFormSection[],
): PlatformListingPacket {
  const sections = [...shared, ...platformSections];
  return {
    platform,
    label: meta.label,
    tagline: meta.tagline,
    sections,
    copy_all_text: flattenPacket(sections),
  };
}

export function buildListingSetup(
  draft: ListingDraft,
  prediction: PricePrediction,
  marketplaceConditionValue: string,
): ListingSetup {
  const shared_sections = buildSharedSections(draft, prediction);

  const packets = {} as Record<PlatformId, PlatformListingPacket>;
  for (const meta of PLATFORMS) {
    let platformSections: ListingFormSection[];
    switch (meta.id) {
      case "ebay":
        platformSections = ebaySections(draft, marketplaceConditionValue);
        break;
      case "etsy":
        platformSections = etsySections(draft, marketplaceConditionValue);
        break;
      case "stockx":
        platformSections = stockxSections(
          draft,
          prediction,
          marketplaceConditionValue,
        );
        break;
      case "facebook":
        platformSections = facebookSections(
          draft,
          prediction,
          marketplaceConditionValue,
        );
        break;
      default:
        platformSections = [];
    }
    packets[meta.id] = buildPacket(meta.id, meta, platformSections, shared_sections);
  }

  return {
    default_platform: "ebay",
    platforms: PLATFORMS.map((p) => ({
      id: p.id,
      label: p.label,
      tagline: p.tagline,
    })),
    shared_sections,
    packets,
  };
}
