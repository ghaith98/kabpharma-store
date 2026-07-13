"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SIGNED_URL_EXPIRY_SECONDS = 10 * 60;

type OrderItem = {
  id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
};

type PaymentOrderFromDatabase = {
  id: number;
  customer_name: string | null;
  phone: string | null;
  governorate: string | null;
  delivery_area: string | null;
  address: string | null;
  delivery_fee: number | null;
  total_price: number | null;
  status: string;
  created_at: string | null;
  payment_proof_path: string | null;
  payment_proof_reviewed_at: string | null;
  payment_proof_deleted_at: string | null;
  order_items: OrderItem[];
};

type PaymentOrder = PaymentOrderFromDatabase & {
  payment_proof_signed_url: string | null;
  payment_proof_signed_url_error: string | null;
};

export default function AdminPaymentProofsPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [newOrderId, setNewOrderId] = useState<number | null>(null);

  async function createPaymentProofSignedUrl(
    paymentProofPath: string
  ): Promise<{
    signedUrl: string | null;
    errorMessage: string | null;
  }> {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(
        paymentProofPath,
        SIGNED_URL_EXPIRY_SECONDS
      );

    if (error || !data?.signedUrl) {
      console.error(
        `Failed to create signed URL for ${paymentProofPath}:`,
        error
      );

      return {
        signedUrl: null,
        errorMessage:
          error?.message || "Could not create secure payment proof link.",
      };
    }

    return {
      signedUrl: data.signedUrl,
      errorMessage: null,
    };
  }

  const loadPaymentProofs = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        customer_name,
        phone,
        governorate,
        delivery_area,
        address,
        delivery_fee,
        total_price,
        status,
        created_at,
        payment_proof_path,
        payment_proof_reviewed_at,
        payment_proof_deleted_at,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          variant_label_ar,
          variant_label_en
        )
      `)
      .eq("status", "pending")
      .not("payment_proof_path", "is", null)
      .is("payment_proof_deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load payment proofs:", error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    const databaseOrders =
      (data || []) as PaymentOrderFromDatabase[];

    const ordersWithSignedUrls = await Promise.all(
      databaseOrders.map(async (order) => {
        if (!order.payment_proof_path) {
          return {
            ...order,
            payment_proof_signed_url: null,
            payment_proof_signed_url_error:
              "Payment proof path is missing.",
          };
        }

        const signedUrlResult =
          await createPaymentProofSignedUrl(
            order.payment_proof_path
          );

        return {
          ...order,
          payment_proof_signed_url: signedUrlResult.signedUrl,
          payment_proof_signed_url_error:
            signedUrlResult.errorMessage,
        };
      })
    );

    setOrders(ordersWithSignedUrls);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializePage() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/admin/login");
        return;
      }

      if (!mounted) return;

      await loadPaymentProofs();

      if (mounted) {
        setChecking(false);
      }
    }

    initializePage();

    return () => {
      mounted = false;
    };
  }, [loadPaymentProofs, router]);

  useEffect(() => {
    if (checking) return;

    const channel = supabase
      .channel("admin-payment-proof-inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder = payload.new as {
            id?: number;
            status?: string;
            payment_proof_path?: string | null;
          };

          if (
            newOrder.status === "pending" &&
            newOrder.payment_proof_path
          ) {
            setNewOrderId(newOrder.id || null);

            setMessage(
              newOrder.id
                ? `New payment proof received for Order #${newOrder.id}`
                : "A new payment proof was received."
            );

            await loadPaymentProofs();

            window.setTimeout(() => {
              setMessage("");
              setNewOrderId(null);
            }, 5000);
          }
        }
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error:", error);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checking, loadPaymentProofs]);

  async function updatePaymentStatus(
    orderId: number,
    nextStatus: "accepted" | "rejected"
  ) {
    const confirmationMessage =
      nextStatus === "accepted"
        ? `Accept payment proof for Order #${orderId}?`
        : `Reject payment proof for Order #${orderId}?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage("");

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
      })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("id, status, payment_proof_reviewed_at")
      .single();

    if (error) {
      console.error("Failed to update payment status:", error);
      setMessage(`Error: ${error.message}`);
      setUpdatingOrderId(null);
      return;
    }

    if (!data) {
      setMessage(
        `Order #${orderId} could not be updated. Its status may have already changed.`
      );

      setUpdatingOrderId(null);
      await loadPaymentProofs();
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.filter((order) => order.id !== orderId)
    );

    setMessage(
      nextStatus === "accepted"
        ? `Payment for Order #${orderId} was accepted.`
        : `Payment for Order #${orderId} was rejected.`
    );

    setUpdatingOrderId(null);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function isPdf(order: PaymentOrder) {
    return (
      order.payment_proof_path?.toLowerCase().endsWith(".pdf") ??
      false
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "Unknown";

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString();
  }

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) => {
      const searchableText = [
        order.id,
        order.customer_name,
        order.phone,
        order.governorate,
        order.delivery_area,
        order.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [orders, search]);

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-center font-bold text-gray-700">
          Checking admin access...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">
                KAB Pharma
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Payment Proof Inbox
              </h1>

              <p className="mt-2 text-gray-600">
                Review customer payment receipts before accepting
                orders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-yellow-50 px-5 py-3 text-yellow-800 ring-1 ring-yellow-100">
                <p className="text-xs font-bold uppercase">
                  Waiting for review
                </p>

                <p className="mt-1 text-3xl font-extrabold">
                  {orders.length}
                </p>
              </div>

              <button
                type="button"
                onClick={loadPaymentProofs}
                disabled={loading}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Refreshing secure links..."
                  : "Refresh"}
              </button>

              <a
                href="/admin"
                className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Dashboard
              </a>
            </div>
          </div>
        </section>

        {/* Notification */}
        {message && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 font-bold shadow-sm ${
              message.startsWith("Error")
                ? "border-red-200 bg-red-50 text-red-700"
                : newOrderId
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Secure link note */}
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-800">
          Receipt links are temporary and expire after 10 minutes.
          Press Refresh to generate new secure links.
        </div>

        {/* Search */}
        <section className="mt-6 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order ID, customer, phone or address..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none transition focus:border-green-600 focus:bg-white"
          />
        </section>

        {/* Empty state */}
        {!loading && filteredOrders.length === 0 && (
          <section className="mt-6 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <div className="text-5xl">✅</div>

            <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
              No receipts waiting for review
            </h2>

            <p className="mt-2 text-gray-600">
              New payment proofs will appear here automatically.
            </p>
          </section>
        )}

        {/* Payment proof cards */}
        <section className="mt-6 space-y-6">
          {filteredOrders.map((order) => {
            const updating = updatingOrderId === order.id;
            const signedUrl =
              order.payment_proof_signed_url;

            return (
              <article
                key={order.id}
                className={`overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 transition ${
                  newOrderId === order.id
                    ? "ring-2 ring-blue-400"
                    : "ring-gray-100"
                }`}
              >
                <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
                  {/* Order details */}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-green-700">
                          PAYMENT REVIEW
                        </p>

                        <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                          Order #{order.id}
                        </h2>
                      </div>

                      <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-extrabold text-yellow-800">
                        Pending Review
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 rounded-3xl bg-gray-50 p-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Customer
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {order.customer_name || "Unknown"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Phone
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 text-left font-bold text-gray-900"
                        >
                          {order.phone || "Unknown"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Governorate
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {order.governorate || "Not selected"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Area
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {order.delivery_area || "Not selected"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Address
                        </p>

                        <p className="mt-1 font-bold text-gray-900">
                          {order.address || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Submitted
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-green-700">
                          {Number(
                            order.total_price || 0
                          ).toLocaleString()}{" "}
                          SYP
                        </p>
                      </div>
                    </div>

                    {/* Order items */}
                    {order.order_items?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-extrabold text-gray-900">
                          Order Items
                        </h3>

                        <div className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                          {order.order_items.map((item) => {
                            const variant =
                              item.variant_label_en ||
                              item.variant_label_ar;

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-4 bg-white px-4 py-3"
                              >
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {item.product_name || "Product"}
                                  </p>

                                  {variant && (
                                    <p className="mt-0.5 text-xs font-bold text-green-700">
                                      {variant}
                                    </p>
                                  )}

                                  <p className="mt-1 text-sm text-gray-500">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>

                                <p className="shrink-0 font-extrabold text-gray-900">
                                  {(
                                    Number(item.unit_price || 0) *
                                    Number(item.quantity || 0)
                                  ).toLocaleString()}{" "}
                                  SYP
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          updatePaymentStatus(
                            order.id,
                            "accepted"
                          )
                        }
                        className="flex-1 rounded-2xl bg-green-600 px-5 py-4 font-extrabold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updating
                          ? "Updating..."
                          : "✓ Accept Payment"}
                      </button>

                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          updatePaymentStatus(
                            order.id,
                            "rejected"
                          )
                        }
                        className="flex-1 rounded-2xl bg-red-600 px-5 py-4 font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updating
                          ? "Updating..."
                          : "✕ Reject Payment"}
                      </button>
                    </div>
                  </div>

                  {/* Receipt preview */}
                  <div className="border-t border-gray-100 bg-gray-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-extrabold text-gray-900">
                        Payment Proof
                      </h3>

                      {signedUrl && (
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-extrabold text-green-700 underline underline-offset-4 transition hover:text-green-800"
                        >
                          Open Secure Link
                        </a>
                      )}
                    </div>

                    <div className="mt-4 flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white">
                      {!signedUrl ? (
                        <div className="p-8 text-center">
                          <div className="text-5xl">🔒</div>

                          <p className="mt-4 font-extrabold text-red-600">
                            Could not open payment proof.
                          </p>

                          <p className="mt-2 break-words text-sm text-gray-500">
                            {order.payment_proof_signed_url_error ||
                              "Secure link is unavailable."}
                          </p>

                          <button
                            type="button"
                            onClick={loadPaymentProofs}
                            className="mt-5 rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : isPdf(order) ? (
                        <div className="p-8 text-center">
                          <div className="text-6xl">📄</div>

                          <p className="mt-4 font-extrabold text-gray-900">
                            PDF Payment Proof
                          </p>

                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
                          >
                            Open Secure PDF
                          </a>
                        </div>
                      ) : (
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-full w-full"
                        >
                          <img
                            src={signedUrl}
                            alt={`Payment proof for order ${order.id}`}
                            className="max-h-[620px] w-full object-contain"
                          />
                        </a>
                      )}
                    </div>

                    <p className="mt-4 break-all text-xs text-gray-500">
                      Storage path:{" "}
                      {order.payment_proof_path ||
                        "Not available"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}