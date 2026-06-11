"use client";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-block rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-50"
    >
      ← Back
    </button>
  );
}