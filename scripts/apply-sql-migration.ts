import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/apply-sql-migration.ts <path-to.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), file);
const content = fs.readFileSync(sqlPath, "utf8");
const statements = content
  .split("--> statement-breakpoint")
  .flatMap((chunk) => chunk.split(";"))
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const sql = postgres(process.env.DATABASE_URL!);

for (const stmt of statements) {
  try {
    await sql.unsafe(stmt);
    console.log(`OK: ${stmt.slice(0, 70).replace(/\s+/g, " ")}...`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`ERR: ${message}`);
  }
}

await sql.end();
