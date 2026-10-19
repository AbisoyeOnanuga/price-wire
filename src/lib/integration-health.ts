import { config } from "../config.js";
import { createPgPoolSingleConnection } from "./pg-pool.js";

let ollamaReachable: boolean | null = null;
let ollamaCheckedAt = 0;
const OLLAMA_CACHE_MS = 60_000;

async function refreshOllamaReachable(): Promise<boolean> {
  if (!config.ollamaEnabled) {
    ollamaReachable = false;
    ollamaCheckedAt = Date.now();
    return false;
  }
  const now = Date.now();
  if (ollamaReachable !== null && now - ollamaCheckedAt < OLLAMA_CACHE_MS) {
    return ollamaReachable;
  }
  try {
    const res = await fetch(`${config.ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    });
    ollamaReachable = res.ok;
  } catch {
    ollamaReachable = false;
  }
  ollamaCheckedAt = now;
  return ollamaReachable;
}

/** True when Ollama is enabled and responds on /api/tags. */
export async function isOllamaReachable(): Promise<boolean> {
  return refreshOllamaReachable();
}

export async function isGemmaConfigured(): Promise<boolean> {
  if (config.googleApiKey) {
    return true;
  }
  if (!config.ollamaEnabled) {
    return false;
  }
  return refreshOllamaReachable();
}

export function integrationFlags() {
  return {
    database: Boolean(config.databaseUrl),
    serpapi: Boolean(config.serpApiKey),
    tabpfn: Boolean(config.tabpfnApiKey),
    google_gemma: Boolean(config.googleApiKey),
    ollama_enabled: config.ollamaEnabled,
    ollama_first: config.ollamaFirst,
    sentry: Boolean(config.sentryDsn),
    mastra: true,
  };
}

/** True only when DATABASE_URL is set and a connection succeeds. */
export async function isDatabaseLive(): Promise<boolean> {
  if (!config.databaseUrl) return false;
  const pool = createPgPoolSingleConnection();
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}
