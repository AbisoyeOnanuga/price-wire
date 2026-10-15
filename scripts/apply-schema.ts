import "dotenv/config";
import { hasDatabase } from "../src/config.js";
import { runSchema } from "../src/tools/comp-store.js";

if (!hasDatabase()) {
  console.error(
    "No database connection configured. Set DATABASE_URL in .env, then run this again.",
  );
  process.exit(1);
}

try {
  await runSchema();
  console.log("Database schema applied (pgvector + comps table).");
  console.log("Next: npm run seed");
} catch (err) {
  console.error("Schema apply failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
