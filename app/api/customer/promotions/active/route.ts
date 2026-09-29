import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Called once per page load by every product card's promotion badge.
  The result is the same for every visitor, so let the CDN serve it for
  60 seconds (and a stale copy for 5 more minutes while it refreshes)
  instead of querying the database on every single page view.
*/
export async function GET() {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from("promotions")
    .select("product_id,variant_id,type,name")
    .eq("is_active", true)
    .not("product_id", "is", null)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  if (error) {
    return NextResponse.json(
      { promotions: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { promotions: data || [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
