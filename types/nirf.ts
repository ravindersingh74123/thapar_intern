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
  img_total:        "NIRF Total Score",
  img_ss_score:     "SS (Student Strength)",
  img_fsr_score:    "FSR (Faculty-Student Ratio)",
  img_fqe_score:    "FQE (Faculty Qualification & Experience)",
  img_fru_score:    "FRU (Financial Resources Utilization)",
  img_oe_mir_score: "OE/MIR (Outreach & Equity Metric)",
  img_oemir_score:  "OEMIR (Outreach & Equity Metric Intl + Regional)",
  img_pu_score:     "PU (Perception University)",
  img_qp_score:     "QP (Quality Publication)",
  img_ipr_score:    "IPR (Intellectual Property Rights / Patents)",
  img_fppp_score:   "FPPP (Footprint of Projects & Professional Practice)",
  img_gue_score:    "GUE (Graduation Outcome — UG Employment)",
  img_gphd_score:   "GPHD (Graduation Outcome — PhD Students)",
  img_rd_score:     "RD (Regional Diversity)",
  img_wd_score:     "WD (Women Diversity)",
  img_escs_score:   "ESCS (Economically Challenged Students)",
  img_pcs_score:    "PCS (Physically Challenged Students)",
  img_pr_score:     "PR (Perception Score)",
  img_pra_score:    "PRA (Publications — Research Articles)",
  img_gph_score:    "GPH (Publications in High Impact Journals)",
  img_gqe_score:    "GQE (Quality of Publications)",
  img_gpg_score:    "GPG (Publications per Faculty)",
  img_fpi_score:    "FPI (Faculty with PhD Index)",
  img_jcr_score:    "JCR (Journal Citation Reports)",
  img_in_score:     "IN (Impact Normalized Citations)",
  img_gc_score:     "GC (Global Citations)",
  img_sctc_score:   "SCTC (Scopus Citation Count)",
  img_fpf_score:    "FPF (Faculty Publication Productivity)",
  img_gi_score:     "GI (Global Impact)",
  img_fp_score:     "FP (Faculty Publications)",
  img_inx_score:    "INX (Indexed Publications)",
  img_tp_score:     "TP (Teaching Performance)",
  img_sees_score:   "SEES (Social/Environmental Engagement Score)",
  img_sdg_score:    "SDG (Sustainable Development Goals Contribution)",
  img_col1_score:   "COL1 (Research Collaboration Metric 1)",
  img_col4_score:   "COL4 (Collaboration Metric 4)",
  img_col5_score:   "COL5 (Collaboration Metric 5)",
  img_col7_score:   "COL7 (Collaboration Metric 7)",
  img_jex_score:    "JEX (Joint Exchange Programs)",
  img_jx_score:     "JX (Joint Research/Exchange)",
  img_ie_score:     "IE (International Engagement)",
  img_je_score:     "JE (Joint Publications)",
  img_premp_score:  "PREMP (Pre-Employment Score)",
  img_gphe_score:   "GPHE (Global Perception — Higher Education)",
  img_ms_score:     "MS (Median Salary)",
  img_gss_score:    "GSS (Graduate Student Strength)",
  img_oe_score:     "OE (Overall Employment Outcome)",
  // PDF aggregates
  pdf_placement_placed:        "Students Placed",
  pdf_placement_higher:        "Higher Studies",
  pdf_median_salary:           "Median Salary",
  pdf_phd_ft_total:            "PhD Students (Full Time)",
  pdf_phd_pt_total:            "PhD Students (Part Time)",
  pdf_phd_ft_graduated:        "PhD Graduated FT (3yr)",
  pdf_phd_pt_graduated:        "PhD Graduated PT (3yr)",
  pdf_sponsored_projects:      "Sponsored Projects (3yr)",
  pdf_sponsored_amount:        "Sponsored Amount (3yr)",
  pdf_consultancy_projects:    "Consultancy Projects (3yr)",
  pdf_consultancy_amount:      "Consultancy Amount (3yr)",
  pdf_capital_expenditure:     "Capital Expenditure (3yr)",
  pdf_operational_expenditure: "Operational Expenditure (3yr)",
  pdf_total_intake:            "Total Intake",
  pdf_edp_participants:        "EDP Participants (3yr)",
};