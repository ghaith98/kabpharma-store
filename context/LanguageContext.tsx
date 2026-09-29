"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import type {
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";



import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_STORAGE_KEY,
} from "@/lib/language";
import type { Lang } from "@/lib/language";
import { useAppPathname } from "@/lib/use-app-pathname";

type LanguageContextType = {
  lang: Lang;
  setLang: Dispatch<SetStateAction<Lang>>;
  toggleLang: () => void;
  isAdmin: boolean;
};

const LANGUAGE_CHANGED_EVENT = "kabLanguageChanged";

const LanguageContext =
  createContext<LanguageContextType | null>(null);

function readStoredLanguage(): Lang {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(savedLanguage)
      ? savedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getServerLanguage(): Lang {
  return DEFAULT_LANGUAGE;
}

function subscribeToLanguage(onLanguageChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
      onLanguageChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChange);
  };
}

function persistLanguage(language: Lang) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The cookie below is the source of truth for the storefront.
  }

  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax`;
}

/*
  Two modes:

  - Storefront (serverLang provided): the server already rendered the page
    in the language from the `lang` cookie. Switching language writes the
    cookie and reloads, so every page (including cached ones) is served in
    the new language straight from the server.

  - Back office (no serverLang): driver / delivery-company pages keep the
    previous client-side behaviour (localStorage, instant switch). Admin
    pages are always English.
*/
export function LanguageProvider({
  children,
  serverLang,
}: {
  children: ReactNode;
  serverLang?: Lang;
}) {
  const pathname = useAppPathname();

  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isStorefront = serverLang !== undefined;

  const storedLanguage = useSyncExternalStore(
    subscribeToLanguage,
    readStoredLanguage,
    getServerLanguage
  );

  const lang: Lang = isAdmin
    ? "en"
    : isStorefront
      ? serverLang
      : storedLanguage;

  const setLang = useCallback<Dispatch<SetStateAction<Lang>>>(
    (nextLanguage) => {
      if (isAdmin || typeof window === "undefined") {
        return;
      }

      const resolvedLanguage =
        typeof nextLanguage === "function"
          ? nextLanguage(lang)
          : nextLanguage;

      if (
        !isSupportedLanguage(resolvedLanguage) ||
        resolvedLanguage === lang
      ) {
        return;
      }

      persistLanguage(resolvedLanguage);

      if (isStorefront) {
        window.location.reload();
        return;
      }

      window.dispatchEvent(new Event(LANGUAGE_CHANGED_EVENT));
    },
    [isAdmin, isStorefront, lang]
  );

  const toggleLang = useCallback(() => {
    setLang((previousLanguage) =>
      previousLanguage === "en" ? "ar" : "en"
    );
  }, [setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      lang,
      setLang,
      toggleLang,
      isAdmin,
    }),
    [lang, setLang, toggleLang, isAdmin]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
