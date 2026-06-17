"use client";

import {
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

export default function ContactPage() {
  const { lang } = useLanguage();

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12"
    >
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "تواصل معنا" : "Contact Us"}
          </h1>

          <p className="mt-3 text-gray-600">
            {lang === "ar"
              ? "نحن هنا للمساعدة. لا تترددي في التواصل مع KAB Pharma في أي وقت."
              : "We're here to help. Feel free to contact KAB Pharma anytime."}
          </p>
        </section>

        <div className="mt-8 grid gap-4">
          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <FaInstagram
              size={24}
              className="text-pink-600"
            />

            <div>
              <h2 className="font-bold text-gray-900">
                Instagram
              </h2>

              <p className="text-sm text-gray-600">
                {lang === "ar"
                  ? "تابعينا وأرسلي لنا رسالة."
                  : "Follow us and send us a message."}
              </p>
            </div>
          </a>

          <a
            href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <FaFacebookF
              size={24}
              className="text-blue-600"
            />

            <div>
              <h2 className="font-bold text-gray-900">
                Facebook
              </h2>

              <p className="text-sm text-gray-600">
                {lang === "ar"
                  ? "تواصل معنا عبر فيسبوك."
                  : "Connect with us on Facebook."}
              </p>
            </div>
          </a>

          <a
            href="mailto:info@kabpharma.com"
            className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <FaEnvelope
              size={24}
              className="text-green-700"
            />

            <div>
              <h2 className="font-bold text-gray-900">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </h2>

              <p className="text-sm text-gray-600">
                kabpharma.sy@hotmail.com
              </p>
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}