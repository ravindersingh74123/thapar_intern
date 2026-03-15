// /**
//  * validate-extraction.ts
//  *
//  * Run after a batch extraction to verify completeness.
//  * Reads nirf-pdf-data.csv and produces a full validation report.
//  *
//  * Usage:
//  *   npx ts-node validate-extraction.ts <year>
//  *   npx ts-node validate-extraction.ts 2023
//  */

// import fs from "fs";
// import path from "path";

// // ─── CONFIG ──────────────────────────────────────────────────────────────────

// const year = process.argv[2] ?? "2023";
// const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// // ─── CATEGORY-AWARE SECTION REQUIREMENTS ─────────────────────────────────────
// //
// // From analysis of 723 institutes in the 2023 report:
// //
// //   IR-C-* (College)  — Arts/science colleges: NO PhD students, NO sponsored
// //     research, NO consultancy, NO EDP. These are genuinely absent, not bugs.
// //
// //   IR-D-* / IR-N-* (Medical/Dental) — Have PhD + SR but no Consultancy or EDP.
// //
// //   IR-E-* (Engineering) — Have PhD + SR + Consultancy but most have no EDP.
// //     (EDP = Executive Development Programs — not relevant for most eng. colleges)
// //
// //   IR-M-* (Management) — Have EDP (that's the whole point), may lack SR/Consultancy.
// //
// //   IR-O-* / IR-U-* / IR-L-* / IR-P-* (Overall/University/Law/Pharmacy) — Full set expected.
// //
// // Rules: minimum = 0 means "not required for this category" (won't be flagged as missing).
// //        minimum = 1 means "must have at least 1 row".
// //        minimum = N means "should have at least N rows".
// //
// // The institute code prefix tells us the category:
// //   IR-C-*  College
// //   IR-D-*  Medical
// //   IR-E-*  Engineering
// //   IR-L-*  Law
// //   IR-M-*  Management
// //   IR-N-*  Dental
// //   IR-O-*  Overall
// //   IR-P-*  Pharmacy
// //   IR-U-*  University
// //   IR-A-*  Architecture
// //   IR-R-*  Research

// interface SectionMinimums {
//   intake:      number;
//   strength:    number;
//   placement:   number;
//   phd:         number;
//   capex:       number;
//   opex:        number;
//   sr:          number;
//   consultancy: number;
//   edp:         number;
//   pcs:         number;
//   faculty:     number;
// }

// // Default: full set required
// const DEFAULT_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6, phd: 2,
//   capex: 4, opex: 4, sr: 4, consultancy: 4, edp: 4,
//   pcs: 3, faculty: 1,
// };

// // College: no PhD, no SR, no Consultancy, no EDP — genuinely absent
// const COLLEGE_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6,
//   phd: 0,          // not required
//   capex: 4, opex: 4,
//   sr: 0,           // not required
//   consultancy: 0,  // not required
//   edp: 0,          // not required
//   pcs: 3, faculty: 1,
// };

// // Medical/Dental: have PhD + SR but no Consultancy or EDP
// const MEDICAL_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6, phd: 2,
//   capex: 4, opex: 4, sr: 4,
//   consultancy: 0,  // not required
//   edp: 0,          // not required
//   pcs: 3, faculty: 1,
// };

// // Engineering: full set except EDP is optional
// const ENGINEERING_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6, phd: 2,
//   capex: 4, opex: 4, sr: 4, consultancy: 4,
//   edp: 0,          // not required — most engineering institutes don't run EDP
//   pcs: 3, faculty: 1,
// };

// // Management: EDP is their primary section; SR and Consultancy optional
// const MANAGEMENT_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6,
//   phd: 2, capex: 4, opex: 4,
//   sr: 0,           // many management schools don't have sponsored research
//   consultancy: 0,  // optional
//   edp: 4,          // required — this is what management schools do
//   pcs: 3, faculty: 1,
// };

// // Architecture/Law/Pharmacy: like colleges, may not have SR/Consultancy/EDP
// const PROFESSIONAL_MINIMUMS: SectionMinimums = {
//   intake: 2, strength: 1, placement: 6, phd: 0,
//   capex: 4, opex: 4,
//   sr: 0, consultancy: 0, edp: 0,
//   pcs: 3, faculty: 1,
// };

// function getMinimumsForCode(code: string): SectionMinimums {
//   const prefix = code.substring(0, 4).toUpperCase(); // "IR-C", "IR-E", etc.
//   switch (prefix) {
//     case "IR-C": return COLLEGE_MINIMUMS;
//     case "IR-D": return MEDICAL_MINIMUMS;
//     case "IR-N": return MEDICAL_MINIMUMS;
//     case "IR-E": return ENGINEERING_MINIMUMS;
//     case "IR-M": return MANAGEMENT_MINIMUMS;
//     case "IR-A": return PROFESSIONAL_MINIMUMS;
//     case "IR-L": return PROFESSIONAL_MINIMUMS;
//     case "IR-P": return PROFESSIONAL_MINIMUMS;
//     default:     return DEFAULT_MINIMUMS;  // IR-O, IR-U, IR-R, etc.
//   }
// }

// // ─── SECTION NAME → MINIMUMS KEY MAP ─────────────────────────────────────────

// const SECTION_NAMES = {
//   intake:      "Sanctioned (Approved) Intake",
//   strength:    "Total Actual Student Strength (Program(s) Offered by your Institution)",
//   placement:   "Placement & Higher Studies",
//   phd:         "Ph.D Student Details",
//   capex:       "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years",
//   opex:        "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years",
//   sr:          "Sponsored Research Details",
//   consultancy: "Consultancy Project Details",
//   edp:         "Executive Development Program/Management Development Programs",
//   pcs:         "PCS Facilities: Facilities of Physically Challenged Students",
//   faculty:     "Faculty Details",
// };

// type SectionKey = keyof SectionMinimums;
// const SECTION_KEYS = Object.keys(SECTION_NAMES) as SectionKey[];

// // ─── PARSE CSV ────────────────────────────────────────────────────────────────

// interface Row {
//   rankingYear: string;
//   category: string;
//   instituteCode: string;
//   instituteName: string;
//   section: string;
//   program: string;
//   year: string;
//   metric: string;
//   value: string;
// }

// function parseCSV(filePath: string): Row[] {
//   const text = fs.readFileSync(filePath, "utf8");
//   const lines = text.split("\n");
//   const rows: Row[] = [];

//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;

//     const cells: string[] = [];
//     let current = "";
//     let inQuotes = false;
//     for (let j = 0; j < line.length; j++) {
//       const ch = line[j];
//       if (ch === '"') {
//         if (inQuotes && line[j + 1] === '"') { current += '"'; j++; }
//         else inQuotes = !inQuotes;
//       } else if (ch === "," && !inQuotes) {
//         cells.push(current); current = "";
//       } else {
//         current += ch;
//       }
//     }
//     cells.push(current);

//     if (cells.length < 9) continue;

//     rows.push({
//       rankingYear:   cells[0].trim(),
//       category:      cells[1].trim(),
//       instituteCode: cells[2].trim(),
//       instituteName: cells[3].trim(),
//       section:       cells[4].trim(),
//       program:       cells[5].trim(),
//       year:          cells[6].trim(),
//       metric:        cells[7].trim(),
//       value:         cells[8].trim(),
//     });
//   }

//   return rows;
// }

// // ─── ANALYSIS ─────────────────────────────────────────────────────────────────

// interface InstituteReport {
//   code: string;
//   name: string;
//   category: string;
//   totalRows: number;
//   sectionCounts: Record<SectionKey, number>;
//   issues: string[];
// }

// function analyze(rows: Row[]): InstituteReport[] {
//   const byInstitute = new Map<string, Row[]>();
//   for (const row of rows) {
//     const key = row.instituteCode;
//     if (!byInstitute.has(key)) byInstitute.set(key, []);
//     byInstitute.get(key)!.push(row);
//   }

//   const reports: InstituteReport[] = [];

//   for (const [code, instRows] of byInstitute) {
//     const name     = instRows[0].instituteName;
//     const category = instRows[0].category;
//     const mins     = getMinimumsForCode(code);

//     // Count rows per section key
//     const sectionCounts = {} as Record<SectionKey, number>;
//     for (const key of SECTION_KEYS) sectionCounts[key] = 0;

//     for (const row of instRows) {
//       for (const key of SECTION_KEYS) {
//         if (row.section === SECTION_NAMES[key]) {
//           sectionCounts[key]++;
//           break;
//         }
//       }
//     }

//     const issues: string[] = [];

//     for (const key of SECTION_KEYS) {
//       const count = sectionCounts[key];
//       const min   = mins[key];
//       if (min === 0) continue; // not required for this category — skip

//       const label = SECTION_NAMES[key];
//       const short = label.length > 60 ? label.substring(0, 57) + "..." : label;

//       if (count === 0) {
//         issues.push(`❌ MISSING: ${short}`);
//       } else if (count < min) {
//         issues.push(`⚠  LOW (${count} rows, expected ≥${min}): ${short}`);
//       }
//     }

//     // Flag suspiciously low total
//     if (instRows.length < 15) {
//       issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows — possible extraction failure`);
//     }

//     reports.push({ code, name, category, totalRows: instRows.length, sectionCounts, issues });
//   }

//   reports.sort((a, b) => {
//     const diff = b.issues.length - a.issues.length;
//     return diff !== 0 ? diff : a.code.localeCompare(b.code);
//   });

//   return reports;
// }

// // ─── REPORT OUTPUT ────────────────────────────────────────────────────────────

// function printReport(reports: InstituteReport[]): void {
//   const total   = reports.length;
//   const clean   = reports.filter((r) => r.issues.length === 0);
//   const flagged = reports.filter((r) => r.issues.length > 0);

//   const LINE  = "═".repeat(100);
//   const LINE2 = "─".repeat(100);

//   console.log("\n" + LINE);
//   console.log("  NIRF EXTRACTION VALIDATION REPORT (category-aware)");
//   console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
//   console.log(LINE);
//   console.log(`\n  Total institutes : ${total}`);
//   console.log(`  ✅ Clean          : ${clean.length}`);
//   console.log(`  ⚠  Flagged        : ${flagged.length}  (genuine extraction issues only)`);

//   // Section-level summary (only counting required sections per category)
//   console.log("\n" + LINE2);
//   console.log("  SECTION COVERAGE SUMMARY\n");
//   console.log("  (Sections marked N/A for a category are excluded from counts)\n");

//   const missingCounts: Record<SectionKey, number> = {} as any;
//   const lowCounts:     Record<SectionKey, number> = {} as any;
//   for (const key of SECTION_KEYS) { missingCounts[key] = 0; lowCounts[key] = 0; }

//   for (const r of reports) {
//     const mins = getMinimumsForCode(r.code);
//     for (const key of SECTION_KEYS) {
//       if (mins[key] === 0) continue;
//       const count = r.sectionCounts[key];
//       if (count === 0) missingCounts[key]++;
//       else if (count < mins[key]) lowCounts[key]++;
//     }
//   }

//   for (const key of SECTION_KEYS) {
//     const label   = SECTION_NAMES[key];
//     const short   = label.length > 70 ? label.substring(0, 67) + "..." : label;
//     const missing = missingCounts[key];
//     const low     = lowCounts[key];
//     const flag    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
//     const detail  = missing > 0 ? `${missing} missing, ${low} low`
//                   : low > 0     ? `${low} low`
//                   :               "all present";
//     console.log(`  ${flag}  ${short.padEnd(72)} ${detail}`);
//   }

//   // Per-institute flagged list
//   if (flagged.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  FLAGGED INSTITUTES (genuine extraction issues)\n");
//     for (const r of flagged) {
//       console.log(
//         `  ${r.code.padEnd(18)} ${r.name.substring(0, 45).padEnd(46)} ` +
//         `[${r.category}]  ${r.totalRows} rows`
//       );
//       for (const issue of r.issues) {
//         console.log(`    ${issue}`);
//       }
//     }
//   }

//   console.log("\n" + LINE2);
//   console.log(`  ✅ ${clean.length} institutes passed all checks`);

//   // Write full report to file
//   const reportPath = path.join(path.dirname(CSV_PATH), "validation-report.txt");
//   const lines: string[] = [];

//   lines.push(`NIRF EXTRACTION VALIDATION REPORT (category-aware) — Year: ${year}`);
//   lines.push(`Generated: ${new Date().toISOString()}`);
//   lines.push(`CSV: ${CSV_PATH}`);
//   lines.push("");
//   lines.push(`Total institutes : ${total}`);
//   lines.push(`Clean            : ${clean.length}`);
//   lines.push(`Flagged          : ${flagged.length}`);
//   lines.push("");
//   lines.push("SECTION COVERAGE (only required sections per category counted):");
//   for (const key of SECTION_KEYS) {
//     const label   = SECTION_NAMES[key];
//     const missing = missingCounts[key];
//     const low     = lowCounts[key];
//     const status  = missing > 0 ? "MISSING" : low > 0 ? "LOW" : "OK";
//     lines.push(`  [${status.padEnd(7)}] ${label}  (${missing} missing, ${low} low)`);
//   }

//   lines.push("");
//   lines.push("FLAGGED INSTITUTES:");
//   for (const r of flagged) {
//     const mins = getMinimumsForCode(r.code);
//     lines.push(`\n${r.code}  ${r.name}  [${r.category}]  ${r.totalRows} rows`);
//     for (const issue of r.issues) lines.push(`  ${issue}`);
//     lines.push("  Section counts:");
//     for (const key of SECTION_KEYS) {
//       const count  = r.sectionCounts[key];
//       const min    = mins[key];
//       const status = min === 0     ? "N/A"
//                    : count === 0   ? "MISSING"
//                    : count < min   ? `LOW(${count})`
//                    :                 `OK(${count})`;
//       lines.push(`    [${status.padEnd(10)}] ${SECTION_NAMES[key]}`);
//     }
//   }

//   lines.push("\nCLEAN INSTITUTES:");
//   for (const r of clean) {
//     lines.push(`  ${r.code.padEnd(18)} ${r.name}  (${r.totalRows} rows)`);
//   }

//   fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
//   console.log(`\n  Full report written to: ${reportPath}`);
//   console.log(LINE + "\n");
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// function main(): void {
//   if (!fs.existsSync(CSV_PATH)) {
//     console.error(`\n❌ CSV not found: ${CSV_PATH}`);
//     console.error(`   Run the downloader first for year ${year}\n`);
//     process.exit(1);
//   }

//   console.log(`\nReading: ${CSV_PATH}`);
//   const rows = parseCSV(CSV_PATH);
//   console.log(
//     `Parsed ${rows.length} data rows from ` +
//     `${new Set(rows.map((r) => r.instituteCode)).size} institutes`
//   );

//   const reports = analyze(rows);
//   printReport(reports);
// }

// main();

















/**
 * validate-extraction.ts  (2024 edition)
 *
 * Run after a batch extraction to verify completeness.
 * Reads nirf-pdf-data.csv and produces a full validation report.
 *
 * Usage:
 *   npx ts-node validate-extraction.ts <year>
 *   npx ts-node validate-extraction.ts 2024
 *
 * What changed vs the 2023 validator
 * ─────────────────────────────────────────────────────────────────────────────
 * SECTION ADDITIONS (new in 2024 template):
 *   • Sustainability Details          — IR-O, IR-U, IR-R, IR-V
 *   • Vocational Certificate Courses  — IR-S (Skill universities)
 *   • New Programs Developed          — IR-V (Open universities, e.g. IGNOU)
 *   • Programs Revised                — IR-V (Open universities)
 *   • OPD Attendance & Bed Occupancy  — IR-D, IR-N  (now formally validated)
 *   • Innovation sections (11 types)  — IR-I (fully separate template)
 *
 * THRESHOLD CORRECTIONS (derived from 2024 PDF sample analysis):
 *   • IR-A (Architecture) : SR + Consultancy ARE required   (were 0 in 2023)
 *   • IR-L (Law)          : PhD, SR, Consultancy required   (were 0 in 2023)
 *   • IR-P (Pharmacy)     : PhD, SR, Consultancy required   (were 0 in 2023)
 *   • IR-M (Management)   : SR + Consultancy now required   (were 0 in 2023)
 *
 * CATEGORY ADDITIONS:
 *   • IR-I (Innovation)     — Completely separate template; validated separately
 *   • IR-S (Skill)          — New category in 2024 rankings
 *   • IR-V (Open Univ.)     — New category in 2024 rankings
 *   • IR-G (Agriculture)    — Explicitly listed (was using DEFAULT previously)
 */

