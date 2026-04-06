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

























// /**
//  * GET /api/compare
//  *
//  * Returns full score + raw section data for multiple institutes.
//  * scoresByYear now stores ALL rows (all categories) indexed as
//  * a flat array; the frontend filters by activeCategory.
//  *
//  * Query params:
//  *   codes  string  required — comma-separated institute codes (2–4)
//  *
//  * Response: { [institute_code]: InstituteProfile }
//  */

// import { NextRequest, NextResponse } from "next/server";
// import { query } from "../lib/db";

// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   const codesRaw = req.nextUrl.searchParams.get("codes") ?? "";

//   const codes = codesRaw
//     .split(",")
//     .map((c) => c.trim())
//     .filter(Boolean)
//     .slice(0, 4);

//   if (codes.length < 2) {
//     return NextResponse.json(
//       { error: "At least 2 institute codes required" },
//       { status: 400 },
//     );
//   }

//   const placeholders = codes.map(() => "?").join(", ");

//   try {
//     // First resolve institute_name for each code, then fetch ALL codes
//     // sharing that name (since different categories have different codes)
//     const nameRows = await query<{
//       institute_code: string;
//       institute_name: string;
//     }>(
//       `SELECT DISTINCT institute_code, institute_name FROM nirf_scores
//      WHERE institute_code IN (${placeholders})`,
//       codes,
//     );

    

//     // Build map: original code → institute_name
//     const codeToName: Record<string, string> = {};
//     for (const row of nameRows) {
//       codeToName[row.institute_code] = row.institute_name;
//     }

//     // Get ALL codes for each institute_name
//     const names = [...new Set(Object.values(codeToName))];
//     const namePlaceholders = names.map(() => "?").join(", ");

//     const allCodesRows = await query<{
//       institute_code: string;
//       institute_name: string;
//     }>(
//       `SELECT DISTINCT institute_code, institute_name FROM nirf_scores
//      WHERE institute_name IN (${namePlaceholders})`,
//       names,
//     );

//     // Map: institute_name → all its codes
//     const nameToAllCodes: Record<string, string[]> = {};
//     for (const row of allCodesRows) {
//       if (!nameToAllCodes[row.institute_name])
//         nameToAllCodes[row.institute_name] = [];
//       nameToAllCodes[row.institute_name].push(row.institute_code);
//     }

//     // Flat list of all expanded codes across all institutes
//     const expandedCodes = [...new Set(Object.values(nameToAllCodes).flat())];
//     const expandedPlaceholders = expandedCodes.map(() => "?").join(", ");

//     const scoreRows = await query(
//       `SELECT * FROM nirf_scores
//      WHERE institute_code IN (${expandedPlaceholders})
//      ORDER BY institute_code, ranking_year DESC`,
//       expandedCodes,
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
//      FROM nirf_raw
//      WHERE institute_code IN (${expandedPlaceholders})
//      ORDER BY institute_code, ranking_year DESC, section, metric`,
//       expandedCodes,
//     );

//     const result: Record<string, unknown> = {};

//     // Map: original code → institute_name, used to group results back
//     for (const code of codes) {
//       const instituteName = codeToName[code];
//       if (!instituteName) continue;

//       const allCodes = nameToAllCodes[instituteName] ?? [code];

//       console.log("allCodes for", instituteName, ":", allCodes);

//       // Gather all score rows for this institute (across all its codes/categories)
//       const instScores = scoreRows.filter((r) =>
//         allCodes.includes(
//           (r as Record<string, unknown>).institute_code as string,
//         ),
//       ) as Record<string, unknown>[];

//       if (!instScores.length) continue;

//       const first = instScores[0];

//       const categories = [
//         ...new Set(instScores.map((r) => r.category as string).filter(Boolean)),
//       ].sort((a, b) => {
//         const CAT_ORDER: Record<string, number> = {
//           Overall: 0,
//           University: 1,
//           Engineering: 2,
//           Management: 3,
//           Research: 4,
//           Medical: 5,
//           College: 6,
//           Pharmacy: 7,
//           Law: 8,
//           Architecture: 9,
//         };
//         return (
//           (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99) || a.localeCompare(b)
//         );
//       });

//       const scoresByYear: Record<string, Record<string, unknown>> = {};
//       for (const row of instScores) {
//         const yr = Number(row.ranking_year);
//         const cat = (row.category as string) ?? "";
//         const yrKey = String(yr);
//         if (!scoresByYear[yrKey]) scoresByYear[yrKey] = row;
//         const catKey = `${yr}::${cat}`;
//         if (!scoresByYear[catKey]) scoresByYear[catKey] = row;
//       }

//       // Raw sections — gather across all codes for this institute
//       const instRaw = rawRows.filter((r) =>
//         allCodes.includes(r.institute_code),
//       );
//       const sectionMap = new Map<string, typeof instRaw>();
//       for (const row of instRaw) {
//         if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
//         sectionMap.get(row.section)!.push(row);
//       }
//       const rawSections = Array.from(sectionMap.entries()).map(
//         ([section, metrics]) => ({ section, metrics }),
//       );

