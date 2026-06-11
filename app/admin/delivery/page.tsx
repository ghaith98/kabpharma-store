"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDeliveryPage() {
  const router = useRouter();

  const [fees, setFees] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    loadFees();
  }

  async function loadFees() {
    const { data, error } = await supabase
      .from("delivery_fees")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setFees(data || []);
  }

  async function updateFee(id: number, fee: number) {
    setUpdatingId(id);

    const { error } = await supabase
      .from("delivery_fees")
      .update({ fee })
      .eq("id", id);

    if (error) {
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    await loadFees();
    setUpdatingId(null);
  }

  async function toggleActive(item: any) {
    setUpdatingId(item.id);

    const { error } = await supabase
      .from("delivery_fees")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    await loadFees();
    setUpdatingId(null);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery Fees
          </h1>

          <a
            href="/admin"
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="space-y-4">
          {fees.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {item.governorate}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Current fee: {Number(item.fee).toLocaleString()} SYP
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold ${
                      item.is_active ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    defaultValue={item.fee}
                    onChange={(e) => {
                      item.newFee = Number(e.target.value);
                    }}
                    className="w-full rounded-xl border p-3 text-black sm:w-40"
                  />

                  <button
                    onClick={() =>
                      updateFee(item.id, Number(item.newFee ?? item.fee))
                    }
                    disabled={updatingId === item.id}
                    className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white disabled:bg-gray-400"
                  >
                    {updatingId === item.id ? "Saving..." : "Save Fee"}
                  </button>

                  <button
                    onClick={() => toggleActive(item)}
                    disabled={updatingId === item.id}
                    className={`rounded-xl px-4 py-2 font-semibold text-white disabled:bg-gray-400 ${
                      item.is_active
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}