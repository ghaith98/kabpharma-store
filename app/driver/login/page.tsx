"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DriverLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !password) {
      setError("الرجاء إدخال الاسم وكلمة المرور");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("delivery_drivers")
      .select("*")
      .eq("name", name.trim())
      .eq("password", password.trim())
      .eq("is_active", true)
      .single();

    setLoading(false);

    if (error || !data) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }

    localStorage.setItem("driver_name", data.name);
    localStorage.setItem("driver_id", data.id);

    router.replace("/driver");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-green-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">

        <h1 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
          تسجيل دخول السائق
        </h1>

        <p className="mb-6 text-center text-sm text-gray-500">
          أدخل بياناتك للمتابعة
        </p>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="text"
            placeholder="اسم السائق"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border p-3 text-black outline-none focus:border-green-600"
          />

          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border p-3 text-black outline-none focus:border-green-600"
          />

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
