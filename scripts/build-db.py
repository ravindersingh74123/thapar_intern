#!/usr/bin/env python3
"""Convert parquet files to SQLite for Vercel deployment."""
import sys
try:
    import pandas as pd
    import sqlalchemy
except ImportError:
    print("Run: pip install pandas pyarrow sqlalchemy")
    sys.exit(1)

from pathlib import Path

DATA_DIR = Path("public/data")
DB_PATH  = DATA_DIR / "nirf.db"

def main():
    print(f"Building {DB_PATH} ...")
    engine = sqlalchemy.create_engine(f"sqlite:///{DB_PATH}")

    scores_path = DATA_DIR / "nirf_scores.parquet"
    raw_path    = DATA_DIR / "nirf_raw.parquet"

    if scores_path.exists():
        df = pd.read_parquet(scores_path)
        df.to_sql("nirf_scores", engine, if_exists="replace", index=False)
        print(f"  nirf_scores: {len(df):,} rows, {len(df.columns)} cols")
    else:
        print("  SKIP: nirf_scores.parquet not found")

    if raw_path.exists():
        df = pd.read_parquet(raw_path)
        df.to_sql("nirf_raw", engine, if_exists="replace", index=False)
        print(f"  nirf_raw: {len(df):,} rows, {len(df.columns)} cols")
    else:
        print("  SKIP: nirf_raw.parquet not found")

    print(f"Done → {DB_PATH}")

if __name__ == "__main__":
    main()