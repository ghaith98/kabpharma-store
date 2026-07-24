import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const STAFF_SESSION_COOKIE =
  "kab_staff_session";

export type StaffSession = {
  role: "driver" | "delivery_company";
  accountId: string;
  displayName: string;
};

function getStaffSessionSecret() {
  const value = process.env.STAFF_SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "STAFF_SESSION_SECRET must be at least 32 characters."
    );
  }

  return new TextEncoder().encode(value);
}

export async function createStaffSessionToken(
  session: StaffSession
) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("kabpharma-store")
    .setAudience("kabpharma-staff")
    .setSubject(`${session.role}:${session.accountId}`)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getStaffSessionSecret());
}

export async function verifyStaffSessionToken(
  token: string
): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getStaffSessionSecret(),
      {
        algorithms: ["HS256"],
        issuer: "kabpharma-store",
        audience: "kabpharma-staff",
      }
    );

    const role = payload.role;
    const accountId =
      typeof payload.accountId === "string"
        ? payload.accountId
        : String(payload.accountId ?? "");
    const displayName =
      typeof payload.displayName === "string"
        ? payload.displayName.trim()
        : "";

    if (
      (role !== "driver" &&
        role !== "delivery_company") ||
      !accountId ||
      accountId.length > 100 ||
      !displayName ||
      displayName.length > 150
    ) {
      return null;
    }

    return {
      role,
      accountId,
      displayName,
    };
  } catch {
    return null;
  }
}

export async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(
    STAFF_SESSION_COOKIE
  )?.value;

  if (!token) return null;

  return verifyStaffSessionToken(token);
}

export const staffSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
};
