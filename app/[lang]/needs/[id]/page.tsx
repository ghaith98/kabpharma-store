import { permanentRedirect } from "next/navigation";

type PageParams = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LegacyConcernNeedPage({
  params,
}: PageParams) {
  const { id } = await params;

  permanentRedirect(
    `/shop-by-need/${encodeURIComponent(id)}`
  );
}
