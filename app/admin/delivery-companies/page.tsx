"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DeliveryCompany = {
  id: number;
  company_name: string;
  username: string;
  password: string;
  is_active: boolean;
  is_online: boolean;
  last_seen: string | null;
};

export default function AdminDeliveryCompaniesPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    loadCompanies();
  }

  async function loadCompanies() {
    const { data, error } = await supabase
      .from("delivery_companies")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCompanies(data || []);
  }

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim() || !username.trim() || !password.trim()) return;

    setLoading(true);

    const { error } = await supabase.from("delivery_companies").insert({
      company_name: companyName.trim(),
      username: username.trim(),
      password: password.trim(),
      is_active: true,
      is_online: false,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCompanyName("");
    setUsername("");
    setPassword("");
    loadCompanies();
  }

  async function toggleActive(company: DeliveryCompany) {
    setUpdatingId(company.id);

    const { error } = await supabase
      .from("delivery_companies")
      .update({
        is_active: !company.is_active,
        is_online: false,
      })
      .eq("id", company.id);

    setUpdatingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    loadCompanies();
  }

  function isCompanyOnline(company: DeliveryCompany) {
    if (!company.last_seen || !company.is_active) return false;

    const diff = Date.now() - new Date(company.last_seen).getTime();
    return diff < 2 * 60 * 1000;
  }

 useEffect(() => {
  checkAdmin();

  const interval = setInterval(() => {
    loadCompanies();
  }, 30000);

  return () => clearInterval(interval);
}, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex gap-2">
          <a
            href="/admin"
            className="hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:inline-flex"
          >
            ← Desktop Dashboard
          </a>

          <a
            href="/admin-mobile"
            className="inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
          >
            ← Dashboard
          </a>
        </div>

        <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Delivery Companies
          </h1>

          <p className="mt-2 text-gray-600">
            Add and manage delivery company access.
          </p>
        </section>

        <form
          onSubmit={addCompany}
          className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          <h2 className="mb-5 text-xl font-extrabold text-gray-900">
            Add Delivery Company
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
            />

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
            />

            <input
              type="text"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Adding..." : "Add Company"}
          </button>
        </form>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-5 text-xl font-extrabold text-gray-900">
            Companies
          </h2>

          {companies.length === 0 ? (
            <p className="text-gray-600">No delivery companies yet.</p>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => {
                const online = isCompanyOnline(company);

                return (
                  <div
                    key={company.id}
                    className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900">
                          {company.company_name}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-gray-600">
                          Username: {company.username}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                              company.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {company.is_active ? "Active" : "Inactive"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                              online
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {online ? "Online" : "Offline"}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Last seen:{" "}
                          {company.last_seen
                            ? new Date(company.last_seen).toLocaleString()
                            : "-"}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleActive(company)}
                        disabled={updatingId === company.id}
                        className={`rounded-2xl px-5 py-3 font-bold text-white transition disabled:bg-gray-400 ${
                          company.is_active
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {company.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}