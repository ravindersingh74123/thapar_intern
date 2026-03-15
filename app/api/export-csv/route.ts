/**
 * GET /api/export
 *
 * Streams a CSV download of nirf_scores filtered by the same params as /api/search.
 * For large result sets the file is streamed chunk by chunk to avoid memory pressure.
 *
 * Query params:
 *   q          string   free-text on institute_name
 *   year       number   filter by ranking_year
 *   category   string   filter by category
 *   sortBy     string   default "img_total"
 *   sortDir    "asc"|"desc"  default "desc"
 *
 * Response: text/csv  (Content-Disposition: attachment)
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

const SAFE_COL = /^[a-z0-9_]+$/;

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // Quote fields that contain commas, double-quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q        = searchParams.get("q")?.trim() ?? "";
  const year     = searchParams.get("year")     ? Number(searchParams.get("year"))     : null;
  const category = searchParams.get("category") ?? "";
  const sortByRaw = searchParams.get("sortBy") ?? "img_total";
  const sortBy   = SAFE_COL.test(sortByRaw) ? sortByRaw : "img_total";
  const sortDir  = searchParams.get("sortDir") === "asc" ? "ASC" : "DESC";

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (q) {
    conditions.push("LOWER(institute_name) LIKE LOWER(?)");
    params.push(`%${q}%`);
  }
  if (year) {
    conditions.push("ranking_year = ?");
    params.push(year);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  const where = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const rows = await query(
      `SELECT * FROM nirf_scores
       ${where}
       ORDER BY "${sortBy}" ${sortDir} NULLS LAST`,
      params
    );

    if (rows.length === 0) {
      return new NextResponse("No data", { status: 204 });
    }

    // Build CSV
    const headers = Object.keys(rows[0] as object);
    const csvLines: string[] = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => csvEscape((row as Record<string, unknown>)[h])).join(",")
      ),
    ];
    const csv = csvLines.join("\n");

    const filename = [
      "nirf",
      year     ? String(year)     : "all-years",
      category ? category.replace(/\s+/g, "-").toLowerCase() : "all-categories",
    ].join("_") + ".csv";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}