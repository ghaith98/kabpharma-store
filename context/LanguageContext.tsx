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

import { usePathname } from "next/navigation";

type Lang =
  | "en"
  | "ar";

type LanguageContextType = {
  lang: Lang;

  setLang:
    Dispatch<
      SetStateAction<Lang>
    >;

  toggleLang: () => void;
  isAdmin: boolean;
};

const LANGUAGE_STORAGE_KEY =
  "lang";

const LANGUAGE_CHANGED_EVENT =
  "kabLanguageChanged";

const DEFAULT_LANGUAGE: Lang =
  "ar";

const LanguageContext =
  createContext<
    LanguageContextType | null
  >(null);

function isSupportedLanguage(
  value: string | null
): value is Lang {
  return (
    value === "ar" ||
    value === "en"
  );
}

function readStoredLanguage(): Lang {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_LANGUAGE;
  }

  try {
    const savedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    return isSupportedLanguage(
      savedLanguage
    )
      ? savedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getServerLanguage(): Lang {
  return DEFAULT_LANGUAGE;
}

function subscribeToLanguage(
  onLanguageChange: () => void
) {
  function handleStorage(
    event: StorageEvent
  ) {
    if (
      event.key ===
        LANGUAGE_STORAGE_KEY ||
      event.key === null
    ) {
      onLanguageChange();
    }
  }

  function handleLocalChange() {
    onLanguageChange();
  }

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    LANGUAGE_CHANGED_EVENT,
    handleLocalChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      LANGUAGE_CHANGED_EVENT,
      handleLocalChange
    );
  };
}

function saveLanguage(
  language: Lang
) {
  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language
    );
  } catch {
    /*
      The language still works for the current
      page even if browser storage is unavailable.
    */
  }

  window.dispatchEvent(
    new Event(
      LANGUAGE_CHANGED_EVENT
    )
  );
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const isAdmin =
    pathname?.startsWith(
      "/admin"
    ) ?? false;

  const storedLanguage =
    useSyncExternalStore(
      subscribeToLanguage,
      readStoredLanguage,
      getServerLanguage
    );

  const lang: Lang =
    isAdmin
      ? "en"
      : storedLanguage;

  const setLang =
    useCallback<
      Dispatch<
        SetStateAction<Lang>
      >
    >(
      (nextLanguage) => {
        if (
          isAdmin ||
          typeof window ===
            "undefined"
        ) {
          return;
        }

        const previousLanguage =
          readStoredLanguage();

        const resolvedLanguage =
          typeof nextLanguage ===
          "function"
            ? nextLanguage(
                previousLanguage
              )
            : nextLanguage;

        if (
          !isSupportedLanguage(
            resolvedLanguage
          )
        ) {
          return;
        }

        if (
          resolvedLanguage ===
          previousLanguage
        ) {
          return;
        }

        saveLanguage(
          resolvedLanguage
        );
      },
      [isAdmin]
    );

  const toggleLang =
    useCallback(() => {
      if (isAdmin) {
        return;
      }

      setLang(
        (
          previousLanguage
        ) =>
          previousLanguage ===
          "en"
            ? "ar"
            : "en"
      );
    }, [
      isAdmin,
      setLang,
    ]);

  useEffect(() => {
    document.documentElement.lang =
      lang;

    document.documentElement.dir =
      lang === "ar"
        ? "rtl"
        : "ltr";
  }, [lang]);

  const contextValue =
    useMemo<
      LanguageContextType
    >(
      () => ({
        lang,
        setLang,
        toggleLang,
        isAdmin,
      }),
      [
        lang,
        setLang,
        toggleLang,
        isAdmin,
      ]
    );

  return (
    <LanguageContext.Provider
      value={
        contextValue
      }
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}