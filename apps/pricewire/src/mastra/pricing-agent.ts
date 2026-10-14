import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchComps, upsertSerpComps } from "../tools/comp-store.js";
import { extractSpecs } from "../tools/extract-specs.js";
import { fetchSerpComps } from "../tools/serp-comps.js";
import { buildListingBrief } from "../tools/listing-brief.js";
import { predictPrice } from "../tools/tabpfn-price.js";
import type { PriceQuote } from "../types.js";
import { PriceQuoteSchema } from "../types.js";

export const extractSpecsTool = createTool({
  id: "extractSpecs",
  description: "Normalize a messy electronics listing title into structured specs.",
  inputSchema: z.object({
    title: z.string(),
    condition_hint: z.string().optional(),
  }),
  execute: async ({ context }) => {
    return extractSpecs(context.title, context.condition_hint);
  },
});

export const searchCompsTool = createTool({
  id: "searchComps",
  description: "Search pooled comp history in Tiger/pgvector or seed data.",
  inputSchema: z.object({
    specs: z.any(),
    limit: z.number().optional(),
  }),
  execute: async ({ context }) => {
    return searchComps(context.specs, context.limit ?? 12);
  },
});

export const serpCompsTool = createTool({
  id: "fetchSerpComps",
  description: "Fetch live eBay snippets via SerpApi when local comps are thin.",
  inputSchema: z.object({
    specs: z.any(),
    limit: z.number().optional(),
  }),
  execute: async ({ context }) => {
    const comps = await fetchSerpComps(context.specs, context.limit ?? 6);
    await upsertSerpComps(comps);
    return comps;
  },
});

export const predictPriceTool = createTool({
  id: "predictPrice",
  description: "Predict list price using TabPFN on comp feature rows.",
  inputSchema: z.object({
    specs: z.any(),
    comps: z.array(z.any()),
  }),
  execute: async ({ context }) => {
    return predictPrice(context.specs, context.comps);
  },
});

export const pricingAgent = new Agent({
  name: "price-wire-agent",
  instructions: `You are Price Wire, a pricing copilot for electronics resellers.
Call tools to extract listing specs, search pooled comps, optionally refresh live eBay comps, and predict a list price.`,
  model: "google/gemma-2-2b-it",
  tools: {
    extractSpecs: extractSpecsTool,
    searchComps: searchCompsTool,
    fetchSerpComps: serpCompsTool,
    predictPrice: predictPriceTool,
  },
});

/** Mastra harness registers the open-tool pricing workflow for HF26 partner category. */
export const mastra = new Mastra({
  agents: { pricingAgent },
});

/** Deterministic pipeline used by the HTTP API. */
export async function runPricingPipeline(
  title: string,
  conditionHint?: string,
): Promise<PriceQuote> {
  const specs = await extractSpecs(title, conditionHint);

  const tigerComps = await searchComps(specs, 12);
  const serp = await fetchSerpComps(specs, 6);
  if (serp.length) {
    await upsertSerpComps(serp);
  }

  const seen = new Set<string>();
  const merged = [...tigerComps, ...serp].filter((c) => {
    const key = c.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const top = merged.slice(0, 15);
  const prediction = await predictPrice(specs, top.length ? top : tigerComps);

  const listing_brief = buildListingBrief(
    title,
    specs,
    prediction,
    top.length ? top : tigerComps,
  );

  return PriceQuoteSchema.parse({
    suggested_price: prediction.suggested_price,
    quick_sale_price: prediction.quick_sale_price,
    hold_price: prediction.hold_price,
    confidence: prediction.confidence,
    comp_count: merged.length || tigerComps.length,
    method: prediction.method,
    comps: top.length ? top : tigerComps,
    specs,
    listing_brief,
  });
}
