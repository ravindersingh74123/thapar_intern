// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ code: string }> }
// ) {
//   const { code: rawCode } = await params;
//   const code     = decodeURIComponent(rawCode);
//   const category = req.nextUrl.searchParams.get("category") ?? "";

//   if (!code) {
//     return NextResponse.json({ error: "code is required" }, { status: 400 });
//   }

//   try {
//     const scoreRows = await query(
//       `SELECT * FROM nirf_scores
//        WHERE institute_code = ?
//        ${category ? "AND category = ?" : ""}
//        ORDER BY ranking_year DESC`,
//       category ? [code, category] : [code]
//     );

//     if (scoreRows.length === 0) {
//       return NextResponse.json({ error: "Institute not found" }, { status: 404 });
//     }

//     const firstRow = scoreRows[0] as Record<string, unknown>;

//     const scoresByYear: Record<number, Record<string, unknown>> = {};
//     for (const row of scoreRows) {
//       const r    = row as Record<string, unknown>;
//       const year = Number(r.ranking_year);
//       scoresByYear[year] = r;
//     }

//     const rawRows = await query<{
//       section: string; metric: string; year: string;
//       value: string; ranking_year: number; program: string;
//     }>(
//       `SELECT section, metric, year, value, ranking_year, program
//        FROM nirf_raw
//        WHERE institute_code = ?
//        ${category ? "AND category = ?" : ""}
//        ORDER BY ranking_year DESC, section, metric`,
//       category ? [code, category] : [code]
//     );

//     const sectionMap = new Map<string, {
//       metric: string; year: string; value: string;
//       ranking_year: number; program: string;
//     }[]>();

//     for (const row of rawRows) {
//       if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
//       sectionMap.get(row.section)!.push({
//         metric: row.metric, year: row.year, value: row.value,
//         ranking_year: Number(row.ranking_year), program: row.program,
//       });
//     }

//     const rawSections = Array.from(sectionMap.entries()).map(
//       ([section, metrics]) => ({ section, metrics })
//     );

//     const categories = [
//       ...new Set(scoreRows.map((r) => (r as Record<string, unknown>).category as string))
//     ];

//     return NextResponse.json({
//       institute_code: firstRow.institute_code,
//       institute_name: firstRow.institute_name,
//       categories,
//       scoresByYear,
//       rawSections,
//     });
//   } catch (err) {
//     console.error("[/api/institute]", err);
//     return NextResponse.json({ error: "Failed to load institute profile" }, { status: 500 });
//   }
// }















// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ code: string }> },
// ) {
//   const { code: rawCode } = await params;
//   const code = decodeURIComponent(rawCode);

//   // NOTE: we intentionally ignore the ?category param now —
//   // we fetch ALL categories so the frontend can show category buttons.
//   // The frontend filters by activeCategory client-side.

//   if (!code) {
//     return NextResponse.json({ error: "code is required" }, { status: 400 });
//   }

//   try {
//     // Fetch ALL rows for this institute across ALL categories
//     // First find the canonical institute_name for this code
//     const nameRows = await query<{ institute_name: string }>(
//       `SELECT DISTINCT institute_name FROM nirf_scores WHERE institute_code = ? LIMIT 1`,
//       [code],
//     );

//     if (nameRows.length === 0) {
//       return NextResponse.json(
//         { error: "Institute not found" },
//         { status: 404 },
//       );
//     }

//     const instituteName = nameRows[0].institute_name;

//     // Now fetch ALL rows for ALL codes that share this institute_name
//     const scoreRows = await query(
//       `SELECT * FROM nirf_scores
//    WHERE institute_name = ?
//    ORDER BY ranking_year DESC`,
//       [instituteName],
//     );

//     const firstRow = scoreRows[0] as Record<string, unknown>;

//     // Build scoresByYear with two key types:
//     //   "2025"          → first/best row for that year (backward compat)
//     //   "2025::Overall" → exact row for year + category
//     const scoresByYear: Record<string, Record<string, unknown>> = {};
//     for (const row of scoreRows) {
//       const r = row as Record<string, unknown>;
//       const yr = Number(r.ranking_year);
//       const cat = (r.category as string) ?? "";

//       // Plain year key — first row wins (highest score since ordered DESC)
//       if (!scoresByYear[String(yr)]) scoresByYear[String(yr)] = r;

//       // Category-qualified key — always store
//       scoresByYear[`${yr}::${cat}`] = r;
//     }

//     // Fetch ALL raw sections across ALL categories
//     const rawRows = await query<{
//       section: string;
//       metric: string;
//       year: string;
//       value: string;
//       ranking_year: number;
//       program: string;
//       category: string;
//     }>(
//       `SELECT section, metric, year, value, ranking_year, program, category
//    FROM nirf_raw
//    WHERE institute_code IN (
//      SELECT DISTINCT institute_code FROM nirf_scores WHERE institute_name = ?
//    )
//    ORDER BY ranking_year DESC, section, metric`,
//       [instituteName],
//     );

//     const sectionMap = new Map<
//       string,
//       {
//         metric: string;
//         year: string;
//         value: string;
//         ranking_year: number;
//         program: string;
//         category: string;
//       }[]
//     >();

//     for (const row of rawRows) {
//       if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
//       sectionMap.get(row.section)!.push({
//         metric: row.metric,
//         year: row.year,
//         value: row.value,
//         ranking_year: Number(row.ranking_year),
//         program: row.program,
//         category: row.category,
//       });
//     }

//     const rawSections = Array.from(sectionMap.entries()).map(
//       ([section, metrics]) => ({ section, metrics }),
//     );

