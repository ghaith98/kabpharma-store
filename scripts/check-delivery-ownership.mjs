import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
 create table delivery_drivers(id bigint primary key,name text);
 create table orders(id bigint primary key,status text,driver_name text,accepted_at timestamptz,created_at timestamptz default now());
 insert into delivery_drivers values(1,'Legacy Driver');
 insert into orders(id,status,driver_name) values(1,'out_for_delivery','Legacy Driver'),(2,'out_for_delivery',null);`);
const migration=fs.readFileSync('supabase/migrations/202610280002_delivery_ownership.sql','utf8');
await db.exec(migration);
let rows=(await db.query('select * from orders order by id')).rows;
assert.equal(rows[0].delivery_handler_type,'driver');
assert.equal(rows[0].delivery_handler_id,'1');
assert.equal(rows[1].delivery_handler_type,null,'Never invent an admin/company for legacy data');
const revision=async()=>Number((await db.query('select revision from order_feed_revision')).rows[0].revision);
let old=await revision();
await db.exec("update orders set status='delivered' where id=1");
assert.equal(await revision(),old+1);
await db.exec(migration);old=await revision();
await db.exec("update orders set status='accepted' where id=2");
assert.equal(await revision(),old+1,'Rerun must not duplicate the revision trigger');
assert.equal((await db.query("select has_table_privilege('anon','order_feed_revision','SELECT') allowed")).rows[0].allowed,false);
await db.close();

function compile(file,deps,extra={}) {
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require(name){assert.ok(name in deps,`Unexpected dependency ${name}`);return deps[name];},console:{error(){}},Date,URL,Number,String,...extra});
 return exports;
}
let account=null, admin=true;
let orders=[];
let queryCount=0;
const database={from(table){
 queryCount++;
 const predicates=[];let changes=null, max=1000;
 const q={
  select(){return q;},order(){return q;},limit(n){max=n;return q;},
  update(value){changes=value;return q;},
  eq(k,v){predicates.push(row=>String(row[k])===String(v));return q;},
  is(k,v){predicates.push(row=>v===null ? row[k]==null : row[k]===v);return q;},
  in(k,v){predicates.push(row=>v.includes(row[k]));return q;},
  or(value){
   const id=value.match(/delivery_handler_id.eq.([^,)]+)/)?.[1];
   assert.ok(id,'Company list must have a specific owner ID');
   predicates.push(row=>(row.status==='accepted'&&row.delivery_handler_type==null&&row.driver_name==null)||
    (row.delivery_handler_type==='delivery_company'&&String(row.delivery_handler_id)===id));return q;
  },
  maybeSingle(){return Promise.resolve(exec(true));},
  then(resolve,reject){return Promise.resolve(exec(false)).then(resolve,reject);},
 };
 function exec(single){
  if(table!=='orders')return {data:single?null:[],error:null};
  const matched=orders.filter(row=>predicates.every(test=>test(row))).slice(0,max);
  if(changes)for(const row of matched)Object.assign(row,changes);
  return {data:single?(matched[0]||null):matched.map(row=>({...row})),error:null};
 }
 return q;
}};
const response={NextResponse:{json:(body,options={})=>({body,status:options.status||200,headers:options.headers})}};
const deps={
 'next/server':response,
 '@/lib/http':{hasTrustedOrigin:()=>true,jsonError:(error,status)=>({status,body:{error}})},
 '@/lib/staff-account':{getActiveStaffAccount:async()=>account},
 '@/lib/supabase-admin':{supabaseAdmin:database},
 '@/lib/admin-auth':{getAdminFromRequest:async()=>admin?{id:'admin-id'}:null},
};
const driver=compile('app/api/staff/driver/orders/route.ts',deps);
const company=compile('app/api/staff/delivery-company/orders/route.ts',deps);
const administrator=compile('app/api/admin/orders/status/route.ts',deps);
const post=(route,body)=>route.POST({json:async()=>body});
const driverAccount={role:'driver',id:'1',name:'Driver One'};
const companyAccount={role:'delivery_company',id:'2',name:'Company Two'};
orders=[{id:10,status:'accepted',driver_name:null},{id:11,status:'out_for_delivery',delivery_handler_type:'driver',delivery_handler_id:'9',driver_name:'Another driver'},
 {id:12,status:'out_for_delivery',delivery_handler_type:'delivery_company',delivery_handler_id:'3'},
 {id:13,status:'out_for_delivery',delivery_handler_type:'admin',delivery_handler_id:'admin-id'}];
account=null;queryCount=0;
assert.equal((await driver.GET()).status,401);assert.equal(queryCount,0);
account=driverAccount;
assert.equal((await post(driver,{action:'accept',orderId:10,delivery_handler_name:'FAKE'})).status,200);
assert.equal(orders[0].delivery_handler_name,'Driver One');
assert.equal(orders[0].delivery_handler_id,'1');
account=companyAccount;
assert.equal((await company.GET()).body.orders.length,0,'No driver/admin/other-company orders in company feed');
assert.equal((await post(company,{orderId:10,status:'delivered'})).status,409,'Stale company page cannot finish a driver order');
assert.equal((await post(company,{orderId:13,status:'delivered'})).status,409);
orders.push({id:14,status:'accepted',driver_name:null});
assert.equal((await post(company,{orderId:14,status:'out_for_delivery'})).status,200);
assert.equal(orders.at(-1).delivery_handler_name,'Company Two');
assert.equal((await company.GET()).body.orders[0].id,14);
account=driverAccount;
assert.equal((await post(driver,{orderId:14,action:'deliver'})).status,409,'Driver cannot complete a company order');
account={...driverAccount,id:'9',name:'Driver One'};
assert.equal((await post(driver,{orderId:10,action:'deliver'})).status,409,'Matching name alone must not grant access');
account=companyAccount;
assert.equal((await post(company,{orderId:14,status:'delivered'})).status,200);
assert.equal(orders.at(-1).delivery_handler_type,'delivery_company','History retains owner after delivery');
orders.push({id:15,status:'accepted',driver_name:null});
assert.equal((await post(administrator,{orderId:15,previousStatus:'accepted',status:'out_for_delivery'})).status,200);
assert.equal(orders.at(-1).delivery_handler_type,'admin');
assert.equal((await post(administrator,{orderId:10,previousStatus:'accepted',status:'out_for_delivery'})).status,409,'Stale admin action cannot overwrite a driver claim');
assert.equal((await post(administrator,{orderId:10,previousStatus:'out_for_delivery',status:'delivered'})).status,200);
assert.equal(orders[0].delivery_handler_type,'driver','Admin finishing a driver order preserves the driver');
assert.equal((await post(administrator,{orderId:15,previousStatus:'out_for_delivery',status:'accepted'})).status,200);
assert.equal(orders.at(-1).delivery_handler_type,null,'Reopening explicitly releases ownership');
admin=false;
assert.equal((await post(administrator,{orderId:15,previousStatus:'accepted',status:'out_for_delivery'})).status,403);
// Both requests pass authentication before awaiting their database operations.
orders=[{id:100,status:'accepted',driver_name:null}];
account=driverAccount;const first=post(driver,{orderId:100,action:'accept'});
account=companyAccount;const second=post(company,{orderId:100,status:'out_for_delivery'});
const race=await Promise.all([first,second]);
assert.deepEqual(race.map(result=>result.status).sort(),[200,409]);
console.log('Delivery ownership checks passed: legacy backfill, private revision counter, permissions, exact owner access, stale requests, competing claims, admin attribution, reset and preserved history.');
