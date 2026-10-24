#!/usr/bin/env bun
/**
 * Apply the Prisma schema to a REMOTE libSQL / Turso database.
 *
 *   DATABASE_URL="libsql://<db>.turso.io?authToken=<token>" bun run db:remote:push
 *
 * Why not `prisma db push`? The Prisma CLI only speaks to local SQLite files —
 * remote Turso databases go through the libSQL client, so this script:
 *   1. generates the DDL from prisma/schema.prisma (prisma migrate diff)
 *   2. applies it in one batch via @libsql/client executeMultiple
 *
 * Re-runs are safe: tables are detected first (RESET=1 wipes and re-creates).
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
if (!url || (!url.startsWith("libsql:") && !url.startsWith("file:") && !url.startsWith("https://"))) {
  console.error("✗ Set DATABASE_URL first, e.g.");
  console.error('  DATABASE_URL="libsql://your-db.turso.io?authToken=your-token" bun run db:remote:push');
  process.exit(1);
}

function parse(url) {
  const parsed = new URL(url);
  const authToken = parsed.searchParams.get("authToken") ?? process.env.DATABASE_AUTH_TOKEN;
  parsed.searchParams.delete("authToken");
  return { url: parsed.toString(), authToken };
}

const client = createClient(parse(url));

// 1. Is the DB already initialized?
const existing = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='Project'"
);
if (existing.rows.length > 0 && !process.env.RESET) {
  console.log("✓ Remote database already initialized — nothing to do.");
  console.log("  (To wipe and re-create every table: RESET=1 bun run db:remote:push)");
  process.exit(0);
}

if (process.env.RESET) {
  console.log("• RESET requested — dropping existing tables…");
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  for (const row of tables.rows) {
    if (row.name.startsWith("sqlite_") || row.name.startsWith("_prisma_")) continue;
    await client.execute(`DROP TABLE IF EXISTS "${row.name}"`);
  }
}

// 2. Generate the DDL straight from the Prisma schema
console.log("• Generating schema SQL from prisma/schema.prisma…");
const candidates = [["bunx", ["prisma", "migrate", "diff"]], ["npx", ["prisma", "migrate", "diff"]]];
const args = [
  ...candidates[0][1],
  "--from-empty",
  "--to-schema-datamodel",
  "prisma/schema.prisma",
  "--script",
];

let sql = "";
let generated = false;
for (const [bin] of candidates) {
  const res = spawnSync(bin, args, { encoding: "utf8" });
  if (res.status === 0) {
    sql = res.stdout;
    generated = true;
    break;
  }
}
if (!generated) {
  console.error("✗ Could not run `prisma migrate diff` (tried bunx & npx).");
  process.exit(1);
}

// 3. Apply it
console.log("• Applying schema to the remote database…");
await client.executeMultiple(sql);

const after = await client.execute("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'");
console.log(`✓ Done — ${after.rows[0].n} tables live on the remote database.`);
console.log("\nNext step — seed it:");
console.log('  DATABASE_URL="<same url>" bun run db:remote:seed');
