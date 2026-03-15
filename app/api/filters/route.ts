// /**
//  * GET /api/filter   (your existing route folder is "filter" not "filters")
//  *
//  * Returns distinct years, categories, sections for dashboard dropdowns.
//  * Also handles /api/filters via a redirect in next.config (see below),
//  * OR just update the UI fetch calls from "/api/filters" to "/api/filter".
//  */
// import { NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET() {
//   try {
//     const [years, categories, sections] = await Promise.all([
//       query<{ ranking_year: number }>(
//         `SELECT DISTINCT ranking_year
//          FROM nirf_scores
//          WHERE ranking_year IS NOT NULL
//          ORDER BY ranking_year DESC`
//       ),
//       query<{ category: string }>(
//         `SELECT DISTINCT category
//          FROM nirf_scores
//          WHERE category IS NOT NULL
//          ORDER BY category ASC`
//       ),
//       query<{ section: string }>(
//         `SELECT DISTINCT section
//          FROM nirf_raw
//          WHERE section IS NOT NULL
//          ORDER BY section ASC`
//       ),
//     ]);

//     return NextResponse.json({
//       years:      years.map((r) => r.ranking_year),
//       categories: categories.map((r) => r.category),
//       sections:   sections.map((r) => r.section),
//     });
//   } catch (err) {
//     console.error("[/api/filter]", err);
//     return NextResponse.json({ error: "Failed to load filters" }, { status: 500 });
//   }
// }










/**
 * app/api/filter/route.ts
 * Reads all filter options dynamically — including all score column names
 * so the UI can build dropdowns without hardcoding anything.
 */
import { NextResponse } from "next/server";
import { query, getMeta } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meta = getMeta();

    // If meta.json exists, use it (fast, no DuckDB query needed)
    if (meta.ranking_years.length > 0) {
      const sections = await query<{ section: string }>(
        `SELECT DISTINCT section FROM nirf_raw WHERE section IS NOT NULL ORDER BY section ASC`
      );
      return NextResponse.json({
        years:           meta.ranking_years,
        categories:      meta.categories,
        sections:        sections.map(r => r.section),
        image_columns:   meta.image_columns,
        score_columns:   meta.score_columns,
        pdf_agg_columns: meta.pdf_agg_columns,
      });
    }

    // Fallback: query DuckDB directly
    const [years, categories, sections] = await Promise.all([
      query<{ ranking_year: number }>(
        `SELECT DISTINCT ranking_year FROM nirf_scores WHERE ranking_year IS NOT NULL ORDER BY ranking_year DESC`
      ),
      query<{ category: string }>(
        `SELECT DISTINCT category FROM nirf_scores WHERE category IS NOT NULL ORDER BY category ASC`
      ),
      query<{ section: string }>(
        `SELECT DISTINCT section FROM nirf_raw WHERE section IS NOT NULL ORDER BY section ASC`
      ),
    ]);

    return NextResponse.json({
      years:           years.map(r => r.ranking_year),
      categories:      categories.map(r => r.category),
      sections:        sections.map(r => r.section),
      image_columns:   [],
      score_columns:   [],
      pdf_agg_columns: [],
    });
  } catch (err) {
    console.error("[/api/filter]", err);
    return NextResponse.json({ error: "Failed to load filters" }, { status: 500 });
  }
}