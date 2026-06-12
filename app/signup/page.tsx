"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !phone) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("profiles").insert({
      full_name: fullName,
      phone,
    });

    setLoading(false);

    if (error) {
  if (
    error.message.includes("duplicate key") ||
    error.message.includes("profiles_phone_key")
  ) {
    setErrorMessage("This phone number is already registered.");
  } else {
    setErrorMessage(error.message);
  }

  return;
}

    localStorage.setItem(
      "kab_user",
      JSON.stringify({
        full_name: fullName,
        phone,
      })
    );

    window.location.href = "/profile";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Create Account
        </h1>

        <p className="mt-2 text-gray-600">
          Sign up using your mobile number.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-green-600"
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-green-600"
          />
          {errorMessage && (
  <p className="text-sm font-medium text-red-600">
    {errorMessage}
  </p>
)}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}