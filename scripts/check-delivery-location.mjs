import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/delivery-location.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,URL});
const {normalizeDeliveryLocation:normalize,deliveryLocationUrl:url}=exports;
assert.equal(url({latitude:33.5,longitude:36.3}),'https://www.google.com/maps/search/?api=1&query=33.5%2C36.3');
for(const bad of [{latitude:91,longitude:1},{latitude:1,longitude:181},{latitude:'33',longitude:1},{latitude:NaN,longitude:1},{url:'javascript:alert(1)'},{url:'https://google.com.evil.test/maps/a'},{url:'https://evil.test/'},{url:'https://google.com@evil.test/maps/a'},{url:'https://www.google.com:444/maps/a'},{url:'http://maps.app.goo.gl/test'}])assert.equal(normalize(bad),null);
for(const good of ['https://maps.app.goo.gl/example?g_st=ic','https://www.google.com/maps/search/?api=1&query=33%2C36','https://goo.gl/maps/example'])assert.ok(normalize({url:good}));

// Actual location component: one-shot position, denial, removal, and a stale
// callback after unmount must not attach another account's location.
let states=[],index=0,cleanups=[],geoSuccess,geoError,lastValue=null,calls=0;
const jsx=(type,props)=>({type,props});
const inputExports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/DeliveryLocationInput.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:inputExports,window:{isSecureContext:true},navigator:{geolocation:{getCurrentPosition:(success,error,options)=>{calls++;geoSuccess=success;geoError=error;assert.equal(options.maximumAge,0);}}},
 require:name=>name==='react'?{useState:init=>{const i=index++;if(!(i in states))states[i]=init;return[states[i],v=>{states[i]=v;}];},useRef:init=>{const i=index++;if(!(i in states))states[i]={current:init};return states[i];},useEffect:fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup);}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='@/lib/delivery-location'?exports:{}
});
function render(value=null){index=0;return inputExports.default({value,onChange:v=>{lastValue=v;},isArabic:true});}
function nodes(n,p){if(Array.isArray(n))return n.flatMap(x=>nodes(x,p));if(!n||typeof n!=='object')return[];return [...(p(n)?[n]:[]),...nodes(n.props?.children,p)];}
let tree=render();nodes(tree,n=>n.type==='button')[0].props.onClick();assert.equal(calls,1);
geoSuccess({coords:{latitude:33.5,longitude:36.3,accuracy:20}});assert.equal(lastValue.latitude,33.5);
tree=render(lastValue);nodes(tree,n=>n.props?.['aria-label']==='إزالة موقع التوصيل')[0].props.onClick();assert.equal(lastValue,null);
tree=render();nodes(tree,n=>n.type==='button')[0].props.onClick();geoError({code:1});tree=render();assert.equal(nodes(tree,n=>n.props?.role==='alert').length,1);
nodes(tree,n=>n.type==='button')[0].props.onClick();cleanups.forEach(fn=>fn());geoSuccess({coords:{latitude:40,longitude:40}});assert.equal(lastValue,null);

// SQL integration: a location is part of order creation, survives retries,
// does not leak to the next order, and rolls back with a failed transaction.
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;
create table orders(id bigint generated always as identity primary key,idempotency_key text unique,customer_profile_id bigint);
create function create_order_with_coupon_rules(p_order jsonb,p_items jsonb,p_idempotency_key text,p_customer_profile_id bigint)
returns table(id bigint) language plpgsql as $$ declare oid bigint;begin
select orders.id into oid from orders where idempotency_key=p_idempotency_key;
if found then if exists(select 1 from orders where orders.id=oid and customer_profile_id<>p_customer_profile_id) then raise exception 'ACCOUNT_CHANGED';end if;return query select oid;return;end if;
insert into orders(idempotency_key,customer_profile_id)values(p_idempotency_key,p_customer_profile_id)returning orders.id into oid;
if p_order->>'fail'='yes' then raise exception 'TEST_ROLLBACK';end if;
return query select oid;end $$;`);
const migration=fs.readFileSync('supabase/migrations/202610110003_delivery_location.sql','utf8');
await db.exec(migration);await db.exec(migration);
async function order(key,location,extra={}){return db.query('select * from create_order_with_delivery_location($1::jsonb,$2::jsonb,$3,$4)',[JSON.stringify({...extra,delivery_location:location}),'[]',key,1]);}
await order('gps',{latitude:33.5,longitude:36.3});
await order('gps',{latitude:20,longitude:20});
assert.equal((await db.query("select delivery_location from orders where idempotency_key='gps'")).rows[0].delivery_location.latitude,33.5);
await order('without',null);assert.equal((await db.query("select delivery_location from orders where idempotency_key='without'")).rows[0].delivery_location,null);
await order('link',{url:'https://maps.app.goo.gl/example'});
await assert.rejects(order('bad',{latitude:500,longitude:1}));
await assert.rejects(order('bad-link',{url:'https://evil.test/maps/a'}));
await assert.rejects(order('rolled-back',{latitude:33,longitude:36},{fail:'yes'}));
assert.equal((await db.query("select count(*)::int count from orders where idempotency_key='rolled-back'")).rows[0].count,0);
assert.equal((await db.query("select has_function_privilege('anon','create_order_with_delivery_location(jsonb,jsonb,text,bigint)','EXECUTE') allowed")).rows[0].allowed,false);
await db.exec('drop function create_order_with_delivery_location(jsonb,jsonb,text,bigint);drop function create_order_with_coupon_rules(jsonb,jsonb,text,bigint);create function create_order_with_coupon_rules(p_order jsonb,p_items jsonb,p_idempotency_key text,p_customer_profile_id bigint) returns jsonb language sql as $$ select jsonb_build_object(\'id\',1) $$;');
await db.exec(migration);assert.equal((await order('scalar',null)).rows[0].create_order_with_delivery_location.id,1);
await db.close();
console.log('Delivery location checks passed: safe URLs, coordinates, one-shot location, denial/removal/stale callbacks, atomic SQL, retries, rollback, rerun, table/scalar RPC, service-only access.');
