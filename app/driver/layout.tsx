import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";
import DriverPullToRefresh from "./DriverPullToRefresh";

export const metadata = noIndexMetadata;

export default function DriverLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DriverPullToRefresh />
      {children}
    </>
  );
}