# #!/usr/bin/env python3
# """
# nirf_etl.py  —  NIRF multi-source ETL pipeline
# ================================================
# Reads two complementary data sources produced by the Next.js downloader:

#   Source A: downloads/<year>/nirf-pdf-data.csv
#             Long-format institutional data (placement, PhD, expenditure, ...)
#             Columns: Ranking Year | Category | Institute Code | Institute Name |
#                      Section | Program | Year | Metric | Value

#   Source B: downloads/<year>/image-data.xlsx
#             Wide-format NIRF scorecard data (SS, FSR, FQE, ... scores + totals)
#             Columns: Year | Category | Institute Name | Institute Code |
#                      <metric> Score | <metric> Total | ...

# Outputs (written to ./public/data/ by default):
#   nirf_raw.parquet        long-format PDF data, all rows
#   nirf_scores.parquet     one row per institute/year/category with ALL score
#                           columns from image-data + key aggregates from PDF data
#   nirf_meta.json          years, categories, score columns — used by dashboard

# Usage:
#     python nirf_etl.py
#     python nirf_etl.py --input ./downloads --output ./public/data

# Requirements:
#     pip install pandas pyarrow openpyxl tqdm
# """

# import argparse
# import json
# import sys
# from pathlib import Path

# # ── Dependency check ──────────────────────────────────────────────────────────

# def check_deps():
#     missing = []
#     for pkg in ["pandas", "pyarrow", "openpyxl", "tqdm"]:
#         try:
#             __import__(pkg)
#         except ImportError:
#             missing.append(pkg)
#     if missing:
#         print(f"[ETL] Missing packages: {', '.join(missing)}")
#         print(f"[ETL] Run:  pip install {' '.join(missing)}")
#         sys.exit(1)

# check_deps()

# import pandas as pd
# from tqdm import tqdm

# # ── Column name constants ─────────────────────────────────────────────────────

# PDF_COLUMNS = [
#     "ranking_year", "category", "institute_code", "institute_name",
#     "section", "program", "year", "metric", "value",
# ]

# JOIN_KEY = ["ranking_year", "category", "institute_code", "institute_name"]

# # ── Helpers ───────────────────────────────────────────────────────────────────

# def normalise_str(s: pd.Series) -> pd.Series:
#     return s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

# def to_numeric(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce")

# def to_int(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce").astype("Int64")

# def norm_col(name: str) -> str:
#     """Normalise a column name to snake_case."""
#     import re
#     return re.sub(r"[^a-z0-9_]", "", 
#         name.strip().lower()
#             .replace(" ", "_").replace("-", "_")
#             .replace("(", "").replace(")", "")
#             .replace("/", "_")
#     )

# def valid_institute_code(s: pd.Series) -> pd.Series:
#     return s.str.match(r"^IR-[A-Z]-[A-Z]-\d+$", na=False)

# def divider(label: str) -> str:
#     return f"\n{'─'*60}\n  {label}\n{'─'*60}"

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE A  —  nirf-pdf-data.csv
# # ─────────────────────────────────────────────────────────────────────────────

# def find_pdf_csvs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("nirf-pdf-data.csv"))

# def load_one_pdf_csv(path: Path) -> pd.DataFrame:
#     try:
#         df = pd.read_csv(
#             path, dtype=str,
#             na_values=["", "N/A", "NA", "null", "NULL", "-"],
#             keep_default_na=True,
#             encoding="utf-8",
#             on_bad_lines="skip",
#         )
#     except Exception as e:
#         print(f"  [WARN] Cannot read {path}: {e}")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     df.columns = [norm_col(c) for c in df.columns]

#     for col in PDF_COLUMNS:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df = df[PDF_COLUMNS].copy()

#     for col in ["category", "institute_code", "institute_name",
#                 "section", "program", "metric", "value", "year"]:
#         df[col] = normalise_str(df[col])

#     df["ranking_year"]   = to_int(df["ranking_year"])
#     df["category"]       = df["category"].str.title()
#     df["institute_name"] = (
#         df["institute_name"]
#         .str.replace(r"^[^A-Za-z]+", "", regex=True)
#         .str.strip()
#     )
#     df["value"] = df["value"].str.replace(",", "", regex=False)
#     df = df[valid_institute_code(df["institute_code"])]
#     return df

# def load_all_pdf_csvs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No nirf-pdf-data.csv files found — skipping PDF source.")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     frames = []
#     for f in tqdm(files, unit="csv", desc="  PDF CSVs"):
#         df = load_one_pdf_csv(f)
#         frames.append(df)
#         tqdm.write(f"    {f.parent.name}/nirf-pdf-data.csv  →  {len(df):,} rows")

#     combined = pd.concat(frames, ignore_index=True)
#     before = len(combined)
#     combined = combined.drop_duplicates()
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE B  —  image-data.xlsx
# # ─────────────────────────────────────────────────────────────────────────────

# def find_image_xlsxs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("image-data.xlsx"))

# def load_one_image_xlsx(path: Path) -> pd.DataFrame:
#     try:
#         df = pd.read_excel(path, dtype=str, engine="openpyxl")
#     except Exception as e:
#         print(f"  [WARN] Cannot read {path}: {e}")
#         return pd.DataFrame()

#     df.columns = [norm_col(c) for c in df.columns]

#     # Map flexible column names → canonical names
#     rename_map = {}
#     for col in df.columns:
#         if col in ("year", "ranking_year"):
#             rename_map[col] = "ranking_year"
#         elif col == "institutename":
#             rename_map[col] = "institute_name"
#         elif col == "institutecode":
#             rename_map[col] = "institute_code"

#     df = df.rename(columns=rename_map)

#     for col in ["ranking_year", "category", "institute_code", "institute_name"]:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df["ranking_year"]   = to_int(df["ranking_year"])
#     df["category"]       = normalise_str(df["category"]).str.title()
#     df["institute_code"] = normalise_str(df["institute_code"])
#     df["institute_name"] = (
#         normalise_str(df["institute_name"])
#         .str.replace(r"^[^A-Za-z]+", "", regex=True)
#         .str.strip()
#     )

#     df = df[valid_institute_code(df["institute_code"])]

#     # Coerce all score/total columns to numeric
#     non_id = [c for c in df.columns if c not in JOIN_KEY]
#     for col in non_id:
#         df[col] = to_numeric(
#             df[col].astype(str).str.replace(",", "", regex=False)
#         )

#     return df

# def load_all_image_xlsxs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No image-data.xlsx files found — skipping image source.")
#         return pd.DataFrame()

#     frames = []
#     for f in tqdm(files, unit="xlsx", desc="  Image XLSXs"):
#         df = load_one_image_xlsx(f)
#         frames.append(df)
#         tqdm.write(f"    {f.parent.name}/image-data.xlsx  →  {len(df):,} rows")

#     combined = pd.concat(frames, ignore_index=True)
#     before = len(combined)
#     combined = combined.drop_duplicates(
#         subset=["ranking_year", "category", "institute_code"]
#     )
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # PDF AGGREGATION
# # ─────────────────────────────────────────────────────────────────────────────

# def aggregate_pdf(df_pdf: pd.DataFrame) -> pd.DataFrame:
#     """Roll up long-format PDF data into one row per JOIN_KEY."""
#     if df_pdf.empty:
#         return pd.DataFrame(columns=JOIN_KEY)

#     print("  Aggregating PDF data into wide format...")
#     num = df_pdf.copy()
#     num["v"] = to_numeric(num["value"])
#     num = num[num["v"].notna()]

#     def agg(section_kw: str, metric_kw: str, fn: str = "sum") -> pd.Series:
#         mask = (
#             num["section"].str.contains(section_kw, case=False, na=False)
#             & num["metric"].str.contains(metric_kw, case=False, na=False)
#         )
#         g = num[mask].groupby(JOIN_KEY)["v"]
#         return getattr(g, fn)()

#     aggregates = {
#         # Intake & students
#         "pdf_total_intake":            agg("Sanctioned", "Intake"),
#         # Placement
#         "pdf_placement_placed":        agg("Placement", r"No\. of students placed"),
#         "pdf_placement_higher":        agg("Placement", r"Higher Stud"),
#         "pdf_median_salary":           agg("Placement", r"[Mm]edian salary", "mean"),
#         # PhD
#         "pdf_phd_ft_total":            agg(r"Ph\.D", r"Full Time Students"),
#         "pdf_phd_pt_total":            agg(r"Ph\.D", r"Part Time Students"),
#         "pdf_phd_ft_graduated":        agg(r"Ph\.D", r"Full Time Graduated"),
#         "pdf_phd_pt_graduated":        agg(r"Ph\.D", r"Part Time Graduated"),
#         # Research & consultancy
#         "pdf_sponsored_projects":      agg("Sponsored Research", r"Sponsored Projects"),
#         "pdf_sponsored_amount":        agg("Sponsored Research", r"[Aa]mount"),
#         "pdf_consultancy_projects":    agg("Consultancy", r"Consultancy Projects"),
#         "pdf_consultancy_amount":      agg("Consultancy", r"[Aa]mount"),
#         # EDP
#         "pdf_edp_participants":        agg("Executive Development", r"[Pp]articipants"),
#         # Expenditure
#         "pdf_capital_expenditure":     agg("Capital expenditure", r"Utilised Amount$"),
#         "pdf_operational_expenditure": agg("Operational expenditure", r"Utilised Amount$"),
#     }

#     base = (
#         df_pdf[JOIN_KEY]
#         .drop_duplicates()
#         .dropna(subset=["ranking_year", "institute_code"])
#     )
#     result = base.set_index(JOIN_KEY)
#     for col_name, series in aggregates.items():
#         result[col_name] = series
#     result = result.reset_index()
#     result["ranking_year"] = to_int(result["ranking_year"])

#     float_cols = result.select_dtypes("float64").columns
#     result[float_cols] = result[float_cols].round(2)

#     print(f"  PDF aggregates: {len(result):,} rows × {len(result.columns)} columns")
#     return result

# # ─────────────────────────────────────────────────────────────────────────────
# # MERGE
# # ─────────────────────────────────────────────────────────────────────────────

# def merge_sources(df_image: pd.DataFrame, df_pdf_agg: pd.DataFrame) -> pd.DataFrame:
#     """
#     Outer-join image scorecard + PDF aggregates on JOIN_KEY.
#     Image score/total columns get an 'img_' prefix to avoid collisions.
#     """
#     if not df_image.empty:
#         score_cols = [c for c in df_image.columns if c not in JOIN_KEY]
#         df_image = df_image.rename(columns={c: f"img_{c}" for c in score_cols})

#     if df_image.empty and df_pdf_agg.empty:
#         return pd.DataFrame(columns=JOIN_KEY)
#     if df_image.empty:
#         return df_pdf_agg.copy()
#     if df_pdf_agg.empty:
#         return df_image.copy()

#     merged = pd.merge(df_image, df_pdf_agg, on=JOIN_KEY, how="outer")
#     merged["ranking_year"] = to_int(merged["ranking_year"])
#     merged = merged.sort_values(
#         ["ranking_year", "category", "institute_code"],
#         ascending=[False, True, True],
#         na_position="last",
#     ).reset_index(drop=True)
#     return merged

# # ─────────────────────────────────────────────────────────────────────────────
# # OUTPUT
# # ─────────────────────────────────────────────────────────────────────────────

# def write_parquet(df: pd.DataFrame, path: Path, label: str) -> None:
#     df.to_parquet(path, engine="pyarrow", compression="snappy", index=False)
#     size_mb = path.stat().st_size / 1_048_576
#     print(f"  ✓  {label}  →  {len(df):,} rows × {len(df.columns)} cols  ({size_mb:.1f} MB)")

# def write_metadata(df_raw: pd.DataFrame, df_scores: pd.DataFrame, output_dir: Path) -> None:
#     years = sorted([int(y) for y in df_raw["ranking_year"].dropna().unique()]) \
#             if not df_raw.empty else []
#     cats  = sorted(df_raw["category"].dropna().unique().tolist()) \
#             if not df_raw.empty else []
#     sections = sorted(df_raw["section"].dropna().unique().tolist()) \
#                if "section" in df_raw.columns else []

#     img_score_cols = [c for c in df_scores.columns
#                       if c.startswith("img_") and c.endswith("_score")]
#     img_total_cols = [c for c in df_scores.columns
#                       if c.startswith("img_") and c.endswith("_total")]
#     pdf_agg_cols   = [c for c in df_scores.columns if c.startswith("pdf_")]

#     # Human-readable label mapping for the dashboard
#     def make_label(col: str) -> str:
#         return (col
#                 .replace("img_", "").replace("pdf_", "")
#                 .replace("_score", " Score").replace("_total", " Total")
#                 .replace("_", " ").title())

#     meta = {
#         "ranking_years":      years,
#         "categories":         cats,
#         "sections":           sections,
#         "total_raw_rows":     int(len(df_raw)),
#         "total_institutes":   int(df_raw["institute_code"].nunique()) \
#                               if not df_raw.empty else 0,
#         "img_score_columns":  img_score_cols,
#         "img_total_columns":  img_total_cols,
#         "pdf_agg_columns":    pdf_agg_cols,
#         "column_labels": {
#             col: make_label(col)
#             for col in img_score_cols + img_total_cols + pdf_agg_cols
#         },
#     }

#     path = output_dir / "nirf_meta.json"
#     with open(path, "w", encoding="utf-8") as f:
#         json.dump(meta, f, indent=2, ensure_ascii=False)

#     print(f"  ✓  nirf_meta.json  →  {len(years)} years | {len(cats)} categories | "
#           f"{len(img_score_cols)} image score cols | {len(pdf_agg_cols)} PDF agg cols")

# # ─────────────────────────────────────────────────────────────────────────────
# # MAIN
# # ─────────────────────────────────────────────────────────────────────────────

# def main():
#     parser = argparse.ArgumentParser(description="NIRF ETL: CSV + Excel → Parquet")
#     parser.add_argument("--input",  "-i", default="./downloads",
#                         help="Root folder with year subfolders (default: ./downloads)")
#     parser.add_argument("--output", "-o", default="./public/data",
#                         help="Output folder for Parquet files (default: ./public/data)")
#     args = parser.parse_args()

#     input_dir  = Path(args.input).resolve()
#     output_dir = Path(args.output).resolve()

#     if not input_dir.exists():
#         print(f"[ETL] Input folder not found: {input_dir}")
#         sys.exit(1)

#     output_dir.mkdir(parents=True, exist_ok=True)
#     print(f"[ETL] Input  : {input_dir}")
#     print(f"[ETL] Output : {output_dir}")

#     # ── Load sources ──────────────────────────────────────────────────────────
#     print(divider("SOURCE A  —  nirf-pdf-data.csv  (long format)"))
#     pdf_files = find_pdf_csvs(input_dir)
#     print(f"  Found {len(pdf_files)} CSV file(s)")
#     df_pdf = load_all_pdf_csvs(pdf_files)

#     print(divider("SOURCE B  —  image-data.xlsx  (NIRF scorecard scores)"))
#     xlsx_files = find_image_xlsxs(input_dir)
#     print(f"  Found {len(xlsx_files)} Excel file(s)")
#     df_image = load_all_image_xlsxs(xlsx_files)

#     # ── Write raw Parquet ─────────────────────────────────────────────────────
#     print(divider("OUTPUT 1  —  nirf_raw.parquet  (long format, PDF data)"))
#     if not df_pdf.empty:
#         write_parquet(df_pdf, output_dir / "nirf_raw.parquet", "nirf_raw.parquet")
#     else:
#         print("  [SKIP] No PDF data to write.")

#     # ── Build and write merged scores Parquet ─────────────────────────────────
#     print(divider("OUTPUT 2  —  nirf_scores.parquet  (wide, merged)"))
#     df_pdf_agg = aggregate_pdf(df_pdf)
#     df_scores  = merge_sources(df_image, df_pdf_agg)

