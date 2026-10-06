import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getArchiveAdmin,
  isArchiveConfigured,
} from "@/lib/supabase-archive";

export const dynamic = "force-dynamic";

/*
  Admin > Users: delete a customer's account.

  GET     is the confirmation code still the starting one (0000)?
  DELETE  delete one account           { profileId, code }
  PUT     change the confirmation code { currentCode, newCode }

  Deleting needs two things: a signed-in admin, and the confirmation code.
  The code lives in a private table that only this server can read
  (admin_private_settings), never in the browser.

  What a delete removes is described in
  supabase/migrations/202610060004_delete_customer_account.sql. It happens
  as one all-or-nothing step in the database.

  Codes sent back with a failure:
    NOT_SET_UP     the SQL file above has not been run yet
    WRONG_CODE     the confirmation code is wrong
    TOO_MANY       too many tries; wait `retryAfter` seconds
    NOT_FOUND      the account no longer exists
    ACTIVE_ORDERS  the customer still has orders in progress (`count`)
    BAD_NEW_CODE   the new code is not 4 to 20 letters or digits
    FAILED         anything else (nothing was deleted)
*/

const CODE_KEY = "account_delete_code";
const DEFAULT_CODE = "0000";
const NO_STORE = { "Cache-Control": "no-store" };

const FINAL_STATUSES = ["delivered", "rejected", "cancelled_by_customer"];

function fail(
  code: string,
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    { success: false, code, error, ...extra },
    { status, headers: NO_STORE }
  );
}

function sameText(first: string, second: string) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);

  return a.length === b.length && timingSafeEqual(a, b);
}

/** The saved confirmation code, or null when the SQL has not been run. */
async function readSavedCode(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("admin_private_settings")
    .select("value")
    .eq("key", CODE_KEY)
    .maybeSingle();

  if (error) {
    console.error("Delete code could not be read:", error);
    return null;
  }

  return typeof data?.value === "string" && data.value
    ? data.value
    : DEFAULT_CODE;
}

/** Limits guessing: 20 code checks per admin in 15 minutes. */
async function checkCode(adminId: string, submitted: unknown) {
  const limit = await takeRateLimitDb({
    key: `admin-delete-code:${adminId}`,
    limit: 20,
    windowSeconds: 900,
  });

  if (limit.unavailable) {
    return fail(
      "FAILED",
      "The check is temporarily unavailable. Please try again shortly.",
      503
    );
  }

  if (!limit.allowed) {
    return fail(
      "TOO_MANY",
      "Too many tries. Please wait before trying again.",
      429,
      { retryAfter: limit.retryAfterSeconds }
    );
  }

  const saved = await readSavedCode();

  if (saved == null) {
    return fail(
      "NOT_SET_UP",
      "Account deletion is not set up yet. Run the SQL file 202610060004_delete_customer_account.sql in Supabase first.",
      503
    );
  }

  const code = typeof submitted === "string" ? submitted.trim() : "";

  if (!code || !sameText(code, saved)) {
    return fail("WRONG_CODE", "The confirmation code is not correct.", 403);
  }

  return null;
}

