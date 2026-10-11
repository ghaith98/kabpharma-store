import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const env={CUSTOMER_SESSION_SECRET:'test-secret-only-123456789012345678901234',GEOAPIFY_API_KEY:'test-key-not-real'};
let calls=[],providerMode='ok',quota=true,session={profileId:1};
const db={from(table){const query={select(){return this;},eq(){return this;},in(){return this;},order(){return this;},maybeSingle(){return Promise.resolve({data:null,error:null});},then(resolve,reject){return Promise.resolve({data:table==='products'?[{id:1,name:'Test',price:100,is_out_of_stock:false,size_en:'100g'}]:table==='delivery_fees'?[{governorate:'Damascus',is_active:true}]:[],error:null}).then(resolve,reject);}};return query;}};
const moduleCache=new Map();
function load(file){file=path.resolve(file);if(moduleCache.has(file))return moduleCache.get(file);const exports={};moduleCache.set(file,exports);
 const require=name=>{if(name==='server-only')return {};if(name==='node:crypto')return crypto;if(name==='next/server')return {NextResponse:{json:(body,options={})=>({body,status:options.status||200})}};if(name==='@/lib/customer-session')return {getCustomerSession:async()=>session};if(name==='@/lib/rate-limit-db')return {takeRateLimitDb:async()=>({allowed:quota,retryAfterSeconds:30,unavailable:false})};if(name==='@/lib/rate-limit')return {getRequestIp:()=> 'test-ip'};if(name==='@/lib/supabase-admin')return {supabaseAdmin:db};return load((name.startsWith('@/')?name.slice(2):path.resolve(path.dirname(file),name))+'.ts');};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,Buffer,URL,AbortSignal,Date,process:{env},console:{error(){}},fetch:async(url,options)=>{
   calls.push({url:new URL(url),options});
   if(providerMode==='offline')throw new Error('NETWORK_FAILURE_WITH_KEY');
   if(providerMode==='quota')return {ok:false,status:429};
   return {ok:true,json:async()=>url.pathname.endsWith('/reverse')?{results:providerMode==='missing-address'?[]:[{country_code:providerMode==='outside'?'de':'sy',suburb:'المزة',state:'دمشق'}]}:{results:providerMode==='no-route'?[]:[{distance:providerMode==='bad-distance'?NaN:8400,distance_units:providerMode==='wrong-units'?'Miles':'Meters'}]}};
 }},{filename:file});return exports;}
