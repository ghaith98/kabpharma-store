import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Price hold.

  The payment page shows a total, the customer transfers that amount with
  Sham Cash, then submits the order. If a flash sale ended (or a promotion
  started) in those few minutes, the order would be priced differently from
  the amount already paid.

  So every quote carries a small signed note of WHEN it was priced. An order
  placed with that note within 30 minutes is priced as of that moment.
  The note holds only a time: it cannot be used to change any amount, and
  switching a promotion off in the admin panel still ends it at once.
*/

export const PRICE_HOLD_MS = 30 * 60 * 1000;

function secret() {
  return process.env.CUSTOMER_SESSION_SECRET || "";
}

function sign(pricedAtMs: number) {
  return createHmac("sha256", secret())
    .update(`kab-price-hold:${pricedAtMs}`)
    .digest("base64url");
}

export function createPriceToken(pricedAtMs: number) {
  if (!secret()) return null;

  return `${pricedAtMs}.${sign(pricedAtMs)}`;
}

/** The moment a still-valid token was priced at, or null. */
export function readPriceToken(
  token: unknown,
  nowMs: number
): number | null {
  if (typeof token !== "string" || !secret()) return null;

  const [timePart, signature] = token.split(".");
  const pricedAtMs = Number(timePart);

  if (!Number.isSafeInteger(pricedAtMs) || !signature) return null;

  const expected = Buffer.from(sign(pricedAtMs));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  // Not from the future, not older than the hold.
  if (pricedAtMs > nowMs + 60_000) return null;
  if (nowMs - pricedAtMs > PRICE_HOLD_MS) return null;

  return Math.min(pricedAtMs, nowMs);
}
