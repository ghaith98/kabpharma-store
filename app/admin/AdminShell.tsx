"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconType } from "react-icons";
import {
  FiHome,
  FiFileText,
  FiShoppingBag,
  FiPackage,
  FiGrid,
  FiTruck,
  FiMapPin,
  FiUsers,
  FiImage,
  FiStar,
  FiCreditCard,
  FiSettings,
  FiLogOut,
  FiExternalLink,
  FiChevronRight,
  FiUserCheck,
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type NavigationLink = {
  href: string;
  label: string;
  icon: IconType;
};

type NavigationGroup = {
  title: string;
  links: NavigationLink[];
};

const navigationGroups: NavigationGroup[] = [
  {
    title: "Overview",
    links: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: FiHome,
      },
    ],
  },
  {
    title: "Orders",
    links: [
      {
        href: "/admin/payment-proofs",
        label: "Payment Proofs",
        icon: FiFileText,
      },
      {
        href: "/admin/orders",
        label: "Shop Orders",
        icon: FiShoppingBag,
      },
    ],
  },
  {
    title: "Catalog",
    links: [
      {
        href: "/admin/products",
        label: "Products",
        icon: FiPackage,
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: FiGrid,
      },
    ],
  },
  {
    title: "Delivery",
    links: [
      {
        href: "/admin/delivery-orders/manage",
        label: "Delivery Orders",
        icon: FiTruck,
      },
      {
        href: "/admin/delivery-companies",
        label: "Delivery Companies",
        icon: FiMapPin,
      },
      {
        href: "/admin/drivers",
        label: "Drivers",
        icon: FiUsers,
      },
      {
        href: "/admin/delivery",
        label: "Fees & Areas",
        icon: FiSettings,
      },
    ],
  },
  {
    title: "Content",
    links: [
      {
        href: "/admin/banners",
        label: "Banners",
        icon: FiImage,
      },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: FiStar,
      },
    ],
  },
  {
    title: "Accounts",
    links: [
      {
        href: "/admin/users",
        label: "Users",
        icon: FiUserCheck,
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        href: "/admin/payment-settings",
        label: "Payment Settings",
        icon: FiCreditCard,
      },
    ],
  },
];

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage =
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin/login/");

  const currentPageTitle = useMemo(() => {
    const allLinks = navigationGroups.flatMap(
      (group) => group.links
    );

    const currentLink = allLinks
      .filter((link) => {
        if (link.href === "/admin") {
          return pathname === "/admin";
        }

        return pathname?.startsWith(link.href);
      })
      .sort(
        (first, second) =>
          second.href.length - first.href.length
      )[0];

    return currentLink?.label || "Administration";
  }, [pathname]);

  function isActiveLink(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname?.startsWith(href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[278px] flex-col border-r border-gray-200 bg-[#0b1511] text-white lg:flex">
        {/* Brand */}
        <div className="border-b border-white/10 px-5 py-6">
          <a
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-xl font-black text-white shadow-lg shadow-green-950/30">
              K
            </div>

            <div>
              <p className="text-lg font-extrabold tracking-tight">
                KAB Pharma
              </p>

              <p className="mt-0.5 text-xs font-semibold text-gray-400">
                Administration
              </p>
            </div>
          </a>
        </div>

        {/* Admin profile */}
        <div className="px-4 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/15 text-lg font-extrabold text-green-400 ring-1 ring-green-500/25">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">
                  Administrator
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400" />

                  <span className="text-xs font-semibold text-green-300">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-5">
          <div className="space-y-5">
            {navigationGroups.map((group) => (
              <section key={group.title}>
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-500">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.links.map((link) => {
                    const active = isActiveLink(
                      link.href
                    );

                    const Icon = link.icon;

                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                          active
                            ? "bg-green-500 text-white shadow-lg shadow-green-950/20"
                            : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`text-lg ${
                            active
                              ? "text-white"
                              : "text-gray-500 group-hover:text-green-400"
                          }`}
                        />

                        <span className="min-w-0 flex-1 truncate">
                          {link.label}
                        </span>

                        {active && (
                          <FiChevronRight className="shrink-0 text-sm" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/10 p-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <FiExternalLink className="text-lg text-gray-500" />
            <span>Open Website</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-3 py-3 text-left text-sm font-extrabold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Page area */}
      <div className="min-h-screen lg:pl-[278px]">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-40 hidden h-[74px] items-center justify-between border-b border-gray-200 bg-white/95 px-8 backdrop-blur lg:flex">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">
              Admin Panel
            </p>

            <h1 className="mt-1 text-xl font-extrabold text-gray-900">
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-green-300 hover:text-green-700"
            >
              <FiExternalLink />
              View Store
            </a>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-extrabold text-green-700">
              A
            </div>
          </div>
        </header>

        {/* Mobile admin bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <a
            href="/admin-mobile"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 font-extrabold text-white">
              K
            </div>

            <div>
              <p className="text-sm font-extrabold text-gray-900">
                KAB Admin
              </p>

              <p className="text-xs text-gray-500">
                {currentPageTitle}
              </p>
            </div>
          </a>

          <a
            href="/admin-mobile"
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-extrabold text-gray-700"
          >
            Menu
          </a>
        </header>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}