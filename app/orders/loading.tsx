export default function OrdersLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading orders"
      className="min-h-screen bg-[#f7f8f6] px-5 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="mx-auto h-12 w-56 rounded-2xl bg-[#e1e7e3]" />
        <div className="mx-auto mt-4 h-4 w-80 max-w-full rounded-full bg-[#e8ece9]" />

        <div className="mt-10 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-[1.75rem] border border-[#e2e7e3] bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

