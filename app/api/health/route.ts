/**
 * GET /api/health
 * Diagnostic endpoint — check whether parquet files exist and DuckDB can query them.
 */
import { NextResponse } from "next/server";
import { dbFilesExist, query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = dbFilesExist();

  let scoresCount = 0;
  let rawCount    = 0;
  let dbError     = null;

  try {
    const [s, r] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*) AS n FROM nirf_scores"),
      query<{ n: number }>("SELECT COUNT(*) AS n FROM nirf_raw"),
    ]);
    scoresCount = Number(s[0]?.n ?? 0);
    rawCount    = Number(r[0]?.n ?? 0);
  } catch (e) {
    dbError = String(e);
  }

  return NextResponse.json({
    ok:           !dbError && files.raw && files.scores,
    files,
    scoresRows:   scoresCount,
    rawRows:      rawCount,
    dbError,
  }, { status: dbError ? 500 : 200 });
}