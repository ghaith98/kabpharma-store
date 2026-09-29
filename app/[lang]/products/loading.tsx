function SkeletonCard() {
  return (
    <article className="flex h-full flex-col bg-white">
      {/* Square image — same bg as EditorialProductCard */}
      <div className="kab-shimmer aspect-square w-full bg-[#eef1ee]" />

      {/* Info block — mirrors EditorialProductCard's pt-3 sm:pt-4 layout */}
      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {/* Category eyebrow */}
        <div className="kab-shimmer h-2.5 w-16 bg-[#eef1ee]" />

        {/* Product name — two lines */}
        <div className="mt-2 space-y-2">
          <div className="kab-shimmer h-4 w-3/4 bg-[#eef1ee]" />
          <div className="kab-shimmer h-4 w-1/2 bg-[#eef1ee]" />
        </div>

        {/* Description line */}
        <div className="kab-shimmer mt-2 h-3 w-full bg-[#eef1ee] sm:mt-2.5" />

        {/* Divider + price row */}
        <div className="mt-2 border-t border-[#dedfdd] pt-2 sm:mt-3 sm:pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-1.5">
              {/* Strikethrough price placeholder */}
              <div className="kab-shimmer h-3 w-12 bg-[#eef1ee]" />
              {/* Final price */}
              <div className="kab-shimmer h-4 w-20 bg-[#eef1ee]" />
            </div>
            {/* Variant selector placeholder */}
            <div className="kab-shimmer h-5 w-16 bg-[#eef1ee]" />
          </div>
        </div>

        {/* Add to cart button */}
        <div className="kab-shimmer mt-3 h-11 w-full bg-[#eef1ee]" />
      </div>
    </article>
  );
}

export default function ProductsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading products"
      className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-[1650px]">
        {/* Filter/sort bar skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="kab-shimmer h-3 w-24 bg-[#eef1ee]" />
          <div className="flex items-center gap-6">
            <div className="kab-shimmer h-3 w-12 bg-[#eef1ee]" />
            <div className="kab-shimmer h-3 w-10 bg-[#eef1ee]" />
          </div>
        </div>

        {/* Product grid — matches ProductsClient grid exactly */}
        <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}