export default function ProductDetailsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading product"
      className="min-h-screen bg-white px-4 pb-20 pt-4 sm:px-6 sm:pt-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-[1400px] animate-pulse gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12">
        <div>
          <div className="aspect-square bg-[#f1f3f1]" />
          <div className="mt-3 flex gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[72px] w-[72px] bg-[#edf0ed] sm:h-20 sm:w-20"
              />
            ))}
          </div>
        </div>

        <div className="pt-2 lg:pt-8">
          <div className="h-3 w-24 rounded-full bg-[#dce5df]" />
          <div className="mt-5 h-10 w-4/5 rounded-xl bg-[#e7ece8] sm:h-12" />
          <div className="mt-4 h-5 w-2/5 rounded-full bg-[#e7ece8]" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded-full bg-[#edf0ed]" />
            <div className="h-4 w-5/6 rounded-full bg-[#edf0ed]" />
            <div className="h-4 w-3/5 rounded-full bg-[#edf0ed]" />
          </div>
          <div className="mt-10 h-14 w-full bg-[#0a583b]/15" />
        </div>
      </div>
    </main>
  );
}
