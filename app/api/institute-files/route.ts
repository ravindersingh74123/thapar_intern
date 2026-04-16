// app/api/institute-files/route.ts
/**
 * GET /api/institute-files?code=IR-O-U-0456&year=2025&category=Overall
 *
 * Returns URLs to available PDF and image files for this institute/year/category.
 * Files are looked up in:
 *   downloads/<year>/<category_slug>/pdf/<code>.pdf
 *   downloads/<year>/<category_slug>/image/<code>.png  (or .jpg)
 *
 * Response:
 * {
 *   pdf:   string | null   — URL to serve via /api/file/...
 *   image: string | null
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function categorySlug(category: string): string {
  // "Overall" → "overall", "State Public University" → "statepublicuniversity"
  return category.toLowerCase().replace(/\s+/g, "");
}

function findFile(dir: string, baseName: string, exts: string[]): string | null {
  for (const ext of exts) {
    const full = path.join(dir, `${baseName}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const code     = req.nextUrl.searchParams.get("code")     ?? "";
  const year     = req.nextUrl.searchParams.get("year")     ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? "";

  if (!code || !year || !category) {
    return NextResponse.json({ error: "code, year, and category are required" }, { status: 400 });
  }

  const slug = categorySlug(category);
  const base = path.join(process.cwd(), "downloads", year, slug);

  // PDF: downloads/<year>/<slug>/pdf/<code>.pdf
  const pdfDir  = path.join(base, "pdf");
  const imgDir  = path.join(base, "image");

  const pdfFile = findFile(pdfDir,  code, [".pdf"]);
  const imgFile = findFile(imgDir,  code, [".png", ".jpg", ".jpeg"]);

  // Build public URLs via /api/file/
  const pdfUrl  = pdfFile ? `/api/file/${year}/${slug}/pdf/${code}.pdf`  : null;
  const imgExt  = imgFile ? path.extname(imgFile) : null;
  const imgUrl  = imgFile ? `/api/file/${year}/${slug}/image/${code}${imgExt}` : null;

  return NextResponse.json({ pdf: pdfUrl, image: imgUrl });
}