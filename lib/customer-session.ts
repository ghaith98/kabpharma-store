import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE = "kab_customer_session";

// Phone-based session (existing Syrian WhatsApp flow)
export type PhoneCustomerSession = {
  method: "phone";
  profileId: number;
  phone: string;
};

// Email-based session (new email/password flow)
export type EmailCustomerSession = {
  method: "email";
  profileId: number;
  email: string;
  phone: string; // stored but may be any country format
};

export type CustomerSession = PhoneCustomerSession | EmailCustomerSession;

function getSessionSecret() {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("CUSTOMER_SESSION_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function createCustomerSessionToken(session: CustomerSession) {
  const payload =
    session.method === "phone"
      ? { method: "phone", profileId: session.profileId, phone: session.phone }
      : { method: "email", profileId: session.profileId, email: session.email, phone: session.phone };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.profileId))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSessionSecret());
}

export async function verifyCustomerSessionToken(
  token: string
): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    const profileId = Number(payload.profileId);
    if (!Number.isInteger(profileId) || profileId <= 0) return null;

    const method = payload.method;

    // Email session
    if (method === "email") {
      const email =
        typeof payload.email === "string" ? payload.email : "";
      const phone =
        typeof payload.phone === "string" ? payload.phone : "";
      if (!email || !phone) return null;
      return { method: "email", profileId, email, phone };
    }

    // Phone session (existing — keep Syrian regex validation)
    const phone =
      typeof payload.phone === "string" ? payload.phone : "";
    if (!/^9639\d{8}$/.test(phone)) return null;
    return { method: "phone", profileId, phone };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerSessionToken(token);
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};