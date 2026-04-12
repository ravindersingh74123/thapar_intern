import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const year     = req.nextUrl.searchParams.get("year") ?? "2025";
  const category = req.nextUrl.searchParams.get("category") ?? "Overall";

  try {
    const rows = await query(
      `SELECT institute_code, institute_name, category, ranking_year,
              nirf_score, nirf_rank
       FROM nirf_scores
       WHERE ranking_year = ? AND category = ?
         AND nirf_score IS NOT NULL
       ORDER BY nirf_rank ASC NULLS LAST, nirf_score DESC`,
      [year, category]
    );

    const meta = await query<{ ranking_year: number; category: string }>(
      `SELECT DISTINCT ranking_year, category 
       FROM nirf_scores 
       WHERE nirf_score IS NOT NULL
       ORDER BY ranking_year DESC, category`,
      []
    );

    // Build per-year category map
    const yearCategoryMap: Record<number, string[]> = {};
    const CAT_ORDER_META: Record<string, number> = {
      Overall: 0, University: 1, Engineering: 2, Management: 3,
      Research: 4, Medical: 5, College: 6, Pharmacy: 7, Law: 8, Architecture: 9,
    };
    for (const row of meta) {
      const yr = Number(row.ranking_year);
      if (!yearCategoryMap[yr]) yearCategoryMap[yr] = [];
      if (row.category) yearCategoryMap[yr].push(row.category);
    }
    // Sort categories within each year
    for (const yr of Object.keys(yearCategoryMap)) {
      yearCategoryMap[Number(yr)].sort(
        (a, b) => (CAT_ORDER_META[a] ?? 99) - (CAT_ORDER_META[b] ?? 99)
      );
    }

    const years      = [...new Set(meta.map(r => Number(r.ranking_year)))];
    const CAT_ORDER: Record<string, number> = {
      Overall: 0, University: 1, Engineering: 2, Management: 3,
      Research: 4, Medical: 5, College: 6, Pharmacy: 7, Law: 8, Architecture: 9,
    };
    const categories = [...new Set(meta.map(r => r.category))].sort(
      (a, b) => (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99)
    );

    // Categories for selected year only
    const categoriesForYear = yearCategoryMap[Number(year)] ?? [];

    return NextResponse.json({ rows, years, categories: categoriesForYear, yearCategoryMap });
  } catch (err) {
    console.error("[/api/rankings]", err);
    return NextResponse.json({ error: "Failed to load rankings" }, { status: 500 });
  }
}