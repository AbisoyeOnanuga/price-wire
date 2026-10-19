# Price Wire

**Live-seller prep notebook:** before a **live marketplace stream** (eBay Live, TikTok Shop LIVE, and similar) or a new listing, get a **price sheet** and **paste-ready copy** in one pass. Price Wire pulls **live similar listings** when SerpApi is configured, falls back to **bundled examples**, and uses **AI title parsing** (or simple rules) so you spend less time tab switching.

Built for [Hacktoberfest Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).

## Who is this for?

People who sell on camera or in marketplace forms: handmade work, prints, resale, and small-shop inventory. The problem is the **minutes before you go live** or list: picking a floor price and words that match what buyers see **this week**.

## What ships in this prototype

| Piece | Role |
| --- | --- |
| **SerpApi** | Live shopping / marketplace-style similar listings (primary signal when keyed) |
| **Gemma / Gemini / Ollama** | Optional **AI title parsing** → search query (not listing prose) |
| **Title rules** | Fallback when no model is reachable |
| **Median + confidence** | Default price band from similar sales |
| **TabPFN** | Optional; only when API key works |
| **Templates** | Etsy/eBay/Facebook paste blocks + price sheet |
| **Render** | Hosted demo (`render.yaml`) |
| **Bundled CSV examples** | Keeps the app usable without any keys |

Repo wiring for **Tiger** (saved sales), **Mastra** (agent harness), and **Sentry** (tracing) exists for later; they are **not** required for the story the public demo tells today. See [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md).

## Quick start

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Open `http://localhost:8787`. Try: `Hand thrown stoneware mug set of 2 matte glaze` or any title you plan to list.

Optional: `npm run seed` when `DATABASE_URL` is set (Tiger/pgvector). `npm run smoke` for a headless pipeline check.

Full integration tiers: [SETUP.md](./SETUP.md).

## DEV write-up

https://dev.to/abisoye/price-wire-price-your-used-electronics-and-paste-a-listing-in-minutes-hf26-week-2-3fii

## Deploy (Render)

See [DEPLOY.md](./DEPLOY.md) and [hacktoberfest-week2/RENDER-FINISH.md](./hacktoberfest-week2/RENDER-FINISH.md).

## License

See [LICENSE](LICENSE).
