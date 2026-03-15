/**
 * types/nirf.ts
 * Shared TypeScript types for the NIRF dashboard.
 * These match the shape of API responses from the route handlers.
 */

// ── Core identity ─────────────────────────────────────────────────────────────

export interface InstituteIdentity {
  institute_code: string;
  institute_name: string;
  category:       string;
  ranking_year:   number;
}

// ── Image scorecard columns (from image-data.xlsx) ────────────────────────────

export interface ImageScores {
  img_total?:         number | null;  // overall NIRF score
  img_ss_score?:      number | null;
  img_ss_total?:      number | null;
  img_fsr_score?:     number | null;
  img_fsr_total?:     number | null;
  img_fqe_score?:     number | null;
  img_fqe_total?:     number | null;
  img_fru_score?:     number | null;
  img_fru_total?:     number | null;
  img_oe_mir_score?:  number | null;
  img_oe_mir_total?:  number | null;
  img_pu_score?:      number | null;
  img_pu_total?:      number | null;
  img_qp_score?:      number | null;
  img_qp_total?:      number | null;
  img_ipr_score?:     number | null;
  img_ipr_total?:     number | null;
  img_fppp_score?:    number | null;
  img_fppp_total?:    number | null;
  img_gue_score?:     number | null;
  img_gue_total?:     number | null;
  img_gphd_score?:    number | null;
  img_gphd_total?:    number | null;
  img_rd_score?:      number | null;
  img_rd_total?:      number | null;
  img_wd_score?:      number | null;
  img_wd_total?:      number | null;
  img_escs_score?:    number | null;
  img_escs_total?:    number | null;
  img_pcs_score?:     number | null;
  img_pcs_total?:     number | null;
  img_pr_score?:      number | null;
  img_pr_total?:      number | null;
}

// ── PDF aggregate columns (from nirf-pdf-data.csv) ────────────────────────────

export interface PdfAggregates {
  pdf_total_intake?:            number | null;
  pdf_placement_placed?:        number | null;
  pdf_placement_higher?:        number | null;
  pdf_median_salary?:           number | null;
  pdf_phd_ft_total?:            number | null;
  pdf_phd_pt_total?:            number | null;
  pdf_phd_ft_graduated?:        number | null;
  pdf_phd_pt_graduated?:        number | null;
  pdf_sponsored_projects?:      number | null;
  pdf_sponsored_amount?:        number | null;
  pdf_consultancy_projects?:    number | null;
  pdf_consultancy_amount?:      number | null;
  pdf_edp_participants?:        number | null;
  pdf_capital_expenditure?:     number | null;
  pdf_operational_expenditure?: number | null;
}

// ── Combined score row ────────────────────────────────────────────────────────

export type InstituteScore = InstituteIdentity & ImageScores & PdfAggregates & {
  rank?: number;  // added by /api/top-institutes
  [key: string]: unknown;
};

// ── API response shapes ───────────────────────────────────────────────────────

export interface FiltersResponse {
  years:      number[];
  categories: string[];
  sections:   string[];
}

export interface TrendPoint {
  year:  number;
  value: number | null;
}

export interface TrendSeries {
  institute_code: string;
  institute_name: string;
  data:           TrendPoint[];
}

export interface TrendsResponse {
  series: TrendSeries[];
  years:  number[];
}

export interface SearchResponse {
  rows:       InstituteScore[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface CategoryDistribution {
  category:         string;
  institute_count:  number;
  avg_total:        number | null;
}

export interface InstituteProfileResponse {
  institute_code: string;
  institute_name: string;
  categories:     string[];
  scoresByYear:   Record<number, InstituteScore>;
  rawSections: {
    section: string;
    metrics: {
      metric:       string;
      year:         string;
      value:        string;
      ranking_year: number;
      program:      string;
    }[];
  }[];
}

// ── Utility: score column label map ──────────────────────────────────────────

export const SCORE_LABELS: Record<string, string> = {
  img_total:          "NIRF Total Score",
  img_ss_score:       "Student Strength",
  img_fsr_score:      "Faculty-Student Ratio",
  img_fqe_score:      "Faculty Qualification",
  img_fru_score:      "Financial Resources",
  img_oe_mir_score:   "Outreach & Inclusivity",
  img_pu_score:       "Publications",
  img_qp_score:       "Quality of Publications",
  img_ipr_score:      "IPR & Patents",
  img_fppp_score:     "Projects & Practice",
  img_gue_score:      "Graduation (UE)",
  img_gphd_score:     "Graduation (PhD)",
  img_rd_score:       "Rank Diversity",
  img_wd_score:       "Women Diversity",
  img_escs_score:     "Econ. Challenged Students",
  img_pcs_score:      "Physically Challenged",
  img_pr_score:       "Perception",
  pdf_placement_placed:   "Students Placed",
  pdf_median_salary:      "Median Salary",
  pdf_phd_ft_graduated:   "PhD Graduates (FT)",
  pdf_sponsored_projects: "Sponsored Projects",
  pdf_capital_expenditure:"Capital Expenditure",
};