#     if not df_scores.empty:
#         write_parquet(df_scores, output_dir / "nirf_scores.parquet", "nirf_scores.parquet")
#     else:
#         print("  [SKIP] No scores data to write.")

#     # ── Write metadata ────────────────────────────────────────────────────────
#     print(divider("OUTPUT 3  —  nirf_meta.json"))
#     write_metadata(df_pdf, df_scores, output_dir)

#     # ── Summary ───────────────────────────────────────────────────────────────
#     print(divider("DONE ✅"))
#     print(f"  Raw rows (PDF)   : {len(df_pdf):,}")
#     print(f"  Score rows       : {len(df_scores):,}")
#     print(f"  Output folder    : {output_dir}")
#     print()
#     print("  Next steps:")
#     print("  1.  npm install duckdb-async")
#     print("  2.  Build Next.js API routes  (Phase 2)")
#     print("  3.  Build dashboard UI        (Phase 3)")
#     print()

# if __name__ == "__main__":
#     main()






























# #!/usr/bin/env python3
# """
# nirf_etl.py  —  NIRF multi-source ETL pipeline (fully dynamic columns)
# =======================================================================
# Takes ALL columns from ALL files regardless of year or naming variation.
# Handles encoding differences, delimiter differences, and column name
# variations across years (2016–2025).
# """

# import argparse
# import json
# import sys
# import re
# from pathlib import Path


# def check_deps():
#     missing = []
#     for pkg in ["pandas", "pyarrow", "openpyxl", "tqdm"]:
#         try:
#             __import__(pkg)
#         except ImportError:
#             missing.append(pkg)
#     if missing:
#         print(f"[ETL] Missing packages: {', '.join(missing)}")
#         print(f"[ETL] Run:  pip install {' '.join(missing)}")
#         sys.exit(1)

# check_deps()

# import pandas as pd
# from tqdm import tqdm

# # ── Constants ─────────────────────────────────────────────────────────────────

# PDF_COLUMNS = [
#     "ranking_year", "category", "institute_code", "institute_name",
#     "section", "program", "year", "metric", "value",
# ]

# JOIN_KEY = ["ranking_year", "category", "institute_code", "institute_name"]

# # All known column name variants → canonical name
# # Add more here if new variations are discovered
# COLUMN_ALIASES = {
#     # ranking year
#     "year":                  "ranking_year",
#     "rankingyear":           "ranking_year",
#     "ranking_year":          "ranking_year",
#     # institute code
#     "institutecode":         "institute_code",
#     "institute_code":        "institute_code",
#     "instcode":              "institute_code",
#     "inst_code":             "institute_code",
#     # institute name
#     "institutename":         "institute_name",
#     "institute_name":        "institute_name",
#     "instname":              "institute_name",
#     "inst_name":             "institute_name",
#     # category
#     "category":              "category",
#     "type":                  "category",
#     # section
#     "section":               "section",
#     "sectionname":           "section",
#     # program
#     "program":               "program",
#     "programme":             "program",
#     "programname":           "program",
#     # year (academic year column inside PDF data)
#     # NOTE: this is handled carefully — "year" maps to ranking_year only
#     # when there's no ranking_year column already
#     # metric / value
#     "metric":                "metric",
#     "metricname":            "metric",
#     "value":                 "value",
#     "metricvalue":           "value",
# }

# # ── Helpers ───────────────────────────────────────────────────────────────────

# def norm_col(name: str) -> str:
#     """Normalise any column name to safe snake_case."""
#     return re.sub(r"[^a-z0-9_]", "",
#         name.strip().lower()
#             .replace(" ", "_").replace("-", "_")
#             .replace("(", "").replace(")", "")
#             .replace("/", "_").replace(".", "_")
#     ).strip("_")

# def resolve_col(name: str) -> str:
#     """Map a normalised column name to its canonical form if known."""
#     n = norm_col(name)
#     return COLUMN_ALIASES.get(n, n)

# def normalise_str(s: pd.Series) -> pd.Series:
#     return s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

# def to_numeric(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce")

# def to_int(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce").astype("Int64")

# def valid_institute_code(s: pd.Series) -> pd.Series:
#     """Accept all historical NIRF code formats:
#       2016: NIRF-ENGG-1-xxxxxxx
#       2017: IR17-ENGG-1-1-xxx
#       2018: IR-1-A-A-C-xxxxx
#       2019+: IR-O-U-xxxx
#     """
#     pattern = (
#         r"^("
#         r"NIRF-[A-Z]+-[A-Z0-9]+(-[A-Z0-9]+)?"         # 2016: NIRF-UNIV-282 or NIRF-ENGG-INF-77
#         r"|IR17-[A-Z]+-\d+-\d+(-[A-Z0-9]+)*"         # 2017: IR17-PHRM-1-1-NIP-1 etc
#         r"|IR-\d+-[A-Z]+-[A-Z]+-[A-Z]-\d+"           # 2018: IR-1-A-A-C-46330
#         r"|IR-[A-Z]-[A-Z]-\d+"                        # 2019+: IR-O-U-0456
#         r")$"
#     )
#     return s.str.match(pattern, na=False)

# def divider(label: str) -> str:
#     return f"\n{'─'*60}\n  {label}\n{'─'*60}"

# def try_read_csv(path: Path) -> pd.DataFrame:
#     """
#     Try multiple encodings and delimiters to read a CSV robustly.
#     Returns the first successful parse that yields > 0 rows.
#     """
#     encodings  = ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]
#     delimiters = [",", ";", "\t", "|"]

#     for enc in encodings:
#         for delim in delimiters:
#             try:
#                 df = pd.read_csv(
#                     path,
#                     dtype=str,
#                     encoding=enc,
#                     sep=delim,
#                     na_values=["", "N/A", "NA", "null", "NULL", "-", "nan"],
#                     keep_default_na=True,
#                     on_bad_lines="skip",
#                     engine="python",
#                 )
#                 # Must have at least 2 columns and 1 row to be valid
#                 if len(df.columns) >= 2 and len(df) > 0:
#                     return df, enc, delim
#             except Exception:
#                 continue

#     return pd.DataFrame(), "none", "none"

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE A  —  nirf-pdf-data.csv
# # ─────────────────────────────────────────────────────────────────────────────

# def find_pdf_csvs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("nirf-pdf-data.csv"))

# def load_one_pdf_csv(path: Path) -> pd.DataFrame:
#     df, enc, delim = try_read_csv(path)

#     if df.empty:
#         print(f"  [WARN] Could not parse {path} with any encoding/delimiter")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     # Show what we detected for debugging
#     raw_cols = df.columns.tolist()

#     # Resolve all column names to canonical
#     df.columns = [resolve_col(c) for c in df.columns]

#     # Remove duplicate column names — keep first occurrence
#     # (happens when both "year" and "ranking_year" exist and both map to "ranking_year")
#     seen_cols = {}
#     dedup_cols = []
#     for i, col in enumerate(df.columns):
#         if col not in seen_cols:
#             seen_cols[col] = i
#             dedup_cols.append(col)
#         else:
#             dedup_cols.append(f"__drop_{i}__")
#     df.columns = dedup_cols
#     df = df.drop(columns=[c for c in df.columns if c.startswith("__drop_")])

#     # Special case: if there's no ranking_year but there IS a "year" that
#     # looks like a 4-digit number, it's the ranking year
#     if "ranking_year" not in df.columns:
#         for col in df.columns:
#             if col not in PDF_COLUMNS:
#                 sample = df[col].dropna().head(5).tolist()
#                 if all(str(v).strip().isdigit() and len(str(v).strip()) == 4
#                        for v in sample if str(v).strip()):
#                     df = df.rename(columns={col: "ranking_year"})
#                     break

#     # Ensure all expected columns exist
#     for col in PDF_COLUMNS:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df = df[PDF_COLUMNS].copy()

#     # Clean string columns
#     for col in ["category", "institute_code", "institute_name",
#                 "section", "program", "metric", "value", "year"]:
#         df[col] = normalise_str(df[col])

#     df["ranking_year"]   = to_int(df["ranking_year"])
#     df["category"]       = df["category"].str.title()
#     df["institute_name"] = (
#         df["institute_name"]
#         .str.replace(r"^[^A-Za-z]+", "", regex=True)
#         .str.strip()
#     )
#     df["value"] = df["value"].str.replace(",", "", regex=False)

#     # Filter valid institute codes
#     before = len(df)
#     mask = valid_institute_code(df["institute_code"])
#     dropped = df[~mask]
#     if not dropped.empty:
#         sample_codes = dropped["institute_code"].dropna().unique()[:15].tolist()
#         tqdm.write(f"    [DEBUG] {len(dropped):,} rows dropped — unmatched codes: {sample_codes}")
#     df = df[mask]

#     tqdm.write(
#         f"    {path.parent.name}/nirf-pdf-data.csv  →  {len(df):,} rows "
#         f"[enc={enc}, sep='{delim}', cols={raw_cols[:4]}...]"
#     )

#     if len(df) == 0 and before > 0:
#         tqdm.write(
#             f"    [WARN] All {before} rows dropped — institute codes didn't match IR-X-X-XXXX pattern"
#         )
#         tqdm.write(f"    [WARN] Sample codes: {df['institute_code'].head(5).tolist()}")

#     return df

# def load_all_pdf_csvs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No nirf-pdf-data.csv files found.")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     frames = []
#     for f in tqdm(files, unit="csv", desc="  PDF CSVs"):
#         df = load_one_pdf_csv(f)
#         frames.append(df)

#     combined = pd.concat(frames, ignore_index=True)
#     before = len(combined)
#     combined = combined.drop_duplicates()
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE B  —  image-data.xlsx  (ALL columns, dynamic per year)
# # ─────────────────────────────────────────────────────────────────────────────

# def find_image_xlsxs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("image-data.xlsx"))

# def load_one_image_xlsx(path: Path) -> pd.DataFrame:
#     """
#     Load image-data.xlsx robustly:
#     - Tries header rows 0, 1, 2 in case the real header isn't on row 0
#     - Handles special column names like OE+MIR, PR+A
#     - Keeps ALL score/total columns regardless of year
#     """
#     df = pd.DataFrame()

#     # First: show all sheets and their shapes
#     try:
#         xl = __import__("openpyxl").load_workbook(path, read_only=True, data_only=True)
#         sheet_names = xl.sheetnames
#         tqdm.write(f"    [DEBUG] {path.parent.name} sheets: {sheet_names}")
#         for sname in sheet_names:
#             ws = xl[sname]
#             rows = list(ws.iter_rows(max_row=3, values_only=True))
#             tqdm.write(f"    [DEBUG]   sheet='{sname}' first 3 rows: {rows}")
#         xl.close()
#     except Exception as e:
#         tqdm.write(f"    [DEBUG] openpyxl inspect failed: {e}")

#     for header_row in [0, 1, 2]:
#         try:
#             candidate = pd.read_excel(
#                 path, dtype=str, engine="openpyxl", header=header_row
#             )
#             # A valid sheet has at least 4 columns and the institute code
#             # column must have actual IR-style codes, not all NaN
#             cols_norm = [norm_col(c) for c in candidate.columns]

#             # Find which column might be institute_code
#             code_col_idx = None
#             for i, c in enumerate(cols_norm):
#                 if c in ('institute_code', 'institutecode', 'inst_code', 'instcode'):
#                     code_col_idx = i
#                     break

#             if code_col_idx is None:
#                 # Try to find by content — look for a col with IR-* style values
#                 for i, col in enumerate(candidate.columns):
#                     sample = candidate[col].dropna().head(10).astype(str).tolist()
#                     if any(v.startswith('IR') or v.startswith('NIRF') for v in sample):
#                         code_col_idx = i
#                         break

#             if code_col_idx is not None:
#                 sample_codes = candidate.iloc[:, code_col_idx].dropna().head(5).astype(str).tolist()
#                 has_real_codes = any(
#                     bool(__import__('re').match(
#                         r'^(NIRF-|IR17-|IR-\d|IR-[A-Z])', v
#                     )) for v in sample_codes
#                 )
#                 if has_real_codes:
#                     df = candidate
#                     tqdm.write(f"    {path.parent.name}/image-data.xlsx: using header_row={header_row}, {len(df)} rows")
#                     break
#         except Exception as e:
#             tqdm.write(f"    [WARN] header_row={header_row} failed: {e}")
#             continue

#     if df.empty:
#         tqdm.write(f"    [WARN] {path.parent.name}/image-data.xlsx: could not find valid data")
#         return pd.DataFrame()

#     # Normalise column names — handle special cases like OE+MIR, PR+A
#     def norm_img_col(name: str) -> str:
#         # Handle + sign specially before general normalisation
#         s = str(name).strip()
#         s = s.replace('OE+MIR', 'OEMIR').replace('oe+mir', 'oemir')
#         s = s.replace('PR+A', 'PRA').replace('pr+a', 'pra')
#         return norm_col(s)

#     df.columns = [norm_img_col(c) for c in df.columns]

#     # Map to canonical identity column names
#     rename_map = {}
#     for col in df.columns:
#         if col in ('year', 'ranking_year') and 'ranking_year' not in rename_map.values():
#             rename_map[col] = 'ranking_year'
#         elif col in ('institutename', 'inst_name', 'instname'):
#             rename_map[col] = 'institute_name'
#         elif col in ('institutecode', 'inst_code', 'instcode'):
#             rename_map[col] = 'institute_code'
#     df = df.rename(columns=rename_map)

#     # Deduplicate column names
#     seen = {}
#     dedup = []
#     for i, col in enumerate(df.columns):
#         if col not in seen:
#             seen[col] = i
#             dedup.append(col)
#         else:
#             dedup.append(f'__drop_{i}__')
#     df.columns = dedup
#     df = df.drop(columns=[c for c in df.columns if c.startswith('__drop_')])

#     # Ensure identity columns exist
#     for col in JOIN_KEY:
#         if col not in df.columns:
#             df[col] = pd.NA

#     # Clean identity columns
#     df['ranking_year']   = to_int(df['ranking_year'])
#     df['category']       = normalise_str(df['category']).str.title()
#     df['institute_code'] = normalise_str(df['institute_code'])
#     df['institute_name'] = (
#         normalise_str(df['institute_name'])
#         .str.replace(r'^[^A-Za-z]+', '', regex=True)
#         .str.strip()
#     )

#     before_img = len(df)
#     df = df[valid_institute_code(df['institute_code'])]
#     dropped = before_img - len(df)
#     if dropped > 0:
#         tqdm.write(f"    [INFO] {path.parent.name}: dropped {dropped} rows with invalid/empty codes")

#     # Convert ALL non-identity columns to numeric
#     score_cols = [c for c in df.columns if c not in JOIN_KEY]
#     for col in score_cols:
#         df[col] = to_numeric(
#             df[col].astype(str).str.replace(',', '', regex=False)
#         )

#     tqdm.write(
#         f"    {path.parent.name}/image-data.xlsx  →  {len(df):,} rows | "
#         f"{len(score_cols)} data cols: {score_cols[:5]}{'...' if len(score_cols) > 5 else ''}"
#     )
#     return df


# def load_all_image_xlsxs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No image-data.xlsx files found.")
#         return pd.DataFrame()

#     frames = []
#     all_score_cols = set()

#     for f in tqdm(files, unit="xlsx", desc="  Image XLSXs"):
#         df = load_one_image_xlsx(f)
#         score_cols = [c for c in df.columns if c not in JOIN_KEY]
#         all_score_cols.update(score_cols)
#         frames.append(df)

