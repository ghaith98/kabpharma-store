function SkeletonCard() {
  return (
    <article className="flex h-full flex-col bg-white">
      <div className="kab-shimmer aspect-square w-full bg-[#eef1ee]" />
      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        <div className="kab-shimmer h-2.5 w-16 bg-[#eef1ee]" />
        <div className="mt-2 space-y-2">
          <div className="kab-shimmer h-4 w-3/4 bg-[#eef1ee]" />
          <div className="kab-shimmer h-4 w-1/2 bg-[#eef1ee]" />
        </div>
        <div className="kab-shimmer mt-2 h-3 w-full bg-[#eef1ee]" />
        <div className="mt-2 border-t border-[#dedfdd] pt-2 sm:mt-3 sm:pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-1.5">
              <div className="kab-shimmer h-3 w-12 bg-[#eef1ee]" />
              <div className="kab-shimmer h-4 w-20 bg-[#eef1ee]" />
            </div>
            <div className="kab-shimmer h-5 w-16 bg-[#eef1ee]" />
          </div>
        </div>
        <div className="kab-shimmer mt-3 h-11 w-full bg-[#eef1ee]" />
      </div>
    </article>
  );
}

export default function NewArrivalsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading new arrivals"
      className="min-h-screen bg-white"
    >
      {/* Hero banner skeleton — matches NewArrivalsBanner mobile + desktop */}
      <section className="relative w-full overflow-hidden bg-[#eef1ee]">
        {/* Mobile: short banner + text block below */}
        <div className="kab-shimmer h-[200px] w-full bg-[#eef1ee] sm:h-[230px] md:hidden" />
        <div className="border-b border-[#edf0ed] bg-white px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-8 md:hidden">
          <div className="kab-shimmer h-3 w-28 bg-[#eef1ee]" />
          <div className="kab-shimmer mt-4 h-9 w-3/5 bg-[#eef1ee]" />
          <div className="mt-4 space-y-2">
            <div className="kab-shimmer h-3 w-full bg-[#eef1ee]" />
            <div className="kab-shimmer h-3 w-4/5 bg-[#eef1ee]" />
          </div>
        </div>

        {/* Desktop: full hero */}
        <div className="relative hidden h-[clamp(520px,38.75vw,680px)] w-full bg-[#eef1ee] md:block">
          <div className="kab-shimmer absolute inset-0" />
          <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-12 lg:px-16">
            <div className="w-full max-w-[510px] space-y-4">
              <div className="kab-shimmer h-3 w-28 bg-[#eef1ee]" />
              <div className="kab-shimmer h-14 w-4/5 bg-[#eef1ee]" />
              <div className="kab-shimmer h-4 w-full bg-[#eef1ee]" />
              <div className="kab-shimmer h-4 w-3/4 bg-[#eef1ee]" />
            </div>
          </div>
        </div>
      </section>

      {/* Product grid — matches NewArrivalsCollection grid */}
      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-4 gap-y-8 px-4 py-8 sm:gap-x-6 sm:gap-y-10 sm:px-6 sm:py-12 lg:grid-cols-3 lg:gap-x-8 lg:px-8 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    </main>
  );
}