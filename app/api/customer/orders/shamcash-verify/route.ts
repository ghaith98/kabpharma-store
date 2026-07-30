    import { NextRequest, NextResponse } from "next/server";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

const SHAMCASH_API_BASE = "https://api.shamcash-api.com/v1";

type ShamcashTransaction = {
  transaction_id: number;
  amount: number;
  currency: { id: number; code: string };
  occurred_at: string;
  receiver_name: string;
  sender_name: string;
  sender_address: string;
  note: string;
};

async function fetchTransactionById(transactionId: string): Promise<ShamcashTransaction | null> {
  const url = new URL(`${SHAMCASH_API_BASE}/transactions`);
  url.searchParams.set("account_id", process.env.SHAMCASH_ACCOUNT_ID!);
  url.searchParams.set("transaction_ids", transactionId);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.SHAMCASH_API_TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || payload.status !== "success") {
    throw new Error(`Shamcash API error: ${payload.code} – ${payload.message}`);
  }

  const transactions: ShamcashTransaction[] = payload.data?.transactions || [];
  return transactions.find((tx) => String(tx.transaction_id) === transactionId) || null;
}

export async function POST(req: NextRequest) {
  if (!hasTrustedOrigin(req)) return jsonError("Invalid request origin", 403);

  const session = await getCustomerSession();
  if (!session) return jsonError("Authentication required", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError("Invalid request body", 400); }

  const b = body as Record<string, unknown>;
  const transactionId = typeof b.transactionId === "string" ? b.transactionId.trim() : "";
  const expectedAmount = Number(b.expectedAmount);

  if (!transactionId || !/^\d{6,15}$/.test(transactionId)) {
    return jsonError("Please enter a valid transaction number.", 422);
  }

  if (!expectedAmount || expectedAmount <= 0) {
    return jsonError("Invalid order amount.", 422);
  }

  try {
    const tx = await fetchTransactionById(transactionId);

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found. Please check the number and try again.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const txAmount = Number(tx.amount);
    const diff = Math.abs(txAmount - expectedAmount);

    if (diff > 100) {
      return NextResponse.json(
        { success: false, error: `Payment amount does not match. Expected ${expectedAmount} SYP but transaction shows ${txAmount} SYP.`, code: "AMOUNT_MISMATCH" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: { id: transactionId, amount: txAmount, occurred_at: tx.occurred_at },
    });
  } catch (error) {
    console.error("Shamcash verification failed:", error);
    return jsonError("Could not verify payment. Please try again.", 500);
  }
}