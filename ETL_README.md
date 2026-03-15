# NIRF ETL Pipeline

Merges two data sources produced by the Next.js downloader into optimised
Parquet files for the analytics dashboard.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
python nirf_etl.py                                          # default paths
python nirf_etl.py --input ./downloads --output ./public/data
```

## Input — expected folder layout

```
downloads/
  2023/
    nirf-pdf-data.csv     ← long-format institutional data
    image-data.xlsx       ← NIRF scorecard scores (SS, FSR, FQE, ...)
  2024/
    nirf-pdf-data.csv
    image-data.xlsx
  2025/
    nirf-pdf-data.csv
    image-data.xlsx
```

Both files are optional per year — the ETL handles missing files gracefully.

## Outputs

```
public/data/
  nirf_raw.parquet      ← long format, all PDF rows (~1.3M)
  nirf_scores.parquet   ← wide format, one row per institute/year/category
  nirf_meta.json        ← years, categories, column names (for dropdowns)
```

### nirf_raw.parquet columns
ranking_year | category | institute_code | institute_name |
section | program | year | metric | value

### nirf_scores.parquet columns
Identity: ranking_year | category | institute_code | institute_name
Image scorecard: img_ss_score, img_ss_total, img_fsr_score, img_fsr_total, ...
PDF aggregates:  pdf_total_intake, pdf_placement_placed, pdf_median_salary, ...

### nirf_meta.json
Pre-extracted years, categories, column names — fed directly into dashboard dropdowns.

## Re-running
Safe to re-run any time. All output files are overwritten from scratch.
