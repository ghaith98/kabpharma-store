import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", session.profileId)
    .eq("phone", session.phone)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
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

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name })
    .eq("id", session.profileId)
    .eq("phone", session.phone);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update name. Please try again." },
      { status: 500 }
    );
  }

  // Sync the new name onto every order that belongs to this profile.
  // Session stores phone without + (e.g. 9639...) but orders stores it
  // with + (e.g. +9639...) — try both to be safe.
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

  // Update localStorage-side cache by returning the new value
  return NextResponse.json({ success: true, full_name });
}