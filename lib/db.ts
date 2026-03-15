/**
 * lib/db.ts
 * DuckDB singleton — shared across all API routes in the same process.
 */

import path from "path";
import fs   from "fs";
import duckdb from "duckdb-async";

// DuckDB requires forward slashes even on Windows
function toFwd(p: string) {
  return p.replace(/\\/g, "/");
}

const RAW_PATH    = toFwd(path.join(process.cwd(), "public/data/nirf_raw.parquet"));
const SCORES_PATH = toFwd(path.join(process.cwd(), "public/data/nirf_scores.parquet"));

let _db: duckdb.Database | null = null;

async function getDb(): Promise<duckdb.Database> {
  if (_db) return _db;

  _db = await duckdb.Database.create(":memory:");
  const conn = await _db.connect();

  try {
    if (fs.existsSync(RAW_PATH)) {
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_raw AS SELECT * FROM read_parquet('${RAW_PATH}')`
      );
    } else {
      console.warn("[db] nirf_raw.parquet not found:", RAW_PATH);
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_raw AS
         SELECT NULL::VARCHAR AS ranking_year, NULL::VARCHAR AS category,
                NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
                NULL::VARCHAR AS section, NULL::VARCHAR AS program,
                NULL::VARCHAR AS year, NULL::VARCHAR AS metric, NULL::VARCHAR AS value
         WHERE 1=0`
      );
    }

    if (fs.existsSync(SCORES_PATH)) {
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_scores AS SELECT * FROM read_parquet('${SCORES_PATH}')`
      );
    } else {
      console.warn("[db] nirf_scores.parquet not found:", SCORES_PATH);
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_scores AS
         SELECT NULL::INTEGER AS ranking_year, NULL::VARCHAR AS category,
                NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
                NULL::DOUBLE  AS img_total
         WHERE 1=0`
      );
    }
  } finally {
    await conn.close();
  }

  return _db;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db   = await getDb();
  const conn = await db.connect();
  try {
    if (params.length === 0) {
      return (await conn.all(sql)) as T[];
    }
    const stmt = await conn.prepare(sql);
    return (await stmt.all(...params)) as T[];
  } finally {
    await conn.close();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export function dbFilesExist() {
  return {
    raw:        fs.existsSync(RAW_PATH),
    scores:     fs.existsSync(SCORES_PATH),
    rawPath:    RAW_PATH,
    scoresPath: SCORES_PATH,
  };
}