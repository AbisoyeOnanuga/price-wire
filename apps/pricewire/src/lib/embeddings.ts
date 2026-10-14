/** Lightweight deterministic embedding for hybrid search (no external API). */
export function textEmbedding(text: string, dims = 64): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    let h = 0;
    for (let i = 0; i < token.length; i++) {
      h = (h * 31 + token.charCodeAt(i)) >>> 0;
    }
    const idx = h % dims;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

export function vectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
