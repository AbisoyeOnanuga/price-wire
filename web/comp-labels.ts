/** User-facing labels for comp `source` (keep in sync with src/lib/comp-present.ts). */
export function compSourceLabel(source: string): string {
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
