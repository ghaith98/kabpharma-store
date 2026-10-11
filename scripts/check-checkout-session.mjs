import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function run(file, require = () => ({})) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,Response,URL,console});
  return exports;
}
function memory() {
  const values = new Map();
  return {getItem:k=>values.get(k) ?? null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k),key:i=>[...values.keys()][i] ?? null,get length(){return values.size;}};
}
const helpers = run('lib/checkout-session.ts');
const {readCheckoutDraft,saveCheckoutDraft,clearCheckoutStorage,clearCheckoutDraft,checkoutBelongsToAccount} = helpers;
const storage=memory(), session=memory();
storage.setItem('checkout',JSON.stringify({name:'Account A',phone:'111',address:'Old address'}));
assert.equal(readCheckoutDraft(storage,2),null);
assert.equal(storage.getItem('checkout'),null);
saveCheckoutDraft(storage,1,{name:'Account A',address:'Address A'});
assert.equal(readCheckoutDraft(storage,2),null);
assert.equal(readCheckoutDraft(storage,1).address,'Address A');
saveCheckoutDraft(storage,2,{name:'Account B',address:'Address B',profileId:1});
assert.equal(readCheckoutDraft(storage,2).address,'Address B');
assert.equal(readCheckoutDraft(storage,1).address,'Address A');
assert.equal(checkoutBelongsToAccount(readCheckoutDraft(storage,1),2),false);
assert.equal(checkoutBelongsToAccount({},null),false);
storage.setItem('kab_checkout_2',JSON.stringify({profileId:1,address:'Wrong owner'}));
assert.equal(readCheckoutDraft(storage,2),null);
storage.setItem('kab_checkout_2','{bad');
assert.equal(readCheckoutDraft(storage,2),null);
assert.throws(()=>saveCheckoutDraft(storage,null,{}),/verified account/);
saveCheckoutDraft(storage,2,{address:'Address B'});
clearCheckoutDraft(storage,1);
assert.equal(readCheckoutDraft(storage,1),null);
assert.equal(readCheckoutDraft(storage,2).address,'Address B');
session.setItem('kab_cod_idempotency_key','attemptA');session.setItem('kab_transfer_idempotency_key','attemptB');
storage.setItem('lang','ar'); storage.setItem('cart_1','keep');
clearCheckoutStorage(storage,session);
assert.equal(readCheckoutDraft(storage,2),null);
assert.equal(session.length,0);
assert.equal(storage.getItem('cart_1'),'keep');assert.equal(storage.getItem('lang'),'ar');

// Both actual order handlers must reject an account change before pricing/payment.
const json=(body,init)=>new Response(JSON.stringify(body),init);
const db={from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{id:2,phone:'222',full_name:'B'},error:null})};}};
function requireMock(name) {
  if(name==='next/server') return {NextResponse:{json}};
  if(name==='@/lib/checkout-session') return helpers;
  if(name==='@/lib/customer-session') return {getCustomerSession:async()=>({profileId:2,phone:'222',method:'phone'})};
  if(name==='@/lib/supabase-admin') return {supabaseAdmin:db};
  if(name==='@/lib/http') return {hasTrustedOrigin:()=>true,jsonError:(error,status)=>json({success:false,error},{status})};
  if(name==='@/lib/rate-limit') return {getRequestIp:()=> 'test'};
  if(name==='@/lib/rate-limit-db') return {takeRateLimitDb:async()=>({allowed:true,unavailable:false})};
  return {};
}
for(const file of ['app/api/customer/orders/cod/route.ts','app/api/customer/orders/route.ts']) {
  const {POST}=run(file,requireMock);
  for(const checkoutProfileId of [1,undefined,null]) {
    const response=await POST({json:async()=>({checkoutProfileId,cart:[],idempotencyKey:'test-attempt',shamcashTransactionId:'123456'})});
    assert.equal(response.status,409);
    assert.equal((await response.json()).code,'ACCOUNT_CHANGED');
  }
  const own=await POST({json:async()=>({checkoutProfileId:'2',cart:[],idempotencyKey:'test-attempt',shamcashTransactionId:'123456'})});
  assert.equal(own.status,400); // passes account guard, then correctly rejects empty cart
  assert.notEqual((await own.json()).code,'ACCOUNT_CHANGED');
}
// Exercise the real open-tab guard with mocked browser events and session API.
async function guardCase(event, id) {
  const windowListeners = new Map(), documentListeners = new Map();
  let reloads=0, resets=0, cleanup;
  const exports={};
  const tabSession=memory();tabSession.setItem('kab_cod_idempotency_key','old-attempt');
  const browserWindow={sessionStorage:tabSession,addEventListener:(k,v)=>windowListeners.set(k,v),removeEventListener:k=>windowListeners.delete(k),location:{reload:()=>reloads++}};
  const browserDocument={visibilityState:'visible',addEventListener:(k,v)=>documentListeners.set(k,v),removeEventListener:k=>documentListeners.delete(k)};
  const require=name=>name==='react'?{useEffect:effect=>{cleanup=effect();},useEffectEvent:fn=>fn}:helpers;
  const code=ts.transpileModule(fs.readFileSync('lib/use-checkout-account-guard.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{exports,require,window:browserWindow,document:browserDocument,AbortController,fetch:async()=>({ok:id!==null,status:id===null?401:200,json:async()=>({user:{id}})})});
  exports.useCheckoutAccountGuard('2',()=>resets++);
  if(event==='storage') windowListeners.get('storage')({key:'kab_user',newValue:JSON.stringify(id===null?null:{id})});
  else await windowListeners.get('focus')();
  const expected=id===2?0:1;
  assert.equal(reloads,expected);assert.equal(resets,expected);
  assert.equal(tabSession.getItem('kab_cod_idempotency_key'),expected===1?null:'old-attempt');
  cleanup();assert.equal(windowListeners.size,0);assert.equal(documentListeners.size,0);
}
for(const event of ['storage','focus']) for(const id of [2,1,null]) await guardCase(event,id);
console.log('Checkout session checks passed: isolated accounts, old/malformed drafts, logout cleanup, own-account restore, both order routes reject switched/missing accounts, open-tab storage/focus guards.');
