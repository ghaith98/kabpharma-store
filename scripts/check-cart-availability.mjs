import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';

// Exercise the actual quote resolver and price calculator against database rows.
let products = [], variants = [], failProducts = false;
const db = { from(table) {
  const query = {
    select() { return this; }, eq() { return this; }, in() { return this; },
    maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    then(resolve, reject) {
      return Promise.resolve({ data: table === 'products' ? products : table === 'product_variants' ? variants : [], error: table === 'products' && failProducts ? {message:'offline'} : null }).then(resolve, reject);
    },
  };
  return query;
}};
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  const require = name => {
    if (name === 'server-only') return {};
    if (name === 'node:crypto') return crypto;
    if (name === '@/lib/supabase-admin') return {supabaseAdmin:db};
    const target = name.startsWith('@/') ? name.slice(2) : path.resolve(path.dirname(file),name);
    return load(`${target}.ts`);
  };
  vm.runInNewContext(code,{exports,require,console:{error(){}},Date,URL,process:{env:{}}},{filename:file});
  return exports;
}
const {buildQuote} = load('lib/pricing/quote.ts');
const product = {id:1,name:'Test',price:100,is_out_of_stock:false,size_en:'100g'};
const quote = (variantId=null, quantity=1) => buildQuote({items:[{productId:1,variantId,quantity}],couponCode:'',paymentMethod:'transfer'});
products = [product];
variants = [{id:2,product_id:1,price:150,label_en:'50g',stock:0,stock_quantity:0}];
let result = await quote(2,3);
assert.equal(result.issues.length,0);
assert.equal(result.lines[0].quantity,3);
assert.equal(result.lines[0].unitPrice,150);
products = [{...product,stock:0,stock_quantity:0}];
assert.equal((await quote()).issues.length,0);
products = [{...product,is_out_of_stock:true}];
assert.equal((await quote(2)).issues[0].reason,'product_unavailable');
products = [];
assert.equal((await quote()).issues[0].reason,'product_missing');
products = [product]; variants = [];
assert.equal((await quote(2)).issues[0].reason,'option_invalid');
products = [{...product,size_en:null}];
variants = [{id:2,product_id:1,price:150,stock_quantity:0},{id:3,product_id:1,price:120,stock_quantity:0}];
result = await quote();
assert.equal(result.issues.length,0);
assert.equal(result.lines[0].variantId,3);
products = [{...product,price:0}]; variants = [];
assert.equal((await quote()).issues[0].reason,'price_invalid');
failProducts = true;
await assert.rejects(()=>quote(),/Quote lookup failed/);
console.log('Cart availability checks passed: product flag, ignored legacy quantities, size selection, missing product/size, invalid price and lookup failure.');
