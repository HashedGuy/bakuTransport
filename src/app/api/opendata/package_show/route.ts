import { NextResponse } from "next/server";
import {
  DEFAULT_DATASET_ID,
  opendataPackageShowUrl,
  type CkanResponse,
  type OpendataPackageShowResult,
} from "@/lib/opendata";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const datasetId = url.searchParams.get("id") || DEFAULT_DATASET_ID;

  const upstream = await fetch(opendataPackageShowUrl(datasetId), {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Upstream error ${upstream.status}`,
        datasetId,
      },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as CkanResponse<OpendataPackageShowResult>;
  return NextResponse.json({ ok: true, datasetId, data });
}

