"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaLock,
  FaMapMarkerAlt,
  FaPencilAlt,
  FaPlus,
  FaTimesCircle,
  FaTrash,
  FaUserEdit,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

type KabUser = {
  id: number;
  full_name: string;
  phone: string;
};

type SavedAddress = {
  label: string;
  governorate: string;
  delivery_area: string;
  address: string;
};

type NameStatus = "idle" | "saving" | "success" | "error";
type AddrStatus = "idle" | "saving" | "success" | "error";

const EMPTY_ADDR: SavedAddress = {
  label: "",
  governorate: "",
  delivery_area: "",
  address: "",
};

export default function AccountInformationPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [user, setUser] = useState<KabUser | null>(null);
  const [pageReady, setPageReady] = useState(false);

  // ── Name edit ────────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── Addresses ────────────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  // which slot is being edited: 0, 1, or null
  const [editingAddrIdx, setEditingAddrIdx] = useState<0 | 1 | null>(null);
  const [addrDraft, setAddrDraft] = useState<SavedAddress>(EMPTY_ADDR);
  const [addrStatus, setAddrStatus] = useState<AddrStatus>("idle");
  const [addrError, setAddrError] = useState("");

  // ── Load profile ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const result = await res.json();
        if (!result.authenticated || !result.user) return;
        if (!cancelled) {
          setUser(result.user);
          setNameValue(result.user.full_name);
        }
      } finally {
        if (!cancelled) setPageReady(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Load addresses ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pageReady || !user) { setAddrLoading(false); return; }
    let cancelled = false;
    async function loadAddresses() {
      try {
        const res = await fetch("/api/customer/addresses", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        }
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    }
    void loadAddresses();
    return () => { cancelled = true; };
  }, [pageReady, user]);

  // ── Focus name input ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingName) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [editingName]);

  // ── Name save ────────────────────────────────────────────────────────────────
  function startEditingName() {
    if (!user) return;
    setNameValue(user.full_name);
    setNameStatus("idle");
    setNameError("");
    setEditingName(true);
  }

  function cancelEditingName() {
    setEditingName(false);
    setNameStatus("idle");
    setNameError("");
  }

  async function saveName() {
    if (!user) return;
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setNameError(isArabic ? "الاسم يجب أن يكون بين 2 و 80 حرفاً." : "Name must be between 2 and 80 characters.");
      return;
    }
    if (trimmed === user.full_name) { setEditingName(false); return; }
    setNameStatus("saving");
    setNameError("");
    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameStatus("error");
        setNameError(data?.error || (isArabic ? "تعذر تحديث الاسم." : "Failed to update name."));
        return;
      }
      const updated = { ...user, full_name: data.full_name };
      setUser(updated);
      try {
        const stored = localStorage.getItem("kab_user");
        if (stored) {
          localStorage.setItem("kab_user", JSON.stringify({ ...JSON.parse(stored), full_name: data.full_name }));
        }
      } catch { /* ignore */ }
      setNameStatus("success");
      setEditingName(false);
      setTimeout(() => setNameStatus("idle"), 3000);
    } catch {
      setNameStatus("error");
      setNameError(isArabic ? "خطأ في الشبكة." : "Network error. Please try again.");
    }
  }

  // ── Address edit/save/delete ─────────────────────────────────────────────────
  function openAddressEdit(idx: 0 | 1) {
    setAddrDraft(addresses[idx] ? { ...addresses[idx] } : { ...EMPTY_ADDR });
    setAddrError("");
    setAddrStatus("idle");
    setEditingAddrIdx(idx);
  }

  function cancelAddrEdit() {
    setEditingAddrIdx(null);
    setAddrError("");
    setAddrStatus("idle");
  }

  async function saveAddress() {
    if (editingAddrIdx === null) return;
    const d = addrDraft;
    if (!d.label.trim() || !d.governorate.trim() || !d.delivery_area.trim() || d.address.trim().length < 2) {
      setAddrError(isArabic ? "يرجى تعبئة جميع الحقول." : "Please fill in all fields.");
      return;
    }
    setAddrStatus("saving");
    setAddrError("");
    const next = [...addresses] as SavedAddress[];
    next[editingAddrIdx] = {
      label: d.label.trim(),
      governorate: d.governorate.trim(),
      delivery_area: d.delivery_area.trim(),
      address: d.address.trim(),
    };
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddrStatus("error");
        setAddrError(data?.error || (isArabic ? "تعذر الحفظ." : "Failed to save."));
        return;
      }
      setAddresses(data.addresses);
      setAddrStatus("success");
      setEditingAddrIdx(null);
      setTimeout(() => setAddrStatus("idle"), 3000);
    } catch {
      setAddrStatus("error");
      setAddrError(isArabic ? "خطأ في الشبكة." : "Network error.");
    }
  }

  async function deleteAddress(idx: 0 | 1) {
    const next = addresses.filter((_, i) => i !== idx);
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: next }),
      });
      const data = await res.json();
      if (res.ok) setAddresses(data.addresses);
    } catch { /* ignore */ }
  }

  // ── Shared input class ────────────────────────────────────────────────────────
  const inputClass =
    "w-full rounded-xl border border-[#c8d4ca] bg-[#f7fbf8] px-4 py-3 text-sm font-bold text-[#142019] outline-none transition focus:border-[#0a583b] focus:ring-2 focus:ring-[#0a583b]/15 placeholder:font-normal placeholder:text-[#9aa29c]";

  // ── Loading ──────────────────────────────────────────────────────────────────
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

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main dir="ltr" className={`min-h-screen bg-[#f7f7f3] ${isArabic ? "[font-family:var(--font-arabic)]" : ""}`}>
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-2xl text-[#0a583b]">
            <FaUserEdit />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#142019]">
            {isArabic ? "تسجيل الدخول مطلوب" : "Sign in required"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#647168]">
            {isArabic ? "يرجى تسجيل الدخول لعرض معلومات حسابك." : "Please sign in to view your account information."}
          </p>
          <Link href="/login" className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#0a583b] px-8 text-sm font-extrabold text-white transition hover:bg-[#073f2c]">
            {isArabic ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <main
      dir="ltr"
      className={`min-h-screen bg-[#f7f7f3] pb-24 ${isArabic ? "[font-family:var(--font-arabic)]" : ""}`}
    >
      <div className="mx-auto max-w-xl px-4 pt-8 lg:max-w-2xl lg:pt-12">

        {/* Back */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-bold text-[#647168] transition hover:text-[#0a583b]">
          <FaChevronLeft className="text-[10px]" />
          {isArabic ? "الرجوع إلى حسابي" : "Back to my account"}
        </Link>

        {/* Header */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#0a583b]" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0a583b]">KAB Pharma</p>
          </div>
          <h1 className="mt-3 text-[2rem] font-extrabold tracking-[-0.04em] text-[#142019] lg:text-[2.5rem]">
            {isArabic ? "معلومات الحساب" : "Account information"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#647168]">
            {isArabic ? "عرض وتعديل بيانات حسابك الشخصي." : "View and update your personal account details."}
          </p>
        </div>

        {/* ── Account details card ──────────────────────────────────────────────── */}
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
                <h2 className="text-base font-extrabold text-[#142019]">{user.full_name}</h2>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#edf0ed]">
            {/* Full name */}
            <div className="px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#99a89c]">
                    {isArabic ? "الاسم الكامل" : "Full name"}
                  </p>
                  {editingName ? (
                    <div className="mt-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameValue}
                        onChange={(e) => { setNameValue(e.target.value); setNameError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void saveName(); if (e.key === "Escape") cancelEditingName(); }}
                        maxLength={80}
                        placeholder={isArabic ? "أدخل اسمك الكامل" : "Enter your full name"}
                        className={inputClass}
                      />
                      {nameError && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600">
                          <FaTimesCircle className="shrink-0" />{nameError}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" onClick={() => void saveName()} disabled={nameStatus === "saving"}
                          className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#0a583b] px-5 text-xs font-extrabold text-white transition hover:bg-[#073f2c] disabled:opacity-60">
                          {nameStatus === "saving" ? (isArabic ? "جاري الحفظ..." : "Saving...") : (isArabic ? "حفظ" : "Save")}
                        </button>
                        <button type="button" onClick={cancelEditingName} disabled={nameStatus === "saving"}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d5ddd7] px-5 text-xs font-extrabold text-[#526057] transition hover:border-[#b0bdb3] hover:text-[#142019] disabled:opacity-60">
                          {isArabic ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-base font-bold text-[#142019]">{user.full_name}</p>
                      {nameStatus === "success" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#22a66f]">
                          <FaCheckCircle />{isArabic ? "تم الحفظ" : "Saved"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!editingName && (
                  <button type="button" onClick={startEditingName}
                    className="group mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dde4df] text-xs text-[#8a9990] transition hover:border-[#0a583b] hover:bg-[#f0f7f3] hover:text-[#0a583b]"
                    aria-label={isArabic ? "تعديل الاسم" : "Edit name"}>
                    <FaPencilAlt />
                  </button>
                )}
              </div>
            </div>

            {/* Phone — read-only */}
            <div className="px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#99a89c]">
                    {isArabic ? "رقم الهاتف" : "Phone number"}
                  </p>
                  <p dir="ltr" className="mt-1 text-base font-bold text-[#142019]">
                    +{user.phone.replace(/^\+/, "")}
                  </p>
                  <p className="mt-1 text-xs text-[#99a89c]">
                    {isArabic ? "لا يمكن تغيير رقم الهاتف." : "Phone number cannot be changed."}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#edf0ed] text-xs text-[#c5cfc7]">
                  <FaLock />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Saved addresses card ──────────────────────────────────────────────── */}
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dde4df] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.05)]">
          {/* Card header */}
          <div className="border-b border-[#edf0ed] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaMapMarkerAlt />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0a583b]">
                  {isArabic ? "العناوين المحفوظة" : "Saved addresses"}
                </p>
                <h2 className="text-base font-extrabold text-[#142019]">
                  {isArabic ? "يمكنك حفظ عنوانين" : "Save up to 2 addresses"}
                </h2>
              </div>
            </div>
          </div>

          {addrLoading ? (
            <div className="space-y-3 p-6 sm:p-8">
              <div className="h-16 animate-pulse rounded-xl bg-[#f3f7f4]" />
              <div className="h-16 animate-pulse rounded-xl bg-[#f3f7f4]" />
            </div>
          ) : (
            <div className="divide-y divide-[#edf0ed]">
              {([0, 1] as const).map((idx) => {
                const addr = addresses[idx];
                const isEditing = editingAddrIdx === idx;

                return (
                  <div key={idx} className="px-6 py-5 sm:px-8">
                    {/* Slot label */}
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#99a89c]">
                      {isArabic ? `العنوان ${idx + 1}` : `Address ${idx + 1}`}
                    </p>

                    {isEditing ? (
                      /* ── Edit form ── */
                      <div className="space-y-3">
                        {/* Label */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#526057]">
                            {isArabic ? "اسم العنوان (مثال: البيت، العمل)" : "Label (e.g. Home, Work)"}
                          </label>
                          <input
                            type="text"
                            value={addrDraft.label}
                            onChange={(e) => setAddrDraft((p) => ({ ...p, label: e.target.value }))}
                            placeholder={isArabic ? "البيت" : "Home"}
                            maxLength={30}
                            className={inputClass}
                          />
                        </div>
                        {/* Governorate */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#526057]">
                            {isArabic ? "المحافظة" : "Governorate"}
                          </label>
                          <input
                            type="text"
                            value={addrDraft.governorate}
                            onChange={(e) => setAddrDraft((p) => ({ ...p, governorate: e.target.value }))}
                            placeholder={isArabic ? "دمشق" : "Damascus"}
                            className={inputClass}
                          />
                        </div>
                        {/* Delivery area */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#526057]">
                            {isArabic ? "المنطقة" : "Delivery area"}
                          </label>
                          <input
                            type="text"
                            value={addrDraft.delivery_area}
                            onChange={(e) => setAddrDraft((p) => ({ ...p, delivery_area: e.target.value }))}
                            placeholder={isArabic ? "المزة" : "Mezzeh"}
                            className={inputClass}
                          />
                        </div>
                        {/* Full address */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#526057]">
                            {isArabic ? "العنوان التفصيلي" : "Full address"}
                          </label>
                          <input
                            type="text"
                            value={addrDraft.address}
                            onChange={(e) => setAddrDraft((p) => ({ ...p, address: e.target.value }))}
                            placeholder={isArabic ? "شارع، بناء، طابق..." : "Street, building, floor..."}
                            className={inputClass}
                          />
                        </div>

                        {addrError && (
                          <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                            <FaTimesCircle className="shrink-0" />{addrError}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button type="button" onClick={() => void saveAddress()} disabled={addrStatus === "saving"}
                            className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#0a583b] px-5 text-xs font-extrabold text-white transition hover:bg-[#073f2c] disabled:opacity-60">
                            {addrStatus === "saving" ? (isArabic ? "جاري الحفظ..." : "Saving...") : (isArabic ? "حفظ العنوان" : "Save address")}
                          </button>
                          <button type="button" onClick={cancelAddrEdit} disabled={addrStatus === "saving"}
                            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d5ddd7] px-5 text-xs font-extrabold text-[#526057] transition hover:border-[#b0bdb3] hover:text-[#142019] disabled:opacity-60">
                            {isArabic ? "إلغاء" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : addr ? (
                      /* ── Saved address display ── */
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-[#142019]">{addr.label}</p>
                          <p className="mt-0.5 text-sm text-[#526057]">
                            {addr.governorate}{addr.delivery_area ? `, ${addr.delivery_area}` : ""}
                          </p>
                          <p className="mt-0.5 text-sm text-[#526057]">{addr.address}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button type="button" onClick={() => openAddressEdit(idx)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dde4df] text-xs text-[#8a9990] transition hover:border-[#0a583b] hover:bg-[#f0f7f3] hover:text-[#0a583b]"
                            aria-label={isArabic ? "تعديل" : "Edit"}>
                            <FaPencilAlt />
                          </button>
                          <button type="button" onClick={() => void deleteAddress(idx)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dde4df] text-xs text-[#8a9990] transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                            aria-label={isArabic ? "حذف" : "Delete"}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Empty slot ── */
                      <button type="button" onClick={() => openAddressEdit(idx)}
                        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#c8d4ca] bg-[#f7fbf8] px-4 py-4 text-left text-sm font-bold text-[#647168] transition hover:border-[#0a583b] hover:text-[#0a583b]">
                        <FaPlus className="shrink-0 text-[#0a583b]" />
                        {isArabic ? "إضافة عنوان" : "Add address"}
                      </button>
                    )}
                  </div>
                );
              })}

              {addrStatus === "success" && (
                <div className="px-6 pb-5 sm:px-8">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#22a66f]">
                    <FaCheckCircle />{isArabic ? "تم حفظ العنوان" : "Address saved"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Support note */}
        <p className="mt-6 text-center text-xs leading-5 text-[#99a89c]">
          {isArabic ? (
            <>هل تحتاج مساعدة؟{" "}<Link href="/contact" className="font-bold text-[#0a583b] underline-offset-2 hover:underline">تواصل مع خدمة العملاء</Link></>
          ) : (
            <>Need help?{" "}<Link href="/contact" className="font-bold text-[#0a583b] underline-offset-2 hover:underline">Contact customer care</Link></>
          )}
        </p>
      </div>
    </main>
  );
}