// Accounting engine extracted unchanged from the supplied KAB Finance portable app.
// No UI, filesystem access, or credentials. See scripts/check-finance.mjs.
const Ht=[["1100","\u0627\u0644\u0635\u0646\u062F\u0648\u0642","asset"],["1110","\u0627\u0644\u0628\u0646\u0643","asset"],["1200","\u0630\u0645\u0645 \u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0621","asset"],["1310","\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0623\u0648\u0644\u064A\u0629 \u0648\u0627\u0644\u062A\u0639\u0628\u0626\u0629","asset"],["1320","\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062C\u0627\u0647\u0632\u0629","asset"],["2100","\u0630\u0645\u0645 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646","liability"],["3100","\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0648\u0627\u0644\u0623\u0631\u0635\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u064A\u0629","equity"],["4100","\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A","income"],["5100","\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629","expense"],["5200","\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644","expense"]];

const Et={sale:"\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A",purchase:"\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A",sale_return:"\u0645\u0631\u062A\u062C\u0639 \u0645\u0628\u064A\u0639\u0627\u062A",purchase_return:"\u0645\u0631\u062A\u062C\u0639 \u0645\u0634\u062A\u0631\u064A\u0627\u062A",receipt:"\u0633\u0646\u062F \u0642\u0628\u0636",payment:"\u0633\u0646\u062F \u062F\u0641\u0639",expense:"\u0633\u0646\u062F \u0645\u0635\u0631\u0648\u0641",production:"\u0623\u0645\u0631 \u062A\u0635\u0646\u064A\u0639",opening:"\u0643\u0645\u064A\u0627\u062A \u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u0639\u0645\u0644",adjustment:"\u062A\u0635\u062D\u064A\u062D \u0643\u0645\u064A\u0629",journal:"\u0642\u064A\u062F \u064A\u0648\u0645\u064A\u0629",party_opening:"\u0631\u0635\u064A\u062F \u0637\u0631\u0641 \u0627\u0641\u062A\u062A\u0627\u062D\u064A"};

const aL=e=>({settings:{company:"\u0634\u0631\u0643\u0629 \u0643\u0627\u0628 \u0641\u0627\u0631\u0645\u0627",address:"",phone:"",footer:"\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0639\u0627\u0645\u0644\u0643\u0645 \u0645\u0639\u0646\u0627",closedThrough:"",owner:e},members:[{email:e,role:"admin"}],products:[],parties:[],reps:[],docs:[],audit:[]});

const G=e=>{throw new Error(e)};

const tL=e=>{let a=Number(e);return(!Number.isFinite(a)||Math.abs(a)>1e12)&&G("\u0642\u064A\u0645\u0629 \u0631\u0642\u0645\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629"),a};

const rd=e=>{let a=tL(e);return a<=0&&G("\u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u0643\u0645\u064A\u0629 \u0623\u0648 \u0627\u0644\u0642\u064A\u0645\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631"),a};

const ga=e=>{let a=tL(e||0);return a<0&&G("\u0627\u0644\u0642\u064A\u0645\u0629 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0633\u0627\u0644\u0628\u0629"),a};

const we=e=>{let a=Math.round(e);return(!Number.isSafeInteger(a)||Math.abs(a)>1e14)&&G("\u0627\u0644\u0642\u064A\u0645\u0629 \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u062C\u0627\u0644 \u0627\u0644\u0645\u0633\u0645\u0648\u062D"),a};

const ye=(e,a=300)=>String(e??"").trim().slice(0,a);

const Ql=e=>{let a=ye(e);return(!/^\d{4}-\d{2}-\d{2}$/.test(a)||new Date(a+"T00:00:00Z").toISOString().slice(0,10)!==a)&&G("\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"),a};

function cd(e){let a={};for(let t of e.docs)for(let l of t.moves||[]){let u=l.product+"|"+l.batch;a[u]??={product:l.product,batch:l.batch,expiry:l.expiry||"",qty:0,value:0},a[u].qty+=l.qty,a[u].value+=l.value}return Object.values(a).map(t=>({...t,qty:Math.round(t.qty*1e6)/1e6,value:Math.round(t.value)}))}

function pd(e,a){return e.docs.some(t=>(t.moves||[]).some(l=>l.product===a&&l.qty>0))}

function Be(e,a,t){return e.docs.reduce((l,u)=>l+(u.entries||[]).filter(d=>d.account===a&&(!t||d.party===t)).reduce((d,f)=>d+f.debit-f.credit,0),0)}

const Wa=(e,a)=>Be(e,a.kind==="customer"?"1200":"2100",a.id)*(a.kind==="customer"?1:-1);

function ji(e){if(e.source)return structuredClone(e.source);let a={id:e.id,kind:e.kind,date:e.date,note:e.note||"",party:e.party?.id||"",rep:e.rep?.id||"",method:e.method||"cash",discount:e.discount||0,total:e.total||0,initialPaid:e.paidAtIssue??0,paymentAccount:e.paymentAccount||"cash",invoice:e.invoice||"",original:e.original||"",overhead:e.overhead||0};return a.lines=e.kind==="journal"?e.entries.map(t=>({account:t.account,debit:t.debit,credit:t.credit})):(e.lines||[]).map(t=>e.kind.includes("return")?{index:t.originalIndex,qty:t.qty,bonus:t.bonus||0}:{product:t.product,qty:t.qty,bonus:t.bonus||0,price:t.price||0,batch:t.batch||"",expiry:t.expiry||"",direction:t.direction||"in"}),e.output&&(a.output=e.output.product,a.qty=e.output.qty,a.batch=e.output.batch,a.expiry=e.output.expiry||""),e.kind==="party_opening"&&(a.reverse=e.entries.some(t=>t.account==="1200"&&t.credit>0||t.account==="2100"&&t.debit>0)),a}

