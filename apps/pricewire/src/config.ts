import "dotenv/config";

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

export const config = {
  port: Number(env("PORT", "8787")),
  nodeEnv: env("NODE_ENV", "development"),
  databaseUrl: env("DATABASE_URL"),
  serpApiKey: env("SERPAPI_KEY"),
  tabpfnApiKey: env("TABPFN_API_KEY"),
  googleApiKey: env("GOOGLE_GENERATIVE_AI_API_KEY"),
  ollamaBaseUrl: env("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
  gemmaModel: env("GEMMA_MODEL", "gemma2:2b"),
  sentryDsn: env("SENTRY_DSN"),
};

export function hasDatabase(): boolean {
  return Boolean(config.databaseUrl);
}
