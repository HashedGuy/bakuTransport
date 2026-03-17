import { opendataPackageShowUrl, type CkanResponse, type OpendataPackageShowResult } from "@/lib/opendata";
import { aggregateMetroTrips, parseMetroTripsCsv } from "@/lib/metroTrips";
import MetroDashboardClient from "@/components/dashboard/MetroDashboardClient";

export const dynamic = "force-dynamic";

async function fetchPackage(id: string) {
  const res = await fetch(opendataPackageShowUrl(id), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`package_show failed (${res.status})`);
  const json = (await res.json()) as CkanResponse<OpendataPackageShowResult>;
  if (!json.success) throw new Error("package_show returned success=false");
  return json.result;
}

async function fetchCsvText(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "admin.opendata.az") return undefined;
  const res = await fetch(parsed.toString(), {
    headers: { Accept: "text/csv,*/*" },
  });
  if (!res.ok) return undefined;
  return await res.text();
}

export default async function Home() {
  // Previous dataset cards are intentionally commented out for now.
  // We'll bring them back later behind a proper "Sources" selector.
  /*
  let passenger: OpendataPackageShowResult | undefined;
  let passengerAlt: OpendataPackageShowResult | undefined;
  let passengerYoY: OpendataPackageShowResult | undefined;
  let income: OpendataPackageShowResult | undefined;
  let expenditures: OpendataPackageShowResult | undefined;
  let revenue: OpendataPackageShowResult | undefined;
  */

  let metro: OpendataPackageShowResult | undefined;
  let agg2025: ReturnType<typeof aggregateMetroTrips> | undefined;
  let agg2026: ReturnType<typeof aggregateMetroTrips> | undefined;
  let error: string | undefined;

  try {
    metro = await fetchPackage("stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi");

    const r2025 = metro.resources?.find((r) => /2025/i.test(r.name)) || metro.resources?.[0];
    const r2026 = metro.resources?.find((r) => /2026/i.test(r.name)) || metro.resources?.[1];

    const [csv2025, csv2026] = await Promise.all([
      r2025?.url ? fetchCsvText(r2025.url) : Promise.resolve(undefined),
      r2026?.url ? fetchCsvText(r2026.url) : Promise.resolve(undefined),
    ]);

    const rows2025 = csv2025 ? parseMetroTripsCsv(csv2025) : [];
    const rows2026 = csv2026 ? parseMetroTripsCsv(csv2026) : [];

    agg2025 = aggregateMetroTrips(rows2025);
    agg2026 = aggregateMetroTrips(rows2026);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load datasets";
  }

  return (
    <main className="min-h-screen bg-parchment text-ink">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <MetroDashboardClient agg2025={agg2025} agg2026={agg2026} error={error} />

        <footer className="mt-10 border-t border-black/10 pt-6 text-sm text-black/60">
          Created by{" "}
          <a
            className="font-semibold text-ink hover:underline"
            href="https://x.com/kjuriousBeing"
            target="_blank"
            rel="noreferrer"
          >
            @kjuriousBeing
          </a>
        </footer>
      </div>
    </main>
  );
}