function kabLegacyApply(e,a,t,l){let u=structuredClone(e),d=u.members.find(C=>C.email.toLowerCase()===t.toLowerCase());d||G("\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u0644\u062F\u062E\u0648\u0644");let f=()=>{d.role!=="admin"&&G("\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0641\u0642\u0637")},n=(C,I)=>{u.audit.push({id:crypto.randomUUID(),at:new Date().toISOString(),actor:t,what:C,ref:I})},s=a.type,r=a.payload||{};if(["record_delete","record_restore"].includes(s)){f();let I={product:"products",party:"parties",rep:"reps"}[r.entity];I||G("\u0646\u0648\u0639 \u0627\u0644\u0633\u062C\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");let U=u[I].find(O=>O.id===r.id)||G("\u0627\u0644\u0633\u062C\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");return U.archived=s==="record_delete",r.entity==="product"&&(U.active=s==="record_restore"),n(s==="record_delete"?"\u0646\u0642\u0644 \u0633\u062C\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062D\u0630\u0648\u0641\u0627\u062A":"\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0633\u062C\u0644",U.id),u}if(s==="member_delete"){f();let C=ye(r.email).toLowerCase();return C===u.settings.owner.toLowerCase()&&G("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0632\u0627\u0644\u0629 \u0645\u0627\u0644\u0643 \u0627\u0644\u0634\u0631\u0643\u0629"),u.members=u.members.filter(I=>I.email.toLowerCase()!==C),n("\u0625\u0632\u0627\u0644\u0629 \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645",C),u}if(["document_edit","document_delete","document_restore"].includes(s)){let C=u.deletedDocs||[],k=s==="document_restore"?C.find(E=>E.doc.id===r.id)?.doc:u.docs.find(E=>E.id===r.id);k||G("\u0627\u0644\u0645\u0633\u062A\u0646\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"),["opening","adjustment","journal","party_opening"].includes(k.kind)&&f(),u.settings.closedThrough&&k.date<=u.settings.closedThrough&&G("\u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0636\u0645\u0646 \u0641\u062A\u0631\u0629 \u0645\u063A\u0644\u0642\u0629\u061B \u0623\u0639\u062F \u0641\u062A\u062D \u0627\u0644\u0641\u062A\u0631\u0629 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0623\u0648\u0644\u0627\u064B");let U=ye(r.reason,1e3);U||G("\u0633\u0628\u0628 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0623\u0648 \u0627\u0644\u062D\u0630\u0641 \u0645\u0637\u0644\u0648\u0628");let O=s==="document_edit"?{...r.document,id:k.id,kind:k.kind}:null;O&&u.settings.closedThrough&&Ql(O.date)<=u.settings.closedThrough&&G("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0636\u0645\u0646 \u0641\u062A\u0631\u0629 \u0645\u063A\u0644\u0642\u0629");let W=u.docs.filter(E=>s!=="document_delete"||E.id!==k.id).map(E=>s==="document_edit"&&E.id===k.id?{...E,date:O.date}:E);s==="document_restore"&&W.push(k),W.sort(kabOrder);let F={...structuredClone(u),docs:[],audit:[]};for(let E of W){let K=E.id===k.id&&O,Le=K?O:ji(E);try{F=Qi(F,{type:"document",payload:Le},u.settings.owner,{number:E.number,replay:!0})}catch(X){G("\u062A\u0639\u0630\u0631 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u063A\u064A\u064A\u0631 \u0628\u0633\u0628\u0628 \u0627\u0644\u0645\u0633\u062A\u0646\u062F "+E.number+": "+X.message)}let P=F.docs.at(-1);!K&&E.kind==="sale"&&E.lines.some(X=>E.moves?.some(D=>D.product===X.product&&D.qty<0)&&P.lines.some(D=>D.product===X.product&&D.costKnown===!1))&&G("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0632\u0627\u0644\u0629 \u0645\u062E\u0632\u0648\u0646 \u0645\u0631\u062A\u0628\u0637 \u0628\u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u062D\u0641\u0648\u0638\u0629\u061B \u0639\u062F\u0651\u0644 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u0623\u0648\u0644\u0627\u064B \u062D\u062A\u0649 \u0644\u0627 \u062A\u0636\u064A\u0639 \u062A\u0643\u0644\u0641\u062A\u0647\u0627."),P.createdAt=E.createdAt,P.actor=E.actor,K?(P.updatedAt=new Date().toISOString(),P.updatedBy=t):(P.company=structuredClone(E.company),P.party=E.party?structuredClone(E.party):void 0,P.rep=E.rep?structuredClone(E.rep):void 0,P.updatedAt=E.updatedAt,P.updatedBy=E.updatedBy,P.lines=P.lines.map((X,D)=>{let Ve=E.lines?.[D];return Ve&&Ve.product===X.product?{...X,name:Ve.name,code:Ve.code,unit:Ve.unit,publicPrice:Ve.publicPrice}:X}))}return F.deletedDocs=s==="document_delete"?[...C,{doc:k,deletedAt:new Date().toISOString(),actor:t,reason:U}]:C.filter(E=>E.doc.id!==k.id),F.history=[...u.history||[],{id:crypto.randomUUID(),at:new Date().toISOString(),actor:t,operation:s,reason:U,before:structuredClone(k)}],F.audit=[...u.audit,{id:crypto.randomUUID(),at:new Date().toISOString(),actor:t,what:s==="document_delete"?"\u062D\u0630\u0641 \u0645\u0633\u062A\u0646\u062F \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u062D\u062A\u0633\u0627\u0628 \u0627\u0644\u0623\u0631\u0635\u062F\u0629":s==="document_restore"?"\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0645\u0633\u062A\u0646\u062F":"\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u062A\u0646\u062F \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u062D\u062A\u0633\u0627\u0628 \u0627\u0644\u0623\u0631\u0635\u062F\u0629",ref:k.id,reason:U}],F}if(s==="settings")return f(),u.settings={...u.settings,company:ye(r.company)||u.settings.company,address:ye(r.address),phone:ye(r.phone),footer:ye(r.footer),closedThrough:r.closedThrough?Ql(r.closedThrough):""},n("\u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629","settings"),u;if(s==="member"){f();let C=ye(r.email).toLowerCase();return(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(C)||!["admin","accountant"].includes(r.role))&&G("\u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0627\u0644\u062F\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"),C===u.settings.owner.toLowerCase()&&r.role!=="admin"&&G("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u063A\u064A\u064A\u0631 \u062F\u0648\u0631 \u0627\u0644\u0645\u0627\u0644\u0643"),u.members=u.members.filter(I=>I.email.toLowerCase()!==C),u.members.push({email:C,role:r.role}),n("\u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645",C),u}if(["product","party","rep"].includes(s)){s==="product"&&f();let I=u[s==="product"?"products":s==="party"?"parties":"reps"],k=ye(r.name);k||G("\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628");let U=r.id?I.find(E=>E.id===r.id):null;r.id&&!U&&G("\u0627\u0644\u0633\u062C\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");let O=U?.id||crypto.randomUUID(),W={id:O,name:k};if(s==="product"){let E=ye(r.code,60);(E&&I.some(K=>K.code===E&&K.id!==O))&&G("رمز المنتج مستخدم بالفعل."),["raw","finished","packaging"].includes(r.kind)||G("\u0646\u0648\u0639 \u0627\u0644\u0645\u0627\u062F\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"),U&&U.kind!==r.kind&&u.docs.some(K=>K.moves?.some(Le=>Le.product===O))&&G("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u063A\u064A\u064A\u0631 \u0646\u0648\u0639 \u0645\u0627\u062F\u0629 \u0644\u0647\u0627 \u062D\u0631\u0643\u0629"),W={...W,code:E,kind:r.kind,unit:ye(r.unit)||"\u0642\u0637\u0639\u0629",publicPrice:we(ga(r.publicPrice)),price:we(ga(r.price)),min:ga(r.min),active:r.active!==!1}}s==="party"&&(["customer","supplier"].includes(r.kind)||G("\u0646\u0648\u0639 \u0627\u0644\u0637\u0631\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"),U&&U.kind!==r.kind&&G("\u0646\u0648\u0639 \u0627\u0644\u0637\u0631\u0641 \u062B\u0627\u0628\u062A"),W={...W,kind:r.kind,phone:ye(r.phone),area:ye(r.area),address:ye(r.address),rep:ye(r.rep)}),s==="rep"&&(W={...W,phone:ye(r.phone)});let F=I.findIndex(E=>E.id===O);return F<0?I.push(W):I[F]=W,n(U?"\u062A\u0639\u062F\u064A\u0644 "+s:"\u0625\u0636\u0627\u0641\u0629 "+s,O),u}s!=="document"&&G("\u0625\u062C\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641");let L=ye(r.kind);Et[L]||G("\u0646\u0648\u0639 \u0645\u0633\u062A\u0646\u062F \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641"),u.docs.some(C=>C.id===r.id)&&G("\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0645\u062D\u0641\u0648\u0638 \u0645\u0633\u0628\u0642\u0627\u064B\u061B \u062D\u062F\u0651\u062B \u0627\u0644\u0635\u0641\u062D\u0629");let v=Ql(r.date);!l?.replay&&u.settings.closedThrough&&v<=u.settings.closedThrough&&G("\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629 \u0645\u063A\u0644\u0642\u0629"),!r.salesWorkflow&&u.docs.some(C=>C.date>v)&&G("\u0623\u062F\u062E\u0644 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0628\u062A\u0627\u0631\u064A\u062E \u0622\u062E\u0631 \u062D\u0631\u0643\u0629 \u0623\u0648 \u0628\u0639\u062F\u0647\u0627 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u062A\u0633\u0644\u0633\u0644 \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646");let c={id:ye(r.id)||crypto.randomUUID(),number:l?.number||kabNextDocumentNumber(u,L),kind:L,date:v,note:ye(r.note,1500),createdAt:new Date().toISOString(),actor:t,company:structuredClone(u.settings),lines:[],moves:[],entries:[]},S=C=>u.products.find(I=>I.id===C)||G("\u0627\u0644\u0645\u0627\u062F\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629"),A=(C,I,k,U="")=>{I=we(I),k=we(k),(I<0||k<0)&&G("\u0642\u064A\u062F \u0628\u0642\u064A\u0645\u0629 \u0633\u0627\u0644\u0628\u0629"),(I||k)&&c.entries.push({account:C,debit:I,credit:k,party:U})},R=C=>C.kind==="finished"?"1320":"1310",b=cd(u),h=(C,I,k,U,O)=>{I||G("\u0631\u0642\u0645 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u0629 \u0623\u0648 \u0627\u0644\u062F\u0641\u0639\u0629 \u0645\u0637\u0644\u0648\u0628"),k&&Ql(k);let W=b.find(F=>F.product===C.id&&F.batch===I);W&&W.expiry!==k&&G("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u062E\u062A\u0644\u0641 \u0644\u0646\u0641\u0633 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u0629"),c.moves.push({product:C.id,batch:I,expiry:k,qty:U,value:O}),W?(W.qty+=U,W.value+=O):b.push({product:C.id,batch:I,expiry:k,qty:U,value:O})},p=(C,I,k,U=!1)=>{let O=b.find(F=>F.product===C.id&&F.batch===I);(!O||O.qty+1e-7<k)&&G("\u0631\u0635\u064A\u062F \u063A\u064A\u0631 \u0643\u0627\u0641\u064D: "+C.name+" / "+I),!U&&O.expiry&&O.expiry<v&&G("\u0627\u0644\u062A\u0634\u063A\u064A\u0644\u0629 \u0645\u0646\u062A\u0647\u064A\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629: "+C.name);let W=Math.abs(O.qty-k)<1e-7?O.value:we(O.value*k/O.qty);return c.moves.push({product:C.id,batch:I,expiry:O.expiry,qty:-k,value:-W}),O.qty-=k,O.value-=W,W},y=(C,I,k,U=!1)=>{let O=c.moves.length;if(I)p(C,I,k,U);else{let F=k,E=b.filter(K=>K.product===C.id&&K.qty>0&&(U||!K.expiry||K.expiry>=v)).sort((K,Le)=>(K.expiry||"9999").localeCompare(Le.expiry||"9999"));E.reduce((K,Le)=>K+Le.qty,0)+1e-7<k&&G("\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629: "+C.name);for(let K of E){if(F<=1e-7)break;let Le=Math.min(F,K.qty);p(C,K.batch,Le,U),F-=Le}}let W=c.moves.slice(O).map(F=>({batch:F.batch,expiry:F.expiry,qty:-F.qty,value:-F.value}));return{cost:W.reduce((F,E)=>F+E.value,0),allocations:W}},m=()=>((!Array.isArray(r.lines)||!r.lines.length||r.lines.length>150)&&G("\u0623\u0636\u0641 \u0645\u0646 1 \u0625\u0644\u0649 150 \u0628\u0646\u062F\u0627\u064B"),r.lines),N=C=>{let I=u.parties.find(U=>U.id===r.party);(!I||I.kind!==(C?"customer":"supplier"))&&G("\u0627\u062E\u062A\u0631 "+(C?"\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0629 \u0623\u0648 \u0627\u0644\u0639\u0645\u064A\u0644":"\u0627\u0644\u0645\u0648\u0631\u062F")),c.party=structuredClone(I),c.previousBalance=Wa(u,I);let k=u.reps.find(U=>U.id===(r.rep||I.rep));return c.rep=k?structuredClone(k):null,I};if(L==="sale"||L==="purchase"){let C=L==="sale",I=N(C);c.method=["cash","bank","credit"].includes(r.method)?r.method:"credit";let k=0,U=0;for(let F of m()){let E=S(F.product),K=rd(F.qty),Le=ga(F.bonus),P=we(ga(F.price)),X=F.expiry?Ql(F.expiry):"",D=ye(F.batch),Ve=we(K*P);K+Le>1e9&&G("\u0643\u0645\u064A\u0629 \u0643\u0628\u064A\u0631\u0629 \u062C\u062F\u0627\u064B"),k+=Ve;let ke=!r.salesWorkflow&&(pd(u,E.id)||!!D),_a=C?ke?y(E,D,K+Le):{cost:0,allocations:[]}:null,Ga=_a?_a.cost:Ve;U+=Ga,C||(D=D||"AUTO-"+c.number,h(E,D,X,K+Le,Ga));let Fe=_a?.allocations;c.lines.push({product:E.id,name:E.name,code:E.code,unit:E.unit,publicPrice:F.publicPrice==null?E.publicPrice:we(ga(F.publicPrice)),...F.regularPublicPrice==null?{}:{regularPublicPrice:F.regularPublicPrice,regularPrice:F.regularPrice,netPrice:F.netPrice,useNet:!!F.useNet,netPriceTarget:F.netPriceTarget},bonusText:F.bonusText||"",qty:K,bonus:Le,price:P,batch:C?Fe.length===1?Fe[0].batch:"":D,expiry:C?Fe.length===1?Fe[0].expiry:"":X,amount:Ve,cost:Ga,...C?{costKnown:ke,inventoryTracked:ke}:{},...Fe?{allocations:Fe}:{}})}c.discount=we(ga(r.discount)),c.discount>k&&G("\u0627\u0644\u062D\u0633\u0645 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629"),!C&&c.discount&&G("\u062D\u0633\u0645 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A: \u0623\u062F\u062E\u0644 \u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629 \u0628\u0639\u062F \u0627\u0644\u062D\u0633\u0645"),c.gross=k,c.total=k-c.discount;let O=0;for(let F of c.lines){let E=O;O+=F.amount,F.netAmount=k?we(c.total*O/k)-we(c.total*E/k):0}let W=c.method==="credit"?C?"1200":"2100":c.method==="bank"?"1110":"1100";if(C?(c.paidAtIssue=c.method==="credit"?we(ga(r.initialPaid)):c.total,c.paidAtIssue>c.total&&G("\u0627\u0644\u0645\u062F\u0641\u0648\u0639 \u0627\u0644\u0622\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0642\u064A\u0645\u0629 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629"),c.remainingAtIssue=c.total-c.paidAtIssue,c.paymentAccount=r.paymentAccount==="bank"?"bank":"cash",c.method==="credit"?(A("1200",c.remainingAtIssue,0,I.id),A(c.paymentAccount==="bank"?"1110":"1100",c.paidAtIssue,0)):A(W,c.total,0)):A(W,0,c.total,c.method==="credit"?I.id:""),C){A("4100",0,c.total),A("5100",U,0);for(let F of c.moves)A(R(S(F.product)),0,-F.value)}else for(let F of c.moves)A(R(S(F.product)),F.value,0)}if(L==="sale_return"||L==="purchase_return"){let C=L==="sale_return",I=u.docs.find(F=>F.id===r.original&&F.kind===(C?"sale":"purchase"));I||G("\u0627\u062E\u062A\u0631 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629"),c.original=I.id,c.party=structuredClone(I.party),c.previousBalance=Wa(u,c.party),c.rep=I.rep,c.method=I.method;let k=C&&r.returnAmount!=null?[]:m(),U=0,O=0;new Set(k.map(F=>F.index)).size!==k.length&&G("\u0628\u0646\u062F \u0645\u0631\u062A\u062C\u0639 \u0645\u0643\u0631\u0631");for(let F of k){let E=I.lines[Number(F.index)];E||G("\u0628\u0646\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629");let K=ga(F.qty),Le=ga(F.bonus);K+Le<=0&&G("\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u0631\u062A\u062C\u0639 \u0645\u0637\u0644\u0648\u0628\u0629");let P=u.docs.filter(pe=>pe.original===I.id).flatMap(pe=>pe.lines).filter(pe=>pe.originalIndex===Number(F.index)),X=P.reduce((pe,oe)=>pe+oe.qty,0),D=P.reduce((pe,oe)=>pe+oe.bonus,0);(X+K>E.qty+1e-7||D+Le>E.bonus+1e-7)&&G("\u0627\u0644\u0645\u0631\u062A\u062C\u0639 \u064A\u062A\u062C\u0627\u0648\u0632 \u0643\u0645\u064A\u0629 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629");let Ve=S(E.product),ke=Number(F.index),_a=I.lines.slice(0,ke).reduce((pe,oe)=>pe+oe.amount,0),Ga=E.netAmount??(I.gross?we(I.total*(_a+E.amount)/I.gross)-we(I.total*_a/I.gross):0),Fe=C&&F.returnTotal!=null?kabMoney(F.returnTotal,"قيمة المرتجع"):C&&F.returnPrice!=null?we(K*kabMoney(F.returnPrice,"سعر المرتجع")):we(Ga*(X+K)/E.qty)-we(Ga*X/E.qty),$e=0;if(C){let pe=r.salesWorkflow?[]:E.allocations||[{batch:E.batch,expiry:E.expiry||"",qty:E.qty+E.bonus,value:E.cost}],oe=0,Pa=X+D,un=Pa+K+Le;for(let ea of pe){let de=Math.min(ea.qty,Math.max(0,Pa-oe)),Jl=Math.min(ea.qty,Math.max(0,un-oe));if(Jl>de){let Wl=we(ea.value*Jl/ea.qty)-we(ea.value*de/ea.qty);h(Ve,ea.batch,ea.expiry||"",Jl-de,Wl),$e+=Wl}oe+=ea.qty}}else $e=p(Ve,E.batch,K+Le,!0);if(U+=Fe,O+=$e,c.lines.push({...E,qty:K,bonus:Le,amount:Fe,cost:$e,returnPrice:F.returnPrice,returnTotal:F.returnTotal,originalIndex:Number(F.index)}),C)A(R(Ve),$e,0),A("5100",0,$e);else{A(R(Ve),0,$e);let pe=$e-Fe;A("5200",Math.max(0,pe),Math.max(0,-pe))}}C&&r.returnAmount!=null&&(U=kabMoney(r.returnAmount,"مبلغ المرتجع"),U<=0&&G("أدخل مبلغ مرتجع أكبر من صفر."));C&&r.salesWorkflow&&U+u.docs.filter(d=>d.kind==="sale_return"&&d.original===I.id).reduce((sum,d)=>sum+d.total,0)>I.total&&G("مجموع المرتجعات يتجاوز قيمة الفاتورة.");c.total=U;let hasAccount=I.method==="credit"||(C&&r.salesWorkflow),W=hasAccount?C?"1200":"2100":I.method==="bank"?"1110":"1100";A(W,C?0:U,C?U:0,hasAccount?c.party.id:""),C&&A("4100",U,0)}if(["receipt","payment","expense","party_opening"].includes(L)){c.total=we(rd(r.total)),c.method=r.method==="bank"?"bank":"cash";let C=c.method==="bank"?"1110":"1100";if(L==="receipt"){let I=N(!0);if(r.invoice){let k=Yi(u,I.id).find(U=>U.id===r.invoice)||G("\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0644\u0627 \u062A\u062A\u0628\u0639 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628");!r.salesWorkflow&&c.total>k.remaining&&G("\u0627\u0644\u062F\u0641\u0639\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0639\u0644\u0649 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629\u061B \u0627\u062E\u062A\u0631 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0645 \u0644\u062A\u0633\u062C\u064A\u0644 \u0631\u0635\u064A\u062F \u0632\u0627\u0626\u062F"),c.invoice=k.id}A(C,c.total,0),A("1200",0,c.total,I.id)}if(L==="payment"){let I=N(!1);A("2100",c.total,0,I.id),A(C,0,c.total)}if(L==="expense"&&(c.note||G("\u0628\u064A\u0627\u0646 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u0645\u0637\u0644\u0648\u0628"),A("5200",c.total,0),A(C,0,c.total)),L==="party_opening"){f();let I=u.parties.find(O=>O.id===r.party)||G("\u0627\u062E\u062A\u0631 \u0627\u0644\u0637\u0631\u0641");c.party=structuredClone(I);let k=r.reverse===!0,U=I.kind==="customer";A(U?"1200":"2100",U!==k?c.total:0,U!==k?0:c.total,I.id),A("3100",U!==k?0:c.total,U!==k?c.total:0)}}if(L==="opening"||L==="adjustment"){f(),L==="adjustment"&&!c.note&&G("\u0633\u0628\u0628 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0645\u0637\u0644\u0648\u0628"),c.total=0;for(let C of m()){let I=S(C.product),k=rd(C.qty),U=ye(C.batch)||"AUTO-"+c.number,O=0;L==="adjustment"&&C.direction==="out"?(O=y(I,ye(C.batch),k,!0).cost,A("5200",O,0),A(R(I),0,O)):(O=we(k*ga(C.price)),h(I,U,C.expiry?Ql(C.expiry):"",k,O),A(R(I),O,0),A(L==="opening"?"3100":"5200",0,O)),c.total+=O,c.lines.push({product:I.id,name:I.name,unit:I.unit,batch:U,qty:k,price:ga(C.price),amount:O,direction:C.direction||"in"})}}if(L==="production"){let C=S(r.output);C.kind!=="finished"&&G("\u0645\u062E\u0631\u062C \u0627\u0644\u062A\u0635\u0646\u064A\u0639 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646\u062A\u062C\u0627\u064B \u062C\u0627\u0647\u0632\u0627\u064B");let I=rd(r.qty),k=0;for(let U of m()){let O=S(U.product);O.kind==="finished"&&G("\u0627\u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0645\u0648\u0627\u062F \u0623\u0648\u0644\u064A\u0629 \u0623\u0648 \u062A\u0639\u0628\u0626\u0629 \u0641\u0642\u0637");let W=rd(U.qty),F=y(O,ye(U.batch),W).cost;k+=F,A(R(O),0,F),c.lines.push({product:O.id,name:O.name,unit:O.unit,batch:ye(U.batch),qty:W,amount:F})}c.overhead=we(ga(r.overhead)),c.overhead&&A(r.method==="bank"?"1110":"1100",0,c.overhead),k+=c.overhead,h(C,ye(r.batch)||"AUTO-"+c.number,r.expiry?Ql(r.expiry):"",I,k),A("1320",k,0),c.output={product:C.id,name:C.name,qty:I,batch:ye(r.batch)||"AUTO-"+c.number,expiry:r.expiry||""},c.total=k}if(L==="journal"){f(),c.note||G("\u0628\u064A\u0627\u0646 \u0627\u0644\u0642\u064A\u062F \u0645\u0637\u0644\u0648\u0628");for(let C of m()){(!Ht.some(U=>U[0]===C.account)||["1200","1310","1320","2100"].includes(C.account))&&G("\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0630\u0645\u0645 \u0648\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u062A\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u0646\u062F\u0627\u062A\u0647\u0627 \u0627\u0644\u0645\u062E\u0635\u0635\u0629");let I=we(ga(C.debit)),k=we(ga(C.credit));I>0==k>0&&G("\u0627\u062E\u062A\u0631 \u0645\u062F\u064A\u0646\u0627\u064B \u0623\u0648 \u062F\u0627\u0626\u0646\u0627\u064B \u0644\u0643\u0644 \u0633\u0637\u0631"),A(C.account,I,k)}c.total=c.entries.reduce((C,I)=>C+I.debit,0)}let $=c.entries.reduce((C,I)=>C+I.debit,0),H=c.entries.reduce((C,I)=>C+I.credit,0);return $!==H&&G("\u0627\u0644\u0642\u064A\u062F \u063A\u064A\u0631 \u0645\u062A\u0648\u0627\u0632\u0646"),!c.entries.length&&!(c.total===0&&(c.moves.length||r.salesWorkflow&&c.lines.length))&&G("\u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0641\u0627\u0631\u063A"),c.costIncomplete=["sale","sale_return"].includes(L)&&c.lines.some(C=>C.costKnown===!1),c.source=structuredClone({...r,id:c.id}),u.docs.push(c),n(Et[L],c.id),u}

