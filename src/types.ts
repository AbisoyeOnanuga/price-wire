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
  listing_url: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
});
export type CompRow = z.infer<typeof CompRowSchema>;

export const PlatformIdSchema = z.enum(PLATFORM_IDS);

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
  platform: PlatformIdSchema,
  label: z.string(),
  tagline: z.string(),
  sections: z.array(ListingFormSectionSchema),
  copy_essentials_text: z.string(),
});

export const ListingSetupSchema = z.object({
  default_platform: PlatformIdSchema,
  platforms: z.array(
    z.object({
      id: PlatformIdSchema,
      label: z.string(),
      tagline: z.string(),
    }),
  ),
  price_fields: ListingFormSectionSchema,
  packets: z.record(PlatformIdSchema, PlatformListingPacketSchema),
});

export const ListingDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  item_specifics: z.record(z.string()),
  shipping: z.object({
    length_in: z.number(),
    width_in: z.number(),
    height_in: z.number(),
    weight_lb: z.number(),
  }),
  condition_label: z.string(),
  condition_marketing_tip: z.string(),
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
export type ListingSetup = z.infer<typeof ListingSetupSchema>;
