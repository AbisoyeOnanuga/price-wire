import { runPricingPipeline } from "../src/mastra/pricing-agent.js";

const quote = await runPricingPipeline(
  "Sony WH-1000XM5 Wireless Headphones Black",
  "like_new",
);

console.log(
  JSON.stringify(
    {
      suggested: quote.suggested_price,
      comps: quote.comp_count,
      method: quote.method,
      confidence: quote.confidence,
      top_comp: quote.comps[0]?.title,
    },
    null,
    2,
  ),
);

if (quote.comp_count < 1 || quote.suggested_price <= 0) {
  process.exit(1);
}