const an=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Amman",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date);

function kabRemoveOldExchanges(state) {
  const hasExchange = doc => doc?.kind === "sale_return" && (doc.replacementLines?.length || doc.source?.replacementLines?.length);
  const records = [...state.docs, ...(state.deletedDocs || []).map(item => item.doc), ...(state.history || []).map(item => item.before)];
  if (!records.some(hasExchange)) return state;
  const removed = new Set(records.filter(doc => hasExchange(doc) && doc.source?.isReturn === false).map(doc => doc.id));
  function clean(doc) {
    if (!hasExchange(doc)) return doc;
    const {replacementLines, replacementTotal, ...rest} = doc;
    const {replacementLines: oldLines, isReturn, ...source} = doc.source || {};
    return {...rest, source, entries: replacementTotal ? rest.entries.slice(0, -2) : rest.entries};
  }
  return {...state, docs: state.docs.filter(doc => !removed.has(doc.id) || doc.source?.isReturn !== false).map(clean),
    deletedDocs: (state.deletedDocs || []).filter(item => item.doc.source?.isReturn !== false || !hasExchange(item.doc)).map(item => ({...item, doc: clean(item.doc)})),
    history: (state.history || []).filter(item => item.before?.source?.isReturn !== false || !hasExchange(item.before)).map(item => ({...item, before: clean(item.before)})),
    audit: state.audit.filter(item => !removed.has(item.ref) || state.docs.some(doc => doc.id === item.ref && doc.source?.isReturn !== false))};
}

