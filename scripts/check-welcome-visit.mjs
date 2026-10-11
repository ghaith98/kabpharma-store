import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const sandbox={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/welcome-visit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,sandbox);
const {welcomeVisit,welcomeRouteAllowed}=sandbox.exports;
const map=new Map();const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
assert.equal(welcomeVisit(storage,1000).remaining,40000);
assert.equal(welcomeVisit(storage,16000).remaining,25000); // navigation keeps elapsed time
const ready=welcomeVisit(storage,41000);assert.equal(ready.remaining,0);assert.equal(ready.shown,false);
ready.markShown();assert.equal(welcomeVisit(storage,50000).shown,true); // reload cannot reopen
assert.equal(welcomeVisit({getItem:()=>null,setItem:()=>{}},50000).shown,false); // a new tab is a new visit
assert.equal(welcomeVisit({getItem:()=>'{bad',setItem:()=>{}},50000).remaining,40000);
assert.doesNotThrow(()=>welcomeVisit({getItem:()=>{throw Error()},setItem:()=>{throw Error()}},50000).markShown());
for(const route of ['/signup','/login','/payment','/checkout','/profile','/orders/2','/admin/coupons','/cart']) assert.equal(welcomeRouteAllowed(route),false);
for(const route of ['/','/products','/products/2','/brands']) assert.equal(welcomeRouteAllowed(route),true);
console.log('Welcome visit checks passed: 40-second delay, navigation/reload persistence, new visits, unavailable storage, excluded routes.');
