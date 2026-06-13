import DriverPullToRefresh from "./DriverPullToRefresh";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DriverPullToRefresh />
      {children}
    </>
  );
}