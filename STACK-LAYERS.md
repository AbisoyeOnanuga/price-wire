# Stack layers (technical map)

**Story for readers:** [README.md](./README.md) and [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md) (what ships vs what is wired for later).

Price Wire is one Node process (`src/server.ts`) and a Vite UI (`web/`). Each `/api/quote` runs `runPricingPipeline` in `src/mastra/pricing-agent.ts` (deterministic steps; Mastra registers tools but does not run an agent loop on HTTP).

| Layer | Partner / tech | Key files | Offline fallback |
| --- | --- | --- | --- |
| **Extraction** | Gemma (Google AI or Ollama) | `src/tools/extract-specs.ts` | Heuristic title parsing |
| **Comp store** | Tiger / Postgres + pgvector | `src/tools/comp-store.ts`, `sql/schema.sql`, `npm run db:schema` / `npm run seed` | `sample-data/*.csv` in memory |
| **Live market** | SerpApi | `src/tools/serp-comps.ts` | Skipped when `SERPAPI_KEY` unset; errors logged, pipeline continues |
| **Pricing** | TabPFN (Prior Labs) | `src/tools/tabpfn-price.ts` | Median + spread confidence |
| **Harness** | Mastra | `src/mastra/pricing-agent.ts` | Always loaded (`mastra: true` on `/api/health?verbose=1`) |
| **Host** | Render | `render.yaml`, `DEPLOY.md` | `npm run dev` locally |
| **Traces** | Sentry | `src/lib/sentry.ts` | No-op when `SENTRY_DSN` unset |
| **UI** | Listing copy + marketplace packets | `web/main.ts`, `src/lib/sell-copy.ts`, `src/tools/listing-packets.ts` | Static form + results notebook |

## Observability

- **Form status chips** — `GET /api/health?verbose=1` → Listing AI, Price model, Sale prices, Online listings, Agent harness, Traces.
- **Quote response** — `stack_layers` object (extraction method, comp sources, pricing method, harness id). Shown in the results meta line after each quote.
- **Smoke** — `npm run smoke` exercises the full pipeline without HTTP.

Full env tiers: [SETUP.md](./SETUP.md). Redundancy / prizes: [hacktoberfest-week2/STACK-AUDIT.md](./hacktoberfest-week2/STACK-AUDIT.md). Product picture: [hacktoberfest-week2/PRODUCT-PICTURE.md](./hacktoberfest-week2/PRODUCT-PICTURE.md) · checklist: [PRODUCT-BRIEF.md](./hacktoberfest-week2/PRODUCT-BRIEF.md).
