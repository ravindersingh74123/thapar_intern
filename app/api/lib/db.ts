// /**
//  * app/api/lib/db.ts
//  * Fully dynamic — no hardcoded column names.
//  * img_total is computed from whatever img_*_score columns actually exist.
//  */
// import path from "path";
// import fs   from "fs";
// import duckdb from "duckdb-async";

// function toFwd(p: string) { return p.replace(/\\/g, "/"); }

// const SCORES_PATH = toFwd(path.join(process.cwd(), "public/data/nirf_scores.parquet"));
// const RAW_PATH    = toFwd(path.join(process.cwd(), "public/data/nirf_raw.parquet"));
// const META_PATH   = path.join(process.cwd(), "public/data/nirf_meta.json");

// function sanitise(val: unknown): unknown {
//   if (typeof val === "bigint") return Number(val);
//   if (Array.isArray(val))      return val.map(sanitise);
//   if (val !== null && typeof val === "object") {
//     const out: Record<string, unknown> = {};
//     for (const [k, v] of Object.entries(val as Record<string, unknown>))
//       out[k] = sanitise(v);
//     return out;
//   }
//   return val;
// }

// let _db: duckdb.Database | null = null;

// async function buildTotalExpr(conn: duckdb.Connection): Promise<string> {
//   // Read actual column names from the parquet file — no hardcoding
//   try {
//     const cols = await conn.all(
//       `SELECT column_name FROM (DESCRIBE SELECT * FROM read_parquet('${SCORES_PATH}'))
//        WHERE column_name LIKE 'img_%_score'`
//     );
//     if (cols.length > 0) {
//       return cols.map((r: Record<string,unknown>) => `COALESCE("${r.column_name}", 0)`).join(" + ");
//     }
//   } catch { /* fall through */ }
//   return "NULL";
// }

// async function getDb(): Promise<duckdb.Database> {
//   if (_db) return _db;
//   _db = await duckdb.Database.create(":memory:");
//   const conn = await _db.connect();
//   try {
//     if (fs.existsSync(SCORES_PATH)) {
//       const totalExpr = await buildTotalExpr(conn);
//       await conn.run(
//         `CREATE VIEW IF NOT EXISTS nirf_scores AS
//          SELECT *, (${totalExpr}) AS img_total
//          FROM read_parquet('${SCORES_PATH}')`
//       );
//       console.log("[db] nirf_scores view created with dynamic img_total");
//     } else {
//       console.warn("[db] nirf_scores.parquet not found:", SCORES_PATH);
//       await conn.run(
//         `CREATE VIEW IF NOT EXISTS nirf_scores AS
//          SELECT NULL::INTEGER AS ranking_year, NULL::VARCHAR AS category,
//                 NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
//                 NULL::DOUBLE AS img_total WHERE 1=0`
//       );
//     }

//     if (fs.existsSync(RAW_PATH)) {
//       await conn.run(
//         `CREATE VIEW IF NOT EXISTS nirf_raw AS
//          SELECT * FROM read_parquet('${RAW_PATH}')`
//       );
//     } else {
//       console.warn("[db] nirf_raw.parquet not found:", RAW_PATH);
//       await conn.run(
//         `CREATE VIEW IF NOT EXISTS nirf_raw AS
//          SELECT NULL::VARCHAR AS ranking_year, NULL::VARCHAR AS category,
//                 NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
//                 NULL::VARCHAR AS section, NULL::VARCHAR AS program,
//                 NULL::VARCHAR AS year, NULL::VARCHAR AS metric,
//                 NULL::VARCHAR AS value WHERE 1=0`
//       );
//     }
//   } finally {
//     await conn.close();
//   }
//   return _db;
// }

// export async function query<T = Record<string, unknown>>(
//   sql: string, params: unknown[] = []
// ): Promise<T[]> {
//   const db   = await getDb();
//   const conn = await db.connect();
//   try {
//     const raw = params.length === 0
//       ? await conn.all(sql)
//       : await (await conn.prepare(sql)).all(...params);
//     return sanitise(raw) as T[];
//   } finally {
//     await conn.close();
//   }
// }

// export async function queryOne<T = Record<string, unknown>>(
//   sql: string, params: unknown[] = []
// ): Promise<T | null> {
//   const rows = await query<T>(sql, params);
//   return rows[0] ?? null;
// }

