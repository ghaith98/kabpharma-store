"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PaymentSettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [numberLoading, setNumberLoading] = useState(false);

  useEffect(() => {
    async function loadPaymentNumber() {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_number")
        .single();

      if (data?.value) {
        setPaymentNumber(data.value);
      }
    }

    loadPaymentNumber();
  }, []);

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

    const { error } = await supabase.from("settings").upsert({
      key: "payment_qr_url",
      value: data.publicUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setFile(null);
    alert("Payment QR updated successfully");
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
