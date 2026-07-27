export default function ProductsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading products"
      className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-[1650px] animate-pulse">
        {/* Products count + Filter/Sort */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-3 w-20 bg-[#e7ebe8]" />

          <div className="flex items-center gap-6">
            <div className="h-3 w-10 bg-[#e7ebe8]" />
            <div className="h-3 w-8 bg-[#e7ebe8]" />
          </div>
        </div>

        {/* Editorial product cards */}
        <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={index}
              className="flex h-full flex-col bg-white"
            >
              {/* Square product image */}
              <div className="aspect-square bg-[#f7f8f6]" />

              {/* Product information */}
              <div className="flex flex-1 flex-col pt-4">
                <div className="h-2.5 w-16 bg-[#e7ebe8]" />

                <div className="mt-3 h-4 w-2/3 bg-[#e1e6e2]" />

                <div className="mt-5 h-3 w-full bg-[#eef1ef]" />
                <div className="mt-2 h-3 w-4/5 bg-[#eef1ef]" />

                <div className="mt-4 h-px w-full bg-[#e5e9e6]" />

                <div className="mt-4 h-4 w-20 bg-[#dce5df]" />

                <div className="mt-4 h-11 w-full bg-[#e4ebe7]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}