// /** Read the meta.json written by the ETL — lists all actual column names */
// export function getMeta(): {
//   score_columns: string[];
//   image_columns: string[];
//   pdf_agg_columns: string[];
//   ranking_years: number[];
//   categories: string[];
// } {
//   try {
//     return JSON.parse(fs.readFileSync(META_PATH, "utf-8"));
//   } catch {
//     return { score_columns: [], image_columns: [], pdf_agg_columns: [], ranking_years: [], categories: [] };
//   }
// }

// export function dbFilesExist() {
//   return {
//     raw: fs.existsSync(RAW_PATH), scores: fs.existsSync(SCORES_PATH),
//     meta: fs.existsSync(META_PATH),
//     rawPath: RAW_PATH, scoresPath: SCORES_PATH,
//   };
// }










/**
 * app/api/lib/db.ts
 * Fully dynamic — no hardcoded column names.
 * Uses dynamic import so the native duckdb binary is never loaded at build time.
 */

import path from "path";
import fs   from "fs";

function toFwd(p: string) { return p.replace(/\\/g, "/"); }

const SCORES_PATH = toFwd(path.join(process.cwd(), "public/data/nirf_scores.parquet"));
const RAW_PATH    = toFwd(path.join(process.cwd(), "public/data/nirf_raw.parquet"));
const META_PATH   = path.join(process.cwd(), "public/data/nirf_meta.json");

function sanitise(val: unknown): unknown {
  if (typeof val === "bigint") return Number(val);
  if (Array.isArray(val))      return val.map(sanitise);
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>))
      out[k] = sanitise(v);
    return out;
  }
  return val;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildTotalExpr(conn: any): Promise<string> {
  try {
    const cols = await conn.all(
      `SELECT column_name FROM (DESCRIBE SELECT * FROM read_parquet('${SCORES_PATH}'))
       WHERE column_name LIKE 'img_%_score'`
    );
    if (cols.length > 0) {
      return cols
        .map((r: Record<string, unknown>) => `COALESCE("${r.column_name}", 0)`)
        .join(" + ");
    }
  } catch { /* fall through */ }
  return "NULL";
}

async function getDb() {
  if (_db) return _db;

  // Dynamic import — native .node binary is never touched at build time
  const duckdb = await import("duckdb-async");
  _db = await duckdb.Database.create(":memory:");
  const conn = await _db.connect();

  try {
    if (fs.existsSync(SCORES_PATH)) {
      const totalExpr = await buildTotalExpr(conn);
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_scores AS
         SELECT *, (${totalExpr}) AS img_total
         FROM read_parquet('${SCORES_PATH}')`
      );
      console.log("[db] nirf_scores view created with dynamic img_total");
    } else {
      console.warn("[db] nirf_scores.parquet not found:", SCORES_PATH);
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_scores AS
         SELECT NULL::INTEGER AS ranking_year, NULL::VARCHAR AS category,
                NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
                NULL::DOUBLE AS img_total WHERE 1=0`
      );
    }

    if (fs.existsSync(RAW_PATH)) {
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_raw AS
         SELECT * FROM read_parquet('${RAW_PATH}')`
      );
    } else {
      console.warn("[db] nirf_raw.parquet not found:", RAW_PATH);
      await conn.run(
        `CREATE VIEW IF NOT EXISTS nirf_raw AS
         SELECT NULL::VARCHAR AS ranking_year, NULL::VARCHAR AS category,
                NULL::VARCHAR AS institute_code, NULL::VARCHAR AS institute_name,
                NULL::VARCHAR AS section, NULL::VARCHAR AS program,
                NULL::VARCHAR AS year, NULL::VARCHAR AS metric,
                NULL::VARCHAR AS value WHERE 1=0`
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
    const raw = params.length === 0
      ? await conn.all(sql)
      : await (await conn.prepare(sql)).all(...params);
    return sanitise(raw) as T[];
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

export function getMeta(): {
  score_columns:   string[];
  image_columns:   string[];
  pdf_agg_columns: string[];
  ranking_years:   number[];
  categories:      string[];
} {
  try {
    return JSON.parse(fs.readFileSync(META_PATH, "utf-8"));
  } catch {
    return {
      score_columns:   [],
      image_columns:   [],
      pdf_agg_columns: [],
      ranking_years:   [],
      categories:      [],
    };
  }
}

export function dbFilesExist() {
  return {
    raw:        fs.existsSync(RAW_PATH),
    scores:     fs.existsSync(SCORES_PATH),
    meta:       fs.existsSync(META_PATH),
    rawPath:    RAW_PATH,
    scoresPath: SCORES_PATH,
  };
}