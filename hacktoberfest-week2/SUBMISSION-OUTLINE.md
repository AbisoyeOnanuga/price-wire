# DEV submission outline — Price Wire (Week 2)

Tags: `devchallenge`, `hf26challenge`, `ai`, `opensource`

## What I Built

Price Wire helps **electronics resellers** pick an initial list price by pooling comparable sold listings and running an open-source AI stack: **Gemma** for SKU-aware spec extraction, **TabPFN** for tabular price prediction on comp rows, **Tiger Data (pgvector)** for hybrid comp search, **SerpApi** for fresh eBay snippets, and **Mastra** to wire the tools. A seller types a messy title (for example “Sony WH-1000XM5 black like new”) and gets a price band, comp table, and copy-ready listing brief.

**Who would pay:** hobby flippers and part-time sellers doing 20–100 listings/month who do not want a $30+/mo marketplace analytics lock-in.

## DEV draft

- Edit on DEV: https://dev.to/abisoye/price-wire-open-source-ai-comp-pooling-for-electronics-resellers-hf26-week-2-1504-temp-slug-2836614/edit

## DEV draft

- Edit: https://dev.to/abisoye/price-wire-open-source-ai-comp-pooling-for-electronics-resellers-hf26-week-2-1504-temp-slug-2836614/edit

## Demo

- Local: `cd apps/pricewire && npm run dev`
- Production: _(Render URL / `.tech` domain — fill after deploy)_
- Screenshot/GIF of quote flow

## DEV draft (staged)

- Created via DevRelay as **draft** (article id `4852980`, Oct 14 2026).
- Edit URL (use this, not the temp public slug): https://dev.to/abisoye/price-wire-open-source-ai-comp-pooling-for-electronics-resellers-hf26-week-2-1504-temp-slug-2836614/edit
- **Before publish:** add repo link, demo GIF/Render URL, listing-draft screenshot, Entire session embed.
- `get_my_articles` may only list **published** posts; the Week 2 draft stays in DEV drafts until you publish.

## DevRelay agent sessions

- No Price Wire session submitted yet (`list_agent_sessions` only shows Trail Sketch Week 1 sessions).
- **Next step:** save/submit a curated Cursor session via DevRelay `submit_agent_session`, or link an Entire checkpoint in the post (see `ENTIRE-SESSIONS.md`).

## Code

- Repository: _(GitHub URL)_
- Key paths: `apps/pricewire/src/mastra/pricing-agent.ts`, `src/tools/*`, `sample-data/electronics-comps.csv`

## How I Built It

1. Seeded 45 electronics comps; Tiger schema in `sql/schema.sql` with pgvector + full-text hybrid search.
2. Gemma via Google AI or Ollama `gemma2` extracts structured fields from titles.
3. Mastra registers four tools (`extractSpecs`, `searchComps`, `fetchSerpComps`, `predictPrice`); HTTP API runs a deterministic pipeline for reliable demos.
4. TabPFN regresses sold price from comp feature rows when `TABPFN_API_KEY` is set; otherwise median fallback keeps the UI working offline.
5. **Entire** captured Cursor sessions in-repo (`.entire/`, `.cursor/hooks.json`).

Embed session:

```liquid
{% agent_session SESSION_ID_OR_SLUG %}
```

## Why Open Innovation Matters

- **Unit economics:** Open-weight Gemma + local Ollama keeps per-lookup cost low enough for a $15–30/mo side-hustle SKU.
- **Niche accuracy:** Electronics need model/storage/lock fields; a general closed chat API guesses.
- **Choice:** Swap Gemma sizes or run batch CSV extraction locally without vendor lock-in.
- **Privacy (optional path):** Sales history can stay on-device; only anonymized comp queries hit SerpApi.

## Prize Categories

- Overall + Side Hustle theme
- Best Use of **Gemma**
- Best Use of **TabPFN**
- Best Use of **Render**
- Best Use of **Tiger Data**
- Best Use of **SerpApi**
- Best Use of **Mastra**
- Best Use of **Sentry Agent Tracing** (when `SENTRY_DSN` configured)
- Best Use of **Entire**
- Best Use of a **.tech Domain** (if deployed)

## First user (bonus)

Placeholder for a friend test: list a used Nintendo Switch OLED or AirPods Pro 2, compare Price Wire band to their gut price, ask if **$19/mo for ~100 lookups** feels fair vs Terapeak.

## Community wisdom links

_(Add 2–3 links from `search_dev_to_semantic` when drafting.)_
