import "server-only";

import { createClient } from "@supabase/supabase-js";

const archiveUrl = process.env.ARCHIVE_SUPABASE_URL;
const archiveServiceRoleKey =
  process.env.ARCHIVE_SUPABASE_SERVICE_ROLE_KEY;

export function isArchiveConfigured() {
  return Boolean(archiveUrl && archiveServiceRoleKey);
}

export function getArchiveAdmin() {
  if (!archiveUrl || !archiveServiceRoleKey) {
    throw new Error("Order archive is not configured");
  }

  return createClient(archiveUrl, archiveServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