// import fs   from "fs";
// import path from "path";

// // ─── CONFIG ───────────────────────────────────────────────────────────────────

// const year     = process.argv[2] ?? "2024";
// const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// // ─── SECTION NAME CONSTANTS ───────────────────────────────────────────────────

// const S = {
//   INTAKE:           "Sanctioned (Approved) Intake",
//   STRENGTH:         "Total Actual Student Strength (Program(s) Offered by your Institution)",
//   PLACEMENT:        "Placement & Higher Studies",
//   PHD:              "Ph.D Student Details",
//   CAPEX:            "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years",
//   OPEX:             "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years",
//   SR:               "Sponsored Research Details",
//   CONSULTANCY:      "Consultancy Project Details",
//   EDP:              "Executive Development Program/Management Development Programs",
//   PCS:              "PCS Facilities: Facilities of Physically Challenged Students",
//   FACULTY:          "Faculty Details",
//   ACCREDITATION:    "Accreditation",
//   // 2024 new / newly-validated sections
//   SUSTAINABILITY:   "Sustainability Details",
//   OPD:              "OPD Attendance & Bed Occupancy",
//   VOCATIONAL:       "Vocational Certificate Courses",
//   NEW_PROGRAMS:     "New Programs Developed",
//   PROGRAMS_REVISED: "Programs Revised",
//   // Innovation-only sections
//   STARTUPS:         "Start up recognized by DPIIT/startup India",
//   STARTUPS_VC:      "Startups which have got VC investment in previous 3 years",
//   FDI:              "FDI investment in previous 3 years",
//   INNO_GRANT:       "Innovation grant received from govt. organization in previous 3 years",
//   PATENTS:          "Patents",
//   PATENTS_COM:      "Patents Commercialized & Technology Transferred",
//   TRL:              "Innovations at various stages of Technology Readiness Level",
//   VENTURES:         "Ventures/startups grown to turnover of 50 lacs",
//   ALUMNI:           "Alumni that are Founders of Forbes/Fortune 500 companies",
//   PRE_INCUBATION:   "Pre-incubation:expenditure/income",
//   INCUBATION:       "Incubation:expenditure/income",
//   FDP:              "FDP",
//   COURSES:          "Academic Courses in Innovation, Entrepreneurship and IPR",
// } as const;

// // ─── STANDARD SECTION MINIMUMS ────────────────────────────────────────────────
// //
// //   0 = not required for this category  (skipped in validation)
// //   N = must have ≥ N rows
// //
// // Row-count thresholds come from what a typical complete extraction produces:
// //   intake       : 2   (1 programme × 2+ years min)
// //   strength     : 1
// //   placement    : 6   (1 programme × multiple metric cols)
// //   phd          : 2   (full-time + part-time pursuing rows at minimum)
// //   capex / opex : 9   (3 line items × 3 financial years)
// //   sr / cons    : 9   (3 metrics × 3 years)
// //   edp          : 9   (3 metrics × 3 years — only for Management)
// //   pcs          : 3   (lifts, ramps, wheelchair — one row each)
// //   faculty      : 1
// //   sustainability: 7  (7 YES/NO questions)
// //   opd          : 1   (at least the average OPD row)

// interface StdMins {
//   intake:           number;
//   strength:         number;
//   placement:        number;
//   phd:              number;
//   capex:            number;
//   opex:             number;
//   sr:               number;
//   consultancy:      number;
//   edp:              number;
//   pcs:              number;
//   faculty:          number;
//   accreditation:    number;
//   sustainability:   number;
//   opd:              number;
//   vocational:       number;
//   new_programs:     number;
//   programs_revised: number;
// }

// type MinKey = keyof StdMins;

// // ── Base full-set (Overall / University / Research) ───────────────────────────
// const DEFAULT_MINS: StdMins = {
//   intake: 2, strength: 1, placement: 6,
//   phd: 2, capex: 9, opex: 9,
//   sr: 9, consultancy: 9,
//   edp: 0,           // EDP optional for most categories
//   pcs: 3, faculty: 1,
//   accreditation: 0, // optional — not all institutes have it
//   sustainability: 7, // NEW 2024 — required for most categories
//   opd: 0,
//   vocational: 0,
//   new_programs: 0,
//   programs_revised: 0,
// };

// // IR-A Architecture
// // 2024 evidence: SR + Consultancy present; no PhD, no EDP, no Sustainability
// const ARCH_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0,
//   edp: 0,
//   sustainability: 0,
// };

// // IR-C College
// // Arts/science colleges: no PhD, SR, Consultancy, EDP, Sustainability
// const COLLEGE_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0, sr: 0, consultancy: 0, edp: 0, sustainability: 0,
// };

// // IR-D Medical
// // OPD required; no Consultancy, EDP, Sustainability
// const MEDICAL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   consultancy: 0, edp: 0, sustainability: 0,
//   opd: 1,
// };

// // IR-E Engineering
// // No EDP; Consultancy required; no Sustainability observed in 2024 sample
// const ENG_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0, sustainability: 0,
// };

// // IR-G Agriculture — same as Engineering
// const AGRI_MINS: StdMins = { ...ENG_MINS };

// // IR-L Law
// // 2024 evidence: PhD, SR, Consultancy all present; no EDP; no Sustainability
// const LAW_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0, sustainability: 0,
// };

// // IR-M Management
// // 2024 evidence: full set including EDP, SR, Consultancy
// const MGMT_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 9,          // EDP is the primary differentiating section for management schools
//   sustainability: 0,
// };

// // IR-N Dental — same as Medical
// const DENTAL_MINS: StdMins = { ...MEDICAL_MINS };

// // IR-O Overall
// // 2024 evidence: Sustainability in all 3 samples; EDP + Accreditation optional
// const OVERALL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   sustainability: 7,
// };

// // IR-P Pharmacy
// // 2024 evidence: PhD, SR, Consultancy all present; no EDP; no Sustainability
// const PHARMACY_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0, sustainability: 0,
// };

// // IR-R Research — like Overall
// const RESEARCH_MINS: StdMins = { ...DEFAULT_MINS, sustainability: 7 };

// // IR-S Skill University  (NEW 2024 category)
// // Vocational Certificate Courses is the key section; no PhD
// const SKILL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0, edp: 0, sustainability: 0,
//   vocational: 9,
// };

// // IR-U University — same as Overall
// const UNIV_MINS: StdMins = { ...OVERALL_MINS };

// // IR-V Open University  (NEW 2024 category)
// // New Programs + Programs Revised are required; no EDP
// const OPEN_UNIV_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0,
//   sustainability: 7,
//   new_programs: 1,
//   programs_revised: 1,
// };

// function getStdMins(code: string): StdMins {
//   switch (code.substring(0, 4).toUpperCase()) {
//     case "IR-A": return ARCH_MINS;
//     case "IR-C": return COLLEGE_MINS;
//     case "IR-D": return MEDICAL_MINS;
//     case "IR-E": return ENG_MINS;
//     case "IR-G": return AGRI_MINS;
//     case "IR-L": return LAW_MINS;
//     case "IR-M": return MGMT_MINS;
//     case "IR-N": return DENTAL_MINS;
//     case "IR-O": return OVERALL_MINS;
//     case "IR-P": return PHARMACY_MINS;
//     case "IR-R": return RESEARCH_MINS;
//     case "IR-S": return SKILL_MINS;
//     case "IR-U": return UNIV_MINS;
//     case "IR-V": return OPEN_UNIV_MINS;
//     default:     return DEFAULT_MINS;
//   }
// }

// // ─── INNOVATION (IR-I) SECTION MINIMUMS ──────────────────────────────────────
// //
// // IR-I institutes use a completely different template with no standard financial
// // or placement sections. Everything below must be ≥ 1 row.

// interface InnoMins {
//   intake:         number;
//   strength:       number;
//   faculty:        number;
//   startups:       number;
//   startups_vc:    number;
//   patents:        number;
//   trl:            number;
//   pre_incubation: number;
//   incubation:     number;
//   fdp:            number;
//   courses:        number;
// }

// const INNO_MINS: InnoMins = {
//   intake: 1, strength: 1, faculty: 1,
//   startups: 1, startups_vc: 1, patents: 1, trl: 1,
//   pre_incubation: 1, incubation: 1, fdp: 1, courses: 1,
// };

// const INNO_SEC_MAP: Record<keyof InnoMins, string> = {
//   intake:         S.INTAKE,
//   strength:       S.STRENGTH,
//   faculty:        S.FACULTY,
//   startups:       S.STARTUPS,
//   startups_vc:    S.STARTUPS_VC,
//   patents:        S.PATENTS,
//   trl:            S.TRL,
//   pre_incubation: S.PRE_INCUBATION,
//   incubation:     S.INCUBATION,
//   fdp:            S.FDP,
//   courses:        S.COURSES,
// };

// // ─── STANDARD SECTION MAP ────────────────────────────────────────────────────

// const STD_SEC_MAP: Record<MinKey, string> = {
//   intake:           S.INTAKE,
//   strength:         S.STRENGTH,
//   placement:        S.PLACEMENT,
//   phd:              S.PHD,
//   capex:            S.CAPEX,
//   opex:             S.OPEX,
//   sr:               S.SR,
//   consultancy:      S.CONSULTANCY,
//   edp:              S.EDP,
//   pcs:              S.PCS,
//   faculty:          S.FACULTY,
//   accreditation:    S.ACCREDITATION,
//   sustainability:   S.SUSTAINABILITY,
//   opd:              S.OPD,
//   vocational:       S.VOCATIONAL,
//   new_programs:     S.NEW_PROGRAMS,
//   programs_revised: S.PROGRAMS_REVISED,
// };

// const STD_KEYS = Object.keys(STD_SEC_MAP) as MinKey[];

// // ─── CATEGORY LEGEND ──────────────────────────────────────────────────────────

// const CAT_LEGEND: Record<string, string> = {
//   "IR-A": "Architecture",
//   "IR-C": "College",
//   "IR-D": "Medical",
//   "IR-E": "Engineering",
//   "IR-G": "Agriculture",
//   "IR-I": "Innovation  [separate template]",
//   "IR-L": "Law",
//   "IR-M": "Management",
//   "IR-N": "Dental",
//   "IR-O": "Overall",
//   "IR-P": "Pharmacy",
//   "IR-R": "Research",
//   "IR-S": "Skill University  [new 2024]",
//   "IR-U": "University",
//   "IR-V": "Open University  [new 2024]",
// };

// // ─── CSV PARSER ───────────────────────────────────────────────────────────────

// interface Row {
//   rankingYear:   string;
//   category:      string;
//   instituteCode: string;
//   instituteName: string;
//   section:       string;
//   program:       string;
//   year:          string;
//   metric:        string;
//   value:         string;
// }

// function parseCSV(filePath: string): Row[] {
//   const lines = fs.readFileSync(filePath, "utf8").split("\n");
//   const rows: Row[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;
//     const cells: string[] = [];
//     let cur = ""; let inQ = false;
//     for (let j = 0; j < line.length; j++) {
//       const ch = line[j];
//       if (ch === '"') { if (inQ && line[j+1] === '"') { cur += '"'; j++; } else inQ = !inQ; }
//       else if (ch === ',' && !inQ) { cells.push(cur); cur = ""; }
//       else cur += ch;
//     }
//     cells.push(cur);
//     if (cells.length < 9) continue;
//     rows.push({
//       rankingYear:   cells[0].trim(),
//       category:      cells[1].trim(),
//       instituteCode: cells[2].trim(),
//       instituteName: cells[3].trim(),
//       section:       cells[4].trim(),
//       program:       cells[5].trim(),
//       year:          cells[6].trim(),
//       metric:        cells[7].trim(),
//       value:         cells[8].trim(),
//     });
//   }
//   return rows;
// }

// // ─── ANALYSIS ─────────────────────────────────────────────────────────────────

// interface InstReport {
//   code:         string;
//   name:         string;
//   category:     string;
//   totalRows:    number;
//   isInno:       boolean;
//   stdCounts:    Partial<Record<MinKey, number>>;
//   innoCounts:   Partial<Record<keyof InnoMins, number>>;
//   allSections:  Record<string, number>;
//   issues:       string[];
// }

// function analyze(rows: Row[]): InstReport[] {
//   const byInst = new Map<string, Row[]>();
//   for (const r of rows) {
//     if (!byInst.has(r.instituteCode)) byInst.set(r.instituteCode, []);
//     byInst.get(r.instituteCode)!.push(r);
//   }

//   const reports: InstReport[] = [];

//   for (const [code, instRows] of byInst) {
//     const name    = instRows[0].instituteName;
//     const cat     = instRows[0].category;
//     const isInno  = code.startsWith("IR-I-");
//     const issues: string[] = [];

//     // Section counts (all sections seen)
//     const allSections: Record<string, number> = {};
//     for (const r of instRows) allSections[r.section] = (allSections[r.section] ?? 0) + 1;

//     if (isInno) {
//       // ── Innovation template ─────────────────────────────────────────────────
//       const innoCounts: Partial<Record<keyof InnoMins, number>> = {};
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         innoCounts[k] = allSections[INNO_SEC_MAP[k]] ?? 0;
//         const min = INNO_MINS[k];
//         if (min === 0) continue;
//         const count = innoCounts[k]!;
//         const short = INNO_SEC_MAP[k].length > 65
//           ? INNO_SEC_MAP[k].slice(0, 62) + "..." : INNO_SEC_MAP[k];
//         if (count === 0) issues.push(`❌ MISSING: ${short}`);
//         else if (count < min) issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }
//       if (instRows.length < 20) issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length}`);

//       // Flag unexpected sections (might indicate template mis-match)
//       const knownInno = new Set(Object.values(INNO_SEC_MAP));
//       for (const sec of Object.keys(allSections)) {
//         if (!knownInno.has(sec)) issues.push(`ℹ  UNEXPECTED SECTION: "${sec}"`);
//       }

//       reports.push({ code, name, category: cat, totalRows: instRows.length,
//         isInno: true, stdCounts: {}, innoCounts, allSections, issues });

//     } else {
//       // ── Standard template ───────────────────────────────────────────────────
//       const mins = getStdMins(code);
//       const stdCounts: Partial<Record<MinKey, number>> = {};
//       for (const k of STD_KEYS) {
//         stdCounts[k] = allSections[STD_SEC_MAP[k]] ?? 0;
//         const min   = mins[k];
//         if (min === 0) continue;
//         const count = stdCounts[k]!;
//         const short = STD_SEC_MAP[k].length > 65
//           ? STD_SEC_MAP[k].slice(0, 62) + "..." : STD_SEC_MAP[k];
//         if (count === 0) issues.push(`❌ MISSING: ${short}`);
//         else if (count < min) issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }
//       if (instRows.length < 15) {
//         issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows`);
//       }

//       reports.push({ code, name, category: cat, totalRows: instRows.length,
//         isInno: false, stdCounts, innoCounts: {}, allSections, issues });
//     }
//   }

//   reports.sort((a, b) => (b.issues.length - a.issues.length) || a.code.localeCompare(b.code));
//   return reports;
// }

// // ─── REPORT ───────────────────────────────────────────────────────────────────

// function printReport(reports: InstReport[]): void {
//   const total   = reports.length;
//   const clean   = reports.filter(r => r.issues.length === 0);
//   const flagged = reports.filter(r => r.issues.length > 0);
//   const LINE    = "═".repeat(110);
//   const LINE2   = "─".repeat(110);

//   // ── Summary header ──────────────────────────────────────────────────────────
//   console.log("\n" + LINE);
//   console.log("  NIRF EXTRACTION VALIDATION REPORT  ·  2024 edition");
//   console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
//   console.log(LINE);
//   console.log(`\n  Total institutes : ${total.toLocaleString()}`);
//   console.log(`  ✅ Clean          : ${clean.length.toLocaleString()}`);
//   console.log(`  ❌ Flagged        : ${flagged.length.toLocaleString()}`);

