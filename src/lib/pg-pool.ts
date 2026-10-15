import pg from "pg";
import { config } from "../config.js";

/**
 * Tiger and other managed Postgres URLs often use TLS chains Node rejects
 * unless rejectUnauthorized is false (dev) or you install their CA.
 */
export function pgSslConfig():
  | undefined
  | boolean
  | { rejectUnauthorized: boolean } {
  if (!config.databaseUrl) return undefined;

  if (config.databaseSslInsecure) {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

/** sslmode=verify-full in the URL overrides Pool.ssl; strip only that query param. */
export function pgConnectionString(): string {
  const url = config.databaseUrl;
  if (!url || !config.databaseSslInsecure) return url;
  const q = url.indexOf("?");
  if (q === -1) return url;
  const base = url.slice(0, q);
  const params = url
    .slice(q + 1)
    .split("&")
    .filter((p) => p && !p.startsWith("sslmode="));
  return params.length ? `${base}?${params.join("&")}` : base;
}

export function createPgPool(): pg.Pool {
  return new pg.Pool({
    connectionString: pgConnectionString(),
    max: 5,
    connectionTimeoutMillis: 5000,
    ssl: pgSslConfig(),
  });
}

export function createPgPoolSingleConnection(): pg.Pool {
  return new pg.Pool({
    connectionString: pgConnectionString(),
    max: 1,
    connectionTimeoutMillis: 2500,
    ssl: pgSslConfig(),
  });
}
