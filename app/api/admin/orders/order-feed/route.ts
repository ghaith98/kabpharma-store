import { getAdminFromRequest } from "@/lib/admin-auth";
import { orderFeedResponse } from "@/lib/order-feed";
import { jsonError } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await getAdminFromRequest(request)) return jsonError("Admin access required", 403);
  return orderFeedResponse();
}