//   // ── Category breakdown ──────────────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  INSTITUTES BY CATEGORY\n");
//   const byCat: Record<string, { total: number; flagged: number }> = {};
//   for (const r of reports) {
//     const p = r.code.substring(0, 4).toUpperCase();
//     if (!byCat[p]) byCat[p] = { total: 0, flagged: 0 };
//     byCat[p].total++;
//     if (r.issues.length > 0) byCat[p].flagged++;
//   }
//   for (const [prefix, c] of Object.entries(byCat).sort()) {
//     const catName = CAT_LEGEND[prefix] ?? "Unknown";
//     const flag    = c.flagged > 0 ? `❌ ${c.flagged} flagged` : "✅ all clean";
//     console.log(`  ${prefix.padEnd(6)}  ${catName.padEnd(44)}  ${String(c.total).padStart(4)} institutes  ${flag}`);
//   }

//   // ── Standard section coverage summary ──────────────────────────────────────
//   const stdReports = reports.filter(r => !r.isInno);
//   if (stdReports.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  STANDARD SECTION COVERAGE  (all non-Innovation institutes)\n");
//     console.log(
//       `  ${"Section".padEnd(68)}  ${"Missing".padStart(8)}  ${"Low".padStart(6)}  Status`
//     );
//     console.log("  " + "─".repeat(97));

//     // Aggregate missing/low counts across all standard reports
//     const missCnt: Record<MinKey, number> = {} as any;
//     const lowCnt:  Record<MinKey, number> = {} as any;
//     for (const k of STD_KEYS) { missCnt[k] = 0; lowCnt[k] = 0; }

//     for (const r of stdReports) {
//       const mins = getStdMins(r.code);
//       for (const k of STD_KEYS) {
//         if (mins[k] === 0) continue;
//         const count = r.stdCounts[k] ?? 0;
//         if (count === 0) missCnt[k]++;
//         else if (count < mins[k]) lowCnt[k]++;
//       }
//     }

//     for (const k of STD_KEYS) {
//       const label   = STD_SEC_MAP[k];
//       const short   = label.length > 68 ? label.slice(0, 65) + "..." : label;
//       const missing = missCnt[k];
//       const low     = lowCnt[k];
//       const icon    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
//       const detail  = missing > 0 ? `${missing} missing, ${low} low`
//                     : low > 0     ? `${low} low`
//                     :               "all present";
//       console.log(
//         `  ${icon}  ${short.padEnd(68)}  ${String(missing).padStart(6)}  ${String(low).padStart(4)}  ${detail}`
//       );
//     }
//   }

//   // ── Innovation section coverage ─────────────────────────────────────────────
//   const innoReports = reports.filter(r => r.isInno);
//   if (innoReports.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  INNOVATION SECTION COVERAGE  (IR-I institutes)\n");
//     const innoMissCnt: Record<keyof InnoMins, number> = {} as any;
//     for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) innoMissCnt[k] = 0;
//     for (const r of innoReports) {
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         if (INNO_MINS[k] === 0) continue;
//         if ((r.innoCounts[k] ?? 0) === 0) innoMissCnt[k]++;
//       }
//     }
//     for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//       const label   = INNO_SEC_MAP[k];
//       const short   = label.length > 68 ? label.slice(0, 65) + "..." : label;
//       const missing = innoMissCnt[k];
//       console.log(`  ${missing > 0 ? "❌" : "✅"}  ${short.padEnd(68)}  ${String(missing).padStart(4)} missing`);
//     }
//   }

//   // ── Per-institute flagged list ───────────────────────────────────────────────
//   if (flagged.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  FLAGGED INSTITUTES\n");
//     for (const r of flagged) {
//       const tag = r.isInno ? "  [Innovation]" : "";
//       console.log(
//         `  ${r.code.padEnd(20)}  ${r.name.slice(0, 46).padEnd(47)}` +
//         `[${r.category.padEnd(12)}]  ${r.totalRows} rows${tag}`
//       );
//       for (const issue of r.issues) console.log(`    ${issue}`);
//     }
//   }

//   console.log("\n" + LINE2);
//   console.log(`  ✅ ${clean.length} institutes passed all checks`);

//   // ── Write full report file ───────────────────────────────────────────────────
//   const reportPath = path.join(path.dirname(CSV_PATH), "validation-report.txt");
//   const lines: string[] = [];

//   lines.push(`NIRF EXTRACTION VALIDATION REPORT (2024 edition) — Year: ${year}`);
//   lines.push(`Generated : ${new Date().toISOString()}`);
//   lines.push(`CSV       : ${CSV_PATH}`);
//   lines.push(`Total     : ${total}  |  Clean: ${clean.length}  |  Flagged: ${flagged.length}`);
//   lines.push("");

//   lines.push("CATEGORY LEGEND:");
//   for (const [p, n] of Object.entries(CAT_LEGEND)) lines.push(`  ${p.padEnd(6)}  ${n}`);
//   lines.push("");

//   lines.push("FLAGGED INSTITUTES:");
//   for (const r of flagged) {
//     lines.push(`\n${r.code}  ${r.name}  [${r.category}]  ${r.totalRows} rows${r.isInno ? "  [Innovation]" : ""}`);
//     for (const issue of r.issues) lines.push(`  ${issue}`);
//     lines.push("  Section row counts:");
//     if (r.isInno) {
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         const cnt = r.innoCounts[k] ?? 0;
//         const min = INNO_MINS[k];
//         const st  = min === 0 ? "N/A" : cnt === 0 ? "MISSING" : cnt < min ? `LOW(${cnt})` : `OK(${cnt})`;
//         lines.push(`    [${st.padEnd(10)}]  ${INNO_SEC_MAP[k]}`);
//       }
//     } else {
//       const mins = getStdMins(r.code);
//       for (const k of STD_KEYS) {
//         const cnt = r.stdCounts[k] ?? 0;
//         const min = mins[k];
//         const st  = min === 0 ? "N/A" : cnt === 0 ? "MISSING" : cnt < min ? `LOW(${cnt})` : `OK(${cnt})`;
//         lines.push(`    [${st.padEnd(10)}]  ${STD_SEC_MAP[k]}`);
//       }
//     }
//     // List any unrecognised sections found
//     const knownSecs = r.isInno
//       ? new Set(Object.values(INNO_SEC_MAP))
//       : new Set(Object.values(STD_SEC_MAP));
//     const extra = Object.keys(r.allSections).filter(s => !knownSecs.has(s));
//     if (extra.length > 0) {
//       lines.push("  Unrecognised sections found (may be new template additions):");
//       for (const s of extra) lines.push(`    [${String(r.allSections[s]).padStart(4)} rows]  ${s}`);
//     }
//   }

//   lines.push("\n\nCLEAN INSTITUTES:");
//   for (const r of clean) lines.push(`  ${r.code.padEnd(20)}  ${r.name}  (${r.totalRows} rows)`);

//   fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
//   console.log(`\n  Full report written to: ${reportPath}`);
//   console.log(LINE + "\n");
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// function main(): void {
//   if (!fs.existsSync(CSV_PATH)) {
//     console.error(`\n❌ CSV not found: ${CSV_PATH}`);
//     console.error(`   Run the downloader first for year ${year}\n`);
//     process.exit(1);
//   }
//   console.log(`\nReading: ${CSV_PATH}`);
//   const rows     = parseCSV(CSV_PATH);
//   const instCount = new Set(rows.map(r => r.instituteCode)).size;
//   console.log(`Parsed ${rows.length.toLocaleString()} data rows from ${instCount} institutes`);
//   const reports  = analyze(rows);
//   printReport(reports);
// }

// main();







































//2025



// import fs   from "fs";
// import path from "path";

// // ─── CONFIG ───────────────────────────────────────────────────────────────────

// const year     = process.argv[2] ?? "2025";
// const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// // ─── SECTION NAME CONSTANTS ───────────────────────────────────────────────────

// const S = {
//   INTAKE:           "Sanctioned (Approved) Intake",
//   STRENGTH:         "Total Actual Student Strength (Program(s) Offered by your Institution)",
//   PLACEMENT:        "Placement & Higher Studies",
//   PHD:              "Ph.D Student Details",
//   CAPEX:            "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years",
//   OPEX:             "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years",
//   SR:               "Sponsored Research Details",
//   CONSULTANCY:      "Consultancy Project Details",
//   EDP:              "Executive Development Program/Management Development Programs",
//   PCS:              "PCS Facilities: Facilities of Physically Challenged Students",
//   FACULTY:          "Faculty Details",
//   ACCREDITATION:    "Accreditation",
//   // ── 2024 sections (still present in 2025) ────────────────────────────────
//   SUSTAINABILITY:   "Sustainability Details",          // numeric year-col data (2025 expanded)
//   OPD:              "OPD Attendance & Bed Occupancy",
//   VOCATIONAL:       "Vocational Certificate Courses",
//   NEW_PROGRAMS:     "New Programs Developed",
//   PROGRAMS_REVISED: "Programs Revised",
//   // ── 2025 NEW sections ────────────────────────────────────────────────────
//   SUSTAINABLE_LIVING: "Sustainable Living Practices",  // multi-choice text answers
//   MEI_IKS:            "Multiple Entry/Exit and Indian Knowledge System",
//   PRIOR_LEARNING:     "Prior Learning at Different Levels",  // IR-S only
//   CURRICULUM_DESIGN:  "Curriculum Design",                   // IR-S only
//   // ── Innovation-only sections ─────────────────────────────────────────────
//   STARTUPS:         "Start up recognized by DPIIT/startup India",
//   STARTUPS_VC:      "Startups which have got VC investment in previous 3 years",
//   FDI:              "FDI investment in previous 3 years",
//   INNO_GRANT:       "Innovation grant received from govt. organization in previous 3 years",
//   PATENTS:          "Patents",
//   PATENTS_COM:      "Patents Commercialized & Technology Transferred",
//   TRL:              "Innovations at various stages of Technology Readiness Level",
//   VENTURES:         "Ventures/startups grown to turnover of 50 lacs",
//   ALUMNI:           "Alumni that are Founders of Forbes/Fortune 500 companies",
//   PRE_INCUBATION:   "Pre-incubation:expenditure/income",
//   INCUBATION:       "Incubation:expenditure/income",
//   FDP:              "FDP",
//   COURSES:          "Academic Courses in Innovation, Entrepreneurship and IPR",
// } as const;

// // ─── STANDARD SECTION MINIMUMS ────────────────────────────────────────────────
// //
// //   0 = not required for this category  (skipped in validation)
// //   N = must have ≥ N rows
// //
// // 2025 threshold notes:
// //   sustainability      : 7  — now numeric year-col data; 3 metrics × 3 years ≥ 9 possible
// //                              but keeping 7 as conservative floor (some institutes have fewer metrics)
// //   sustainable_living  : 5  — 5+ multi-choice question answers expected
// //   mei_iks             : 3  — 5 YES/NO fields; floor of 3 to allow partial responses
// //   prior_learning      : 3  — IR-S only: 3 rows (3 academic years at min)
// //   curriculum_design   : 1  — IR-S only: at least 1 row

// interface StdMins {
//   intake:             number;
//   strength:           number;
//   placement:          number;
//   phd:                number;
//   capex:              number;
//   opex:               number;
//   sr:                 number;
//   consultancy:        number;
//   edp:                number;
//   pcs:                number;
//   faculty:            number;
//   accreditation:      number;
//   sustainability:     number;
//   sustainable_living: number;
//   mei_iks:            number;
//   opd:                number;
//   vocational:         number;
//   new_programs:       number;
//   programs_revised:   number;
//   prior_learning:     number;
//   curriculum_design:  number;
// }

// type MinKey = keyof StdMins;

// // ── Base full-set (Overall / University / Research) ───────────────────────────
// const DEFAULT_MINS: StdMins = {
//   intake: 2, strength: 1, placement: 6,
//   phd: 2, capex: 9, opex: 9,
//   sr: 9, consultancy: 9,
//   edp: 0,            // EDP optional for most categories
//   pcs: 3, faculty: 1,
//   accreditation: 0,  // optional — not all institutes have it
//   // 2025 new/expanded
//   sustainability:     7,  // numeric data (energy, water, waste, campus area)
//   sustainable_living: 5,  // multi-choice text answers
//   mei_iks:            3,  // Multiple Entry/Exit & Indian Knowledge System
//   opd: 0,
//   vocational: 0, new_programs: 0, programs_revised: 0,
//   prior_learning: 0, curriculum_design: 0,
// };

// // IR-A Architecture
// const ARCH_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0, edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-C College
// const COLLEGE_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0, sr: 0, consultancy: 0, edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-D Medical
// // OPD required; no EDP; sustainability sections not observed in 2025 samples
// const MEDICAL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   consultancy: 0, edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
//   opd: 1,
// };

// // IR-E Engineering — no EDP; no sustainability observed in 2025 samples
// const ENG_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-G Agriculture — same as Engineering
// const AGRI_MINS: StdMins = { ...ENG_MINS };

// // IR-L Law — no EDP
// const LAW_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-M Management — EDP required; no sustainability observed in 2025 samples
// const MGMT_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 9,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-N Dental — same as Medical
// const DENTAL_MINS: StdMins = { ...MEDICAL_MINS };

// // IR-O Overall
// // 2025 evidence: Sustainable Living Practices + MEI/IKS present in both samples;
// // numeric Sustainability Details absent (IISc had none, IIT Madras had none) —
// // keeping sustainability at 0 until more data; sustainable_living and mei_iks confirmed.
// const OVERALL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   sustainability:     0,   // numeric sustainability sub-tables not observed in IR-O 2025 samples
//   sustainable_living: 5,   // confirmed present in IR-O-U-0220 (13 rows) and IR-O-U-0456 (14 rows)
//   mei_iks:            3,   // confirmed present in IR-O-U-0220 and IR-O-U-0456 (5 rows each)
// };

// // IR-P Pharmacy — no EDP
// const PHARMACY_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
// };

// // IR-R Research — like Overall
// const RESEARCH_MINS: StdMins = { ...OVERALL_MINS };

// // IR-S Skill University
// // 2025: Prior Learning + Curriculum Design are new required sections;
// // Vocational Certificate Courses still required.
// // Sustainable Living / MEI_IKS not observed in IR-S 2025 sample.
// // NOTE: IR-S-U-0921 had no CAPEX/OPEX despite being present in the CSV — keeping at 9
// // since extraction succeeded for that sample.
// const SKILL_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   phd: 0, edp: 0,
//   sustainability: 0, sustainable_living: 0, mei_iks: 0,
//   vocational:        9,  // key differentiating section
//   prior_learning:    3,  // 2025 NEW — IR-S specific (3 academic years)
//   curriculum_design: 1,  // 2025 NEW — IR-S specific
// };

// // IR-U University
// // 2025: IR-B-U-0108 had NO CAPEX/OPEX/PLACEMENT but had Sustainability + Sustainable Living.
// // That appears to be the IR-B (Business/Management subtype of University) pattern.
// // Using OVERALL_MINS as the base since most University PDFs follow the same structure.
// const UNIV_MINS: StdMins = { ...OVERALL_MINS };

// // IR-V Open University
// // 2025: New Programs + Programs Revised required; MEI_IKS confirmed present.
// // Sustainable Living NOT observed in IR-V-U-0104 sample — keeping at 0.
// const OPEN_UNIV_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   edp: 0,
//   sustainability: 0, sustainable_living: 0,
//   mei_iks:          3,   // confirmed present in IR-V-U-0104 (5 rows)
//   new_programs:     1,   // confirmed present
//   programs_revised: 1,   // confirmed present
// };

// // IR-B is a University sub-code used for Business/Management schools in the University ranking.
// // 2025 evidence (IR-B-U-0108 / Jamia Millia): NO placement, NO capex/opex, NO PhD count rows
// // (PhD table present but all zeros for that institute).
// // Has: Sustainability (48 rows), Sustainable Living (18 rows), SR, Consultancy.
// // Treating as a University variant with relaxed placement/financial minimums.
// const BSCHOOL_UNIV_MINS: StdMins = {
//   ...DEFAULT_MINS,
//   placement: 0, phd: 0, capex: 0, opex: 0, edp: 0,
//   sustainability:     7,
//   sustainable_living: 5,
//   mei_iks:            0,  // not observed in IR-B sample
// };