function gd(state) {
  kabLegacyValidate(state);
  if (state.deletedDocs != null && !Array.isArray(state.deletedDocs)) {
    throw Error("قائمة المستندات المحذوفة غير صالحة.");
  }
  const documents = [...state.docs, ...(state.deletedDocs || []).map(record => record?.doc)];
  for (const doc of documents) {
    if (!doc || typeof doc.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(doc.date)) {
      throw Error("يوجد مستند بتاريخ غير صالح في ملف البيانات.");
    }
    Ql(doc.date);
    if (typeof doc.number !== "string" || !doc.number.trim() || typeof doc.kind !== "string"
      || !Number.isSafeInteger(doc.total) || doc.total < 0
      || !Array.isArray(doc.lines) || doc.lines.some(line => !line || typeof line !== "object")) {
      throw Error("يوجد مستند غير مكتمل أو مبلغ غير صالح في ملف البيانات.");
    }
  }
}

function kabDigits(value) {
  return String(value ?? "").replace(/[٠-٩۰-۹]/g, digit => {
    const point = digit.charCodeAt(0);
    return String(point >= 0x6f0 ? point - 0x6f0 : point - 0x660);
  });
}

function kabMoney(value, label = "المبلغ") {
  const text = kabDigits(value).trim().replace(/٬/g, ",").replace(/[\u00a0\u202f]/g, " ");
  if (text === "") return 0;
  const plain = /^\d+$/.test(text);
  const grouped = /^\d{1,3}([,. ])\d{3}(?:\1\d{3})*$/.test(text);
  if (!plain && !grouped) throw Error(label + " غير صالح. اكتب مبلغاً مثل 18,500.");
  const amount = Number(text.replace(/[,. ]/g, ""));
  if (!Number.isSafeInteger(amount) || amount > 1e12) throw Error(label + " خارج المجال المسموح.");
  return amount;
}

