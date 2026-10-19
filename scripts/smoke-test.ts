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
      stack_layers: quote.stack_layers,
      confidence: quote.confidence,
      top_comp: quote.comps[0]?.title,
      listing_platform: quote.listing_setup?.default_platform,
      has_ebay_packet: Boolean(quote.listing_setup?.packets?.ebay),
    },
    null,
    2,
  ),
);

if (
  quote.comp_count < 1 ||
  quote.suggested_price <= 0 ||
  !quote.listing_setup?.packets?.ebay
) {
  process.exit(1);
}
