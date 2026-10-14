# Deploy Price Wire

## Render

1. Connect the GitHub repo and use [render.yaml](../../render.yaml) at the repository root.
2. Set secrets in the Render dashboard:
   - `DATABASE_URL` — Tiger Data Postgres connection string (enable pgvector; run `npm run seed` once via shell or CI).
   - `GOOGLE_GENERATIVE_AI_API_KEY` or `OLLAMA_BASE_URL` — Gemma extraction.
   - `TABPFN_API_KEY` — Prior Labs TabPFN predictions.
   - `SERPAPI_KEY` — live eBay comps.
   - `SENTRY_DSN` — optional agent tracing for the Hacktoberfest post.

Build runs `npm install && npm run build`; start runs `npm run start` on port `8787` (set `PORT` if Render assigns another).

## Tiger Data

1. Create a DEV Postgres service with pgvector enabled.
2. Run schema + seed from `apps/pricewire`:

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
