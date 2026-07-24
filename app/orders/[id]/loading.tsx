export default function OrderDetailsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading order"
      className="min-h-[65vh] bg-[#f7f8f6] px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-3xl animate-pulse rounded-[1.75rem] border border-[#e1e6e2] bg-white p-6 sm:p-8">
        <div className="h-4 w-28 rounded-full bg-[#dce5df]" />
        <div className="mt-5 h-9 w-3/5 rounded-xl bg-[#e6ebe7]" />
        <div className="mt-8 h-16 rounded-2xl bg-[#eef1ef]" />
        <div className="mt-8 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 rounded-xl bg-[#edf0ed]" />
          ))}
        </div>
      </div>
    </main>
  );
}
