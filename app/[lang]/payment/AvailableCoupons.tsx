"use client";

import { useEffect, useState } from "react";

export type AvailableCoupon = {
  code: string;
  type: "percent" | "fixed" | "free_delivery";
  percent: number;
  amount: number;
  minimum: number;
  maximum: number;
  firstOrderOnly: boolean;
  saleItems: boolean;
};

export default function AvailableCoupons({ profileId, isArabic, disabled, onApply }: {
  profileId: string;
  isArabic: boolean;
  disabled: boolean;
  onApply: (code: string) => void;
}) {
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/customer/coupons/available", {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) return;
        const result = await response.json();
        if (!controller.signal.aborted && result.profileId === profileId && Array.isArray(result.coupons)) {
          setCoupons(result.coupons);
        }
      } catch { /* Optional suggestions must never block manual entry or checkout. */ }
    }
    void load();
    return () => controller.abort();
  }, [profileId]);

  if (!coupons.length) return null;
  const t = (en: string, ar: string) => isArabic ? ar : en;
  const money = (value: number) => `${Math.round(value).toLocaleString()} SYP`;
  return (
    <div className="mt-3 space-y-2" aria-label={t("Available coupons", "الكوبونات المتاحة لكِ")}>
      <p className="text-xs font-bold text-[#526057]">{t("Available coupons", "الكوبونات المتاحة لكِ")}</p>
      {coupons.map(coupon => (
        <div key={coupon.code} className="flex min-w-0 items-center gap-3 rounded-lg border border-dashed border-[#cbdacf] bg-[#f7faf8] px-3 py-2">
          <div className="min-w-0 flex-1 text-xs leading-5 text-[#526057]">
            <bdi className="break-all font-bold text-[#0a583b]">{coupon.code}</bdi>
            <p>{coupon.type === "free_delivery" ? t("Free delivery", "توصيل مجاني") : coupon.type === "fixed" ? t(`${money(coupon.amount)} off`, `خصم ${money(coupon.amount)}`) : t(`${coupon.percent}% off`, `خصم ${coupon.percent}%`)}{coupon.firstOrderOnly ? t(" · First order only", " · لأول طلب فقط") : ""}</p>
            {coupon.minimum > 0 && <p>{t(`Minimum order: ${money(coupon.minimum)}`, `الحد الأدنى للطلب: ${money(coupon.minimum)}`)}</p>}
            {coupon.type === "percent" && coupon.maximum > 0 && <p>{t(`Maximum discount: ${money(coupon.maximum)}`, `الحد الأقصى للخصم: ${money(coupon.maximum)}`)}</p>}
            {!coupon.saleItems && <p>{t("Excludes sale items", "لا يشمل المنتجات المخفّضة")}</p>}
          </div>
          <button type="button" disabled={disabled} onClick={() => onApply(coupon.code)}
            aria-label={t(`Apply ${coupon.code}`, `تطبيق ${coupon.code}`)}
            className="min-h-10 shrink-0 rounded-lg border border-[#0a583b] px-3 text-xs font-bold text-[#0a583b] hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a583b] disabled:opacity-50">
            {t("Apply", "تطبيق")}
          </button>
        </div>
      ))}
      <p className="text-[11px] leading-5 text-[#647168]">{t("Applied to eligible items after checking your cart.", "يُطبّق الخصم على المنتجات المؤهلة بعد التحقق من السلة.")}</p>
    </div>
  );
}
