/*
  Rules for a customer's password, shared by the pages (to check before
  sending) and the server (which always checks again).
*/

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only reads the first 72 bytes; longer input adds nothing.
export const PASSWORD_MAX_LENGTH = 72;

export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}
