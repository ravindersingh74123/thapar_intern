// app/api/file/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Allowed file extensions for security
const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".xlsx"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  // Reconstruct relative path, e.g. ["2025", "overall", "pdf", "IR-O-U-0456.pdf"]
  const relPath = segments.join("/");

  // Security: prevent path traversal
  if (relPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = path.extname(segments[segments.length - 1]).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "downloads", relPath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found", path: filePath }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  const contentTypeMap: Record<string, string> = {
    ".pdf":  "application/pdf",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":   contentTypeMap[ext] ?? "application/octet-stream",
      "Content-Length": String(stat.size),
      "Cache-Control":  "public, max-age=3600",
    },
  });
}