const point={latitude:33.51,longitude:36.28};
const road=load('lib/delivery-route.ts'),geo=load('lib/delivery-location.ts');
assert.equal(road.roadDeliveryFee(0),500);assert.equal(road.roadDeliveryFee(8000),700);assert.equal(road.roadDeliveryFee(8400),710);assert.equal(road.roadDeliveryFee(8420),711);assert.throws(()=>road.roadDeliveryFee(-1));
assert.equal(geo.parseDeliveryPoint('33.5, 36.2').latitude,33.5);
assert.equal(geo.parseDeliveryPoint('https://www.google.com/maps/search/?api=1&query=33.5%2C36.2').longitude,36.2);
assert.equal(geo.parseDeliveryPoint('https://www.google.com/maps/place/Test/data=!3d33.5!4d36.2').latitude,33.5);
assert.equal(geo.parseDeliveryPoint('https://www.google.com/maps/@33.5,36.2,15z'),null); // viewport isn't the delivery pin
assert.equal(geo.parseDeliveryPoint('https://maps.app.goo.gl/test'),null); // no untrusted redirect fetching
assert.equal(geo.parseDeliveryPoint('91,36'),null);
let data=await road.resolveRoadDelivery(point,1,'ar');assert.equal(data.fee,710);assert.equal(data.area,'المزة');assert.equal(calls.length,2);
assert.equal(calls[1].url.searchParams.get('waypoints'),'33.5000717,36.2741384|33.51,36.28');assert.equal(calls[1].url.searchParams.get('type'),'short');assert.equal(calls[1].options.cache,'no-store');
const receipt=road.createDeliveryReceipt(data);
assert.equal(road.readDeliveryReceipt(receipt,point,1).distanceMeters,8400);
assert.equal(road.readDeliveryReceipt(receipt,point,2),null);
assert.equal(road.readDeliveryReceipt(receipt,{...point,latitude:33.52},1),null);
assert.equal(road.readDeliveryReceipt(receipt,point,1,data.expiresAt),null);
assert.equal(road.readDeliveryReceipt(receipt+'x',point,1),null);
const [payload,sig]=receipt.split('.');const changed=JSON.parse(Buffer.from(payload,'base64url').toString());changed.fee=0;
assert.equal(road.readDeliveryReceipt(Buffer.from(JSON.stringify(changed)).toString('base64url')+'.'+sig,point,1),null);
for(const mode of ['offline','quota','outside','missing-address','no-route','bad-distance','wrong-units']){providerMode=mode;await assert.rejects(road.resolveRoadDelivery(point,1,'en'));}
providerMode='ok';const key=env.GEOAPIFY_API_KEY;delete env.GEOAPIFY_API_KEY;await assert.rejects(road.resolveRoadDelivery(point,1,'ar'),/DELIVERY_NOT_CONFIGURED/);env.GEOAPIFY_API_KEY=key;
const {buildQuote}=load('lib/pricing/quote.ts');
const request={items:[{productId:1,variantId:null,quantity:1}],governorate:'Damascus',deliveryAreaName:'Editable area',deliveryLocation:point,deliveryReceipt:receipt,profileId:1,nowMs:Date.now()};
let quoted=await buildQuote({...request,paymentMethod:'transfer'});assert.equal(quoted.pricing.totals.deliveryFee,710);assert.equal(quoted.pricing.totals.total,810);assert.equal(quoted.deliveryAreaName,'Editable area');assert.equal(quoted.deliveryAreaFound,true);
quoted=await buildQuote({...request,paymentMethod:'cod'});assert.equal(quoted.pricing.totals.total,860); // existing COD 50 remains
for(const edit of [{deliveryReceipt:null},{deliveryLocation:{latitude:0,longitude:0}},{profileId:2}]){quoted=await buildQuote({...request,...edit});assert.equal(quoted.deliveryAreaFound,false);}
const {quoteOrder}=load('lib/pricing/order-quote.ts');
const submit={...request,deliveryLocation:point,deliveryReceipt:receipt,paymentMethod:'transfer',couponCode:null,expectedTotal:810};
assert.equal((await quoteOrder(submit)).ok,true);
assert.equal((await quoteOrder({...submit,expectedTotal:500})).code,'TOTAL_CHANGED');
assert.equal((await quoteOrder({...submit,deliveryReceipt:null})).ok,false);
const endpoint=load('app/api/customer/delivery-location/route.ts');
let count=calls.length;let response=await endpoint.POST({json:async()=>({location:point,receipt})});assert.equal(response.status,200);assert.equal(calls.length,count);
session=null;assert.equal((await endpoint.POST({json:async()=>({location:point})})).status,401);session={profileId:1};quota=false;assert.equal((await endpoint.POST({json:async()=>({location:point})})).status,429);assert.equal(calls.length,count);quota=true;
response=await endpoint.POST({json:async()=>({location:point,language:'ar'})});assert.equal(response.status,200);assert.equal(calls.length,count+2);
providerMode='offline';response=await endpoint.POST({json:async()=>({location:point})});assert.equal(response.status,503);assert.equal(response.body.code,'DELIVERY_PROVIDER_UNAVAILABLE');assert.ok(!JSON.stringify(response).includes(key));providerMode='ok';
// Persist the audited fee/distance in the atomic transaction; replay doesn't overwrite it.
const pg=new PGlite();await pg.exec(`create role anon;create role authenticated;create role service_role;create table orders(id bigint generated always as identity primary key,idempotency_key text unique);create function create_order_with_coupon_rules(p_order jsonb,p_items jsonb,p_idempotency_key text,p_customer_profile_id bigint)returns table(id bigint)language plpgsql as $$declare oid bigint;begin select orders.id into oid from orders where idempotency_key=p_idempotency_key;if not found then insert into orders(idempotency_key)values(p_idempotency_key)returning orders.id into oid;end if;return query select oid;end $$;`);
await pg.exec(fs.readFileSync('supabase/migrations/202610110004_road_delivery_pricing.sql','utf8'));await pg.exec(fs.readFileSync('supabase/migrations/202610110004_road_delivery_pricing.sql','utf8'));
const snapshot=road.deliveryPricingSnapshot(data);
await pg.query('select * from create_order_with_delivery_location($1::jsonb,$2::jsonb,$3,$4)',[JSON.stringify({delivery_location:point,delivery_pricing:snapshot}),'[]','test',1]);
await pg.query('select * from create_order_with_delivery_location($1::jsonb,$2::jsonb,$3,$4)',[JSON.stringify({delivery_location:point,delivery_pricing:{...snapshot,quotedFee:1}}),'[]','test',1]);
assert.equal((await pg.query('select delivery_pricing from orders')).rows[0].delivery_pricing.quotedFee,710);await pg.close();
console.log('Road delivery checks passed: road provider requests, integer tariff, coordinates, authentication/rate limits, failures, signed receipt/owner/location/expiry/tampering, preview/order totals for COD and transfer, no repeat credits, and atomic SQL pricing audit.');
