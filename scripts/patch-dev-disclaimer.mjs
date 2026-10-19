import fs from "fs";

const url =
  "https://dev.to/api/articles/abisoye/price-wire-price-your-used-electronics-and-paste-a-listing-in-minutes-hf26-week-2-3fii";
const res = await fetch(url);
const j = await res.json();
let body = j.body_markdown;

body = body.replace(
  "- **Similar sales** (live listings when SerpApi is on, plus bundled examples as fallback)",
  "- **Similar sales** (live listings when SerpApi is on; bundled examples only if live search is off or empty)",
);

const oldFooter = `---

<small>
**AI disclosure:** I wrote and edited this post. Drafting and structure were assisted by AI coding agents while I built Price Wire.

**Disclaimer:** Prototype for Hacktoberfest, not financial or legal advice. Verify fees, shipping, and marketplace rules before you list.

**Post-deadline documentation (19 Oct 2026):** After the submission window, this article and the repo README were updated so integration and product copy align with the **working hosted demo**. Application behavior is unchanged. [README — Post-deadline documentation update (judging period)](https://github.com/AbisoyeOnanuga/price-wire#post-deadline-documentation-update-judging-period)</small>`;

const newFooter = `---

<p><small>

**Fine print**

*AI disclosure.* I wrote and edited this post. Drafting and structure were assisted by AI coding agents while I built Price Wire.

*Prototype disclaimer.* Hacktoberfest demo, not financial or legal advice. Verify fees, shipping, and marketplace rules before you list.

*Post-deadline update (19 Oct 2026).* After the submission window, this article and the [repo README](https://github.com/AbisoyeOnanuga/price-wire#post-deadline-documentation-update-judging-period) were updated so copy matches what you can verify on the hosted demo. One **bug fix** restores the intended SerpApi path (live similar listings when keyed; repo examples only when live search is unavailable—not mixed into live quotes). Optional stack (Tiger, Mastra agent loop, deep Sentry) remains future work, not live-demo claims.

</small></p>`;

if (!body.includes("Application behavior is unchanged")) {
  console.error("Expected footer not found; article may already be patched.");
  process.exit(1);
}
body = body.replace(oldFooter, newFooter);
fs.writeFileSync(".dev-article-body.tmp", body, "utf8");
console.log("wrote .dev-article-body.tmp", body.length);
