import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-extrabold text-gray-900">
          Profile
        </h1>

        <div className="space-y-4">
          <Link
            href="/orders"
            className="block rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
            <p className="mt-2 text-gray-600">
              Track your order status using your order number.
            </p>
          </Link>

          <Link
            href="/privacy-policy"
            className="block rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">Privacy Policy</h2>
          </Link>

          <Link
            href="/terms"
            className="block rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Terms & Conditions
            </h2>
          </Link>
        </div>
      </div>
    </main>
  );
}