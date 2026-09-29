export default function ShopByNeedLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="h-[200px] animate-pulse bg-[#f1f3f1] sm:h-[230px] md:h-[420px]" />

      <div className="mx-auto max-w-[1720px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 h-5 w-28 animate-pulse rounded-full bg-[#edf0ed]" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-[#f1f3f1]" />
              <div className="mt-4 h-4 w-3/4 rounded bg-[#edf0ed]" />
              <div className="mt-3 h-4 w-1/3 rounded bg-[#edf0ed]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
