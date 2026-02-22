// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { startDownload } from "../lib/downloader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;
    const year = body?.year;

    if (!url || !year) {
      return NextResponse.json({ error: "url and year required" }, { status: 400 });
    }

    // Start the download asynchronously (do not await to return immediately)
    startDownload(url, String(year)).catch((err) => {
      console.error("background startDownload failed:", err);
    });

    return NextResponse.json({ message: "Download started" });
  } catch (err) {
    console.error("POST /api/download error:", err);
    return NextResponse.json({ error: "Failed to start download" }, { status: 500 });
  }
}






