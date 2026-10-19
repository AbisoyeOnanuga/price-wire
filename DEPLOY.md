# Deploy Price Wire

## Render

1. Connect the GitHub repo and use [render.yaml](./render.yaml) at the repository root.
2. Set secrets in the Render dashboard (minimum for demo story: **Google key**, **SERPAPI_KEY**; see [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md) for optional Tiger/Mastra/Sentry):
   - `DATABASE_URL` — optional Tiger Postgres (pgvector; `npm run seed` once). Omit if not seeded.
   - `GOOGLE_GENERATIVE_AI_API_KEY` — title parsing on Render (typical production path).
   - `GOOGLE_GEMMA_MODEL` — optional; use `gemini-2.5-flash` if Gemma model ids return 404.
   - **Ollama is local-only** on Render’s Node web service unless you host Ollama elsewhere: set `OLLAMA_ENABLED=true`, `OLLAMA_BASE_URL=https://your-ollama-host`, and `GEMMA_MODEL`. Otherwise rely on Google or tier-0 heuristics.
   - `TABPFN_API_KEY` — Prior Labs TabPFN predictions.
   - `SERPAPI_KEY` — live shopping + eBay comps (2 SerpApi calls per quote).
   - `QUOTE_RATE_LIMIT` — default `8` on Render (per IP per minute).
   - `QUOTE_DAILY_CAP` — default `30` global quotes per UTC day (protects Serp quota); see `hacktoberfest-week2/USAGE-LIMITS.md`.
   - `SENTRY_DSN` — optional agent tracing for the Hacktoberfest post.

Build runs `npm install && npm run build`; start runs `npm run start` on port `8787` (set `PORT` if Render assigns another).

## Tiger Data

1. Create a DEV Postgres service with pgvector enabled.
2. Run schema + seed from the repo root:

```bash
export DATABASE_URL=postgresql://...
npm run seed
```

## Sentry

With `SENTRY_DSN` set, `/api/quote` runs inside a `pricing.run` span. Capture a screenshot of the trace timeline for the DEV write-up.

## Smoke tests

```bash
npm run smoke
curl -s http://localhost:8787/api/health
curl -s -X POST http://localhost:8787/api/quote -H "Content-Type: application/json" -d "{\"title\":\"Sony WH-1000XM5 black like new\"}"
```
