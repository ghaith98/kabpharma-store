"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/orders/print") {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
