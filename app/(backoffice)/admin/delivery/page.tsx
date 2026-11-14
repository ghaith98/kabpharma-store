"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { filterDeliveryAreas, normalizeAreaSearch } from "@/lib/delivery-area-search";
import { supabase } from "@/lib/supabase";

type Governorate = {
  id: number;
  governorate: string;
  governorate_ar?: string | null;
  governorate_en?: string | null;
  is_active: boolean;
};

type DeliveryArea = {
  id: number;
  governorate: string;
  area_name: string;
  area_name_ar?: string | null;
  area_name_en?: string | null;
  delivery_fee: number | string;
  newFee?: number | string;
  is_active: boolean;
};

export default function AdminDeliveryPage() {
  const router = useRouter();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [governorateNameAr, setGovernorateNameAr] = useState("");
  const [governorateNameEn, setGovernorateNameEn] = useState("");
  const [areaGovernorateFilter, setAreaGovernorateFilter] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [addingGovernorate, setAddingGovernorate] = useState(false);
  const [areaFee, setAreaFee] = useState("");
  const [areaNameAr, setAreaNameAr] = useState("");
const [areaNameEn, setAreaNameEn] = useState("");

  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loadingArea, setLoadingArea] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const loadGovernorates = useCallback(async () => {
    const { data, error } = await supabase
      .from("delivery_fees")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setGovernorates(data || []);
  }, []);

  const loadAreas = useCallback(async () => {
    const { data, error } = await supabase
      .from("delivery_areas")
      .select("*")
      .order("governorate", { ascending: true })
      .order("area_name", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setAreas(data || []);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "free_shipping_threshold");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data[0]?.value) {
      setFreeShippingThreshold(data[0].value);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadGovernorates(),
      loadAreas(),
      loadSettings(),
    ]);
  }, [loadAreas, loadGovernorates, loadSettings]);

  const checkAdmin = useCallback(async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/admin/login");
      return;
    }

    await loadAll();
  }, [loadAll, router]);

  async function addGovernorate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addingGovernorate) return;
    const arabic = governorateNameAr.trim().replace(/\s+/g, " ");
    const english = governorateNameEn.trim().replace(/\s+/g, " ");
    if (!/\p{Script=Arabic}/u.test(arabic) || !/[a-z]/i.test(english)) {
      alert("Enter the governorate name in both Arabic and English.");
      return;
    }

    const key = arabic === "دمشق" || english.toLowerCase() === "damascus"
      ? "Damascus"
      : english;
    const existing = governorates.some((item) =>
      [item.governorate, item.governorate_ar, item.governorate_en].some((name) =>
        name && [key, arabic, english].some((entered) =>
          normalizeAreaSearch(entered) === normalizeAreaSearch(name),
        ),
      ),
    );
    if (existing) {
      alert("This governorate already exists. Select it when adding a delivery area.");
      return;
    }

    setAddingGovernorate(true);
    try {
      const { error } = await supabase.from("delivery_fees").insert({
        governorate: key,
        governorate_ar: arabic,
        governorate_en: english,
        is_active: true,
      });
      if (error) {
        alert(error.code === "23505" ? "This governorate already exists." : error.message);
        return;
      }
      setGovernorateNameAr("");
      setGovernorateNameEn("");
      await loadGovernorates();
      setSelectedGovernorate(key);
    } catch {
      alert("Could not add the governorate. Please try again.");
    } finally {
      setAddingGovernorate(false);
    }
  }

  async function toggleGovernorateActive(item: Governorate) {
    setUpdatingId(item.id);

    const { error } = await supabase
      .from("delivery_fees")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    await loadGovernorates();
    setUpdatingId(null);
  }

  async function addArea(e: React.FormEvent) {
    e.preventDefault();

  if (!selectedGovernorate || (!areaNameAr.trim() && !areaNameEn.trim())) {
  alert("Please choose governorate and enter area name");
  return;
}

    setLoadingArea(true);

   const { error } = await supabase.from("delivery_areas").insert({
  governorate: selectedGovernorate,
  area_name: areaNameEn.trim() || areaNameAr.trim(),
  area_name_ar: areaNameAr.trim(),
  area_name_en: areaNameEn.trim(),
  delivery_fee: Number(areaFee || 0),
  is_active: true,
});

    if (error) {
      alert(error.message);
      setLoadingArea(false);
      return;
    }

setAreaNameAr("");
setAreaNameEn("");
setAreaFee("");
    await loadAreas();
    setLoadingArea(false);
  }

  async function updateAreaFee(id: number, fee: number) {
    setUpdatingId(id);

    const { error } = await supabase
      .from("delivery_areas")
      .update({ delivery_fee: fee })
      .eq("id", id);

    if (error) {
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    await loadAreas();
    setUpdatingId(null);
  }

  async function toggleAreaActive(area: DeliveryArea) {
    setUpdatingId(area.id);

    const { error } = await supabase
      .from("delivery_areas")
      .update({ is_active: !area.is_active })
      .eq("id", area.id);

    if (error) {
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    await loadAreas();
    setUpdatingId(null);
  }

  async function deleteArea(id: number) {
    const confirmDelete = confirm("Delete this delivery area?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("delivery_areas")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAreas();
  }

  async function saveFreeShippingThreshold() {
    setSavingThreshold(true);

    const { error } = await supabase.from("settings").upsert({
      key: "free_shipping_threshold",
      value: String(Number(freeShippingThreshold || 0)),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      setSavingThreshold(false);
      return;
    }

    await loadSettings();
    setSavingThreshold(false);
    alert("Free shipping threshold saved");
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void checkAdmin();
    });
  }, [checkAdmin]);

  const filteredAreas = filterDeliveryAreas(
    areaGovernorateFilter ? areas.filter((area) => area.governorate === areaGovernorateFilter) : areas,
    areaSearch,
  );
  const governorateKeys = [...new Set([
    ...governorates.map((item) => item.governorate),
    ...areas.map((area) => area.governorate),
  ])];
  const governorateLabel = (key: string) => {
    const item = governorates.find((entry) => entry.governorate === key);
    return [item?.governorate_en || key, item?.governorate_ar].filter(Boolean).join(" — ");
  };
  const fieldClass = "min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600";

  return (
  <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-10">
    <div className="mx-auto max-w-5xl">
      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
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

        <h1 className="mt-5 text-4xl font-extrabold text-gray-900">
          Delivery Settings
        </h1>

        <p className="mt-2 text-gray-600">
          Manage free shipping, governorates, and delivery areas.
        </p>
      </section>

      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
          Free Shipping
        </h2>

        <p className="mb-5 text-sm leading-6 text-gray-600">
          Orders equal or above this amount will have free delivery.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="number"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            placeholder="Example: 200000"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none transition focus:border-green-600 focus:bg-white sm:w-72"
          />

          <button
            onClick={saveFreeShippingThreshold}
            disabled={savingThreshold}
            className="rounded-2xl bg-green-600 px-6 py-4 font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {savingThreshold ? "Saving..." : "Save Threshold"}
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
          Governorates
        </h2>

        <form onSubmit={addGovernorate} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Governorate name in Arabic" placeholder="اسم المحافظة بالعربي"
            dir="rtl" required maxLength={100} value={governorateNameAr}
            onChange={(event) => setGovernorateNameAr(event.target.value)} className={fieldClass} />
          <input aria-label="Governorate name in English" placeholder="Governorate name in English"
            dir="ltr" required maxLength={100} value={governorateNameEn}
            onChange={(event) => setGovernorateNameEn(event.target.value)} className={fieldClass} />
          <button type="submit" disabled={addingGovernorate}
            className="rounded-2xl bg-gray-900 px-5 py-4 font-extrabold text-white hover:bg-black disabled:bg-gray-400">
            {addingGovernorate ? "Adding..." : "Add Governorate"}
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {governorates.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {governorateLabel(item.governorate)}
                  </h3>

                  <p
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                      item.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <button
                  onClick={() => toggleGovernorateActive(item)}
                  disabled={updatingId === item.id}
                  className={`rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition disabled:bg-gray-400 ${
                    item.is_active
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {item.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
          Add Delivery Area
        </h2>

        <form onSubmit={addArea} className="grid gap-3 sm:grid-cols-5">
          <select
            required
            aria-label="Governorate for the new delivery area"
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
          >
            <option value="">Select governorate</option>
            {governorates.map((item) => (
              <option key={item.id} value={item.governorate}>
                {governorateLabel(item.governorate)}
              </option>
            ))}
          </select>

         <input
  type="text"
  value={areaNameAr}
  onChange={(e) => setAreaNameAr(e.target.value)}
  placeholder="Area name Arabic"
  dir="rtl"
  required
  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
/>

<input
  type="text"
  value={areaNameEn}
  onChange={(e) => setAreaNameEn(e.target.value)}
  placeholder="Area name English"
  dir="ltr"
  required
  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
/>

          <input
            type="number"
            value={areaFee}
            onChange={(e) => setAreaFee(e.target.value)}
            placeholder="Delivery fee"
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
          />

          <button
            type="submit"
            disabled={loadingArea}
            className="rounded-2xl bg-gray-900 px-5 py-4 font-extrabold text-white transition hover:bg-black disabled:bg-gray-400"
          >
            {loadingArea ? "Adding..." : "Add Area"}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-2xl font-extrabold text-gray-900">
          Delivery Areas
        </h2>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <select aria-label="Filter delivery areas by governorate" value={areaGovernorateFilter}
            onChange={(event) => setAreaGovernorateFilter(event.target.value)} className={fieldClass}>
            <option value="">All governorates</option>
            {governorateKeys.map((key) => <option key={key} value={key}>{governorateLabel(key)}</option>)}
          </select>
          <input type="search" aria-label="Search delivery areas" placeholder="Search by area name"
            dir="auto" value={areaSearch} onChange={(event) => setAreaSearch(event.target.value)}
            className={fieldClass} />
        </div>
        <p className="mb-4 text-sm text-gray-600" aria-live="polite">
          {filteredAreas.length} of {areas.length} delivery areas
        </p>

        {filteredAreas.length === 0 ? (
          <p className="text-gray-600">{areas.length ? "No areas match the filters." : "No areas added yet."}</p>
        ) : (
          <div className="space-y-4">
            {filteredAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {area.governorate} — {area.area_name_en || area.area_name_ar || area.area_name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600" dir="rtl">
  Arabic: {area.area_name_ar || "-"}
</p>

<p className="mt-1 text-sm text-gray-600">
  English: {area.area_name_en || "-"}
</p>

                    <p className="mt-2 text-sm font-bold text-gray-600">
                      Fee: {Number(area.delivery_fee).toLocaleString()} SYP
                    </p>

                    <p
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                        area.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {area.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="number"
                      defaultValue={area.delivery_fee}
                      onChange={(e) => {
                        area.newFee = Number(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-black outline-none focus:border-green-600 sm:w-40"
                    />

                    <button
                      onClick={() =>
                        updateAreaFee(
                          area.id,
                          Number(area.newFee ?? area.delivery_fee)
                        )
                      }
                      disabled={updatingId === area.id}
                      className="rounded-2xl bg-green-600 px-4 py-3 font-extrabold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Save Fee
                    </button>

                    <button
                      onClick={() => toggleAreaActive(area)}
                      disabled={updatingId === area.id}
                      className={`rounded-2xl px-4 py-3 font-extrabold text-white transition disabled:bg-gray-400 ${
                        area.is_active
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {area.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => deleteArea(area.id)}
                      className="rounded-2xl bg-red-600 px-4 py-3 font-extrabold text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </main>
);
}