// function getStdMins(code: string): StdMins {
//   const prefix = code.substring(0, 4).toUpperCase();
//   switch (prefix) {
//     case "IR-A": return ARCH_MINS;
//     case "IR-B": return BSCHOOL_UNIV_MINS;
//     case "IR-C": return COLLEGE_MINS;
//     case "IR-D": return MEDICAL_MINS;
//     case "IR-E": return ENG_MINS;
//     case "IR-G": return AGRI_MINS;
//     case "IR-L": return LAW_MINS;
//     case "IR-M": return MGMT_MINS;
//     case "IR-N": return DENTAL_MINS;
//     case "IR-O": return OVERALL_MINS;
//     case "IR-P": return PHARMACY_MINS;
//     case "IR-R": return RESEARCH_MINS;
//     case "IR-S": return SKILL_MINS;
//     case "IR-U": return UNIV_MINS;
//     case "IR-V": return OPEN_UNIV_MINS;
//     default:     return DEFAULT_MINS;
//   }
// }

// // ─── INNOVATION (IR-I) SECTION MINIMUMS ──────────────────────────────────────

// interface InnoMins {
//   intake:         number;
//   strength:       number;
//   faculty:        number;
//   startups:       number;
//   startups_vc:    number;
//   patents:        number;
//   trl:            number;
//   pre_incubation: number;
//   incubation:     number;
//   fdp:            number;
//   courses:        number;
// }

// const INNO_MINS: InnoMins = {
//   intake: 1, strength: 1, faculty: 1,
//   startups: 1, startups_vc: 1, patents: 1, trl: 1,
//   pre_incubation: 1, incubation: 1, fdp: 1, courses: 1,
// };

// const INNO_SEC_MAP: Record<keyof InnoMins, string> = {
//   intake:         S.INTAKE,
//   strength:       S.STRENGTH,
//   faculty:        S.FACULTY,
//   startups:       S.STARTUPS,
//   startups_vc:    S.STARTUPS_VC,
//   patents:        S.PATENTS,
//   trl:            S.TRL,
//   pre_incubation: S.PRE_INCUBATION,
//   incubation:     S.INCUBATION,
//   fdp:            S.FDP,
//   courses:        S.COURSES,
// };

// // ─── STANDARD SECTION MAP ────────────────────────────────────────────────────

// const STD_SEC_MAP: Record<MinKey, string> = {
//   intake:             S.INTAKE,
//   strength:           S.STRENGTH,
//   placement:          S.PLACEMENT,
//   phd:                S.PHD,
//   capex:              S.CAPEX,
//   opex:               S.OPEX,
//   sr:                 S.SR,
//   consultancy:        S.CONSULTANCY,
//   edp:                S.EDP,
//   pcs:                S.PCS,
//   faculty:            S.FACULTY,
//   accreditation:      S.ACCREDITATION,
//   sustainability:     S.SUSTAINABILITY,
//   sustainable_living: S.SUSTAINABLE_LIVING,
//   mei_iks:            S.MEI_IKS,
//   opd:                S.OPD,
//   vocational:         S.VOCATIONAL,
//   new_programs:       S.NEW_PROGRAMS,
//   programs_revised:   S.PROGRAMS_REVISED,
//   prior_learning:     S.PRIOR_LEARNING,
//   curriculum_design:  S.CURRICULUM_DESIGN,
// };

// const STD_KEYS = Object.keys(STD_SEC_MAP) as MinKey[];

// // ─── CATEGORY LEGEND ─────────────────────────────────────────────────────────

// const CAT_LEGEND: Record<string, string> = {
//   "IR-A": "Architecture",
//   "IR-B": "B-School / Management (University sub-code)",
//   "IR-C": "College",
//   "IR-D": "Medical",
//   "IR-E": "Engineering",
//   "IR-G": "Agriculture",
//   "IR-I": "Innovation  [separate template]",
//   "IR-L": "Law",
//   "IR-M": "Management",
//   "IR-N": "Dental",
//   "IR-O": "Overall",
//   "IR-P": "Pharmacy",
//   "IR-R": "Research",
//   "IR-S": "Skill University  [2025 sections: Prior Learning, Curriculum Design]",
//   "IR-U": "University",
//   "IR-V": "Open University  [2025 sections: MEI/IKS, New Programs, Programs Revised]",
// };

// // ─── KNOWN 2025 SECTIONS ──────────────────────────────────────────────────────
// // All sections that the 2025 extractor can produce. Used to flag truly unexpected
// // sections that might indicate a new template variant we haven't seen yet.

// const ALL_KNOWN_2025_SECTIONS = new Set([
//   ...Object.values(STD_SEC_MAP),
//   ...Object.values(INNO_SEC_MAP),
//   // Sustainability numeric sub-sections emitted by extractor branches P-2/P-3/P-4
//   "Sustainability Details: Energy and Water Consumption",
//   "Sustainability Details: Environment",
//   "Sustainability Details: Waste",
// ]);

// // ─── CSV PARSER ───────────────────────────────────────────────────────────────

// interface Row {
//   rankingYear:   string;
//   category:      string;
//   instituteCode: string;
//   instituteName: string;
//   section:       string;
//   program:       string;
//   year:          string;
//   metric:        string;
//   value:         string;
// }

// function parseCSV(filePath: string): Row[] {
//   const lines = fs.readFileSync(filePath, "utf8").split("\n");
//   const rows: Row[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;
//     const cells: string[] = [];
//     let cur = ""; let inQ = false;
//     for (let j = 0; j < line.length; j++) {
//       const ch = line[j];
//       if (ch === '"') { if (inQ && line[j+1] === '"') { cur += '"'; j++; } else inQ = !inQ; }
//       else if (ch === ',' && !inQ) { cells.push(cur); cur = ""; }
//       else cur += ch;
//     }
//     cells.push(cur);
//     if (cells.length < 9) continue;
//     rows.push({
//       rankingYear:   cells[0].trim(),
//       category:      cells[1].trim(),
//       instituteCode: cells[2].trim(),
//       instituteName: cells[3].trim(),
//       section:       cells[4].trim(),
//       program:       cells[5].trim(),
//       year:          cells[6].trim(),
//       metric:        cells[7].trim(),
//       value:         cells[8].trim(),
//     });
//   }
//   return rows;
// }

// // ─── ANALYSIS ─────────────────────────────────────────────────────────────────

// interface InstReport {
//   code:         string;
//   name:         string;
//   category:     string;
//   totalRows:    number;
//   isInno:       boolean;
//   stdCounts:    Partial<Record<MinKey, number>>;
//   innoCounts:   Partial<Record<keyof InnoMins, number>>;
//   allSections:  Record<string, number>;
//   issues:       string[];
// }

// function analyze(rows: Row[]): InstReport[] {
//   const byInst = new Map<string, Row[]>();
//   for (const r of rows) {
//     if (!byInst.has(r.instituteCode)) byInst.set(r.instituteCode, []);
//     byInst.get(r.instituteCode)!.push(r);
//   }

//   const reports: InstReport[] = [];

//   for (const [code, instRows] of byInst) {
//     const name   = instRows[0].instituteName;
//     const cat    = instRows[0].category;
//     const isInno = code.startsWith("IR-I-");
//     const issues: string[] = [];

//     // Section counts (all sections seen)
//     const allSections: Record<string, number> = {};
//     for (const r of instRows) allSections[r.section] = (allSections[r.section] ?? 0) + 1;

//     if (isInno) {
//       // ── Innovation template ───────────────────────────────────────────────
//       const innoCounts: Partial<Record<keyof InnoMins, number>> = {};
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         innoCounts[k] = allSections[INNO_SEC_MAP[k]] ?? 0;
//         const min = INNO_MINS[k];
//         if (min === 0) continue;
//         const count = innoCounts[k]!;
//         const short = INNO_SEC_MAP[k].length > 65
//           ? INNO_SEC_MAP[k].slice(0, 62) + "..." : INNO_SEC_MAP[k];
//         if (count === 0) issues.push(`❌ MISSING: ${short}`);
//         else if (count < min) issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }
//       if (instRows.length < 20) issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length}`);

//       for (const sec of Object.keys(allSections)) {
//         if (!ALL_KNOWN_2025_SECTIONS.has(sec))
//           issues.push(`ℹ  UNKNOWN SECTION (new template?): "${sec}"`);
//       }

//       reports.push({ code, name, category: cat, totalRows: instRows.length,
//         isInno: true, stdCounts: {}, innoCounts, allSections, issues });

//     } else {
//       // ── Standard template ─────────────────────────────────────────────────
//       const mins = getStdMins(code);
//       const stdCounts: Partial<Record<MinKey, number>> = {};

//       for (const k of STD_KEYS) {
//         stdCounts[k] = allSections[STD_SEC_MAP[k]] ?? 0;

//         // Also count sustainability numeric sub-sections into the sustainability key
//         // (2025 extractor may emit under sub-names like "Sustainability Details: Waste")
//         if (k === "sustainability") {
//           stdCounts[k]! +
//             (allSections["Sustainability Details: Energy and Water Consumption"] ?? 0) +
//             (allSections["Sustainability Details: Environment"] ?? 0) +
//             (allSections["Sustainability Details: Waste"] ?? 0);
//           // Recompute: sum all sustainability sub-sections
//           stdCounts[k] =
//             (allSections[S.SUSTAINABILITY] ?? 0) +
//             (allSections["Sustainability Details: Energy and Water Consumption"] ?? 0) +
//             (allSections["Sustainability Details: Environment"] ?? 0) +
//             (allSections["Sustainability Details: Waste"] ?? 0);
//         }

//         const min   = mins[k];
//         if (min === 0) continue;
//         const count = stdCounts[k]!;
//         const short = STD_SEC_MAP[k].length > 65
//           ? STD_SEC_MAP[k].slice(0, 62) + "..." : STD_SEC_MAP[k];
//         if (count === 0) issues.push(`❌ MISSING: ${short}`);
//         else if (count < min) issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }

//       if (instRows.length < 15) {
//         issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows`);
//       }

//       // Flag any section not in the known-2025 set
//       for (const sec of Object.keys(allSections)) {
//         if (!ALL_KNOWN_2025_SECTIONS.has(sec))
//           issues.push(`ℹ  UNKNOWN SECTION (new template?): "${sec}"`);
//       }

//       reports.push({ code, name, category: cat, totalRows: instRows.length,
//         isInno: false, stdCounts, innoCounts: {}, allSections, issues });
//     }
//   }

//   reports.sort((a, b) => (b.issues.length - a.issues.length) || a.code.localeCompare(b.code));
//   return reports;
// }

// // ─── REPORT ───────────────────────────────────────────────────────────────────

// function printReport(reports: InstReport[]): void {
//   const total   = reports.length;
//   const clean   = reports.filter(r => r.issues.length === 0);
//   const flagged = reports.filter(r => r.issues.length > 0);
//   const LINE    = "═".repeat(110);
//   const LINE2   = "─".repeat(110);

//   // ── Summary header ────────────────────────────────────────────────────────
//   console.log("\n" + LINE);
//   console.log("  NIRF EXTRACTION VALIDATION REPORT  ·  2025 edition");
//   console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
//   console.log(LINE);
//   console.log(`\n  Total institutes : ${total.toLocaleString()}`);
//   console.log(`  ✅ Clean          : ${clean.length.toLocaleString()}`);
//   console.log(`  ❌ Flagged        : ${flagged.length.toLocaleString()}`);

//   // ── Category breakdown ────────────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  INSTITUTES BY CATEGORY\n");
//   const byCat: Record<string, { total: number; flagged: number }> = {};
//   for (const r of reports) {
//     const p = r.code.substring(0, 4).toUpperCase();
//     if (!byCat[p]) byCat[p] = { total: 0, flagged: 0 };
//     byCat[p].total++;
//     if (r.issues.length > 0) byCat[p].flagged++;
//   }
//   for (const [prefix, c] of Object.entries(byCat).sort()) {
//     const catName = CAT_LEGEND[prefix] ?? "Unknown";
//     const flag    = c.flagged > 0 ? `❌ ${c.flagged} flagged` : "✅ all clean";
//     console.log(`  ${prefix.padEnd(6)}  ${catName.padEnd(53)}  ${String(c.total).padStart(4)} institutes  ${flag}`);
//   }

//   // ── Standard section coverage summary ────────────────────────────────────
//   const stdReports = reports.filter(r => !r.isInno);
//   if (stdReports.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  STANDARD SECTION COVERAGE  (all non-Innovation institutes)\n");
//     console.log(
//       `  ${"Section".padEnd(68)}  ${"Missing".padStart(8)}  ${"Low".padStart(6)}  Status`
//     );
//     console.log("  " + "─".repeat(97));

//     const missCnt: Record<MinKey, number> = {} as any;
//     const lowCnt:  Record<MinKey, number> = {} as any;
//     for (const k of STD_KEYS) { missCnt[k] = 0; lowCnt[k] = 0; }

//     for (const r of stdReports) {
//       const mins = getStdMins(r.code);
//       for (const k of STD_KEYS) {
//         if (mins[k] === 0) continue;
//         const count = r.stdCounts[k] ?? 0;
//         if (count === 0) missCnt[k]++;
//         else if (count < mins[k]) lowCnt[k]++;
//       }
//     }

//     for (const k of STD_KEYS) {
//       const label   = STD_SEC_MAP[k];
//       const short   = label.length > 68 ? label.slice(0, 65) + "..." : label;
//       const missing = missCnt[k];
//       const low     = lowCnt[k];
//       const icon    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
//       const detail  = missing > 0 ? `${missing} missing, ${low} low`
//                     : low > 0     ? `${low} low`
//                     :               "all present";
//       console.log(
//         `  ${icon}  ${short.padEnd(68)}  ${String(missing).padStart(6)}  ${String(low).padStart(4)}  ${detail}`
//       );
//     }
//   }

//   // ── 2025 new-section coverage spotlight ──────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  2025 NEW SECTION COVERAGE SPOTLIGHT\n");
//   const newSecs2025: Array<[string, string]> = [
//     ["Sustainable Living Practices",              S.SUSTAINABLE_LIVING],
//     ["Multiple Entry/Exit & Indian Knowledge Sys",S.MEI_IKS],
//     ["Prior Learning at Diff Levels (IR-S only)", S.PRIOR_LEARNING],
//     ["Curriculum Design (IR-S only)",             S.CURRICULUM_DESIGN],
//     ["Sustainability Details: Energy & Water",    "Sustainability Details: Energy and Water Consumption"],
//     ["Sustainability Details: Waste",             "Sustainability Details: Waste"],
//     ["Sustainability Details: Environment",       "Sustainability Details: Environment"],
//   ];
//   for (const [label, secName] of newSecs2025) {
//     const count = reports.filter(r => (r.allSections[secName] ?? 0) > 0).length;
//     const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
//     const bar   = "█".repeat(Math.round(pct / 5)).padEnd(20);
//     console.log(`  ${label.padEnd(48)}  ${String(count).padStart(4)}/${total}  ${bar} ${pct}%`);
//   }

//   // ── Innovation section coverage ───────────────────────────────────────────
//   const innoReports = reports.filter(r => r.isInno);
//   if (innoReports.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  INNOVATION SECTION COVERAGE  (IR-I institutes)\n");
//     const innoMissCnt: Record<keyof InnoMins, number> = {} as any;
//     for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) innoMissCnt[k] = 0;
//     for (const r of innoReports) {
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         if (INNO_MINS[k] === 0) continue;
//         if ((r.innoCounts[k] ?? 0) === 0) innoMissCnt[k]++;
//       }
//     }
//     for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//       const label   = INNO_SEC_MAP[k];
//       const short   = label.length > 68 ? label.slice(0, 65) + "..." : label;
//       const missing = innoMissCnt[k];
//       console.log(`  ${missing > 0 ? "❌" : "✅"}  ${short.padEnd(68)}  ${String(missing).padStart(4)} missing`);
//     }
//   }

