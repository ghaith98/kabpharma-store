import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let lang='ar', index=0, states=[], issue=false, updating=false,deliveryAvailable=true;
const initial={0:'1',1:[{id:1,name:'Test product',price:380,quantity:1}],3:true,5:'payment-account',6:true,8:{governorate:'Damascus',delivery_area:'Area',address:'Address'}};
const pageExports={};
const storage=new Map();
const require=name=>{
 if(name==='react')return {useState:init=>{const i=index++;if(!(i in states))states[i]=i in initial?initial[i]:init;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useEffect:()=>{}};
 if(name==='react/jsx-runtime')return {jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
 if(name==='@/context/LanguageContext')return {useLanguage:()=>({lang})};
 if(name==='next/navigation')return {useRouter:()=>({})};
 if(name==='@/lib/use-checkout-account-guard')return {useCheckoutAccountGuard:()=>{}};
 if(name==='@/lib/commerce-config')return {COD_FEE_SYP:50};
 if(name==='@/lib/use-cart-quote')return {quoteIssueText:()=> 'Unavailable',useCartQuote:(cart,options)=>{
  const applied=options.couponCode==='SAVE10';
  return {fresh:!updating,updating,failed:false,lineFor:()=>null,issueFor:()=>issue?'out_of_stock':null,
   quote:{deliveryAreaFound:deliveryAvailable,promotions:[],delivery:{fee:120},totals:{subtotal:380,couponDiscount:applied?38:0,total:500-(applied?38:0)+(options.paymentMethod==='cod'?50:0),codFee:options.paymentMethod==='cod'?50:0,freeItemsCount:0},coupon:applied?{code:'SAVE10',applied:true,type:'percentage'}:null}};
 }};
 return {};
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/[lang]/payment/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:pageExports,require,sessionStorage:{removeItem:k=>storage.delete(k)}});
function render(){index=0;return pageExports.default();}
function nodes(tree,predicate){const all=[];function walk(n){if(Array.isArray(n)){n.forEach(walk);return;}if(!n||typeof n!=='object')return;if(predicate(n))all.push(n);walk(n.props?.children);}walk(tree);return all;}
const id=(tree,value)=>nodes(tree,n=>n.props?.id===value)[0];
let tree=render();
assert.equal(nodes(tree,n=>n.props?.id==='checkout-coupon').length,1);
assert.equal(nodes(tree,n=>n.props?.id==='payment-proof-form').length,1);
const order=nodes(tree,n=>n.type==='aside'||n.type==='section'&&n.props?.className?.includes('order-1'));
assert.equal(order[0].type,'section'); // payment and visible coupon precede the final order summary
assert.ok(id(order[0],'checkout-coupon'));
const flow=nodes(tree,n=>n.props?.id==='shamcash-transaction'||n.props?.id==='checkout-coupon'||n.type==='aside');
assert.equal(flow[0].props.id,'shamcash-transaction');
assert.equal(flow[1].props.id,'checkout-coupon');
assert.equal(flow[2].type,'aside');
assert.equal(id(nodes(tree,n=>n.type==='aside')[0],'checkout-coupon'),undefined);
let toggle=nodes(tree,n=>n.props?.['aria-controls']==='order-summary-products order-summary-prices')[0];
assert.equal(toggle.props['aria-expanded'],false);
toggle.props.onClick();tree=render();toggle=nodes(tree,n=>n.props?.['aria-controls'])[0];assert.equal(toggle.props['aria-expanded'],true);
let prevent=0;id(tree,'checkout-coupon').props.onChange({target:{value:'save10'}});tree=render();
id(tree,'checkout-coupon').props.onKeyDown({key:'Enter',preventDefault(){prevent++;}});tree=render();
assert.equal(prevent,1);assert.equal(states[13],'SAVE10');assert.equal(nodes(tree,n=>n.props?.role==='status').length,1);
const sticky=nodes(tree,n=>n.type==='button'&&n.props?.form==='payment-proof-form')[0];assert.equal(sticky.props.disabled,true); // Sham Cash still needs a transaction ID
const radios=nodes(tree,n=>n.type==='input'&&n.props?.type==='radio');assert.equal(radios.length,2);
radios.find(n=>n.props.value==='cod').props.onChange();tree=render();
assert.equal(nodes(tree,n=>n.type==='input'&&n.props?.type==='radio'&&n.props.value==='cod')[0].props.checked,true);
assert.equal(nodes(tree,n=>n.props?.form==='payment-proof-form')[0].props.disabled,false);
assert.equal(nodes(tree,n=>n.props?.id==='payment-proof-form').length,1);
issue=true;tree=render();assert.equal(nodes(tree,n=>n.props?.form==='payment-proof-form')[0].props.disabled,true);assert.ok(nodes(tree,n=>n.props?.role==='alert').length);
issue=false;updating=true;tree=render();assert.equal(nodes(tree,n=>n.props?.form==='payment-proof-form')[0].props.disabled,true);
lang='en';tree=render();assert.equal(tree.props.dir,'ltr');
console.log('Mobile payment checks passed: single coupon/form, summary disclosure, coupon Enter, payment switching, unavailable items and updating totals prevent confirmation, Arabic/English rendering.');

issue=false;updating=false;deliveryAvailable=false;tree=render();assert.equal(nodes(tree,n=>n.props?.form==='payment-proof-form')[0].props.disabled,true);assert.ok(nodes(tree,n=>n.props?.role==='alert').length);
