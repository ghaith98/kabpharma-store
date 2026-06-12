import { FaPhoneAlt } from "react-icons/fa";
import Link from "next/link";
import {
  FaBoxOpen,
  FaShieldAlt,
  FaFileContract,
  FaFacebookF,
  FaInstagram,
  FaChevronRight,
} from "react-icons/fa";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-8 rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
    👤
  </div>

  <h1 className="text-4xl font-extrabold text-gray-900">
    Your Account
  </h1>

  <p className="mt-3 text-gray-600">
    Track your orders and access KAB Pharma information.
  </p>
</section>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/orders"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaBoxOpen />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  My Orders
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Track your order status.
                </p>
              </div>
            </div>

            <FaChevronRight className="text-gray-400 transition group-hover:text-green-700" />
          </Link>
          <Link
  href="/contact"
  className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
>
  <div className="flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
      <FaPhoneAlt />
    </div>

    <div>
      <h2 className="text-lg font-bold text-gray-900">
        Contact Us
      </h2>

      <p className="mt-1 text-sm text-gray-600">
        Get in touch with KAB Pharma.
      </p>
    </div>
  </div>

  <FaChevronRight className="text-gray-400 transition group-hover:text-green-700" />
</Link>
          
          

          <Link
            href="/privacy-policy"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaShieldAlt />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Privacy Policy
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  How your information is handled.
                </p>
              </div>
            </div>

            <FaChevronRight className="text-gray-400 transition group-hover:text-green-700" />
          </Link>

          <Link
            href="/terms"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaFileContract />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Terms & Conditions
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Website and order terms.
                </p>
              </div>
            </div>

            <FaChevronRight className="text-gray-400 transition group-hover:text-green-700" />
          </Link>
        </div>

        <section className="mt-8 rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Follow KAB Pharma
          </h2>

          <div className="mt-5 flex justify-center gap-4">
            <a
              href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}