import { z } from "zod";
import { PLATFORM_IDS } from "./lib/platforms.js";

export const ConditionGrade = z.enum([
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
]);
export type ConditionGrade = z.infer<typeof ConditionGrade>;

export const ExtractedSpecsSchema = z.object({
  brand: z.string(),
  model_family: z.string(),
  storage_gb: z.number().nullable(),
  carrier_lock: z.enum(["unlocked", "locked", "wifi_only", "na"]),
  condition_grade: ConditionGrade,
  includes_charger: z.boolean(),
  search_query: z.string(),
});
export type ExtractedSpecs = z.infer<typeof ExtractedSpecsSchema>;

export const CompRowSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  brand: z.string(),
  model_family: z.string(),
  storage_gb: z.number().nullable(),
  carrier_lock: z.string(),
  condition_grade: ConditionGrade,
  includes_charger: z.boolean(),
  platform: z.string(),
  listed_price: z.number().nullable(),
  sold_price: z.number(),
  days_on_market: z.number().nullable(),
  source: z.enum(["seed", "tiger", "serpapi"]),
});
export type CompRow = z.infer<typeof CompRowSchema>;

export const ListingDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  item_specifics: z.record(z.string()),
  shipping: z.object({
    length_in: z.number(),
    width_in: z.number(),
    height_in: z.number(),
    weight_lb: z.number(),
    package_note: z.string(),
  }),
  condition_label: z.string(),
  condition_marketing_tip: z.string(),
});

export const ListingFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  hint: z.string().optional(),
  max_length: z.number().optional(),
  multiline: z.boolean().optional(),
});

export const ListingFormSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(ListingFormFieldSchema),
});

export const PlatformListingPacketSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  label: z.string(),
  tagline: z.string(),
  sections: z.array(ListingFormSectionSchema),
  copy_all_text: z.string(),
});

export const ListingSetupSchema = z.object({
  default_platform: z.enum(PLATFORM_IDS),
  platforms: z.array(
    z.object({
      id: z.enum(PLATFORM_IDS),
      label: z.string(),
      tagline: z.string(),
    }),
  ),
  shared_sections: z.array(ListingFormSectionSchema),
  packets: z.record(z.enum(PLATFORM_IDS), PlatformListingPacketSchema),
});

export const PriceQuoteSchema = z.object({
  suggested_price: z.number(),
  quick_sale_price: z.number(),
  hold_price: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  confidence_label: z.string(),
  comp_count: z.number(),
  method: z.enum(["tabpfn", "median_fallback"]),
  method_label: z.string(),
  comps: z.array(CompRowSchema),
  specs: ExtractedSpecsSchema,
  listing_brief: z.string(),
  listing_draft: ListingDraftSchema,
  listing_setup: ListingSetupSchema,
});
export type PriceQuote = z.infer<typeof PriceQuoteSchema>;
