import type { OpendataPackageShowResult } from "@/lib/opendata";
import { formatDate, humanBytes } from "@/lib/format";
import AutoViz from "@/components/dashboard/AutoViz";
import type { VizModel } from "@/lib/csv";

function pickTitle(pkg: OpendataPackageShowResult) {
  return pkg.title_translated?.en || pkg.title || pkg.name;
}

export default function DatasetCard({
  pkg,
  viz,
}: {
  pkg: OpendataPackageShowResult;
  viz: VizModel;
}) {
  const res0 = pkg.resources?.[0];
  const org = pkg.organization?.title || pkg.author || "Open Data Azerbaijan";
  const group = pkg.groups?.[0]?.title;
  const title = pickTitle(pkg);

  return (
    <article className="rounded-3xl border border-black/10 bg-cream p-5 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.55)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {group ? (
                <span className="inline-flex items-center rounded-full border border-black/10 bg-amberglass px-2 py-1 text-[11px] font-medium text-ink">
                  {group}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-black/10 bg-parchment px-2 py-1 text-[11px] font-medium text-ink">
                {res0?.format || "DATA"}
              </span>
              {pkg.license_title ? (
                <a
                  href={pkg.license_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-black/10 bg-parchment px-2 py-1 text-[11px] font-medium text-ink hover:bg-amberglass"
                >
                  {pkg.license_title}
                </a>
              ) : null}
            </div>

            <h2 className="mt-3 truncate text-xl font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <div className="mt-1 truncate text-sm text-black/70">{org}</div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <a
              href={res0?.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={[
                "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold",
                res0?.url
                  ? "bg-sienna text-white shadow-[0_14px_40px_-25px_rgba(197,90,42,0.8)] hover:brightness-95"
                  : "cursor-not-allowed bg-black/10 text-black/40",
              ].join(" ")}
            >
              Download CSV
            </a>
            <div className="text-xs text-black/60">
              Updated{" "}
              <span className="font-medium text-ink">
                {formatDate(res0?.last_modified || pkg.metadata_modified)}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-black/60">
              Dataset id
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-ink">{pkg.name}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-black/60">
              Resource size
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{humanBytes(res0?.size)}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-black/60">
              Created
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{formatDate(pkg.metadata_created)}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-black/60">
              Source page
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-ink">
              {pkg.url ? (
                <a className="hover:underline" href={pkg.url} target="_blank" rel="noreferrer">
                  azstat.gov.az
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        <AutoViz model={viz} />
      </div>
    </article>
  );
}

