const productPlaceholders = Array.from({ length: 4 });
const concernPlaceholders = Array.from({ length: 6 });

function SectionHeading() {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div className="h-8 w-40 bg-[#e4e8e5] sm:h-9 sm:w-52" />
      <div className="h-4 w-16 bg-[#e8ece9]" />
    </div>
  );
}

function ProductRow() {
  return (
    <div className="flex gap-3.5 overflow-hidden sm:gap-4 lg:gap-5">
      {productPlaceholders.map((_, index) => (
        <article
          key={index}
          className="w-[64%] shrink-0 sm:w-[44%] md:w-[37%] lg:w-[30%] xl:w-[calc(25%-15px)]"
        >
          <div className="aspect-square bg-[#f3f5f3]" />

          <div className="pt-4">
            <div className="h-4 w-3/4 bg-[#e3e8e4]" />
            <div className="mt-2 h-3 w-1/2 bg-[#edf0ee]" />
            <div className="mt-5 h-4 w-20 bg-[#dfe5e1]" />
            <div className="mt-4 h-11 w-full bg-[#dbe6df]" />
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductSection({
  divider = false,
}: {
  divider?: boolean;
}) {
  return (
    <section
      className={`py-7 sm:py-9 lg:py-10 ${
        divider ? "border-t border-[#edf0ed]" : ""
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <SectionHeading />
        <ProductRow />
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading home page"
      className="min-h-screen overflow-hidden bg-white"
    >
      <div className="animate-pulse">
        {/* Home banner */}
        <section className="bg-[#f3f4f1]">
          <div className="h-[400px] w-full md:min-h-[560px] lg:min-h-[620px]" />
          <div className="mx-auto flex min-h-[244px] max-w-[1440px] flex-col px-5 py-8 md:hidden">
            <div className="h-8 w-3/4 bg-[#e1e5e1]" />
            <div className="mt-4 h-3 w-full bg-[#e7eae7]" />
            <div className="mt-2 h-3 w-4/5 bg-[#e7eae7]" />
            <div className="mt-auto h-12 w-full rounded-full bg-[#d9e4dc]" />
          </div>
        </section>

        {/* New Arrivals */}
        <ProductSection />

        {/* Shop by need */}
        <section className="border-t border-[#e7ebe8] py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-44 bg-[#e4e8e5] sm:w-52" />
            <div className="mt-3 h-4 w-full max-w-md bg-[#edf0ee]" />

            <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6">
              {concernPlaceholders.map((_, index) => (
                <div key={index}>
                  <div className="aspect-square bg-[#eef1ee]" />
                  <div className="mt-3 h-4 w-3/4 bg-[#e2e7e3]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bestsellers and Featured Products */}
        <ProductSection divider />
        <ProductSection />

        <div className="h-10 sm:h-16" />
      </div>
    </main>
  );
}