import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {getImageProps} from 'next/image.js';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/image-sizes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const views=[320,375,393,414,479,480,639,640,767,768,800,1023,1024,1100,1279,1280,1400,1439,1440,1463,1464,1719,1720,1920,2560,3840];
function hint(sizes,viewport){
 for(let entry of sizes.split(',')){
  entry=entry.trim();const condition=/^\(min-width: (\d+)px\)\s*/.exec(entry);
  if(condition){if(viewport<Number(condition[1]))continue;entry=entry.slice(condition[0].length);}
  const expression=entry.replace(/calc/g,'').replace(/([\d.]+)vw/g,(_,n)=>String(Number(n)*viewport/100)).replace(/px/g,'');
  assert.match(expression,/^[\d.\s()+*/-]+$/);
  return Function(`return (${expression})`)();
 }
 throw new Error('Missing fallback');
}
const pagePadding=w=>w>=1024?64:w>=640?48:32;
function grid(w,four){const columns=w>=1280?4:w>=1024?(four?4:3):2;const gap=w>=1024?32:w>=640?24:16;return (Math.min(w,1720)-pagePadding(w)-gap*(columns-1))/columns;}
function swiper(w,home){const count=w>=1280?4:w>=1024?3.25:w>=768?2.6:w>=640?2.2:w>=480?1.8:1.55;const gap=w>=1024?20:w>=768?18:w>=640?16:14;const container=home?Math.min(w,1440)-pagePadding(w):Math.min(w-pagePadding(w),1400);return (container-gap*(count-1))/count;}
function gallery(w){const container=Math.min(w-pagePadding(w),1400);if(w<768)return w;if(w<1024)return container;return (container-(w>=1280?64:48))*1.08/2;}
function discovery(w){const count=w>=1024?4:2;const gap=w>=1024?32:w>=640?24:16;const column=(Math.min(w,1720)-pagePadding(w)-gap*(count-1))/count;return column*2+gap;}
const profiles=[['PRODUCT_GRID_STANDARD_SIZES',w=>grid(w,false)],['PRODUCT_GRID_FOUR_SIZES',w=>grid(w,true)],['HOME_PRODUCT_SWIPER_SIZES',w=>swiper(w,true)],['RELATED_PRODUCT_SWIPER_SIZES',w=>swiper(w,false)],['PRODUCT_GALLERY_SIZES',gallery],['DISCOVERY_BANNER_SIZES',discovery]];
let assertions=0;
for(const [name,layout] of profiles){
 const sizes=exports[name];
 const {props}=getImageProps({src:'/test-product.png',alt:'Test',width:1400,height:1400,sizes});
 assert.equal(props.sizes,sizes);
 const candidates=props.srcSet.split(', ').map(v=>Number(/ (\d+)w$/.exec(v)[1]));
 for(const viewport of views){
  const declared=hint(sizes,viewport), rendered=layout(viewport);
  assert.ok(Math.abs(declared-rendered)<0.02,`${name} at ${viewport}: hint ${declared}, CSS layout ${rendered}`);
  for(const dpr of [1,2,3]){
   const requested=candidates.find(n=>n>=declared*dpr)||candidates.at(-1);
   assert.ok(requested>=rendered*dpr||requested===candidates.at(-1));
  }
  assertions++;
 }
}
assert.ok(hint(exports.PRODUCT_GRID_STANDARD_SIZES,800)>800*.33); // fix tablet undersizing
assert.ok(hint(exports.PRODUCT_GRID_STANDARD_SIZES,1100)>1100*.25); // ordinary grid is 3 columns
assert.equal(hint(exports.PRODUCT_GRID_STANDARD_SIZES,2560),390); // cap at actual container
assert.equal(hint(exports.PRODUCT_GALLERY_SIZES,1920),721.44);
// The browser receives the hints on <source>, not only on the img fallback.
const collection=fs.readFileSync('app/new-arrivals/NewArrivalsCollection.tsx','utf8');
for(const name of ['mobileSrcSet','desktopSrcSet'])assert.match(collection,new RegExp(`srcSet=\\{${name}\\}\\s+sizes=\\{DISCOVERY_BANNER_SIZES\\}`));
console.log(`Responsive image checks passed: ${assertions} layout/breakpoint cases, DPR 1/2/3 with actual Next.js srcsets, tablet sharpness, desktop caps and picture source hints.`);
