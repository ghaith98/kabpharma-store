"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDeliveryPage() {
  const router = useRouter();

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  const [selectedGovernorate, setSelectedGovernorate] = useState("Damascus");
  const [areaName, setAreaName] = useState("");
  const [areaFee, setAreaFee] = useState("");

  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [loadingArea, setLoadingArea] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/admin/login");
      return;
    }

    await loadAll();
  }

  async function loadAll() {
    await Promise.all([
      loadGovernorates(),
      loadAreas(),
      loadSettings(),
    ]);
  }

  async function loadGovernorates() {
    const { data, error } = await supabase
      .from("delivery_fees")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setGovernorates(data || []);
  }

  async function loadAreas() {
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
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "free_shipping_threshold");

    if (error) {
      alert(error.message);
      return;
    }

    setSettings(data || []);

    if (data && data[0]?.value) {
      setFreeShippingThreshold(data[0].value);
    }
  }

  async function toggleGovernorateActive(item: any) {
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

    if (!selectedGovernorate || !areaName.trim()) {
      alert("Please choose governorate and enter area name");
      return;
    }

    setLoadingArea(true);

    const { error } = await supabase.from("delivery_areas").insert({
      governorate: selectedGovernorate,
      area_name: areaName.trim(),
      delivery_fee: Number(areaFee || 0),
      is_active: true,
    });

    if (error) {
      alert(error.message);
      setLoadingArea(false);
      return;
    }

    setAreaName("");
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

  async function toggleAreaActive(area: any) {
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
    checkAdmin();
  }, []);

  const activeGovernorates = governorates.filter((item) => item.is_active);

  return (
  <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-10">
    <div className="mx-auto max-w-5xl">
      <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <a
          href="/admin"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold text-gray-800 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          ← Dashboard
        </a>

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

        <div className="grid gap-4 md:grid-cols-2">
          {governorates.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {item.governorate}
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

        <form onSubmit={addArea} className="grid gap-3 sm:grid-cols-4">
          <select
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black outline-none focus:border-green-600"
          >
            {governorates.map((item) => (
              <option key={item.id} value={item.governorate}>
                {item.governorate}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="Area name"
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

        {areas.length === 0 ? (
          <p className="text-gray-600">No areas added yet.</p>
        ) : (
          <div className="space-y-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {area.governorate} — {area.area_name}
                    </h3>

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