async function readBody(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  return body && typeof body === "object" ? body : null;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("FAILED", "Admin access required", 403);

  const saved = await readSavedCode();

  return NextResponse.json(
    {
      success: true,
      ready: saved != null,
      // Only whether it is still the starting code, never the code itself.
      codeIsDefault: saved === DEFAULT_CODE,
    },
    { headers: NO_STORE }
  );
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("FAILED", "Admin access required", 403);

  const body = await readBody(request);
  const profileId = Number(body?.profileId);

  if (!body || !Number.isInteger(profileId) || profileId <= 0) {
    return fail("FAILED", "Invalid account", 400);
  }

  const denied = await checkCode(admin.id, body.code);
  if (denied) return denied;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, email")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    console.error("Account lookup before delete failed:", profileError);
    return fail("FAILED", "Could not load the account.", 500);
  }

  if (!profile) {
    return fail("NOT_FOUND", "This account no longer exists.", 404);
  }

  const phone = typeof profile.phone === "string" ? profile.phone.trim() : "";

  // Checked here first so nothing at all is touched when the answer is no.
  // The database function checks it again inside its own transaction.
  if (phone) {
    const { count, error: activeError } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .not("status", "in", `(${FINAL_STATUSES.join(",")})`);

    if (activeError) {
      console.error("Active order check failed:", activeError);
      return fail("FAILED", "Could not check the customer's orders.", 500);
    }

    if ((count || 0) > 0) {
      return fail(
        "ACTIVE_ORDERS",
        "This customer still has orders in progress.",
        409,
        { count }
      );
    }
  }

  // Old rejected / cancelled orders that were moved to the archive project.
  // Removed first: if this fails, the account is left exactly as it was.
  let archivedOrdersDeleted = 0;

  if (phone && isArchiveConfigured()) {
    const { data: removed, error: archiveError } = await getArchiveAdmin()
      .from("archived_orders")
      .delete()
      .eq("phone", phone)
      .select("source_order_id");

    if (archiveError) {
      console.error("Archived orders could not be deleted:", archiveError);

      return fail(
        "FAILED",
        "Could not clear this customer's archived orders. Nothing was deleted.",
        502
      );
    }

    archivedOrdersDeleted = (removed || []).length;
  }

  const { data: result, error: deleteError } = await supabaseAdmin.rpc(
    "admin_delete_customer_account",
    { p_profile_id: profileId }
  );

  if (deleteError) {
    const message = String(deleteError.message || "");

    if (message.includes("ACCOUNT_NOT_FOUND")) {
      return fail("NOT_FOUND", "This account no longer exists.", 404);
    }

    const active = message.match(/ACTIVE_ORDERS:(\d+)/);

    if (active) {
      return fail(
        "ACTIVE_ORDERS",
        "This customer still has orders in progress.",
        409,
        { count: Number(active[1]) }
      );
    }

    console.error("Account delete failed:", deleteError);

    // PGRST202 / 42883: the function does not exist yet.
    if (
      deleteError.code === "PGRST202" ||
      deleteError.code === "42883"
    ) {
      return fail(
        "NOT_SET_UP",
        "Account deletion is not set up yet. Run the SQL file 202610060004_delete_customer_account.sql in Supabase first.",
        503
      );
    }

    return fail(
      "FAILED",
      "The account could not be deleted. Nothing was changed.",
      500,
      { detail: message.slice(0, 300) }
    );
  }

  const summary = (result || {}) as Record<string, unknown>;

  console.info(
    "Customer account deleted by admin:",
    JSON.stringify({
      admin: admin.email || admin.id,
      profileId,
      ordersDeleted: summary.orders_deleted ?? 0,
      archivedOrdersDeleted,
    })
  );

  return NextResponse.json(
    {
      success: true,
      profileId,
      ordersDeleted: Number(summary.orders_deleted || 0),
      archivedOrdersDeleted,
    },
    { headers: NO_STORE }
  );
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return fail("FAILED", "Admin access required", 403);

  const body = await readBody(request);
  if (!body) return fail("FAILED", "Invalid request", 400);

  const newCode =
    typeof body.newCode === "string" ? body.newCode.trim() : "";

  if (!/^[A-Za-z0-9]{4,20}$/.test(newCode)) {
    return fail(
      "BAD_NEW_CODE",
      "The new code must be 4 to 20 letters or digits, with no spaces.",
      400
    );
  }

  // Changing the code needs the current one, like deleting does.
  const denied = await checkCode(admin.id, body.currentCode);
  if (denied) return denied;

  const { error } = await supabaseAdmin
    .from("admin_private_settings")
    .upsert({
      key: CODE_KEY,
      value: newCode,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Delete code could not be saved:", error);
    return fail("FAILED", "Could not save the new code.", 500);
  }

  return NextResponse.json(
    { success: true, codeIsDefault: newCode === DEFAULT_CODE },
    { headers: NO_STORE }
  );
}
