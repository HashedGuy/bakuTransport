function splitCsvLine(line: string, delimiter: "," | ";" = ",") {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toNumber(raw: string) {
  const s = raw.trim();
  if (!s) return undefined;
  const cleaned = s.replace(/\s+/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export type SeriesPoint = { x: number; y: number };

export type ParsedCsv = {
  header: string[];
  rows: string[][];
};

function detectDelimiter(line: string): "," | ";" {
  // Pick the delimiter that appears more often outside quotes (simple heuristic).
  let comma = 0;
  let semi = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (ch === ",") comma += 1;
      if (ch === ";") semi += 1;
    }
  }
  return semi > comma ? ";" : ",";
}

export function parseCsv(csvText: string, maxRows = 500): ParsedCsv {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { header: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]!);
  const header = splitCsvLine(lines[0]!, delimiter);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length && rows.length < maxRows; i += 1) {
    const cols = splitCsvLine(lines[i]!, delimiter);
    rows.push(cols);
  }
  return { header, rows };
}

export function csvToYearSeries(csvText: string): {
  header: string[];
  series: SeriesPoint[];
  yLabel: string;
} {
  const { header, rows } = parseCsv(csvText);
  if (header.length === 0 || rows.length === 0) {
    return { header: [], series: [], yLabel: "Value" };
  }

  const yearIdx = header.findIndex((h) => /year/i.test(h) || /il/i.test(h));

  const candidateIdxs = header
    .map((h, i) => ({ h, i }))
    .filter(({ i }) => i !== yearIdx)
    .map(({ i }) => i);

  let valueIdx = candidateIdxs[0] ?? -1;
  const preferred = header.findIndex(
    (h) =>
      /cəmi/i.test(h) ||
      /\btotal\b/i.test(h) ||
      /umumi/i.test(h) ||
      /overall/i.test(h),
  );
  if (preferred >= 0 && preferred !== yearIdx) valueIdx = preferred;

  const series: SeriesPoint[] = [];
  for (const cols of rows) {
    const yearRaw = yearIdx >= 0 ? cols[yearIdx] : cols[0];
    const year = Number((yearRaw || "").trim());
    if (!Number.isFinite(year)) continue;
    const valueRaw = valueIdx >= 0 ? cols[valueIdx] : undefined;
    const y = valueRaw != null ? toNumber(valueRaw) : undefined;
    if (y == null) continue;
    series.push({ x: year, y });
  }

  series.sort((a, b) => a.x - b.x);
  const yLabel = header[valueIdx] || "Value";
  return { header, series, yLabel };
}

export type VizModel =
  | { kind: "line"; title: string; yLabel: string; points: SeriesPoint[] }
  | { kind: "bar"; title: string; xLabel: string; yLabel: string; labels: string[]; values: number[] }
  | { kind: "donut"; title: string; labels: string[]; values: number[] }
  | { kind: "none"; title: string; reason: string };

function looksLikeYearHeader(h: string) {
  return /year/i.test(h) || /\bil\b/i.test(h);
}

function isPercentHeader(h: string) {
  return /%|faiz|percent/i.test(h);
}

function pickPreferredValueIndex(header: string[], excludeIdxs: Set<number>) {
  const preferred = header.findIndex(
    (h) =>
      !excludeIdxs.has(header.indexOf(h)) &&
      (/cəmi/i.test(h) || /\btotal\b/i.test(h) || /umumi/i.test(h) || /overall/i.test(h)),
  );
  if (preferred >= 0 && !excludeIdxs.has(preferred)) return preferred;
  for (let i = 0; i < header.length; i += 1) {
    if (excludeIdxs.has(i)) continue;
    return i;
  }
  return -1;
}

export function inferVizFromCsv(csvText: string, fallbackTitle = "Visual"): VizModel {
  const { header, rows } = parseCsv(csvText);
  if (header.length === 0 || rows.length === 0) {
    return { kind: "none", title: fallbackTitle, reason: "Empty CSV" };
  }

  // 1) Time-series (Year + numeric)
  const yearIdx = header.findIndex((h) => looksLikeYearHeader(h));
  if (yearIdx >= 0) {
    const { series, yLabel } = csvToYearSeries(csvText);
    if (series.length >= 2) {
      return { kind: "line", title: "Trend", yLabel, points: series };
    }
  }

  // 2) Category vs numeric (bar / donut)
  // Pick a likely categorical column: first non-empty column with mostly non-numeric strings.
  const numericRatio = (colIdx: number) => {
    let n = 0;
    let ok = 0;
    for (const r of rows) {
      const v = r[colIdx] ?? "";
      if (!v.trim()) continue;
      n += 1;
      if (toNumber(v) != null) ok += 1;
    }
    return n === 0 ? 0 : ok / n;
  };

  const exclude = new Set<number>();
  const catIdx = header.findIndex((_, i) => numericRatio(i) < 0.3);
  if (catIdx >= 0) exclude.add(catIdx);
  const valueIdx = pickPreferredValueIndex(header, exclude);

  if (catIdx >= 0 && valueIdx >= 0 && catIdx !== valueIdx) {
    const labels: string[] = [];
    const values: number[] = [];
    for (const r of rows) {
      const label = (r[catIdx] ?? "").trim();
      const y = toNumber(r[valueIdx] ?? "");
      if (!label || y == null) continue;
      labels.push(label);
      values.push(y);
      if (labels.length >= 12) break; // keep it readable
    }

    if (labels.length >= 3) {
      const sum = values.reduce((a, b) => a + b, 0);
      const shouldDonut =
        isPercentHeader(header[valueIdx] || "") ||
        (sum > 95 && sum < 105 && values.every((v) => v >= 0));

      if (shouldDonut) {
        return { kind: "donut", title: "Composition", labels, values };
      }

      return {
        kind: "bar",
        title: "Comparison",
        xLabel: header[catIdx] || "Category",
        yLabel: header[valueIdx] || "Value",
        labels,
        values,
      };
    }
  }

  return {
    kind: "none",
    title: fallbackTitle,
    reason: "Could not infer a chart (no Year-series or category-value structure found).",
  };
}

