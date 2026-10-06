import "server-only";

import {
  SHAMCASH_MAX_AGE_HOURS,
  SHAMCASH_MAX_OVERPAYMENT_SYP,
  SHAMCASH_MAX_UNDERPAYMENT_SYP,
} from "@/lib/commerce-config";

/*
  Checks a Sham Cash transfer against an order total.

  A transfer is accepted only when all of these are true:
    - it exists in the store's Sham Cash account under that number
    - its amount covers the order total (see the allowances in
      lib/commerce-config.ts)
    - it is recent, so an old transfer made for something else cannot be
      picked up and attached to a new order

  That the same transfer is never used for two orders is enforced
  separately, by the used_shamcash_transactions list in the database.
*/

const SHAMCASH_API_BASE = "https://api.shamcash-api.com/v1";

export type ShamcashCheck =
  | { ok: true; amount: number }
  | {
      ok: false;
      status: number;
      code: "NOT_FOUND" | "AMOUNT_MISMATCH" | "TOO_OLD" | "UNAVAILABLE";
      error: string;
    };

type ShamcashTransaction = {
  transaction_id: number | string;
  amount: number | string;
  occurred_at?: string | null;
};

export async function checkShamcashPayment(
  transactionId: string,
  orderTotal: number
): Promise<ShamcashCheck> {
  const accountId = process.env.SHAMCASH_ACCOUNT_ID;
  const apiToken = process.env.SHAMCASH_API_TOKEN;

  const unavailable: ShamcashCheck = {
    ok: false,
    status: 502,
    code: "UNAVAILABLE",
    error: "Could not verify payment. Please try again.",
  };

  if (!accountId || !apiToken) {
    console.error(
      "Sham Cash is not configured: SHAMCASH_ACCOUNT_ID / SHAMCASH_API_TOKEN missing."
    );
    return unavailable;
  }

  let transactions: ShamcashTransaction[];

  try {
    const url = new URL(`${SHAMCASH_API_BASE}/transactions`);
    url.searchParams.set("account_id", accountId);
    url.searchParams.set("transaction_ids", transactionId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const payload = await response.json();

    if (!response.ok || payload?.status !== "success") {
      // Status and code only: the full answer can hold other customers'
      // transfer details.
      console.error(
        "Sham Cash API error:",
        response.status,
        payload?.code || ""
      );
      return unavailable;
    }

    transactions = Array.isArray(payload?.data?.transactions)
      ? payload.data.transactions
      : [];
  } catch (error) {
    console.error("Sham Cash verification failed:", error);
    return unavailable;
  }

  const match = transactions.find(
    (transaction) => String(transaction.transaction_id) === transactionId
  );

  if (!match) {
    return {
      ok: false,
      status: 404,
      code: "NOT_FOUND",
      error: "Transaction not found. Please check the number and try again.",
    };
  }

  const amount = Number(match.amount);

  if (
    !Number.isFinite(amount) ||
    amount < orderTotal - SHAMCASH_MAX_UNDERPAYMENT_SYP ||
    amount > orderTotal + SHAMCASH_MAX_OVERPAYMENT_SYP
  ) {
    return {
      ok: false,
      status: 409,
      code: "AMOUNT_MISMATCH",
      error: `Payment amount does not match the order total of ${orderTotal} SYP.`,
    };
  }

  // Skipped only when the transfer carries no readable time.
  const occurredAt = match.occurred_at
    ? new Date(match.occurred_at).getTime()
    : NaN;

  if (
    Number.isFinite(occurredAt) &&
    Date.now() - occurredAt > SHAMCASH_MAX_AGE_HOURS * 60 * 60 * 1000
  ) {
    return {
      ok: false,
      status: 409,
      code: "TOO_OLD",
      error:
        "This transfer is too old to be used for a new order. Please contact us.",
    };
  }

  return { ok: true, amount };
}
