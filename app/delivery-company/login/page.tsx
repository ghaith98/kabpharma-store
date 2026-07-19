"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryCompanyLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "delivery_company",
          identifier: username.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts. Please try again later."
            : "Invalid username or password, or this account is inactive."
        );
        return;
      }

      router.replace("/delivery-company");
      router.refresh();
    } catch {
      setError("Could not sign in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
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
            <div>
              <label
                htmlFor="company-username"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                Username
              </label>
              <input
                id="company-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[16px] text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-50"
              />
            </div>

            <div>
              <label
                htmlFor="company-password"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                Password
              </label>
              <input
                id="company-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[16px] text-black outline-none focus:border-green-600 focus:ring-4 focus:ring-green-50"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-green-700 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-wait disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
