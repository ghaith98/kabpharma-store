import fs from 'node:fs';
const dir=new URL('../lib/finance/',import.meta.url);
let html=fs.readFileSync(new URL('portable-template.html',dir),'utf8');
const start=html.indexOf('function fS()'),end=html.indexOf('\nvar tn=',start);
if(start<0 || end<start)throw Error('Portable finance template changed. Review the online adapter before building.');
const records=fs.readFileSync(new URL('records.mjs',dir),'utf8').replaceAll('export function','function');
html=html.slice(0,start)+records+'\n'+fs.readFileSync(new URL('online-ui.js.txt',dir),'utf8')+html.slice(end);
const hook='  Me.useEffect(() => { reload(); }, []);';
if(html.split(hook).length!==2)throw Error('Could not locate finance refresh hook.');
html=html.replace(hook,hook+`
  Me.useEffect(() => {
    const changed = () => {
      if (lock.current || modal) {setNotice("يوجد تحديث من جهاز آخر. أغلق النموذج واضغط تحديث قبل الحفظ."); return;}
      reload();
    };
    window.addEventListener("kab-finance-updated", changed);
    return () => window.removeEventListener("kab-finance-updated", changed);
  }, [transport, modal]);
`);
for(const [from,to] of [
 ['KAB Finance | النسخة المحمولة','KAB Finance | المحاسبة السحابية'],
 ['تم إنشاء نسخة إضافية داخل Backups','تم تنزيل النسخة الاحتياطية'],
 ['تم إنشاء نسخة احتياطية داخل Backups','تم تنزيل النسخة الاحتياطية'],
 ['لا تسحب الفلاشة','انتظر اكتمال الحفظ'],['برنامج الفلاشة','المحاسبة السحابية'],
 ['إغلاق مجلد البيانات','العودة إلى لوحة الإدارة'],
])html=html.replaceAll(from,to);
html=html.replace('</head>','<style>.cloud-import-preview{margin-top:20px;padding:16px;border:1px solid #c8ded6;border-radius:12px;line-height:2}.local-save-status{max-width:90vw}</style></head>');
fs.writeFileSync(new URL('ui.json',dir),JSON.stringify({html}));
