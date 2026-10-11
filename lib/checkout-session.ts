type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const PREFIX = "kab_checkout_";

export function checkoutAccountId(value: unknown): string | null {
  const id = typeof value === "number" || typeof value === "string" ? String(value) : "";
  return /^[1-9]\d*$/.test(id) ? id : null;
}

export function checkoutBelongsToAccount(draft: unknown, accountId: unknown): boolean {
  const id = checkoutAccountId(accountId);
  return id !== null && !!draft && typeof draft === "object"
    && checkoutAccountId((draft as {profileId?: unknown}).profileId) === id;
}

export function readCheckoutDraft<T>(storage: DraftStorage, accountId: unknown): T | null {
  const id = checkoutAccountId(accountId);
  // Old unowned drafts cannot safely be attributed to any account.
  storage.removeItem("checkout");
  if (!id) return null;
  const key = PREFIX + id;
  try {
    const draft: unknown = JSON.parse(storage.getItem(key) || "null");
    if (checkoutBelongsToAccount(draft, id)) return draft as T;
  } catch { /* Discard malformed drafts. */ }
  storage.removeItem(key);
  return null;
}

export function saveCheckoutDraft(storage: DraftStorage, accountId: unknown, draft: object) {
  const id = checkoutAccountId(accountId);
  if (!id) throw new Error("A verified account is required to save delivery details.");
  storage.removeItem("checkout");
  storage.setItem(PREFIX + id, JSON.stringify({...draft, profileId:id}));
}

export function clearCheckoutDraft(storage: DraftStorage, accountId: unknown) {
  const id = checkoutAccountId(accountId);
  if (id) storage.removeItem(PREFIX + id);
  storage.removeItem("checkout");
}

export function clearCheckoutStorage(storage: DraftStorage, session: Pick<Storage,"removeItem">) {
  const keys: string[] = ["checkout"];
  for (let i=0; i<storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
  clearCheckoutAttemptKeys(session);
}

export function clearCheckoutAttemptKeys(session: Pick<Storage,"removeItem">) {
  session.removeItem("kab_cod_idempotency_key");
  session.removeItem("kab_transfer_idempotency_key");
}

export function clearCheckoutSession() {
  try { clearCheckoutStorage(window.localStorage, window.sessionStorage); } catch { /* Browser storage may be disabled. */ }
}
