/**
 * GET /api/category-distribution
 *
 * Returns institute count and average total score per category for a given year.
 * Used by the CategoryPieChart / bar chart on the dashboard overview.
 *
 * Query params:
 *   year   number   required
 *
 * Response:
 * {
 *   category:       string
 *   institute_count: number
 *   avg_total:      number | null
 * }[]
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));

  if (!year) {
    return NextResponse.json({ error: "year is required" }, { status: 400 });
  }

  try {
    const rows = await query<{
      category:        string;
      institute_count: number;
      avg_total:       number | null;
    }>(
      `SELECT
         category,
         COUNT(DISTINCT institute_code) AS institute_count,
         ROUND(AVG(img_total), 2)       AS avg_total
       FROM nirf_scores
       WHERE ranking_year = ?
         AND category IS NOT NULL
       GROUP BY category
       ORDER BY institute_count DESC`,
      [year]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/category-distribution]", err);
    return NextResponse.json(
      { error: "Failed to load category distribution" },
      { status: 500 }
    );
  }
}