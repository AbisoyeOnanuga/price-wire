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
  copy_essentials_text: string;
};

export type ListingSetup = {
  default_platform: PlatformId;
  platforms: Array<{ id: PlatformId; label: string; tagline: string }>;
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
    title: "Price sheet",
    description:
      "Your price band for this item in this condition. Paste into the marketplace price field—not into your description.",
    fields: [
      field("suggested_price", "Suggested", `$${prediction.suggested_price}`, {
        hint: "Starting ask from similar electronics sales in our sample pool",
      }),
      field("quick_sale_price", "Quick sale", `$${prediction.quick_sale_price}`, {
        hint: "Lower if you need a faster sale",
      }),
      field("hold_price", "Hold firm", `$${prediction.hold_price}`, {
        hint: "Higher if you can wait for the right buyer",
      }),
    ],
  };
}

function optionalSpecifics(draft: ListingDraft): string {
  const entries = Object.entries(draft.item_specifics);
  if (!entries.length) {
    return "Add brand/model in the marketplace form when prompted—category-specific fields vary by site.";
  }
  return entries.map(([k, v]) => `${k}: ${v}`).join("\n");
}

function coreCopySections(
  draft: ListingDraft,
  marketplaceConditionValue: string,
  platform: PlatformId,
): ListingFormSection[] {
  const cond = platformConditionLabel(platform, marketplaceConditionValue);
  const title = truncateTitle(draft.title, platformTitleLimit(platform));

  const sections: ListingFormSection[] = [
    {
      id: "listing_copy",
      title: "What to paste first",
      description:
        "Listings win on a clear title, honest condition story, and a fair price. Tags, materials, and shipping come later in each site’s form.",
      fields: [
        field("title", "Title", title, {
          max_length: platformTitleLimit(platform),
          hint: "Search-friendly: what it is, size, material, or edition—check character limit",
        }),
        field("condition", "Condition", cond, {
          hint: "Pick the closest dropdown option on the marketplace",
        }),
        field("description", "Description", draft.description, {
          multiline: true,
          hint: "Paste as-is; tweak one line if your photos show something different",
        }),
      ],
    },
    {
      id: "optional_specifics",
      title: "Optional listing specifics",
      description:
        "Only if the form asks—skip blanks you do not need. Full category catalogs are out of scope for this prototype.",
      fields: [
        field("item_specifics", "Starter specifics", optionalSpecifics(draft), {
          multiline: true,
          hint: "Edit for your medium (clay, paper size, wood dimensions, etc.)",
        }),
      ],
    },
  ];

  if (platform === "ebay") {
    const ship = draft.shipping;
    sections.push({
      id: "package_optional",
      title: "Package size (if prompted)",
      description:
        "Some eBay flows ask for weight or dimensions. Skip if you use a business shipping policy or flat rate.",
      fields: [
        field(
          "package_dims",
          "Dimensions (L × W × H)",
          `${ship.length_in} × ${ship.width_in} × ${ship.height_in} in`,
          { hint: "Estimate for packed box—measure yours before labels" },
        ),
        field("package_weight", "Weight", `~${ship.weight_lb} lb packed`, {
          hint: "Weigh after packing; carriers bill on actual weight",
        }),
      ],
    });
  }

  return sections;
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
    const titleForCopy = truncateTitle(
      draft.title,
      platformTitleLimit(meta.id),
    );
    const sections = coreCopySections(
      draft,
      marketplaceConditionValue,
      meta.id,
    );
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
