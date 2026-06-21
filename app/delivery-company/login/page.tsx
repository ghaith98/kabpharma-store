"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeliveryCompanyLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("delivery_companies")
      .select("*")
      .eq("username", username.trim())
      .eq("password", password.trim())
      .eq("is_active", true)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Invalid username or password, or this account is inactive.");
      return;
    }

    localStorage.setItem("delivery_company", JSON.stringify(data));

    await supabase
      .from("delivery_companies")
      .update({
        is_online: true,
        last_seen: new Date().toISOString(),
      })
      .eq("id", data.id);

    router.push("/delivery-company");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
        <form
          onSubmit={handleLogin}
          className="w-full rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100"
        >
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Delivery Company Login
          </h1>

          <p className="mt-3 text-center text-gray-600">
            Sign in to manage delivery orders.
          </p>

          <div className="mt-8 space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[16px] text-black outline-none focus:border-green-600"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[16px] text-black outline-none focus:border-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}