import { parseCsv } from "@/lib/csv";

export type TripRow = {
  date: string; // YYYY-MM-DD
  station: string;
  trips: number;
};

function toNumber(raw: string) {
  const s = raw.trim();
  if (!s) return undefined;
  const cleaned = s.replace(/\s+/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeDate(raw: string) {
  const s = raw.trim();
  // common: yyyy-mm-dd ...
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // expected: dd.mm.yyyy
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (!m) return undefined;
  const dd = m[1]!.padStart(2, "0");
  const mm = m[2]!.padStart(2, "0");
  const yyyy = m[3]!;
  return `${yyyy}-${mm}-${dd}`;
}

export function parseMetroTripsCsv(csvText: string): TripRow[] {
  const { header, rows } = parseCsv(csvText, 200000);
  if (header.length === 0) return [];

  const dateIdx = header.findIndex((h) => /tarix|date/i.test(h));
  const stationIdx = header.findIndex((h) => /stansiya|station/i.test(h));
  const tripsIdx = header.findIndex((h) => /gediş|trip|departure/i.test(h));

  const out: TripRow[] = [];
  for (const r of rows) {
    const dateRaw = r[dateIdx >= 0 ? dateIdx : 0] ?? "";
    const stationRaw = r[stationIdx >= 0 ? stationIdx : 1] ?? "";
    const tripsRaw = r[tripsIdx >= 0 ? tripsIdx : 2] ?? "";

    const date = normalizeDate(dateRaw);
    const station = stationRaw.trim();
    const trips = toNumber(tripsRaw);
    if (!date || !station || trips == null) continue;
    out.push({ date, station, trips });
  }
  return out;
}

export type MetroAgg = {
  totalTrips: number;
  days: number;
  avgTripsPerDay: number;
  peakDay: { date: string; trips: number };
  topStations: Array<{ station: string; trips: number }>;
  dailyTotals: Array<{ date: string; trips: number }>;
  weekdayAvg: Array<{ weekday: string; trips: number }>;
  monthlyTotals: Array<{ month: string; trips: number }>; // YYYY-MM
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function weekdayIndex(isoDate: string) {
  // ISO date at local midnight
  const d = new Date(`${isoDate}T00:00:00`);
  // JS: 0=Sun..6=Sat -> convert to Mon=0..Sun=6
  const js = d.getDay();
  return (js + 6) % 7;
}

export function aggregateMetroTrips(rows: TripRow[]): MetroAgg {
  const daily = new Map<string, number>();
  const stationTotals = new Map<string, number>();
  const weekdaySum = new Array<number>(7).fill(0);
  const weekdayDays = new Array<number>(7).fill(0);
  const monthTotals = new Map<string, number>();

  for (const r of rows) {
    daily.set(r.date, (daily.get(r.date) || 0) + r.trips);
    stationTotals.set(r.station, (stationTotals.get(r.station) || 0) + r.trips);

    const wi = weekdayIndex(r.date);
    weekdaySum[wi] += r.trips;

    const month = r.date.slice(0, 7);
    monthTotals.set(month, (monthTotals.get(month) || 0) + r.trips);
  }

  // count distinct days per weekday
  for (const d of daily.keys()) {
    const wi = weekdayIndex(d);
    weekdayDays[wi] += 1;
  }

  const dailyTotals = Array.from(daily.entries())
    .map(([date, trips]) => ({ date, trips }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let peakDay = { date: "—", trips: 0 };
  for (const d of dailyTotals) {
    if (d.trips > peakDay.trips) peakDay = { date: d.date, trips: d.trips };
  }

  const topStations = Array.from(stationTotals.entries())
    .map(([station, trips]) => ({ station, trips }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 12);

  const monthlyTotals = Array.from(monthTotals.entries())
    .map(([month, trips]) => ({ month, trips }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalTrips = dailyTotals.reduce((s, d) => s + d.trips, 0);
  const days = dailyTotals.length;
  const avgTripsPerDay = days ? totalTrips / days : 0;

  const weekdayAvg = WEEKDAYS.map((w, i) => ({
    weekday: w,
    trips: weekdayDays[i] ? weekdaySum[i]! / weekdayDays[i]! : 0,
  }));

  return {
    totalTrips,
    days,
    avgTripsPerDay,
    peakDay,
    topStations,
    dailyTotals,
    weekdayAvg,
    monthlyTotals,
  };
}

export function movingAverage(points: Array<{ x: string; y: number }>, window = 7) {
  const out: Array<{ x: string; y: number }> = [];
  const buf: number[] = [];
  let sum = 0;
  for (const p of points) {
    buf.push(p.y);
    sum += p.y;
    if (buf.length > window) sum -= buf.shift()!;
    out.push({ x: p.x, y: sum / buf.length });
  }
  return out;
}

