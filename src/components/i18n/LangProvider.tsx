"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "az";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export default function LangProvider({
  children,
  storageKey = "bto.lang",
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v === "en" || v === "az") setLang(v);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, lang);
    } catch {
      // ignore
    }
  }, [storageKey, lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