//   // ── Per-institute flagged list ─────────────────────────────────────────────
//   if (flagged.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  FLAGGED INSTITUTES\n");
//     for (const r of flagged) {
//       const tag = r.isInno ? "  [Innovation]" : "";
//       console.log(
//         `  ${r.code.padEnd(20)}  ${r.name.slice(0, 44).padEnd(45)}` +
//         `[${r.category.padEnd(12)}]  ${r.totalRows} rows${tag}`
//       );
//       for (const issue of r.issues) console.log(`    ${issue}`);
//     }
//   }

//   console.log("\n" + LINE2);
//   console.log(`  ✅ ${clean.length} institutes passed all checks`);

//   // ── Write full report file ────────────────────────────────────────────────
//   const reportPath = path.join(path.dirname(CSV_PATH), "validation-report.txt");
//   const lines: string[] = [];

//   lines.push(`NIRF EXTRACTION VALIDATION REPORT (2025 edition) — Year: ${year}`);
//   lines.push(`Generated : ${new Date().toISOString()}`);
//   lines.push(`CSV       : ${CSV_PATH}`);
//   lines.push(`Total     : ${total}  |  Clean: ${clean.length}  |  Flagged: ${flagged.length}`);
//   lines.push("");

//   lines.push("CATEGORY LEGEND:");
//   for (const [p, n] of Object.entries(CAT_LEGEND)) lines.push(`  ${p.padEnd(6)}  ${n}`);
//   lines.push("");

//   lines.push("2025 NEW SECTION SPOTCHECK:");
//   for (const [label, secName] of newSecs2025) {
//     const count = reports.filter(r => (r.allSections[secName] ?? 0) > 0).length;
//     lines.push(`  ${label.padEnd(50)}  ${count}/${total} institutes`);
//   }
//   lines.push("");

//   lines.push("FLAGGED INSTITUTES:");
//   for (const r of flagged) {
//     lines.push(`\n${r.code}  ${r.name}  [${r.category}]  ${r.totalRows} rows${r.isInno ? "  [Innovation]" : ""}`);
//     for (const issue of r.issues) lines.push(`  ${issue}`);
//     lines.push("  Section row counts:");
//     if (r.isInno) {
//       for (const k of Object.keys(INNO_MINS) as (keyof InnoMins)[]) {
//         const cnt = r.innoCounts[k] ?? 0;
//         const min = INNO_MINS[k];
//         const st  = min === 0 ? "N/A" : cnt === 0 ? "MISSING" : cnt < min ? `LOW(${cnt})` : `OK(${cnt})`;
//         lines.push(`    [${st.padEnd(10)}]  ${INNO_SEC_MAP[k]}`);
//       }
//     } else {
//       const mins = getStdMins(r.code);
//       for (const k of STD_KEYS) {
//         const cnt = r.stdCounts[k] ?? 0;
//         const min = mins[k];
//         const st  = min === 0 ? "N/A" : cnt === 0 ? "MISSING" : cnt < min ? `LOW(${cnt})` : `OK(${cnt})`;
//         lines.push(`    [${st.padEnd(10)}]  ${STD_SEC_MAP[k]}`);
//       }
//     }
//     // List unrecognised sections
//     const extra = Object.keys(r.allSections).filter(s => !ALL_KNOWN_2025_SECTIONS.has(s));
//     if (extra.length > 0) {
//       lines.push("  Unrecognised sections (possible new 2025 template additions):");
//       for (const s of extra) lines.push(`    [${String(r.allSections[s]).padStart(4)} rows]  ${s}`);
//     }
//   }

//   lines.push("\n\nCLEAN INSTITUTES:");
//   for (const r of clean) lines.push(`  ${r.code.padEnd(20)}  ${r.name}  (${r.totalRows} rows)`);

//   fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
//   console.log(`\n  Full report written to: ${reportPath}`);
//   console.log(LINE + "\n");
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// function main(): void {
//   if (!fs.existsSync(CSV_PATH)) {
//     console.error(`\n❌ CSV not found: ${CSV_PATH}`);
//     console.error(`   Run the downloader first for year ${year}\n`);
//     process.exit(1);
//   }
//   console.log(`\nReading: ${CSV_PATH}`);
//   const rows      = parseCSV(CSV_PATH);
//   const instCount = new Set(rows.map(r => r.instituteCode)).size;
//   console.log(`Parsed ${rows.length.toLocaleString()} data rows from ${instCount} institutes`);
//   const reports   = analyze(rows);
//   printReport(reports);
// }

// main();































// 2018

// import fs   from "fs";
// import path from "path";

// // ─────────────────────────────────────────────────────────────────────────────
// //  NIRF 2018 EXTRACTION VALIDATOR
// //
// //  2018 PDFs have a completely different structure from 2019+:
// //
// //  Sections extracted by the 2018 extractor:
// //    Faculty Details                              — 3 rows (PhD count, total, women)
// //    Student Details                              — 9× rows per program (intake, male, female, etc.)
// //    Scholarships                                 — 4× rows per program
// //    Placement & Higher Studies                   — 3× rows per program
// //    Ph.D Student Details                         — 2 rows (Full/Part time pursuing)
// //                                                   + 6 rows graduated (3 years × Full/Part)
// //    University Exam Details                      — 3× rows per program
// //    Financial Resources and its Utilization      — 9 rows (3 years × 3 metrics)
// //    Publication Details                          — 6 rows (2 sources × 3 metrics)
// //    Patent Details                               — 3 rows (optional)
// //    Sponsored Research Details                   — 3 rows (optional for College)
// //    Consultancy Project Details                  — 3 rows (optional for College)
// //    Executive Development Programs               — 12 rows (optional: Management, Overall)
// //    PCS Facilities: Facilities of Physically ... — 3 rows
// //    Perception Details                           — 1 row
// //
// //  Institute code format: IR-{year}-{cat}-{cat2}-{type}-{num}
// //  Category is the 3rd segment (index 2 after split on "-"):
// //    IR-1-D-...  → D = Medical/Dental
// //    IR-1-L-...  → L = Law
// //    IR-1-M-...  → M = Management
// //    IR-1-O-...  → O = Overall
// //    IR-1-P-...  → P = Pharmacy
// //    IR-2-C-...  → C = College
// //    IR-2-E-...  → E = Engineering
// //    IR-5-A-...  → A = Architecture
// //
// // ─────────────────────────────────────────────────────────────────────────────

// const year     = process.argv[2] ?? "2018";
// const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// // ─── SECTION NAME CONSTANTS ───────────────────────────────────────────────────

// const S18 = {
//   FACULTY:      "Faculty Details",
//   STUDENT:      "Student Details",
//   SCHOLARSHIP:  "Scholarships",
//   PLACEMENT:    "Placement & Higher Studies",
//   PHD:          "Ph.D Student Details",
//   EXAM:         "University Exam Details",
//   FINANCIAL:    "Financial Resources and its Utilization",
//   PUBLICATION:  "Publication Details",
//   PATENT:       "Patent Details",
//   SR:           "Sponsored Research Details",
//   CONSULTANCY:  "Consultancy Project Details",
//   EDP:          "Executive Development Programs",
//   PCS:          "PCS Facilities: Facilities of Physically Challenged Students",
//   PERCEPTION:   "Perception Details",
// } as const;

// // ─── SECTION MINIMUMS ─────────────────────────────────────────────────────────
// //
// //  0   = not required (optional or absent for this category)
// //  N   = must have ≥ N rows
// //
// //  Row-count rationale:
// //    faculty      : exactly 3 (PhD-count, total, women) — always present
// //    student      : 9 × #programs min; floor at 9 (at least 1 program, 9 metrics each)
// //    scholarship  : 4 × #programs min; floor at 4
// //    placement    : 3 × #programs min; floor at 3
// //    phd          : 2 (pursuing) + 6 (graduated 3yrs × 2 types) = 8 when PhD is present
// //    exam         : 3 × #programs min; floor at 3
// //    financial    : exactly 9 (3 years × 3 metrics) — always present
// //    publication  : exactly 6 (2 sources × 3 metrics) — always present
// //    patent       : exactly 3 (granted, published, earnings) — optional for some
// //    sr           : exactly 3 (3 years) — optional for Colleges
// //    consultancy  : exactly 3 (3 years) — optional for Colleges
// //    edp          : 12 rows (3 years × 4 metrics) — Management and some Overall
// //    pcs          : exactly 3 (3 questions) — always present
// //    perception   : exactly 1 — always present

// interface Mins2018 {
//   faculty:     number;
//   student:     number;
//   scholarship: number;
//   placement:   number;
//   phd:         number;
//   exam:        number;
//   financial:   number;
//   publication: number;
//   patent:      number;
//   sr:          number;
//   consultancy: number;
//   edp:         number;
//   pcs:         number;
//   perception:  number;
// }

// type MinKey18 = keyof Mins2018;

// // ── Base: full-set (Overall, Engineering, Law, Pharmacy …) ───────────────────
// const DEFAULT_18: Mins2018 = {
//   faculty:     3,
//   student:     9,    // ≥1 program × 9 metrics
//   scholarship: 4,    // ≥1 program × 4 metrics
//   placement:   3,    // ≥1 program × 3 metrics
//   phd:         8,    // 2 pursuing + 6 graduated
//   exam:        3,    // ≥1 program × 3 metrics
//   financial:   9,    // 3 years × 3 metrics
//   publication: 6,    // 2 sources × 3 metrics
//   patent:      3,    // optional — overridden to 0 where absent
//   sr:          3,
//   consultancy: 3,
//   edp:         0,    // optional by default
//   pcs:         3,
//   perception:  1,
// };

// // IR-?-A-... Architecture
// // No PhD; no EDP; patent optional
// const ARCH_18: Mins2018 = {
//   ...DEFAULT_18,
//   phd:    0,
//   patent: 0,   // not always present in Arch
//   edp:    0,
// };

// // IR-?-C-... College
// // No PhD section; no SR; no Consultancy in sample (Miranda House had none)
// const COLLEGE_18: Mins2018 = {
//   ...DEFAULT_18,
//   phd:        0,
//   patent:     0,   // not always present
//   sr:         0,
//   consultancy:0,
//   edp:        0,
// };

// // IR-?-D-... Medical / Dental
// // All sections present; patents optional
// const MEDICAL_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     3,   // AIIMS had Patents
//   sr:         3,
//   consultancy:3,
//   edp:        0,
// };

// // IR-?-E-... Engineering
// // All sections; patents typically present
// const ENG_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     3,
//   edp:        0,
// };

// // IR-?-L-... Law
// // PhD present; SR/Consultancy present; patent NOT in sample
// const LAW_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     0,
//   edp:        0,
// };

// // IR-?-M-... Management
// // No patents; EDP required (IIM Ahmedabad had 12 rows = 3 years × 4 metrics)
// const MGMT_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     0,
//   edp:        12,
// };

// // IR-?-O-... Overall
// // Everything; EDP optional (IISc had EDP with 12 rows; others may not)
// const OVERALL_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     3,
//   edp:        0,   // present at IISc but not universally — keep optional
// };

// // IR-?-P-... Pharmacy
// // PhD present; patent present; no EDP
// const PHARMACY_18: Mins2018 = {
//   ...DEFAULT_18,
//   patent:     3,
//   edp:        0,
// };

// // ─── CATEGORY DETECTION ───────────────────────────────────────────────────────
// //
// //  2018 code format: IR-{rankYear}-{catLetter}-{catCode2}-{type}-{num}
// //  e.g. IR-1-D-D-N-15, IR-2-C-OC-C-6355, IR-5-A-OEMAL-U-0573
// //
// //  The category letter is always the 3rd token after splitting on "-":
// //    parts = code.split("-")  →  ["IR","1","D","D","N","15"]
// //    parts[2]                 →  "D"

// function getCatLetter(code: string): string {
//   const parts = code.split("-");
//   // parts[0]="IR", parts[1]=rankYear, parts[2]=catLetter
//   return parts.length > 2 ? parts[2].toUpperCase() : "?";
// }

// function getMins18(code: string): Mins2018 {
//   const cat = getCatLetter(code);
//   switch (cat) {
//     case "A": return ARCH_18;
//     case "C": return COLLEGE_18;
//     case "D": return MEDICAL_18;   // Medical
//     case "E": return ENG_18;
//     case "G": return ENG_18;       // Agriculture — treat same as Engineering
//     case "L": return LAW_18;
//     case "M": return MGMT_18;
//     case "N": return MEDICAL_18;   // Dental — same structure as Medical
//     case "O": return OVERALL_18;
//     case "P": return PHARMACY_18;
//     case "R": return OVERALL_18;   // Research — like Overall
//     case "U": return OVERALL_18;   // University — like Overall
//     default:  return DEFAULT_18;
//   }
// }

// // ─── CATEGORY LEGEND ─────────────────────────────────────────────────────────

// const CAT_LEGEND_18: Record<string, string> = {
//   "A": "Architecture",
//   "C": "College",
//   "D": "Medical",
//   "E": "Engineering",
//   "G": "Agriculture",
//   "L": "Law",
//   "M": "Management",
//   "N": "Dental",
//   "O": "Overall",
//   "P": "Pharmacy",
//   "R": "Research",
//   "U": "University",
// };

// // ─── SECTION MAP (MinKey → section name) ─────────────────────────────────────

// const SEC_MAP_18: Record<MinKey18, string> = {
//   faculty:     S18.FACULTY,
//   student:     S18.STUDENT,
//   scholarship: S18.SCHOLARSHIP,
//   placement:   S18.PLACEMENT,
//   phd:         S18.PHD,
//   exam:        S18.EXAM,
//   financial:   S18.FINANCIAL,
//   publication: S18.PUBLICATION,
//   patent:      S18.PATENT,
//   sr:          S18.SR,
//   consultancy: S18.CONSULTANCY,
//   edp:         S18.EDP,
//   pcs:         S18.PCS,
//   perception:  S18.PERCEPTION,
// };

// const MIN_KEYS_18 = Object.keys(SEC_MAP_18) as MinKey18[];

// // All sections the 2018 extractor can produce — used to flag unexpected ones
// const ALL_KNOWN_2018_SECTIONS = new Set<string>(Object.values(S18));

// // ─── CSV PARSER ───────────────────────────────────────────────────────────────

// interface Row {
//   rankingYear:   string;
//   category:      string;
//   instituteCode: string;
//   instituteName: string;
//   section:       string;
//   program:       string;
//   year:          string;
//   metric:        string;
//   value:         string;
// }

// function parseCSV(filePath: string): Row[] {
//   const lines = fs.readFileSync(filePath, "utf8").split("\n");
//   const rows: Row[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;
//     const cells: string[] = [];
//     let cur = ""; let inQ = false;
//     for (const ch of line) {
//       if (ch === '"') { inQ = !inQ; }
//       else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
//       else { cur += ch; }
//     }
//     cells.push(cur);
//     if (cells.length < 9) continue;
//     rows.push({
//       rankingYear:   cells[0]?.trim() ?? "",
//       category:      cells[1]?.trim() ?? "",
//       instituteCode: cells[2]?.trim() ?? "",
//       instituteName: cells[3]?.trim() ?? "",
//       section:       cells[4]?.trim() ?? "",
//       program:       cells[5]?.trim() ?? "",
//       year:          cells[6]?.trim() ?? "",
//       metric:        cells[7]?.trim() ?? "",
//       value:         cells[8]?.trim() ?? "",
//     });
//   }
//   return rows;
// }

// // ─── ANALYSIS ─────────────────────────────────────────────────────────────────

// interface InstReport18 {
//   code:        string;
//   name:        string;
//   catLetter:   string;
//   totalRows:   number;
//   counts:      Record<MinKey18, number>;
//   allSections: Record<string, number>;
//   issues:      string[];
// }

// function analyze(rows: Row[]): InstReport18[] {
//   // Group by institute code
//   const byInst = new Map<string, Row[]>();
//   for (const r of rows) {
//     if (!byInst.has(r.instituteCode)) byInst.set(r.instituteCode, []);
//     byInst.get(r.instituteCode)!.push(r);
//   }

//   const reports: InstReport18[] = [];

//   for (const [code, instRows] of byInst) {
//     const name      = instRows[0].instituteName;
//     const catLetter = getCatLetter(code);
//     const mins      = getMins18(code);
//     const issues: string[] = [];

//     // Count rows per section
//     const allSections: Record<string, number> = {};
//     for (const r of instRows) {
//       allSections[r.section] = (allSections[r.section] ?? 0) + 1;
//     }

