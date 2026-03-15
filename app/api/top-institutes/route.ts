/**
 * GET /api/top-institutes
 *
 * Returns the top N institutes by total NIRF score for a given year/category.
 * Sorted by img_total descending (NIRF overall score from image-data.xlsx).
 *
 * Query params:
 *   year       number   required
 *   category   string   required
 *   limit      number   optional, default 20, max 100
 *   scoreCol   string   optional, which img_*_total column to rank by
 *                       default: "img_total" (overall NIRF score)
 *
 * Response: InstituteScore[]
 * {
 *   institute_code: string
 *   institute_name: string
 *   category:       string
 *   ranking_year:   number
 *   rank:           number    (1-based position in result set)
 *   score:          number    (value of the chosen scoreCol)
 *   // plus all img_* and pdf_* columns
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const year      = Number(searchParams.get("year"));
  const category  = searchParams.get("category") ?? "";
  const limit     = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const scoreCol  = searchParams.get("scoreCol") ?? "img_total";

  if (!year || !category) {
    return NextResponse.json(
      { error: "year and category are required" },
      { status: 400 }
    );
  }

  // Validate scoreCol to prevent SQL injection (only allow alphanumeric + _)
  if (!/^[a-z0-9_]+$/.test(scoreCol)) {
    return NextResponse.json({ error: "Invalid scoreCol" }, { status: 400 });
  }

  try {
    // Dynamically select all columns from nirf_scores
    const rows = await query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY "${scoreCol}" DESC NULLS LAST) AS rank,
         *
       FROM nirf_scores
       WHERE ranking_year = ?
         AND category     = ?
         AND "${scoreCol}" IS NOT NULL
       ORDER BY "${scoreCol}" DESC NULLS LAST
       LIMIT ?`,
      [year, category, limit]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/top-institutes]", err);
    return NextResponse.json(
      { error: "Failed to load top institutes" },
      { status: 500 }
    );
  }
}