// Applies schema.sql (idempotent) before dev/build: node lib/migrate.mts
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (.env.local)");
const sql = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
// Advisory lock so two servers starting at once don't race on `create or replace`.
await sql.begin(async (tx) => {
  await tx`select pg_advisory_xact_lock(4242)`;
  await tx.file("schema.sql");
});
await sql.end();
console.log("✓ schema up to date");
