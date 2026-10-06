"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, Truck, X } from "lucide-react";
import { filterDeliveryAreas, type SearchableDeliveryArea } from "@/lib/delivery-area-search";

type Props = {
  areas: SearchableDeliveryArea[];
  value: string;
  governorateLabel: string;
  isArabic: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onUnlistedChange: (unlisted: boolean) => void;
};

export default function DeliveryAreaSelect({
  areas, value, governorateLabel, isArabic, disabled, onChange, onUnlistedChange,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [unlisted, setUnlisted] = useState(false);
  const [customArea, setCustomArea] = useState("");
  const t = (en: string, ar: string) => isArabic ? ar : en;
  const label = (area: SearchableDeliveryArea) => isArabic
    ? area.area_name_ar || area.area_name
    : area.area_name_en || area.area_name;
  const secondaryLabel = (area: SearchableDeliveryArea) => isArabic
    ? area.area_name_en
    : area.area_name_ar;
  const selected = areas.find((area) => String(area.id) === value);
  const filtered = filterDeliveryAreas(areas, query);
  const active = filtered[activeIndex];

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  function choose(area: SearchableDeliveryArea) {
    onChange(String(area.id));
    onUnlistedChange(false);
    setUnlisted(false);
    setCustomArea("");
    setQuery("");
    setOpen(false);
  }

  const enquiry = t(
    `Hello KAB Pharma, my delivery area is not listed. Governorate: ${governorateLabel}. Area: ${customArea.trim()}. Please confirm delivery availability and the fee before I place my order.`,
    `مرحباً كاب فارما، منطقة التوصيل غير موجودة في القائمة. المحافظة: ${governorateLabel}. المنطقة: ${customArea.trim()}. يرجى تأكيد إمكانية التوصيل والتكلفة قبل تقديم طلبي.`,
  );

  return (
    <div className="min-w-0" dir={isArabic ? "rtl" : "ltr"}>
      <label htmlFor={`${id}-input`} className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
        <Truck size={15} className="text-[#0a583b]" />
        {t("Delivery area", "منطقة التوصيل")}
      </label>
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <div className="relative">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#647168]" />
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && !disabled}
            aria-controls={`${id}-list`}
            aria-activedescendant={open && active ? `${id}-option-${active.id}` : undefined}
            aria-describedby={`${id}-hint`}
            aria-required={!disabled && !unlisted}
            autoComplete="off"
            disabled={disabled}
            required={!disabled && !unlisted}
            value={open ? query : selected ? label(selected) : query}
            placeholder={disabled
              ? t("Select governorate first", "اختر المحافظة أولاً")
              : t("Search or select your area", "ابحث عن منطقتك أو اخترها")}
            onFocus={() => { setQuery(""); setActiveIndex(0); setOpen(true); }}
            onClick={() => { if (!open) { setQuery(""); setActiveIndex(0); setOpen(true); } }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
              onChange("");
              setUnlisted(false);
              onUnlistedChange(false);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!open) { setQuery(""); setActiveIndex(0); setOpen(true); }
                else setActiveIndex((index) => filtered.length
                  ? (index + (event.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length
                  : 0);
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (open && active) choose(active);
                else if (!open) { setQuery(""); setActiveIndex(0); setOpen(true); }
              } else if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              } else if (open && (event.key === "Home" || event.key === "End")) {
                event.preventDefault();
                setActiveIndex(event.key === "Home" ? 0 : Math.max(0, filtered.length - 1));
              }
            }}
            className="w-full rounded-xl border border-[#dfe4e0] bg-white py-3.5 ps-11 pe-12 text-base text-[#142019] outline-none transition placeholder:text-[#9aa39d] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0] disabled:cursor-not-allowed disabled:bg-[#f7f8f6] disabled:text-[#9aa39d]"
          />
          {value || query ? (
            <button
              type="button"
              disabled={disabled}
              aria-label={t("Clear delivery area", "مسح منطقة التوصيل")}
              onClick={() => {
                onChange(""); setQuery(""); setActiveIndex(0); setOpen(true);
                setUnlisted(false); onUnlistedChange(false); inputRef.current?.focus();
              }}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#647168] hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#0a583b]"
            ><X size={17} /></button>
          ) : <ChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[#647168]" />}
        </div>
        {open && !disabled && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[#dfe4e0] bg-white shadow-xl">
            <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={t("Delivery areas", "مناطق التوصيل")} className="max-h-60 overflow-y-auto overscroll-contain p-1">
              {filtered.map((area, index) => (
                <li
                  key={area.id}
                  id={`${id}-option-${area.id}`}
                  role="option"
                  aria-selected={String(area.id) === value}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => choose(area)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${index === activeIndex ? "bg-[#edf5f0] text-[#0a583b]" : "text-[#142019]"}`}
                >
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold">{label(area)}</span>
                    {secondaryLabel(area) && secondaryLabel(area) !== label(area) && (
                      <span dir={isArabic ? "ltr" : "rtl"} className="mt-0.5 block text-start text-xs text-[#647168]">{secondaryLabel(area)}</span>
                    )}
                  </span>
                  {String(area.id) === value && <Check size={17} aria-hidden="true" className="shrink-0" />}
                </li>
              ))}
            </ul>
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-[#647168]">{t("No matching areas. Try another spelling or use the option below.", "لا توجد مناطق مطابقة. جرّب كتابة أخرى أو استخدم الخيار أدناه.")}</p>}
            <p role="status" className="border-t border-[#edf0ed] px-4 py-2 text-xs text-[#647168]">
              {filtered.length} {t("matching areas", "منطقة مطابقة")}
            </p>
          </div>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-[#7a857e]">
        {t("Search in Arabic or English, then select an area to see its delivery fee.", "ابحث بالعربية أو الإنجليزية، ثم اختر المنطقة لعرض رسوم التوصيل.")}
      </p>
      {!disabled && (
        <button
          type="button"
          aria-expanded={unlisted}
          aria-controls={`${id}-unlisted`}
          onClick={() => {
            setUnlisted(!unlisted); onUnlistedChange(!unlisted);
            onChange(""); setQuery(""); setOpen(false);
          }}
          className="mt-1 rounded text-xs font-bold text-[#0a583b] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#0a583b]"
        >{t("My area isn't listed", "منطقتي غير موجودة في القائمة")}</button>
      )}
      {unlisted && !disabled && (
        <div id={`${id}-unlisted`} className="mt-3 space-y-3 rounded-xl border border-[#dfe4e0] bg-[#f7f8f6] p-4">
          <label className="block text-sm font-semibold text-[#142019]">
            {t("Your area name", "اسم منطقتك")}
            <input type="text" maxLength={150} value={customArea} onChange={(event) => setCustomArea(event.target.value)} placeholder={t("Enter your neighborhood", "اكتب اسم الحي أو المنطقة")} className="mt-2 w-full rounded-lg border border-[#dfe4e0] bg-white px-3 py-2 text-base outline-none focus:border-[#0a583b]" />
          </label>
          <p className="text-xs leading-5 text-[#647168]">{t("Please contact us to confirm delivery availability and the fee before placing your order. Entering an area here does not submit an order or send a message.", "يرجى التواصل معنا لتأكيد إمكانية التوصيل والتكلفة قبل تقديم الطلب. إدخال المنطقة هنا لا يرسل طلباً أو رسالة.")}</p>
          {customArea.trim() ? (
            <a href={`https://wa.me/963958088969?text=${encodeURIComponent(enquiry)}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-[#0a583b] px-3 py-2 text-xs font-bold text-white">{t("Ask about delivery on WhatsApp", "استفسر عن التوصيل عبر واتساب")}</a>
          ) : <p className="text-xs text-[#647168]">{t("Enter your area to prepare a delivery enquiry.", "أدخل منطقتك لتحضير استفسار عن التوصيل.")}</p>}
        </div>
      )}
    </div>
  );
}