#     # OUTER JOIN — columns missing in older files → NaN, NOT dropped
#     combined = pd.concat(frames, ignore_index=True, join="outer")
#     before = len(combined)
#     combined = combined.drop_duplicates(
#         subset=["ranking_year", "category", "institute_code"]
#     )
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     print(f"  Total unique data columns across all years: {len(all_score_cols)}")
#     print(f"  All columns: {sorted(all_score_cols)}")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # PDF AGGREGATION
# # ─────────────────────────────────────────────────────────────────────────────

# def aggregate_pdf(df_pdf: pd.DataFrame) -> pd.DataFrame:
#     if df_pdf.empty:
#         return pd.DataFrame(columns=JOIN_KEY)

#     print("  Aggregating PDF data...")
#     num = df_pdf.copy()
#     num["v"] = to_numeric(num["value"])
#     num = num[num["v"].notna()]

#     # ── Named aggregates ──────────────────────────────────────────────────────
#     def agg(section_kw: str, metric_kw: str, fn: str = "sum") -> pd.Series:
#         mask = (
#             num["section"].str.contains(section_kw, case=False, na=False)
#             & num["metric"].str.contains(metric_kw, case=False, na=False)
#         )
#         sub = num[mask]
#         if sub.empty:
#             return pd.Series(dtype=float)
#         g = sub.groupby(JOIN_KEY)["v"]
#         return getattr(g, fn)()

#     named_aggregates = {
#         "pdf_total_intake":            agg("Sanctioned", "Intake"),
#         "pdf_placement_placed":        agg("Placement", r"No\. of students placed"),
#         "pdf_placement_higher":        agg("Placement", r"Higher Stud"),
#         "pdf_median_salary":           agg("Placement", r"[Mm]edian salary", "mean"),
#         "pdf_phd_ft_total":            agg(r"Ph\.D", r"Full Time Students"),
#         "pdf_phd_pt_total":            agg(r"Ph\.D", r"Part Time Students"),
#         "pdf_phd_ft_graduated":        agg(r"Ph\.D", r"Full Time Graduated"),
#         "pdf_phd_pt_graduated":        agg(r"Ph\.D", r"Part Time Graduated"),
#         "pdf_sponsored_projects":      agg("Sponsored Research", r"Sponsored Projects"),
#         "pdf_sponsored_amount":        agg("Sponsored Research", r"[Aa]mount"),
#         "pdf_consultancy_projects":    agg("Consultancy", r"Consultancy Projects"),
#         "pdf_consultancy_amount":      agg("Consultancy", r"[Aa]mount"),
#         "pdf_edp_participants":        agg("Executive Development", r"[Pp]articipants"),
#         "pdf_capital_expenditure":     agg("Capital expenditure", r"Utilised Amount$"),
#         "pdf_operational_expenditure": agg("Operational expenditure", r"Utilised Amount$"),
#     }

#     base = (
#         df_pdf[JOIN_KEY]
#         .drop_duplicates()
#         .dropna(subset=["ranking_year", "institute_code"])
#     )
#     result = base.copy()

#     for col_name, series in named_aggregates.items():
#         if not series.empty:
#             result = result.merge(
#                 series.rename(col_name).reset_index(),
#                 on=JOIN_KEY,
#                 how="left",
#             )

#     # ── Dynamic section pivot ─────────────────────────────────────────────────
#     section_sums = (
#         num.groupby(JOIN_KEY + ["section"])["v"]
#         .sum()
#         .unstack("section")
#         .reset_index()
#     )

#     # Rename section columns to safe names, deduplicate if needed
#     seen = set(result.columns.tolist())
#     new_cols = {}
#     for col in section_sums.columns:
#         if col in JOIN_KEY:
#             continue
#         safe = "pdf_sec_" + re.sub(r"[^a-z0-9]+", "_",
#             str(col).lower().strip())[:40].strip("_")
#         # Deduplicate
#         candidate = safe
#         i = 2
#         while candidate in seen:
#             candidate = f"{safe}_{i}"
#             i += 1
#         new_cols[col] = candidate
#         seen.add(candidate)

#     section_sums = section_sums.rename(columns=new_cols)

#     # Merge named + section pivot
#     result = pd.merge(result, section_sums, on=JOIN_KEY, how="outer")
#     result["ranking_year"] = to_int(result["ranking_year"])

#     # Round float columns safely — one at a time to avoid length mismatch
#     for col in result.columns:
#         if result[col].dtype == "float64":
#             result[col] = result[col].round(2)

#     n_named   = sum(1 for c in result.columns if c.startswith("pdf_") and not c.startswith("pdf_sec_"))
#     n_section = sum(1 for c in result.columns if c.startswith("pdf_sec_"))
#     print(f"  PDF aggregates: {len(result):,} rows | "
#           f"{n_named} named + {n_section} section cols = {len(result.columns)} total")
#     return result

# # ─────────────────────────────────────────────────────────────────────────────
# # MERGE
# # ─────────────────────────────────────────────────────────────────────────────

# def merge_sources(df_image: pd.DataFrame, df_pdf_agg: pd.DataFrame) -> pd.DataFrame:
#     if not df_image.empty:
#         score_cols = [c for c in df_image.columns if c not in JOIN_KEY]
#         df_image = df_image.rename(columns={c: f"img_{c}" for c in score_cols})

#     if df_image.empty and df_pdf_agg.empty:
#         return pd.DataFrame(columns=JOIN_KEY)
#     if df_image.empty:
#         return df_pdf_agg.copy()
#     if df_pdf_agg.empty:
#         return df_image.copy()

#     merged = pd.merge(df_image, df_pdf_agg, on=JOIN_KEY, how="outer")
#     merged["ranking_year"] = to_int(merged["ranking_year"])
#     merged = merged.sort_values(
#         ["ranking_year", "category", "institute_code"],
#         ascending=[False, True, True],
#         na_position="last",
#     ).reset_index(drop=True)
#     return merged

# # ─────────────────────────────────────────────────────────────────────────────
# # OUTPUT
# # ─────────────────────────────────────────────────────────────────────────────

# def write_parquet(df: pd.DataFrame, path: Path, label: str) -> None:
#     df.to_parquet(path, engine="pyarrow", compression="snappy", index=False)
#     size_mb = path.stat().st_size / 1_048_576
#     print(f"  ✓  {label}  →  {len(df):,} rows × {len(df.columns)} cols  ({size_mb:.1f} MB)")

# def write_metadata(df_raw: pd.DataFrame, df_scores: pd.DataFrame, output_dir: Path) -> None:
#     years = sorted([int(y) for y in df_raw["ranking_year"].dropna().unique()]) \
#             if not df_raw.empty else []
#     cats  = sorted(df_raw["category"].dropna().unique().tolist()) \
#             if not df_raw.empty else []
#     sections = sorted(df_raw["section"].dropna().unique().tolist()) \
#                if "section" in df_raw.columns else []

#     all_cols       = df_scores.columns.tolist() if not df_scores.empty else []
#     img_score_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_score")]
#     img_total_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_total")]
#     img_other_cols = [c for c in all_cols if c.startswith("img_")
#                       and c not in img_score_cols and c not in img_total_cols]
#     pdf_named_cols = [c for c in all_cols if c.startswith("pdf_") and not c.startswith("pdf_sec_")]
#     pdf_sec_cols   = [c for c in all_cols if c.startswith("pdf_sec_")]

#     def make_label(col: str) -> str:
#         return (col
#                 .replace("img_", "").replace("pdf_sec_", "").replace("pdf_", "")
#                 .replace("_score", " Score").replace("_total", " Total")
#                 .replace("_", " ").title())

#     all_labelled = img_score_cols + img_total_cols + img_other_cols + pdf_named_cols + pdf_sec_cols

#     meta = {
#         "ranking_years":       years,
#         "categories":          cats,
#         "sections":            sections,
#         "total_raw_rows":      int(len(df_raw)),
#         "total_institutes":    int(df_raw["institute_code"].nunique()) if not df_raw.empty else 0,
#         "img_score_columns":   img_score_cols,
#         "img_total_columns":   img_total_cols,
#         "img_other_columns":   img_other_cols,
#         "pdf_named_columns":   pdf_named_cols,
#         "pdf_section_columns": pdf_sec_cols,
#         "all_score_columns":   all_labelled,
#         "column_labels":       {col: make_label(col) for col in all_labelled},
#     }

#     path = output_dir / "nirf_meta.json"
#     with open(path, "w", encoding="utf-8") as f:
#         json.dump(meta, f, indent=2, ensure_ascii=False)

#     print(f"  ✓  nirf_meta.json")
#     print(f"     {len(years)} years | {len(cats)} categories | {len(sections)} sections")
#     print(f"     {len(img_score_cols)} img score | {len(img_total_cols)} img total | "
#           f"{len(img_other_cols)} img other")
#     print(f"     {len(pdf_named_cols)} pdf named | {len(pdf_sec_cols)} pdf section cols")

# # ─────────────────────────────────────────────────────────────────────────────
# # MAIN
# # ─────────────────────────────────────────────────────────────────────────────

# def main():
#     parser = argparse.ArgumentParser()
#     parser.add_argument("--input",  "-i", default="./downloads")
#     parser.add_argument("--output", "-o", default="./public/data")
#     args = parser.parse_args()

#     input_dir  = Path(args.input).resolve()
#     output_dir = Path(args.output).resolve()

#     if not input_dir.exists():
#         print(f"[ETL] Input folder not found: {input_dir}")
#         sys.exit(1)

#     output_dir.mkdir(parents=True, exist_ok=True)
#     print(f"[ETL] Input  : {input_dir}")
#     print(f"[ETL] Output : {output_dir}")

#     print(divider("SOURCE A  —  nirf-pdf-data.csv"))
#     pdf_files = find_pdf_csvs(input_dir)
#     print(f"  Found {len(pdf_files)} CSV file(s)")
#     df_pdf = load_all_pdf_csvs(pdf_files)

#     print(divider("SOURCE B  —  image-data.xlsx  (ALL columns from ALL years)"))
#     xlsx_files = find_image_xlsxs(input_dir)
#     print(f"  Found {len(xlsx_files)} Excel file(s)")
#     df_image = load_all_image_xlsxs(xlsx_files)

#     print(divider("OUTPUT 1  —  nirf_raw.parquet"))
#     if not df_pdf.empty:
#         write_parquet(df_pdf, output_dir / "nirf_raw.parquet", "nirf_raw.parquet")
#     else:
#         print("  [SKIP] No PDF data.")

#     print(divider("OUTPUT 2  —  nirf_scores.parquet"))
#     df_pdf_agg = aggregate_pdf(df_pdf)
#     df_scores  = merge_sources(df_image, df_pdf_agg)
#     if not df_scores.empty:
#         write_parquet(df_scores, output_dir / "nirf_scores.parquet", "nirf_scores.parquet")
#     else:
#         print("  [SKIP] No scores data.")

#     print(divider("OUTPUT 3  —  nirf_meta.json"))
#     write_metadata(df_pdf, df_scores, output_dir)

#     print(divider("DONE ✅"))
#     print(f"  Raw rows      : {len(df_pdf):,}")
#     print(f"  Score rows    : {len(df_scores):,}")
#     print(f"  Score columns : {len(df_scores.columns) if not df_scores.empty else 0}")
#     print(f"  Output        : {output_dir}\n")

# if __name__ == "__main__":
#     main()


































# #!/usr/bin/env python3
# """
# nirf_etl.py  —  NIRF multi-source ETL pipeline (fully dynamic columns)
# =======================================================================
# Takes ALL columns from ALL files regardless of year or naming variation.
# Handles encoding differences, delimiter differences, and column name
# variations across years (2016–2025).
# """

# import argparse
# import json
# import sys
# import re
# from pathlib import Path


# def check_deps():
#     missing = []
#     for pkg in ["pandas", "pyarrow", "openpyxl", "tqdm"]:
#         try:
#             __import__(pkg)
#         except ImportError:
#             missing.append(pkg)
#     if missing:
#         print(f"[ETL] Missing packages: {', '.join(missing)}")
#         print(f"[ETL] Run:  pip install {' '.join(missing)}")
#         sys.exit(1)

# check_deps()

# import pandas as pd
# from tqdm import tqdm

# # ── Constants ─────────────────────────────────────────────────────────────────

# PDF_COLUMNS = [
#     "ranking_year", "category", "institute_code", "institute_name",
#     "section", "program", "year", "metric", "value",
# ]

# JOIN_KEY = ["ranking_year", "category", "institute_code", "institute_name"]

# # All known column name variants → canonical name
# # Add more here if new variations are discovered
# COLUMN_ALIASES = {
#     # ranking year
#     "year":                  "ranking_year",
#     "rankingyear":           "ranking_year",
#     "ranking_year":          "ranking_year",
#     # institute code
#     "institutecode":         "institute_code",
#     "institute_code":        "institute_code",
#     "instcode":              "institute_code",
#     "inst_code":             "institute_code",
#     # institute name
#     "institutename":         "institute_name",
#     "institute_name":        "institute_name",
#     "instname":              "institute_name",
#     "inst_name":             "institute_name",
#     # category
#     "category":              "category",
#     "type":                  "category",
#     # section
#     "section":               "section",
#     "sectionname":           "section",
#     # program
#     "program":               "program",
#     "programme":             "program",
#     "programname":           "program",
#     # year (academic year column inside PDF data)
#     # NOTE: this is handled carefully — "year" maps to ranking_year only
#     # when there's no ranking_year column already
#     # metric / value
#     "metric":                "metric",
#     "metricname":            "metric",
#     "value":                 "value",
#     "metricvalue":           "value",
# }

# # ── Helpers ───────────────────────────────────────────────────────────────────

# def norm_col(name: str) -> str:
#     """Normalise any column name to safe snake_case."""
#     return re.sub(r"[^a-z0-9_]", "",
#         name.strip().lower()
#             .replace(" ", "_").replace("-", "_")
#             .replace("(", "").replace(")", "")
#             .replace("/", "_").replace(".", "_")
#     ).strip("_")

# def resolve_col(name: str) -> str:
#     """Map a normalised column name to its canonical form if known."""
#     n = norm_col(name)
#     return COLUMN_ALIASES.get(n, n)

# def normalise_str(s: pd.Series) -> pd.Series:
#     return s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

# def to_numeric(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce")

# def to_int(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce").astype("Int64")

# def valid_institute_code(s: pd.Series) -> pd.Series:
#     """Accept all historical NIRF code formats:
#       2016: NIRF-ENGG-1-xxxxxxx
#       2017: IR17-ENGG-1-1-xxx
#       2018: IR-1-A-A-C-xxxxx
#       2019+: IR-O-U-xxxx
#     """
#     pattern = (
#         r"^("
#         r"NIRF-[A-Z]+-[A-Z0-9]+(-[A-Z0-9]+)?"         # 2016: NIRF-UNIV-282 or NIRF-ENGG-INF-77
#         r"|IR17-[A-Z]+-\d+-\d+(-[A-Z0-9]+)*"         # 2017: IR17-PHRM-1-1-NIP-1 etc
#         r"|IR-\d+-[A-Z]+-[A-Z]+-[A-Z]-\d+"           # 2018: IR-1-A-A-C-46330
#         r"|IR-[A-Z]-[A-Z]-\d+"                        # 2019+: IR-O-U-0456
#         r")$"
#     )
#     return s.str.match(pattern, na=False)

# def divider(label: str) -> str:
#     return f"\n{'─'*60}\n  {label}\n{'─'*60}"

# # Known category mappings — covers all camelCase / joined variants seen in NIRF data
# CATEGORY_MAP = {
#     # Base categories
#     'engineering':                    'Engineering',
#     'management':                     'Management',
#     'pharmacy':                       'Pharmacy',
#     'medical':                        'Medical',
#     'law':                            'Law',
#     'architecture':                   'Architecture',
#     'university':                     'University',
#     'college':                        'College',
#     'overall':                        'Overall',
#     'research':                       'Research',
#     'dental':                         'Dental',
#     'agriculture':                    'Agriculture',
#     # Ranking-suffix variants from PDF → mapped to base category
#     # so they join correctly with image data which uses base category
#     'statepublicuniversity':          'State Public University',
#     'statepublicuniversityranking':   'State Public University',
#     'openuniversityranking':          'Open University',
#     'universityranking':              'University',
#     'skilluniversityranking':         'Skill University',
#     'skillindia':                     'Skill University',
#     'sdginstitutionsranking':         'Research',
#     'innovationranking':              'Innovation',
# }

