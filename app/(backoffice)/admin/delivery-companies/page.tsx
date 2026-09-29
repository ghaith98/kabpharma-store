"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Check,
  ChevronLeft,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";

type DeliveryCompany = {
  id: number;
  company_name: string;
  username: string;
  is_active: boolean;
  is_online: boolean;
  last_seen: string | null;
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminDeliveryCompaniesPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCompanies = useCallback(async () => {
    const { data, error } = await supabase
      .from("delivery_companies")
      .select("id, company_name, username, is_active, is_online, last_seen")
      .order("id", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    setCompanies(data || []);
    setLastRefreshAt(Date.now());
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.replace("/admin/login");
      return;
    }
    await loadCompanies();
  }, [loadCompanies, router]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  }

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!companyName.trim() || !username.trim() || !password.trim()) return;

    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setLoading(false);
      setFormError("Administrator session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/admin/staff-accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "delivery_company",
        name: companyName,
        username,
        password,
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFormError(result.error || "Could not add delivery company.");
      return;
    }

    setCompanyName("");
    setUsername("");
    setPassword("");
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
    loadCompanies();
  }

  async function toggleActive(company: DeliveryCompany) {
    setUpdatingId(company.id);
    const { error } = await supabase
      .from("delivery_companies")
      .update({ is_active: !company.is_active, is_online: false })
      .eq("id", company.id);
    setUpdatingId(null);
    if (error) { console.error(error.message); return; }
    loadCompanies();
  }

  async function deleteCompany(company: DeliveryCompany) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${company.company_name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(company.id);
    const { error } = await supabase
      .from("delivery_companies")
      .delete()
      .eq("id", company.id);
    setDeletingId(null);

    if (error) {
      console.error(error.message);
      return;
    }

    loadCompanies();
  }

  function isCompanyOnline(company: DeliveryCompany) {
    if (!company.last_seen || !company.is_active) return false;
    return lastRefreshAt - new Date(company.last_seen).getTime() < 2 * 60 * 1000;
  }

  useEffect(() => {
    window.queueMicrotask(() => { void checkAdmin(); });
    const interval = setInterval(() => { void loadCompanies(); }, 30000);
    return () => clearInterval(interval);
  }, [checkAdmin, loadCompanies]);

  const activeCount = companies.filter((c) => c.is_active).length;
  const onlineCount = companies.filter((c) => isCompanyOnline(c)).length;

  return (
    <main className="min-h-screen bg-[#f5f6f4] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl border border-[#dde4df] bg-white px-3 py-2 text-sm font-semibold text-[#4a5550] transition hover:border-[#0a583b] hover:text-[#0a583b] lg:inline-flex"
            >
              <ChevronLeft size={15} />
              Dashboard
            </Link>
            <Link
              href="/admin-mobile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dde4df] bg-white px-3 py-2 text-sm font-semibold text-[#4a5550] transition hover:border-[#0a583b] hover:text-[#0a583b] lg:hidden"
            >
              <ChevronLeft size={15} />
              Dashboard
            </Link>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dde4df] bg-white px-3 py-2 text-sm font-semibold text-[#4a5550] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Page title + stats ── */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111916]">
            Delivery Companies
          </h1>
          <p className="mt-1 text-[#647168]">
            Manage company access and monitor activity.
          </p>

          {/* Stat pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde4df] bg-white px-3 py-1.5 text-xs font-bold text-[#374840]">
              <Building2 size={12} className="text-[#0a583b]" />
              {companies.length} total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde4df] bg-white px-3 py-1.5 text-xs font-bold text-[#374840]">
              <Power size={12} className="text-[#0a583b]" />
              {activeCount} active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde4df] bg-white px-3 py-1.5 text-xs font-bold text-[#374840]">
              <Circle size={10} className="fill-[#22c55e] text-[#22c55e]" />
              {onlineCount} online now
            </span>
          </div>
        </div>

        {/* ── Add company form ── */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-[#dde4df] bg-white">
          <div className="border-b border-[#edf0ed] px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#111916]">
              <Plus size={16} className="text-[#0a583b]" />
              Add New Company
            </h2>
          </div>

          <form onSubmit={addCompany} className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-[#647168]">
                  Company name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Express Delivery Co."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#dde4df] bg-[#f8faf8] px-4 py-3 text-sm text-[#111916] outline-none transition focus:border-[#0a583b] focus:bg-white focus:ring-2 focus:ring-[#0a583b]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-[#647168]">
                  Username
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aaba0]" />
                  <input
                    type="text"
                    placeholder="login username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#dde4df] bg-[#f8faf8] py-3 pl-10 pr-4 text-sm text-[#111916] outline-none transition focus:border-[#0a583b] focus:bg-white focus:ring-2 focus:ring-[#0a583b]/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-[#647168]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="min. 10 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={1}
                    required
                    className="w-full rounded-xl border border-[#dde4df] bg-[#f8faf8] py-3 pl-4 pr-10 text-sm text-[#111916] outline-none transition focus:border-[#0a583b] focus:bg-white focus:ring-2 focus:ring-[#0a583b]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aaba0] hover:text-[#0a583b]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Adding...</>
                ) : (
                  <><Plus size={15} /> Add Company</>
                )}
              </button>

              {formSuccess && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0a583b]">
                  <Check size={15} /> Company added successfully
                </span>
              )}
            </div>
          </form>
        </section>

        {/* ── Companies list ── */}
        <section className="overflow-hidden rounded-2xl border border-[#dde4df] bg-white">
          <div className="border-b border-[#edf0ed] px-6 py-4">
            <h2 className="text-base font-extrabold text-[#111916]">
              Companies
              {companies.length > 0 && (
                <span className="ml-2 rounded-full bg-[#edf5f0] px-2.5 py-0.5 text-xs font-bold text-[#0a583b]">
                  {companies.length}
                </span>
              )}
            </h2>
          </div>

          {companies.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Building2 size={36} className="mx-auto mb-3 text-[#c8d5cd]" />
              <p className="font-bold text-[#647168]">No delivery companies yet.</p>
              <p className="mt-1 text-sm text-[#9aaba0]">Add one using the form above.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf0ed]">
              {companies.map((company) => {
                const online = isCompanyOnline(company);

                return (
                  <div key={company.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left: info */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        company.is_active
                          ? "bg-[#edf5f0] text-[#0a583b]"
                          : "bg-[#f1f1f0] text-[#9aaba0]"
                      }`}>
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-[#111916]">
                            {company.company_name}
                          </h3>

                          {/* Active / Inactive badge */}
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            company.is_active
                              ? "bg-[#edf5f0] text-[#0a583b]"
                              : "bg-[#fff0ee] text-[#c03030]"
                          }`}>
                            {company.is_active ? "Active" : "Inactive"}
                          </span>

                          {/* Online dot */}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            online
                              ? "bg-[#f0fdf4] text-[#15803d]"
                              : "bg-[#f5f6f4] text-[#9aaba0]"
                          }`}>
                            <Circle size={7} className={online ? "fill-[#22c55e] text-[#22c55e]" : "fill-[#c8d5cd] text-[#c8d5cd]"} />
                            {online ? "Online" : "Offline"}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#9aaba0]">
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {company.username}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {company.last_seen ? timeAgo(company.last_seen) : "Never seen"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => toggleActive(company)}
                        disabled={updatingId === company.id || deletingId === company.id}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition disabled:opacity-50 ${
                          company.is_active
                            ? "border border-[#fecaca] bg-[#fff5f5] text-[#c03030] hover:bg-[#fee2e2]"
                            : "border border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]"
                        }`}
                      >
                        {updatingId === company.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Power size={14} />
                        )}
                        {company.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => deleteCompany(company)}
                        disabled={deletingId === company.id || updatingId === company.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff5f5] px-4 py-2.5 text-sm font-extrabold text-[#c03030] transition hover:bg-[#fee2e2] disabled:opacity-50"
                      >
                        {deletingId === company.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
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