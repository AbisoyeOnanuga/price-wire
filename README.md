# Price Wire

Open-source-AI pricing copilot for **electronics resellers**. Price Wire pools comparable sold and active listings so you can pick a competitive **initial list price** without guessing.

Built for [Hacktoberfest Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).

## Who pays for this?

Part-time sellers on eBay, Facebook Marketplace, Amazon, and similar platforms who list phones, consoles, headphones, and other electronics. A fast comp-backed price band is worth a small monthly subscription if inference cost stays low.

## Stack

| Layer | Technology |
| --- | --- |
| Open brain | Gemma (Google AI or Ollama `gemma2`) |
| Tabular model | TabPFN (Prior Labs API) |
| Live comps | SerpApi (eBay engine) |
| Comp store | Tiger Data / Postgres + pgvector |
| Agent harness | Mastra tools |
| Hosting | Render (`render.yaml`) |
| Observability | Sentry (optional) |
| Build sessions | Entire + Cursor hooks |

## Quick start

```bash
cd price-wire
cp .env.example .env
npm install
npm run seed    # loads sample CSV; uses Tiger when DATABASE_URL is set
npm run build
npm run dev
```

Open `http://localhost:8787` and try: `Sony WH-1000XM5 Wireless Headphones Black`.

After pricing, use **Paste into marketplace forms** to copy eBay-, Etsy-, StockX-, or Facebook-shaped fields (shared pricing/shipping plus platform-specific sections).

Smoke test without the server:

```bash
npm run smoke
```

## Environment

See [apps/pricewire/.env.example](apps/pricewire/.env.example). The app runs offline with **seed comps** and heuristic Gemma extraction when API keys are missing.

## Data ethics

- Comps come from **seed sample data**, **SerpApi** (licensed search), and optional **user CSV imports** (roadmap).
- Do **not** scrape marketplaces with personal credentials or bypass platform terms.
- Do not paste buyer names, addresses, or other PII into listings or uploads.

## Deploy (Render)

1. Create a Web Service from this repo; set root directory to `apps/pricewire`.
2. Build: `npm install && npm run build`
3. Start: `npm run start`
4. Set env vars from `.env.example` (at minimum `DATABASE_URL` for Tiger, optional API keys).

## License

See [LICENSE](LICENSE).
