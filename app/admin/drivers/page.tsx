"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Driver = {
  id: string;
  name: string;
  password: string;
  is_active: boolean;
  created_at?: string | null;
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function loadDrivers() {
    const { data, error } = await supabase
      .from("delivery_drivers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setDrivers(data || []);
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("delivery_drivers").insert({
      name: name.trim(),
      password: password.trim(),
      is_active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPassword("");
    loadDrivers();
  }

  async function toggleActive(driver: Driver) {
    const { error } = await supabase
      .from("delivery_drivers")
      .update({ is_active: !driver.is_active })
      .eq("id", driver.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDrivers();
  }

  async function deleteDriver(id: string) {
    const ok = confirm("Delete this driver account?");
    if (!ok) return;

    const { error } = await supabase
      .from("delivery_drivers")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadDrivers();
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void loadDrivers();
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
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

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Delivery Drivers
        </h1>

        <form
          onSubmit={addDriver}
          className="mb-8 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="mb-5 text-xl font-bold">Add Driver</h2>

          <input
            type="text"
            placeholder="Driver name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

        

          <input
            type="text"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-5 w-full rounded-xl border p-3 text-black"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
          >
            Add Driver
          </button>
        </form>

        <div className="space-y-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <h3 className="text-xl font-bold text-gray-900">
                {driver.name}
              </h3>

              <p className="text-gray-600">
  Password: {driver.password}
</p>

              <p
                className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${
                  driver.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {driver.is_active ? "Active" : "Inactive"}
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => toggleActive(driver)}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                >
                  {driver.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => deleteDriver(driver.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                >
                  Delete Account
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
