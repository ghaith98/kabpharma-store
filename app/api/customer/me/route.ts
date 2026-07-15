import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session =
    await getCustomerSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 401,
      }
    );
  }

  const { data: profile, error } =
    await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone"
      )
      .eq(
        "id",
        session.profileId
      )
      .eq(
        "phone",
        session.phone
      )
      .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 401,
      }
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