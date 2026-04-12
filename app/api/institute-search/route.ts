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










// /**
//  * GET /api/institute-search?q=<query>&limit=8
//  */
// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
//   const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

//   if (q.length < 2) return NextResponse.json([]);

//   try {
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
//          FIRST(category ORDER BY img_total DESC NULLS LAST, ranking_year DESC) AS category,
//          MAX(ranking_year)  AS best_year,
//          MAX(img_total)     AS img_total
//        FROM nirf_scores
//        WHERE (
//          LOWER(institute_name) LIKE LOWER(?)
//          OR LOWER(institute_code) LIKE LOWER(?)
//        )
//        GROUP BY institute_code, institute_name
//        ORDER BY MAX(img_total) DESC NULLS LAST, MAX(ranking_year) DESC
//        LIMIT ?`,
//       [`%${q}%`, `%${q}%`, limit]
//     );

//     return NextResponse.json(rows);
//   } catch (err) {
//     console.error("[/api/institute-search]", err);
//     return NextResponse.json({ error: "Search failed" }, { status: 500 });
//   }
// }













// /**
//  * GET /api/institute-search?q=<query>&limit=15
//  *
//  * Returns one result per (institute_code, category) combination.
//  * Score shown is the LATEST year's img_total for that institute+category
//  * (not a sum or max across years — that was causing inflated scores like 426).
//  *
//  * Results are ordered by img_total DESC so highest-ranked variants appear first.
//  */
// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
//   const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "15"), 40);

//   if (q.length < 2) return NextResponse.json([]);

//   try {
//     const rows = await query<{
//       institute_code: string;
//       institute_name: string;
//       category:       string;
//       best_year:      number;
//       img_total:      number | null;
//     }>(
//       `WITH latest AS (
//          -- For each (institute_code, category), find the most recent ranking_year
//          SELECT
//            institute_code,
//            institute_name,
//            category,
//            MAX(ranking_year) AS best_year
//          FROM nirf_scores
//          WHERE (
//            LOWER(institute_name) LIKE LOWER(?)
//            OR LOWER(institute_code) LIKE LOWER(?)
//          )
//          AND category IS NOT NULL
//          GROUP BY institute_code, institute_name, category
//        )
//        SELECT
//          l.institute_code,
//          l.institute_name,
//          l.category,
//          l.best_year,
//          s.img_total
//        FROM latest l
//        JOIN nirf_scores s
//          ON  s.institute_code = l.institute_code
//          AND s.category       = l.category
//          AND s.ranking_year   = l.best_year
//        ORDER BY s.img_total DESC NULLS LAST
//        LIMIT ?`,
//       [`%${q}%`, `%${q}%`, limit]
//     );

//     return NextResponse.json(rows);
//   } catch (err) {
//     console.error("[/api/institute-search]", err);
//     return NextResponse.json({ error: "Search failed" }, { status: 500 });
//   }
// }






























// /**
//  * GET /api/institute-search?q=<query>&limit=15
//  *
//  * Returns one result per (institute_code, category) combination.
//  * Score shown is the LATEST year's img_total for that institute+category
//  * (not a sum or max across years — that was causing inflated scores like 426).
//  *
//  * Results are ordered by img_total DESC so highest-ranked variants appear first.
//  */
// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
//   const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "15"), 40);

//   if (q.length < 2) return NextResponse.json([]);

//   // app/api/institute-search/route.ts

// // ... (imports and dynamic config)

//   try {
//     const rows = await query<{
//       institute_code: string;
//       institute_name: string;
//       category:       string;
//       best_year:      number;
//       img_total:      number | null;
//     }>(
//       `WITH matched_codes AS (
//           -- Step 1: Find all CODES that match the name search in ANY year
//           SELECT DISTINCT institute_code
//           FROM nirf_scores
//           WHERE LOWER(institute_name) LIKE LOWER(?)
//              OR LOWER(institute_code) LIKE LOWER(?)
//        ),
//        latest AS (
//           -- Step 2: For those codes, find the latest year per category
//           SELECT
//             s.institute_code,
//             s.category,
//             MAX(s.ranking_year) AS best_year
//           FROM nirf_scores s
//           JOIN matched_codes m ON s.institute_code = m.institute_code
//           WHERE s.category IS NOT NULL
//           GROUP BY s.institute_code, s.category
//        )
//        SELECT
//          l.institute_code,
//          -- Step 3: Pick the most common/latest name for this code
//          MAX(s.institute_name) AS institute_name, 
//          l.category,
//          l.best_year,
//          MAX(s.img_total) AS img_total
//        FROM latest l
//        JOIN nirf_scores s
//          ON  s.institute_code = l.institute_code
//          AND s.category       = l.category
//          AND s.ranking_year   = l.best_year
//        GROUP BY l.institute_code, l.category, l.best_year
//        ORDER BY img_total DESC NULLS LAST
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
 *
 * Groups results by institute_name so "Indian Institute of Science"
 * appears ONCE, carrying all its codes and categories.
 *
 * Response:
 * {
 *   institute_name: string
 *   entries: {
 *     institute_code: string
 *     category: string
 *     best_year: number
 *     img_total: number | null
 *   }[]
 *   best_score: number | null   // highest img_total across all entries
 * }[]
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

  if (q.length < 2) return NextResponse.json([]);

  try {
    // Get all code+category combos for matching institutes
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
      [`%${q}%`, `%${q}%`, limit * 6]   // fetch more to group
    );

    // Group by institute_name
    const nameMap = new Map<string, {
      institute_name: string;
      entries: { institute_code: string; category: string; best_year: number; img_total: number | null }[];
      best_score: number | null;
    }>();

    for (const row of rows) {
      const name = row.institute_name;
      if (!nameMap.has(name)) {
        nameMap.set(name, { institute_name: name, entries: [], best_score: null });
      }
      const group = nameMap.get(name)!;
      group.entries.push({
        institute_code: row.institute_code,
        category:       row.category,
        best_year:      row.best_year,
        img_total:      row.img_total,
      });
      if (row.img_total != null && (group.best_score == null || row.img_total > group.best_score)) {
        group.best_score = row.img_total;
      }
    }

    // Sort groups by best_score desc, then return top `limit` groups
    const grouped = Array.from(nameMap.values())
      .sort((a, b) => (b.best_score ?? 0) - (a.best_score ?? 0))
      .slice(0, limit);

    // Sort entries within each group: Overall first, then alphabetical
    const CAT_ORDER: Record<string, number> = {
      "Overall": 0, "University": 1, "Engineering": 2,
      "Management": 3, "Research": 4, "Medical": 5,
      "College": 6, "Pharmacy": 7, "Law": 8, "Architecture": 9,
    };
    for (const g of grouped) {
      g.entries.sort((a, b) => {
        const ao = CAT_ORDER[a.category] ?? 99;
        const bo = CAT_ORDER[b.category] ?? 99;
        return ao !== bo ? ao - bo : (a.category ?? "").localeCompare(b.category ?? "");
      });
    }

    return NextResponse.json(grouped);
  } catch (err) {
    console.error("[/api/institute-search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}


















