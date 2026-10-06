import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { archiveEligibleOrders } from "@/lib/order-archive";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.ARCHIVE_CRON_SECRET;
  const suppliedSecret = request.headers.get("x-archive-cron-secret");

  if (!configuredSecret || !suppliedSecret) return false;

  const expected = Buffer.from(configuredSecret);
  const received = Buffer.from(suppliedSecret);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return jsonError("Archive job access denied", 401);
  }

  try {
    const result = await archiveEligibleOrders();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Scheduled order archive failed:", error);
    return jsonError("Scheduled order archive failed", 500);
  }
}
