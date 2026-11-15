import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(request: NextRequest) {
  try {
    if (!(await getAdminFromRequest(request))) {
      return jsonError("Admin access required. Sign in with an admin account.", 403);
    }

    const rawId = request.nextUrl.searchParams.get("id") ?? "";
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) {
      return jsonError("Invalid review ID", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Admin review deletion failed:", error);
      return jsonError("Could not delete the review", 500);
    }
    if (!data) return jsonError("Review not found", 404);

    try {
      revalidatePath("/[lang]/products/[id]", "page");
    } catch (error) {
      console.error("Product page refresh after review deletion failed:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin review request failed:", error);
    return jsonError("Could not delete the review", 500);
  }
}
