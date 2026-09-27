import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin.from("promotions")
    .select("product_id,variant_id,type,name")
    .eq("is_active", true)
    .not("product_id", "is", null)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`);
  return NextResponse.json({ promotions: data || [] }, { headers: { "Cache-Control": "no-store" } });
}
