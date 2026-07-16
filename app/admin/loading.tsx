export default function AdminLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dashboard"
      className="animate-pulse space-y-6 p-5 sm:p-8"
    >
      <div className="h-10 w-64 max-w-full rounded-xl bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-3xl bg-white ring-1 ring-gray-100"
          />
        ))}
      </div>
      <div className="h-80 rounded-3xl bg-white ring-1 ring-gray-100" />
    </div>
  );
}
