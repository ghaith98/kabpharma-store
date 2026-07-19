"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FiCheck,
  FiShare2,
} from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";
import { SITE_URL } from "@/lib/site";

type ShareProductButtonProps = {
  productId: number | string;
  productNameAr?: string | null;
  productNameEn?: string | null;
  fallbackName?: string | null;
};

const WEBSITE_URL = SITE_URL;

export default function ShareProductButton({
  productId,
  productNameAr,
  productNameEn,
  fallbackName,
}: ShareProductButtonProps) {
  const { lang } = useLanguage();

  const [copied, setCopied] = useState(false);

  const resetTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const productName =
    lang === "ar"
      ? productNameAr ||
        productNameEn ||
        fallbackName ||
        "KAB Pharma"
      : productNameEn ||
        productNameAr ||
        fallbackName ||
        "KAB Pharma";

  function isMobileOrTablet() {
    const userAgent =
      navigator.userAgent || "";

    const mobileUserAgent =
      /Android|iPhone|iPad|iPod|Mobile/i.test(
        userAgent
      );

    const isIPadOS =
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1;

    return mobileUserAgent || isIPadOS;
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        value
      );

      return;
    }

    const textarea =
      document.createElement("textarea");

    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    const successful =
      document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error(
        "Could not copy product link."
      );
    }
  }

  function showCopiedState() {
    setCopied(true);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2200);
  }

  async function handleShare() {
    /*
      نستخدم رابط الموقع الحقيقي حتى أثناء
      التجربة على localhost.
    */
    const productUrl =
      `${WEBSITE_URL}/products/${productId}`;

    const shareTitle =
      `${productName} | KAB Pharma`;

    const shareText =
      lang === "ar"
        ? `شاهد هذا المنتج من KAB Pharma:\n${productName}`
        : `Check out this product from KAB Pharma:\n${productName}`;

    try {
      /*
        على الموبايل والتابلت:
        تفتح قائمة المشاركة وفيها WhatsApp
        وباقي التطبيقات.
      */
      if (
        isMobileOrTablet() &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });

        return;
      }

      /*
        على الكمبيوتر:
        ينسخ رابط المنتج الحقيقي مباشرة.
      */
      await copyText(productUrl);
      showCopiedState();
    } catch (error: unknown) {
      /*
        المستخدم أغلق نافذة المشاركة.
      */
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return;
      }

      try {
        await copyText(productUrl);
        showCopiedState();
      } catch (copyError) {
        console.error(
          "Failed to copy product link:",
          copyError
        );

        alert(
          lang === "ar"
            ? "تعذر نسخ رابط المنتج."
            : "Could not copy the product link."
        );
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={
        lang === "ar"
          ? "مشاركة المنتج"
          : "Share product"
      }
      title={
        lang === "ar"
          ? "مشاركة المنتج"
          : "Share product"
      }
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-extrabold transition active:scale-95 sm:px-4 ${
        copied
          ? "border-green-600 bg-green-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700"
      }`}
    >
      {copied ? (
        <FiCheck className="text-lg" />
      ) : (
        <FiShare2 className="text-lg" />
      )}

      <span>
        {copied
          ? lang === "ar"
            ? "تم النسخ"
            : "Link Copied"
          : lang === "ar"
          ? "مشاركة"
          : "Share"}
      </span>
    </button>
  );
}