# def normalise_category(s: pd.Series) -> pd.Series:
#     """
#     Convert category values to consistent spaced Title Case.
#     Handles: 'StatePublicUniversity', 'statepublicuniversity', 'State Public University'
#     all → 'State Public University'
#     """
#     import re as _re
#     def fix(val):
#         if not isinstance(val, str) or not val.strip():
#             return val
#         v = val.strip()
#         # Check known map first (case-insensitive, spaces removed)
#         key = v.lower().replace(' ', '').replace('-', '').replace('_', '')
#         if key in CATEGORY_MAP:
#             return CATEGORY_MAP[key]
#         # Insert spaces before uppercase letters that follow lowercase (camelCase)
#         spaced = _re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', v)
#         return spaced.title()
#     return s.apply(fix)

# def try_read_csv(path: Path) -> pd.DataFrame:
#     """
#     Try multiple encodings and delimiters to read a CSV robustly.
#     Returns the first successful parse that yields > 0 rows.
#     """
#     encodings  = ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]
#     delimiters = [",", ";", "\t", "|"]

#     for enc in encodings:
#         for delim in delimiters:
#             try:
#                 df = pd.read_csv(
#                     path,
#                     dtype=str,
#                     encoding=enc,
#                     sep=delim,
#                     na_values=["", "N/A", "NA", "null", "NULL", "-", "nan"],
#                     keep_default_na=True,
#                     on_bad_lines="skip",
#                     engine="python",
#                 )
#                 # Must have at least 2 columns and 1 row to be valid
#                 if len(df.columns) >= 2 and len(df) > 0:
#                     return df, enc, delim
#             except Exception:
#                 continue

#     return pd.DataFrame(), "none", "none"

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE A  —  nirf-pdf-data.csv
# # ─────────────────────────────────────────────────────────────────────────────

# def find_pdf_csvs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("nirf-pdf-data.csv"))

# def load_one_pdf_csv(path: Path) -> pd.DataFrame:
#     df, enc, delim = try_read_csv(path)

#     if df.empty:
#         print(f"  [WARN] Could not parse {path} with any encoding/delimiter")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     # Show what we detected for debugging
#     raw_cols = df.columns.tolist()

#     # Resolve all column names to canonical
#     df.columns = [resolve_col(c) for c in df.columns]

#     # Remove duplicate column names — keep first occurrence
#     # (happens when both "year" and "ranking_year" exist and both map to "ranking_year")
#     seen_cols = {}
#     dedup_cols = []
#     for i, col in enumerate(df.columns):
#         if col not in seen_cols:
#             seen_cols[col] = i
#             dedup_cols.append(col)
#         else:
#             dedup_cols.append(f"__drop_{i}__")
#     df.columns = dedup_cols
#     df = df.drop(columns=[c for c in df.columns if c.startswith("__drop_")])

#     # Special case: if there's no ranking_year but there IS a "year" that
#     # looks like a 4-digit number, it's the ranking year
#     if "ranking_year" not in df.columns:
#         for col in df.columns:
#             if col not in PDF_COLUMNS:
#                 sample = df[col].dropna().head(5).tolist()
#                 if all(str(v).strip().isdigit() and len(str(v).strip()) == 4
#                        for v in sample if str(v).strip()):
#                     df = df.rename(columns={col: "ranking_year"})
#                     break

#     # Ensure all expected columns exist
#     for col in PDF_COLUMNS:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df = df[PDF_COLUMNS].copy()

#     # Clean string columns
#     for col in ["category", "institute_code", "institute_name",
#                 "section", "program", "metric", "value", "year"]:
#         df[col] = normalise_str(df[col])

#     df["ranking_year"]   = to_int(df["ranking_year"])
#     df["category"]       = normalise_category(df["category"])
#     df["institute_name"] = (
#         df["institute_name"]
#         .str.replace(r"^[^A-Za-z]+", "", regex=True)
#         .str.strip()
#     )
#     df["value"] = df["value"].str.replace(",", "", regex=False)

#     # Filter valid institute codes
#     before = len(df)
#     mask = valid_institute_code(df["institute_code"])
#     dropped = df[~mask]
#     if not dropped.empty:
#         sample_codes = dropped["institute_code"].dropna().unique()[:15].tolist()
#         tqdm.write(f"    [DEBUG] {len(dropped):,} rows dropped — unmatched codes: {sample_codes}")
#     df = df[mask]

#     tqdm.write(
#         f"    {path.parent.name}/nirf-pdf-data.csv  →  {len(df):,} rows "
#         f"[enc={enc}, sep='{delim}', cols={raw_cols[:4]}...]"
#     )

#     if len(df) == 0 and before > 0:
#         tqdm.write(
#             f"    [WARN] All {before} rows dropped — institute codes didn't match IR-X-X-XXXX pattern"
#         )
#         tqdm.write(f"    [WARN] Sample codes: {df['institute_code'].head(5).tolist()}")

#     return df

# def load_all_pdf_csvs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No nirf-pdf-data.csv files found.")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     frames = []
#     for f in tqdm(files, unit="csv", desc="  PDF CSVs"):
#         df = load_one_pdf_csv(f)
#         frames.append(df)

#     combined = pd.concat(frames, ignore_index=True)
#     before = len(combined)
#     combined = combined.drop_duplicates()
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE B  —  image-data.xlsx  (ALL columns, dynamic per year)
# # ─────────────────────────────────────────────────────────────────────────────

# def find_image_xlsxs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("image-data.xlsx"))

# def load_one_image_xlsx(path: Path) -> pd.DataFrame:
#     """
#     Load image-data.xlsx robustly:
#     - Tries header rows 0, 1, 2 in case the real header isn't on row 0
#     - Handles special column names like OE+MIR, PR+A
#     - Keeps ALL score/total columns regardless of year
#     """
#     df = pd.DataFrame()

#     # First: show all sheets and their shapes
#     try:
#         xl = __import__("openpyxl").load_workbook(path, read_only=True, data_only=True)
#         sheet_names = xl.sheetnames
#         tqdm.write(f"    [DEBUG] {path.parent.name} sheets: {sheet_names}")
#         for sname in sheet_names:
#             ws = xl[sname]
#             rows = list(ws.iter_rows(max_row=3, values_only=True))
#             tqdm.write(f"    [DEBUG]   sheet='{sname}' first 3 rows: {rows}")
#         xl.close()
#     except Exception as e:
#         tqdm.write(f"    [DEBUG] openpyxl inspect failed: {e}")

#     for header_row in [0, 1, 2]:
#         try:
#             candidate = pd.read_excel(
#                 path, dtype=str, engine="openpyxl", header=header_row
#             )
#             # A valid sheet has at least 4 columns and the institute code
#             # column must have actual IR-style codes, not all NaN
#             cols_norm = [norm_col(c) for c in candidate.columns]

#             # Find which column might be institute_code
#             code_col_idx = None
#             for i, c in enumerate(cols_norm):
#                 if c in ('institute_code', 'institutecode', 'inst_code', 'instcode'):
#                     code_col_idx = i
#                     break

#             if code_col_idx is None:
#                 # Try to find by content — look for a col with IR-* style values
#                 for i, col in enumerate(candidate.columns):
#                     sample = candidate[col].dropna().head(10).astype(str).tolist()
#                     if any(v.startswith('IR') or v.startswith('NIRF') for v in sample):
#                         code_col_idx = i
#                         break

#             if code_col_idx is not None:
#                 sample_codes = candidate.iloc[:, code_col_idx].dropna().head(5).astype(str).tolist()
#                 has_real_codes = any(
#                     bool(__import__('re').match(
#                         r'^(NIRF-|IR17-|IR-\d|IR-[A-Z])', v
#                     )) for v in sample_codes
#                 )
#                 if has_real_codes:
#                     df = candidate
#                     tqdm.write(f"    {path.parent.name}/image-data.xlsx: using header_row={header_row}, {len(df)} rows")
#                     break
#         except Exception as e:
#             tqdm.write(f"    [WARN] header_row={header_row} failed: {e}")
#             continue

#     if df.empty:
#         tqdm.write(f"    [WARN] {path.parent.name}/image-data.xlsx: could not find valid data")
#         return pd.DataFrame()

#     # Normalise column names — handle special cases like OE+MIR, PR+A
#     def norm_img_col(name: str) -> str:
#         # Handle + sign specially before general normalisation
#         s = str(name).strip()
#         s = s.replace('OE+MIR', 'OEMIR').replace('oe+mir', 'oemir')
#         s = s.replace('PR+A', 'PRA').replace('pr+a', 'pra')
#         return norm_col(s)

#     df.columns = [norm_img_col(c) for c in df.columns]

#     # Map to canonical identity column names
#     rename_map = {}
#     for col in df.columns:
#         if col in ('year', 'ranking_year') and 'ranking_year' not in rename_map.values():
#             rename_map[col] = 'ranking_year'
#         elif col in ('institutename', 'inst_name', 'instname'):
#             rename_map[col] = 'institute_name'
#         elif col in ('institutecode', 'inst_code', 'instcode'):
#             rename_map[col] = 'institute_code'
#     df = df.rename(columns=rename_map)

#     # Deduplicate column names
#     seen = {}
#     dedup = []
#     for i, col in enumerate(df.columns):
#         if col not in seen:
#             seen[col] = i
#             dedup.append(col)
#         else:
#             dedup.append(f'__drop_{i}__')
#     df.columns = dedup
#     df = df.drop(columns=[c for c in df.columns if c.startswith('__drop_')])

#     # Ensure identity columns exist
#     for col in JOIN_KEY:
#         if col not in df.columns:
#             df[col] = pd.NA

#     # Clean identity columns
#     df['ranking_year']   = to_int(df['ranking_year'])
#     df['category']       = normalise_category(df['category'])
#     df['institute_code'] = normalise_str(df['institute_code'])
#     df['institute_name'] = (
#         normalise_str(df['institute_name'])
#         .str.replace(r'^[^A-Za-z]+', '', regex=True)
#         .str.strip()
#     )

#     before_img = len(df)
#     df = df[valid_institute_code(df['institute_code'])]
#     dropped = before_img - len(df)
#     if dropped > 0:
#         tqdm.write(f"    [INFO] {path.parent.name}: dropped {dropped} rows with invalid/empty codes")

#     # Convert ALL non-identity columns to numeric
#     score_cols = [c for c in df.columns if c not in JOIN_KEY]
#     for col in score_cols:
#         df[col] = to_numeric(
#             df[col].astype(str).str.replace(',', '', regex=False)
#         )

#     tqdm.write(
#         f"    {path.parent.name}/image-data.xlsx  →  {len(df):,} rows | "
#         f"{len(score_cols)} data cols: {score_cols[:5]}{'...' if len(score_cols) > 5 else ''}"
#     )
#     return df


# def load_all_image_xlsxs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No image-data.xlsx files found.")
#         return pd.DataFrame()

#     frames = []
#     all_score_cols = set()

#     for f in tqdm(files, unit="xlsx", desc="  Image XLSXs"):
#         df = load_one_image_xlsx(f)
#         score_cols = [c for c in df.columns if c not in JOIN_KEY]
#         all_score_cols.update(score_cols)
#         frames.append(df)

#     # OUTER JOIN — columns missing in older files → NaN, NOT dropped
#     combined = pd.concat(frames, ignore_index=True, join="outer")
#     before = len(combined)
#     combined = combined.drop_duplicates(
#         subset=["ranking_year", "category", "institute_code"]
#     )
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     print(f"  Total unique data columns across all years: {len(all_score_cols)}")
#     print(f"  All columns: {sorted(all_score_cols)}")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # PDF AGGREGATION
# # ─────────────────────────────────────────────────────────────────────────────

# def aggregate_pdf(df_pdf: pd.DataFrame) -> pd.DataFrame:
#     if df_pdf.empty:
#         return pd.DataFrame(columns=JOIN_KEY)

#     print("  Aggregating PDF data...")
#     num = df_pdf.copy()
#     num["v"] = to_numeric(num["value"])
#     num = num[num["v"].notna()]

#     # ── Named aggregates ──────────────────────────────────────────────────────
#     def agg(section_kw: str, metric_kw: str, fn: str = "sum") -> pd.Series:
#         mask = (
#             num["section"].str.contains(section_kw, case=False, na=False)
#             & num["metric"].str.contains(metric_kw, case=False, na=False)
#         )
#         sub = num[mask]
#         if sub.empty:
#             return pd.Series(dtype=float)
#         g = sub.groupby(JOIN_KEY)["v"]
#         return getattr(g, fn)()

#     named_aggregates = {
#         "pdf_total_intake":            agg("Sanctioned", "Intake"),
#         "pdf_placement_placed":        agg("Placement", r"No\. of students placed"),
#         "pdf_placement_higher":        agg("Placement", r"Higher Stud"),
#         "pdf_median_salary":           agg("Placement", r"[Mm]edian salary", "mean"),
#         "pdf_phd_ft_total":            agg(r"Ph\.D", r"Full Time Students"),
#         "pdf_phd_pt_total":            agg(r"Ph\.D", r"Part Time Students"),
#         "pdf_phd_ft_graduated":        agg(r"Ph\.D", r"Full Time Graduated"),
#         "pdf_phd_pt_graduated":        agg(r"Ph\.D", r"Part Time Graduated"),
#         "pdf_sponsored_projects":      agg("Sponsored Research", r"Sponsored Projects"),
#         "pdf_sponsored_amount":        agg("Sponsored Research", r"[Aa]mount"),
#         "pdf_consultancy_projects":    agg("Consultancy", r"Consultancy Projects"),
#         "pdf_consultancy_amount":      agg("Consultancy", r"[Aa]mount"),
#         "pdf_edp_participants":        agg("Executive Development", r"[Pp]articipants"),
#         "pdf_capital_expenditure":     agg("Capital expenditure", r"Utilised Amount$"),
#         "pdf_operational_expenditure": agg("Operational expenditure", r"Utilised Amount$"),
#     }

#     base = (
#         df_pdf[JOIN_KEY]
#         .drop_duplicates()
#         .dropna(subset=["ranking_year", "institute_code"])
#     )
#     result = base.copy()

#     for col_name, series in named_aggregates.items():
#         if not series.empty:
#             result = result.merge(
#                 series.rename(col_name).reset_index(),
#                 on=JOIN_KEY,
#                 how="left",
#             )

#     # ── Dynamic section pivot ─────────────────────────────────────────────────
#     section_sums = (
#         num.groupby(JOIN_KEY + ["section"])["v"]
#         .sum()
#         .unstack("section")
#         .reset_index()
#     )

#     # Rename section columns to safe names, deduplicate if needed
#     seen = set(result.columns.tolist())
#     new_cols = {}
#     for col in section_sums.columns:
#         if col in JOIN_KEY:
#             continue
#         safe = "pdf_sec_" + re.sub(r"[^a-z0-9]+", "_",
#             str(col).lower().strip())[:40].strip("_")
#         # Deduplicate
#         candidate = safe
#         i = 2
#         while candidate in seen:
#             candidate = f"{safe}_{i}"
#             i += 1
#         new_cols[col] = candidate
#         seen.add(candidate)

#     section_sums = section_sums.rename(columns=new_cols)

#     # Merge named + section pivot
#     result = pd.merge(result, section_sums, on=JOIN_KEY, how="outer")
#     result["ranking_year"] = to_int(result["ranking_year"])

