/*
  Shared language constants for the server (proxy, layouts) and the client.
  The storefront language lives in the `lang` cookie so the server can
  render the right language from the first byte (no Arabic→English flash).
*/
export type Lang = "ar" | "en";

export const LANGUAGES: readonly Lang[] = ["ar", "en"];
export const DEFAULT_LANGUAGE: Lang = "ar";
export const LANGUAGE_COOKIE = "lang";
export const LANGUAGE_STORAGE_KEY = "lang";
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isSupportedLanguage(value: unknown): value is Lang {
  return value === "ar" || value === "en";
}