//     // Map to MinKey counts
//     const counts = {} as Record<MinKey18, number>;
//     for (const k of MIN_KEYS_18) {
//       counts[k] = allSections[SEC_MAP_18[k]] ?? 0;
//     }

//     // Validate each section
//     for (const k of MIN_KEYS_18) {
//       const min   = mins[k];
//       if (min === 0) continue;          // section not required for this category
//       const count = counts[k];
//       const label = SEC_MAP_18[k];
//       const short = label.length > 65 ? label.slice(0, 62) + "..." : label;
//       if (count === 0) {
//         issues.push(`❌ MISSING: ${short}`);
//       } else if (count < min) {
//         issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }
//     }

//     // Total row sanity check
//     if (instRows.length < 20) {
//       issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows`);
//     }

//     // Flag any section name not in the known-2018 set
//     for (const sec of Object.keys(allSections)) {
//       if (!ALL_KNOWN_2018_SECTIONS.has(sec)) {
//         issues.push(`ℹ  UNKNOWN SECTION (unexpected): "${sec}"`);
//       }
//     }

//     reports.push({ code, name, catLetter, totalRows: instRows.length,
//       counts, allSections, issues });
//   }

//   // Sort: most issues first, then by code
//   reports.sort((a, b) => (b.issues.length - a.issues.length) || a.code.localeCompare(b.code));
//   return reports;
// }

// // ─── REPORT ───────────────────────────────────────────────────────────────────

// function printReport(reports: InstReport18[]): void {
//   const total   = reports.length;
//   const clean   = reports.filter(r => r.issues.length === 0);
//   const flagged = reports.filter(r => r.issues.length > 0);
//   const LINE    = "═".repeat(110);
//   const LINE2   = "─".repeat(110);

//   // ── Summary header ────────────────────────────────────────────────────────
//   console.log("\n" + LINE);
//   console.log("  NIRF EXTRACTION VALIDATION REPORT  ·  2018 edition");
//   console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
//   console.log(LINE);
//   console.log(`\n  Total institutes : ${total.toLocaleString()}`);
//   console.log(`  ✅ Clean          : ${clean.length.toLocaleString()}`);
//   console.log(`  ❌ Flagged        : ${flagged.length.toLocaleString()}`);

//   // ── Category breakdown ────────────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  INSTITUTES BY CATEGORY\n");
//   const byCat: Record<string, { total: number; flagged: number }> = {};
//   for (const r of reports) {
//     const cat = r.catLetter;
//     if (!byCat[cat]) byCat[cat] = { total: 0, flagged: 0 };
//     byCat[cat].total++;
//     if (r.issues.length > 0) byCat[cat].flagged++;
//   }
//   for (const [cat, c] of Object.entries(byCat).sort()) {
//     const catName = CAT_LEGEND_18[cat] ?? "Unknown";
//     const flag    = c.flagged > 0 ? `❌ ${c.flagged} flagged` : "✅ all clean";
//     console.log(`  ${cat.padEnd(4)}  ${catName.padEnd(55)}  ${String(c.total).padStart(4)} institutes  ${flag}`);
//   }

//   // ── Section coverage summary ──────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  SECTION COVERAGE  (all institutes)\n");
//   console.log(
//     `  ${"Section".padEnd(65)}  ${"Missing".padStart(8)}  ${"Low".padStart(6)}  Status`
//   );
//   console.log("  " + "─".repeat(95));

//   const missCnt: Record<MinKey18, number> = {} as any;
//   const lowCnt:  Record<MinKey18, number> = {} as any;
//   for (const k of MIN_KEYS_18) { missCnt[k] = 0; lowCnt[k] = 0; }

//   for (const r of reports) {
//     const mins = getMins18(r.code);
//     for (const k of MIN_KEYS_18) {
//       if (mins[k] === 0) continue;
//       const count = r.counts[k] ?? 0;
//       if (count === 0) missCnt[k]++;
//       else if (count < mins[k]) lowCnt[k]++;
//     }
//   }

//   for (const k of MIN_KEYS_18) {
//     const label   = SEC_MAP_18[k];
//     const short   = label.length > 65 ? label.slice(0, 62) + "..." : label;
//     const missing = missCnt[k];
//     const low     = lowCnt[k];
//     const icon    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
//     const detail  = missing > 0 ? `${missing} missing, ${low} low`
//                   : low > 0     ? `${low} low`
//                   :               "all present";
//     console.log(
//       `  ${icon}  ${short.padEnd(65)}  ${String(missing).padStart(6)}  ${String(low).padStart(4)}  ${detail}`
//     );
//   }

//   // ── Flagged institutes ────────────────────────────────────────────────────
//   if (flagged.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  FLAGGED INSTITUTES\n");
//     for (const r of flagged) {
//       const catName = CAT_LEGEND_18[r.catLetter] ?? r.catLetter;
//       console.log(
//         `  ${r.code.padEnd(28)}  ${r.name.slice(0, 44).padEnd(45)}` +
//         `[${catName.padEnd(14)}]  ${r.totalRows} rows`
//       );
//       for (const issue of r.issues) console.log(`    ${issue}`);
//     }
//   }

//   console.log("\n" + LINE2);
//   console.log(`  ✅ ${clean.length} institutes passed all checks`);

//   // ── Write full report file ────────────────────────────────────────────────
//   const reportPath = path.join(path.dirname(CSV_PATH), "validation-report-2018.txt");
//   const lines: string[] = [];

//   lines.push(`NIRF EXTRACTION VALIDATION REPORT (2018 edition) — Year: ${year}`);
//   lines.push(`Generated : ${new Date().toISOString()}`);
//   lines.push(`CSV       : ${CSV_PATH}`);
//   lines.push(`Total     : ${total}  |  Clean: ${clean.length}  |  Flagged: ${flagged.length}`);
//   lines.push("");

//   lines.push("CATEGORY LEGEND (2018 code format: IR-{rankYear}-{catLetter}-...):");
//   for (const [cat, name] of Object.entries(CAT_LEGEND_18)) {
//     lines.push(`  ${cat.padEnd(4)}  ${name}`);
//   }
//   lines.push("");

//   lines.push("FLAGGED INSTITUTES:");
//   for (const r of flagged) {
//     const catName = CAT_LEGEND_18[r.catLetter] ?? r.catLetter;
//     lines.push(`\n${r.code}  ${r.name}  [${catName}]  ${r.totalRows} rows`);
//     for (const issue of r.issues) lines.push(`  ${issue}`);
//     lines.push("  Section row counts:");
//     const mins = getMins18(r.code);
//     for (const k of MIN_KEYS_18) {
//       const cnt = r.counts[k] ?? 0;
//       const min = mins[k];
//       const st  = min === 0 ? "N/A"
//                 : cnt === 0 ? "MISSING"
//                 : cnt < min ? `LOW(${cnt})`
//                 :             `OK(${cnt})`;
//       lines.push(`    [${st.padEnd(10)}]  ${SEC_MAP_18[k]}`);
//     }
//     const extra = Object.keys(r.allSections).filter(s => !ALL_KNOWN_2018_SECTIONS.has(s));
//     if (extra.length > 0) {
//       lines.push("  Unrecognised sections:");
//       for (const s of extra) lines.push(`    [${String(r.allSections[s]).padStart(4)} rows]  ${s}`);
//     }
//   }

//   lines.push("\n\nCLEAN INSTITUTES:");
//   for (const r of clean) {
//     lines.push(`  ${r.code.padEnd(28)}  ${r.name}  (${r.totalRows} rows)`);
//   }

//   fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
//   console.log(`\n  Full report written to: ${reportPath}`);
//   console.log(LINE + "\n");
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// function main(): void {
//   if (!fs.existsSync(CSV_PATH)) {
//     console.error(`\n❌ CSV not found: ${CSV_PATH}`);
//     console.error(`   Run the downloader first for year ${year}\n`);
//     process.exit(1);
//   }
//   console.log(`\nReading: ${CSV_PATH}`);
//   const rows      = parseCSV(CSV_PATH);
//   const instCount = new Set(rows.map(r => r.instituteCode)).size;
//   console.log(`Parsed ${rows.length.toLocaleString()} data rows from ${instCount} institutes`);
//   const reports   = analyze(rows);
//   printReport(reports);
// }

// main();





























//2017



// import fs   from "fs";
// import path from "path";

// // ─────────────────────────────────────────────────────────────────────────────
// //  NIRF 2017 EXTRACTION VALIDATOR
// //
// //  2017 PDFs use code format:  IR17-ENGG-1-1-77, IR17-COLL-1-29115, etc.
// //  Category is the word between the first two hyphens after "IR17-":
// //    IR17-COLL-...  → COLL (College)
// //    IR17-ENGG-...  → ENGG (Engineering)
// //    IR17-I-...     → I    (Overall / Institute)
// //    IR17-MGMT-...  → MGMT (Management)
// //    IR17-PHRM-...  → PHRM (Pharmacy)
// //    IR17-LAW-...   → LAW
// //    IR17-MED-...   → MED  (Medical / Dental)
// //    IR17-ARCH-...  → ARCH (Architecture)
// //    IR17-UNIV-...  → UNIV (University)
// //
// //  Sections extracted by the 2017 extractor (differs from 2018):
// //    Faculty Details                                   — 3 rows (always)
// //    Student Details                                   — 9× rows per program
// //    Placement & Higher Studies                        — 3× rows per program
// //    University Exam Details                           — 3× rows per program
// //    Financial Resources and its Utilization           — 9 rows (3 yrs × 3 metrics, always)
// //    Publication Details                               — 8 rows
// //                                                        (WoS: 3, Scopus: 3, IndianCI: 2)
// //    PCS Facilities: Facilities of Physically ...      — 3 rows (always)
// //    Perception Details                                — 3 rows (Peer/Employer/Public, always)
// //    Patent Details                                    — 3 rows (optional)
// //    Sponsored Research Details                        — 3 rows (optional for COLL)
// //    Consultancy Project Details                       — 3 rows (optional for COLL)
// //
// //  NOT present in 2017 (unlike 2018):
// //    Scholarships, Ph.D Student Details, Executive Development Programs
// //
// // ─────────────────────────────────────────────────────────────────────────────

// const year     = process.argv[2] ?? "2017";
// const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// // ─── SECTION NAME CONSTANTS ───────────────────────────────────────────────────

// const S17 = {
//   FACULTY:      "Faculty Details",
//   STUDENT:      "Student Details",
//   PLACEMENT:    "Placement & Higher Studies",
//   EXAM:         "University Exam Details",
//   FINANCIAL:    "Financial Resources and its Utilization",
//   PUBLICATION:  "Publication Details",
//   PCS:          "PCS Facilities: Facilities of Physically Challenged Students",
//   PERCEPTION:   "Perception Details",
//   PATENT:       "Patent Details",
//   SR:           "Sponsored Research Details",
//   CONSULTANCY:  "Consultancy Project Details",
// } as const;

// // ─── SECTION MINIMUMS ─────────────────────────────────────────────────────────
// //
// //  0   = not required / not present for this category
// //  N   = must have ≥ N rows
// //
// //  Row-count rationale (from 5 verified PDFs):
// //    faculty      : exactly 3 — always present
// //    student      : 9 × #programs; floor at 9 (≥1 program × 9 metrics each)
// //    placement    : 3 × #programs; floor at 3
// //    exam         : 3 × #programs; floor at 3
// //    financial    : exactly 9 (3 years × 3 metrics) — always present
// //    publication  : exactly 8 (WoS×3 + Scopus×3 + Indian CI×2) — always present
// //    pcs          : exactly 3 (3 questions) — always present
// //    perception   : exactly 3 (Peer + Employer + Public) — always present
// //    patent       : exactly 3 (granted, published, earnings) — optional for COLL, MGMT
// //    sr           : exactly 3 (3 financial years) — optional for COLL
// //    consultancy  : exactly 3 (3 financial years) — optional for COLL

// interface Mins2017 {
//   faculty:     number;
//   student:     number;
//   placement:   number;
//   exam:        number;
//   financial:   number;
//   publication: number;
//   pcs:         number;
//   perception:  number;
//   patent:      number;
//   sr:          number;
//   consultancy: number;
// }

// type MinKey17 = keyof Mins2017;

// // ── Base: full-set (Engineering, Overall, Pharmacy, Law …) ───────────────────
// const DEFAULT_17: Mins2017 = {
//   faculty:     3,
//   student:     9,   // ≥1 program × 9 metrics
//   placement:   3,   // ≥1 program × 3 metrics
//   exam:        3,   // ≥1 program × 3 metrics
//   financial:   9,   // 3 years × 3 metrics — always 9
//   publication: 8,   // WoS(3) + Scopus(3) + Indian CI(2) — always 8
//   pcs:         3,
//   perception:  3,   // 2017 has 3 perception cols (Peer/Employer/Public)
//   patent:      3,   // optional — overridden to 0 where not present
//   sr:          3,
//   consultancy: 3,
// };

// // IR17-COLL-... College
// // No Patent; no Sponsored Research; no Consultancy (Miranda House sample)
// const COLL_17: Mins2017 = {
//   ...DEFAULT_17,
//   patent:      0,
//   sr:          0,
//   consultancy: 0,
// };

// // IR17-ENGG-... Engineering — all sections present
// const ENGG_17: Mins2017 = { ...DEFAULT_17 };

// // IR17-I-... Overall
// // IISc sample had no Patent; but other Overall institutes may have it.
// // Keeping patent at 0 until more data confirms it's universal.
// const OVERALL_17: Mins2017 = {
//   ...DEFAULT_17,
//   patent: 0,   // IISc (Overall) had no Patent section — may be absent for some
// };

// // IR17-MGMT-... Management — no Patent (IIM Ahmedabad sample)
// const MGMT_17: Mins2017 = {
//   ...DEFAULT_17,
//   patent: 0,
// };

// // IR17-PHRM-... Pharmacy — all sections present
// const PHRM_17: Mins2017 = { ...DEFAULT_17 };

// // IR17-LAW-...  Law — patent likely absent (similar to MGMT)
// const LAW_17: Mins2017 = {
//   ...DEFAULT_17,
//   patent: 0,
// };

// // IR17-MED-...  Medical / IR17-DENT-... Dental — all sections
// const MED_17: Mins2017 = { ...DEFAULT_17 };

// // IR17-ARCH-... Architecture — patent optional
// const ARCH_17: Mins2017 = {
//   ...DEFAULT_17,
//   patent: 0,
// };

// // IR17-UNIV-... University — like Overall
// const UNIV_17: Mins2017 = { ...OVERALL_17 };

// // ─── CATEGORY DETECTION ───────────────────────────────────────────────────────
// //
// //  2017 code format: IR17-{catWord}-{n}-{m}-{num}
// //  Category word is always between first and second hyphens after "IR17":
// //    parts = code.split("-")  → ["IR17","ENGG","1","1","77"]
// //    parts[1]                 → "ENGG"

// function getCatWord(code: string): string {
//   const parts = code.split("-");
//   // parts[0]="IR17", parts[1]=catWord
//   return parts.length > 1 ? parts[1].toUpperCase() : "?";
// }

// function getMins17(code: string): Mins2017 {
//   const cat = getCatWord(code);
//   switch (cat) {
//     case "ARCH":  return ARCH_17;
//     case "COLL":  return COLL_17;
//     case "DENT":  return MED_17;   // Dental
//     case "ENGG":  return ENGG_17;
//     case "AGRI":  return ENGG_17;  // Agriculture — treat same as Engineering
//     case "I":     return OVERALL_17;
//     case "LAW":   return LAW_17;
//     case "MED":   return MED_17;
//     case "MGMT":  return MGMT_17;
//     case "OVRL":  return OVERALL_17;
//     case "PHRM":  return PHRM_17;
//     case "UNIV":  return UNIV_17;
//     default:      return DEFAULT_17;
//   }
// }

// // ─── CATEGORY LEGEND ─────────────────────────────────────────────────────────

// const CAT_LEGEND_17: Record<string, string> = {
//   "ARCH": "Architecture",
//   "COLL": "College",
//   "DENT": "Dental",
//   "ENGG": "Engineering",
//   "AGRI": "Agriculture",
//   "I":    "Overall / Institute",
//   "LAW":  "Law",
//   "MED":  "Medical",
//   "MGMT": "Management",
//   "OVRL": "Overall",
//   "PHRM": "Pharmacy",
//   "UNIV": "University",
// };

