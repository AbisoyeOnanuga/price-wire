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

/** Live listings first; at most five practice / saved rows. */
export function mergeCompsForDisplay(
  live: CompRow[],
  library: CompRow[],
): CompRow[] {
  const out: CompRow[] = [];
  for (const c of dedupeByTitle(live)) {
    out.push(c);
  }
  const maxLibrary =
    out.length > 0
      ? Math.min(2, MAX_LIBRARY_COMPS_SHOWN)
      : MAX_LIBRARY_COMPS_SHOWN;

  let libraryShown = 0;
  for (const c of dedupeByTitle(library)) {
    if (libraryShown >= maxLibrary) break;
    if (out.some((r) => r.title.toLowerCase() === c.title.toLowerCase())) {
      continue;
    }
    out.push(c);
    libraryShown++;
  }
  return out;
}

/** For pricing math: live first, then library, capped. */
export function mergeCompsForPricing(
  live: CompRow[],
  library: CompRow[],
  cap = 15,
): CompRow[] {
  return dedupeByTitle([...live, ...library]).slice(0, cap);
}
