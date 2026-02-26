// app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const type = searchParams.get("type") ?? "image"; // "image" | "pdf"

  if (!year) {
    return NextResponse.json({ error: "year is required" }, { status: 400 });
  }

  let filename: string;
  let contentType: string;
  let downloadName: string;

  if (type === "image") {
    filename = "image-data.xlsx";
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    downloadName = `nirf-scores-${year}.xlsx`;
  } else {
    filename = "extracted-data.json";
    contentType = "application/json";
    downloadName = `nirf-pdf-data-${year}.json`;
  }

  const filePath = path.join(process.cwd(), "downloads", year, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `No data found for year ${year}. Run a download first.` },
      { status: 404 }
    );
  }

  const content = fs.readFileSync(filePath);

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}