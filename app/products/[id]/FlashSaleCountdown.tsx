"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "../../../context/LanguageContext";

/*
  "Flash sale ends in 02:14:09" on the product page.

  Nothing is drawn on the server (the remaining time depends on the exact
  moment the page is opened); the timer appears as soon as the page is live
  in the browser and disappears when the sale ends.
*/

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function FlashSaleCountdown({
  endsAt,
  className = "",
}: {
  /** When the flash sale ends. Empty = no end date: nothing is shown. */
  endsAt?: string | null;
  className?: string;
}) {
  const { lang } = useLanguage();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const endTime = endsAt ? new Date(endsAt).getTime() : NaN;

    if (!Number.isFinite(endTime)) return;

    const tick = () => setRemainingMs(Math.max(0, endTime - Date.now()));

    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [endsAt]);

  if (!endsAt || remainingMs == null || remainingMs <= 0) return null;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isArabic = lang === "ar";

  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const daysText =
    days > 0
      ? isArabic
        ? `${days} ${days === 1 ? "يوم" : days === 2 ? "يومان" : days <= 10 ? "أيام" : "يوماً"} و`
        : `${days} ${days === 1 ? "day" : "days"} `
      : "";

  return (
    <div
      role="timer"
      aria-live="off"
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-[#f1d9d9] bg-[#fdf6f6] px-4 py-3 ${className}`}
    >
      <p className="text-sm font-extrabold text-[#b3261e]">
        {isArabic ? "عرض لفترة محدودة" : "Flash sale"}
      </p>

      <p className="text-xs font-bold text-[#7a4a47]">
        {isArabic ? "ينتهي خلال " : "Ends in "}
        <span className="font-extrabold text-[#b3261e]">{daysText}</span>
        <span
          dir="ltr"
          className="inline-block font-extrabold tabular-nums text-[#b3261e]"
        >
          {clock}
        </span>
      </p>
    </div>
  );
}
