"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LoaderCircle, ExternalLink, X } from "lucide-react";
import { deliveryLocationUrl, normalizeDeliveryLocation, parseDeliveryPoint, type DeliveryEstimate, type DeliveryLocation } from "@/lib/delivery-location";

export default function DeliveryLocationInput({ value, onChange, isArabic, estimate, onResolved }: {
  value: DeliveryLocation | null; onChange: (location: DeliveryLocation | null) => void; isArabic: boolean; estimate?: DeliveryEstimate | null; onResolved?: (estimate: DeliveryEstimate | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState(value && "url" in value ? value.url : "");
  const request = useRef(0);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const linkRef = useRef<HTMLInputElement>(null);
  const t = (en: string, ar: string) => isArabic ? ar : en;
  useEffect(() => () => { request.current++; }, []);

  const latitude = value && "latitude" in value ? value.latitude : null;
  const longitude = value && "longitude" in value ? value.longitude : null;
  useEffect(() => {
    if (latitude === null || longitude === null || !onResolved) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRouteBusy(true); setRouteError("");
      try {
        const response = await fetch("/api/customer/delivery-location", {
          method: "POST", credentials: "include", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({location: {latitude, longitude}, language: isArabic ? "ar" : "en", receipt: estimate?.receipt}), signal: controller.signal,
        });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !result.success) throw new Error(result.code || "DELIVERY_PROVIDER_UNAVAILABLE");
        onResolved({...result.delivery, receipt: result.receipt});
      } catch (problem) {
        if (controller.signal.aborted) return;
        onResolved(null);
        const code = problem instanceof Error ? problem.message : "";
        setRouteError(code === "DELIVERY_OUTSIDE_SYRIA"
          ? t("Please select a delivery location in Syria.", "يرجى اختيار موقع توصيل داخل سوريا.")
          : code === "DELIVERY_RETRY_LATER"
            ? t("Too many location requests. Please wait and try again.", "طلبات تحديد الموقع كثيرة. انتظر قليلاً وحاول مجدداً.")
            : t("Could not calculate the delivery route. Please retry or contact us.", "تعذّر حساب طريق التوصيل. أعد المحاولة أو تواصل معنا."));
      } finally { if (!controller.signal.aborted) setRouteBusy(false); }
    }, 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
    // The receipt changes on success; including it would cause a request loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, isArabic, onResolved, attempt]);

  function locate() {
    const token = ++request.current;
    setError("");
    if (!window.isSecureContext || !navigator.geolocation) {
      setError(t("Location is unavailable. Paste a Google Maps link instead.", "تحديد الموقع غير متاح. يمكنك لصق رابط الموقع من Google Maps."));
      return;
    }
    onChange(null);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (request.current !== token) return;
      setBusy(false);
      const location = normalizeDeliveryLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
      if (!location) { setError(t("Could not read your location. Try again.", "تعذّر قراءة الموقع. حاول مجدداً.")); return; }
      setLink(""); linkRef.current?.setCustomValidity(""); onChange(location);
    }, problem => {
      if (request.current !== token) return;
      setBusy(false);
      setError(problem.code === 1
        ? t("Location permission was denied. Allow it in your browser settings, or paste a Google Maps link.", "لم تسمح بالوصول للموقع. فعّل الإذن من إعدادات المتصفح أو الصق رابط Google Maps.")
        : t("Could not determine your location. Try again or paste a Google Maps link.", "تعذّر تحديد موقعك. حاول مجدداً أو الصق رابط Google Maps."));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }
  const url = deliveryLocationUrl(value);
  return <section aria-labelledby="delivery-location-heading" className="rounded-xl border border-[#dfe4e0] bg-[#f7f8f6] p-3 lg:p-4">
    <h3 id="delivery-location-heading" className="flex items-center gap-2 text-xs font-bold text-[#142019] lg:text-sm"><MapPin size={15} />{t("Delivery location (required)", "موقع التوصيل (إجباري)")}</h3>
    <p className="mt-1 text-xs leading-5 text-[#647168]">{t("Attach one location to this order. It is not live tracking.", "أضف موقعاً ثابتاً لهذا الطلب، بدون تتبّع مباشر.")}</p>
    <button type="button" disabled={busy} onClick={locate} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#b8d7c4] bg-white px-3 text-sm font-bold text-[#0a583b] disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <MapPin size={16} />}{busy ? t("Locating…", "جارٍ تحديد الموقع…") : t("Use my current location", "أضف موقعي الحالي")}</button>
    <label className="mt-3 block text-xs font-bold text-[#526057]" htmlFor="delivery-location-link">{t("Or paste coordinates / a Google Maps link with coordinates", "أو الصق الإحداثيات / رابط Google Maps يحتوي على الإحداثيات")}</label>
    <input ref={linkRef} id="delivery-location-link" type="text" dir="ltr" autoComplete="off" value={link} placeholder="33.5000717, 36.2741384" className="mt-1.5 h-10 w-full min-w-0 rounded-lg border border-[#dfe4e0] bg-white px-3 text-base placeholder:text-xs" onChange={event => {
      request.current++; setBusy(false); setLink(event.target.value);
      const raw = event.target.value.trim(); const location = parseDeliveryPoint(raw);
      const message = raw && !location ? t("Paste latitude, longitude. A short Maps link needs its coordinates.", "الصق خط العرض، خط الطول. الرابط المختصر يحتاج نسخ إحداثيات المكان.") : "";
      event.target.setCustomValidity(message); setError(message); onChange(null);
    }} />
    <button type="button" disabled={busy || !parseDeliveryPoint(link)} onClick={() => {request.current++; setBusy(false); onChange(parseDeliveryPoint(link));}} className="mt-2 min-h-10 rounded-lg border border-[#b8d7c4] bg-white px-3 text-xs font-bold text-[#0a583b] disabled:opacity-50">{t("Use these coordinates", "اعتمد هذه الإحداثيات")}</button>
    {url && <div role="status" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0a583b]">
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 font-bold underline underline-offset-4"><ExternalLink size={13} />{t("Location added · Check on Google Maps", "تمت إضافة الموقع · تأكد منه على Google Maps")}</a>
      <button type="button" aria-label={t("Remove delivery location", "إزالة موقع التوصيل")} className="flex min-h-9 items-center gap-1" onClick={() => { request.current++; setBusy(false); setLink(""); setError(""); linkRef.current?.setCustomValidity(""); onChange(null); }}><X size={13} />{t("Remove", "إزالة")}</button>
      {value && "latitude" in value && value.accuracy !== undefined && <p className="w-full text-[#647168]">{t(`Estimated accuracy: ${Math.round(value.accuracy)} m. Please check the location.`, `الدقة التقريبية: ${Math.round(value.accuracy)} متر. يرجى التأكد من الموقع.`)}</p>}
    </div>}
    <p className="mt-2 text-xs leading-5 text-[#647168]">{t("For another address, copy its coordinates from Google Maps. Choose the delivery address, which may differ from where you are now.", "لعنوان آخر، انسخ إحداثياته من Google Maps. اختر مكان التوصيل، فقد يختلف عن مكانك الحالي.")}</p>
    {routeBusy && <p role="status" className="mt-2 text-xs text-[#0a583b]">{t("Calculating the road distance…", "جارٍ حساب مسافة الطريق…")}</p>}
    {estimate && !routeBusy && <div className="mt-2 rounded-lg bg-white p-2 text-xs leading-6 text-[#0a583b]">
      <p>{t("Road distance", "مسافة الطريق")}: {(estimate.distanceMeters / 1000).toFixed(2)} {t("km", "كم")}</p>
      <p>{t("Delivery before offers", "التوصيل قبل العروض")}: {estimate.fee.toLocaleString()} SYP</p>
      <p>{t("500 SYP + 25 SYP per km", "500 ل.س + 25 ل.س لكل كم")}</p>
      <button type="button" onClick={() => setAttempt(n => n + 1)} className="min-h-9 font-bold underline">{t("Recheck delivery quote", "إعادة التحقق من التسعيرة")}</button>
    </div>}
    {routeError && <div role="alert" className="mt-2 text-xs leading-5 text-red-700">{routeError}<button type="button" onClick={() => setAttempt(n => n + 1)} className="ms-2 min-h-9 font-bold underline">{t("Retry", "إعادة المحاولة")}</button></div>}
    <p className="mt-2 text-[11px] text-[#647168]">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="underline">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors</a></p>
    {error && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
  </section>;
}
