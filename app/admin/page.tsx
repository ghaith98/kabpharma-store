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

    const stats = [
      { label: "Orders", value: ordersCount, tone: "bg-white text-gray-900" },
      { label: "Pending", value: pendingCount, tone: "bg-yellow-50 text-yellow-800" },
      { label: "Out for Delivery", value: deliveryCount, tone: "bg-blue-50 text-blue-800" },
      { label: "Delivered", value: deliveredCount, tone: "bg-green-50 text-green-800" },
      { label: "Rejected", value: rejectedCount, tone: "bg-red-50 text-red-800" },
      { label: "Cancelled", value: cancelledCount, tone: "bg-gray-100 text-gray-800" },
    ];
const links = [
  { href: "/admin/orders", label: "Shop Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/reviews", label: "Reviews" },

  { href: "/admin/delivery-orders", label: "Add Delivery Order" },
  { href: "/admin/delivery-orders/manage", label: "Manage Delivery Orders" },
  { href: "/admin/delivery", label: "Delivery Fees" },

  { href: "/admin/payment-settings", label: "Payment Settings" },
  { href: "/admin/drivers", label: "Drivers" },
];

    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <section className="mb-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">
              KAB Pharma
            </p>

            <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage orders, products, banners, reviews and settings.
                </p>
              </div>

              <div className="rounded-3xl bg-green-600 px-6 py-4 text-white shadow-sm">
                <p className="text-sm font-bold opacity-90">Revenue</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {revenue.toLocaleString()} SYP
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {stats.map((item) => (
              <div
                key={item.label}
                className={`rounded-3xl p-5 shadow-sm ring-1 ring-gray-100 ${item.tone}`}
              >
                <p className="text-sm font-bold opacity-80">{item.label}</p>
                <h2 className="mt-3 text-4xl font-extrabold">{item.value}</h2>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-5 text-xl font-extrabold text-gray-900">
              Management
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 font-extrabold text-gray-800 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  {link.label}
                </a>
              ))}
              <button
  onClick={async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }}
  className="rounded-2xl border border-red-100 bg-red-100 px-5 py-4 text-left font-extrabold text-red-700 transition hover:bg-red-100"
>
  Logout
</button>
            </div>
          </section>
        </div>
      </main>
    );
  }