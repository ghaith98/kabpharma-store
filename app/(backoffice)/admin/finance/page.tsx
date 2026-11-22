"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FinancePage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [html,setHtml] = useState("");
  const [error,setError] = useState("");
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    let active=true;
    const controllers=new Set<AbortController>();
    async function api(path: string,method="GET",body?: unknown) {
      const {data,error}=await supabase.auth.getSession();
      if(error || !data.session?.access_token) throw Object.assign(new Error("سجّل الدخول بحساب الأدمن لفتح المحاسبة."),{code:"AUTH"});
      const controller=new AbortController();controllers.add(controller);
      const timer=setTimeout(()=>controller.abort(),60000);
      try {
        const response=await fetch(path,{
          method,cache:"no-store",signal:controller.signal,
          headers:{Authorization:`Bearer ${data.session.access_token}`, ...(method==="POST"?{"Content-Type":"application/json"}:{})},
          ...(body!==undefined?{body:JSON.stringify(body)}:{}),
        });
        const result=await response.json().catch(()=>null);
        if(!response.ok)throw Object.assign(new Error(result?.error || "تعذّر الاتصال بالمحاسبة."),{code:result?.code});
        return result;
      } finally{clearTimeout(timer);controllers.delete(controller);}
    }
    function receive(event: MessageEvent) {
      if(event.source!==frame.current?.contentWindow || event.origin!=="null")return;
      if(event.data?.type==="kab-finance-close"){window.location.assign('/admin');return;}
      if(event.data?.type!=="kab-finance-request" || typeof event.data.id!=="string")return;
      const {id,method,body,mode}=event.data;
      if(!["GET","POST"].includes(method) || (method==="GET" && mode!==undefined && mode!=="status" && mode!=="records"))return;
      const query=new URLSearchParams();
      if(mode)query.set("mode",mode);
      if(mode==="records"){
        if(typeof body?.after==="string")query.set("after",body.after);
        if(Number.isSafeInteger(body?.version))query.set("version",String(body.version));
      }
      const path="/api/admin/finance"+(query.size?"?"+query.toString():"");
      void api(path,method,method==="POST"?body:undefined).then(result=>{
        if(active)frame.current?.contentWindow?.postMessage({type:"kab-finance-result",id,result},"*");
      }).catch(failure=>{
        if(active)frame.current?.contentWindow?.postMessage({type:"kab-finance-result",id,error:failure.message,code:failure.code},"*");
      });
    }
    window.addEventListener("message",receive);
    void api("/api/admin/finance/app").then(result=>{if(active)setHtml(result.html);}).catch(failure=>{if(active)setError(failure.message);});
    const {data:listener}=supabase.auth.onAuthStateChange((event)=>{
      if(event==="SIGNED_OUT"){setHtml("");setError("انتهت الجلسة. سجّل الدخول مجدداً.");}
    });
    return()=>{active=false;window.removeEventListener("message",receive);listener.subscription.unsubscribe();controllers.forEach(controller=>controller.abort());};
  },[attempt]);
  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f5f7f8]" dir="rtl">
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3 text-sm">
      <strong>محاسبة كاب فارما</strong><Link href="/admin" className="font-bold text-[#0a583b]">العودة إلى لوحة الإدارة</Link>
    </div>
    {error ? <div role="alert" className="m-auto max-w-xl space-y-4 p-8 text-center"><p>{error}</p><button onClick={()=>{setError("");setAttempt(value=>value+1);}} className="rounded-xl bg-[#0a583b] px-5 py-3 text-white">إعادة المحاولة</button></div>
      : html ? <iframe ref={frame} title="محاسبة كاب فارما" srcDoc={html}
          sandbox="allow-scripts allow-forms allow-modals allow-downloads allow-popups"
          referrerPolicy="no-referrer" className="block min-h-0 w-full flex-1 border-0" />
        : <p role="status" className="p-10 text-center">جارٍ فتح المحاسبة…</p>}
  </main>;
}
