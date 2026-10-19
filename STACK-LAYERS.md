# Stack map (technical)

**Reader story:** [README.md](./README.md) · **shipped vs later:** [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md)

One Node process (`src/server.ts`) + Vite UI. `/api/quote` runs `runPricingPipeline` in `src/mastra/pricing-agent.ts` (deterministic steps).

## In the demo story today

| Layer | Tech | Files | Fallback |
| --- | --- | --- | --- |
| **Live similar sales** | SerpApi | `src/tools/serp-comps.ts` | Bundled CSV examples |
| **Title → search query** | Gemma / Gemini / Ollama | `src/tools/extract-specs.ts` | Title rules |
| **Price band** | Median (+ optional TabPFN) | `src/tools/tabpfn-price.ts` | Median always available |
| **Listing copy** | Templates | `src/lib/sell-copy.ts`, `listing-packets.ts` | — |
| **Host** | Render | `render.yaml` | `npm run dev` |

## Wired for later (see FUTURE.md)

| Layer | Tech | Notes |
| --- | --- | --- |
| **Saved sales DB** | Tiger / pgvector | `comp-store.ts`, `sql/schema.sql` |
| **Agent harness** | Mastra | Tools registered; HTTP does not run an agent loop |
| **Traces** | Sentry | `pricing.run` when DSN set |

## Observability

- **Chips:** Listing AI, Price model, Saved sales (optional DB), Online listings.
- **`stack_layers`** on quote JSON (for developers).

Env tiers: [SETUP.md](./SETUP.md). HF26 submission-era audit (archival): [hacktoberfest-week2/STACK-AUDIT.md](./hacktoberfest-week2/STACK-AUDIT.md).
