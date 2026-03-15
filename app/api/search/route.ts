/**
 * GET /api/search
 *
 * Paginated, sortable, filterable table of institutes from nirf_scores.
 *
 * Query params:
 *   q          string   free-text search on institute_name (optional)
 *   year       number   filter by ranking_year (optional)
 *   category   string   filter by category (optional)
 *   sortBy     string   column to sort by, default "img_total"
 *   sortDir    "asc"|"desc"  default "desc"
 *   page       number   1-based, default 1
 *   pageSize   number   default 25, max 100
 *
 * Response:
 * {
 *   rows:       InstituteScore[]
 *   total:      number   total matching rows (for pagination)
 *   page:       number
 *   pageSize:   number
 *   totalPages: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "../lib/db";

export const dynamic = "force-dynamic";

// Columns that are safe to sort on (prevents SQL injection)
const SORTABLE_COLUMNS = new Set([
  "institute_name", "institute_code", "category", "ranking_year",
  "img_total", "img_ss_score", "img_fsr_score", "img_fqe_score",
  "img_fru_score", "img_oe_mir_score", "img_pu_score", "img_qp_score",
  "img_ipr_score", "img_fppp_score", "img_gue_score", "img_gphd_score",
  "img_rd_score", "img_wd_score", "img_escs_score", "img_pcs_score",
  "img_pr_score", "pdf_placement_placed", "pdf_median_salary",
  "pdf_phd_ft_graduated", "pdf_phd_pt_graduated",
  "pdf_sponsored_projects", "pdf_capital_expenditure",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q        = searchParams.get("q")?.trim() ?? "";
  const year     = searchParams.get("year")     ? Number(searchParams.get("year"))     : null;
  const category = searchParams.get("category") ?? "";
  const sortBy   = SORTABLE_COLUMNS.has(searchParams.get("sortBy") ?? "")
                     ? (searchParams.get("sortBy") as string)
                     : "img_total";
  const sortDir  = searchParams.get("sortDir") === "asc" ? "ASC" : "DESC";
  const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));
  const offset   = (page - 1) * pageSize;

  // Build WHERE clauses dynamically
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
    const [countResult, rows] = await Promise.all([
      queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM nirf_scores ${where}`,
        params
      ),
      query(
        `SELECT * FROM nirf_scores
         ${where}
         ORDER BY "${sortBy}" ${sortDir} NULLS LAST
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

   const total = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({ rows, total, page, pageSize, totalPages });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}