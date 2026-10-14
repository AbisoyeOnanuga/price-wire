import { z } from "zod";

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

export const PriceQuoteSchema = z.object({
  suggested_price: z.number(),
  quick_sale_price: z.number(),
  hold_price: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  comp_count: z.number(),
  method: z.enum(["tabpfn", "median_fallback"]),
  comps: z.array(CompRowSchema),
  specs: ExtractedSpecsSchema,
  listing_brief: z.string(),
});
export type PriceQuote = z.infer<typeof PriceQuoteSchema>;
