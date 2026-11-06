import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const migration = readFileSync(
  new URL("../supabase/migrations/202611060001_brand_mix_and_match.sql", import.meta.url),
  "utf8"
);
try {
  // Existing Promotions Engine columns used by the new constraint.
  await db.exec(`
    create table public.promotions (
      id integer primary key, type text, scope text, brand_id bigint,
      buy_quantity integer, get_quantity integer, discount_percent numeric
    );
    insert into promotions values (1, 'buy_2_get_1', 'product', null, null, null, null);
  `);
  await db.exec(migration);
  assert.equal((await db.query("select mix_and_match from promotions where id = 1")).rows[0].mix_and_match, false);
  await db.exec("insert into promotions values (2, 'buy_x_get_y', 'brand', 7, 2, 1, 100, true)");
  for (const invalid of [
    "3, 'buy_x_get_y', 'all', 7, 2, 1, 100, true",
    "3, 'buy_x_get_y', 'brand', null, 2, 1, 100, true",
    "3, 'buy_x_get_y', 'brand', 7, 2, 1, 50, true",
    "3, 'buy_x_get_y', 'brand', 7, null, 1, 100, true",
  ]) {
    await assert.rejects(db.exec(`insert into promotions values (${invalid})`), { code: "23514" });
  }
  await db.exec(migration);
  assert.equal((await db.query("select mix_and_match from promotions where id = 2")).rows[0].mix_and_match, true);
  console.log("Brand promotion SQL passed: legacy defaults, valid and invalid settings, safe rerun.");
} finally {
  await db.close();
}
