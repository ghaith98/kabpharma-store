"use client";

import { useEffect, useState } from "react";
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
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-extrabold text-gray-900">
      Payment QR Settings
    </h1>

    <p className="mt-2 text-gray-700">
      Upload the QR code image that customers will use on the payment page.
    </p>
  </div>

  <a
    href="/admin"
    className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
  >
    Back to Dashboard
  </a>
</div>

          <form onSubmit={uploadQr} className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900">
              Payment QR Code
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full rounded-2xl border border-gray-300 p-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-semibold file:text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Uploading..." : "Update Payment QR"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <form onSubmit={savePaymentNumber} className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900">
              Payment Number
            </h2>

            <p className="text-gray-700">
              Customers can copy this number if the QR code does not work.
            </p>

            <input
              type="text"
              placeholder="Enter payment number"
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-300 p-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
            />

            <button
              type="submit"
              disabled={numberLoading}
              className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
            >
              {numberLoading ? "Saving..." : "Save Payment Number"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}