#     # Round float columns safely — one at a time to avoid length mismatch
#     for col in result.columns:
#         if result[col].dtype == "float64":
#             result[col] = result[col].round(2)

#     n_named   = sum(1 for c in result.columns if c.startswith("pdf_") and not c.startswith("pdf_sec_"))
#     n_section = sum(1 for c in result.columns if c.startswith("pdf_sec_"))
#     print(f"  PDF aggregates: {len(result):,} rows | "
#           f"{n_named} named + {n_section} section cols = {len(result.columns)} total")
#     return result

# # ─────────────────────────────────────────────────────────────────────────────
# # MERGE
# # ─────────────────────────────────────────────────────────────────────────────

# def merge_sources(df_image: pd.DataFrame, df_pdf_agg: pd.DataFrame) -> pd.DataFrame:
#     if not df_image.empty:
#         score_cols = [c for c in df_image.columns if c not in JOIN_KEY]
#         df_image = df_image.rename(columns={c: f"img_{c}" for c in score_cols})

#     if df_image.empty and df_pdf_agg.empty:
#         return pd.DataFrame(columns=JOIN_KEY)
#     if df_image.empty:
#         return df_pdf_agg.copy()
#     if df_pdf_agg.empty:
#         return df_image.copy()

#     merged = pd.merge(df_image, df_pdf_agg, on=JOIN_KEY, how="outer")
#     merged["ranking_year"] = to_int(merged["ranking_year"])
#     merged = merged.sort_values(
#         ["ranking_year", "category", "institute_code"],
#         ascending=[False, True, True],
#         na_position="last",
#     ).reset_index(drop=True)
#     return merged

# # ─────────────────────────────────────────────────────────────────────────────
# # OUTPUT
# # ─────────────────────────────────────────────────────────────────────────────

# def write_parquet(df: pd.DataFrame, path: Path, label: str) -> None:
#     df.to_parquet(path, engine="pyarrow", compression="snappy", index=False)
#     size_mb = path.stat().st_size / 1_048_576
#     print(f"  ✓  {label}  →  {len(df):,} rows × {len(df.columns)} cols  ({size_mb:.1f} MB)")

# def write_metadata(df_raw: pd.DataFrame, df_scores: pd.DataFrame, output_dir: Path) -> None:
#     years = sorted([int(y) for y in df_raw["ranking_year"].dropna().unique()]) \
#             if not df_raw.empty else []
#     cats  = sorted(df_raw["category"].dropna().unique().tolist()) \
#             if not df_raw.empty else []
#     sections = sorted(df_raw["section"].dropna().unique().tolist()) \
#                if "section" in df_raw.columns else []

#     all_cols       = df_scores.columns.tolist() if not df_scores.empty else []
#     img_score_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_score")]
#     img_total_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_total")]
#     img_other_cols = [c for c in all_cols if c.startswith("img_")
#                       and c not in img_score_cols and c not in img_total_cols]
#     pdf_named_cols = [c for c in all_cols if c.startswith("pdf_") and not c.startswith("pdf_sec_")]
#     pdf_sec_cols   = [c for c in all_cols if c.startswith("pdf_sec_")]

#     def make_label(col: str) -> str:
#         return (col
#                 .replace("img_", "").replace("pdf_sec_", "").replace("pdf_", "")
#                 .replace("_score", " Score").replace("_total", " Total")
#                 .replace("_", " ").title())

#     all_labelled = img_score_cols + img_total_cols + img_other_cols + pdf_named_cols + pdf_sec_cols

#     meta = {
#         "ranking_years":       years,
#         "categories":          cats,
#         "sections":            sections,
#         "total_raw_rows":      int(len(df_raw)),
#         "total_institutes":    int(df_raw["institute_code"].nunique()) if not df_raw.empty else 0,
#         "img_score_columns":   img_score_cols,
#         "img_total_columns":   img_total_cols,
#         "img_other_columns":   img_other_cols,
#         "pdf_named_columns":   pdf_named_cols,
#         "pdf_section_columns": pdf_sec_cols,
#         "all_score_columns":   all_labelled,
#         "column_labels":       {col: make_label(col) for col in all_labelled},
#     }

#     path = output_dir / "nirf_meta.json"
#     with open(path, "w", encoding="utf-8") as f:
#         json.dump(meta, f, indent=2, ensure_ascii=False)

#     print(f"  ✓  nirf_meta.json")
#     print(f"     {len(years)} years | {len(cats)} categories | {len(sections)} sections")
#     print(f"     {len(img_score_cols)} img score | {len(img_total_cols)} img total | "
#           f"{len(img_other_cols)} img other")
#     print(f"     {len(pdf_named_cols)} pdf named | {len(pdf_sec_cols)} pdf section cols")

# # ─────────────────────────────────────────────────────────────────────────────
# # MAIN
# # ─────────────────────────────────────────────────────────────────────────────

# def main():
#     parser = argparse.ArgumentParser()
#     parser.add_argument("--input",  "-i", default="./downloads")
#     parser.add_argument("--output", "-o", default="./public/data")
#     args = parser.parse_args()

#     input_dir  = Path(args.input).resolve()
#     output_dir = Path(args.output).resolve()

#     if not input_dir.exists():
#         print(f"[ETL] Input folder not found: {input_dir}")
#         sys.exit(1)

#     output_dir.mkdir(parents=True, exist_ok=True)
#     print(f"[ETL] Input  : {input_dir}")
#     print(f"[ETL] Output : {output_dir}")

#     print(divider("SOURCE A  —  nirf-pdf-data.csv"))
#     pdf_files = find_pdf_csvs(input_dir)
#     print(f"  Found {len(pdf_files)} CSV file(s)")
#     df_pdf = load_all_pdf_csvs(pdf_files)

#     print(divider("SOURCE B  —  image-data.xlsx  (ALL columns from ALL years)"))
#     xlsx_files = find_image_xlsxs(input_dir)
#     print(f"  Found {len(xlsx_files)} Excel file(s)")
#     df_image = load_all_image_xlsxs(xlsx_files)

#     print(divider("OUTPUT 1  —  nirf_raw.parquet"))
#     if not df_pdf.empty:
#         write_parquet(df_pdf, output_dir / "nirf_raw.parquet", "nirf_raw.parquet")
#     else:
#         print("  [SKIP] No PDF data.")

#     print(divider("OUTPUT 2  —  nirf_scores.parquet"))
#     df_pdf_agg = aggregate_pdf(df_pdf)
#     df_scores  = merge_sources(df_image, df_pdf_agg)
#     if not df_scores.empty:
#         write_parquet(df_scores, output_dir / "nirf_scores.parquet", "nirf_scores.parquet")
#     else:
#         print("  [SKIP] No scores data.")

#     print(divider("OUTPUT 3  —  nirf_meta.json"))
#     write_metadata(df_pdf, df_scores, output_dir)

#     print(divider("DONE ✅"))
#     print(f"  Raw rows      : {len(df_pdf):,}")
#     print(f"  Score rows    : {len(df_scores):,}")
#     print(f"  Score columns : {len(df_scores.columns) if not df_scores.empty else 0}")
#     print(f"  Output        : {output_dir}\n")

# if __name__ == "__main__":
#     main()









































# #!/usr/bin/env python3
# """
# nirf_etl.py  —  NIRF multi-source ETL pipeline (fully dynamic columns)
# =======================================================================
# Takes ALL columns from ALL files regardless of year or naming variation.
# Handles encoding differences, delimiter differences, and column name
# variations across years (2016-2025).

# KEY FIX (v2): The 'year' column in nirf-pdf-data.csv contains academic year
# strings like "2023-24 (Graduation Year)" — it must NOT be aliased to
# 'ranking_year'. The ranking_year is a separate integer column. Removing
# "year" -> "ranking_year" from COLUMN_ALIASES preserves both correctly.
# """

# import argparse
# import json
# import sys
# import re
# from pathlib import Path


# def check_deps():
#     missing = []
#     for pkg in ["pandas", "pyarrow", "openpyxl", "tqdm"]:
#         try:
#             __import__(pkg)
#         except ImportError:
#             missing.append(pkg)
#     if missing:
#         print(f"[ETL] Missing packages: {', '.join(missing)}")
#         print(f"[ETL] Run:  pip install {' '.join(missing)}")
#         sys.exit(1)

# check_deps()

# import pandas as pd
# from tqdm import tqdm

# # ── Constants ─────────────────────────────────────────────────────────────────

# # The CSV written by extractor.ts has exactly these 9 columns (in this order):
# # ranking_year | category | institute_code | institute_name |
# # section | program | year | metric | value
# #
# # 'year' = academic year string e.g. "2023-24", "2022-23 (Graduation Year)"
# # 'ranking_year' = integer year of the NIRF ranking e.g. 2023, 2024, 2025

# PDF_COLUMNS = [
#     "ranking_year", "category", "institute_code", "institute_name",
#     "section", "program", "year", "metric", "value",
# ]

# JOIN_KEY = ["ranking_year", "category", "institute_code", "institute_name"]

# # Column name normalisation map.
# # IMPORTANT: "year" is intentionally NOT mapped to "ranking_year".
# # The CSV 'year' column holds academic year strings ("2023-24 (Graduation Year)")
# # which must be preserved as-is. The 'ranking_year' column holds the integer
# # ranking year and is already correctly named in the CSV.
# COLUMN_ALIASES = {
#     # ranking year (integer — the NIRF edition year)
#     "rankingyear":           "ranking_year",
#     "ranking_year":          "ranking_year",
#     # institute code
#     "institutecode":         "institute_code",
#     "institute_code":        "institute_code",
#     "instcode":              "institute_code",
#     "inst_code":             "institute_code",
#     # institute name
#     "institutename":         "institute_name",
#     "institute_name":        "institute_name",
#     "instname":              "institute_name",
#     "inst_name":             "institute_name",
#     # category
#     "category":              "category",
#     "type":                  "category",
#     # section
#     "section":               "section",
#     "sectionname":           "section",
#     # program
#     "program":               "program",
#     "programme":             "program",
#     "programname":           "program",
#     # year — academic year string, keep as "year" (do NOT map to ranking_year)
#     "year":                  "year",
#     # metric / value
#     "metric":                "metric",
#     "metricname":            "metric",
#     "value":                 "value",
#     "metricvalue":           "value",
# }

# # ── Helpers ───────────────────────────────────────────────────────────────────

# def norm_col(name: str) -> str:
#     """Normalise any column name to safe snake_case."""
#     return re.sub(r"[^a-z0-9_]", "",
#         name.strip().lower()
#             .replace(" ", "_").replace("-", "_")
#             .replace("(", "").replace(")", "")
#             .replace("/", "_").replace(".", "_")
#     ).strip("_")

# def resolve_col(name: str) -> str:
#     """Map a normalised column name to its canonical form if known."""
#     n = norm_col(name)
#     return COLUMN_ALIASES.get(n, n)

# def normalise_str(s: pd.Series) -> pd.Series:
#     return s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

# def to_numeric(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce")

# def to_int(s: pd.Series) -> pd.Series:
#     return pd.to_numeric(s, errors="coerce").astype("Int64")

# def valid_institute_code(s: pd.Series) -> pd.Series:
#     """Accept all historical NIRF code formats."""
#     pattern = (
#         r"^("
#         r"NIRF-[A-Z]+-[A-Z0-9]+(-[A-Z0-9]+)?"
#         r"|IR17-[A-Z]+-\d+-\d+(-[A-Z0-9]+)*"
#         r"|IR-\d+-[A-Z]+-[A-Z]+-[A-Z]-\d+"
#         r"|IR-[A-Z]-[A-Z]-\d+"
#         r")$"
#     )
#     return s.str.match(pattern, na=False)

# def divider(label: str) -> str:
#     return f"\n{'─'*60}\n  {label}\n{'─'*60}"

# # Known category mappings
# CATEGORY_MAP = {
#     'engineering':                    'Engineering',
#     'management':                     'Management',
#     'pharmacy':                       'Pharmacy',
#     'medical':                        'Medical',
#     'law':                            'Law',
#     'architecture':                   'Architecture',
#     'university':                     'University',
#     'college':                        'College',
#     'overall':                        'Overall',
#     'research':                       'Research',
#     'dental':                         'Dental',
#     'agriculture':                    'Agriculture',
#     'statepublicuniversity':          'State Public University',
#     'statepublicuniversityranking':   'State Public University',
#     'openuniversityranking':          'Open University',
#     'universityranking':              'University',
#     'skilluniversityranking':         'Skill University',
#     'skillindia':                     'Skill University',
#     'sdginstitutionsranking':         'Research',
#     'innovationranking':              'Innovation',
# }

# def normalise_category(s: pd.Series) -> pd.Series:
#     def fix(val):
#         if not isinstance(val, str) or not val.strip():
#             return val
#         v = val.strip()
#         key = v.lower().replace(' ', '').replace('-', '').replace('_', '')
#         if key in CATEGORY_MAP:
#             return CATEGORY_MAP[key]
#         spaced = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', v)
#         return spaced.title()
#     return s.apply(fix)

# def try_read_csv(path: Path) -> tuple:
#     """Try multiple encodings and delimiters to read a CSV robustly."""
#     encodings  = ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]
#     delimiters = [",", ";", "\t", "|"]

#     for enc in encodings:
#         for delim in delimiters:
#             try:
#                 df = pd.read_csv(
#                     path,
#                     dtype=str,
#                     encoding=enc,
#                     sep=delim,
#                     na_values=["", "N/A", "NA", "null", "NULL", "nan"],
#                     keep_default_na=True,
#                     on_bad_lines="skip",
#                     engine="python",
#                 )
#                 if len(df.columns) >= 2 and len(df) > 0:
#                     return df, enc, delim
#             except Exception:
#                 continue

#     return pd.DataFrame(), "none", "none"

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE A  —  nirf-pdf-data.csv
# # ─────────────────────────────────────────────────────────────────────────────

# def find_pdf_csvs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("nirf-pdf-data.csv"))

# def load_one_pdf_csv(path: Path) -> pd.DataFrame:
#     df, enc, delim = try_read_csv(path)

#     if df.empty:
#         print(f"  [WARN] Could not parse {path} with any encoding/delimiter")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     raw_cols = df.columns.tolist()

#     # Resolve all column names to canonical form
#     df.columns = [resolve_col(c) for c in df.columns]

#     # Remove duplicate column names — keep first occurrence
#     seen_cols = {}
#     dedup_cols = []
#     for i, col in enumerate(df.columns):
#         if col not in seen_cols:
#             seen_cols[col] = i
#             dedup_cols.append(col)
#         else:
#             dedup_cols.append(f"__drop_{i}__")
#     df.columns = dedup_cols
#     df = df.drop(columns=[c for c in df.columns if c.startswith("__drop_")])

#     # If ranking_year is missing but there's a column with 4-digit integers, use it
#     if "ranking_year" not in df.columns:
#         for col in df.columns:
#             if col in PDF_COLUMNS:
#                 continue
#             sample = df[col].dropna().head(5).tolist()
#             if all(str(v).strip().isdigit() and len(str(v).strip()) == 4
#                    for v in sample if str(v).strip()):
#                 df = df.rename(columns={col: "ranking_year"})
#                 break

#     # If ranking_year looks like academic year strings instead of integers,
#     # it means "year" was accidentally aliased to "ranking_year" (old bug guard)
#     if "ranking_year" in df.columns and "year" not in df.columns:
#         sample = df["ranking_year"].dropna().head(5).tolist()
#         has_acad_year = any(
#             isinstance(v, str) and re.match(r'^\d{4}-\d{2}', str(v).strip())
#             for v in sample
#         )
#         if has_acad_year:
#             tqdm.write(f"    [WARN] 'ranking_year' column contains academic year strings — "
#                        f"renaming back to 'year'. Check CSV headers in {path.name}")
#             df = df.rename(columns={"ranking_year": "year"})

