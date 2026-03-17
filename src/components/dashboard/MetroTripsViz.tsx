"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { MetroAgg } from "@/lib/metroTrips";
import { useLang } from "@/components/i18n/LangProvider";
import { UI_COPY } from "@/lib/uiCopy";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  Legend,
);

function cssVar(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatMln(n: number) {
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000;
    const decimals = Math.abs(v) >= 10 ? 0 : 1;
    return `${v.toFixed(decimals)} Mln.`;
  }
  if (Math.abs(n) >= 1_000) {
    const v = n / 1_000;
    const decimals = Math.abs(v) >= 10 ? 0 : 1;
    return `${v.toFixed(decimals)} K`;
  }
  return String(Math.round(n));
}

function monthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}

function monthFromIsoDate(date: string) {
  return date.slice(0, 7);
}

export default function MetroTripsViz({
  agg2025,
  agg2026,
}: {
  agg2025: MetroAgg;
  agg2026: MetroAgg;
}) {
  const { lang } = useLang();
  const t = UI_COPY[lang];
  const ink = cssVar("--color-ink") || "#201a14";
  const sienna = cssVar("--color-sienna") || "#cc5a2a";
  const apricot = cssVar("--color-apricot") || "#ffbf8e";

  const combinedDaily = useMemo(() => {
    const all = agg2025.dailyTotals
      .concat(agg2026.dailyTotals)
      .map((d) => ({ date: d.date, trips: d.trips }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return all;
  }, [agg2025.dailyTotals, agg2026.dailyTotals]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    for (const d of combinedDaily) s.add(monthFromIsoDate(d.date));
    // Latest month first (descending)
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [combinedDaily]);

  const defaultMonth = availableMonths[0] || "—";
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsSmall(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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

  const monthDaily = useMemo(() => {
    return combinedDaily.filter((d) => monthFromIsoDate(d.date) === selectedMonth);
  }, [combinedDaily, selectedMonth]);

  const monthKpis = useMemo(() => {
    const days = monthDaily.length;
    const total = monthDaily.reduce((s, d) => s + d.trips, 0);
    const avg = days ? total / days : 0;
    let peak = { date: "—", trips: 0 };
    for (const d of monthDaily) if (d.trips > peak.trips) peak = { date: d.date, trips: d.trips };
    return { days, total, avg, peak };
  }, [monthDaily]);

  const stations = agg2025.topStations
    .concat(agg2026.topStations)
    .reduce((m, s) => m.add(s.station), new Set<string>());

  // combined station totals (approx: sum of top lists; good enough for “top stations” card)
  const combinedMap = new Map<string, number>();
  for (const s of agg2025.topStations) combinedMap.set(s.station, (combinedMap.get(s.station) || 0) + s.trips);
  for (const s of agg2026.topStations) combinedMap.set(s.station, (combinedMap.get(s.station) || 0) + s.trips);
  const combinedTop = Array.from(combinedMap.entries())
    .map(([station, trips]) => ({ station, trips }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, isSmall ? 8 : 12);

  const monthMenuWidth = isSmall ? "w-[min(80vw,18rem)]" : "w-64";

  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="rounded-3xl border border-black/10 bg-cream p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-ink">{t.dailyTrips}</div>
              <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-700">
                {t.subwayTag}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex cursor-pointer select-none items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-ink hover:bg-amberglass"
                >
                  {selectedMonth === "—" ? t.selectMonth : monthLabel(selectedMonth)}
                  <span className="text-base leading-none text-black/60">▾</span>
                </button>
                {open ? (
                  <div
                    ref={menuRef}
                    className={`absolute left-0 top-[calc(100%+8px)] z-20 ${monthMenuWidth} overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_-45px_rgba(0,0,0,0.55)]`}
                  >
                    <div className="max-h-72 overflow-auto p-1">
                      {availableMonths.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setOpen(false);
                          }}
                          className={[
                            "w-full rounded-xl px-3 py-2 text-left text-sm",
                            m === selectedMonth ? "bg-amberglass font-semibold text-ink" : "hover:bg-black/5",
                          ].join(" ")}
                        >
                          {monthLabel(m)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-1 text-xs text-black/60">
              {t.total} {formatCompact(monthKpis.total)} · {t.avgPerDay} {formatCompact(monthKpis.avg)} · {t.peak}{" "}
              {monthKpis.peak.date}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-ink">
            {t.days}: <span className="font-semibold">{monthKpis.days}</span>
          </div>
        </div>

        <div className="mt-4 h-64 rounded-2xl border border-black/10 bg-white/70 p-3 sm:h-80 sm:p-4">
          <Line
            data={{
              labels: monthDaily.map((d) => d.date),
              datasets: [
                {
                  label: "Trips",
                  data: monthDaily.map((d) => d.trips),
                  borderColor: sienna,
                  backgroundColor: apricot,
                  fill: true,
                  pointRadius: isSmall ? 2 : 3,
                  pointHoverRadius: 5,
                  pointHitRadius: 10,
                  tension: 0.25,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (items) => `${t.tooltipDate}: ${items[0]?.label ?? ""}`,
                    label: (item) =>
                      `${t.tooltipTrips}: ${new Intl.NumberFormat(lang).format(Number(item.raw))}`,
                  },
                },
              },
              scales: {
                x: {
                  ticks: { maxTicksLimit: isSmall ? 4 : 8, color: "rgba(0,0,0,0.55)" },
                  grid: { display: false },
                },
                y: {
                  ticks: { color: "rgba(0,0,0,0.55)" },
                  grid: { color: "rgba(0,0,0,0.10)" },
                },
              },
              elements: { line: { borderWidth: 2 }, point: { borderColor: ink } },
            }}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/10 bg-cream p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-ink">{t.topStationsCombined}</div>
              <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-700">
                {t.subwayTag}
              </span>
            </div>
            <div className="text-xs text-black/60">{t.topStationsSubtitle}</div>
          </div>
        </div>
        <div className="mt-4 h-80 rounded-2xl border border-black/10 bg-white/70 p-3 sm:p-4">
          <Bar
            data={{
              labels: combinedTop.map((s) => s.station),
              datasets: [
                {
                  label: "Trips",
                  data: combinedTop.map((s) => s.trips),
                  backgroundColor: apricot,
                  borderColor: sienna,
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: {
                    color: "rgba(0,0,0,0.55)",
                    callback: (v) => formatMln(Number(v)),
                  },
                  grid: { color: "rgba(0,0,0,0.10)" },
                },
                y: {
                  ticks: { color: "rgba(0,0,0,0.55)", font: { size: isSmall ? 10 : 12 } },
                  grid: { display: false },
                },
              },
            }}
          />
        </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-cream p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-ink">{t.weekdayPattern}</div>
          <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-700">
            {t.subwayTag}
          </span>
        </div>
        <div className="mt-1 text-xs text-black/60">{t.weekdaySubtitle}</div>
        <div className="mt-4 h-80 rounded-2xl border border-black/10 bg-white/70 p-3 sm:p-4">
          <Bar
            data={{
              labels: agg2025.weekdayAvg.map((w) => w.weekday),
              datasets: [
                {
                  label: "2025",
                  data: agg2025.weekdayAvg.map((w) => w.trips),
                  backgroundColor: "rgba(204,90,42,0.25)",
                  borderColor: sienna,
                  borderWidth: 1,
                },
                {
                  label: "2026",
                  data: agg2026.weekdayAvg.map((w) => w.trips),
                  backgroundColor: "rgba(255,191,142,0.75)",
                  borderColor: "rgba(204,90,42,0.45)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              scales: {
                x: { ticks: { color: "rgba(0,0,0,0.55)" }, grid: { display: false } },
                y: { ticks: { color: "rgba(0,0,0,0.55)" }, grid: { color: "rgba(0,0,0,0.10)" } },
              },
            }}
          />
        </div>
        </section>
      </div>
    </div>
  );
}

