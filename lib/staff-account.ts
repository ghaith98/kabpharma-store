import "server-only";
import { getStaffSession } from "@/lib/staff-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getActiveStaffAccount() {
  const session = await getStaffSession();
  if (!session) return null;
  const query = session.role === "driver"
    ? supabaseAdmin.from("delivery_drivers").select("id, name, is_active")
        .eq("name", session.displayName).is("deleted_at", null)
    : supabaseAdmin.from("delivery_companies").select("id, company_name, is_active, last_seen")
        .eq("company_name", session.displayName);
  const { data, error } = await query.eq("id", session.accountId).eq("is_active", true).maybeSingle();
  if (error || !data) return null;
  return { ...session, id: String(data.id), name: session.displayName,
    lastSeen: "last_seen" in data && typeof data.last_seen === "string" ? data.last_seen : null };
}
