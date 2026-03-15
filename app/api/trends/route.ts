/**
 * GET /api/trends
 *
 * Returns year-over-year score trends for one or more institutes.
 *
 * Query params:
 *   codes      string   required — comma-separated institute codes
 *                       e.g. "IR-O-U-0456,IR-O-U-0560"
 *   category   string   required
 *   scoreCol   string   optional, default "img_total"
 *
 * Response:
 * {
 *   series: {
 *     institute_code: string
 *     institute_name: string
 *     data: { year: number; value: number | null }[]
 *   }[]
 *   years: number[]   sorted ascending — use as X-axis ticks
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const codesRaw = searchParams.get("codes") ?? "";
  const category = searchParams.get("category") ?? "";
  const scoreCol = searchParams.get("scoreCol") ?? "img_total";

  if (!codesRaw || !category) {
    return NextResponse.json(
      { error: "codes and category are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]+$/.test(scoreCol)) {
    return NextResponse.json({ error: "Invalid scoreCol" }, { status: 400 });
  }

  const codes = codesRaw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 20); // max 20 institutes per trend query

  if (codes.length === 0) {
    return NextResponse.json({ error: "No valid institute codes" }, { status: 400 });
  }

  // Build parameterised IN list
  const placeholders = codes.map(() => "?").join(", ");

  try {
    const rows = await query<{
      institute_code: string;
      institute_name: string;
      ranking_year:   number;
      value:          number | null;
    }>(
      `SELECT
         institute_code,
         institute_name,
         ranking_year,
         "${scoreCol}" AS value
       FROM nirf_scores
       WHERE category       = ?
         AND institute_code IN (${placeholders})
       ORDER BY institute_code, ranking_year ASC`,
      [category, ...codes]
    );

    // Pivot into series grouped by institute
    const seriesMap = new Map<
      string,
      { institute_code: string; institute_name: string; data: { year: number; value: number | null }[] }
    >();

    const yearSet = new Set<number>();

    for (const row of rows) {
      yearSet.add(row.ranking_year);

      if (!seriesMap.has(row.institute_code)) {
        seriesMap.set(row.institute_code, {
          institute_code: row.institute_code,
          institute_name: row.institute_name,
          data: [],
        });
      }

      seriesMap.get(row.institute_code)!.data.push({
        year:  row.ranking_year,
        value: row.value,
      });
    }

    const years  = Array.from(yearSet).sort((a, b) => a - b);
    const series = Array.from(seriesMap.values());

    return NextResponse.json({ series, years });
  } catch (err) {
    console.error("[/api/trends]", err);
    return NextResponse.json(
      { error: "Failed to load trend data" },
      { status: 500 }
    );
  }
}