// // ─── SECTION MAP (MinKey → section name) ─────────────────────────────────────

// const SEC_MAP_17: Record<MinKey17, string> = {
//   faculty:     S17.FACULTY,
//   student:     S17.STUDENT,
//   placement:   S17.PLACEMENT,
//   exam:        S17.EXAM,
//   financial:   S17.FINANCIAL,
//   publication: S17.PUBLICATION,
//   pcs:         S17.PCS,
//   perception:  S17.PERCEPTION,
//   patent:      S17.PATENT,
//   sr:          S17.SR,
//   consultancy: S17.CONSULTANCY,
// };

// const MIN_KEYS_17 = Object.keys(SEC_MAP_17) as MinKey17[];

// // All sections the 2017 extractor can produce
// const ALL_KNOWN_2017_SECTIONS = new Set<string>(Object.values(S17));

// // ─── CSV PARSER ───────────────────────────────────────────────────────────────

// interface Row {
//   rankingYear:   string;
//   category:      string;
//   instituteCode: string;
//   instituteName: string;
//   section:       string;
//   program:       string;
//   year:          string;
//   metric:        string;
//   value:         string;
// }

// function parseCSV(filePath: string): Row[] {
//   const lines = fs.readFileSync(filePath, "utf8").split("\n");
//   const rows: Row[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;
//     const cells: string[] = [];
//     let cur = ""; let inQ = false;
//     for (const ch of line) {
//       if (ch === '"') { inQ = !inQ; }
//       else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
//       else { cur += ch; }
//     }
//     cells.push(cur);
//     if (cells.length < 9) continue;
//     rows.push({
//       rankingYear:   cells[0]?.trim() ?? "",
//       category:      cells[1]?.trim() ?? "",
//       instituteCode: cells[2]?.trim() ?? "",
//       instituteName: cells[3]?.trim() ?? "",
//       section:       cells[4]?.trim() ?? "",
//       program:       cells[5]?.trim() ?? "",
//       year:          cells[6]?.trim() ?? "",
//       metric:        cells[7]?.trim() ?? "",
//       value:         cells[8]?.trim() ?? "",
//     });
//   }
//   return rows;
// }

// // ─── ANALYSIS ─────────────────────────────────────────────────────────────────

// interface InstReport17 {
//   code:        string;
//   name:        string;
//   catWord:     string;
//   totalRows:   number;
//   counts:      Record<MinKey17, number>;
//   allSections: Record<string, number>;
//   issues:      string[];
// }

// function analyze(rows: Row[]): InstReport17[] {
//   const byInst = new Map<string, Row[]>();
//   for (const r of rows) {
//     if (!byInst.has(r.instituteCode)) byInst.set(r.instituteCode, []);
//     byInst.get(r.instituteCode)!.push(r);
//   }

//   const reports: InstReport17[] = [];

//   for (const [code, instRows] of byInst) {
//     const name    = instRows[0].instituteName;
//     const catWord = getCatWord(code);
//     const mins    = getMins17(code);
//     const issues: string[] = [];

//     // Count rows per section
//     const allSections: Record<string, number> = {};
//     for (const r of instRows) {
//       allSections[r.section] = (allSections[r.section] ?? 0) + 1;
//     }

//     // Map to MinKey counts
//     const counts = {} as Record<MinKey17, number>;
//     for (const k of MIN_KEYS_17) {
//       counts[k] = allSections[SEC_MAP_17[k]] ?? 0;
//     }

//     // Validate each required section
//     for (const k of MIN_KEYS_17) {
//       const min = mins[k];
//       if (min === 0) continue;
//       const count = counts[k];
//       const label = SEC_MAP_17[k];
//       const short = label.length > 65 ? label.slice(0, 62) + "..." : label;
//       if (count === 0) {
//         issues.push(`❌ MISSING: ${short}`);
//       } else if (count < min) {
//         issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
//       }
//     }

//     // Total row sanity check
//     if (instRows.length < 20) {
//       issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows`);
//     }

//     // Flag any unexpected section not produced by the 2017 extractor
//     for (const sec of Object.keys(allSections)) {
//       if (!ALL_KNOWN_2017_SECTIONS.has(sec)) {
//         issues.push(`ℹ  UNKNOWN SECTION (unexpected): "${sec}"`);
//       }
//     }

//     reports.push({ code, name, catWord, totalRows: instRows.length,
//       counts, allSections, issues });
//   }

//   // Sort: most issues first, then by code
//   reports.sort((a, b) => (b.issues.length - a.issues.length) || a.code.localeCompare(b.code));
//   return reports;
// }

// // ─── REPORT ───────────────────────────────────────────────────────────────────

// function printReport(reports: InstReport17[]): void {
//   const total   = reports.length;
//   const clean   = reports.filter(r => r.issues.length === 0);
//   const flagged = reports.filter(r => r.issues.length > 0);
//   const LINE    = "═".repeat(110);
//   const LINE2   = "─".repeat(110);

//   // ── Summary header ────────────────────────────────────────────────────────
//   console.log("\n" + LINE);
//   console.log("  NIRF EXTRACTION VALIDATION REPORT  ·  2017 edition");
//   console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
//   console.log(LINE);
//   console.log(`\n  Total institutes : ${total.toLocaleString()}`);
//   console.log(`  ✅ Clean          : ${clean.length.toLocaleString()}`);
//   console.log(`  ❌ Flagged        : ${flagged.length.toLocaleString()}`);

//   // ── Category breakdown ────────────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  INSTITUTES BY CATEGORY\n");
//   const byCat: Record<string, { total: number; flagged: number }> = {};
//   for (const r of reports) {
//     const cat = r.catWord;
//     if (!byCat[cat]) byCat[cat] = { total: 0, flagged: 0 };
//     byCat[cat].total++;
//     if (r.issues.length > 0) byCat[cat].flagged++;
//   }
//   for (const [cat, c] of Object.entries(byCat).sort()) {
//     const catName = CAT_LEGEND_17[cat] ?? cat;
//     const flag    = c.flagged > 0 ? `❌ ${c.flagged} flagged` : "✅ all clean";
//     console.log(`  ${cat.padEnd(6)}  ${catName.padEnd(53)}  ${String(c.total).padStart(4)} institutes  ${flag}`);
//   }

//   // ── Section coverage summary ──────────────────────────────────────────────
//   console.log("\n" + LINE2);
//   console.log("  SECTION COVERAGE  (all institutes)\n");
//   console.log(
//     `  ${"Section".padEnd(65)}  ${"Missing".padStart(8)}  ${"Low".padStart(6)}  Status`
//   );
//   console.log("  " + "─".repeat(95));

//   const missCnt: Record<MinKey17, number> = {} as any;
//   const lowCnt:  Record<MinKey17, number> = {} as any;
//   for (const k of MIN_KEYS_17) { missCnt[k] = 0; lowCnt[k] = 0; }

//   for (const r of reports) {
//     const mins = getMins17(r.code);
//     for (const k of MIN_KEYS_17) {
//       if (mins[k] === 0) continue;
//       const count = r.counts[k] ?? 0;
//       if (count === 0) missCnt[k]++;
//       else if (count < mins[k]) lowCnt[k]++;
//     }
//   }

//   for (const k of MIN_KEYS_17) {
//     const label   = SEC_MAP_17[k];
//     const short   = label.length > 65 ? label.slice(0, 62) + "..." : label;
//     const missing = missCnt[k];
//     const low     = lowCnt[k];
//     const icon    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
//     const detail  = missing > 0 ? `${missing} missing, ${low} low`
//                   : low > 0     ? `${low} low`
//                   :               "all present";
//     console.log(
//       `  ${icon}  ${short.padEnd(65)}  ${String(missing).padStart(6)}  ${String(low).padStart(4)}  ${detail}`
//     );
//   }

//   // ── Flagged institutes ────────────────────────────────────────────────────
//   if (flagged.length > 0) {
//     console.log("\n" + LINE2);
//     console.log("  FLAGGED INSTITUTES\n");
//     for (const r of flagged) {
//       const catName = CAT_LEGEND_17[r.catWord] ?? r.catWord;
//       console.log(
//         `  ${r.code.padEnd(26)}  ${r.name.slice(0, 44).padEnd(45)}` +
//         `[${catName.padEnd(22)}]  ${r.totalRows} rows`
//       );
//       for (const issue of r.issues) console.log(`    ${issue}`);
//     }
//   }

//   console.log("\n" + LINE2);
//   console.log(`  ✅ ${clean.length} institutes passed all checks`);

//   // ── Write full report file ────────────────────────────────────────────────
//   const reportPath = path.join(path.dirname(CSV_PATH), "validation-report-2017.txt");
//   const lines: string[] = [];

//   lines.push(`NIRF EXTRACTION VALIDATION REPORT (2017 edition) — Year: ${year}`);
//   lines.push(`Generated : ${new Date().toISOString()}`);
//   lines.push(`CSV       : ${CSV_PATH}`);
//   lines.push(`Total     : ${total}  |  Clean: ${clean.length}  |  Flagged: ${flagged.length}`);
//   lines.push("");

//   lines.push("CATEGORY LEGEND (2017 code format: IR17-{catWord}-...):");
//   for (const [cat, name] of Object.entries(CAT_LEGEND_17)) {
//     lines.push(`  ${cat.padEnd(6)}  ${name}`);
//   }
//   lines.push("");

//   lines.push("FLAGGED INSTITUTES:");
//   for (const r of flagged) {
//     const catName = CAT_LEGEND_17[r.catWord] ?? r.catWord;
//     lines.push(`\n${r.code}  ${r.name}  [${catName}]  ${r.totalRows} rows`);
//     for (const issue of r.issues) lines.push(`  ${issue}`);
//     lines.push("  Section row counts:");
//     const mins = getMins17(r.code);
//     for (const k of MIN_KEYS_17) {
//       const cnt = r.counts[k] ?? 0;
//       const min = mins[k];
//       const st  = min === 0 ? "N/A"
//                 : cnt === 0 ? "MISSING"
//                 : cnt < min ? `LOW(${cnt})`
//                 :             `OK(${cnt})`;
//       lines.push(`    [${st.padEnd(10)}]  ${SEC_MAP_17[k]}`);
//     }
//     const extra = Object.keys(r.allSections).filter(s => !ALL_KNOWN_2017_SECTIONS.has(s));
//     if (extra.length > 0) {
//       lines.push("  Unrecognised sections:");
//       for (const s of extra) lines.push(`    [${String(r.allSections[s]).padStart(4)} rows]  ${s}`);
//     }
//   }

//   lines.push("\n\nCLEAN INSTITUTES:");
//   for (const r of clean) {
//     lines.push(`  ${r.code.padEnd(26)}  ${r.name}  (${r.totalRows} rows)`);
//   }

//   fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
//   console.log(`\n  Full report written to: ${reportPath}`);
//   console.log(LINE + "\n");
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// function main(): void {
//   if (!fs.existsSync(CSV_PATH)) {
//     console.error(`\n❌ CSV not found: ${CSV_PATH}`);
//     console.error(`   Run the downloader first for year ${year}\n`);
//     process.exit(1);
//   }
//   console.log(`\nReading: ${CSV_PATH}`);
//   const rows      = parseCSV(CSV_PATH);
//   const instCount = new Set(rows.map(r => r.instituteCode)).size;
//   console.log(`Parsed ${rows.length.toLocaleString()} data rows from ${instCount} institutes`);
//   const reports   = analyze(rows);
//   printReport(reports);
// }

// main();

































import fs   from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
//  NIRF 2016 EXTRACTION VALIDATOR
//
//  2016 PDFs use code format:  NIRF-ENGG-INF-77, NIRF-MGMT-INF-217,
//                               NIRF-PHRM-1-2452430866, NIRF-UNIV-67, etc.
//  Header marker: "InstituteID :NIRF-..."  (no space before colon)
//  Category is the word between the first and second hyphens:
//    NIRF-ENGG-INF-77       → ENGG  (Engineering)
//    NIRF-MGMT-INF-217      → MGMT  (Management)
//    NIRF-PHRM-1-2452...    → PHRM  (Pharmacy)
//    NIRF-UNIV-67           → UNIV  (University)
//    NIRF-COLL-...          → COLL  (College)
//    NIRF-LAW-...           → LAW   (Law)
//    NIRF-MED-...           → MED   (Medical)
//    NIRF-ARCH-...          → ARCH  (Architecture)
//
//  Sections extracted by the 2016 extractor:
//    Faculty Details                  — 8 rows  (6 faculty metrics)
//    Student Details                  — 9×N rows  (9 cols × N program-year rows)
//    Facilities Summaries             — 21–27 rows  (varies by category col count)
//    Publication Details              — 14–16 rows  (varies by source count)
//    Perception Details               — 1–2 rows  (Peer only, or Public+Peer)
//    IPR Summary                      — 12–24 rows  (col count varies by category)
//    Sponsored Research Details       — 3 rows  (3 financial years)
//    Consultancy Project Details      — 3 rows  (3 financial years)
//    Graduation Outcome               — 6 rows  (3 years × 2 metrics)
//    Student Exam Details             — 9 rows  (3 years × 3 metrics)
//    Physical Facilties               — 6–7 rows  (1 year × 6–7 answer columns)
//    Education Program Details        — 1–3 rows  (optional)
//    Student Events                   — 1–3 rows  (optional)
//    Student Entrepreneurship         — 2 rows  (optional)
//    Revenue from Executive Education — 3 rows  (MGMT only)
//
//  Cross-page split pattern (2016-specific):
//    Section heading appears in page 1 TRAILING TEXT (after the last table).
//    Continuation table on page 2 has EMPTY between-text.
//    Observed: SR split (NIRF-ENGG-INF-423, NIRF-PHRM-1-2452430866)
//              Consultancy split (NIRF-MGMT-INF-217, NIRF-PHRM-1-2456020972)
//
// ─────────────────────────────────────────────────────────────────────────────

const year     = process.argv[2] ?? "2016";
const CSV_PATH = path.join(process.cwd(), "downloads", year, "nirf-pdf-data.csv");

// ─── SECTION NAME CONSTANTS ───────────────────────────────────────────────────

const S16 = {
  FACULTY:      "Faculty Details",
  STUDENT:      "Student Details",
  FACILITIES:   "Facilities Summaries",
  PUBLICATION:  "Publication Details",
  PERCEPTION:   "Perception Details",
  IPR:          "IPR Summary",
  SR:           "Sponsored Research Details",
  CONSULTANCY:  "Consultancy Project Details",
  GRADUATION:   "Graduation Outcome",
  EXAM:         "Student Exam Details",
  PHYSICAL:     "Physical Facilties",          // NOTE: 2016 typo "Facilties" preserved
  EDUCATION:    "Education Program Details",
  EVENTS:       "Student Events",
  ENTREPRENEUR: "Student Entrepreneurship",
  REVENUE:      "Revenue from Executive Education",
} as const;

// All sections the 2016 extractor can produce
const ALL_KNOWN_2016_SECTIONS = new Set<string>(Object.values(S16));

// ─── MINIMUMS ─────────────────────────────────────────────────────────────────
//
//  0  = not required / genuinely absent for this category
//  N  = must have ≥ N rows
//
//  Row-count rationale (from 6 verified PDFs):
//
//  faculty      : 8 rows  (6 metrics per the Faculty Details single data row)
//  student      : 9 rows  (floor: ≥1 program×year pair × 9 metric columns)
//  facilities   : 21 rows (floor: MGMT has fewer columns → 21; ENGG/PHRM/UNIV have 27)
//  publication  : 14 rows (floor: UNIV-67 has 14; others have 16)
//  perception   : 1 row   (UNIV-67 has only Peer Perception; others have 2)
//  ipr          : 12 rows (floor: UNIV-67 has 12; ENGG/PHRM have 21; 0 for MGMT)
//  sr           : 3 rows  (3 financial years × 1 metric; 0 for UNIV which had none)
//  consultancy  : 3 rows  (3 financial years × 1 metric; 0 for UNIV)
//  graduation   : 6 rows  (3 years × 2 metrics; 0 for UNIV)
//  exam         : 9 rows  (3 years × 3 metrics; 0 for MGMT)
//  physical     : 6 rows  (1 year × 6–7 answer columns)
//  education    : 1 row   (optional, present in most but absent in some)
//  events       : 1 row   (optional)
//  entrepreneur : 0       (optional for all — only some institutes report it)
//  revenue      : 3 rows  (MGMT only — 0 for all others)

