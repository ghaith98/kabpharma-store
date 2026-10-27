import { getActiveStaffAccount } from "@/lib/staff-account";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { orderFeedResponse } from "@/lib/order-feed";
import { jsonError } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  const account = await getActiveStaffAccount();
  if (!account) return jsonError("Authentication required", 401);
  // Preserve the existing online indicator without rewriting presence every poll.
  const lastSeen = account.lastSeen ? Date.parse(account.lastSeen) : 0;
  if (account.role === "delivery_company" && (!Number.isFinite(lastSeen) || Date.now() - lastSeen >= 30_000)) {
    await supabaseAdmin.from("delivery_companies")
      .update({ is_online: true, last_seen: new Date().toISOString() }).eq("id", account.id);
  }
  return orderFeedResponse();
}
