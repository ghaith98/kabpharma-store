import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_SESSION_COOKIE =
  "kab_customer_session";

export type CustomerSession = {
  profileId: number;
  phone: string;
};

function getSessionSecret() {
  const value =
    process.env.CUSTOMER_SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "CUSTOMER_SESSION_SECRET must be at least 32 characters."
    );
  }

  return new TextEncoder().encode(value);
}

export async function createCustomerSessionToken(
  session: CustomerSession
) {
  return new SignJWT({
    profileId: session.profileId,
    phone: session.phone,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(String(session.profileId))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSessionSecret());
}

export async function verifyCustomerSessionToken(
  token: string
): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    const profileId = Number(
      payload.profileId
    );

    const phone =
      typeof payload.phone === "string"
        ? payload.phone
        : "";

    if (
      !Number.isInteger(profileId) ||
      profileId <= 0 ||
      !/^9639\d{8}$/.test(phone)
    ) {
      return null;
    }

    return {
      profileId,
      phone,
    };
  } catch {
    return null;
  }
}

export async function getCustomerSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    CUSTOMER_SESSION_COOKIE
  )?.value;

  if (!token) return null;

  return verifyCustomerSessionToken(token);
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};