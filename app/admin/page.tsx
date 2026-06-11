"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [ordersCount, setOrdersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
const [categoryId, setCategoryId] = useState("");

const [editCategoryId, setEditCategoryId] = useState("");

  async function loadDashboard() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/admin/login");
      return;
    }

    const { count: orders } = await supabase
  .from("orders")
  .select("*", { count: "exact", head: true })
  .neq("status", "cancelled_by_customer");

    const { count: pending } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: delivery } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "out_for_delivery");

    const { count: delivered } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered");

    const { count: rejected } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected");

    const { count: cancelled } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled_by_customer");

    const { data: deliveredOrders } = await supabase
      .from("orders")
      .select("total_price")
      .eq("status", "delivered");

    setOrdersCount(orders || 0);
    setPendingCount(pending || 0);
    setDeliveryCount(delivery || 0);
    setDeliveredCount(delivered || 0);
    setRejectedCount(rejected || 0);
    setCancelledCount(cancelled || 0);

    const totalRevenue =
      deliveredOrders?.reduce(
        (sum, order) => sum + Number(order.total_price || 0),
        0
      ) || 0;

    setRevenue(totalRevenue);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Orders</p>
            <h2 className="mt-2 text-4xl font-bold">{ordersCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Pending</p>
            <h2 className="mt-2 text-4xl font-bold">{pendingCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Out for Delivery</p>
            <h2 className="mt-2 text-4xl font-bold">{deliveryCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Delivered</p>
            <h2 className="mt-2 text-4xl font-bold">{deliveredCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Rejected</p>
            <h2 className="mt-2 text-4xl font-bold">{rejectedCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Cancelled</p>
            <h2 className="mt-2 text-4xl font-bold">{cancelledCount}</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow md:col-span-2 lg:col-span-2">
            <p className="text-gray-500">Revenue</p>
            <h2 className="mt-2 text-2xl font-bold">
              {revenue.toLocaleString()} SYP
            </h2>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/admin/orders"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Orders
          </a>
          <a
  href="/admin/banners"
  className="rounded-xl bg-black px-5 py-3 text-white"
>
  Banners
</a>


          <a
            href="/admin/products"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Products
          </a>
          <a
  href="/admin/categories"
  className="rounded-xl bg-black px-5 py-3 text-white"
>
  Categories
</a>
<a
  href="/admin/delivery"
  className="rounded-xl bg-black px-5 py-3 text-white"
>
  Delivery Fees
</a>

          <a
            href="/admin/payment-settings"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Payment Settings
          </a>
        </div>
      </div>
    </main>
  );
}