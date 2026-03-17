"use client";

import HeroHeader from "@/components/dashboard/HeroHeader";
import MetroTripsViz from "@/components/dashboard/MetroTripsViz";
import { useLang } from "@/components/i18n/LangProvider";
import { UI_COPY } from "@/lib/uiCopy";
import type { MetroAgg } from "@/lib/metroTrips";

export default function MetroDashboardClient({
  agg2025,
  agg2026,
  error,
}: {
  agg2025?: MetroAgg;
  agg2026?: MetroAgg;
  error?: string;
}) {
  const { lang } = useLang();
  const t = UI_COPY[lang];

  return (
    <>
      <HeroHeader apiHref="https://admin.opendata.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi" />

      {error ? (
        <div className="mt-6 rounded-3xl border border-black/10 bg-cream p-6">
          <div className="text-sm font-semibold text-ink">{t.dataUnavailableTitle}</div>
          <div className="mt-1 text-sm text-black/70">{error}</div>
          <div className="mt-3 text-xs text-black/60">{t.dataUnavailableHint}</div>
        </div>
      ) : null}

      {agg2025 && agg2026 ? (
        <div className="mt-8">
          <MetroTripsViz agg2025={agg2025} agg2026={agg2026} />
        </div>
      ) : null}
    </>
  );
}

