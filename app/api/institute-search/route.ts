// /**
//  * GET /api/institute-search?q=<query>&limit=8
//  *
//  * Fast institute name/code search returning preview cards.
//  * Returns distinct institutes (not per-year rows).
//  */
// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
//   const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

//   if (q.length < 2) {
//     return NextResponse.json([]);
//   }

//   try {
//     // Search by name OR code, return best-scored row per institute
//     const rows = await query<{
//       institute_code: string;
//       institute_name: string;
//       category:       string;
//       best_year:      number;
//       img_total:      number | null;
//     }>(
//       `SELECT
//          institute_code,
//          institute_name,
//          -- pick the category with the highest score for this institute
//          FIRST(category ORDER BY img_total DESC NULLS LAST) AS category,
//          MAX(ranking_year) AS best_year,
//          MAX(img_total)    AS img_total
//        FROM nirf_scores
//        WHERE (
//          LOWER(institute_name) LIKE LOWER(?)
//          OR LOWER(institute_code) LIKE LOWER(?)
//        )
//        GROUP BY institute_code, institute_name
//        ORDER BY MAX(img_total) DESC NULLS LAST
//        LIMIT ?`,
//       [`%${q}%`, `%${q}%`, limit]
//     );

//     return NextResponse.json(rows);
//   } catch (err) {
//     console.error("[/api/institute-search]", err);
//     return NextResponse.json({ error: "Search failed" }, { status: 500 });
//   }
// }










/**
 * GET /api/institute-search?q=<query>&limit=8
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

  if (q.length < 2) return NextResponse.json([]);

  try {
    const rows = await query<{
      institute_code: string;
      institute_name: string;
      category:       string;
      best_year:      number;
      img_total:      number | null;
    }>(
      `SELECT
         institute_code,
         institute_name,
         FIRST(category ORDER BY img_total DESC NULLS LAST, ranking_year DESC) AS category,
         MAX(ranking_year)  AS best_year,
         MAX(img_total)     AS img_total
       FROM nirf_scores
       WHERE (
         LOWER(institute_name) LIKE LOWER(?)
         OR LOWER(institute_code) LIKE LOWER(?)
       )
       GROUP BY institute_code, institute_name
       ORDER BY MAX(img_total) DESC NULLS LAST, MAX(ranking_year) DESC
       LIMIT ?`,
      [`%${q}%`, `%${q}%`, limit]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[/api/institute-search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}