#     # Ensure all expected columns exist
#     for col in PDF_COLUMNS:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df = df[PDF_COLUMNS].copy()

#     # Clean string columns
#     for col in ["category", "institute_code", "institute_name",
#                 "section", "program", "metric", "value", "year"]:
#         df[col] = normalise_str(df[col])

#     df["ranking_year"]   = to_int(df["ranking_year"])
#     df["category"]       = normalise_category(df["category"])
#     df["institute_name"] = (
#         df["institute_name"]
#         .str.replace(r"^[^A-Za-z]+", "", regex=True)
#         .str.strip()
#     )
#     df["value"] = df["value"].str.replace(",", "", regex=False)

#     # Normalise year column: keep "-" and real academic years, blank out junk
#     # Valid values: "2023-24", "2022-23 (Graduation Year)", "2021-22 (Intake Year)", "-", ""
#     # Invalid: "nan", "<NA>", None → replace with "-"
#     bad_year = {"nan", "<na>", "none", "null", "undefined", ""}
#     df["year"] = df["year"].apply(
#         lambda v: "-" if str(v).strip().lower() in bad_year else str(v).strip()
#     )

#     # Filter valid institute codes
#     before = len(df)
#     mask = valid_institute_code(df["institute_code"])
#     dropped = df[~mask]
#     if not dropped.empty:
#         sample_codes = dropped["institute_code"].dropna().unique()[:5].tolist()
#         tqdm.write(f"    [DEBUG] {len(dropped):,} rows dropped — unmatched codes: {sample_codes}")
#     df = df[mask]

#     tqdm.write(
#         f"    {path.parent.name}/nirf-pdf-data.csv  →  {len(df):,} rows "
#         f"[enc={enc}, sep='{delim}', cols={raw_cols[:5]}...]"
#     )

#     if len(df) == 0 and before > 0:
#         tqdm.write(
#             f"    [WARN] All {before} rows dropped — institute codes didn't match pattern"
#         )

#     return df

# def load_all_pdf_csvs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No nirf-pdf-data.csv files found.")
#         return pd.DataFrame(columns=PDF_COLUMNS)

#     frames = []
#     for f in tqdm(files, unit="csv", desc="  PDF CSVs"):
#         df = load_one_pdf_csv(f)
#         frames.append(df)

#     combined = pd.concat(frames, ignore_index=True)
#     before = len(combined)
#     combined = combined.drop_duplicates()
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")

#     # Report year column health
#     year_filled = combined["year"].notna() & (combined["year"] != "-") & (combined["year"] != "")
#     print(f"  Year column: {year_filled.sum():,} rows with real academic year "
#           f"({100*year_filled.mean():.1f}%)")

#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # SOURCE B  —  image-data.xlsx
# # ─────────────────────────────────────────────────────────────────────────────

# def find_image_xlsxs(input_dir: Path) -> list:
#     return sorted(input_dir.rglob("image-data.xlsx"))

# def load_one_image_xlsx(path: Path) -> pd.DataFrame:
#     df = pd.DataFrame()

#     try:
#         xl = __import__("openpyxl").load_workbook(path, read_only=True, data_only=True)
#         sheet_names = xl.sheetnames
#         tqdm.write(f"    [DEBUG] {path.parent.name} sheets: {sheet_names}")
#         for sname in sheet_names:
#             ws = xl[sname]
#             rows = list(ws.iter_rows(max_row=3, values_only=True))
#             tqdm.write(f"    [DEBUG]   sheet='{sname}' first 3 rows: {rows}")
#         xl.close()
#     except Exception as e:
#         tqdm.write(f"    [DEBUG] openpyxl inspect failed: {e}")

#     for header_row in [0, 1, 2]:
#         try:
#             candidate = pd.read_excel(
#                 path, dtype=str, engine="openpyxl", header=header_row
#             )
#             cols_norm = [norm_col(c) for c in candidate.columns]

#             code_col_idx = None
#             for i, c in enumerate(cols_norm):
#                 if c in ('institute_code', 'institutecode', 'inst_code', 'instcode'):
#                     code_col_idx = i
#                     break

#             if code_col_idx is None:
#                 for i, col in enumerate(candidate.columns):
#                     sample = candidate[col].dropna().head(10).astype(str).tolist()
#                     if any(v.startswith('IR') or v.startswith('NIRF') for v in sample):
#                         code_col_idx = i
#                         break

#             if code_col_idx is not None:
#                 sample_codes = candidate.iloc[:, code_col_idx].dropna().head(5).astype(str).tolist()
#                 has_real_codes = any(
#                     bool(re.match(r'^(NIRF-|IR17-|IR-\d|IR-[A-Z])', v))
#                     for v in sample_codes
#                 )
#                 if has_real_codes:
#                     df = candidate
#                     tqdm.write(f"    {path.parent.name}/image-data.xlsx: using header_row={header_row}, {len(df)} rows")
#                     break
#         except Exception as e:
#             tqdm.write(f"    [WARN] header_row={header_row} failed: {e}")
#             continue

#     if df.empty:
#         tqdm.write(f"    [WARN] {path.parent.name}/image-data.xlsx: could not find valid data")
#         return pd.DataFrame()

#     def norm_img_col(name: str) -> str:
#         s = str(name).strip()
#         s = s.replace('OE+MIR', 'OEMIR').replace('oe+mir', 'oemir')
#         s = s.replace('PR+A', 'PRA').replace('pr+a', 'pra')
#         return norm_col(s)

#     df.columns = [norm_img_col(c) for c in df.columns]

#     rename_map = {}
#     for col in df.columns:
#         # For image data, 'year' or 'ranking_year' = the NIRF edition year (integer)
#         if col in ('year', 'ranking_year') and 'ranking_year' not in rename_map.values():
#             rename_map[col] = 'ranking_year'
#         elif col in ('institutename', 'inst_name', 'instname'):
#             rename_map[col] = 'institute_name'
#         elif col in ('institutecode', 'inst_code', 'instcode'):
#             rename_map[col] = 'institute_code'
#     df = df.rename(columns=rename_map)

#     # Deduplicate column names
#     seen = {}
#     dedup = []
#     for i, col in enumerate(df.columns):
#         if col not in seen:
#             seen[col] = i
#             dedup.append(col)
#         else:
#             dedup.append(f'__drop_{i}__')
#     df.columns = dedup
#     df = df.drop(columns=[c for c in df.columns if c.startswith('__drop_')])

#     for col in JOIN_KEY:
#         if col not in df.columns:
#             df[col] = pd.NA

#     df['ranking_year']   = to_int(df['ranking_year'])
#     df['category']       = normalise_category(df['category'])
#     df['institute_code'] = normalise_str(df['institute_code'])
#     df['institute_name'] = (
#         normalise_str(df['institute_name'])
#         .str.replace(r'^[^A-Za-z]+', '', regex=True)
#         .str.strip()
#     )

#     before_img = len(df)
#     df = df[valid_institute_code(df['institute_code'])]
#     dropped = before_img - len(df)
#     if dropped > 0:
#         tqdm.write(f"    [INFO] {path.parent.name}: dropped {dropped} rows with invalid/empty codes")

#     score_cols = [c for c in df.columns if c not in JOIN_KEY]
#     for col in score_cols:
#         df[col] = to_numeric(
#             df[col].astype(str).str.replace(',', '', regex=False)
#         )

#     tqdm.write(
#         f"    {path.parent.name}/image-data.xlsx  →  {len(df):,} rows | "
#         f"{len(score_cols)} data cols: {score_cols[:5]}{'...' if len(score_cols) > 5 else ''}"
#     )
#     return df


# def load_all_image_xlsxs(files: list) -> pd.DataFrame:
#     if not files:
#         print("  [INFO] No image-data.xlsx files found.")
#         return pd.DataFrame()

#     frames = []
#     all_score_cols = set()

#     for f in tqdm(files, unit="xlsx", desc="  Image XLSXs"):
#         df = load_one_image_xlsx(f)
#         score_cols = [c for c in df.columns if c not in JOIN_KEY]
#         all_score_cols.update(score_cols)
#         frames.append(df)

#     combined = pd.concat(frames, ignore_index=True, join="outer")
#     before = len(combined)
#     combined = combined.drop_duplicates(
#         subset=["ranking_year", "category", "institute_code"]
#     )
#     print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
#     print(f"  Total unique data columns across all years: {len(all_score_cols)}")
#     print(f"  All columns: {sorted(all_score_cols)}")
#     return combined

# # ─────────────────────────────────────────────────────────────────────────────
# # PDF AGGREGATION
# # ─────────────────────────────────────────────────────────────────────────────

# def aggregate_pdf(df_pdf: pd.DataFrame) -> pd.DataFrame:
#     if df_pdf.empty:
#         return pd.DataFrame(columns=JOIN_KEY)

#     print("  Aggregating PDF data...")
#     num = df_pdf.copy()
#     num["v"] = to_numeric(num["value"])
#     num = num[num["v"].notna()]

#     def agg(section_kw: str, metric_kw: str, fn: str = "sum") -> pd.Series:
#         mask = (
#             num["section"].str.contains(section_kw, case=False, na=False)
#             & num["metric"].str.contains(metric_kw, case=False, na=False)
#         )
#         sub = num[mask]
#         if sub.empty:
#             return pd.Series(dtype=float)
#         g = sub.groupby(JOIN_KEY)["v"]
#         return getattr(g, fn)()

#     named_aggregates = {
#         "pdf_total_intake":            agg("Sanctioned", "Intake"),
#         "pdf_placement_placed":        agg("Placement", r"No\. of students placed"),
#         "pdf_placement_higher":        agg("Placement", r"Higher Stud"),
#         "pdf_median_salary":           agg("Placement", r"[Mm]edian salary", "mean"),
#         "pdf_phd_ft_total":            agg(r"Ph\.D", r"Full Time Students"),
#         "pdf_phd_pt_total":            agg(r"Ph\.D", r"Part Time Students"),
#         "pdf_phd_ft_graduated":        agg(r"Ph\.D", r"Full Time Graduated"),
#         "pdf_phd_pt_graduated":        agg(r"Ph\.D", r"Part Time Graduated"),
#         "pdf_sponsored_projects":      agg("Sponsored Research", r"Sponsored Projects"),
#         "pdf_sponsored_amount":        agg("Sponsored Research", r"[Aa]mount"),
#         "pdf_consultancy_projects":    agg("Consultancy", r"Consultancy Projects"),
#         "pdf_consultancy_amount":      agg("Consultancy", r"[Aa]mount"),
#         "pdf_edp_participants":        agg("Executive Development", r"[Pp]articipants"),
#         "pdf_capital_expenditure":     agg("Capital expenditure", r"Utilised Amount$"),
#         "pdf_operational_expenditure": agg("Operational expenditure", r"Utilised Amount$"),
#     }

#     base = (
#         df_pdf[JOIN_KEY]
#         .drop_duplicates()
#         .dropna(subset=["ranking_year", "institute_code"])
#     )
#     result = base.copy()

#     for col_name, series in named_aggregates.items():
#         if not series.empty:
#             result = result.merge(
#                 series.rename(col_name).reset_index(),
#                 on=JOIN_KEY,
#                 how="left",
#             )

#     # Dynamic section pivot
#     section_sums = (
#         num.groupby(JOIN_KEY + ["section"])["v"]
#         .sum()
#         .unstack("section")
#         .reset_index()
#     )

#     seen = set(result.columns.tolist())
#     new_cols = {}
#     for col in section_sums.columns:
#         if col in JOIN_KEY:
#             continue
#         safe = "pdf_sec_" + re.sub(r"[^a-z0-9]+", "_",
#             str(col).lower().strip())[:40].strip("_")
#         candidate = safe
#         i = 2
#         while candidate in seen:
#             candidate = f"{safe}_{i}"
#             i += 1
#         new_cols[col] = candidate
#         seen.add(candidate)

#     section_sums = section_sums.rename(columns=new_cols)
#     result = pd.merge(result, section_sums, on=JOIN_KEY, how="outer")
#     result["ranking_year"] = to_int(result["ranking_year"])

#     for col in result.columns:
#         if result[col].dtype == "float64":
#             result[col] = result[col].round(2)

#     n_named   = sum(1 for c in result.columns if c.startswith("pdf_") and not c.startswith("pdf_sec_"))
#     n_section = sum(1 for c in result.columns if c.startswith("pdf_sec_"))
#     print(f"  PDF aggregates: {len(result):,} rows | "
#           f"{n_named} named + {n_section} section cols = {len(result.columns)} total")
#     return result

# # ─────────────────────────────────────────────────────────────────────────────
# # MERGE
# # ─────────────────────────────────────────────────────────────────────────────

# def merge_sources(df_image: pd.DataFrame, df_pdf_agg: pd.DataFrame) -> pd.DataFrame:
#     if not df_image.empty:
#         score_cols = [c for c in df_image.columns if c not in JOIN_KEY]
#         df_image = df_image.rename(columns={c: f"img_{c}" for c in score_cols})

#     if df_image.empty and df_pdf_agg.empty:
#         return pd.DataFrame(columns=JOIN_KEY)
#     if df_image.empty:
#         return df_pdf_agg.copy()
#     if df_pdf_agg.empty:
#         return df_image.copy()

#     merged = pd.merge(df_image, df_pdf_agg, on=JOIN_KEY, how="outer")
#     merged["ranking_year"] = to_int(merged["ranking_year"])
#     merged = merged.sort_values(
#         ["ranking_year", "category", "institute_code"],
#         ascending=[False, True, True],
#         na_position="last",
#     ).reset_index(drop=True)
#     return merged

# # ─────────────────────────────────────────────────────────────────────────────
# # OUTPUT
# # ─────────────────────────────────────────────────────────────────────────────

# def write_parquet(df: pd.DataFrame, path: Path, label: str) -> None:
#     df.to_parquet(path, engine="pyarrow", compression="snappy", index=False)
#     size_mb = path.stat().st_size / 1_048_576
#     print(f"  ✓  {label}  →  {len(df):,} rows × {len(df.columns)} cols  ({size_mb:.1f} MB)")

# def write_metadata(df_raw: pd.DataFrame, df_scores: pd.DataFrame, output_dir: Path) -> None:
#     years = sorted([int(y) for y in df_raw["ranking_year"].dropna().unique()]) \
#             if not df_raw.empty else []
#     cats  = sorted(df_raw["category"].dropna().unique().tolist()) \
#             if not df_raw.empty else []
#     sections = sorted(df_raw["section"].dropna().unique().tolist()) \
#                if "section" in df_raw.columns else []

#     all_cols       = df_scores.columns.tolist() if not df_scores.empty else []
#     img_score_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_score")]
#     img_total_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_total")]
#     img_other_cols = [c for c in all_cols if c.startswith("img_")
#                       and c not in img_score_cols and c not in img_total_cols]
#     pdf_named_cols = [c for c in all_cols if c.startswith("pdf_") and not c.startswith("pdf_sec_")]
#     pdf_sec_cols   = [c for c in all_cols if c.startswith("pdf_sec_")]

#     # Report year column health in metadata
#     year_stats = {}
#     if not df_raw.empty and "year" in df_raw.columns:
#         year_filled = df_raw["year"].notna() & ~df_raw["year"].isin(["-", "", "nan", "<NA>"])
#         year_stats = {
#             "total_rows": int(len(df_raw)),
#             "rows_with_year": int(year_filled.sum()),
#             "year_fill_pct": round(100 * year_filled.mean(), 1),
#             "sample_years": df_raw.loc[year_filled, "year"].value_counts().head(10).to_dict(),
#         }

#     def make_label(col: str) -> str:
#         return (col
#                 .replace("img_", "").replace("pdf_sec_", "").replace("pdf_", "")
#                 .replace("_score", " Score").replace("_total", " Total")
#                 .replace("_", " ").title())