//       result[code] = {
//         institute_code: code,
//         institute_name: instituteName,
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
      { status: 400 },
    );
  }

  const placeholders = codes.map(() => "?").join(", ");

  try {
    // First resolve institute_name for each code, then fetch ALL codes
    // sharing that name (since different categories have different codes)
    const nameRows = await query<{
      institute_code: string;
      institute_name: string;
    }>(
      `SELECT DISTINCT institute_code, institute_name FROM nirf_scores
     WHERE institute_code IN (${placeholders})`,
      codes,
    );

    

    // Build map: original code → institute_name
    const codeToName: Record<string, string> = {};
    for (const row of nameRows) {
      codeToName[row.institute_code] = row.institute_name;
    }

    // Get ALL codes for each institute_name
    const names = [...new Set(Object.values(codeToName))];
    const namePlaceholders = names.map(() => "?").join(", ");

    const allCodesRows = await query<{
      institute_code: string;
      institute_name: string;
    }>(
      `SELECT DISTINCT institute_code, institute_name FROM nirf_scores
     WHERE institute_name IN (${namePlaceholders})`,
      names,
    );

    // Map: institute_name → all its codes
    const nameToAllCodes: Record<string, string[]> = {};
    for (const row of allCodesRows) {
      if (!nameToAllCodes[row.institute_name])
        nameToAllCodes[row.institute_name] = [];
      nameToAllCodes[row.institute_name].push(row.institute_code);
    }

    // Flat list of all expanded codes across all institutes
    const expandedCodes = [...new Set(Object.values(nameToAllCodes).flat())];
    const expandedPlaceholders = expandedCodes.map(() => "?").join(", ");

   const scoreRows = await query(
    `SELECT * FROM nirf_scores
     WHERE institute_code IN (${expandedPlaceholders})
     ORDER BY ranking_year DESC, institute_code`,
    expandedCodes
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
     WHERE institute_code IN (${expandedPlaceholders})
     ORDER BY institute_code, ranking_year DESC, section, metric`,
      expandedCodes,
    );

    const result: Record<string, unknown> = {};

    // Map: original code → institute_name, used to group results back
    for (const code of codes) {
      const instituteName = codeToName[code];
      if (!instituteName) continue;

      const allCodes = nameToAllCodes[instituteName] ?? [code];

      console.log("allCodes for", instituteName, ":", allCodes);

      // Gather all score rows for this institute (across all its codes/categories)
      const instScores = scoreRows.filter((r) =>
        allCodes.includes(
          (r as Record<string, unknown>).institute_code as string,
        ),
      ) as Record<string, unknown>[];

      if (!instScores.length) continue;

      const first = instScores[0];

      const categories = [
        ...new Set(instScores.map((r) => r.category as string).filter(Boolean)),
      ].sort((a, b) => {
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
        return (
          (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99) || a.localeCompare(b)
        );
      });

      const scoresByYear: Record<string, Record<string, unknown>> = {};
      for (const row of instScores) {
        const yr  = Number(row.ranking_year);
        const cat = (row.category as string) ?? "";
        const yrKey = String(yr);

        // For plain year key — prefer Overall, else first row
        if (!scoresByYear[yrKey]) {
          scoresByYear[yrKey] = row;
        } else if (cat === "Overall") {
          scoresByYear[yrKey] = row;
        }

        // For category key — always overwrite with the row whose
        // institute_code actually belongs to that category
        // (avoid IR-B-* overwriting IR-R-* for Research etc.)
        const catKey = `${yr}::${cat}`;
        if (!scoresByYear[catKey]) {
          scoresByYear[catKey] = row;
        } else {
          // Prefer the row where the code prefix matches the category
          const CODE_CAT: Record<string, string> = {
            "IR-O-": "Overall", "IR-E-": "Engineering", "IR-M-": "Management",
            "IR-R-": "Research", "IR-B-": "MBA", "IR-I-": "Innovation",
            "IR-U-": "University", "IR-C-": "College", "IR-P-": "Pharmacy",
            "IR-L-": "Law", "IR-A-": "Architecture", "IR-D-": "Medical",
          };
          const rowCode = String(row.institute_code ?? "");
          const prefix = Object.keys(CODE_CAT).find(p => rowCode.startsWith(p));
          if (prefix && CODE_CAT[prefix] === cat) {
            scoresByYear[catKey] = row; // this row's code actually matches the category
          }
        }
      }

      // Raw sections — gather across all codes for this institute
      const instRaw = rawRows.filter((r) =>
        allCodes.includes(r.institute_code),
      );
      const sectionMap = new Map<string, typeof instRaw>();
      for (const row of instRaw) {
        if (!sectionMap.has(row.section)) sectionMap.set(row.section, []);
        sectionMap.get(row.section)!.push(row);
      }
      const rawSections = Array.from(sectionMap.entries()).map(
        ([section, metrics]) => ({ section, metrics }),
      );

      result[code] = {
        institute_code: code,
        institute_name: instituteName,
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
