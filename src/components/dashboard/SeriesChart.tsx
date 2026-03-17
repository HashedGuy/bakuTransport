"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { SeriesPoint } from "@/lib/csv";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
);

function cssVar(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function SeriesChart({
  series,
  yLabel,
}: {
  series: SeriesPoint[];
  yLabel: string;
}) {
  const labels = series.map((p) => String(p.x));
  const data = series.map((p) => p.y);

  const ink = cssVar("--color-ink") || "#201a14";
  const sienna = cssVar("--color-sienna") || "#cc5a2a";
  const apricot = cssVar("--color-apricot") || "#ffbf8e";

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-ink">Trend</div>
        <div className="truncate text-xs text-black/60">{yLabel}</div>
      </div>
      <div className="h-56">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: yLabel,
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
              x: {
                grid: { display: false },
                ticks: { color: "rgba(0,0,0,0.55)" },
              },
              y: {
                grid: { color: "rgba(0,0,0,0.10)" },
                ticks: { color: "rgba(0,0,0,0.55)" },
              },
            },
            elements: {
              line: { borderWidth: 2 },
              point: { borderColor: ink },
            },
          }}
        />
      </div>
    </div>
  );
}

