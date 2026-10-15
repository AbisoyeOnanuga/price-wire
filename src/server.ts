import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { config } from "./config.js";
import {
  integrationFlags,
  isDatabaseLive,
  isGemmaConfigured,
} from "./lib/integration-health.js";
import { checkRateLimit } from "./lib/rate-limit.js";
import {
  MAX_JSON_BODY_BYTES,
  normalizeQuoteInput,
} from "./lib/request-limits.js";
import { runPricingPipeline } from "./mastra/pricing-agent.js";
import { initSentry, tracePricingRun } from "./lib/sentry.js";
import {
  MARKETPLACE_CONDITIONS,
  requiresConditionDetail,
} from "./lib/conditions.js";
import { PLATFORMS } from "./lib/platforms.js";
import { seedFromCsv } from "./tools/comp-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const builtPublic = path.resolve(__dirname, "../dist/public");
const devPublic = path.resolve(__dirname, "../web");

function dirExists(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const publicDir = dirExists(builtPublic) ? builtPublic : devPublic;

initSentry();

const app = new Hono();

app.use("*", secureHeaders());

app.use("/api/*", async (c, next) => {
  const len = c.req.header("content-length");
  if (len && Number(len) > MAX_JSON_BODY_BYTES) {
    return c.json({ error: "request body too large" }, 413);
  }
  await next();
});

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return config.nodeEnv === "production" ? null : "*";
      }
      if (config.allowedOrigins.length > 0) {
        return config.allowedOrigins.includes(origin) ? origin : null;
      }
      if (config.nodeEnv !== "production") {
        return origin;
      }
      return null;
    },
  }),
);

function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

function authorizeQuote(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  if (!config.quoteApiKey) {
    return true;
  }
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return false;
  }
  return auth.slice("Bearer ".length) === config.quoteApiKey;
}

app.get("/api/platforms", (c) =>
  c.json(
    PLATFORMS.map(({ id, label, tagline, default: isDefault }) => ({
      id,
      label,
      tagline,
      default: Boolean(isDefault),
    })),
  ),
);

app.get("/api/conditions", (c) =>
  c.json(
    MARKETPLACE_CONDITIONS.map(
      ({ value, label, marketing_note, helper_text, requires_detail }) => ({
        value,
        label,
        marketing_note,
        helper_text,
        requires_detail,
      }),
    ),
  ),
);

app.get("/api/health", async (c) => {
  const verbose =
    config.nodeEnv !== "production" || c.req.query("verbose") === "1";
  if (!verbose) {
    return c.json({ ok: true, service: "price-wire" });
  }
  const flags = integrationFlags();
  const gemma = await isGemmaConfigured();
  const database_live = flags.database ? await isDatabaseLive() : false;
  return c.json({
    ok: true,
    service: "price-wire",
    database_configured: flags.database,
    database_live,
    serpapi: flags.serpapi,
    tabpfn: flags.tabpfn,
    gemma,
    google_gemma: flags.google_gemma,
    ollama_enabled: flags.ollama_enabled,
    mastra: true,
  });
});

app.post("/api/quote", async (c) => {
  if (!authorizeQuote(c)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const rate = checkRateLimit(
    `quote:${clientIp(c)}`,
    config.quoteRateLimit,
    60_000,
  );
  if (!rate.allowed) {
    return c.json(
      { error: "too many requests; try again shortly" },
      429,
      rate.retryAfterSec
        ? { "Retry-After": String(rate.retryAfterSec) }
        : undefined,
    );
  }

  const body = await c.req.json<{
    title?: string;
    condition?: string;
    condition_detail?: string;
  }>();
  const normalized = normalizeQuoteInput(body);
  if ("error" in normalized) {
    return c.json({ error: normalized.error }, 400);
  }

  if (
    requiresConditionDetail(normalized.condition) &&
    !normalized.condition_detail
  ) {
    return c.json(
      {
        error:
          "Describe the item’s condition (wear, defects, what’s included). Required for open box, used, refurbished, and for-parts listings.",
      },
      400,
    );
  }

  try {
    const quote = await tracePricingRun(normalized.title, () =>
      runPricingPipeline(
        normalized.title,
        normalized.condition,
        normalized.condition_detail,
      ),
    );
    return c.json(quote);
  } catch (err) {
    console.error(err);
    const message =
      config.nodeEnv === "development"
        ? err instanceof Error
          ? err.message
          : "pricing failed"
        : "pricing failed; try again later";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/seed", async (c) => {
  if (config.nodeEnv === "production") {
    return c.json({ error: "seed disabled in production" }, 403);
  }
  const count = await seedFromCsv();
  return c.json({ seeded: count });
});

app.use("/*", serveStatic({ root: publicDir }));
app.get("/", (c) => c.redirect("/index.html"));

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Price Wire listening on http://localhost:${info.port}`);
  },
);
