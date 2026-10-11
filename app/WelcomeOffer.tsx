"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAppPathname } from "@/lib/use-app-pathname";
import { welcomeRouteAllowed, welcomeVisit } from "@/lib/welcome-visit";

type Offer = { code: string; percent: number; minimum: number; maximum: number; saleItems: boolean; expiresAt: string | null };

export default function WelcomeOffer() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const pathname = useAppPathname();
  const pathRef = useRef(pathname);
  useEffect(()=>{ pathRef.current=pathname; },[pathname]);
  const [offer, setOffer] = useState<(Offer & {path: string}) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismissed = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    let busy = false;
    const controller = new AbortController();
    // A visit is this browser tab's session. Reloads and page navigation keep it.
    let storage: Pick<Storage,"getItem"|"setItem">;
    try { storage = window.sessionStorage; } catch { storage = { getItem:()=>null, setItem:()=>{} }; }
    const visit = welcomeVisit(storage, Date.now());
    if (visit.shown || dismissed.current) return;
    const readyAt = Date.now() + visit.remaining;

    async function maybeOpen() {
      if (!alive || busy || dismissed.current || Date.now() < readyAt || document.visibilityState !== "visible"
        || !welcomeRouteAllowed(pathRef.current) || document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
      busy = true;
      try {
        const session = await fetch("/api/customer/me", { cache:"no-store", credentials:"include", signal:controller.signal });
        const guest = session.status === 401 || (session.ok && (await session.json()).authenticated === false);
        // A remembered account also excludes logged-out customers from signup marketing.
        let rememberedAccount = false;
        try { rememberedAccount = !!JSON.parse(localStorage.getItem("kab_user") || "null")?.id; } catch { /* optional hint */ }
        if (!guest || rememberedAccount) { dismissed.current=true; window.clearInterval(timer); return; }
        const response = await fetch("/api/welcome-offer", { cache:"no-store", signal:controller.signal });
        if (!response.ok) return;
        const result = await response.json();
        if (alive && !dismissed.current && result.offer && welcomeRouteAllowed(pathRef.current) && document.visibilityState === "visible" && !document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) {
          visit.markShown(); dismissed.current = true; setOffer({...result.offer,path:pathRef.current});
          window.clearInterval(timer);
        }
      } catch { /* Unverified session or unavailable offer: show nothing. */ }
      finally { busy = false; }
    }
    // No session/offer request on initial load, and no image download before opening.
    const delay = window.setTimeout(()=>{ void maybeOpen(); timer=window.setInterval(()=>void maybeOpen(),15_000); },visit.remaining);
    const onVisible = () => { void maybeOpen(); };
    window.addEventListener("focus",onVisible);
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{ alive=false; controller.abort(); window.clearTimeout(delay);window.clearInterval(timer);window.removeEventListener("focus",onVisible);document.removeEventListener("visibilitychange",onVisible); };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!offer || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = "hidden";
    const controller = new AbortController();
    async function recheckSession() {
      try {
        const response = await fetch("/api/customer/me",{cache:"no-store",credentials:"include",signal:controller.signal});
        if(response.ok && (await response.json()).authenticated === true) setOffer(null);
      } catch { /* A network failure does not assert authentication. */ }
    }
    function accountChanged(event: StorageEvent) {
      if(event.key === "kab_user" && event.newValue) {
        try { if(JSON.parse(event.newValue)?.id) setOffer(null); } catch { /* Ignore malformed storage. */ }
      }
    }
    window.addEventListener("focus",recheckSession);
    window.addEventListener("storage",accountChanged);
    return ()=>{ controller.abort();window.removeEventListener("focus",recheckSession);window.removeEventListener("storage",accountChanged);dialog.close();document.body.style.overflow=previousOverflow;previousFocus?.focus(); };
  }, [offer, pathname]);

  const close = () => setOffer(null);
  if (!offer || pathname !== offer.path) return null;
  return (
    <dialog ref={dialogRef} aria-labelledby="welcome-title" dir="ltr" onCancel={close}
      onClick={e=>{ if(e.target === e.currentTarget) close(); }}
      className="kab-welcome-dialog fixed inset-0 m-auto max-h-[90svh] w-[calc(100%-32px)] max-w-[960px] overflow-y-auto border-0 bg-white p-0 text-[#142019] shadow-2xl backdrop:bg-black/45">
      <div className="relative grid min-w-0 md:min-h-[540px] md:grid-cols-[1.15fr_1fr]">
        <button type="button" autoFocus onClick={close} aria-label={ar ? "إغلاق عرض الترحيب" : "Close welcome offer"}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl focus-visible:outline-2 focus-visible:outline-green-800">×</button>
        <div className="relative h-[220px] min-w-0 bg-[#f5f3ed] sm:h-[280px] md:h-auto">
          <Image src="/images/kab-welcome-skincare.webp" alt={ar ? "كريم وزيت للعناية بالبشرة" : "Skincare cream and botanical oil"} fill sizes="(max-width:768px) 92vw, 520px" className="object-contain p-3 md:p-0" />
        </div>
        <div dir={ar ? "rtl" : "ltr"} className="flex min-w-0 flex-col px-6 pb-7 pt-7 sm:px-10 sm:py-10 md:justify-center md:py-14">
          <p className="mb-4 text-[11px] font-semibold tracking-[.14em]">KAB PHARMA</p>
          <h2 id="welcome-title" className="text-[27px] font-semibold leading-tight sm:text-[32px]">{ar ? `انضم إلينا واحصل على خصم ${offer.percent}٪.` : `Join Us and Receive ${offer.percent}% Off.`}</h2>
          <p className="mt-5 text-sm leading-7 text-[#526058]">{ar ? "أنشئ حسابك واستمتع بخصم على طلبك الأول، واحفظ مفضلتك وتابع طلباتك بسهولة." : "Create your account and enjoy a discount on your first order. Keep your favorites close and follow your orders easily."}</p>
          <Link href="/signup" onClick={close} className="mt-6 flex min-h-12 items-center justify-center rounded-full border border-[#142019] px-5 text-sm font-medium transition hover:bg-[#142019] hover:text-white">{ar ? "إنشاء حساب" : "Create Account"}</Link>
          <p className="mt-3 text-xs leading-6 text-[#526058]">{ar ? "بعد إنشاء حسابك، استخدم الكود " : "After creating your account, use "}<strong className="font-semibold">{offer.code}</strong>{ar ? " عند الدفع." : " at checkout."}</p>
          <details className="mt-3 text-xs leading-6 text-[#526058]">
            <summary className="cursor-pointer underline underline-offset-2">{ar ? "تطبق الشروط والأحكام" : "T&Cs apply."}</summary>
            <p className="mt-2">{ar ? `استخدم ${offer.code} عند الدفع. للطلب الأول فقط، مرة واحدة لكل حساب. الطلبات الملغية والمرفوضة لا تُحتسب. الطلب القائم يحجز حق الاستخدام.` : `Enter ${offer.code} at checkout. First order only, once per account. Cancelled and rejected orders do not count. An active order reserves eligibility.`}</p>
            {offer.minimum > 0 && <p>{ar ? "الحد الأدنى للطلب: " : "Minimum order: "}{offer.minimum.toLocaleString(lang)} SYP</p>}
            {offer.maximum > 0 && <p>{ar ? "الحد الأقصى للخصم: " : "Maximum discount: "}{offer.maximum.toLocaleString(lang)} SYP</p>}
            {!offer.saleItems && <p>{ar ? "لا يشمل المنتجات المخفضة." : "Excludes items on sale."}</p>}
            <p>{ar ? "العروض التلقائية لا تُجمع مع الكوبون إلا إذا سمحت شروطها." : "Automatic promotions combine with this coupon only when that promotion allows it."}</p>
            {offer.expiresAt && <p>{ar ? "ينتهي: " : "Expires: "}{new Date(offer.expiresAt).toLocaleString(lang)}</p>}
          </details>
          <p className="mt-7 text-xs text-[#526058]">{ar ? "لديك حساب بالفعل؟ " : "Already have an account? "}<Link href="/login" onClick={close} className="underline underline-offset-2">{ar ? "تسجيل الدخول" : "Log in"}</Link></p>
        </div>
      </div>
    </dialog>
  );
}
