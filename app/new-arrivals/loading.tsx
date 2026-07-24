export default function NewArrivalsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading new arrivals"
      className="min-h-screen bg-white"
    >
      <section className="h-[clamp(620px,173vw,720px)] animate-pulse bg-[#eef1ee] md:h-[clamp(520px,38.75vw,680px)]">
        <div className="mx-auto flex h-full max-w-[1440px] items-start px-5 pt-24 sm:px-8 md:items-center md:px-12 md:pt-0 lg:px-16">
          <div className="w-full max-w-[510px]">
            <div className="h-3 w-28 rounded-full bg-[#d5ded8]" />
            <div className="mt-5 h-14 w-4/5 rounded-2xl bg-[#dfe5e1] sm:h-16" />
            <div className="mt-5 h-4 w-full rounded-full bg-[#dfe5e1]" />
            <div className="mt-3 h-4 w-3/4 rounded-full bg-[#dfe5e1]" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1720px] grid-cols-2 gap-x-4 gap-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-4 lg:gap-x-8 lg:px-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-square bg-[#f0f2f0]" />
            <div className="mt-5 h-3 w-20 rounded-full bg-[#dbe2dd]" />
            <div className="mt-4 h-5 w-4/5 rounded-full bg-[#e3e7e4]" />
            <div className="mt-3 h-4 w-1/2 rounded-full bg-[#e8ebe9]" />
          </div>
        ))}
      </section>
    </main>
  );
}

