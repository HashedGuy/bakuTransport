"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLang, type Lang } from "@/components/i18n/LangProvider";

export const HERO_COPY: Record<
  Lang,
  {
    badge: string;
    title: string;
    description: string;
    apiButton: string;
    langLabel: string;
  }
> = {
  en: {
    badge: "City for People · Azerbaijan",
    title: "Baku Transport OS",
    description:
      "Baku Transport OS (Open Source) is a project aimed at bringing real-time, open data from transport agencies into meaningful, user-friendly displays helping people stay informed about the dynamics of public transportation in our city. The project strongly supports the vision of making Baku one of the most pedestrian-first, urban-friendly cities in the world.",
    apiButton: "Metro daily trips API",
    langLabel: "EN",
  },
  az: {
    badge: "City for People · Azərbaycan",
    title: "Baku Transport OS",
    description:
      "Baku Transport OS (Open Source) nəqliyyat agentliklərindən real vaxt rejimində alınan məlumatları təqdim etmək və insanların şəhərimizdəki ictimai nəqliyyatın dinamikası barədə məlumatlı olmalarına kömək etmək məqsədi daşıyan bir layihədir. Layihə, Bakını dünyanın piyada yönümlü və müasir urbanistik həlləri özündə birləşdirən şəhərlərindən birinə çevirmək baxışını dəstəkləyir.",
    apiButton: "Metro gündəlik gedişlər API",
    langLabel: "AZ",
  },
};

export default function HeroHeader({
  apiHref,
}: {
  apiHref: string;
}) {
  const { lang, setLang } = useLang();
  const t = HERO_COPY[lang];

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(ev: MouseEvent) {
      const el = menuRef.current;
      if (!el) return;
      const target = ev.target as Node | null;
      if (target && el.contains(target)) return;
      setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = useMemo(
    () =>
      ([
        { id: "en" as const, label: "EN" },
        { id: "az" as const, label: "AZ" },
      ]).filter(Boolean),
    [],
  );

  return (
    <header className="relative rounded-3xl border border-black/10 bg-cream p-5 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.55)] sm:p-8">
      <div className="absolute right-4 top-4 sm:right-5 sm:top-5" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer select-none items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-ink hover:bg-amberglass active:scale-[0.99]"
          aria-label="Language"
        >
          {t.langLabel}
          <span className="text-base leading-none text-black/60">▾</span>
        </button>
        {open ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-32 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_-45px_rgba(0,0,0,0.55)]">
            <div className="p-1">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setLang(o.id);
                    setOpen(false);
                  }}
                  className={[
                    "w-full rounded-xl px-3 py-2 text-left text-sm",
                    o.id === lang ? "bg-amberglass font-semibold text-ink" : "hover:bg-black/5",
                  ].join(" ")}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center rounded-full border border-black/10 bg-amberglass px-3 py-1 text-xs font-semibold text-ink">
          {t.badge}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-black/70">{t.description}</p>
      </div>
    </header>
  );
}