function kabPercent(value) {
  const text = kabDigits(value).trim().replace(/[٫,]/g, ".");
  if (!text) return 0;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text) || Number(text) > 100) {
    throw Error("أدخل نسبة من 0 إلى 100.");
  }
  return Number(text);
}

function kabPartyLabel(party) {
  if (!party) return "—";
  return party.name + (party.area ? " (" + party.area + ")" : "");
}

function kabOrder(left, right) {
  return left.date.localeCompare(right.date)
    || String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
    || (left.createdOrder || 0) - (right.createdOrder || 0);
}

function kabNextDocumentNumber(state, kind) {
  const prefix = kind === "sale" ? "KAB-" : kind === "receipt" ? "REC-" : "DOC-";
  const deleted = (state.deletedDocs || []).map(item => item.doc);
  let largest = 0;
  for (const doc of [...state.docs, ...deleted]) {
    if (doc.number?.startsWith(prefix) && (kind !== "sale" || doc.kind === "sale")) {
      const number = Number(doc.number.slice(prefix.length));
      if (Number.isSafeInteger(number)) largest = Math.max(largest, number);
    }
  }
  return prefix + String(largest + 1).padStart(6, "0");
}

function kabProject(state) {
  const bills = new Map();
  const parties = new Map();
  const cashByMonth = new Map();
  const collectorReceipts = [];
  function account(id) {
    if (!parties.has(id)) parties.set(id, {bills: [], wallet: [], opening: 0, nextUnpaid: 0});
    return parties.get(id);
  }
  function cash(date, amount) {
    const month = date.slice(0, 7);
    cashByMonth.set(month, (cashByMonth.get(month) || 0) + amount);
  }
  function apply(bill, lot) {
    const value = Math.min(bill.remaining, lot.amount);
    if (value > 0) {
      bill.allocations.push({...lot, amount: value});
      bill.remaining -= value;
      lot.amount -= value;
    }
    return value;
  }
  function credit(customer, lot) {
    if (lot.amount > 0) {
      customer.wallet.push(lot);
      customer.wallet.sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  function collect(customer, lot, target) {
    if (target) {
      target.paymentRecorded = true;
      apply(target, lot);
    }
    const openingPaid = Math.min(lot.amount, customer.opening);
    customer.opening -= openingPaid;
    lot.amount -= openingPaid;
    while (lot.amount > 0 && customer.nextUnpaid < customer.bills.length) {
      const bill = customer.bills[customer.nextUnpaid];
      if (apply(bill, lot) > 0) bill.paymentRecorded = true;
      if (bill.remaining > 0) break;
      customer.nextUnpaid++;
    }
    credit(customer, lot);
  }
  for (const doc of [...state.docs].sort(kabOrder)) {
    const id = doc.party?.id;
    if (!id || doc.party.kind !== "customer") continue;
    const customer = account(id);
    if (doc.kind === "sale") {
      const bill = {
        id: doc.id, doc, party: id, total: doc.total, net: doc.total, returned: 0,
        remaining: doc.total, allocations: [], creditAtIssue: 0, returns: [],
        previousBalance: customer.opening + customer.bills.reduce((sum, item) => sum + item.remaining, 0)
          - customer.wallet.reduce((sum, lot) => sum + lot.amount, 0)
      };
      const paid = doc.paidAtIssue ?? (doc.method === "credit" ? 0 : doc.total);
      if (paid > 0) {
        const lot = {amount: paid, date: doc.date, cash: true};
        cash(doc.date, paid);
        apply(bill, lot);
        credit(customer, lot);
      }
      for (const lot of doc.source?.includePreviousBalance === false ? [] : customer.wallet) {
        if (bill.remaining <= 0) break;
        bill.creditAtIssue += apply(bill, lot);
      }
      customer.wallet = customer.wallet.filter(lot => lot.amount > 0);
      customer.bills.push(bill);
      bills.set(doc.id, bill);
    } else if (doc.kind === "receipt") {
      cash(doc.date, doc.total);
      if (doc.collector) collectorReceipts.push(doc);
      const target = bills.get(doc.invoice);
      collect(customer, {amount: doc.total, date: doc.date, cash: true}, target?.party === id ? target : null);
    } else if (doc.kind === "party_opening") {
      const change = doc.entries.filter(entry => entry.account === "1200" && entry.party === id)
        .reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
      if (change < 0) credit(customer, {amount: -change, date: doc.date, cash: false});
      else customer.opening += change;
    } else if (doc.kind === "return_credit") {
      const bill = bills.get(doc.invoice);
      if (!bill || bill.party !== id) continue;
      let left = doc.total;
      for (const lot of customer.wallet) {
        if (!lot.returnCredit || !left) continue;
        const applied = apply(bill, {...lot, appliedReturnCredit: true, amount: Math.min(left, lot.amount)});
        lot.amount -= applied;
        left -= applied;
        if (applied) bill.paymentRecorded = true;
      }
      customer.wallet = customer.wallet.filter(lot => lot.amount > 0);
    } else if (doc.kind === "sale_return") {
      if (!doc.original) {
        credit(customer, {amount: doc.total, date: doc.date, cash: false, returnCredit: true, returnDocument: doc});
        continue;
      }
      const bill = bills.get(doc.original);
      if (!bill) continue;
      bill.returns.push(doc);
      const refund = doc.entries.filter(entry => ["1100", "1110"].includes(entry.account))
        .reduce((sum, entry) => sum + entry.credit - entry.debit, 0);
      if (refund > 0) cash(doc.date, -refund);
      bill.returned += doc.total;
      bill.net = Math.max(0, bill.total - bill.returned);
      const paidBefore = bill.allocations.reduce((sum, lot) => sum + lot.amount, 0);
      let excess = Math.max(0, paidBefore - bill.net);
      let refundLeft = refund;
      for (let i = bill.allocations.length - 1; i >= 0 && excess > 0; i--) {
        const lot = bill.allocations[i];
        const released = Math.min(excess, lot.amount);
        const refunded = Math.min(released, refundLeft);
        refundLeft -= refunded;
        lot.amount -= released;
        excess -= released;
        credit(customer, {...lot, appliedReturnCredit: false, amount: released - refunded});
      }
      bill.allocations = bill.allocations.filter(lot => lot.amount > 0);
      bill.remaining = Math.max(0, bill.net - bill.allocations.reduce((sum, lot) => sum + lot.amount, 0));

    }
  }
  for (const bill of bills.values()) {
    bill.paid = bill.net - bill.remaining;
    bill.returnCreditApplied = bill.allocations.reduce((sum, lot) => sum + (lot.appliedReturnCredit ? lot.amount : 0), 0);
    bill.cashPaid = bill.allocations.reduce((sum, lot) => sum + (lot.cash ? lot.amount : 0), 0);
    const waiting = bill.doc.source?.deliveryReviewed === false && !bill.paymentRecorded;
    bill.status = waiting ? "pending" : bill.remaining <= 0 ? "settled" : bill.paid > 0 ? "partial"
      : bill.doc.source?.debtConfirmed ? "debt" : "pending";
  }
  return {bills, parties, cashByMonth, collectorReceipts};
}

function Yi(state, partyId) {
  return [...kabProject(state).bills.values()].filter(bill => !partyId || bill.party === partyId);
}

function kabCustomerDocument(state, payload, actor, replay) {
  const date = Ql(payload.date);
  if (!replay && state.settings.closedThrough && date <= state.settings.closedThrough) throw Error("الفترة المحاسبية مقفلة.");
  const party = state.parties.find(item => item.id === payload.party && item.kind === "customer");
  if (!party) throw Error("اختر الصيدلية.");
  const doc = {id: payload.id || crypto.randomUUID(), number: replay?.number || kabNextDocumentNumber(state, payload.kind),
    kind: payload.kind, date, createdAt: new Date().toISOString(), createdBy: actor, party: structuredClone(party),
    company: structuredClone(state.settings), note: String(payload.note || "").trim(), entries: [], moves: [], lines: [],
    source: structuredClone(payload)};
  doc.source.id = doc.id;
  if (doc.kind === "sale_return") {
    doc.lines = (payload.lines || []).map(line => {
      const product = state.products.find(item => item.id === line.product && item.kind === "finished");
      const qty = kabMoney(line.qty, "العدد");
      const price = kabMoney(line.price, "السعر");
      if (!product || !qty) throw Error("اختر الصنف والعدد.");
      return {product: product.id, name: line.name || product.name, unit: line.unit || product.unit, qty, price, publicPrice: line.publicPrice == null || line.publicPrice === "" ? product.publicPrice : kabMoney(line.publicPrice, "سعر العموم"), amount: qty * price};
    });
    doc.total = doc.lines.reduce((sum, line) => sum + line.amount, 0);
    if (!Number.isSafeInteger(doc.total) || doc.total <= 0) throw Error("أدخل أصنافاً بقيمة مرتجع صحيحة.");
    doc.source.lines = structuredClone(doc.lines);
    doc.entries = [{account: "4100", party: "", debit: doc.total, credit: 0},
      {account: "1200", party: party.id, debit: 0, credit: doc.total}];
  } else {
    doc.invoice = payload.invoice;
    doc.total = kabMoney(payload.total);
    const projected = kabProject({...state, docs: state.docs.filter(item => item.date <= date)});
    const bill = projected.bills.get(doc.invoice);
    const available = (projected.parties.get(party.id)?.wallet || []).reduce((sum, lot) => sum + (lot.returnCredit ? lot.amount : 0), 0);
    if (!bill || bill.party !== party.id || !doc.total || doc.total > Math.min(available, bill.remaining)) {
      throw Error("المبلغ لازم يكون ضمن رصيد المرتجعات والمتبقي على الفاتورة.");
    }
  }
  let order = state.docs.length + (state.deletedDocs?.length || 0);
  for (const existing of [...state.docs, ...(state.deletedDocs || []).map(item => item.doc)]) {
    if (Number.isSafeInteger(existing.createdOrder)) order = Math.max(order, existing.createdOrder);
  }
  doc.createdOrder = replay && Number.isSafeInteger(payload.createdOrder) ? payload.createdOrder : order + 1;
  doc.source.createdOrder = doc.createdOrder;
  return {...state, docs: [...state.docs, doc], audit: [...state.audit, {
    id: crypto.randomUUID(), at: doc.createdAt, actor, ref: doc.id, what: doc.kind === "return_credit" ? "تطبيق رصيد مرتجع" : "مرتجع مستقل"
  }]};
}

function Qi(state, action, actor, replay) {
  state = kabRemoveOldExchanges(state);
  const payload = action.payload || {};
  if (!state.members.some(person => person.email.toLowerCase() === actor.toLowerCase())) throw Error("لا توجد صلاحية.");
  if (action.type === "exchange_note" || action.type === "exchange_note_delete") {
    if (!state.members.some(person => person.email.toLowerCase() === actor.toLowerCase() && person.role === "admin")) throw Error("القسم خاص بالإدارة.");
    const notes = state.exchangeNotes || [];
    const current = notes.find(item => item.id === payload.id);
    if (payload.id && !current) throw Error("فاتورة التبديل غير موجودة.");
    if (action.type === "exchange_note_delete") return {...state, exchangeNotes: notes.filter(item => item.id !== payload.id)};
    const party = state.parties.find(item => item.id === payload.party && item.kind === "customer");
    if (!party) throw Error("اختر الصيدلية.");
    const lines = (payload.lines || [{product: payload.product, qty: payload.qty}]).filter(line => line.product).map(line => {
      const product = state.products.find(item => item.id === line.product && item.kind === "finished");
      const qty = kabMoney(line.qty, "العدد");
      if (!product || !qty) throw Error("اختر الصنف والعدد.");
      return {product: product.id, name: product.name, qty};
    });
    if (!lines.length) throw Error("أضف صنفاً واحداً على الأقل.");
    const record = {id: current?.id || crypto.randomUUID(), date: current?.date || an(),
      partyId: party.id, party: kabPartyLabel(party), lines, note: String(payload.note || "").trim()};
    return {...state, exchangeNotes: current ? notes.map(item => item.id === current.id ? record : item) : [...notes, record]};
  }
  if (action.type === "document" && ((payload.kind === "sale_return" && !payload.original) || payload.kind === "return_credit")) {
    return kabCustomerDocument(state, payload, actor, replay);
  }
  if (action.type === "document" && payload.salesWorkflow && (payload.original || payload.invoice)) {
    const linked = state.docs.find(doc => doc.id === (payload.original || payload.invoice));
    if (linked && payload.date < linked.date) throw Error("تاريخ الحركة يجب أن يكون في يوم الفاتورة أو بعده.");
  }
  const next = kabLegacyApply(state, action, actor, replay);
  if (action.type === "document") {
    const doc = next.docs.at(-1);
    let order = state.docs.length + (state.deletedDocs?.length || 0);
    for (const existing of [...state.docs, ...(state.deletedDocs || []).map(record => record.doc)]) {
      if (Number.isSafeInteger(existing.createdOrder)) order = Math.max(order, existing.createdOrder);
    }
    doc.createdOrder = replay && Number.isSafeInteger(payload.createdOrder) ? payload.createdOrder : order + 1;
    doc.source.createdOrder = doc.createdOrder;
    if (doc.kind === "receipt" && payload.receivedBy) {
      const receiver = state.reps.find(person => person.id === payload.receivedBy);
      const sale = state.docs.find(item => item.id === doc.invoice);
      if (!receiver || !sale) throw Error("اختر فاتورة واسم الشخص الذي قبض الدفعة.");
      doc.receivedBy = structuredClone(receiver);
      if (sale.distributor?.id !== receiver.id) {
        const before = kabProject({...state, docs: state.docs.filter(item => item.date <= doc.date)}).bills.get(sale.id);
        if (!receiver.isCollector || !before || !["debt", "partial"].includes(before.status) || doc.total > before.remaining) {
          throw Error("دفعة المحصّل لازم تكون على فاتورة مديونة وبحدود المتبقي عليها.");
        }
        doc.collector = structuredClone(receiver);
      }
    }
  }
  if (action.type === "document_edit" && payload.returning) {
    const invoice = next.docs.find(doc => doc.id === payload.id && doc.kind === "sale");
    if (!invoice) throw Error("اختر فاتورة مبيعات.");
    const lines = payload.returning.lines?.map(line => {
      const index = invoice.source.lines.findIndex(item => item.sourceIndex === line.index);
      if (index < 0 || invoice.lines[index]?.product !== line.product) {
        throw Error("صنف المرتجع تغيّر أثناء تعديل الفاتورة. احفظ تعديل الأصناف ثم اختر المرتجع.");
      }
      return {...line, index};
    });
    const afterReturn = Qi(next, {type: "document", payload: {
      kind: "sale_return", salesWorkflow: true, original: invoice.id, date: payload.returning.date,
      ...(lines ? {lines} : {returnAmount: kabMoney(payload.returning.total, "مبلغ المرتجع")})
    }}, actor);
    return payload.receipt
      ? Qi(afterReturn, {type: "document", payload: {
        kind: "receipt", salesWorkflow: true, invoice: invoice.id, party: invoice.party.id,
        date: payload.receipt.date, method: payload.receipt.method, total: payload.receipt.total, receivedBy: payload.receipt.receivedBy
      }}, actor) : afterReturn;
  }
  if (action.type === "document_edit" && payload.receipt) {
    const invoice = next.docs.find(doc => doc.id === payload.id && doc.kind === "sale");
    if (!invoice) throw Error("اختر فاتورة مبيعات لتسجيل الدفعة.");
    const {date, method} = payload.receipt;
    const total = kabMoney(payload.receipt.total, "المبلغ المقبوض");
    if (total <= 0) throw Error("أدخل مبلغ دفعة أكبر من صفر.");
    return Qi(next, {type: "document", payload: {
      kind: "receipt", salesWorkflow: true, invoice: invoice.id, party: invoice.party.id, date, method, total, receivedBy: payload.receipt.receivedBy
    }}, actor);
  }
  if (action.type === "product") {
    const product = payload.id ? next.products.find(item => item.id === payload.id) : next.products.at(-1);
    const old = state.products.find(item => item.id === product.id);
    if (old?.archived) product.archived = true;
    product.netOverride = Object.hasOwn(payload, "netOverride")
      ? (kabDigits(payload.netOverride).trim() ? kabMoney(payload.netOverride, "السعر الصافي") : null)
      : old?.netOverride ?? null;
  } else if (action.type === "rep") {
    const person = payload.id ? next.reps.find(item => item.id === payload.id) : next.reps.at(-1);
    const old = state.reps.find(item => item.id === person.id);
    person.isRep = payload.isRep ?? old?.isRep ?? true;
    person.isDistributor = payload.isDistributor ?? old?.isDistributor ?? false;
    person.isCollector = payload.isCollector ?? old?.isCollector ?? false;
    if (!person.isRep && !person.isDistributor && !person.isCollector) throw Error("اختر دوراً واحداً على الأقل.");
    person.repRate = kabPercent(payload.repRate ?? old?.repRate);
    person.distRate = kabPercent(payload.distRate ?? old?.distRate);
    person.collectorRate = kabPercent(payload.collectorRate ?? old?.collectorRate);
    if (old?.archived) person.archived = true;
  } else if (action.type === "party") {
    const party = payload.id ? next.parties.find(item => item.id === payload.id) : next.parties.at(-1);
    const old = state.parties.find(item => item.id === party.id);
    if (old?.archived) party.archived = true;
    if (party.kind === "customer") {
      const governorate = String(payload.governorate ?? old?.governorate ?? "").trim().replace(/\s+/g, " ");
      const names = [...new Set([...(state.governorates || []), ...state.parties.map(item => item.governorate).filter(Boolean)])];
      party.governorate = names.find(name => name.toLowerCase() === governorate.toLowerCase()) || governorate;
      if (party.governorate && !names.includes(party.governorate)) names.push(party.governorate);
      next.governorates = names;
    }
  } else if (action.type === "document" && payload.kind === "sale") {
    const doc = next.docs.at(-1);
    doc.source.deliveryReviewed = replay ? payload.deliveryReviewed : false;
    doc.source.debtConfirmed = replay ? !!payload.debtConfirmed : false;
    for (const [role, label] of [["distributor", "الموزّع"]]) {
      if (!payload[role]) continue;
      const person = next.reps.find(item => item.id === payload[role]);
      if (!person) throw Error("اختر " + label + " من القائمة.");
      doc[role] = structuredClone(person);
    }
  }
  return next;
}

function kabLocalPacket(raw) {
  const packet = JSON.parse(raw);
  if (packet?.format !== "kab-finance-local" || typeof packet.id !== "string"
    || typeof packet.actor !== "string" || !Number.isSafeInteger(packet.version) || packet.version < 0 || packet.actor !== packet.state?.settings?.owner) {
    throw Error("ملف البيانات المحلية غير صالح.");
  }
  gd(packet.state);
  return packet;
}

const tn=new TextEncoder;

const fL=20*1024*1024;

function kabLegacyValidate(e){if(!e||typeof e!="object"||!e.settings||typeof e.settings.company!="string"||!["products","parties","reps","docs","audit","members"].every(a=>Array.isArray(e[a])))throw Error("\u0628\u0646\u064A\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");if(tn.encode(JSON.stringify(e)).length>fL)throw Error("\u0648\u0635\u0644\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u0645\u062F\u0639\u0648\u0645 \u062D\u0627\u0644\u064A\u0627\u064B (20 \u0645\u064A\u063A\u0627\u0628\u0627\u064A\u062A). \u0627\u062D\u062A\u0641\u0638 \u0628\u0646\u0633\u062E\u0629 \u0642\u0628\u0644 \u062A\u0631\u0642\u064A\u0629 \u0627\u0644\u0646\u0638\u0627\u0645.");for(let a of["products","parties","reps","docs"])if(e[a].some(t=>!t||typeof t.id!="string")||new Set(e[a].map(t=>t.id)).size!==e[a].length)throw Error("\u064A\u0648\u062C\u062F \u0633\u062C\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0631\u0642\u0645 \u0645\u0643\u0631\u0631 \u0641\u064A \u0645\u0644\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.");for(let a of e.docs){if(!Array.isArray(a.entries)||!Array.isArray(a.moves)||!Array.isArray(a.lines))throw Error("\u0623\u062D\u062F \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644.");let t=0;for(let l of a.entries){if(!Ht.some(u=>u[0]===l.account)||!Number.isSafeInteger(l.debit)||!Number.isSafeInteger(l.credit)||l.debit<0||l.credit<0)throw Error("\u0642\u064A\u062F \u0645\u062D\u0627\u0633\u0628\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.");t+=l.debit-l.credit}if(t!==0)throw Error("\u064A\u0648\u062C\u062F \u0642\u064A\u062F \u0645\u062D\u0627\u0633\u0628\u064A \u063A\u064A\u0631 \u0645\u062A\u0648\u0627\u0632\u0646.");for(let l of a.moves)if(!Number.isFinite(l.qty)||!Number.isSafeInteger(l.value))throw Error("\u062D\u0631\u0643\u0629 \u0645\u062E\u0632\u0648\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.")}if(cd(e).some(a=>a.qty<-1e-6||a.value<0))throw Error("\u064A\u0648\u062C\u062F \u0645\u062E\u0632\u0648\u0646 \u0633\u0627\u0644\u0628 \u0641\u064A \u0627\u0644\u0645\u0644\u0641.")}
export { Qi as applyAction, gd as validateState, aL as emptyState, kabLocalPacket as parsePacket, kabProject as projectState };
