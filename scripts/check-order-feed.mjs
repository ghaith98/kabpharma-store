import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let setup, poll, pendingResolve;
let revision='1', calls=0, refreshes=0, failRefresh=false, hold=false;
const listeners=new Map(), timeouts=new Map();let timer=0;
const document={visibilityState:'visible',addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
const window={setInterval(fn,ms){assert.equal(ms,5000);poll=fn;return 1;},clearInterval(){poll=null;},
 setTimeout(fn){timeouts.set(++timer,fn);return timer;},clearTimeout(id){timeouts.delete(id);},
 addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
const exports={};
const code=ts.transpileModule(fs.readFileSync('lib/use-order-feed.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports,require:name=>{assert.equal(name,'react');return {useEffect:fn=>setup=fn};},window,document,AbortController,
 fetch:async(_url,options)=>{calls++;assert.equal(options.cache,'no-store');assert.equal(options.credentials,'include');
  if(hold)return new Promise(resolve=>{pendingResolve=()=>resolve({ok:true,status:200,json:async()=>({revision})});});
  return {ok:true,status:200,json:async()=>({revision})};}});
exports.useOrderFeed(async()=>{refreshes++;return !failRefresh;});
const cleanup=setup();
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
poll();await flush();assert.equal(refreshes,1);
poll();await flush();assert.equal(refreshes,1,'Unchanged revision must not download the full order list');
revision='2';poll();await flush();assert.equal(refreshes,2);
document.visibilityState='hidden';poll();await flush();assert.equal(calls,3,'Hidden screens must stop polling');
document.visibilityState='visible';listeners.get('visibilitychange')();await flush();assert.equal(refreshes,3,'Visible screen refreshes without user reload');
failRefresh=true;revision='3';poll();await flush();const failed=refreshes;
failRefresh=false;poll();await flush();assert.equal(refreshes,failed+1,'Failed list load must retry the same revision');
hold=true;poll();await flush();const started=calls;poll();poll();await flush();assert.equal(calls,started,'No overlapping requests');
const beforeCleanup=refreshes;cleanup();pendingResolve();await flush();
assert.equal(refreshes,beforeCleanup,'Unmounted screen must ignore late responses');
assert.equal(poll,null);assert.equal(listeners.size,0);assert.equal(timeouts.size,0);
console.log('Order feed checks passed: changed-only list refresh, 5-second polling, background pause, visibility resume, retry, no overlapping requests and unmount cleanup.');
