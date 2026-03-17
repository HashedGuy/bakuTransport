import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const resourceUrl = url.searchParams.get("url");
  const lines = clamp(Number(url.searchParams.get("lines") || 25), 1, 200);

  if (!resourceUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing required query param: url" },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(resourceUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid url" }, { status: 400 });
  }

  if (parsed.hostname !== "admin.opendata.az") {
    return NextResponse.json(
      { ok: false, error: "Only admin.opendata.az resources are allowed" },
      { status: 400 },
    );
  }

  const upstream = await fetch(parsed.toString(), {
    headers: { Accept: "text/csv,*/*" },
    next: { revalidate: 60 * 60 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: `Upstream error ${upstream.status}` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  const preview = text.split(/\r?\n/).slice(0, lines).join("\n");

  return new NextResponse(preview, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