#     all_labelled = img_score_cols + img_total_cols + img_other_cols + pdf_named_cols + pdf_sec_cols

#     meta = {
#         "ranking_years":       years,
#         "categories":          cats,
#         "sections":            sections,
#         "total_raw_rows":      int(len(df_raw)),
#         "total_institutes":    int(df_raw["institute_code"].nunique()) if not df_raw.empty else 0,
#         "img_score_columns":   img_score_cols,
#         "img_total_columns":   img_total_cols,
#         "img_other_columns":   img_other_cols,
#         "pdf_named_columns":   pdf_named_cols,
#         "pdf_section_columns": pdf_sec_cols,
#         "all_score_columns":   all_labelled,
#         "column_labels":       {col: make_label(col) for col in all_labelled},
#         # Expose score_columns and image_columns for dashboard dropdowns
#         "score_columns":       img_score_cols + img_total_cols,
#         "image_columns":       img_score_cols,
#         "pdf_agg_columns":     pdf_named_cols,
#         "year_stats":          year_stats,
#     }

#     path = output_dir / "nirf_meta.json"
#     with open(path, "w", encoding="utf-8") as f:
#         json.dump(meta, f, indent=2, ensure_ascii=False)

#     print(f"  ✓  nirf_meta.json")
#     print(f"     {len(years)} years | {len(cats)} categories | {len(sections)} sections")
#     print(f"     {len(img_score_cols)} img score | {len(img_total_cols)} img total | "
#           f"{len(img_other_cols)} img other")
#     print(f"     {len(pdf_named_cols)} pdf named | {len(pdf_sec_cols)} pdf section cols")
#     if year_stats:
#         print(f"     Year column: {year_stats.get('rows_with_year',0):,} / "
#               f"{year_stats.get('total_rows',0):,} rows have academic year "
#               f"({year_stats.get('year_fill_pct',0):.1f}%)")

# # ─────────────────────────────────────────────────────────────────────────────
# # MAIN
# # ─────────────────────────────────────────────────────────────────────────────

# def main():
#     parser = argparse.ArgumentParser(
#         description="NIRF ETL: CSV + Excel → Parquet\n\n"
#                     "Reads nirf-pdf-data.csv and image-data.xlsx from each year folder.\n"
#                     "The 'year' column in CSV contains academic year strings like\n"
#                     "'2023-24 (Graduation Year)' — these are preserved in nirf_raw.parquet."
#     )
#     parser.add_argument("--input",  "-i", default="./downloads")
#     parser.add_argument("--output", "-o", default="./public/data")
#     args = parser.parse_args()

#     input_dir  = Path(args.input).resolve()
#     output_dir = Path(args.output).resolve()

#     if not input_dir.exists():
#         print(f"[ETL] Input folder not found: {input_dir}")
#         sys.exit(1)

#     output_dir.mkdir(parents=True, exist_ok=True)
#     print(f"[ETL] Input  : {input_dir}")
#     print(f"[ETL] Output : {output_dir}")

#     print(divider("SOURCE A  —  nirf-pdf-data.csv"))
#     pdf_files = find_pdf_csvs(input_dir)
#     print(f"  Found {len(pdf_files)} CSV file(s)")
#     df_pdf = load_all_pdf_csvs(pdf_files)

#     print(divider("SOURCE B  —  image-data.xlsx  (ALL columns from ALL years)"))
#     xlsx_files = find_image_xlsxs(input_dir)
#     print(f"  Found {len(xlsx_files)} Excel file(s)")
#     df_image = load_all_image_xlsxs(xlsx_files)

#     print(divider("OUTPUT 1  —  nirf_raw.parquet"))
#     if not df_pdf.empty:
#         write_parquet(df_pdf, output_dir / "nirf_raw.parquet", "nirf_raw.parquet")
#         # Verify year column made it through
#         year_check = df_pdf["year"].notna() & ~df_pdf["year"].isin(["-", ""])
#         print(f"  Year column check: {year_check.sum():,} rows with real academic year values")
#         if year_check.sum() > 0:
#             print(f"  Sample year values: {df_pdf.loc[year_check, 'year'].value_counts().head(5).to_dict()}")
#         else:
#             print(f"  [WARN] Year column is empty — check CSV has 'Year' column with academic years")
#     else:
#         print("  [SKIP] No PDF data.")

#     print(divider("OUTPUT 2  —  nirf_scores.parquet"))
#     df_pdf_agg = aggregate_pdf(df_pdf)
#     df_scores  = merge_sources(df_image, df_pdf_agg)
#     if not df_scores.empty:
#         write_parquet(df_scores, output_dir / "nirf_scores.parquet", "nirf_scores.parquet")
#     else:
#         print("  [SKIP] No scores data.")

#     print(divider("OUTPUT 3  —  nirf_meta.json"))
#     write_metadata(df_pdf, df_scores, output_dir)

#     print(divider("DONE ✅"))
#     print(f"  Raw rows      : {len(df_pdf):,}")
#     print(f"  Score rows    : {len(df_scores):,}")
#     print(f"  Score columns : {len(df_scores.columns) if not df_scores.empty else 0}")
#     print(f"  Output        : {output_dir}\n")
#     print("  Next step: run 'python nirf_etl.py' to regenerate parquet files")
#     print("  The 'year' column will now contain real academic year values")
#     print("  e.g. '2023-24', '2022-23 (Graduation Year)', '2021-22 (Intake Year)'\n")

# if __name__ == "__main__":
#     main()




































#!/usr/bin/env python3
"""
nirf_etl.py  —  NIRF multi-source ETL pipeline (fully dynamic columns)
=======================================================================
Takes ALL columns from ALL files regardless of year or naming variation.
Handles encoding differences, delimiter differences, and column name
variations across years (2016-2025).

KEY FIX (v2): The 'year' column in nirf-pdf-data.csv contains academic year
strings like "2023-24 (Graduation Year)" — it must NOT be aliased to
'ranking_year'. The ranking_year is a separate integer column. Removing
"year" -> "ranking_year" from COLUMN_ALIASES preserves both correctly.
"""

import argparse
import json
import sys
import re
from pathlib import Path


