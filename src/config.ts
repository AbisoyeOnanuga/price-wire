import "dotenv/config";

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

const nodeEnv = env("NODE_ENV", "development");

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(env("PORT", "8787")),
  nodeEnv,
  databaseUrl: env("DATABASE_URL"),
  serpApiKey: env("SERPAPI_KEY"),
  tabpfnApiKey: env("TABPFN_API_KEY"),
  googleApiKey: env("GOOGLE_GENERATIVE_AI_API_KEY"),
  /** Google AI Studio model for title/spec extraction (Gemma or Gemini). */
  googleGemmaModel: env("GOOGLE_GEMMA_MODEL", "gemini-2.5-flash"),
  ollamaBaseUrl: env("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
  gemmaModel: env("GEMMA_MODEL", "gemma2:2b"),
  sentryDsn: env("SENTRY_DSN"),
  /** In production, Ollama is off unless explicitly enabled (avoids misleading health + SSRF). */
  ollamaEnabled:
    env("OLLAMA_ENABLED") === "true" ||
    nodeEnv !== "production",
  allowedOrigins: parseOrigins(env("ALLOWED_ORIGINS")),
  quoteApiKey: env("QUOTE_API_KEY"),
  quoteRateLimit: Number(env("QUOTE_RATE_LIMIT", "30")),
  serpMinLocalComps: Number(env("SERP_MIN_LOCAL_COMPS", "4")),
  /**
   * Set true for Tiger/managed Postgres when Node reports SELF_SIGNED_CERT_IN_CHAIN.
   * In development, auto-enabled when DATABASE_URL uses sslmode=require (override with DATABASE_SSL_INSECURE=false).
   */
  databaseSslInsecure: resolveDatabaseSslInsecure(),
};

function resolveDatabaseSslInsecure(): boolean {
  if (env("DATABASE_SSL_INSECURE") === "true") return true;
  if (env("DATABASE_SSL_INSECURE") === "false") return false;
  const url = env("DATABASE_URL");
  if (!url || nodeEnv !== "development") return false;
  if (/localhost|127\.0\.0\.1/i.test(url)) return false;
  // Managed Postgres (Tiger, etc.) in local dev — avoid SELF_SIGNED_CERT_IN_CHAIN
  return true;
}

export function hasDatabase(): boolean {
  return Boolean(config.databaseUrl);
}
