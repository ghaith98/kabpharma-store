"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type Lang = "en" | "ar";

type LanguageContextType = {
  lang: Lang;
  setLang: React.Dispatch<React.SetStateAction<Lang>>;
  toggleLang: () => void;
  isAdmin: boolean;
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  /*
    اللغة الافتراضية للزائر الجديد هي العربية.
  */
  const [lang, setLang] = useState<Lang>("ar");

  /*
    نمنع حفظ اللغة قبل قراءة اللغة القديمة من localStorage.
  */
  const [languageLoaded, setLanguageLoaded] =
    useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang");

    if (saved === "ar" || saved === "en") {
      setLang(saved);
    } else {
      setLang("ar");
    }

    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    /*
      لوحة الإدارة دائماً إنكليزية ومن اليسار لليمين.
    */
    if (isAdmin) {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
      return;
    }

    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === "ar" ? "rtl" : "ltr";

    if (languageLoaded) {
      localStorage.setItem("lang", lang);
    }
  }, [lang, isAdmin, languageLoaded]);

  function toggleLang() {
    if (isAdmin) {
      return;
    }

    setLang((previousLanguage) =>
      previousLanguage === "en" ? "ar" : "en"
    );
  }

  return (
    <LanguageContext.Provider
      value={{
        lang: isAdmin ? "en" : lang,
        setLang,
        toggleLang,
        isAdmin,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}