//     // All distinct categories — sorted by importance order
//     const CAT_ORDER: Record<string, number> = {
//       Overall: 0,
//       University: 1,
//       Engineering: 2,
//       Management: 3,
//       Research: 4,
//       Medical: 5,
//       College: 6,
//       Pharmacy: 7,
//       Law: 8,
//       Architecture: 9,
//     };
//     const categories = [
//       ...new Set(
//         (scoreRows as Record<string, unknown>[])
//           .map((r) => r.category as string)
//           .filter(Boolean),
//       ),
//     ].sort(
//       (a, b) =>
//         (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99) || a.localeCompare(b),
//     );

//     return NextResponse.json({
//       institute_code: firstRow.institute_code,
//       institute_name: firstRow.institute_name,
//       categories,
//       scoresByYear,
//       rawSections,
//     });
//   } catch (err) {
//     console.error("[/api/institute]", err);
//     return NextResponse.json(
//       { error: "Failed to load institute profile" },
//       { status: 500 },
//     );
//   }
// }






















import { NextRequest, NextResponse } from "next/server";
import { query } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);

  // NOTE: we intentionally ignore the ?category param now —
  // we fetch ALL categories so the frontend can show category buttons.
  // The frontend filters by activeCategory client-side.

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    // Fetch ALL rows for this institute across ALL categories
    // First find the canonical institute_name for this code
    const nameRows = await query<{ institute_name: string }>(
      `SELECT DISTINCT institute_name FROM nirf_scores WHERE institute_code = ? LIMIT 1`,
      [code],
    );

    if (nameRows.length === 0) {
      return NextResponse.json(
        { error: "Institute not found" },
        { status: 404 },
      );
    }

    const instituteName = nameRows[0].institute_name;

    // Now fetch ALL rows for ALL codes that share this institute_name
    const scoreRows = await query(
      `SELECT * FROM nirf_scores
   WHERE institute_name = ?
   ORDER BY ranking_year DESC`,
      [instituteName],
    );

    const firstRow = scoreRows[0] as Record<string, unknown>;

    // Build scoresByYear with two key types:
    //   "2025"          → first/best row for that year (backward compat)
    //   "2025::Overall" → exact row for year + category
    const CODE_CAT: Record<string, string> = {
      "IR-O-": "Overall", "IR-E-": "Engineering", "IR-M-": "Management",
      "IR-R-": "Research", "IR-B-": "MBA", "IR-I-": "Innovation",
      "IR-U-": "University", "IR-C-": "College", "IR-P-": "Pharmacy",
      "IR-L-": "Law", "IR-A-": "Architecture", "IR-D-": "Medical",
    };

    const scoresByYear: Record<string, Record<string, unknown>> = {};
    for (const row of scoreRows) {
      const r   = row as Record<string, unknown>;
      const yr  = Number(r.ranking_year);
      const cat = (r.category as string) ?? "";
      const yrKey = String(yr);

      // Plain year key — prefer Overall, else first row
      if (!scoresByYear[yrKey]) {
        scoresByYear[yrKey] = r;
      } else if (cat === "Overall") {
        scoresByYear[yrKey] = r;
      }

      // Category key — prefer row whose code prefix matches the category
      const catKey = `${yr}::${cat}`;
      if (!scoresByYear[catKey]) {
        scoresByYear[catKey] = r;
      } else {
        const rowCode = String(r.institute_code ?? "");
        const prefix = Object.keys(CODE_CAT).find(p => rowCode.startsWith(p));
        if (prefix && CODE_CAT[prefix] === cat) {
          scoresByYear[catKey] = r;
        }
      }
    }

    // Fetch ALL raw sections across ALL categories
    const rawRows = await query<{
      section: string;
      metric: string;
      year: string;
      value: string;
      ranking_year: number;
      program: string;
      category: string;
    }>(
      `SELECT section, metric, year, value, ranking_year, program, category
   FROM nirf_raw
   WHERE institute_code IN (
     SELECT DISTINCT institute_code FROM nirf_scores WHERE institute_name = ?
   )
   ORDER BY ranking_year DESC, section, metric`,
      [instituteName],
    );

    const sectionMap = new Map<
      string,
      {
        metric: string;
        year: string;
        value: string;
        ranking_year: number;
        program: string;
        category: string;
      }[]
    >();

    for (const row of rawRows) {
      if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
      sectionMap.get(row.section)!.push({
        metric: row.metric,
        year: row.year,
        value: row.value,
        ranking_year: Number(row.ranking_year),
        program: row.program,
        category: row.category,
      });
    }

    const rawSections = Array.from(sectionMap.entries()).map(
      ([section, metrics]) => ({ section, metrics }),
    );

    // All distinct categories — sorted by importance order
    const CAT_ORDER: Record<string, number> = {
      Overall: 0,
      University: 1,
      Engineering: 2,
      Management: 3,
      Research: 4,
      Medical: 5,
      College: 6,
      Pharmacy: 7,
      Law: 8,
      Architecture: 9,
    };
    const categories = [
      ...new Set(
        (scoreRows as Record<string, unknown>[])
          .map((r) => r.category as string)
          .filter(Boolean),
      ),
    ].sort(
      (a, b) =>
        (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99) || a.localeCompare(b),
    );

    return NextResponse.json({
      institute_code: firstRow.institute_code,
      institute_name: firstRow.institute_name,
      categories,
      scoresByYear,
      rawSections,
    });
  } catch (err) {
    console.error("[/api/institute]", err);
    return NextResponse.json(
      { error: "Failed to load institute profile" },
      { status: 500 },
    );
  }
}
