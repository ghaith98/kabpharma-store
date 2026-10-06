import { NextResponse } from "next/server";

/*
  Retired. A transfer is checked when the order is placed
  (POST /api/customer/orders), together with the real order total.

  This separate check let a signed-in visitor test transaction numbers and
  amounts without placing an order, and no page uses it any more.
*/
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "This check is no longer available. Please place your order from the payment page.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
