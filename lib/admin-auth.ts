import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

function configuredAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase())
      .filter(Boolean)
  );
}

export async function getAdminFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization") || "";
  const match = authorization.match(
    /^Bearer\s+(.+)$/i
  );

  if (!match) {
    return null;
  }

  const { data, error } =
    await supabaseAdmin.auth.getUser(match[1]);
  const user = data.user;

  if (error || !user) {
    return null;
  }

  const metadata = user.app_metadata || {};
  const roles = Array.isArray(metadata.roles)
    ? metadata.roles.map(String)
    : [];
  const email = String(user.email || "")
    .trim()
    .toLocaleLowerCase();

  const isAdmin =
    metadata.role === "admin" ||
    metadata.admin === true ||
    roles.includes("admin") ||
    configuredAdminEmails().has(email);

  return isAdmin ? user : null;
}
