"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Lang = "en" | "ar";

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
      return;
    }

    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang, isAdmin]);

  function toggleLang() {
    if (isAdmin) return;
    setLang((prev) => (prev === "en" ? "ar" : "en"));
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
  return useContext(LanguageContext);
}