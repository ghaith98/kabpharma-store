import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compile(file, dependencies) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  }, console: { error() {} }, URL, Map, Date, Number, String, Promise });
  return exports;
}
const presentation = compile("lib/admin-customer-details.ts", {});
let authorized = true, profileMissing = false, archiveFails = false, banFails = false;
let calls = [], cursor = null;
const customer = { id: 7, full_name: "Test customer", phone: "963911111111", email: "test@example.test", created_at: "2026-01-01T00:00:00Z" };
const liveOrders = Array.from({ length: 60 }, (_, index) => ({ id: 120 - index * 2, customer_profile_id: 7, total_price: 1000,
  order_items: [{ id: index, product_name: "Test product", quantity: 1, unit_price: 1000, image_url: "SECRET_IMAGE" }],
  idempotency_key: "SECRET_KEY", payment_proof_url: "SECRET_PROOF" }));
const archivedOrders = Array.from({ length: 60 }, (_, index) => ({ source_order_id: 119 - index * 2,
  order_data: { id: 119 - index * 2, customer_profile_id: 7, total_price: 900, idempotency_key: "SECRET_KEY" }, items_data: [] }));
// A retry during archiving can leave a duplicate in both stores.
archivedOrders.push({ source_order_id: 120, order_data: { id: 120, total_price: 1 }, items_data: [] });
function database(archive) {
  return {
    from(table) {
      calls.push({ table, archive });
      let bound = null, limit = 1000;
      const query = {
        select(fields) { calls.push({ table, fields }); return query; },
        eq(field, value) { assert.equal(field, "id"); assert.equal(value, 7); return query; },
        or(filter) {
          // The query must never associate an order assigned to another ID
          // solely by phone, or use a broad name/email match.
          assert.match(filter, archive ? /^order_data->>customer_profile_id.eq.7,/ : /^customer_profile_id.eq.7,/);
          assert.ok(filter.includes(archive ? "and(order_data->>customer_profile_id.is.null,phone.eq.963911111111,created_at.gte.2026-01-01T00:00:00.000Z)" : "and(customer_profile_id.is.null,phone.eq.963911111111,created_at.gte.2026-01-01T00:00:00.000Z)"));
          return query;
        },
        order() { return query; }, limit(n) { limit = n; return query; },
        lt(field, value) { assert.equal(field, archive ? "source_order_id" : "id"); bound = value; return query; },
        maybeSingle() { return Promise.resolve({ data: profileMissing ? null : customer, error: null }); },
        then(resolve) {
          const rows = archive ? archivedOrders : liveOrders;
          resolve({ data: rows.filter(row => bound === null || (archive ? row.source_order_id : row.id) < bound)
            .sort((a,b) => (archive ? b.source_order_id - a.source_order_id : b.id - a.id)).slice(0, limit),
            error: archive && archiveFails ? { message: "Archive offline" } : null });
        },
      };
      return query;
    },
    rpc() { return Promise.resolve({ data: [{ is_banned: true, reason: "Test reason", secret: "SECRET_BAN" }], error: banFails ? {} : null }); },
  };
}
const { GET } = compile("app/api/admin/customers/[id]/route.ts", {
  "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers }) } },
  "@/lib/admin-auth": { getAdminFromRequest: async () => authorized ? { id: "admin" } : null },
  "@/lib/supabase-admin": { supabaseAdmin: database(false) },
  "@/lib/supabase-archive": { getArchiveAdmin: () => database(true), isArchiveConfigured: () => true },
  "@/lib/admin-customer-details": presentation,
});
function request(id = "7", before = "") {
  return GET({ url: `https://example.test/api/admin/customers/${id}${before}` }, { params: Promise.resolve({ id }) });
}
authorized = false;
assert.equal((await request()).status, 403);
assert.equal(calls.length, 0, "No private database access without admin authorization");
authorized = true;
for (const invalid of ["0", "-1", "1.5", "abc", "9007199254740992"]) assert.equal((await request(invalid)).status, 400);
assert.equal((await request("7", "?before=-1")).status, 400);
profileMissing = true;
assert.equal((await request()).status, 404);
profileMissing = false;
const seen = [];
do {
  const response = await request("7", cursor ? `?before=${cursor}` : "");
  assert.equal(response.status, 200);
  assert.equal(response.headers["Cache-Control"], "private, no-store");
  assert.ok(response.body.orders.length <= 25);
  assert.equal(response.body.restriction.is_banned, true);
  const serialized = JSON.stringify(response.body);
  assert.ok(!serialized.includes("SECRET"), "Private fields and images must never be returned");
  if (!cursor) { assert.equal(response.body.orders[0].total_price, 1000); assert.equal(response.body.orders[0].archived, false); }
  seen.push(...response.body.orders.map(order => order.id));
  cursor = response.body.nextBefore;
} while (cursor);
assert.deepEqual(seen, Array.from({ length: 120 }, (_, index) => 120 - index));
assert.equal(new Set(seen).size, 120, "Pagination must preserve all orders without duplication");
archiveFails = true;
const partial = await request();
assert.equal(partial.status, 200);
assert.ok(partial.body.warning.includes("incomplete"));
assert.ok(partial.body.orders.length > 0, "Live history survives an optional archive failure");
banFails = true;
assert.equal((await request()).body.restriction, null, "Unknown restriction must not be displayed as Active");
assert.ok(calls.some(call => call.table === "profiles" && call.fields === "id, full_name, phone, email, created_at"));
console.log("Admin customer details: authorization, validation, ownership filters, safe responses, 120-order pagination, archive failure and restriction fallback passed.");
