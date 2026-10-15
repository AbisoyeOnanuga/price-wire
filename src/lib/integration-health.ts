import pg from "pg";
import { config } from "../config.js";

let ollamaReachable: boolean | null = null;
let ollamaCheckedAt = 0;
const OLLAMA_CACHE_MS = 60_000;

export async function isGemmaConfigured(): Promise<boolean> {
  if (config.googleApiKey) {
    return true;
  }
  if (!config.ollamaEnabled) {
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

export function integrationFlags() {
  return {
    database: Boolean(config.databaseUrl),
    serpapi: Boolean(config.serpApiKey),
    tabpfn: Boolean(config.tabpfnApiKey),
    google_gemma: Boolean(config.googleApiKey),
    ollama_enabled: config.ollamaEnabled,
  };
}

/** True only when DATABASE_URL is set and a connection succeeds. */
export async function isDatabaseLive(): Promise<boolean> {
  if (!config.databaseUrl) return false;
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 2500,
  });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}
