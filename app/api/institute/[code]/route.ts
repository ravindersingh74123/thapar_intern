import { NextRequest, NextResponse } from "next/server";
import { query } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code     = decodeURIComponent(rawCode);
  const category = req.nextUrl.searchParams.get("category") ?? "";

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    const scoreRows = await query(
      `SELECT * FROM nirf_scores
       WHERE institute_code = ?
       ${category ? "AND category = ?" : ""}
       ORDER BY ranking_year DESC`,
      category ? [code, category] : [code]
    );

    if (scoreRows.length === 0) {
      return NextResponse.json({ error: "Institute not found" }, { status: 404 });
    }

    const firstRow = scoreRows[0] as Record<string, unknown>;

    const scoresByYear: Record<number, Record<string, unknown>> = {};
    for (const row of scoreRows) {
      const r    = row as Record<string, unknown>;
      const year = Number(r.ranking_year);
      scoresByYear[year] = r;
    }

    const rawRows = await query<{
      section: string; metric: string; year: string;
      value: string; ranking_year: number; program: string;
    }>(
      `SELECT section, metric, year, value, ranking_year, program
       FROM nirf_raw
       WHERE institute_code = ?
       ${category ? "AND category = ?" : ""}
       ORDER BY ranking_year DESC, section, metric`,
      category ? [code, category] : [code]
    );

    const sectionMap = new Map<string, {
      metric: string; year: string; value: string;
      ranking_year: number; program: string;
    }[]>();

    for (const row of rawRows) {
      if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
      sectionMap.get(row.section)!.push({
        metric: row.metric, year: row.year, value: row.value,
        ranking_year: Number(row.ranking_year), program: row.program,
      });
    }

    const rawSections = Array.from(sectionMap.entries()).map(
      ([section, metrics]) => ({ section, metrics })
    );

    const categories = [
      ...new Set(scoreRows.map((r) => (r as Record<string, unknown>).category as string))
    ];

    return NextResponse.json({
      institute_code: firstRow.institute_code,
      institute_name: firstRow.institute_name,
      categories,
      scoresByYear,
      rawSections,
    });
  } catch (err) {
    console.error("[/api/institute]", err);
    return NextResponse.json({ error: "Failed to load institute profile" }, { status: 500 });
  }
}