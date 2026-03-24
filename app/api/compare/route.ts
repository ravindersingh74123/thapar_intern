// /**
//  * GET /api/compare
//  *
//  * Returns full score + raw section data for multiple institutes,
//  * keyed by institute_code. Used by the comparison view.
//  *
//  * Query params:
//  *   codes      string   required — comma-separated institute codes (2–4)
//  *   year       number   optional — filter scoresByYear to this year only
//  *
//  * Response:
//  * {
//  *   [institute_code]: {
//  *     institute_code: string
//  *     institute_name: string
//  *     categories: string[]
//  *     scoresByYear: Record<number, Record<string, unknown>>
//  *     rawSections: { section: string; metrics: RawMetric[] }[]
//  *   }
//  * }
//  */

// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const codesRaw = req.nextUrl.searchParams.get("codes") ?? "";
//   const yearParam = req.nextUrl.searchParams.get("year");

//   const codes = codesRaw
//     .split(",")
//     .map((c) => c.trim())
//     .filter(Boolean)
//     .slice(0, 4);

//   if (codes.length < 2) {
//     return NextResponse.json(
//       { error: "At least 2 institute codes required" },
//       { status: 400 }
//     );
//   }

//   const placeholders = codes.map(() => "?").join(", ");

//   try {
//     const scoreRows = await query(
//       `SELECT * FROM nirf_scores
//        WHERE institute_code IN (${placeholders})
//        ORDER BY institute_code, ranking_year DESC`,
//       codes
//     );

//     const rawRows = await query<{
//       institute_code: string;
//       section: string;
//       metric: string;
//       year: string;
//       value: string;
//       ranking_year: number;
//       program: string;
//       category: string;
//     }>(
//       `SELECT institute_code, section, metric, year, value, ranking_year, program, category
//        FROM nirf_raw
//        WHERE institute_code IN (${placeholders})
//        ORDER BY institute_code, ranking_year DESC, section, metric`,
//       codes
//     );

//     // Group by institute_code
//     const result: Record<string, unknown> = {};

//     for (const code of codes) {
//       const instScores = scoreRows.filter(
//         (r) => (r as Record<string, unknown>).institute_code === code
//       );
//       if (!instScores.length) continue;

//       const first = instScores[0] as Record<string, unknown>;
//       const categories = [
//         ...new Set(instScores.map((r) => (r as Record<string, unknown>).category as string)),
//       ];

//       const scoresByYear: Record<number, Record<string, unknown>> = {};
//       for (const row of instScores) {
//         const r = row as Record<string, unknown>;
//         const yr = Number(r.ranking_year);
//         if (!scoresByYear[yr]) scoresByYear[yr] = r;
//       }

//       const instRaw = rawRows.filter((r) => r.institute_code === code);
//       const sectionMap = new Map<string, typeof instRaw>();
//       for (const row of instRaw) {
//         if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
//         sectionMap.get(row.section)!.push(row);
//       }

//       const rawSections = Array.from(sectionMap.entries()).map(
//         ([section, metrics]) => ({ section, metrics })
//       );

//       result[code] = {
//         institute_code: first.institute_code,
//         institute_name: first.institute_name,
//         categories,
//         scoresByYear,
//         rawSections,
//       };
//     }

//     return NextResponse.json(result);
//   } catch (err) {
//     console.error("[/api/compare]", err);
//     return NextResponse.json({ error: "Compare failed" }, { status: 500 });
//   }
// }




























/**
 * GET /api/compare
 *
 * Returns full score + raw section data for multiple institutes.
 * scoresByYear now stores ALL rows (all categories) indexed as
 * a flat array; the frontend filters by activeCategory.
 *
 * Query params:
 *   codes  string  required — comma-separated institute codes (2–4)
 *
 * Response: { [institute_code]: InstituteProfile }
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const codesRaw = req.nextUrl.searchParams.get("codes") ?? "";

  const codes = codesRaw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (codes.length < 2) {
    return NextResponse.json(
      { error: "At least 2 institute codes required" },
      { status: 400 }
    );
  }

  const placeholders = codes.map(() => "?").join(", ");

  try {
    const scoreRows = await query(
      `SELECT * FROM nirf_scores
       WHERE institute_code IN (${placeholders})
       ORDER BY institute_code, ranking_year DESC`,
      codes
    );

    const rawRows = await query<{
      institute_code: string;
      section: string;
      metric: string;
      year: string;
      value: string;
      ranking_year: number;
      program: string;
      category: string;
    }>(
      `SELECT institute_code, section, metric, year, value, ranking_year, program, category
       FROM nirf_raw
       WHERE institute_code IN (${placeholders})
       ORDER BY institute_code, ranking_year DESC, section, metric`,
      codes
    );

    const result: Record<string, unknown> = {};

    for (const code of codes) {
      const instScores = scoreRows.filter(
        (r) => (r as Record<string, unknown>).institute_code === code
      ) as Record<string, unknown>[];

      if (!instScores.length) continue;

      const first = instScores[0];

      // All distinct categories for this institute
      const categories = [
        ...new Set(instScores.map((r) => r.category as string).filter(Boolean)),
      ].sort();

      // scoresByYear: keyed as "year::category" → row
      // AND also plain year → row (first/best row for that year, for backward compat)
      const scoresByYear: Record<string, Record<string, unknown>> = {};
      for (const row of instScores) {
        const yr  = Number(row.ranking_year);
        const cat = (row.category as string) ?? "";

        // Plain year key — store the first row we see (highest score wins on DESC order)
        const yrKey = String(yr);
        if (!scoresByYear[yrKey]) scoresByYear[yrKey] = row;

        // Category-qualified key
        const catKey = `${yr}::${cat}`;
        if (!scoresByYear[catKey]) scoresByYear[catKey] = row;
      }

      // Raw sections
      const instRaw = rawRows.filter((r) => r.institute_code === code);
      const sectionMap = new Map<string, typeof instRaw>();
      for (const row of instRaw) {
        if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
        sectionMap.get(row.section)!.push(row);
      }
      const rawSections = Array.from(sectionMap.entries()).map(
        ([section, metrics]) => ({ section, metrics })
      );

      result[code] = {
        institute_code: first.institute_code,
        institute_name: first.institute_name,
        categories,
        scoresByYear,
        rawSections,
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/compare]", err);
    return NextResponse.json({ error: "Compare failed" }, { status: 500 });
  }
}