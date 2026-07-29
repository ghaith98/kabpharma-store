import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Build query based on session method
  const query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, email")
    .eq("id", session.profileId);

  // Extra verification: ensure the session token matches what's in the DB
  if (session.method === "phone") {
    query.eq("phone", session.phone);
  } else {
    query.eq("email", session.email);
  }

  const { data: profile, error } = await query.maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email ?? null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const full_name =
    typeof (body as Record<string, unknown>).full_name === "string"
      ? ((body as Record<string, unknown>).full_name as string).trim()
      : null;

  if (!full_name || full_name.length < 2 || full_name.length > 80) {
    return NextResponse.json(
      { error: "Name must be between 2 and 80 characters." },
      { status: 422 }
    );
  }

  const updateQuery = supabaseAdmin
    .from("profiles")
    .update({ full_name })
    .eq("id", session.profileId);

  if (session.method === "phone") {
    updateQuery.eq("phone", session.phone);
  } else {
    updateQuery.eq("email", session.email);
  }

  const { error } = await updateQuery;

  if (error) {
    return NextResponse.json(
      { error: "Failed to update name. Please try again." },
      { status: 500 }
    );
  }

  // Sync name to orders (phone users only — orders are linked by phone)
  if (session.method === "phone") {
    const phoneWithPlus = session.phone.startsWith("+")
      ? session.phone
      : "+" + session.phone;
    const phoneWithout = session.phone.startsWith("+")
      ? session.phone.slice(1)
      : session.phone;

    await supabaseAdmin
      .from("orders")
      .update({ customer_name: full_name })
      .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithout}`);
  } else {
    // Email users: sync by phone stored in their profile
    const phoneWithPlus = session.phone.startsWith("+")
      ? session.phone
      : "+" + session.phone;
    const phoneWithout = session.phone.startsWith("+")
      ? session.phone.slice(1)
      : session.phone;

    await supabaseAdmin
      .from("orders")
      .update({ customer_name: full_name })
      .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithout}`);
  }

  return NextResponse.json({ success: true, full_name });
}