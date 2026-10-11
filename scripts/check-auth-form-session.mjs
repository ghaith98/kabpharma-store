import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const values=new Map();let blockWrites=false, capturedStore, requestSignal;
const effects=[];
const browser=new EventTarget();
browser.localStorage={getItem:k=>values.get(k) ?? null,setItem:(k,v)=>{if(blockWrites)throw Error('quota');values.set(k,v);}};
const react={useSyncExternalStore:(subscribe,snapshot,server)=>{capturedStore={subscribe,snapshot,server};return snapshot();},useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};
function load(file, require) {
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require,window:browser,Event,Date,AbortController,fetch:async(input,init)=>{requestSignal=init.signal;return {ok:true};}});
  return exports;
}
const helper=load('lib/auth-form-session.ts',name=>name==='react'?react:{});
helper.useAuthFormGeneration();
assert.equal(capturedStore.server(),'0');
let notified=0;
const unsubscribe=capturedStore.subscribe(()=>notified++);
const first=capturedStore.snapshot();helper.resetAuthForms();
assert.notEqual(capturedStore.snapshot(),first);assert.equal(notified,1);
const beforeBack=capturedStore.snapshot();
const pageShow=new Event('pageshow');Object.defineProperty(pageShow,'persisted',{value:true});browser.dispatchEvent(pageShow);
assert.notEqual(capturedStore.snapshot(),beforeBack);
values.set('kab_auth_form_generation','other-tab-reset');
const storage=new Event('storage');Object.defineProperties(storage,{key:{value:'kab_auth_form_generation'},newValue:{value:'other-tab-reset'}});browser.dispatchEvent(storage);
assert.equal(capturedStore.snapshot(),'other-tab-reset');
blockWrites=true;helper.resetAuthForms();assert.notEqual(capturedStore.snapshot(),'other-tab-reset');
const quotaReset=capturedStore.snapshot();helper.resetAuthForms();assert.notEqual(capturedStore.snapshot(),quotaReset);
unsubscribe();const count=notified;helper.resetAuthForms();assert.equal(notified,count);

const authFetch=helper.useAuthFetch();effects.at(-1)();
await authFetch('/api/login',{method:'POST'});assert.equal(requestSignal.aborted,false);
const cleanup=effects.at(-1)();cleanup();assert.equal(requestSignal.aborted,true);

// Render each real auth page's element tree with minimal hook mocks. Ensure
// phone and email forms initialize without identity, password or OTP values,
// and that an account transition gives the form a new React remount key.
for(const page of ['login','signup']) {
 for(const tab of ['phone','email']) {
  let stateIndex=0;
  const emptyReact={useState:init=>[stateIndex++===0?tab:init,()=>{}],useRef:init=>({current:init}),useEffect:()=>{}};
  const require=name=>{
   if(name==='react')return emptyReact;
   if(name==='react/jsx-runtime')return {jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
   if(name==='@/lib/auth-form-session')return {...helper,useAuthFetch:()=>()=>{},useAuthFormGeneration:()=>capturedStore.snapshot()};
   if(name==='@/context/LanguageContext')return {useLanguage:()=>({lang:'en'})};
   if(name==='next/navigation')return {useRouter:()=>({})};
   if(name==='@/lib/use-app-pathname')return {useAppPathname:()=>`/${page}`};
   return {};
  };
  const pageModule=load(`app/[lang]/${page}/page.tsx`,require);
  const old=pageModule.default();helper.resetAuthForms();const fresh=pageModule.default();
  assert.notEqual(old.key,fresh.key);
  const tree=fresh.type();const inputs=[],forms=[];
  function walk(node) {
   if(Array.isArray(node)){node.forEach(walk);return;}
   if(!node||typeof node!=='object')return;
   if(node.type==='input')inputs.push(node.props);
   if(node.type==='form')forms.push(node.props);
   walk(node.props?.children);
  }
  walk(tree);
  assert.ok(forms.length>0);assert.ok(inputs.length>0);
  for(const form of forms)assert.equal(form.autoComplete,'off');
  for(const input of inputs) {
   if(typeof input.value==='string')assert.equal(input.value,'');
   if(input.type!=='password')assert.equal(input.autoComplete,'off');
  }
 }
}
// A slow profile response must not put the previous account back after logout.
let resolveMe, meSignal;
const profileEffects=[], updates=[], profileValues=new Map([['kab_user',JSON.stringify({id:1})]]);
const profileWindow=new EventTarget();
const profileStorage={getItem:k=>profileValues.get(k)??null,setItem:(k,v)=>profileValues.set(k,v),removeItem:k=>profileValues.delete(k)};
let profileStateIndex=0;
const profileReact={useState:init=>{
  const index=profileStateIndex++;
  return [index===0?{full_name:'Account A',phone:'111'}:index===1?true:init,value=>updates.push({index,value})];
},useRef:init=>({current:init}),useEffect:fn=>profileEffects.push(fn)};
const profileExports={};
const profileRequire=name=>{
  if(name==='react')return profileReact;
  if(name==='react/jsx-runtime')return {jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
  if(name==='@/context/LanguageContext')return {useLanguage:()=>({lang:'en',setLang:()=>{}})};
  if(name==='@/lib/auth-form-session')return {resetAuthForms:()=>{}};
  if(name==='@/lib/checkout-session')return {clearCheckoutSession:()=>{}};
  return {};
};
const profileCode=ts.transpileModule(fs.readFileSync('app/[lang]/profile/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
vm.runInNewContext(profileCode,{exports:profileExports,require:profileRequire,AbortController,Event,window:profileWindow,localStorage:profileStorage,fetch:async(url,init)=>{
  if(url==='/api/customer/me'){meSignal=init.signal;return new Promise(resolve=>{resolveMe=resolve;});}
  if(url==='/api/customer/logout')return {ok:true};
  return {ok:true,json:async()=>({orders:[]})};
}});
const profileTree=profileExports.default();
let logout;
function findLogout(node){
 if(Array.isArray(node)){node.forEach(findLogout);return;}
 if(!node||typeof node!=='object')return;
 if(node.props?.onClick?.name==='handleLogout')logout=node.props.onClick;
 findLogout(node.props?.children);
}
findLogout(profileTree);assert.ok(logout);
const profileCleanup=profileEffects[0]();
await logout();assert.equal(meSignal.aborted,true);
resolveMe({ok:true,json:async()=>({authenticated:true,user:{id:1,full_name:'Account A',phone:'111'}})});
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(profileValues.get('kab_user'),undefined);
assert.equal(updates.some(update=>update.index===0&&update.value?.full_name==='Account A'),false);
profileCleanup();
console.log('Auth form checks passed: phone/email login/signup empty, account resets, cross-tab/back-cache, quota fallback, abandoned requests, late profile response cannot undo logout.');
