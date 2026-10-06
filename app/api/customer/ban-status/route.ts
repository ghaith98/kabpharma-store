import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Is the signed-in customer restricted from ordering?

  The checkout page used to ask the database directly with a phone number
  it supplied itself, which let anyone look up whether any number is
  restricted. Now the server answers, only for the signed-in customer's own
  number, and the database function can be closed to the public.

  (Placing an order checks the restriction again on the server, so this
  answer is only for showing the right message early.)
*/

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401, headers: NO_STORE }
    );
  }

  const query = supabaseAdmin
    .from("profiles")
    .select("id, phone")
    .eq("id", session.profileId);

  if (session.method === "phone") {
    query.eq("phone", session.phone);
  } else {
    query.eq("email", session.email);
  }

  const { data: profile, error: profileError } = await query.maybeSingle();

  if (profileError || !profile?.phone) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401, headers: NO_STORE }
    );
  }

  const { data, error } = await supabaseAdmin.rpc("check_user_ban", {
    p_phone: profile.phone,
  });

  if (error) {
    console.error("Customer restriction check failed:", error);

    return NextResponse.json(
      { success: false, error: "Could not verify account status" },
      { status: 503, headers: NO_STORE }
    );
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | Record<string, unknown>
    | null
    | undefined;

  return NextResponse.json(
    {
      success: true,
      // Only what the page shows: restricted or not, and the reason text.
      result: {
        is_banned: row?.is_banned === true,
        reason: typeof row?.reason === "string" ? row.reason : null,
      },
    },
    { headers: NO_STORE }
  );
}
