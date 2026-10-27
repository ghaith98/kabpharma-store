import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create table products(id bigint primary key, is_out_of_stock boolean default false);
  create table product_variants(id bigint primary key, product_id bigint references products(id));
  create table delivery_drivers(id bigint generated always as identity primary key, name text,
    password text, is_active boolean default true, created_at timestamptz default now());
  -- PGlite does not include pgcrypto. These local-only stubs exercise the
  -- function's validation, insertion and grants; not bcrypt implementation.
  create function gen_salt(text, integer) returns text language sql as $$select 'test-salt'::text$$;
  create function crypt(text, text) returns text language sql as $$select 'test-hash:' || $1$$;
  insert into products values(1,false),(2,true);
  insert into product_variants values(11,1),(12,1);
`);
const migration = fs.readFileSync('supabase/migrations/202610280001_variant_stock_and_driver_password.sql','utf8')
  .replace('create extension if not exists pgcrypto;', '');
await db.exec(migration);
assert.equal((await db.query('select is_out_of_stock from product_variants where id=11')).rows[0].is_out_of_stock,false);
await db.exec('update product_variants set is_out_of_stock=true where id=11; update products set is_main_size_out_of_stock=true where id=1');
assert.equal((await db.query('select is_out_of_stock from product_variants where id=12')).rows[0].is_out_of_stock,false);
assert.equal((await db.query('select is_out_of_stock from products where id=1')).rows[0].is_out_of_stock,false);
assert.equal((await db.query('select is_out_of_stock from products where id=2')).rows[0].is_out_of_stock,true);
await db.exec(migration); // Repeat-safe and preserves saved size flags.
assert.equal((await db.query('select is_out_of_stock from product_variants where id=11')).rows[0].is_out_of_stock,true);
assert.equal((await db.query('select is_main_size_out_of_stock from products where id=1')).rows[0].is_main_size_out_of_stock,true);
for (const password of ['1','1234','short','long-password-example']) {
  const row = (await db.query('select * from create_delivery_driver_admin($1,$2)',['Test driver',password])).rows[0];
  assert.equal(row.name,'Test driver'); assert.equal(row.is_active,true);
}
await assert.rejects(()=>db.query("select * from create_delivery_driver_admin('Test','')"),/Invalid staff account data/);
await assert.rejects(()=>db.query("select * from create_delivery_driver_admin('Test',null)"),/Invalid staff account data/);
await assert.rejects(()=>db.query("select * from create_delivery_driver_admin('A','1234')"),/Invalid staff account data/);
assert.equal((await db.query("select has_function_privilege('anon','create_delivery_driver_admin(text,text)','EXECUTE') as allowed")).rows[0].allowed,false);
assert.equal((await db.query("select has_function_privilege('authenticated','create_delivery_driver_admin(text,text)','EXECUTE') as allowed")).rows[0].allowed,false);
assert.equal((await db.query("select has_function_privilege('service_role','create_delivery_driver_admin(text,text)','EXECUTE') as allowed")).rows[0].allowed,true);
await db.close();

// Exercise the server validation too: lowering the driver minimum must not
// lower the delivery company minimum or bypass admin authorization.
let admin = true, captured;
const exports = {};
const source = ts.transpileModule(fs.readFileSync('app/api/admin/staff-accounts/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const dependencies = {
  'next/server': {NextResponse:{json:(body,options)=>({body,status:options.status})}},
  '@/lib/admin-auth': {getAdminFromRequest:async()=>admin ? {id:'admin'} : null},
  '@/lib/http': {hasTrustedOrigin:()=>true,jsonError:(error,status)=>({body:{error},status})},
  '@/lib/supabase-admin': {supabaseAdmin:{rpc:async(name,args)=>{captured={name,args};return {data:[{id:'1'}],error:null};}}},
};
vm.runInNewContext(source,{exports,require(name){assert.ok(name in dependencies);return dependencies[name];},console});
const create = (role,password)=>exports.POST({json:async()=>({role,name:'Test driver',username:'test-company',password})});
assert.equal((await create('driver','1234')).status,201);
assert.equal(captured.name,'create_delivery_driver_admin');
assert.equal(captured.args.p_password,'1234');
assert.equal((await create('driver','')).status,400);
assert.equal((await create('delivery_company','1234')).status,400);
admin=false;
assert.equal((await create('driver','1234')).status,403);
console.log('Variant stock migration passed: independent flags, repeat safety and preservation; driver short-password validation, service-only grants and API authorization passed. Crypto uses a local test stub.');
