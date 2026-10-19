# Price Wire

**Live-seller prep notebook:** before a **live marketplace stream** (eBay Live, TikTok Shop LIVE, and similar) or a new listing, get a **price sheet** and **paste-ready copy** in one pass. When SerpApi is configured, the app pulls **active listings and shopping results** for similar items so you can set a starting price against what is on the market **right now**, not only bundled practice rows. **AI title parsing** (or simple rules) turns your item description into a better search. Falls back to **example similar sales** in the repo when live search is off.

Built for [Hacktoberfest Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).

## Who is this for?

**Live sellers and marketplace listers** who need a fast answer to three questions before the camera or the publish button:

1. **What should I ask?** (starting price, quick-sale floor, hold-firm ceiling)
2. **What are other sellers listing similar items for?** (active marketplace/shopping results, not a generic chat number)
3. **What do I paste or say?** (title + description templates for Etsy, eBay, Facebook, etc.)

Typical users: someone running an **eBay Live** or **TikTok Shop LIVE** segment, a small shop listing handmade or resale inventory, or anyone posting a new SKU who does not want ten browser tabs open first.

Price Wire does **not** host your stream or connect to TikTok/eBay APIs. It is **prep in the minutes before** you go live or list.

## What ships in this prototype

| Piece | Role |
| --- | --- |
| **SerpApi** | Fetches **current** similar listings from shopping/marketplace-style search (primary signal when keyed) |
| **Gemma / Gemini / Ollama** | Optional **AI title parsing** → search query (not listing prose) |
| **Title rules** | Fallback when no model is reachable |
| **Median + confidence** | Price band from the similar-sales table |
| **TabPFN** | Optional; only when API key works |
| **Templates** | Etsy/eBay/Facebook paste blocks + price sheet |
| **Render** | Hosted demo (`render.yaml`) |
| **Bundled CSV examples** | Keeps the app usable when live search is unavailable |

Repo wiring for **Tiger** (saved sales), **Mastra** (agent harness), and **Sentry** (tracing) exists for later; they are **not** part of the public demo story today. See [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md).

## Post-deadline documentation update (judging period)

<p><small>

**For judges and readers** — Last updated 19 October 2026 (America/Toronto). See [commit history](https://github.com/AbisoyeOnanuga/price-wire/commits/main).

**What changed in docs.** After the HF26 Week 2 submission window closed, this README and the [DEV article](https://dev.to/abisoye/price-wire-price-your-used-electronics-and-paste-a-listing-in-minutes-hf26-week-2-3fii) were revised so **integration and product copy match what you can verify** on [price-wire.onrender.com](https://price-wire.onrender.com) (live-seller prep, SerpApi when keyed, AI title parse, listing templates—not stream APIs). Optional stack (Tiger, Mastra agent loop, deep Sentry) stays in [hacktoberfest-week2/FUTURE.md](./hacktoberfest-week2/FUTURE.md), not as live-demo claims.

**What changed in code (one fix).** A deployed bug **skipped SerpApi** when bundled CSV examples already matched the title (`SERP_MIN_LOCAL_COMPS` gate), so judges and users often saw **only repo example rows** even with a Serp key—while the write-up described live listings. Current code **always calls Serp when `SERPAPI_KEY` is set** and **does not mix bundled examples** into quotes that already have live rows. That aligns behavior with the SerpApi claims in the submission; redeploy on Render and remove legacy `SERP_MIN_LOCAL_COMPS=4` if set.

**Eligibility.** This note is transparency for judging, not a new product scope. The Week 2 story was always “live similar listings + prep copy”; the fix removes a regression that made the demo contradict that story.

**Prototype disclaimer.** Not financial or legal advice. Verify marketplace fees, shipping, and listing rules before you sell.

</small></p>

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
