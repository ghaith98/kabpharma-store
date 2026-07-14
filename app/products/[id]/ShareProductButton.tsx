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

type ShareProductButtonProps = {
  productId: number | string;
  productName: string;
  variantLabel?: string | null;
  lang: "ar" | "en";
};

export default function ShareProductButton({
  productId,
  productName,
  variantLabel,
  lang,
}: ShareProductButtonProps) {
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

  function isMobileOrTablet() {
    const hasCoarsePointer =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches;

    const hasSmallScreen =
      window.innerWidth <= 1024;

    return hasCoarsePointer && hasSmallScreen;
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
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

    const success =
      document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!success) {
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
    const productUrl =
      `${window.location.origin}/products/${productId}`;

    const selectedProductName =
      variantLabel
        ? `${productName} - ${variantLabel}`
        : productName;

    const shareTitle =
      `${selectedProductName} | KAB Pharma`;

    const shareText =
      lang === "ar"
        ? `تعرّف على ${selectedProductName} من KAB Pharma`
        : `Check out ${selectedProductName} from KAB Pharma`;

    const completeShareMessage =
      `${shareText}\n${productUrl}`;

    try {
      /*
        فقط على الموبايل أو التابلت
        نفتح قائمة المشاركة الأصلية.
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
        على الكمبيوتر ننسخ النص والرابط مباشرة.
      */
      await copyText(completeShareMessage);
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
        await copyText(completeShareMessage);
        showCopiedState();
      } catch (copyError) {
        console.error(
          "Failed to share product:",
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
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold transition active:scale-95 ${
        copied
          ? "border-green-600 bg-green-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
      }`}
    >
      {copied ? (
        <FiCheck className="text-lg" />
      ) : (
        <FiShare2 className="text-lg" />
      )}

      <span className="hidden sm:inline">
        {copied
          ? lang === "ar"
            ? "تم نسخ الرابط"
            : "Link Copied"
          : lang === "ar"
          ? "مشاركة"
          : "Share"}
      </span>
    </button>
  );
}