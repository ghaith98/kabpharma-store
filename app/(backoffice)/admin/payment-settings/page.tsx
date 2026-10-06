"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PaymentSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [numberLoading, setNumberLoading] = useState(false);

  /*
    The QR picture can be hidden from the payment page without deleting it.

    The payment page shows whatever is saved under "payment_qr_url". Hiding
    moves the picture's address to "payment_qr_url_hidden" and leaves
    "payment_qr_url" empty; showing moves it back. Nothing is deleted.
  */
  const [qrUrl, setQrUrl] = useState("");
  const [hiddenQrUrl, setHiddenQrUrl] = useState("");
  const [savedPaymentNumber, setSavedPaymentNumber] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [togglingQr, setTogglingQr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", [
          "payment_number",
          "payment_qr_url",
          "payment_qr_url_hidden",
        ]);

      if (cancelled) return;

      if (error) {
        alert(error.message);
        return;
      }

      const values = new Map(
        (data || []).map((row) => [
          String(row.key),
          String(row.value || ""),
        ])
      );

      setPaymentNumber(values.get("payment_number") || "");
      setSavedPaymentNumber(values.get("payment_number") || "");
      setQrUrl(values.get("payment_qr_url") || "");
      setHiddenQrUrl(values.get("payment_qr_url_hidden") || "");
      setSettingsLoaded(true);
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const qrIsHidden = !qrUrl && Boolean(hiddenQrUrl);
  const currentQrUrl = qrUrl || hiddenQrUrl;

  async function setQrVisible(visible: boolean) {
    if (!currentQrUrl || togglingQr) return;

    // Without the QR, the number is the only way to pay by Sham Cash.
    if (!visible && !savedPaymentNumber.trim()) {
      alert(
        "Save a payment number first. With the QR hidden, customers pay by transferring to that number."
      );
      return;
    }

    setTogglingQr(true);

    const now = new Date().toISOString();

    // One request, so the two values always change together.
    const { error } = await supabase.from("settings").upsert([
      {
        key: "payment_qr_url",
        value: visible ? currentQrUrl : "",
        updated_at: now,
      },
      {
        key: "payment_qr_url_hidden",
        value: visible ? "" : currentQrUrl,
        updated_at: now,
      },
    ]);

    setTogglingQr(false);

    if (error) {
      alert(error.message);
      return;
    }

    setQrUrl(visible ? currentQrUrl : "");
    setHiddenQrUrl(visible ? "" : currentQrUrl);
  }

  async function uploadQr(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("Please choose QR image");
      return;
    }

    setLoading(true);

    const filePath = `payment-qr-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-qr")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("payment-qr")
      .getPublicUrl(filePath);

    // A new picture replaces the old one and keeps the current choice:
    // still hidden if the QR was hidden, shown otherwise.
    const keepHidden = qrIsHidden;
    const now = new Date().toISOString();

    const { error } = await supabase.from("settings").upsert([
      {
        key: "payment_qr_url",
        value: keepHidden ? "" : data.publicUrl,
        updated_at: now,
      },
      {
        key: "payment_qr_url_hidden",
        value: keepHidden ? data.publicUrl : "",
        updated_at: now,
      },
    ]);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setQrUrl(keepHidden ? "" : data.publicUrl);
    setHiddenQrUrl(keepHidden ? data.publicUrl : "");
    setLoading(false);
    setFile(null);
    alert(
      keepHidden
        ? "Payment QR updated. It is still hidden from the payment page."
        : "Payment QR updated successfully"
    );
  }

  async function savePaymentNumber(e: React.FormEvent) {
    e.preventDefault();

    if (!paymentNumber.trim()) {
      alert("Please enter payment number");
      return;
    }

    setNumberLoading(true);

    const { error } = await supabase.from("settings").upsert({
      key: "payment_number",
      value: paymentNumber.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      setNumberLoading(false);
      return;
    }

    setSavedPaymentNumber(paymentNumber.trim());
    setNumberLoading(false);
    alert("Payment number updated successfully");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
          <div className="mb-6 flex gap-2">
  {/* Desktop */}
  <Link
    href="/admin"
    className="hidden lg:inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Desktop Dashboard
  </Link>

  {/* Mobile */}
  <Link
    href="/admin-mobile"
    className="inline-flex lg:hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Dashboard
  </Link>
</div>

          <div className="mt-6">
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">
              Payment Settings
            </p>

            <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
              Payment QR & Number
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-gray-600">
              Manage the QR code and payment number shown to customers during
              checkout.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                ▣
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                Payment QR Code
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                Upload the QR code image customers will scan on the payment
                page.
              </p>
            </div>

            {/* Current picture + show / hide. Nothing is deleted by hiding. */}
            {settingsLoaded && currentQrUrl && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQrUrl}
                    alt="Current payment QR"
                    className={`h-24 w-24 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1 ${
                      qrIsHidden ? "opacity-40" : ""
                    }`}
                  />

                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                        qrIsHidden
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {qrIsHidden ? "Hidden" : "Shown"}
                    </span>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {qrIsHidden
                        ? "Customers see only the payment number. The picture is kept, so you can show it again at any time."
                        : "Customers see this QR on the payment page."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void setQrVisible(qrIsHidden)}
                  disabled={togglingQr || loading}
                  className={`mt-4 w-full rounded-2xl py-3 text-sm font-extrabold transition disabled:opacity-60 ${
                    qrIsHidden
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {togglingQr
                    ? "Saving..."
                    : qrIsHidden
                      ? "Show QR on the payment page"
                      : "Hide QR from the payment page"}
                </button>
              </div>
            )}

            <form onSubmit={uploadQr} className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-bold file:text-white focus:border-green-600"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? "Uploading..." : "Update Payment QR"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                #
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                Payment Number
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                Customers can copy this number if the QR code does not work.
              </p>
            </div>

            <form onSubmit={savePaymentNumber} className="space-y-4">
              <input
                type="text"
                placeholder="Enter payment number"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600 focus:bg-white"
              />

              <button
                type="submit"
                disabled={numberLoading}
                className="w-full rounded-2xl bg-green-600 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
              >
                {numberLoading ? "Saving..." : "Save Payment Number"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

