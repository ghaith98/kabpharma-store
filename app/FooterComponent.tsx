export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10 text-center">
        <h3 className="text-xl font-bold text-green-700">
          KAB Pharma
        </h3>

        <p className="mt-3 text-gray-600">
          THE QUALITY FOR A HEALTHIER LIFE
        </p>

        <div className="mt-6">
          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-700 hover:text-green-800"
          >
            Instagram
          </a>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          © 2026 KAB Pharma. All rights reserved.
        </p>
      </div>
    </footer>
  );
}