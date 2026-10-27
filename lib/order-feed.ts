import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/http";

export async function orderFeedResponse() {
  const { data, error } = await supabaseAdmin.from("order_feed_revision")
    .select("revision").eq("id", 1).single();
  if (error || !data) return jsonError("Could not check order updates", 503);
  return NextResponse.json({ revision: String(data.revision) }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
