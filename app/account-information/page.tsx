"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import {
  FaCheckCircle,
  FaChevronLeft,
  FaLock,
  FaPencilAlt,
  FaTimesCircle,
  FaUserEdit,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

type KabUser = {
  id: number;
  full_name: string;
  phone: string;
};

type Status = "idle" | "saving" | "success" | "error";

export default function AccountInformationPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [user, setUser] = useState<KabUser | null>(null);
  const [pageReady, setPageReady] = useState(false);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setPageReady(true);
          return;
        }

        const result = await res.json();

        if (!result.authenticated || !result.user) {
          if (!cancelled) setPageReady(true);
          return;
        }

        if (!cancelled) {
          setUser(result.user);
          setNameValue(result.user.full_name);
        }
      } catch {
        // network error — page still renders (guest state)
      } finally {
        if (!cancelled) setPageReady(true);
      }
    }

    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  // Focus input when edit mode opens
  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  function startEditing() {
    if (!user) return;
    setNameValue(user.full_name);
    setStatus("idle");
    setErrorMsg("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setStatus("idle");
    setErrorMsg("");
  }

  async function saveName() {
    if (!user) return;

    const trimmed = nameValue.trim();

    if (trimmed.length < 2 || trimmed.length > 80) {
      setErrorMsg(
        isArabic
          ? "الاسم يجب أن يكون بين 2 و 80 حرفاً."
          : "Name must be between 2 and 80 characters."
      );
      return;
    }

    if (trimmed === user.full_name) {
      setEditing(false);
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(
          data?.error ||
            (isArabic
              ? "تعذر تحديث الاسم. حاول مجدداً."
              : "Failed to update name. Please try again.")
        );
        return;
      }

      // Update local state + localStorage cache
      const updated = { ...user, full_name: data.full_name };
      setUser(updated);

      const stored = localStorage.getItem("kab_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            "kab_user",
            JSON.stringify({ ...parsed, full_name: data.full_name })
          );
        } catch {
          // ignore
        }
      }

      setStatus("success");
      setEditing(false);

      // Reset success indicator after 3s
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setErrorMsg(
        isArabic
          ? "خطأ في الشبكة. تحقق من اتصالك وحاول مجدداً."
          : "Network error. Check your connection and try again."
      );
    }
  }

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (!pageReady) {
    return (
      <main dir="ltr" className="min-h-screen bg-[#f7f7f3]">
        <div className="mx-auto max-w-xl px-4 py-10">
          <div className="h-5 w-24 animate-pulse rounded-full bg-[#e0e5e1]" />
          <div className="mt-8 h-[200px] animate-pulse rounded-[1.5rem] bg-white" />
        </div>
      </main>
    );
  }

  // ─── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main
        className={`min-h-screen bg-[#f7f7f3] ${
          isArabic ? "[font-family:var(--font-arabic)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-2xl text-[#0a583b]">
            <FaUserEdit />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-[#142019]">
            {isArabic ? "تسجيل الدخول مطلوب" : "Sign in required"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#647168]">
            {isArabic
              ? "يرجى تسجيل الدخول لعرض معلومات حسابك."
              : "Please sign in to view your account information."}
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#0a583b] px-8 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
          >
            {isArabic ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  // ─── Main page ───────────────────────────────────────────────────────────────
  return (
    <main
      dir="ltr"
      className={`min-h-screen bg-[#f7f7f3] pb-20 ${
        isArabic ? "[font-family:var(--font-arabic)]" : ""
      }`}
    >
      <div className="mx-auto max-w-xl px-4 pt-8 lg:max-w-2xl lg:pt-12">

        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#647168] transition hover:text-[#0a583b]"
        >
          <FaChevronLeft className="text-[10px]" />
          {isArabic ? "الرجوع إلى حسابي" : "Back to my account"}
        </Link>

        {/* Page header */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#0a583b]" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0a583b]">
              KAB Pharma
            </p>
          </div>

          <h1 className="mt-3 text-[2rem] font-extrabold tracking-[-0.04em] text-[#142019] lg:text-[2.5rem]">
            {isArabic ? "معلومات الحساب" : "Account information"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#647168]">
            {isArabic
              ? "عرض وتعديل بيانات حسابك الشخصي."
              : "View and update your personal account details."}
          </p>
        </div>

        {/* Info card */}
        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[#dde4df] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.05)]">

          {/* Card header */}
          <div className="border-b border-[#edf0ed] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaUserEdit />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0a583b]">
                  {isArabic ? "بيانات الحساب" : "Account details"}
                </p>
                <h2 className="text-base font-extrabold text-[#142019]">
                  {user.full_name}
                </h2>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-[#edf0ed]">

            {/* Full name row */}
            <div className="px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#99a89c]">
                    {isArabic ? "الاسم الكامل" : "Full name"}
                  </p>

                  {editing ? (
                    <div className="mt-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={nameValue}
                        onChange={(e) => {
                          setNameValue(e.target.value);
                          setErrorMsg("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveName();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        maxLength={80}
                        placeholder={
                          isArabic ? "أدخل اسمك الكامل" : "Enter your full name"
                        }
                        className="w-full rounded-xl border border-[#c8d4ca] bg-[#f7fbf8] px-4 py-3 text-sm font-bold text-[#142019] outline-none transition focus:border-[#0a583b] focus:ring-2 focus:ring-[#0a583b]/15"
                      />

                      {errorMsg && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600">
                          <FaTimesCircle className="shrink-0" />
                          {errorMsg}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void saveName()}
                          disabled={status === "saving"}
                          className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#0a583b] px-5 text-xs font-extrabold text-white transition hover:bg-[#073f2c] disabled:opacity-60"
                        >
                          {status === "saving"
                            ? isArabic
                              ? "جاري الحفظ..."
                              : "Saving..."
                            : isArabic
                            ? "حفظ"
                            : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={status === "saving"}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d5ddd7] px-5 text-xs font-extrabold text-[#526057] transition hover:border-[#b0bdb3] hover:text-[#142019] disabled:opacity-60"
                        >
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-base font-bold text-[#142019]">
                        {user.full_name}
                      </p>

                      {status === "success" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#22a66f]">
                          <FaCheckCircle />
                          {isArabic ? "تم الحفظ" : "Saved"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="group mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dde4df] text-xs text-[#8a9990] transition hover:border-[#0a583b] hover:bg-[#f0f7f3] hover:text-[#0a583b]"
                    aria-label={isArabic ? "تعديل الاسم" : "Edit name"}
                  >
                    <FaPencilAlt />
                  </button>
                )}
              </div>
            </div>

            {/* Phone row — read-only */}
            <div className="px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#99a89c]">
                    {isArabic ? "رقم الهاتف" : "Phone number"}
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-base font-bold text-[#142019]"
                  >
                    +{user.phone.replace(/^\+/, "")}
                  </p>

                  <p className="mt-1 text-xs text-[#99a89c]">
                    {isArabic
                      ? "لا يمكن تغيير رقم الهاتف. تواصل مع الدعم إذا احتجت مساعدة."
                      : "Phone number cannot be changed. Contact support if you need help."}
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#edf0ed] text-xs text-[#c5cfc7]">
                  <FaLock />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support note */}
        <p className="mt-6 text-center text-xs leading-5 text-[#99a89c]">
          {isArabic ? (
            <>
              هل تحتاج مساعدة؟{" "}
              <Link
                href="/contact"
                className="font-bold text-[#0a583b] underline-offset-2 hover:underline"
              >
                تواصل مع خدمة العملاء
              </Link>
            </>
          ) : (
            <>
              Need help?{" "}
              <Link
                href="/contact"
                className="font-bold text-[#0a583b] underline-offset-2 hover:underline"
              >
                Contact customer care
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}