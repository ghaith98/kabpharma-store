import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    search?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawQuery = params.search ?? params.q ?? "";
  const query = Array.isArray(rawQuery)
    ? rawQuery[0]
    : rawQuery;
  const cleanQuery = String(query || "").trim();

  redirect(
    cleanQuery
      ? `/products?search=${encodeURIComponent(cleanQuery)}`
      : "/products"
  );
}

