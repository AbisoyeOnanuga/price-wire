import "dotenv/config";
import { seedFromCsv } from "../src/tools/comp-store.js";

const count = await seedFromCsv();
console.log(`Seeded ${count} electronics comps.`);
