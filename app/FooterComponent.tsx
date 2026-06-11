"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10 text-center">
        <h3 className="text-xl font-bold text-green-700">KAB Pharma</h3>

        <p className="mt-3 text-gray-600">
          THE QUALITY FOR A HEALTHIER LIFE
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
          >
            <FaFacebookF size={20} />
          </a>

          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
          >
            <FaInstagram size={20} />
          </a>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-sm font-medium">
          <Link href="/privacy-policy" className="text-gray-600 hover:text-green-700">
            Privacy Policy
          </Link>

          <Link href="/terms" className="text-gray-600 hover:text-green-700">
            Terms & Conditions
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          © 2026 KAB Pharma. All rights reserved.
        </p>
      </div>
    </footer>
  );
}