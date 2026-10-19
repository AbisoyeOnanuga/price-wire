# Post-deadline documentation update (judging period)

*Temporary judging-period transparency note — remove or archive after winners are announced.*

**For judges and readers** — Last updated 19 October 2026 (America/Toronto). See [commit history](https://github.com/AbisoyeOnanuga/price-wire/commits/main).

**What changed in docs.** After the HF26 Week 2 submission window closed, the [README](README.md) and [DEV article](https://dev.to/abisoye/price-wire-price-your-used-electronics-and-paste-a-listing-in-minutes-hf26-week-2-3fii) were revised so **integration and product copy match what you can verify** on [price-wire.onrender.com](https://price-wire.onrender.com) (live-seller prep, SerpApi when keyed, AI title parse, listing templates—not stream APIs). Optional stack (Tiger, Mastra agent loop, deep Sentry) is described in the DEV post under “Where it could go next,” not as live-demo claims.

**What changed in code (one fix).** A deployed bug **skipped SerpApi** when bundled CSV examples already matched the title (`SERP_MIN_LOCAL_COMPS` gate), so judges and users often saw **only repo example rows** even with a Serp key—while the write-up described live listings. Current code **always calls Serp when `SERPAPI_KEY` is set** and **does not mix bundled examples** into quotes that already have live rows. That aligns behavior with the SerpApi claims in the submission; redeploy on Render and remove legacy `SERP_MIN_LOCAL_COMPS=4` if set.

**Eligibility.** This note is transparency for judging, not a new product scope. The Week 2 story was always “live similar listings + prep copy”; the fix removes a regression that made the demo contradict that story.

**Prototype disclaimer.** Not financial or legal advice. Verify marketplace fees, shipping, and listing rules before you sell.
