import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year") ?? "2025";
  const category = req.nextUrl.searchParams.get("category") ?? "Overall";
  const sortBy = req.nextUrl.searchParams.get("sortBy") ?? "nirf_rank";

  try {
    // Whitelist allowed sort columns to prevent SQL injection
    const ALLOWED_SORT = new Set([
      "nirf_rank",
      "nirf_score",
      "img_ss_score",
      "img_fsr_score",
      "img_fqe_score",
      "img_fru_score",
      "img_pu_score",
      "img_qp_score",
      "img_ipr_score",
      "img_fppp_score",
      "img_gue_score",
      "img_gphd_score",
      "img_rd_score",
      "img_wd_score",
      "img_escs_score",
      "img_pcs_score",
      "img_pr_score",
      "img_oemir_score",
      "img_pra_score",
      "img_gph_score",
      "img_gqe_score",
      "img_je_score",
      "img_ie_score",
      "img_gpg_score",
      "img_fpi_score",
      "img_jcr_score",
      "img_in_score",
      "img_gc_score",
      "img_sctc_score",
      "img_fpf_score",
      "img_gi_score",
      "img_fp_score",
      "img_inx_score",
      "img_tp_score",
      "img_sees_score",
      "img_sdg_score",
      "img_col4_score",
      "img_jex_score",
      "img_jx_score",
      "img_premp_score",
      "img_gphe_score",
      "img_ms_score",
      "img_gss_score",
      "img_col1_score",
      "img_oe_score",
      "img_col5_score",
      "img_col7_score",
    ]);
    const safeSort = ALLOWED_SORT.has(sortBy) ? sortBy : "nirf_rank";
    const sortDir = safeSort === "nirf_rank" ? "ASC" : "DESC";

    const rows = await query(
      `SELECT *
       FROM nirf_scores
       WHERE ranking_year = ? AND category = ?
         AND nirf_score IS NOT NULL
       ORDER BY ${safeSort} ${sortDir} NULLS LAST`,
      [year, category],
    );

    const meta = await query<{ ranking_year: number; category: string }>(
      `SELECT DISTINCT ranking_year, category 
       FROM nirf_scores 
       WHERE nirf_score IS NOT NULL
       ORDER BY ranking_year DESC, category`,
      [],
    );

    // Build per-year category map
    const yearCategoryMap: Record<number, string[]> = {};
    const CAT_ORDER_META: Record<string, number> = {
      Overall: 0,
      University: 1,
      Engineering: 2,
      Management: 3,
      Research: 4,
      Medical: 5,
      College: 6,
      Pharmacy: 7,
      Law: 8,
      Architecture: 9,
    };
    for (const row of meta) {
      const yr = Number(row.ranking_year);
      if (!yearCategoryMap[yr]) yearCategoryMap[yr] = [];
      if (row.category) yearCategoryMap[yr].push(row.category);
    }
    // Sort categories within each year
    for (const yr of Object.keys(yearCategoryMap)) {
      yearCategoryMap[Number(yr)].sort(
        (a, b) => (CAT_ORDER_META[a] ?? 99) - (CAT_ORDER_META[b] ?? 99),
      );
    }

    const years = [...new Set(meta.map((r) => Number(r.ranking_year)))];
    const CAT_ORDER: Record<string, number> = {
      Overall: 0,
      University: 1,
      Engineering: 2,
      Management: 3,
      Research: 4,
      Medical: 5,
      College: 6,
      Pharmacy: 7,
      Law: 8,
      Architecture: 9,
    };
    const categories = [...new Set(meta.map((r) => r.category))].sort(
      (a, b) => (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99),
    );

    // Categories for selected year only
    const categoriesForYear = yearCategoryMap[Number(year)] ?? [];

    // Find which parameter columns actually have data for this year+category
    const PARAM_COLS = [
      "img_ss_score",
      "img_fsr_score",
      "img_fqe_score",
      "img_fru_score",
      "img_pu_score",
      "img_qp_score",
      "img_ipr_score",
      "img_fppp_score",
      "img_gue_score",
      "img_gphd_score",
      "img_rd_score",
      "img_wd_score",
      "img_escs_score",
      "img_pcs_score",
      "img_pr_score",
      "img_oemir_score",
      "img_pra_score",
      "img_gph_score",
      "img_gqe_score",
      "img_je_score",
      "img_ie_score",
      "img_gpg_score",
      "img_fpi_score",
      "img_jcr_score",
      "img_in_score",
      "img_gc_score",
      "img_sctc_score",
      "img_fpf_score",
      "img_gi_score",
      "img_fp_score",
      "img_inx_score",
      "img_tp_score",
      "img_sees_score",
      "img_sdg_score",
      "img_col4_score",
      "img_jex_score",
      "img_jx_score",
      "img_premp_score",
      "img_gphe_score",
      "img_ms_score",
      "img_gss_score",
      "img_col1_score",
      "img_oe_score",
      "img_col5_score",
      "img_col7_score",
    ];

    const rowsArr = rows as Record<string, unknown>[];
    const availableParams = PARAM_COLS.filter((col) =>
      rowsArr.some((r) => r[col] != null && r[col] !== 0),
    );

    return NextResponse.json({
      rows,
      years,
      categories: categoriesForYear,
      yearCategoryMap,
      availableParams,
    });
  } catch (err) {
    console.error("[/api/rankings]", err);
    return NextResponse.json(
      { error: "Failed to load rankings" },
      { status: 500 },
    );
  }
}
