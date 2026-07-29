import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export type SavedAddress = {
  label: string;        // e.g. "Home", "Work"
  governorate: string;
  delivery_area: string;
  address: string;
};

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("saved_addresses")
    .eq("id", session.profileId)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ addresses: [] });
  }

  const addresses: SavedAddress[] = Array.isArray(profile.saved_addresses)
    ? (profile.saved_addresses as SavedAddress[])
    : [];

  return NextResponse.json({ addresses });
}

export async function PUT(req: NextRequest) {
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

  const addresses = (body as { addresses?: unknown }).addresses;

  if (!Array.isArray(addresses) || addresses.length > 2) {
    return NextResponse.json(
      { error: "You can save up to 2 addresses." },
      { status: 422 }
    );
  }

  // Validate each address
  for (const addr of addresses) {
    const a = addr as Record<string, unknown>;
    if (
      typeof a.label !== "string" || a.label.trim().length < 1 ||
      typeof a.governorate !== "string" || a.governorate.trim().length < 1 ||
      typeof a.delivery_area !== "string" || a.delivery_area.trim().length < 1 ||
      typeof a.address !== "string" || a.address.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Each address must have a label, governorate, area, and address." },
        { status: 422 }
      );
    }
  }

  const cleaned: SavedAddress[] = (addresses as Record<string, string>[]).map((a) => ({
    label: a.label.trim(),
    governorate: a.governorate.trim(),
    delivery_area: a.delivery_area.trim(),
    address: a.address.trim(),
  }));

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ saved_addresses: cleaned })
    .eq("id", session.profileId);

  if (error) {
    // Column may not exist yet — return a clear message
    return NextResponse.json(
      { error: "Failed to save addresses. Make sure the migration has been run." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, addresses: cleaned });
}