interface Mins2016 {
  faculty:      number;
  student:      number;
  facilities:   number;
  publication:  number;
  perception:   number;
  ipr:          number;
  sr:           number;
  consultancy:  number;
  graduation:   number;
  exam:         number;
  physical:     number;
  education:    number;
  events:       number;
  entrepreneur: number;
  revenue:      number;
}

type MinKey16 = keyof Mins2016;

// ── Default: full-featured (Engineering, Pharmacy, …) ────────────────────────
const DEFAULT_16: Mins2016 = {
  faculty:      8,
  student:      9,
  facilities:   21,
  publication:  14,
  perception:   1,
  ipr:          12,
  sr:           3,
  consultancy:  3,
  graduation:   6,
  exam:         9,
  physical:     6,
  education:    1,    // optional but expected for most
  events:       0,    // optional — variable attendance per institute
  entrepreneur: 0,    // optional
  revenue:      0,
};

// ENGG — all sections, IPR has 21 rows (3 yrs × 7 metrics)
const ENGG_16: Mins2016 = { ...DEFAULT_16, ipr: 21 };

// PHRM — like Engineering; student events sometimes has only 1 row
const PHRM_16: Mins2016 = { ...DEFAULT_16, ipr: 21 };

// MGMT — no IPR, no Student Exam Details; has Revenue from Executive Education
const MGMT_16: Mins2016 = {
  ...DEFAULT_16,
  ipr:          0,    // IIM Bangalore had no IPR section
  exam:         0,    // Management has no Student Exam Details
  revenue:      3,    // Revenue from Executive Education — MGMT only
};

// UNIV — no SR, no Consultancy, no Graduation Outcome; IPR has 12 rows (3 yrs × 4 metrics)
const UNIV_16: Mins2016 = {
  ...DEFAULT_16,
  ipr:          12,
  sr:           0,    // Banasthali had no SR section
  consultancy:  0,    // Banasthali had no Consultancy section
  graduation:   0,    // Banasthali had no Graduation Outcome section
};

// COLL — similar to UNIV (colleges often lack research sections)
const COLL_16: Mins2016 = {
  ...DEFAULT_16,
  ipr:          0,
  sr:           0,
  consultancy:  0,
};

// LAW — similar to MGMT (no IPR, no exam details)
const LAW_16: Mins2016 = {
  ...DEFAULT_16,
  ipr:     0,
  exam:    0,
};

// MED — like Engineering
const MED_16: Mins2016 = { ...DEFAULT_16, ipr: 12 };

// ARCH — like Engineering
const ARCH_16: Mins2016 = { ...DEFAULT_16, ipr: 12 };

// ─── CATEGORY DETECTION ───────────────────────────────────────────────────────
//
//  2016 code format: NIRF-{catWord}-INF-{n} or NIRF-{catWord}-{n}-{bignum}
//  Category word is always parts[1] when split on '-':
//    "NIRF-ENGG-INF-77".split("-") → ["NIRF","ENGG","INF","77"]  → parts[1]="ENGG"

function getCatWord16(code: string): string {
  const parts = code.split("-");
  return parts.length > 1 ? parts[1].toUpperCase() : "?";
}

function getMins16(code: string): Mins2016 {
  const cat = getCatWord16(code);
  switch (cat) {
    case "ARCH": return ARCH_16;
    case "COLL": return COLL_16;
    case "ENGG": return ENGG_16;
    case "LAW":  return LAW_16;
    case "MED":  return MED_16;
    case "DENT": return MED_16;
    case "MGMT": return MGMT_16;
    case "PHRM": return PHRM_16;
    case "UNIV": return UNIV_16;
    default:     return DEFAULT_16;
  }
}

// ─── CATEGORY LEGEND ─────────────────────────────────────────────────────────

const CAT_LEGEND_16: Record<string, string> = {
  "ARCH": "Architecture",
  "COLL": "College",
  "DENT": "Dental",
  "ENGG": "Engineering",
  "LAW":  "Law",
  "MED":  "Medical",
  "MGMT": "Management",
  "PHRM": "Pharmacy",
  "UNIV": "University",
};

// ─── SECTION → MinKey MAP ─────────────────────────────────────────────────────

const SEC_MAP_16: Record<MinKey16, string> = {
  faculty:      S16.FACULTY,
  student:      S16.STUDENT,
  facilities:   S16.FACILITIES,
  publication:  S16.PUBLICATION,
  perception:   S16.PERCEPTION,
  ipr:          S16.IPR,
  sr:           S16.SR,
  consultancy:  S16.CONSULTANCY,
  graduation:   S16.GRADUATION,
  exam:         S16.EXAM,
  physical:     S16.PHYSICAL,
  education:    S16.EDUCATION,
  events:       S16.EVENTS,
  entrepreneur: S16.ENTREPRENEUR,
  revenue:      S16.REVENUE,
};

const MIN_KEYS_16 = Object.keys(SEC_MAP_16) as MinKey16[];

// ─── CSV PARSER ───────────────────────────────────────────────────────────────

interface Row {
  rankingYear:   string;
  category:      string;
  instituteCode: string;
  instituteName: string;
  section:       string;
  program:       string;
  year:          string;
  metric:        string;
  value:         string;
}

function parseCSV(filePath: string): Row[] {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells: string[] = [];
    let cur = ""; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
      else { cur += ch; }
    }
    cells.push(cur);
    if (cells.length < 9) continue;
    rows.push({
      rankingYear:   cells[0]?.trim() ?? "",
      category:      cells[1]?.trim() ?? "",
      instituteCode: cells[2]?.trim() ?? "",
      instituteName: cells[3]?.trim() ?? "",
      section:       cells[4]?.trim() ?? "",
      program:       cells[5]?.trim() ?? "",
      year:          cells[6]?.trim() ?? "",
      metric:        cells[7]?.trim() ?? "",
      value:         cells[8]?.trim() ?? "",
    });
  }
  return rows;
}

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────

interface InstReport16 {
  code:        string;
  name:        string;
  catWord:     string;
  totalRows:   number;
  counts:      Record<MinKey16, number>;
  allSections: Record<string, number>;
  issues:      string[];
}

function analyze(rows: Row[]): InstReport16[] {
  const byInst = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byInst.has(r.instituteCode)) byInst.set(r.instituteCode, []);
    byInst.get(r.instituteCode)!.push(r);
  }

  const reports: InstReport16[] = [];

  for (const [code, instRows] of byInst) {
    const name    = instRows[0].instituteName;
    const catWord = getCatWord16(code);
    const mins    = getMins16(code);
    const issues: string[] = [];

    // Count rows per section
    const allSections: Record<string, number> = {};
    for (const r of instRows) {
      allSections[r.section] = (allSections[r.section] ?? 0) + 1;
    }

    // Map to MinKey counts
    const counts = {} as Record<MinKey16, number>;
    for (const k of MIN_KEYS_16) {
      counts[k] = allSections[SEC_MAP_16[k]] ?? 0;
    }

    // Validate each required section
    for (const k of MIN_KEYS_16) {
      const min = mins[k];
      if (min === 0) continue;
      const count = counts[k];
      const label = SEC_MAP_16[k];
      const short = label.length > 65 ? label.slice(0, 62) + "..." : label;
      if (count === 0) {
        issues.push(`❌ MISSING: ${short}`);
      } else if (count < min) {
        issues.push(`⚠  LOW (${count}, exp ≥${min}): ${short}`);
      }
    }

    // Sanity: total row count
    if (instRows.length < 30) {
      issues.push(`⚠  TOTAL ROWS VERY LOW: only ${instRows.length} rows`);
    }

    // Flag any unrecognised section
    for (const sec of Object.keys(allSections)) {
      if (!ALL_KNOWN_2016_SECTIONS.has(sec)) {
        issues.push(`ℹ  UNKNOWN SECTION: "${sec}"`);
      }
    }

    reports.push({
      code, name, catWord, totalRows: instRows.length,
      counts, allSections, issues,
    });
  }

  // Sort: most issues first, then alphabetically
  reports.sort((a, b) =>
    (b.issues.length - a.issues.length) || a.code.localeCompare(b.code));

  return reports;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

function printReport(reports: InstReport16[]): void {
  const total   = reports.length;
  const clean   = reports.filter(r => r.issues.length === 0);
  const flagged = reports.filter(r => r.issues.length > 0);
  const LINE    = "═".repeat(110);
  const LINE2   = "─".repeat(110);

  // ── Summary header ────────────────────────────────────────────────────────
  console.log("\n" + LINE);
  console.log("  NIRF EXTRACTION VALIDATION REPORT  ·  2016 edition");
  console.log(`  Year: ${year}  |  CSV: ${CSV_PATH}`);
  console.log(LINE);
  console.log(`\n  Total institutes : ${total.toLocaleString()}`);
  console.log(`  ✅ Clean          : ${clean.length.toLocaleString()}`);
  console.log(`  ❌ Flagged        : ${flagged.length.toLocaleString()}`);

  // ── Category breakdown ────────────────────────────────────────────────────
  console.log("\n" + LINE2);
  console.log("  INSTITUTES BY CATEGORY\n");
  const byCat: Record<string, { total: number; flagged: number }> = {};
  for (const r of reports) {
    const cat = r.catWord;
    if (!byCat[cat]) byCat[cat] = { total: 0, flagged: 0 };
    byCat[cat].total++;
    if (r.issues.length > 0) byCat[cat].flagged++;
  }
  for (const [cat, c] of Object.entries(byCat).sort()) {
    const catName = CAT_LEGEND_16[cat] ?? cat;
    const flag    = c.flagged > 0 ? `❌ ${c.flagged} flagged` : "✅ all clean";
    console.log(
      `  ${cat.padEnd(6)}  ${catName.padEnd(53)}  ${String(c.total).padStart(4)} institutes  ${flag}`
    );
  }

  // ── Section coverage summary ──────────────────────────────────────────────
  console.log("\n" + LINE2);
  console.log("  SECTION COVERAGE  (all institutes)\n");
  console.log(
    `  ${"Section".padEnd(55)}  ${"Missing".padStart(8)}  ${"Low".padStart(6)}  Status`
  );
  console.log("  " + "─".repeat(85));

  const missCnt: Record<MinKey16, number> = {} as any;
  const lowCnt:  Record<MinKey16, number> = {} as any;
  for (const k of MIN_KEYS_16) { missCnt[k] = 0; lowCnt[k] = 0; }

  for (const r of reports) {
    const mins = getMins16(r.code);
    for (const k of MIN_KEYS_16) {
      if (mins[k] === 0) continue;
      const count = r.counts[k] ?? 0;
      if (count === 0)          missCnt[k]++;
      else if (count < mins[k]) lowCnt[k]++;
    }
  }

  for (const k of MIN_KEYS_16) {
    const label   = SEC_MAP_16[k];
    const short   = label.length > 55 ? label.slice(0, 52) + "..." : label;
    const missing = missCnt[k];
    const low     = lowCnt[k];
    const icon    = missing > 0 ? "❌" : low > 0 ? "⚠ " : "✅";
    const detail  = missing > 0
      ? `${missing} missing, ${low} low`
      : low > 0
      ? `${low} low`
      : "all present";
    console.log(
      `  ${icon}  ${short.padEnd(55)}  ${String(missing).padStart(6)}  ${String(low).padStart(4)}  ${detail}`
    );
  }

  // ── Flagged institutes ────────────────────────────────────────────────────
  if (flagged.length > 0) {
    console.log("\n" + LINE2);
    console.log("  FLAGGED INSTITUTES\n");
    for (const r of flagged) {
      const catName = CAT_LEGEND_16[r.catWord] ?? r.catWord;
      console.log(
        `  ${r.code.padEnd(28)}  ${r.name.slice(0, 40).padEnd(42)}` +
        `[${catName.padEnd(16)}]  ${r.totalRows} rows`
      );
      for (const issue of r.issues) console.log(`    ${issue}`);
    }
  }

  console.log("\n" + LINE2);
  console.log(`  ✅ ${clean.length} institutes passed all checks`);
  if (clean.length > 0 && clean.length <= 50) {
    for (const r of clean) {
      console.log(`    ${r.code.padEnd(28)}  ${r.name}  (${r.totalRows} rows)`);
    }
  }

  // ── Write full report file ────────────────────────────────────────────────
  const reportPath = path.join(
    path.dirname(CSV_PATH), "validation-report-2016.txt"
  );
  const lines: string[] = [];

  lines.push(`NIRF EXTRACTION VALIDATION REPORT (2016 edition) — Year: ${year}`);
  lines.push(`Generated : ${new Date().toISOString()}`);
  lines.push(`CSV       : ${CSV_PATH}`);
  lines.push(`Total     : ${total}  |  Clean: ${clean.length}  |  Flagged: ${flagged.length}`);
  lines.push("");

  lines.push("CATEGORY LEGEND (2016 code format: NIRF-{catWord}-...):");
  for (const [cat, name] of Object.entries(CAT_LEGEND_16)) {
    lines.push(`  ${cat.padEnd(6)}  ${name}`);
  }
  lines.push("");

  lines.push("NOTES ON 2016 FORMAT:");
  lines.push("  - Garbled PDFs (all tables empty) will appear with 0 rows and are skipped.");
  lines.push("  - Cross-page splits: section heading in page-1 trailing text;");
  lines.push("    continuation table on page 2 has empty between-text.");
  lines.push("  - Perception: 1 row if only 'Peer Perception'; 2 rows if 'Public+Peer'.");
  lines.push("  - IPR row count varies by category (ENGG/PHRM: 21, UNIV: 12, MGMT: 0).");
  lines.push("  - Facilities Summaries: 21 rows for MGMT; 27 rows for ENGG/PHRM/UNIV.");
  lines.push("  - Publication: 14–16 rows depending on source count.");
  lines.push("  - Physical Facilties: typo 'Facilties' is preserved from the PDF.");
  lines.push("");

  lines.push("FLAGGED INSTITUTES:");
  for (const r of flagged) {
    const catName = CAT_LEGEND_16[r.catWord] ?? r.catWord;
    lines.push(`\n${r.code}  ${r.name}  [${catName}]  ${r.totalRows} rows`);
    for (const issue of r.issues) lines.push(`  ${issue}`);
    lines.push("  Section row counts:");
    const mins = getMins16(r.code);
    for (const k of MIN_KEYS_16) {
      const cnt = r.counts[k] ?? 0;
      const min = mins[k];
      const st  = min === 0
        ? "N/A"
        : cnt === 0
        ? "MISSING"
        : cnt < min
        ? `LOW(${cnt})`
        : `OK(${cnt})`;
      lines.push(`    [${st.padEnd(10)}]  ${SEC_MAP_16[k]}`);
    }
    const extra = Object.keys(r.allSections).filter(
      s => !ALL_KNOWN_2016_SECTIONS.has(s)
    );
    if (extra.length > 0) {
      lines.push("  Unrecognised sections:");
      for (const s of extra) {
        lines.push(`    [${String(r.allSections[s]).padStart(4)} rows]  ${s}`);
      }
    }
  }

  lines.push("\n\nCLEAN INSTITUTES:");
  for (const r of clean) {
    lines.push(`  ${r.code.padEnd(28)}  ${r.name}  (${r.totalRows} rows)`);
  }

  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`\n  Full report written to: ${reportPath}`);
  console.log(LINE + "\n");
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main(): void {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV not found: ${CSV_PATH}`);
    console.error(`   Run the downloader first for year ${year}\n`);
    process.exit(1);
  }
  console.log(`\nReading: ${CSV_PATH}`);
  const rows      = parseCSV(CSV_PATH);
  const instCount = new Set(rows.map(r => r.instituteCode)).size;
  console.log(`Parsed ${rows.length.toLocaleString()} data rows from ${instCount} institutes`);
  const reports   = analyze(rows);
  printReport(reports);
}

main();