# Price Wire

Open-source-AI **maker desk** for people who sell handmade work, prints, custom orders, and physical SKUs—**before a live sale or a new listing**. Price Wire pools comparable listings so you can pick a **starting price** and paste-ready copy without an hour of tab switching.

Built for [Hacktoberfest Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).

## Who pays for this?

Hybrid makers and small creative shops on Etsy, markets, and social sales. When someone wants to buy your piece, a fast **price sheet** plus listing copy is worth a small monthly subscription if lookup cost stays low.

## Stack

| Layer | Technology |
| --- | --- |
| Open brain | Gemma (Google AI or Ollama `gemma2`) — **title → specs**; listing copy is templates |
| Tabular model | TabPFN (Prior Labs API) |
| Live comps | SerpApi (eBay engine) |
| Comp store | Tiger Data / Postgres + pgvector |
| Agent harness | Mastra tool registration (`runPricingPipeline` is deterministic) |
| Hosting | Render (`render.yaml`) |
| Observability | Sentry (optional) |
| Session transcript (DEV) | DevRelay agent session — see `hacktoberfest-week2/DEVRELAY-SESSION.md` |

## Quick start

```bash
cd price-wire
cp .env.example .env
npm install
npm run seed    # loads sample CSV; uses Tiger when DATABASE_URL is set
npm run build
npm run dev
```

Open `http://localhost:8787` and try: `Hand thrown stoneware mug set of 2 matte glaze` (or any item title you plan to list).

Strategic positioning: [hacktoberfest-week2/VIABILITY-STUDY.md](./hacktoberfest-week2/VIABILITY-STUDY.md).

After pricing, use **Five-minute listing draft** to copy title, key item specifics, and condition-led description per platform. Price goes in the marketplace price field—not the description.

Full integration guide: [SETUP.md](./SETUP.md).

Smoke test without the server:

```bash
npm run smoke
```

## Environment

See [.env.example](./.env.example). The app runs offline with **seed comps** and heuristic Gemma extraction when API keys are missing.

Judge-facing: [STACK-LAYERS.md](./STACK-LAYERS.md) · [PRODUCT-PICTURE.md](./hacktoberfest-week2/PRODUCT-PICTURE.md) · [STACK-AUDIT.md](./hacktoberfest-week2/STACK-AUDIT.md).

## Data ethics

- Comps come from **seed sample data**, **SerpApi** (licensed search), and optional **user CSV imports** (roadmap).
- Do **not** scrape marketplaces with personal credentials or bypass platform terms.
- Do not paste buyer names, addresses, or other PII into listings or uploads.

## Deploy (Render)

1. Create a Web Service from this repo root (see [render.yaml](./render.yaml)).
2. Build: `npm install && npm run build`
3. Start: `npm run start`
4. Set env vars from `.env.example` (at minimum `DATABASE_URL` for Tiger, optional API keys).

## License

See [LICENSE](LICENSE).
