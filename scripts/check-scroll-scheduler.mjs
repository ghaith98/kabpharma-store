import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync('lib/scroll-save-scheduler.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
let nextId = 0;
const timers = new Map();
const sandbox = { exports: {}, setTimeout(fn) { const id=++nextId; timers.set(id,fn); return id; }, clearTimeout(id) { timers.delete(id); } };
vm.runInNewContext(source,sandbox);
const calls = [];
const saver = sandbox.exports.createScrollSaveScheduler((top,key)=>calls.push([top,key]));
// Many scroll events should produce one storage write with the final position.
for (let top=1; top<=100; top++) saver.schedule(top,'/products');
assert.equal(calls.length,0); assert.equal(timers.size,1);
[...timers.values()][0]();
assert.deepEqual(calls,[[100,'/products']]); assert.equal(timers.size,0);
// Navigation before the timer fires must preserve the outgoing page's key.
saver.schedule(250,'/products?category=1');
saver.schedule(40,'/products/24');
assert.deepEqual(calls.at(-1),[250,'/products?category=1']);
saver.flush(); assert.deepEqual(calls.at(-1),[40,'/products/24']);
const count=calls.length; saver.flush(); assert.equal(calls.length,count);
assert.equal(timers.size,0);
console.log('Scroll persistence checks passed: batching, final position, route ownership, cleanup.');
