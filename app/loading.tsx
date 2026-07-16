export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="min-h-[65vh] bg-[#f7f8f6] px-5 py-10 sm:px-6 sm:py-14 lg:px-10"
    >
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <div className="h-3 w-24 rounded-full bg-[#d9e4dc]" />
        <div className="mt-5 h-11 w-full max-w-lg rounded-2xl bg-[#e4e9e5] sm:h-14" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-[#e8ece9]" />
        <div className="mt-2 h-4 w-3/4 max-w-xl rounded-full bg-[#e8ece9]" />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 rounded-[1.75rem] border border-[#e2e7e3] bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
