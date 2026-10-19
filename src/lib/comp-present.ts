import type { CompRow } from "../types.js";

/** Max bundled example / saved rows in the UI (live listings are not capped here). */
export const MAX_LIBRARY_COMPS_SHOWN = 5;

export function compSourceLabel(source: CompRow["source"]): string {
  switch (source) {
    case "serpapi":
      return "Online listing";
    case "tiger":
      return "Your past sale";
    case "seed":
      return "Example listing";
    default:
      return "Similar sale";
  }
}

function dedupeByTitle(rows: CompRow[]): CompRow[] {
  const seen = new Set<string>();
  const out: CompRow[] = [];
  for (const c of rows) {
    const key = c.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** Live listings when present; bundled examples only if live search returned nothing. */
export function mergeCompsForDisplay(
  live: CompRow[],
  library: CompRow[],
): CompRow[] {
  const liveDeduped = dedupeByTitle(live);
  if (liveDeduped.length > 0) {
    return liveDeduped;
  }

  const out: CompRow[] = [];
  let libraryShown = 0;
  for (const c of dedupeByTitle(library)) {
    if (libraryShown >= MAX_LIBRARY_COMPS_SHOWN) break;
    out.push(c);
    libraryShown++;
  }
  return out;
}

/** Pricing uses live rows only when Serp returned data; else library fallback. */
export function mergeCompsForPricing(
  live: CompRow[],
  library: CompRow[],
  cap = 15,
): CompRow[] {
  const liveDeduped = dedupeByTitle(live);
  if (liveDeduped.length > 0) {
    return liveDeduped.slice(0, cap);
  }
  return dedupeByTitle(library).slice(0, cap);
}
