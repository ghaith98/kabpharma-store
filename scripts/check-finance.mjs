import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import {applyAction,validateState,emptyState,parsePacket,projectState} from '../lib/finance/engine.mjs';
import {encodeState,decodeState,stateDelta} from '../lib/finance/records.mjs';
const schemaSource=fs.readFileSync(new URL('../lib/finance/schema.ts',import.meta.url),'utf8');
const {schemaStatements}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(schemaSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const db=new DatabaseSync(':memory:');for(const sql of schemaStatements)db.exec(sql);
for(const sql of schemaStatements)db.exec(sql);
let state=emptyState('test-admin');
state=applyAction(state,{type:'product',payload:{name:'Test product',code:'TEST',kind:'finished',unit:'piece',price:100,publicPrice:150,min:0,active:true}},'test-admin');
state=applyAction(state,{type:'party',payload:{name:'Test pharmacy',kind:'customer',phone:'',area:'Test area',governorate:'Test city'}},'test-admin');
state=applyAction(state,{type:'rep',payload:{name:'Test delivery',isRep:true,isDistributor:true,isCollector:false}},'test-admin');
const party=state.parties[0].id,product=state.products[0].id,distributor=state.reps[0].id;
state=applyAction(state,{type:'document',payload:{kind:'sale',date:'2026-11-22',party,distributor,rep:'',method:'credit',salesWorkflow:true,discount:20,initialPaid:0,paymentAccount:'cash',lines:[{product,qty:2,bonus:0,price:100,publicPrice:150}]}},'test-admin');
const invoice=state.docs.at(-1).id;
assert.equal(state.docs.at(-1).total,180);
state=applyAction(state,{type:'document',payload:{kind:'receipt',date:'2026-11-22',party,invoice,method:'cash',salesWorkflow:true,total:80,receivedBy:distributor}},'test-admin');
assert.equal(projectState(state).bills.get(invoice).remaining,100);
state=applyAction(state,{type:'document',payload:{kind:'receipt',date:'2026-11-22',party,invoice,method:'cash',salesWorkflow:true,total:100,receivedBy:distributor}},'test-admin');
assert.equal(projectState(state).bills.get(invoice).remaining,0);
assert.equal(projectState(state).bills.get(invoice).status,'settled');
validateState(state);
assert.throws(()=>applyAction(state,{type:'document',payload:{kind:'receipt',date:'2026-11-22',party,invoice,method:'cash',salesWorkflow:true,total:-10}},'test-admin'));
assert.deepEqual(JSON.parse(JSON.stringify(decodeState([...encodeState(state).values()]))),state);
const encoded=encodeState(state),delta=stateDelta(new Map(),encoded);
const insert=db.prepare('INSERT INTO kab_finance_workspace(singleton,packet_id,owner,version,write_id,updated_by,updated_at,delta_json) VALUES(1,?,?,?,?,?,?,?) ON CONFLICT(singleton) DO NOTHING RETURNING version');
assert.equal(insert.all('test-id','test-admin',0,'import-id','real-admin','2026-11-22',JSON.stringify(delta)).length,1);
assert.equal(insert.all('other-id','test-admin',0,'other-import','real-admin','2026-11-22',JSON.stringify(delta)).length,0);
function read(){return decodeState(db.prepare('SELECT * FROM kab_finance_records').all());}
assert.deepEqual(JSON.parse(JSON.stringify(read())),state);
const store=fs.readFileSync(new URL('../lib/finance/store.ts',import.meta.url),'utf8');
const updateSql=store.match(/`\s*(UPDATE kab_finance_workspace SET version=\?[\s\S]+?RETURNING version)`/)[1];
const update=db.prepare(updateSql);
const updated=applyAction(state,{type:'party',payload:{...state.parties[0],name:'Updated pharmacy'}},'test-admin');
const changes=stateDelta(encoded,encodeState(updated));
assert.ok(changes.upsert.length < 5,'Do not rewrite every record for an account edit');
assert.equal(update.all(1,'save-a','real-admin','2026-11-22',JSON.stringify(changes),0).length,1);
assert.equal(update.all(1,'save-b','second-admin','2026-11-22',JSON.stringify(changes),0).length,0,'Stale save must fail');
assert.deepEqual(JSON.parse(JSON.stringify(read())),updated);
const beforeCount=db.prepare('SELECT COUNT(*) n FROM kab_finance_commits').get().n;
const corrupt={upsert:[{key:'broken',kind:'docs',position:0,payload:'not JSON',array:1}],remove:[[...encoded.keys()][0]],inverse:{upsert:[],remove:[]}};
assert.throws(()=>update.all(2,'failed-write','real-admin','2026-11-22',JSON.stringify(corrupt),1));
assert.equal(db.prepare('SELECT version FROM kab_finance_workspace').get().version,1,'Rollback must include version');
assert.equal(db.prepare('SELECT COUNT(*) n FROM kab_finance_commits').get().n,beforeCount,'Rollback must include commit log');
assert.deepEqual(JSON.parse(JSON.stringify(read())),updated,'Rollback must include records');
assert.equal(db.prepare('SELECT delta_json FROM kab_finance_workspace').get().delta_json,null);
if(process.argv[2]){
 const packet=parsePacket(fs.readFileSync(process.argv[2],'utf8'));
 assert.deepEqual(JSON.parse(JSON.stringify(decodeState([...encodeState(packet.state).values()]))),packet.state);
 console.log('Supplied backup: validated and round-trip matched, no source changes.');
}
const ui=JSON.parse(fs.readFileSync(new URL('../lib/finance/ui.json',import.meta.url),'utf8')).html;
new Function(ui.match(/<script>([\s\S]*)<\/script>/)[1]);
assert.ok(!ui.includes('تم إنشاء نسخة احتياطية داخل Backups'));
assert.ok(ui.includes("operation:'action'"));
assert.ok(!ui.includes('CLOUDFLARE_API_TOKEN'));
console.log('PASS: import preservation, invoice discount, partial/full payments, state round-trip, minimal writes, repeat setup, single import, concurrent-save guard, rollback and UI JavaScript syntax.');
db.close();

// Exercise the actual browser transport against a simulated paged API. No data
// from the supplied backup is exposed to this test or the browser preview.
const vm=await import('node:vm');
const adapter=fs.readFileSync(new URL('../lib/finance/online-ui.js.txt',import.meta.url),'utf8');
const transportSource=adapter.slice(adapter.indexOf('function kabCloudTransport('),adapter.indexOf('\nfunction fS('));
let testPacket={format:'kab-finance-local',id:'test-packet',actor:'test-admin',version:1,state:updated};
let reads=0,actionCalls=0,forceReload=false;
const api=async(method,body,mode)=>{
 if(method==='GET'&&mode==='records'){
  reads++;
  const rows=[...encodeState(testPacket.state).values()].sort((a,b)=>a.key.localeCompare(b.key));
  const index=body.after?rows.findIndex(row=>row.key===body.after)+1:0;
  const page=rows.slice(index,index+3);
  return {meta:{packet_id:testPacket.id,owner:testPacket.actor,version:testPacket.version},rows:page,cursor:index+3<rows.length?page.at(-1).key:null};
 }
 if(method==='POST'){
  actionCalls++;
  if(forceReload){forceReload=false;return {reload:true};}
  assert.equal(body.version,testPacket.version);
  const fresh=applyAction(testPacket.state,body.action,testPacket.actor);
  const changes=stateDelta(encodeState(testPacket.state),encodeState(fresh));
  testPacket={...testPacket,version:testPacket.version+1,state:fresh};
  return {meta:{packet_id:testPacket.id,owner:testPacket.actor,version:testPacket.version},changes};
 }
};
const createTransport=vm.runInNewContext('('+transportSource+')',{kabRpc:api,crypto,decodeState,gd:validateState,Map,JSON,Error,kabDownload:()=>{},document:{hidden:false},window:{dispatchEvent:()=>{}},Event});
const transport=createTransport(()=>{});
assert.deepEqual(JSON.parse(JSON.stringify(await transport.load())),testPacket);
assert.ok(reads>1,'Use multiple pages to load a workspace');
const edit={type:'party',payload:{...testPacket.state.parties[0],name:'Transport test pharmacy'}};
const beforeSaveReads=reads;
const saved=await transport.save(testPacket.version,edit);
assert.deepEqual(JSON.parse(JSON.stringify(saved)),testPacket);
const readCount=reads;
assert.equal(saved.state.parties[0].name,'Transport test pharmacy');
assert.equal(reads,beforeSaveReads,'Ordinary saves apply the returned delta without reloading all data');
forceReload=true;
assert.deepEqual(JSON.parse(JSON.stringify(await transport.save(testPacket.version,edit))),testPacket);
assert.ok(reads>readCount,'Idempotent retries can reload the committed revision');
assert.equal(actionCalls,2);
console.log('PASS: paged browser loading, incremental save response and lost-response recovery.');
