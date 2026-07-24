export default function ProductsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading products"
      className="min-h-screen bg-[#f7f8f6] px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <div className="mx-auto h-3 w-24 rounded-full bg-[#d8e4dc]" />
        <div className="mx-auto mt-5 h-11 w-64 rounded-2xl bg-[#e1e7e3] sm:h-14 sm:w-96" />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.5rem] border border-[#e2e7e3] bg-white"
            >
              <div className="aspect-square bg-[#eef1ef]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-4/5 rounded-full bg-[#e3e8e4]" />
                <div className="h-4 w-1/2 rounded-full bg-[#d8e4dc]" />
                <div className="h-11 rounded-full bg-[#e7ebe8]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

