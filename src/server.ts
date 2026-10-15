import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.js";
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
app.use("/api/*", cors());

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

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "price-wire",
    database: Boolean(config.databaseUrl),
    serpapi: Boolean(config.serpApiKey),
    tabpfn: Boolean(config.tabpfnApiKey),
    gemma: Boolean(config.googleApiKey) || Boolean(config.ollamaBaseUrl),
    mastra: true,
  }),
);

app.post("/api/quote", async (c) => {
  const body = await c.req.json<{
    title?: string;
    condition?: string;
    condition_detail?: string;
  }>();
  const title = body.title?.trim();
  if (!title) {
    return c.json({ error: "title is required" }, 400);
  }
  if (
    requiresConditionDetail(body.condition) &&
    !body.condition_detail?.trim()
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
    const quote = await tracePricingRun(title, () =>
      runPricingPipeline(title, body.condition, body.condition_detail),
    );
    return c.json(quote);
  } catch (err) {
    console.error(err);
    return c.json(
      { error: err instanceof Error ? err.message : "pricing failed" },
      500,
    );
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
