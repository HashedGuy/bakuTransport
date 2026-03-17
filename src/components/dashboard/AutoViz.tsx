"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { VizModel } from "@/lib/csv";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
);

function cssVar(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function palette(n: number) {
  const sienna = cssVar("--color-sienna") || "#cc5a2a";
  const apricot = cssVar("--color-apricot") || "#ffbf8e";
  const amber = cssVar("--color-amberglass") || "#ffe6cf";
  const ink = cssVar("--color-ink") || "#201a14";
  const base = [apricot, amber, `${sienna}cc`, `${ink}22`, `${sienna}66`];
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) out.push(base[i % base.length]!);
  return out;
}

export default function AutoViz({ model }: { model: VizModel }) {
  const ink = cssVar("--color-ink") || "#201a14";
  const sienna = cssVar("--color-sienna") || "#cc5a2a";
  const apricot = cssVar("--color-apricot") || "#ffbf8e";

  if (model.kind === "none") {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-black/70">
        {model.reason}
      </div>
    );
  }

  if (model.kind === "line") {
    const labels = model.points.map((p) => String(p.x));
    const data = model.points.map((p) => p.y);
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold text-ink">{model.title}</div>
          <div className="truncate text-xs text-black/60">{model.yLabel}</div>
        </div>
        <div className="h-56">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: model.yLabel,
                  data,
                  tension: 0.28,
                  borderColor: sienna,
                  backgroundColor: apricot,
                  fill: true,
                  pointRadius: 2,
                  pointHoverRadius: 4,
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
                    title: (items) => `Year: ${items[0]?.label ?? ""}`,
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: "rgba(0,0,0,0.55)" } },
                y: { grid: { color: "rgba(0,0,0,0.10)" }, ticks: { color: "rgba(0,0,0,0.55)" } },
              },
              elements: { line: { borderWidth: 2 }, point: { borderColor: ink } },
            }}
          />
        </div>
      </div>
    );
  }

  if (model.kind === "bar") {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold text-ink">{model.title}</div>
          <div className="truncate text-xs text-black/60">{model.yLabel}</div>
        </div>
        <div className="h-56">
          <Bar
            data={{
              labels: model.labels,
              datasets: [
                {
                  label: model.yLabel,
                  data: model.values,
                  backgroundColor: palette(model.values.length),
                  borderColor: sienna,
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { color: "rgba(0,0,0,0.55)" } },
                y: { grid: { color: "rgba(0,0,0,0.10)" }, ticks: { color: "rgba(0,0,0,0.55)" } },
              },
            }}
          />
        </div>
      </div>
    );
  }

  // donut
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-ink">{model.title}</div>
        <div className="truncate text-xs text-black/60">share</div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-56">
          <Doughnut
            data={{
              labels: model.labels,
              datasets: [
                {
                  data: model.values,
                  backgroundColor: palette(model.values.length),
                  borderColor: "rgba(0,0,0,0.08)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              cutout: "68%",
            }}
          />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/60 p-3">
          <div className="text-xs font-semibold text-ink">Top categories</div>
          <ul className="mt-2 space-y-1 text-xs text-black/70">
            {model.labels.slice(0, 6).map((l, i) => (
              <li key={l} className="flex items-center justify-between gap-2">
                <span className="truncate">{l}</span>
                <span className="font-medium text-ink">{model.values[i]?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