def check_deps():
    missing = []
    for pkg in ["pandas", "pyarrow", "tqdm"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[ETL] Missing packages: {', '.join(missing)}")
        print(f"[ETL] Run:  pip install {' '.join(missing)}")
        sys.exit(1)

check_deps()

import pandas as pd
from tqdm import tqdm

# ── Constants ─────────────────────────────────────────────────────────────────

# The CSV written by extractor.ts has exactly these 9 columns (in this order):
# ranking_year | category | institute_code | institute_name |
# section | program | year | metric | value
#
# 'year' = academic year string e.g. "2023-24", "2022-23 (Graduation Year)"
# 'ranking_year' = integer year of the NIRF ranking e.g. 2023, 2024, 2025

PDF_COLUMNS = [
    "ranking_year", "category", "institute_code", "institute_name",
    "section", "program", "year", "metric", "value",
]

JOIN_KEY = ["ranking_year", "category", "institute_code", "institute_name"]

# Column name normalisation map.
# IMPORTANT: "year" is intentionally NOT mapped to "ranking_year".
# The CSV 'year' column holds academic year strings ("2023-24 (Graduation Year)")
# which must be preserved as-is. The 'ranking_year' column holds the integer
# ranking year and is already correctly named in the CSV.
COLUMN_ALIASES = {
    # ranking year (integer — the NIRF edition year)
    "rankingyear":           "ranking_year",
    "ranking_year":          "ranking_year",
    # institute code
    "institutecode":         "institute_code",
    "institute_code":        "institute_code",
    "instcode":              "institute_code",
    "inst_code":             "institute_code",
    # institute name
    "institutename":         "institute_name",
    "institute_name":        "institute_name",
    "instname":              "institute_name",
    "inst_name":             "institute_name",
    # category
    "category":              "category",
    "type":                  "category",
    # section
    "section":               "section",
    "sectionname":           "section",
    # program
    "program":               "program",
    "programme":             "program",
    "programname":           "program",
    # year — academic year string, keep as "year" (do NOT map to ranking_year)
    "year":                  "year",
    # metric / value
    "metric":                "metric",
    "metricname":            "metric",
    "value":                 "value",
    "metricvalue":           "value",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def norm_col(name: str) -> str:
    """Normalise any column name to safe snake_case."""
    return re.sub(r"[^a-z0-9_]", "",
        name.strip().lower()
            .replace(" ", "_").replace("-", "_")
            .replace("(", "").replace(")", "")
            .replace("/", "_").replace(".", "_")
    ).strip("_")

def resolve_col(name: str) -> str:
    """Map a normalised column name to its canonical form if known."""
    n = norm_col(name)
    return COLUMN_ALIASES.get(n, n)

def normalise_str(s: pd.Series) -> pd.Series:
    return s.astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

def to_numeric(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce")

def to_int(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce").astype("Int64")

def valid_institute_code(s: pd.Series) -> pd.Series:
    """Accept all historical NIRF code formats."""
    pattern = (
        r"^("
        r"NIRF-[A-Z]+-[A-Z0-9]+(-[A-Z0-9]+)?"
        r"|IR17-[A-Z]+-\d+-\d+(-[A-Z0-9]+)*"
        r"|IR-\d+-[A-Z]+-[A-Z]+-[A-Z]-\d+"
        r"|IR-[A-Z]-[A-Z]-\d+"
        r")$"
    )
    return s.str.match(pattern, na=False)

def divider(label: str) -> str:
    return f"\n{'─'*60}\n  {label}\n{'─'*60}"

# Known category mappings
CATEGORY_MAP = {
    'engineering':                    'Engineering',
    'management':                     'Management',
    'pharmacy':                       'Pharmacy',
    'medical':                        'Medical',
    'law':                            'Law',
    'architecture':                   'Architecture',
    'university':                     'University',
    'college':                        'College',
    'overall':                        'Overall',
    'research':                       'Research',
    'dental':                         'Dental',
    'agriculture':                    'Agriculture',
    'statepublicuniversity':          'State Public University',
    'statepublicuniversityranking':   'State Public University',
    'openuniversityranking':          'Open University',
    'universityranking':              'University',
    'skilluniversityranking':         'Skill University',
    'skillindia':                     'Skill University',
    'sdginstitutionsranking':         'Research',
    'innovationranking':              'Innovation',
}

def normalise_category(s: pd.Series) -> pd.Series:
    def fix(val):
        if not isinstance(val, str) or not val.strip():
            return val
        v = val.strip()
        key = v.lower().replace(' ', '').replace('-', '').replace('_', '')
        if key in CATEGORY_MAP:
            return CATEGORY_MAP[key]
        spaced = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', v)
        return spaced.title()
    return s.apply(fix)

def try_read_csv(path: Path) -> tuple:
    """Try multiple encodings and delimiters to read a CSV robustly."""
    encodings  = ["utf-8-sig", "utf-8", "latin-1", "cp1252", "iso-8859-1"]
    delimiters = [",", ";", "\t", "|"]

    for enc in encodings:
        for delim in delimiters:
            try:
                df = pd.read_csv(
                    path,
                    dtype=str,
                    encoding=enc,
                    sep=delim,
                    na_values=["", "N/A", "NA", "null", "NULL", "nan"],
                    keep_default_na=True,
                    on_bad_lines="skip",
                    engine="python",
                )
                if len(df.columns) >= 2 and len(df) > 0:
                    return df, enc, delim
            except Exception:
                continue

    return pd.DataFrame(), "none", "none"

# ─────────────────────────────────────────────────────────────────────────────
# SOURCE A  —  nirf-pdf-data.csv
# ─────────────────────────────────────────────────────────────────────────────

def find_pdf_csvs(input_dir: Path) -> list:
    return sorted(input_dir.rglob("nirf-pdf-data.csv"))

def load_one_pdf_csv(path: Path) -> pd.DataFrame:
    df, enc, delim = try_read_csv(path)

    if df.empty:
        print(f"  [WARN] Could not parse {path} with any encoding/delimiter")
        return pd.DataFrame(columns=PDF_COLUMNS)

    raw_cols = df.columns.tolist()

    # Resolve all column names to canonical form
    df.columns = [resolve_col(c) for c in df.columns]

    # Remove duplicate column names — keep first occurrence
    seen_cols = {}
    dedup_cols = []
    for i, col in enumerate(df.columns):
        if col not in seen_cols:
            seen_cols[col] = i
            dedup_cols.append(col)
        else:
            dedup_cols.append(f"__drop_{i}__")
    df.columns = dedup_cols
    df = df.drop(columns=[c for c in df.columns if c.startswith("__drop_")])

    # If ranking_year is missing but there's a column with 4-digit integers, use it
    if "ranking_year" not in df.columns:
        for col in df.columns:
            if col in PDF_COLUMNS:
                continue
            sample = df[col].dropna().head(5).tolist()
            if all(str(v).strip().isdigit() and len(str(v).strip()) == 4
                   for v in sample if str(v).strip()):
                df = df.rename(columns={col: "ranking_year"})
                break

    # If ranking_year looks like academic year strings instead of integers,
    # it means "year" was accidentally aliased to "ranking_year" (old bug guard)
    if "ranking_year" in df.columns and "year" not in df.columns:
        sample = df["ranking_year"].dropna().head(5).tolist()
        has_acad_year = any(
            isinstance(v, str) and re.match(r'^\d{4}-\d{2}', str(v).strip())
            for v in sample
        )
        if has_acad_year:
            tqdm.write(f"    [WARN] 'ranking_year' column contains academic year strings — "
                       f"renaming back to 'year'. Check CSV headers in {path.name}")
            df = df.rename(columns={"ranking_year": "year"})

    # Ensure all expected columns exist
    for col in PDF_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    df = df[PDF_COLUMNS].copy()

    # Clean string columns
    for col in ["category", "institute_code", "institute_name",
                "section", "program", "metric", "value", "year"]:
        df[col] = normalise_str(df[col])

    df["ranking_year"]   = to_int(df["ranking_year"])
    df["category"]       = normalise_category(df["category"])
    df["institute_name"] = (
        df["institute_name"]
        .str.replace(r"^[^A-Za-z]+", "", regex=True)
        .str.strip()
    )
    df["value"] = df["value"].str.replace(",", "", regex=False)

    # Normalise year column: keep "-" and real academic years, blank out junk
    # Valid values: "2023-24", "2022-23 (Graduation Year)", "2021-22 (Intake Year)", "-", ""
    # Invalid: "nan", "<NA>", None → replace with "-"
    bad_year = {"nan", "<na>", "none", "null", "undefined", ""}
    df["year"] = df["year"].apply(
        lambda v: "-" if str(v).strip().lower() in bad_year else str(v).strip()
    )

    # Filter valid institute codes
    before = len(df)
    mask = valid_institute_code(df["institute_code"])
    dropped = df[~mask]
    if not dropped.empty:
        sample_codes = dropped["institute_code"].dropna().unique()[:5].tolist()
        tqdm.write(f"    [DEBUG] {len(dropped):,} rows dropped — unmatched codes: {sample_codes}")
    df = df[mask]

    tqdm.write(
        f"    {path.parent.name}/nirf-pdf-data.csv  →  {len(df):,} rows "
        f"[enc={enc}, sep='{delim}', cols={raw_cols[:5]}...]"
    )

    if len(df) == 0 and before > 0:
        tqdm.write(
            f"    [WARN] All {before} rows dropped — institute codes didn't match pattern"
        )

    return df

def load_all_pdf_csvs(files: list) -> pd.DataFrame:
    if not files:
        print("  [INFO] No nirf-pdf-data.csv files found.")
        return pd.DataFrame(columns=PDF_COLUMNS)

    frames = []
    for f in tqdm(files, unit="csv", desc="  PDF CSVs"):
        df = load_one_pdf_csv(f)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    before = len(combined)
    combined = combined.drop_duplicates()
    print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")

    # Report year column health
    year_filled = combined["year"].notna() & (combined["year"] != "-") & (combined["year"] != "")
    print(f"  Year column: {year_filled.sum():,} rows with real academic year "
          f"({100*year_filled.mean():.1f}%)")

    return combined

# ─────────────────────────────────────────────────────────────────────────────
# SOURCE B  —  image-data.csv
# ─────────────────────────────────────────────────────────────────────────────

def find_image_csvs(input_dir: Path) -> list:
    return sorted(input_dir.rglob("image-data.csv"))

def load_one_image_csv(path: Path) -> pd.DataFrame:
    df, enc, delim = try_read_csv(path)

    if df.empty:
        tqdm.write(f"    [WARN] {path.parent.name}/image-data.csv: could not find valid data")
        return pd.DataFrame()

    raw_cols = df.columns.tolist()
    tqdm.write(f"    [DEBUG] {path.parent.name} columns: {raw_cols[:10]}{'...' if len(raw_cols) > 10 else ''}")

    def norm_img_col(name: str) -> str:
        s = str(name).strip()
        s = s.replace('OE+MIR', 'OEMIR').replace('oe+mir', 'oemir')
        s = s.replace('PR+A', 'PRA').replace('pr+a', 'pra')
        return norm_col(s)

    df.columns = [norm_img_col(c) for c in df.columns]

    rename_map = {}
    for col in df.columns:
        # For image data, 'year' or 'ranking_year' = the NIRF edition year (integer)
        if col in ('year', 'ranking_year') and 'ranking_year' not in rename_map.values():
            rename_map[col] = 'ranking_year'
        elif col in ('institutename', 'inst_name', 'instname'):
            rename_map[col] = 'institute_name'
        elif col in ('institutecode', 'inst_code', 'instcode'):
            rename_map[col] = 'institute_code'
    df = df.rename(columns=rename_map)

    # Deduplicate column names
    seen = {}
    dedup = []
    for i, col in enumerate(df.columns):
        if col not in seen:
            seen[col] = i
            dedup.append(col)
        else:
            dedup.append(f'__drop_{i}__')
    df.columns = dedup
    df = df.drop(columns=[c for c in df.columns if c.startswith('__drop_')])

    for col in JOIN_KEY:
        if col not in df.columns:
            df[col] = pd.NA

    df['ranking_year']   = to_int(df['ranking_year'])
    df['category']       = normalise_category(df['category'])
    df['institute_code'] = normalise_str(df['institute_code'])
    df['institute_name'] = (
        normalise_str(df['institute_name'])
        .str.replace(r'^[^A-Za-z]+', '', regex=True)
        .str.strip()
    )

    before_img = len(df)
    df = df[valid_institute_code(df['institute_code'])]
    dropped = before_img - len(df)
    if dropped > 0:
        tqdm.write(f"    [INFO] {path.parent.name}: dropped {dropped} rows with invalid/empty codes")

    score_cols = [c for c in df.columns if c not in JOIN_KEY]
    for col in score_cols:
        df[col] = to_numeric(
            df[col].astype(str).str.replace(',', '', regex=False)
        )

    tqdm.write(
        f"    {path.parent.name}/image-data.csv  →  {len(df):,} rows | "
        f"{len(score_cols)} data cols: {score_cols[:5]}{'...' if len(score_cols) > 5 else ''}"
    )
    return df


def load_all_image_csvs(files: list) -> pd.DataFrame:
    if not files:
        print("  [INFO] No image-data.csv files found.")
        return pd.DataFrame()

    frames = []
    all_score_cols = set()

    for f in tqdm(files, unit="csv", desc="  Image CSVs"):
        df = load_one_image_csv(f)
        score_cols = [c for c in df.columns if c not in JOIN_KEY]
        all_score_cols.update(score_cols)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True, join="outer")
    before = len(combined)
    combined = combined.drop_duplicates(
        subset=["ranking_year", "category", "institute_code"]
    )
    print(f"  Dropped {before - len(combined):,} duplicates  →  {len(combined):,} rows total")
    print(f"  Total unique data columns across all years: {len(all_score_cols)}")
    print(f"  All columns: {sorted(all_score_cols)}")
    return combined

# ─────────────────────────────────────────────────────────────────────────────
# PDF AGGREGATION
# ─────────────────────────────────────────────────────────────────────────────

def aggregate_pdf(df_pdf: pd.DataFrame) -> pd.DataFrame:
    if df_pdf.empty:
        return pd.DataFrame(columns=JOIN_KEY)

    print("  Aggregating PDF data...")
    num = df_pdf.copy()
    num["v"] = to_numeric(num["value"])
    num = num[num["v"].notna()]

    def agg(section_kw: str, metric_kw: str, fn: str = "sum") -> pd.Series:
        mask = (
            num["section"].str.contains(section_kw, case=False, na=False)
            & num["metric"].str.contains(metric_kw, case=False, na=False)
        )
        sub = num[mask]
        if sub.empty:
            return pd.Series(dtype=float)
        g = sub.groupby(JOIN_KEY)["v"]
        return getattr(g, fn)()

    named_aggregates = {
        "pdf_total_intake":            agg("Sanctioned", "Intake"),
        "pdf_placement_placed":        agg("Placement", r"No\. of students placed"),
        "pdf_placement_higher":        agg("Placement", r"Higher Stud"),
        "pdf_median_salary":           agg("Placement", r"[Mm]edian salary", "mean"),
        "pdf_phd_ft_total":            agg(r"Ph\.D", r"Full Time Students"),
        "pdf_phd_pt_total":            agg(r"Ph\.D", r"Part Time Students"),
        "pdf_phd_ft_graduated":        agg(r"Ph\.D", r"Full Time Graduated"),
        "pdf_phd_pt_graduated":        agg(r"Ph\.D", r"Part Time Graduated"),
        "pdf_sponsored_projects":      agg("Sponsored Research", r"Sponsored Projects"),
        "pdf_sponsored_amount":        agg("Sponsored Research", r"[Aa]mount"),
        "pdf_consultancy_projects":    agg("Consultancy", r"Consultancy Projects"),
        "pdf_consultancy_amount":      agg("Consultancy", r"[Aa]mount"),
        "pdf_edp_participants":        agg("Executive Development", r"[Pp]articipants"),
        "pdf_capital_expenditure":     agg("Capital expenditure", r"Utilised Amount$"),
        "pdf_operational_expenditure": agg("Operational expenditure", r"Utilised Amount$"),
    }

    base = (
        df_pdf[JOIN_KEY]
        .drop_duplicates()
        .dropna(subset=["ranking_year", "institute_code"])
    )
    result = base.copy()

    for col_name, series in named_aggregates.items():
        if not series.empty:
            result = result.merge(
                series.rename(col_name).reset_index(),
                on=JOIN_KEY,
                how="left",
            )

    # Dynamic section pivot
    section_sums = (
        num.groupby(JOIN_KEY + ["section"])["v"]
        .sum()
        .unstack("section")
        .reset_index()
    )

    seen = set(result.columns.tolist())
    new_cols = {}
    for col in section_sums.columns:
        if col in JOIN_KEY:
            continue
        safe = "pdf_sec_" + re.sub(r"[^a-z0-9]+", "_",
            str(col).lower().strip())[:40].strip("_")
        candidate = safe
        i = 2
        while candidate in seen:
            candidate = f"{safe}_{i}"
            i += 1
        new_cols[col] = candidate
        seen.add(candidate)

    section_sums = section_sums.rename(columns=new_cols)
    result = pd.merge(result, section_sums, on=JOIN_KEY, how="outer")
    result["ranking_year"] = to_int(result["ranking_year"])

    for col in result.columns:
        if result[col].dtype == "float64":
            result[col] = result[col].round(2)

    n_named   = sum(1 for c in result.columns if c.startswith("pdf_") and not c.startswith("pdf_sec_"))
    n_section = sum(1 for c in result.columns if c.startswith("pdf_sec_"))
    print(f"  PDF aggregates: {len(result):,} rows | "
          f"{n_named} named + {n_section} section cols = {len(result.columns)} total")
    return result

# ─────────────────────────────────────────────────────────────────────────────
# MERGE
# ─────────────────────────────────────────────────────────────────────────────

def merge_sources(df_image: pd.DataFrame, df_pdf_agg: pd.DataFrame) -> pd.DataFrame:
    if not df_image.empty:
        score_cols = [c for c in df_image.columns if c not in JOIN_KEY]
        df_image = df_image.rename(columns={c: f"img_{c}" for c in score_cols})

    if df_image.empty and df_pdf_agg.empty:
        return pd.DataFrame(columns=JOIN_KEY)
    if df_image.empty:
        return df_pdf_agg.copy()
    if df_pdf_agg.empty:
        return df_image.copy()

    merged = pd.merge(df_image, df_pdf_agg, on=JOIN_KEY, how="outer")
    merged["ranking_year"] = to_int(merged["ranking_year"])
    merged = merged.sort_values(
        ["ranking_year", "category", "institute_code"],
        ascending=[False, True, True],
        na_position="last",
    ).reset_index(drop=True)
    return merged

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────────────────────────────────────────

def write_parquet(df: pd.DataFrame, path: Path, label: str) -> None:
    df.to_parquet(path, engine="pyarrow", compression="snappy", index=False)
    size_mb = path.stat().st_size / 1_048_576
    print(f"  ✓  {label}  →  {len(df):,} rows × {len(df.columns)} cols  ({size_mb:.1f} MB)")

def write_metadata(df_raw: pd.DataFrame, df_scores: pd.DataFrame, output_dir: Path) -> None:
    years = sorted([int(y) for y in df_raw["ranking_year"].dropna().unique()]) \
            if not df_raw.empty else []
    cats  = sorted(df_raw["category"].dropna().unique().tolist()) \
            if not df_raw.empty else []
    sections = sorted(df_raw["section"].dropna().unique().tolist()) \
               if "section" in df_raw.columns else []

    all_cols       = df_scores.columns.tolist() if not df_scores.empty else []
    img_score_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_score")]
    img_total_cols = [c for c in all_cols if c.startswith("img_") and c.endswith("_total")]
    img_other_cols = [c for c in all_cols if c.startswith("img_")
                      and c not in img_score_cols and c not in img_total_cols]
    pdf_named_cols = [c for c in all_cols if c.startswith("pdf_") and not c.startswith("pdf_sec_")]
    pdf_sec_cols   = [c for c in all_cols if c.startswith("pdf_sec_")]

    # Report year column health in metadata
    year_stats = {}
    if not df_raw.empty and "year" in df_raw.columns:
        year_filled = df_raw["year"].notna() & ~df_raw["year"].isin(["-", "", "nan", "<NA>"])
        year_stats = {
            "total_rows": int(len(df_raw)),
            "rows_with_year": int(year_filled.sum()),
            "year_fill_pct": round(100 * year_filled.mean(), 1),
            "sample_years": df_raw.loc[year_filled, "year"].value_counts().head(10).to_dict(),
        }

    def make_label(col: str) -> str:
        return (col
                .replace("img_", "").replace("pdf_sec_", "").replace("pdf_", "")
                .replace("_score", " Score").replace("_total", " Total")
                .replace("_", " ").title())

    all_labelled = img_score_cols + img_total_cols + img_other_cols + pdf_named_cols + pdf_sec_cols

    meta = {
        "ranking_years":       years,
        "categories":          cats,
        "sections":            sections,
        "total_raw_rows":      int(len(df_raw)),
        "total_institutes":    int(df_raw["institute_code"].nunique()) if not df_raw.empty else 0,
        "img_score_columns":   img_score_cols,
        "img_total_columns":   img_total_cols,
        "img_other_columns":   img_other_cols,
        "pdf_named_columns":   pdf_named_cols,
        "pdf_section_columns": pdf_sec_cols,
        "all_score_columns":   all_labelled,
        "column_labels":       {col: make_label(col) for col in all_labelled},
        # Expose score_columns and image_columns for dashboard dropdowns
        "score_columns":       img_score_cols + img_total_cols,
        "image_columns":       img_score_cols,
        "pdf_agg_columns":     pdf_named_cols,
        "year_stats":          year_stats,
    }

    path = output_dir / "nirf_meta.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"  ✓  nirf_meta.json")
    print(f"     {len(years)} years | {len(cats)} categories | {len(sections)} sections")
    print(f"     {len(img_score_cols)} img score | {len(img_total_cols)} img total | "
          f"{len(img_other_cols)} img other")
    print(f"     {len(pdf_named_cols)} pdf named | {len(pdf_sec_cols)} pdf section cols")
    if year_stats:
        print(f"     Year column: {year_stats.get('rows_with_year',0):,} / "
              f"{year_stats.get('total_rows',0):,} rows have academic year "
              f"({year_stats.get('year_fill_pct',0):.1f}%)")

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="NIRF ETL: CSV + CSV → Parquet\n\n"
                    "Reads nirf-pdf-data.csv and image-data.csv from each year folder.\n"
                    "The 'year' column in CSV contains academic year strings like\n"
                    "'2023-24 (Graduation Year)' — these are preserved in nirf_raw.parquet."
    )
    parser.add_argument("--input",  "-i", default="./downloads")
    parser.add_argument("--output", "-o", default="./public/data")
    args = parser.parse_args()

    input_dir  = Path(args.input).resolve()
    output_dir = Path(args.output).resolve()

    if not input_dir.exists():
        print(f"[ETL] Input folder not found: {input_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"[ETL] Input  : {input_dir}")
    print(f"[ETL] Output : {output_dir}")

    print(divider("SOURCE A  —  nirf-pdf-data.csv"))
    pdf_files = find_pdf_csvs(input_dir)
    print(f"  Found {len(pdf_files)} CSV file(s)")
    df_pdf = load_all_pdf_csvs(pdf_files)

    print(divider("SOURCE B  —  image-data.csv  (ALL columns from ALL years)"))
    csv_files = find_image_csvs(input_dir)
    print(f"  Found {len(csv_files)} CSV file(s)")
    df_image = load_all_image_csvs(csv_files)

    print(divider("OUTPUT 1  —  nirf_raw.parquet"))
    if not df_pdf.empty:
        write_parquet(df_pdf, output_dir / "nirf_raw.parquet", "nirf_raw.parquet")
        # Verify year column made it through
        year_check = df_pdf["year"].notna() & ~df_pdf["year"].isin(["-", ""])
        print(f"  Year column check: {year_check.sum():,} rows with real academic year values")
        if year_check.sum() > 0:
            print(f"  Sample year values: {df_pdf.loc[year_check, 'year'].value_counts().head(5).to_dict()}")
        else:
            print(f"  [WARN] Year column is empty — check CSV has 'Year' column with academic years")
    else:
        print("  [SKIP] No PDF data.")

    print(divider("OUTPUT 2  —  nirf_scores.parquet"))
    df_pdf_agg = aggregate_pdf(df_pdf)
    df_scores  = merge_sources(df_image, df_pdf_agg)
    if not df_scores.empty:
        write_parquet(df_scores, output_dir / "nirf_scores.parquet", "nirf_scores.parquet")
    else:
        print("  [SKIP] No scores data.")

    print(divider("OUTPUT 3  —  nirf_meta.json"))
    write_metadata(df_pdf, df_scores, output_dir)

    print(divider("DONE ✅"))
    print(f"  Raw rows      : {len(df_pdf):,}")
    print(f"  Score rows    : {len(df_scores):,}")
    print(f"  Score columns : {len(df_scores.columns) if not df_scores.empty else 0}")
    print(f"  Output        : {output_dir}\n")
    print("  Next step: run 'python nirf_etl.py' to regenerate parquet files")
    print("  The 'year' column will now contain real academic year values")
    print("  e.g. '2023-24', '2022-23 (Graduation Year)', '2021-22 (Intake Year)'\n")

if __name__ == "__main__":
    main()