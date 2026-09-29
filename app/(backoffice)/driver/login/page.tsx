"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !password) {
      setError("الرجاء إدخال الاسم وكلمة المرور");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "driver",
          identifier: name.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(
          response.status === 429
            ? "محاولات كثيرة. يرجى المحاولة لاحقاً."
            : "اسم المستخدم أو كلمة المرور غير صحيحة"
        );
        return;
      }

      router.replace("/driver");
      router.refresh();
    } catch {
      setError("تعذر تسجيل الدخول. تحقق من الاتصال وحاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-green-50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
          تسجيل دخول السائق
        </h1>

        <p className="mb-6 text-center text-sm text-gray-500">
          أدخل بياناتك للمتابعة
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="driver-name"
              className="mb-2 block text-sm font-bold text-gray-700"
            >
              اسم السائق
            </label>
            <input
              id="driver-name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border p-3 text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-50"
            />
          </div>

          <div>
            <label
              htmlFor="driver-password"
              className="mb-2 block text-sm font-bold text-gray-700"
            >
              كلمة المرور
            </label>
            <input
              id="driver-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border p-3 text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-50"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 py-3 font-bold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}

