"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverLoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("delivery_drivers")
      .select("*")
      .eq("name", name.trim())
      .eq("password", password.trim())
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Wrong name or password");
      return;
    }

    localStorage.setItem("driver_id", data.id);
    localStorage.setItem("driver_name", data.name);

    window.location.href = "/driver";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow"
      >
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Driver Login
        </h1>

        <input
          type="text"
          placeholder="Driver Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mb-3 w-full rounded-xl border p-3 text-black"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-5 w-full rounded-xl border p-3 text-black"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}