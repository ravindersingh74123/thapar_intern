// import fs from "fs";
// import path from "path";

// // Dynamically import pdfjs-dist so Next.js webpack never statically analyses
// // or bundles it. Combined with serverExternalPackages it stays in node_modules.
// async function getPdfText(filePath: string): Promise<string> {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs" as any);

//   // disableWorker=true makes pdfjs run entirely in the main thread — no worker
//   // file needed at all.
//   const data = new Uint8Array(fs.readFileSync(filePath));
//   const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;

//   let text = "";
//   for (let i = 1; i <= doc.numPages; i++) {
//     const page = await doc.getPage(i);
//     const content = await page.getTextContent();
//     text += content.items
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       .map((item: any) => item.str)
//       .join(" ") + "\n";
//   }

//   return text;
// }

// export interface SponsoredResearch {
//   year: string;
//   totalProjects: string;
//   totalFundingAgencies: string;
//   totalAmountReceived: string;
// }

// export interface ConsultancyProject {
//   year: string;
//   totalProjects: string;
//   totalClientOrgs: string;
//   totalAmountReceived: string;
// }

// export interface ExtractedData {
//   filename: string;
//   instituteName?: string;
//   instituteCode?: string;
//   sponsoredResearch?: SponsoredResearch[];
//   consultancyProjects?: ConsultancyProject[];
//   error?: string;
// }

// /* ─── helpers ─────────────────────────────────────────── */

// function extractBetween(text: string, start: string, end: string): string {
//   const regex = new RegExp(`${start}([\\s\\S]*?)${end}`, "i");
//   return text.match(regex)?.[1]?.trim() ?? "";
// }

// function parseInstituteMeta(text: string) {
//   const m = text.match(/Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]/i);
//   return m ? { name: m[1].trim(), code: m[2].trim() } : {};
// }

// /* ─── sponsored research ───────────────────────────────── */

// function parseSponsoredResearch(text: string): SponsoredResearch[] | undefined {
//   const section = extractBetween(
//     text,
//     "Sponsored Research Details",
//     "Consultancy Project Details"
//   );
//   if (!section) return undefined;

//   const yearMatch = section.match(
//     /(\d{4}-\d{2,4})\s+(\d{4}-\d{2,4})(?:\s+(\d{4}-\d{2,4}))?/
//   );
//   const years = yearMatch ? yearMatch.slice(1).filter(Boolean) : [];
//   if (!years.length) return undefined;

//   const projects = section
//     .match(/Total\s+no\.\s+of\s+Sponsored\s+Projects\s+([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   const agencies = section
//     .match(/Total\s+no\.\s+of\s+Funding\s+Agencies\s+([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   const amounts = section
//     .match(/Total\s+Amount\s+Received[^\d]*([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   return years.map((year, i) => ({
//     year,
//     totalProjects: projects[i] ?? "N/A",
//     totalFundingAgencies: agencies[i] ?? "N/A",
//     totalAmountReceived: amounts[i] ?? "N/A",
//   }));
// }

// /* ─── consultancy projects ─────────────────────────────── */

// function parseConsultancyProjects(
//   text: string
// ): ConsultancyProject[] | undefined {
//   const section = extractBetween(
//     text,
//     "Consultancy Project Details",
//     "Executive Development Program"
//   );
//   if (!section) return undefined;

//   const yearMatch = section.match(
//     /(\d{4}-\d{2,4})\s+(\d{4}-\d{2,4})(?:\s+(\d{4}-\d{2,4}))?/
//   );
//   const years = yearMatch ? yearMatch.slice(1).filter(Boolean) : [];
//   if (!years.length) return undefined;

//   const projects = section
//     .match(/Total\s+no\.\s+of\s+Consultancy\s+Projects\s+([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   const clients = section
//     .match(/Total\s+no\.\s+of\s+Client\s+Organ[^\d]*([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   const amounts = section
//     .match(/Total\s+Amount\s+Received[^\d]*([\d\s]+)/i)?.[1]
//     ?.trim()
//     .split(/\s+/) ?? [];

//   return years.map((year, i) => ({
//     year,
//     totalProjects: projects[i] ?? "N/A",
//     totalClientOrgs: clients[i] ?? "N/A",
//     totalAmountReceived: amounts[i] ?? "N/A",
//   }));
// }

// /* ─── main export ──────────────────────────────────────── */

// export async function extractFromPdf(filePath: string): Promise<ExtractedData> {
//   const filename = path.basename(filePath);
//   try {
//     const text = await getPdfText(filePath);
//     const meta = parseInstituteMeta(text);

//     return {
//       filename,
//       instituteName: meta.name,
//       instituteCode: meta.code,
//       sponsoredResearch: parseSponsoredResearch(text),
//       consultancyProjects: parseConsultancyProjects(text),
//     };
//   } catch (err) {
//     return { filename, error: String(err) };
//   }
// }














// import fs from "fs";
// import path from "path";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

// // ─────────────────────────────────────────────────────────────────────────────
// // CSV STRUCTURE — long format, one row per data point, nothing skipped
// //
// // Columns:
// //   Ranking Year | Category | Institute Code | Institute Name |
// //   Section | Program | Metric | Value
// // ─────────────────────────────────────────────────────────────────────────────

// export const CSV_HEADER = [
//   "Ranking Year",
//   "Category",
//   "Institute Code",
//   "Institute Name",
//   "Section",
//   "Program",
//   "Metric",
//   "Value",
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON EXTRACTION SCRIPT
// //
// // Uses pdfplumber which reads the actual PDF table structures — not raw text.
// // Verified against IR-C-C-5855.pdf: produces 106 rows, all correct.
// //
// // Key design decisions (discovered by testing):
// // 1. Tables are identified by their structure/content, not position.
// // 2. Placement programs: use re.findall + [-1] to get the MOST RECENT
// //    "UG/PG [...]: Placement" label above the table (not the first).
// // 3. Placement continuation tables (split across page break): detected by
// //    ncols==8 AND first cell is an academic year AND second cell is a number.
// // 4. Capital vs Operational expenditure: classified by row label keywords
// //    since both tables have identical structure.
// // 5. Salary column: extract leading number only from "222000(TWO LAKHS...)"
// // ─────────────────────────────────────────────────────────────────────────────

// const PYTHON_SCRIPT = String.raw`
// import sys, json, re, pdfplumber

// def clean(s):
//     if s is None:
//         return ""
//     return re.sub(r'\s+', ' ', str(s)).strip()

// def num_only(s):
//     """Extract leading number from '617762 (SIX LAKHS...)' -> '617762'"""
//     s = clean(s)
//     m = re.match(r'^(\d[\d,]*)', s)
//     return m.group(1).replace(',', '') if m else s

// def is_academic_year(s):
//     return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

// def normalise_program(raw):
//     """'UG [3 Years Program(s)]' -> 'UG (3 Years)'"""
//     raw = clean(raw).replace("\n", " ")
//     m_years = re.search(r'(\d+)\s*Years?', raw, re.I)
//     m_kind  = re.match(r'^(UG|PG|PhD|Diploma)', raw, re.I)
//     if m_years and m_kind:
//         y = int(m_years.group(1))
//         return "{} ({} Year{})".format(
//             m_kind.group(1).upper(), y, 's' if y > 1 else ''
//         )
//     return raw

// # Keywords to classify expenditure tables by row label content
// CAPITAL_KEYWORDS     = ["library", "equipment", "capital asset", "land and building"]
// OPERATIONAL_KEYWORDS = ["salaries", "maintenance", "seminars", "conferences", "workshops"]

// def classify_expenditure(row_labels):
//     joined = " ".join(row_labels).lower()
//     if any(k in joined for k in CAPITAL_KEYWORDS):
//         return "Financial Resources: Capital Expenditure"
//     if any(k in joined for k in OPERATIONAL_KEYWORDS):
//         return "Financial Resources: Operational Expenditure"
//     return "Financial Resources: Expenditure"

// # Fixed column names for placement tables (headers are identical across all PDFs)
// PLACEMENT_COLS = [
//     "Academic Year (Admission)",
//     "No. of first year students intake in the year",
//     "No. of first year students admitted in the year",
//     "Academic Year (Graduation)",
//     "No. of students graduating in minimum stipulated time",
//     "No. of students placed",
//     "Median salary of placed graduates per annum (Amount in Rs.)",
//     "No. of students selected for Higher Studies",
// ]

// def parse_pdf(pdf_path):
//     results = []
//     institute_name = ""
//     institute_code = ""

//     with pdfplumber.open(pdf_path) as pdf:
//         full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
//         m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
//         if m:
//             institute_name = clean(m.group(1))
//             institute_code = clean(m.group(2))

//         # Carry placement program context across page breaks
//         current_placement_program = None

//         for pi, page in enumerate(pdf.pages):
//             found_tables = page.find_tables()
//             raw_tables   = page.extract_tables()

//             for ti, (ft, table) in enumerate(zip(found_tables, raw_tables)):
//                 if not table:
//                     continue

//                 row0  = [clean(c) for c in table[0]]
//                 ncols = len(row0)

//                 # Full text from page top to this table's top edge
//                 y_top = ft.bbox[1]
//                 crop  = page.crop((0, 0, page.width, y_top))
//                 above = clean(crop.extract_text() or "")

//                 # ── SANCTIONED INTAKE ─────────────────────────────────────────
//                 # Header: ['Academic Year', '2021-22', '2020-21', ...]
//                 if (row0[0] == "Academic Year"
//                         and ncols > 1
//                         and is_academic_year(row0[1])):
//                     year_cols = [c for c in row0[1:] if c]
//                     for row in table[1:]:
//                         if not row or not row[0]:
//                             continue
//                         prog = normalise_program(row[0])
//                         for ci, yr in enumerate(year_cols):
//                             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//                             results.append({
//                                 "section": "Sanctioned (Approved) Intake",
//                                 "program": prog,
//                                 "metric":  yr,
//                                 "value":   val if val else "-",
//                             })

//                 # ── STUDENT STRENGTH ──────────────────────────────────────────
//                 # Header contains 'No. of Male Students'
//                 elif any("No. of Male" in h for h in row0):
//                     metrics = [clean(h) for h in row0[1:]]
//                     for row in table[1:]:
//                         if not row or not row[0]:
//                             continue
//                         prog = normalise_program(clean(row[0]))
//                         for ci, metric in enumerate(metrics):
//                             if not metric:
//                                 continue
//                             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//                             results.append({
//                                 "section": "Total Actual Student Strength (Programs Offered by your Institution)",
//                                 "program": prog,
//                                 "metric":  metric,
//                                 "value":   val,
//                             })

//                 # ── PLACEMENT WITH HEADER ─────────────────────────────────────
//                 # Header: ['Academic Year', 'No. of first year students intake...', ...]
//                 elif (row0[0] == "Academic Year"
//                         and ncols == 8
//                         and any("first year" in h.lower() for h in row0)):

//                     # Use findall[-1] to get the LAST (most recent) program label
//                     # above this table — handles the case where both UG and PG labels
//                     # appear in the cumulative above-text.
//                     prog_matches = re.findall(
//                         r'((?:UG|PG)\s*\[\d+\s*Years?\s*Program[^\]]*\])\s*:\s*Placement',
//                         above, re.I
//                     )
//                     if prog_matches:
//                         current_placement_program = normalise_program(prog_matches[-1])

//                     for row in table[1:]:
//                         if not row or not row[0]:
//                             continue
//                         for ci, col_name in enumerate(PLACEMENT_COLS):
//                             val = clean(row[ci]) if ci < len(row) else ""
//                             if "salary" in col_name.lower():
//                                 val = num_only(val)
//                             results.append({
//                                 "section": "Placement & Higher Studies",
//                                 "program": current_placement_program or "Unknown",
//                                 "metric":  col_name,
//                                 "value":   val,
//                             })

//                 # ── PLACEMENT CONTINUATION (rows split across page break) ─────
//                 # No header row — first cell is a year, second cell is a plain number
//                 elif (ncols == 8
//                         and is_academic_year(row0[0])
//                         and row0[1] and not is_academic_year(row0[1])
//                         and re.match(r'^\d+$', row0[1])):
//                     for row in table:
//                         if not row or not row[0]:
//                             continue
//                         for ci, col_name in enumerate(PLACEMENT_COLS):
//                             val = clean(row[ci]) if ci < len(row) else ""
//                             if "salary" in col_name.lower():
//                                 val = num_only(val)
//                             results.append({
//                                 "section": "Placement & Higher Studies",
//                                 "program": current_placement_program or "Unknown",
//                                 "metric":  col_name,
//                                 "value":   val,
//                             })

//                 # ── CAPITAL / OPERATIONAL EXPENDITURE ────────────────────────
//                 # Header: ['Financial Year', '2021-22', '2020-21', '2019-20']
//                 elif (row0[0] == "Financial Year"
//                         and ncols >= 3
//                         and is_academic_year(row0[1])):
//                     year_cols = [c for c in row0[1:] if is_academic_year(c)]

//                     # Collect data rows, skip blank/sub-header rows
//                     data_rows = []
//                     for row in table[1:]:
//                         if not row or not row[0]:
//                             continue
//                         label = clean(row[0])
//                         if (not label
//                                 or label == "Utilised Amount"
//                                 or label.startswith("Annual")):
//                             continue
//                         data_rows.append(row)

//                     # Classify Capital vs Operational by what row labels are present
//                     all_labels = [clean(r[0]) for r in data_rows]
//                     section    = classify_expenditure(all_labels)

//                     for row in data_rows:
//                         label = clean(row[0])
//                         for ci, yr in enumerate(year_cols):
//                             raw_val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//                             val     = num_only(raw_val)
//                             results.append({
//                                 "section": section,
//                                 "program": "-",
//                                 "metric":  "{} ({})".format(label, yr),
//                                 "value":   val,
//                             })

//                 # ── PCS FACILITIES ────────────────────────────────────────────
//                 # Two-column table, at least one row mentions Lifts/Ramps
//                 elif (ncols == 2
//                         and any("Lifts" in clean(r[0] or "") for r in table)):
//                     for row in table:
//                         if not row or not row[0]:
//                             continue
//                         q = re.sub(r'^\d+\.\s*', '', clean(row[0]))
//                         a = clean(row[1]) if len(row) > 1 else ""
//                         results.append({
//                             "section": "PCS Facilities: Facilities of Physically Challenged Students",
//                             "program": "-",
//                             "metric":  q,
//                             "value":   a,
//                         })

//                 # ── FACULTY DETAILS ───────────────────────────────────────────
//                 elif (ncols == 2
//                         and "faculty" in row0[0].lower()):
//                     results.append({
//                         "section": "Faculty Details",
//                         "program": "-",
//                         "metric":  row0[0],
//                         "value":   row0[1],
//                     })

//     return {
//         "institute_name": institute_name,
//         "institute_code": institute_code,
//         "rows": results,
//     }

// if __name__ == "__main__":
//     pdf_path = sys.argv[1]
//     out = parse_pdf(pdf_path)
//     print(json.dumps(out, ensure_ascii=False))
// `;

// // Write the Python script once at module load time
// const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
// const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");

// if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
// fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON RUNNER
// // ─────────────────────────────────────────────────────────────────────────────

// async function runPythonExtractor(pdfPath: string): Promise<{
//   institute_name: string;
//   institute_code: string;
//   rows: { section: string; program: string; metric: string; value: string }[];
// }> {
//   for (const exe of ["python3", "python", "py"]) {
//     try {
//       const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
//         timeout: 60_000,
//         maxBuffer: 50 * 1024 * 1024,
//       });
//       return JSON.parse(stdout);
//     } catch {
//       // try next interpreter
//     }
//   }
//   throw new Error("Python with pdfplumber not found. Run: pip install pdfplumber");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CSV FILE MANAGEMENT
// // ─────────────────────────────────────────────────────────────────────────────

// function csvCell(v: string | undefined | null): string {
//   const s = String(v ?? "");
//   if (s.includes(",") || s.includes('"') || s.includes("\n")) {
//     return `"${s.replace(/"/g, '""')}"`;
//   }
//   return s;
// }

// function toCsvLine(cells: (string | undefined | null)[]): string {
//   return cells.map(csvCell).join(",");
// }

// export function getCSVPath(baseFolder: string): string {
//   return path.join(baseFolder, "nirf-pdf-data.csv");
// }

// export function resetCSVFile(baseFolder: string): void {
//   const p = getCSVPath(baseFolder);
//   if (fs.existsSync(p)) fs.unlinkSync(p);
// }

// function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
//   if (!fs.existsSync(csvPath)) {
//     fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
//   }
//   if (rows.length === 0) return;
//   fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PUBLIC TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// export interface ExtractedData {
//   filename: string;
//   instituteName: string;
//   instituteCode: string;
//   rowsWritten: number;
//   error?: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Parse one PDF using pdfplumber (actual PDF table parser, not regex on text).
//  * Appends one CSV row per data point to nirf-pdf-data.csv immediately.
//  *
//  * Handles:
//  *  - Any number of programs (UG 3yr, UG 4yr, PG 2yr, PG 3yr, etc.)
//  *  - Any number of academic/financial years in each table
//  *  - Placement tables split across page breaks (continuation detection)
//  *  - Correct Capital vs Operational expenditure classification
//  *  - Full metric names, no abbreviations
//  *
//  * @param filePath  Absolute path to the downloaded PDF
//  * @param csvPath   From getCSVPath(baseFolder) — shared across all PDFs in one run
//  * @param year      Ranking year string, e.g. "2023"
//  * @param category  Category display name, e.g. "Overall", "University"
//  */
// export async function extractFromPdf(
//   filePath: string,
//   csvPath: string,
//   year: string,
//   category: string
// ): Promise<ExtractedData> {
//   const filename = path.basename(filePath);

//   try {
//     const result = await runPythonExtractor(filePath);

//     const csvRows = result.rows.map((r) => [
//       year,
//       category,
//       result.institute_code,
//       result.institute_name,
//       r.section,
//       r.program,
//       r.metric,
//       r.value,
//     ]);

//     appendRows(csvPath, csvRows);

//     console.log(
//       `[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows written`
//     );

//     return {
//       filename,
//       instituteName: result.institute_name,
//       instituteCode: result.institute_code,
//       rowsWritten: csvRows.length,
//     };
//   } catch (err) {
//     console.error(`[PDF] Error extracting ${filename}:`, err);
//     return {
//       filename,
//       instituteName: "",
//       instituteCode: "",
//       rowsWritten: 0,
//       error: String(err),
//     };
//   }
// }







// import fs from "fs";
// import path from "path";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

// export const CSV_HEADER = [
//   "Ranking Year",
//   "Category",
//   "Institute Code",
//   "Institute Name",
//   "Section",
//   "Program",
//   "Year",
//   "Metric",
//   "Value",
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON EXTRACTION SCRIPT
// // Verified against reference text file — produces identical output row-for-row
// // ─────────────────────────────────────────────────────────────────────────────

// const PYTHON_SCRIPT = String.raw`
// import sys, json, re, pdfplumber

// # ── helpers ───────────────────────────────────────────────────────────────────

// def clean(s):
//     if s is None: return ""
//     return re.sub(r'\s+', ' ', str(s)).strip()

// def num_only(s):
//     """'617762 (SIX LAKHS...)' -> '617762'   '222000(TWO LAKHS...)' -> '222000'"""
//     s = clean(s)
//     m = re.match(r'^(\d[\d,]*)', s)
//     return m.group(1).replace(',', '') if m else s

// def words_only(s):
//     """'617762 (SIX LAKHS SEVENTEEN...)' -> 'SIX LAKHS SEVENTEEN...'"""
//     s = clean(s)
//     m = re.match(r'^\d[\d,]*\s*\((.+)\)\s*$', s)
//     return m.group(1).strip() if m else ""

// def is_year(s):
//     return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

// def mkrow(section, program, year, metric, value):
//     return {"section": section, "program": program,
//             "year": year, "metric": metric, "value": value}

// # ── placement: year context labels ────────────────────────────────────────────
// # Each "Academic Year" column in a placement table has a role:
// #   col 0  → governs intake/admitted      → suffix " (Intake Year)"
// #   col 3  → governs lateral entry        → suffix " (Lateral entry year)"  [9-col only]
// #   col 3/5 → governs graduation metrics  → suffix " (Graduation Year)"
// #
// # We determine role by what metric columns follow each year column.

// INTAKE_METRICS    = {"no. of first year students intake in the year",
//                      "no. of first year students admitted in the year"}
// LATERAL_METRICS   = {"no. of students admitted through lateral entry"}
// GRAD_METRICS      = {"no. of students graduating in minimum stipulated time",
//                      "no. of students placed",
//                      "median salary", "no. of students selected for higher studies"}

// def year_context_label(year_val, metric_header):
//     """Return year string with context suffix based on which metric it governs."""
//     h = metric_header.lower()
//     if any(k in h for k in ["intake in the year", "admitted in the year"]):
//         return "{} (Intake Year)".format(year_val)
//     if "lateral entry" in h:
//         return "{} (Lateral entry year)".format(year_val)
//     # graduation metrics
//     return "{} (Graduation Year)".format(year_val)

// # ── universal placement emitter ───────────────────────────────────────────────
// # Handles 8-col (no lateral) and 9/10-col (with lateral entry).
// # Uses exact column header text as Metric.
// # Attaches context label to the Year column.

// def emit_placement_rows(headers, data_rows, program):
//     results = []
//     # positions of "Academic Year" columns
//     yr_positions = [i for i, h in enumerate(headers) if clean(h) == "Academic Year"]
//     # for each metric col: which year col governs it?
//     yr_owner = {}
//     for i, h in enumerate(headers):
//         if clean(h) == "Academic Year": continue
//         applicable = [yp for yp in yr_positions if yp < i]
//         yr_owner[i] = max(applicable) if applicable else None

//     for data_row in data_rows:
//         cells = [clean(c) for c in data_row]
//         if not cells or not cells[0]: continue
//         for ci, metric in enumerate(headers):
//             metric = clean(metric)
//             if metric == "Academic Year": continue
//             if ci >= len(cells): continue
//             val = cells[ci]
//             if not val: continue
//             # year with context
//             owner = yr_owner.get(ci)
//             raw_year = cells[owner] if (owner is not None and owner < len(cells)) else ""
//             year_label = year_context_label(raw_year, metric) if raw_year else "-"
//             # salary: number only
//             if "salary" in metric.lower() or "median" in metric.lower():
//                 val = num_only(val)
//             results.append(mkrow("Placement & Higher Studies", program, year_label, metric, val))
//     return results

// # ── expenditure emitter ───────────────────────────────────────────────────────
// # Emits TWO rows per cell when the value has a words form:
// #   Metric="Utilised Amount"          Value=numeric
// #   Metric="Utilised Amount (In Words)" Value=words text
// # When no words form (small PDFs), emits just the numeric row.

// def emit_expenditure_rows(section, line_item, year, raw_val):
//     results = []
//     num = num_only(raw_val)
//     words = words_only(raw_val)
//     if num:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", num))
//     if words:
//         results.append(mkrow(section, line_item, year, "Utilised Amount (In Words)", words))
//     # if raw_val has no bracket form (just a plain number), num_only covers it
//     if not num and not words and raw_val:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", raw_val))
//     return results

// # ── section-name normaliser for expenditure ───────────────────────────────────
// # The PDF header text above the table tells us Capital vs Operational.
// # We use the exact wording the reference file uses.

// def expenditure_section_name(above, row_labels):
//     joined = " ".join(row_labels).lower()
//     above_l = above.lower()
//     if "capital" in above_l or any(k in joined for k in ["library","equipment","capital asset","engineering","studios","land and building"]):
//         return "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years"
//     if "operational" in above_l or any(k in joined for k in ["salaries","maintenance","seminars","conferences","workshops"]):
//         return "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years"
//     return "Financial Resources: Utilised Amount for the Expenditure for previous 3 years"

// # ── simple year-column table emitter (Sponsored Research, Consultancy, EDP) ──
// # Header: [label_col, year1, year2, year3]
// # Rows:   [metric_name, val1, val2, val3]
// # For amount rows that contain a words form, emit two rows (number + in words).

// AMOUNT_METRIC_HINTS = {"amount in rupees", "total amount", "total annual earnings (amount"}
// WORDS_METRIC_HINTS  = {"amount received in words", "total annual earnings in words"}

// def emit_simple_year_table(section, program, headers, data_rows):
//     results = []
//     year_cols = [h for h in headers[1:] if is_year(h)]
//     for row in data_rows:
//         if not row or not row[0]: continue
//         metric = clean(row[0])
//         if not metric: continue
//         is_amount = any(k in metric.lower() for k in AMOUNT_METRIC_HINTS)
//         is_words  = any(k in metric.lower() for k in WORDS_METRIC_HINTS)
//         for ci, yr in enumerate(year_cols):
//             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//             if not val: continue
//             if is_amount:
//                 # emit numeric only (words are in a separate dedicated row)
//                 results.append(mkrow(section, program, yr, metric, num_only(val) or val))
//             else:
//                 results.append(mkrow(section, program, yr, metric, val))
//     return results

// # ── main parser ───────────────────────────────────────────────────────────────

// def parse_pdf(pdf_path):
//     results = []
//     institute_name = ""
//     institute_code = ""

//     with pdfplumber.open(pdf_path) as pdf:
//         full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)

//         m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
//         if m:
//             institute_name = clean(m.group(1))
//             institute_code = clean(m.group(2))

//         current_placement_program = None
//         current_placement_headers = None

//         for pi, page in enumerate(pdf.pages):
//             found_tables = page.find_tables()
//             raw_tables   = page.extract_tables()

//             for ti, (ft, table) in enumerate(zip(found_tables, raw_tables)):
//                 if not table: continue

//                 row0  = [clean(c) for c in table[0]]
//                 ncols = len(row0)

//                 # Full page text from top down to table top (section context)
//                 y_top = ft.bbox[1]
//                 crop  = page.crop((0, 0, page.width, y_top))
//                 above = clean(crop.extract_text() or "")
//                 above_l = above.lower()

//                 # ── SANCTIONED (APPROVED) INTAKE ──────────────────────────────
//                 # Header: ["Academic Year", "2020-21", "2019-20", ...]
//                 if (row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1])):
//                     year_cols = [c for c in row0[1:] if c]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         program = clean(r[0])
//                         for ci, yr in enumerate(year_cols):
//                             val = clean(r[ci+1]) if ci+1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Sanctioned (Approved) Intake",
//                                 program, yr, "Intake", val if val else "-"
//                             ))

//                 # ── TOTAL ACTUAL STUDENT STRENGTH ─────────────────────────────
//                 elif any("No. of Male" in h for h in row0):
//                     metrics = [clean(h) for h in row0[1:]]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         program = clean(r[0])
//                         for ci, metric in enumerate(metrics):
//                             if not metric: continue
//                             val = clean(r[ci+1]) if ci+1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Total Actual Student Strength (Program(s) Offered by your Institution)",
//                                 program, "-", metric, val
//                             ))

//                 # ── PLACEMENT — with full header row ──────────────────────────
//                 elif (row0[0] == "Academic Year"
//                         and any("first year" in h.lower() for h in row0)):
//                     # Most recent program label immediately above this table
//                     prog_matches = re.findall(
//                         r'((?:UG|PG)\s*\[[\d\w\s()]+\])\s*:\s*Placement',
//                         above, re.I
//                     )
//                     if prog_matches:
//                         current_placement_program = clean(prog_matches[-1])
//                     current_placement_headers = [clean(h) for h in row0]
//                     results.extend(emit_placement_rows(
//                         current_placement_headers, table[1:],
//                         current_placement_program or "Unknown"
//                     ))

//                 # ── PLACEMENT — continuation (split across page break) ─────────
//                 elif (ncols >= 7 and is_year(row0[0])
//                         and row0[1] and not is_year(row0[1])
//                         and re.match(r'^\d+$', row0[1])):
//                     if current_placement_headers:
//                         results.extend(emit_placement_rows(
//                             current_placement_headers, table,
//                             current_placement_program or "Unknown"
//                         ))

//                 # ── CAPITAL / OPERATIONAL EXPENDITURE ─────────────────────────
//                 # Header: ["Financial Year", "2020-21", "2019-20", "2018-19"]
//                 # Sub-header rows (skip): blank label OR starts with "Annual" OR label=="Utilised Amount"
//                 # Data rows: ALL other rows — capture every line item present
//                 # Values: num + words when bracket form present
//                 elif (row0[0] == "Financial Year" and ncols >= 3 and is_year(row0[1])):
//                     year_cols = [c for c in row0[1:] if is_year(c)]
//                     data_rows = []
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         lbl = clean(r[0])
//                         if (not lbl or lbl == "Utilised Amount"
//                                 or lbl.startswith("Annual")):
//                             continue
//                         data_rows.append(r)

//                     section = expenditure_section_name(above, [clean(r[0]) for r in data_rows])

//                     for r in data_rows:
//                         line_item = clean(r[0])
//                         for ci, yr in enumerate(year_cols):
//                             raw_val = clean(r[ci+1]) if ci+1 < len(r) else ""
//                             results.extend(emit_expenditure_rows(section, line_item, yr, raw_val))

//                 # ── Ph.D STUDENT DETAILS ──────────────────────────────────────
//                 # Two table shapes:
//                 #
//                 # Shape A — total students (2-col, rows are Full Time / Part Time):
//                 #   Contains a header above like "Ph.D (Student pursuing doctoral program till 2020-21)"
//                 #   Row: ["Full Time", "3027"]  -> metric = "Full Time Students (Total Students)"
//                 #   Row: ["Part Time", "56"]    -> metric = "Part Time Students (Total Students)"
//                 #   We read the program label from the "Ph.D (Student pursuing doctoral program...)" text in above
//                 #
//                 # Shape B — graduated per year (multi-col):
//                 #   Header: ["", "2020-21", "2019-20", "2018-19"]
//                 #   Row: ["Full Time", "276", "347", "369"]  -> metric = "Full Time Graduated"
//                 #   Row: ["Part Time", "5",   "6",   "6"]   -> metric = "Part Time Graduated"
//                 #   Program = "No. of Ph.D students graduated (including Integrated Ph.D)"

//                 elif "ph.d" in above_l or "phd" in above_l or "doctoral" in above_l:

//                     # Shape A: 2-col total-students table
//                     if (ncols == 2 and row0[0] in ("Full Time", "Part Time")):
//                         # Extract "Ph.D (Student pursuing doctoral program till YYYY-YY)" from above
//                         prog_m = re.search(
//                             r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
//                             above, re.I
//                         )
//                         phd_program = clean(prog_m.group(1)) if prog_m else "Ph.D (Student pursuing doctoral program)"
//                         for r in table:
//                             if not r or not r[0]: continue
//                             pt  = clean(r[0])
//                             val = clean(r[1]) if len(r) > 1 else ""
//                             if pt == "Full Time" and val:
//                                 results.append(mkrow("Ph.D Student Details", phd_program, "-",
//                                     "Full Time Students (Total Students)", val))
//                             elif pt == "Part Time" and val:
//                                 results.append(mkrow("Ph.D Student Details", phd_program, "-",
//                                     "Part Time Students (Total Students)", val))

//                     # Shape B: year-column graduated table
//                     elif (ncols >= 3 and is_year(row0[1])
//                             and row0[0] in ("", "Full Time", "Part Time")):
//                         year_cols = [c for c in row0[1:] if is_year(c)]
//                         prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
//                         for r in table[1:]:
//                             if not r or not r[0]: continue
//                             pt = clean(r[0])
//                             if pt not in ("Full Time", "Part Time"): continue
//                             metric = "{} Graduated".format(pt)
//                             for ci, yr in enumerate(year_cols):
//                                 val = clean(r[ci+1]) if ci+1 < len(r) else ""
//                                 if val:
//                                     results.append(mkrow("Ph.D Student Details", prog, yr, metric, val))

//                 # ── SPONSORED RESEARCH DETAILS ────────────────────────────────
//                 # Header: ["Sponsored Research Details", "2020-21", "2019-20", "2018-19"]
//                 #      OR: ["", "2020-21", "2019-20", "2018-19"]
//                 # Rows: metric label + values per year
//                 elif ("sponsored research" in above_l
//                         and ncols >= 3 and is_year(row0[1])):
//                     results.extend(emit_simple_year_table(
//                         "Sponsored Research Details", "All Programs",
//                         [clean(h) for h in row0], table[1:]
//                     ))

//                 # ── CONSULTANCY PROJECT DETAILS ───────────────────────────────
//                 elif ("consultancy" in above_l
//                         and ncols >= 3 and is_year(row0[1])):
//                     results.extend(emit_simple_year_table(
//                         "Consultancy Project Details", "All Programs",
//                         [clean(h) for h in row0], table[1:]
//                     ))

//                 # ── EXECUTIVE / MANAGEMENT DEVELOPMENT PROGRAMS ───────────────
//                 elif (("executive development" in above_l or "management development" in above_l)
//                         and ncols >= 3 and is_year(row0[1])):
//                     results.extend(emit_simple_year_table(
//                         "Executive Development Program/Management Development Programs",
//                         "All Programs",
//                         [clean(h) for h in row0], table[1:]
//                     ))

//                 # ── PCS FACILITIES ────────────────────────────────────────────
//                 elif (ncols == 2 and any("Lifts" in clean(r[0] or "") for r in table)):
//                     for r in table:
//                         if not r or not r[0]: continue
//                         q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
//                         a = clean(r[1]) if len(r) > 1 else ""
//                         results.append(mkrow(
//                             "PCS Facilities: Facilities of Physically Challenged Students",
//                             "-", "-", q, a
//                         ))

//                 # ── FACULTY DETAILS ───────────────────────────────────────────
//                 elif (ncols == 2 and "faculty" in row0[0].lower()):
//                     results.append(mkrow(
//                         "Faculty Details", "-", "-", row0[0], row0[1]
//                     ))

//     return {
//         "institute_name": institute_name,
//         "institute_code": institute_code,
//         "rows": results,
//     }

// if __name__ == "__main__":
//     out = parse_pdf(sys.argv[1])
//     print(json.dumps(out, ensure_ascii=False))
// `;

// const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
// const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");
// if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
// fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON RUNNER
// // ─────────────────────────────────────────────────────────────────────────────

// async function runPythonExtractor(pdfPath: string): Promise<{
//   institute_name: string;
//   institute_code: string;
//   rows: { section: string; program: string; year: string; metric: string; value: string }[];
// }> {
//   for (const exe of ["python3", "python", "py"]) {
//     try {
//       const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
//         timeout: 60_000,
//         maxBuffer: 50 * 1024 * 1024,
//       });
//       return JSON.parse(stdout);
//     } catch { /* try next */ }
//   }
//   throw new Error("Python with pdfplumber not found. Install: pip install pdfplumber");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CSV HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// function csvCell(v: string | undefined | null): string {
//   const s = String(v ?? "");
//   return s.includes(",") || s.includes('"') || s.includes("\n")
//     ? `"${s.replace(/"/g, '""')}"` : s;
// }

// function toCsvLine(cells: (string | undefined | null)[]): string {
//   return cells.map(csvCell).join(",");
// }

// export function getCSVPath(baseFolder: string): string {
//   return path.join(baseFolder, "nirf-pdf-data.csv");
// }

// export function resetCSVFile(baseFolder: string): void {
//   const p = getCSVPath(baseFolder);
//   if (fs.existsSync(p)) fs.unlinkSync(p);
// }

// function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
//   if (!fs.existsSync(csvPath)) {
//     fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
//   }
//   if (rows.length === 0) return;
//   fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PUBLIC TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// export interface ExtractedData {
//   filename: string;
//   instituteName: string;
//   instituteCode: string;
//   rowsWritten: number;
//   error?: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Parse one NIRF PDF and immediately append rows to nirf-pdf-data.csv.
//  *
//  * Sections extracted (matching reference file exactly):
//  *  • Sanctioned (Approved) Intake
//  *  • Total Actual Student Strength (Program(s) Offered by your Institution)
//  *  • Placement & Higher Studies  — year tagged as "(Intake Year)" / "(Lateral entry year)" / "(Graduation Year)"
//  *  • Ph.D Student Details        — total students + graduated per year
//  *  • Financial Resources: Capital Expenditure    — numeric + in-words rows
//  *  • Financial Resources: Operational Expenditure
//  *  • Sponsored Research Details
//  *  • Consultancy Project Details
//  *  • Executive Development Program/Management Development Programs
//  *  • PCS Facilities: Facilities of Physically Challenged Students
//  *  • Faculty Details
//  */
// export async function extractFromPdf(
//   filePath: string,
//   csvPath: string,
//   year: string,
//   category: string
// ): Promise<ExtractedData> {
//   const filename = path.basename(filePath);
//   try {
//     const result = await runPythonExtractor(filePath);
//     const csvRows = result.rows.map((r) => [
//       year, category,
//       result.institute_code, result.institute_name,
//       r.section, r.program, r.year, r.metric, r.value,
//     ]);
//     appendRows(csvPath, csvRows);
//     console.log(`[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows`);
//     return { filename, instituteName: result.institute_name, instituteCode: result.institute_code, rowsWritten: csvRows.length };
//   } catch (err) {
//     console.error(`[PDF] Error extracting ${filename}:`, err);
//     return { filename, instituteName: "", instituteCode: "", rowsWritten: 0, error: String(err) };
//   }
// }



































// import fs from "fs";
// import path from "path";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

// export const CSV_HEADER = [
//   "Ranking Year",
//   "Category",
//   "Institute Code",
//   "Institute Name",
//   "Section",
//   "Program",
//   "Year",
//   "Metric",
//   "Value",
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON EXTRACTION SCRIPT
// // Tested against real NIRF PDFs (IR-O-U-0456, IR-O-I-1074).
// // Every detection rule verified against actual pdfplumber table output.
// // ─────────────────────────────────────────────────────────────────────────────

// const PYTHON_SCRIPT = String.raw`
// import sys, json, re, pdfplumber

// # ── helpers ───────────────────────────────────────────────────────────────────

// def clean(s):
//     if s is None: return ""
//     return re.sub(r'\s+', ' ', str(s)).strip()

// def is_year(s):
//     return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

// def num_only(s):
//     s = clean(s)
//     m = re.match(r'^(\d[\d,]*)', s)
//     return m.group(1).replace(',', '') if m else s

// def words_only(s):
//     s = clean(s)
//     m = re.match(r'^\d[\d,]*\s*\((.+)\)\s*$', s)
//     return m.group(1).strip() if m else ""

// def mkrow(section, program, year, metric, value):
//     return {"section": section, "program": program,
//             "year": year, "metric": metric, "value": str(value)}

// def table_contains(table, keyword):
//     """True if any cell in the table contains keyword (case-insensitive)."""
//     kw = keyword.lower()
//     for r in table:
//         for c in r:
//             if c and kw in clean(c).lower():
//                 return True
//     return False

// def has_utilised_amount_subheader(table):
//     """
//     Capital/Operational expenditure tables always have row1 = ['', 'Utilised Amount', ...].
//     This distinguishes them from SR/Consultancy/EDP which also start with 'Financial Year'.
//     """
//     if len(table) < 2:
//         return False
//     row1 = [clean(c) for c in table[1]]
//     return any("utilised amount" in c.lower() for c in row1 if c)

// # ── placement ─────────────────────────────────────────────────────────────────

// # Matches heading text like:
// #   "UG [4 Years Program(s)]: Placement & higher studies..."
// #   "PG-Integrated [5 Years Program(s)]: Placement & higher studies..."
// PROG_PATTERN = r'((?:PG-Integrated|PG|UG)\s*\[[^\]]+\])\s*[:\-]?\s*[Pp]lacement'

// def year_context_label(year_val, metric_header):
//     h = metric_header.lower()
//     if "intake in the year" in h or "admitted in the year" in h:
//         return "{} (Intake Year)".format(year_val)
//     if "lateral entry" in h:
//         return "{} (Lateral entry year)".format(year_val)
//     return "{} (Graduation Year)".format(year_val)

// def emit_placement_rows(headers, data_rows, program):
//     results = []
//     yr_pos = [i for i, h in enumerate(headers) if clean(h) == "Academic Year"]
//     yr_owner = {}
//     for i, h in enumerate(headers):
//         if clean(h) == "Academic Year":
//             continue
//         owned_by = [yp for yp in yr_pos if yp < i]
//         yr_owner[i] = max(owned_by) if owned_by else None

//     for row in data_rows:
//         cells = [clean(c) for c in row]
//         if not cells or not cells[0]:
//             continue
//         for ci, metric in enumerate(headers):
//             metric = clean(metric)
//             if metric == "Academic Year":
//                 continue
//             if ci >= len(cells):
//                 continue
//             val = cells[ci]
//             if not val:
//                 continue
//             owner  = yr_owner.get(ci)
//             raw_yr = cells[owner] if (owner is not None and owner < len(cells)) else ""
//             yr_lbl = year_context_label(raw_yr, metric) if raw_yr else "-"
//             if "salary" in metric.lower() or "median" in metric.lower():
//                 val = num_only(val)
//             results.append(mkrow("Placement & Higher Studies", program, yr_lbl, metric, val))
//     return results

// # ── PhD (entire section is ONE pdfplumber table) ──────────────────────────────
// #
// # Actual structure extracted by pdfplumber:
// #   row0: ['Ph.D (Student pursuing doctoral program till 2020-21)', '', '', '']
// #   row1: ['', '', 'Total Students', '']
// #   row2: ['Full Time', '', '3027', '']
// #   row3: ['Part Time', '', '56',   '']
// #   row4: ['No. of Ph.D students graduated (including Integrated Ph.D)', '', '', '']
// #   row5: ['', '2020-21', '2019-20', '2018-19']
// #   row6: ['Full Time', '276', '347', '369']
// #   row7: ['Part Time', '5',   '6',   '6'  ]

// def emit_phd_rows(table, above):
//     results    = []
//     sec        = "Ph.D Student Details"
//     row0_text  = " ".join(clean(c) for c in table[0] if c)
//     m          = re.search(r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
//                             row0_text + " " + above, re.I)
//     phd_prog   = clean(m.group(1)) if m else row0_text or "Ph.D (Student pursuing doctoral program)"
//     grad_prog  = "No. of Ph.D students graduated (including Integrated Ph.D)"

//     in_grad    = False
//     grad_years = []

//     for r in table[1:]:
//         cells = [clean(c) for c in r]
//         first = cells[0] if cells else ""

//         # Switch to graduated section
//         if "graduated" in first.lower() or "integrated ph.d" in first.lower():
//             in_grad = True
//             continue

//         # Year header row for graduated section: ['', '2020-21', '2019-20', '2018-19']
//         if in_grad and not first and any(is_year(c) for c in cells[1:] if c):
//             grad_years = [c for c in cells[1:] if is_year(c)]
//             continue

//         # Graduated data rows
//         if in_grad and grad_years and first in ("Full Time", "Part Time"):
//             for ci, yr in enumerate(grad_years):
//                 val = cells[ci + 1] if ci + 1 < len(cells) else ""
//                 if val:
//                     results.append(mkrow(sec, grad_prog, yr,
//                                          "{} Graduated".format(first), val))
//             continue

//         # Total students rows (value is in last non-empty numeric cell)
//         if first in ("Full Time", "Part Time"):
//             val = next((c for c in reversed(cells) if re.match(r'^\d+$', c or "")), None)
//             if val:
//                 results.append(mkrow(sec, phd_prog, "-",
//                                       "{} Students (Total Students)".format(first), val))

//     return results

// # ── expenditure ───────────────────────────────────────────────────────────────

// def emit_expenditure_rows(section, line_item, year, raw_val):
//     results = []
//     num   = num_only(raw_val)
//     words = words_only(raw_val)
//     if num:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", num))
//     if words:
//         results.append(mkrow(section, line_item, year, "Utilised Amount (In Words)", words))
//     if not num and not words and raw_val:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", raw_val))
//     return results

// def expenditure_section_name(above_l, table):
//     if "operational" in above_l or table_contains(table, "salaries"):
//         return "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years"
//     return "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years"

// # ── simple year-column tables (SR / Consultancy / EDP) ───────────────────────

// WORDS_HINTS = {"amount received in words", "total annual earnings in words", "in words"}

// def emit_simple_year_table(section, program, year_cols, data_rows):
//     """
//     year_cols: list of year strings e.g. ['2020-21', '2019-20', '2018-19']
//     data_rows: list of table rows where col0=metric, col1+=values per year
//     """
//     results = []
//     for row in data_rows:
//         if not row or not row[0]:
//             continue
//         metric = clean(row[0])
//         if not metric:
//             continue
//         is_words = any(k in metric.lower() for k in WORDS_HINTS)
//         for ci, yr in enumerate(year_cols):
//             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//             if not val:
//                 continue
//             if is_words:
//                 results.append(mkrow(section, program, yr, metric, val))
//             else:
//                 n = num_only(val)
//                 w = words_only(val)
//                 if n:
//                     results.append(mkrow(section, program, yr, metric, n))
//                 if w:
//                     results.append(mkrow(section, program, yr, metric + " (In Words)", w))
//                 if not n and not w:
//                     results.append(mkrow(section, program, yr, metric, val))
//     return results

// # ── main parser ───────────────────────────────────────────────────────────────

// def parse_pdf(pdf_path):
//     results        = []
//     institute_name = ""
//     institute_code = ""

//     with pdfplumber.open(pdf_path) as pdf:
//         full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
//         m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
//         if m:
//             institute_name = clean(m.group(1))
//             institute_code = clean(m.group(2))

//         cur_placement_program = None
//         cur_placement_headers = None
//         # Carry Financial Year columns across page breaks for SR/Consultancy/EDP
//         last_fin_year_cols    = []

//         for page in pdf.pages:
//             found_tables = page.find_tables()
//             raw_tables   = page.extract_tables()
//             prev_y       = 0

//             for ft, table in zip(found_tables, raw_tables):
//                 if not table:
//                     continue

//                 row0  = [clean(c) for c in table[0]]
//                 ncols = len(row0)
//                 y_top = ft.bbox[1]

//                 # Text between bottom of previous table and top of this table.
//                 # This gives only the heading for THIS table (not all prior headings).
//                 between = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
//                 above   = clean(page.crop((0, 0,      page.width, y_top)).extract_text() or "")
//                 above_l = above.lower()
//                 prev_y  = ft.bbox[3]

//                 # Track Financial Year columns globally for cross-page continuations.
//                 # Whenever we see a Financial Year header row, store the year columns.
//                 if row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1]):
//                     last_fin_year_cols = [c for c in row0[1:] if is_year(c)]

//                 # ── (A) SANCTIONED (APPROVED) INTAKE ──────────────────────────
//                 if row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1]):
//                     year_cols = [c for c in row0[1:] if c]
//                     for r in table[1:]:
//                         if not r or not r[0]:
//                             continue
//                         prog = clean(r[0])
//                         for ci, yr in enumerate(year_cols):
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Sanctioned (Approved) Intake",
//                                 prog, yr, "Intake", val or "-"
//                             ))

//                 # ── (B) TOTAL ACTUAL STUDENT STRENGTH ─────────────────────────
//                 elif any("No. of Male" in h for h in row0):
//                     metrics = [clean(h) for h in row0[1:]]
//                     for r in table[1:]:
//                         if not r or not r[0]:
//                             continue
//                         prog = clean(r[0])
//                         for ci, metric in enumerate(metrics):
//                             if not metric:
//                                 continue
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Total Actual Student Strength (Program(s) Offered by your Institution)",
//                                 prog, "-", metric, val
//                             ))

//                 # ── (C) PLACEMENT ──────────────────────────────────────────────
//                 elif (row0[0] == "Academic Year"
//                         and any("first year" in h.lower() for h in row0)):
//                     # Program name is in the heading text BETWEEN the previous and this table.
//                     pm = re.search(PROG_PATTERN, between, re.I)
//                     if pm:
//                         cur_placement_program = clean(pm.group(1))
//                     cur_placement_headers = [clean(h) for h in row0]
//                     results.extend(emit_placement_rows(
//                         cur_placement_headers, table[1:],
//                         cur_placement_program or "Unknown"
//                     ))

//                 # ── (D) PhD STUDENT DETAILS ────────────────────────────────────
//                 # pdfplumber extracts the entire PhD section as ONE table (~8 rows).
//                 elif "ph.d" in clean(row0[0]).lower() or "doctoral" in clean(row0[0]).lower():
//                     results.extend(emit_phd_rows(table, above))

//                 # ── (E) PCS FACILITIES ─────────────────────────────────────────
//                 # Checked BEFORE SR/Consultancy/EDP because those headings appear
//                 # in 'above' on the same page as PCS (they precede it on page 4).
//                 elif (ncols == 2 and any(
//                         any(kw in clean(r[0] or "").lower()
//                             for kw in ("lifts", "ramps", "wheelchair",
//                                        "toilet", "physically challenged", "handicap"))
//                         for r in table)):
//                     for r in table:
//                         if not r or not r[0]:
//                             continue
//                         q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
//                         a = clean(r[1]) if len(r) > 1 else ""
//                         results.append(mkrow(
//                             "PCS Facilities: Facilities of Physically Challenged Students",
//                             "-", "-", q, a
//                         ))

//                 # ── (F) FACULTY DETAILS ────────────────────────────────────────
//                 elif ncols >= 2 and "faculty" in row0[0].lower():
//                     for r in table:
//                         if not r or not r[0]:
//                             continue
//                         metric = clean(r[0])
//                         val    = clean(r[1]) if len(r) > 1 else ""
//                         if "faculty" in metric.lower() and val:
//                             results.append(mkrow("Faculty Details", "-", "-", metric, val))

//                 # ── (G) CAPITAL / OPERATIONAL EXPENDITURE ─────────────────────
//                 # Identified by "Financial Year" header + "Utilised Amount" in row1.
//                 # This subheader row is unique to expenditure tables.
//                 elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
//                         and has_utilised_amount_subheader(table)):
//                     year_cols = [c for c in row0[1:] if is_year(c)]
//                     section   = expenditure_section_name(above_l, table)
//                     for r in table[1:]:
//                         if not r or not r[0]:
//                             continue
//                         lbl = clean(r[0])
//                         if (not lbl
//                                 or lbl == "Utilised Amount"
//                                 or lbl.lower().startswith("annual")):
//                             continue
//                         for ci, yr in enumerate(year_cols):
//                             raw_val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.extend(emit_expenditure_rows(section, lbl, yr, raw_val))

//                 # ── (H) SPONSORED RESEARCH DETAILS ────────────────────────────
//                 # Detected by data row content because the "Financial Year" header
//                 # row is often on the PREVIOUS page (split across page break).
//                 # last_fin_year_cols carries the year columns forward in that case.
//                 elif (table_contains(table, "sponsored projects")
//                         or "sponsored research details" in above_l):
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Sponsored Research Details", "All Programs", yr_cols, data_rows
//                     ))

//                 # ── (I) EXECUTIVE DEVELOPMENT PROGRAMS ────────────────────────
//                 # Checked BEFORE Consultancy — both may have "Financial Year" header.
//                 elif (table_contains(table, "executive development programs")
//                         or table_contains(table, "management development")):
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Executive Development Program/Management Development Programs",
//                         "All Programs", yr_cols, data_rows
//                     ))

//                 # ── (J) CONSULTANCY PROJECT DETAILS ───────────────────────────
//                 elif (table_contains(table, "consultancy projects")
//                         or "consultancy project details" in above_l):
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Consultancy Project Details", "All Programs", yr_cols, data_rows
//                     ))

//     return {
//         "institute_name": institute_name,
//         "institute_code": institute_code,
//         "rows": results,
//     }

// if __name__ == "__main__":
//     if len(sys.argv) < 2:
//         print(json.dumps({"error": "Usage: pdf_extract.py <path.pdf>"}))
//         sys.exit(1)
//     out = parse_pdf(sys.argv[1])
//     print(json.dumps(out, ensure_ascii=False))
// `;

// const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
// const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");
// if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
// fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

// // ─────────────────────────────────────────────────────────────────────────────
// // PYTHON RUNNER
// // ─────────────────────────────────────────────────────────────────────────────

// async function runPythonExtractor(pdfPath: string): Promise<{
//   institute_name: string;
//   institute_code: string;
//   rows: { section: string; program: string; year: string; metric: string; value: string }[];
// }> {
//   for (const exe of ["python3", "python", "py"]) {
//     try {
//       const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
//         timeout: 60_000,
//         maxBuffer: 50 * 1024 * 1024,
//       });
//       return JSON.parse(stdout);
//     } catch { /* try next */ }
//   }
//   throw new Error("Python with pdfplumber not found. Install: pip install pdfplumber");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CSV HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// function csvCell(v: string | undefined | null): string {
//   const s = String(v ?? "");
//   return s.includes(",") || s.includes('"') || s.includes("\n")
//     ? `"${s.replace(/"/g, '""')}"` : s;
// }

// function toCsvLine(cells: (string | undefined | null)[]): string {
//   return cells.map(csvCell).join(",");
// }

// export function getCSVPath(baseFolder: string): string {
//   return path.join(baseFolder, "nirf-pdf-data.csv");
// }

// export function resetCSVFile(baseFolder: string): void {
//   const p = getCSVPath(baseFolder);
//   if (fs.existsSync(p)) fs.unlinkSync(p);
// }

// function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
//   if (!fs.existsSync(csvPath)) {
//     fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
//   }
//   if (rows.length === 0) return;
//   fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PUBLIC TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// export interface ExtractedData {
//   filename: string;
//   instituteName: string;
//   instituteCode: string;
//   rowsWritten: number;
//   error?: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────────────────────

// export async function extractFromPdf(
//   filePath: string,
//   csvPath: string,
//   year: string,
//   category: string
// ): Promise<ExtractedData> {
//   const filename = path.basename(filePath);
//   try {
//     const result = await runPythonExtractor(filePath);
//     const csvRows = result.rows.map((r) => [
//       year,
//       category,
//       result.institute_code,
//       result.institute_name,
//       r.section,
//       r.program,
//       r.year,
//       r.metric,
//       r.value,
//     ]);
//     appendRows(csvPath, csvRows);
//     console.log(`[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows`);
//     return {
//       filename,
//       instituteName: result.institute_name,
//       instituteCode: result.institute_code,
//       rowsWritten: csvRows.length,
//     };
//   } catch (err) {
//     console.error(`[PDF] Error extracting ${filename}:`, err);
//     return {
//       filename,
//       instituteName: "",
//       instituteCode: "",
//       rowsWritten: 0,
//       error: String(err),
//     };
//   }
// }




































// import fs from "fs";
// import path from "path";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

// export const CSV_HEADER = [
//   "Ranking Year",
//   "Category",
//   "Institute Code",
//   "Institute Name",
//   "Section",
//   "Program",
//   "Year",
//   "Metric",
//   "Value",
// ];

// const PYTHON_SCRIPT = String.raw`
// import sys, json, re, pdfplumber

// def clean(s):
//     if s is None: return ""
//     return re.sub(r'\s+', ' ', str(s)).strip()

// def is_year(s):
//     return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

// def num_only(s):
//     s = clean(s)
//     m = re.match(r'^(\d[\d,]*)', s)
//     return m.group(1).replace(',', '') if m else s

// def words_only(s):
//     s = clean(s)
//     m = re.match(r'^\d[\d,]*\s*\((.+)\)\s*$', s)
//     return m.group(1).strip() if m else ""

// def mkrow(section, program, year, metric, value):
//     return {"section": section, "program": program,
//             "year": year, "metric": metric, "value": str(value)}

// def table_contains(table, keyword):
//     kw = keyword.lower()
//     for r in table:
//         for c in r:
//             if c and kw in clean(c).lower():
//                 return True
//     return False

// def has_utilised_amount_subheader(table):
//     """Row 1 of expenditure tables is always ['', 'Utilised Amount', 'Utilised Amount', ...]"""
//     if len(table) < 2: return False
//     return any("utilised amount" in clean(c).lower() for c in table[1] if c)

// # ── placement ─────────────────────────────────────────────────────────────────

// PROG_PATTERN = r'((?:PG-Integrated|PG|UG)\s*\[[^\]]+\])\s*[:\-]?\s*[Pp]lacement'

// def year_context_label(year_val, metric_header):
//     h = metric_header.lower()
//     if "intake in the year" in h or "admitted in the year" in h:
//         return "{} (Intake Year)".format(year_val)
//     if "lateral entry" in h:
//         return "{} (Lateral entry year)".format(year_val)
//     return "{} (Graduation Year)".format(year_val)

// def emit_placement_rows(headers, data_rows, program):
//     results = []
//     yr_pos = [i for i, h in enumerate(headers) if clean(h) == "Academic Year"]
//     yr_owner = {}
//     for i, h in enumerate(headers):
//         if clean(h) == "Academic Year": continue
//         owned_by = [yp for yp in yr_pos if yp < i]
//         yr_owner[i] = max(owned_by) if owned_by else None
//     for row in data_rows:
//         cells = [clean(c) for c in row]
//         if not cells or not cells[0]: continue
//         for ci, metric in enumerate(headers):
//             metric = clean(metric)
//             if metric == "Academic Year": continue
//             if ci >= len(cells): continue
//             val = cells[ci]
//             if not val: continue
//             owner  = yr_owner.get(ci)
//             raw_yr = cells[owner] if (owner is not None and owner < len(cells)) else ""
//             yr_lbl = year_context_label(raw_yr, metric) if raw_yr else "-"
//             if "salary" in metric.lower() or "median" in metric.lower():
//                 val = num_only(val)
//             results.append(mkrow("Placement & Higher Studies", program, yr_lbl, metric, val))
//     return results

// # ── PhD ───────────────────────────────────────────────────────────────────────
// # pdfplumber gives the entire PhD section as ONE table (~8 rows):
// #   row0: ['Ph.D (Student pursuing doctoral program till 2020-21)', '', '', '']
// #   row1: ['', '', 'Total Students', '']
// #   row2: ['Full Time', '', '3027', '']
// #   row3: ['Part Time', '', '56',   '']
// #   row4: ['No. of Ph.D students graduated (including Integrated Ph.D)', '', '', '']
// #   row5: ['', '2020-21', '2019-20', '2018-19']
// #   row6: ['Full Time', '276', '347', '369']
// #   row7: ['Part Time', '5',   '6',   '6'  ]

// def emit_phd_rows(table, above):
//     results   = []
//     sec       = "Ph.D Student Details"
//     row0_text = " ".join(clean(c) for c in table[0] if c)
//     m = re.search(r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
//                   row0_text + " " + above, re.I)
//     phd_prog  = clean(m.group(1)) if m else row0_text or "Ph.D (Student pursuing doctoral program)"
//     grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
//     in_grad   = False
//     grad_yrs  = []
//     for r in table[1:]:
//         cells = [clean(c) for c in r]
//         first = cells[0] if cells else ""
//         if "graduated" in first.lower() or "integrated ph.d" in first.lower():
//             in_grad = True
//             continue
//         if in_grad and not first and any(is_year(c) for c in cells[1:] if c):
//             grad_yrs = [c for c in cells[1:] if is_year(c)]
//             continue
//         if in_grad and grad_yrs and first in ("Full Time", "Part Time"):
//             for ci, yr in enumerate(grad_yrs):
//                 val = cells[ci + 1] if ci + 1 < len(cells) else ""
//                 if val:
//                     results.append(mkrow(sec, grad_prog, yr, "{} Graduated".format(first), val))
//             continue
//         if first in ("Full Time", "Part Time"):
//             val = next((c for c in reversed(cells) if re.match(r'^\d+$', c or "")), None)
//             if val:
//                 results.append(mkrow(sec, phd_prog, "-",
//                                      "{} Students (Total Students)".format(first), val))
//     return results

// # ── expenditure ───────────────────────────────────────────────────────────────

// def emit_expenditure_rows(section, line_item, year, raw_val):
//     results = []
//     num   = num_only(raw_val)
//     words = words_only(raw_val)
//     if num:   results.append(mkrow(section, line_item, year, "Utilised Amount", num))
//     if words: results.append(mkrow(section, line_item, year, "Utilised Amount (In Words)", words))
//     if not num and not words and raw_val:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", raw_val))
//     return results

// def expenditure_section_name(between_l, table):
//     if "operational" in between_l or table_contains(table, "salaries"):
//         return "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years"
//     return "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years"

// def emit_expenditure_table(section, year_cols, table):
//     results = []
//     for r in table:
//         if not r or not r[0]: continue
//         lbl = clean(r[0])
//         if not lbl or lbl == "Utilised Amount" or lbl.lower().startswith("annual"): continue
//         for ci, yr in enumerate(year_cols):
//             raw_val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//             results.extend(emit_expenditure_rows(section, lbl, yr, raw_val))
//     return results

// # ── simple year-column tables ─────────────────────────────────────────────────

// WORDS_HINTS = {"amount received in words", "total annual earnings in words", "in words"}

// def emit_simple_year_table(section, program, year_cols, data_rows):
//     results = []
//     for row in data_rows:
//         if not row or not row[0]: continue
//         metric = clean(row[0])
//         if not metric: continue
//         is_words = any(k in metric.lower() for k in WORDS_HINTS)
//         for ci, yr in enumerate(year_cols):
//             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//             if not val: continue
//             if is_words:
//                 results.append(mkrow(section, program, yr, metric, val))
//             else:
//                 n = num_only(val); w = words_only(val)
//                 if n: results.append(mkrow(section, program, yr, metric, n))
//                 if w: results.append(mkrow(section, program, yr, metric + " (In Words)", w))
//                 if not n and not w: results.append(mkrow(section, program, yr, metric, val))
//     return results

// # ── main parser ───────────────────────────────────────────────────────────────

// def parse_pdf(pdf_path):
//     results        = []
//     institute_name = ""
//     institute_code = ""

//     with pdfplumber.open(pdf_path) as pdf:
//         full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
//         m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
//         if m:
//             institute_name = clean(m.group(1))
//             institute_code = clean(m.group(2))

//         cur_placement_program = None
//         cur_placement_headers = None

//         # Cross-page state for split tables
//         last_fin_year_cols   = []   # year columns from last "Financial Year" header row
//         last_exp_section     = None # expenditure section name carried across page break
//         in_expenditure_cont  = False# True when we expect expenditure data on next page

//         for page in pdf.pages:
//             found_tables = page.find_tables()
//             raw_tables   = page.extract_tables()
//             prev_y       = 0

//             for ft, table in zip(found_tables, raw_tables):
//                 if not table: continue

//                 row0    = [clean(c) for c in table[0]]
//                 ncols   = len(row0)
//                 y_top   = ft.bbox[1]

//                 # 'between': text between bottom of prev table and top of this one.
//                 # Used for section headings — avoids bleeding from earlier sections on same page.
//                 between   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
//                 between_l = between.lower()
//                 # 'above': full text above this table on the page (used for PhD label only)
//                 above     = clean(page.crop((0, 0, page.width, y_top)).extract_text() or "")
//                 prev_y    = ft.bbox[3]

//                 # Track Financial Year columns for cross-page splits
//                 if row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1]):
//                     last_fin_year_cols = [c for c in row0[1:] if is_year(c)]

//                 # ── (A) SANCTIONED INTAKE ──────────────────────────────────
//                 if row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1]):
//                     in_expenditure_cont = False
//                     year_cols = [c for c in row0[1:] if c]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         prog = clean(r[0])
//                         for ci, yr in enumerate(year_cols):
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow("Sanctioned (Approved) Intake",
//                                                  prog, yr, "Intake", val or "-"))

//                 # ── (B) TOTAL ACTUAL STUDENT STRENGTH ─────────────────────
//                 elif any("No. of Male" in h for h in row0):
//                     in_expenditure_cont = False
//                     metrics = [clean(h) for h in row0[1:]]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         prog = clean(r[0])
//                         for ci, metric in enumerate(metrics):
//                             if not metric: continue
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Total Actual Student Strength (Program(s) Offered by your Institution)",
//                                 prog, "-", metric, val))

//                 # ── (C) PLACEMENT header ───────────────────────────────────
//                 elif (row0[0] == "Academic Year"
//                         and any("first year" in h.lower() for h in row0)):
//                     in_expenditure_cont = False
//                     pm = re.search(PROG_PATTERN, between, re.I)
//                     if pm:
//                         cur_placement_program = clean(pm.group(1))
//                     cur_placement_headers = [clean(h) for h in row0]
//                     results.extend(emit_placement_rows(
//                         cur_placement_headers, table[1:],
//                         cur_placement_program or "Unknown"))

//                 # ── (D) PLACEMENT continuation (rows split to next page) ───
//                 # row0 starts with a year value, second cell is a plain number
//                 elif (cur_placement_headers
//                         and ncols >= 7
//                         and is_year(row0[0])
//                         and row0[1] and not is_year(row0[1])
//                         and re.match(r'^\d+$', row0[1])):
//                     results.extend(emit_placement_rows(
//                         cur_placement_headers, table,
//                         cur_placement_program or "Unknown"))

//                 # ── (E) PhD ────────────────────────────────────────────────
//                 elif "ph.d" in clean(row0[0]).lower() or "doctoral" in clean(row0[0]).lower():
//                     in_expenditure_cont = False
//                     results.extend(emit_phd_rows(table, above))

//                 # ── (F) PCS FACILITIES ─────────────────────────────────────
//                 # Before SR/Consultancy/EDP — those headings bleed into 'above' on same page
//                 elif (ncols == 2 and any(
//                         any(kw in clean(r[0] or "").lower()
//                             for kw in ("lifts","ramps","wheelchair","toilet",
//                                        "physically challenged","handicap"))
//                         for r in table)):
//                     in_expenditure_cont = False
//                     for r in table:
//                         if not r or not r[0]: continue
//                         q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
//                         a = clean(r[1]) if len(r) > 1 else ""
//                         results.append(mkrow(
//                             "PCS Facilities: Facilities of Physically Challenged Students",
//                             "-", "-", q, a))

//                 # ── (G) FACULTY DETAILS ────────────────────────────────────
//                 elif ncols >= 2 and "faculty" in row0[0].lower():
//                     in_expenditure_cont = False
//                     for r in table:
//                         if not r or not r[0]: continue
//                         metric = clean(r[0])
//                         val    = clean(r[1]) if len(r) > 1 else ""
//                         if "faculty" in metric.lower() and val:
//                             results.append(mkrow("Faculty Details", "-", "-", metric, val))

//                 # ── (H) EXPENDITURE — full table (header + utilised subrow + data) ──
//                 elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
//                         and has_utilised_amount_subheader(table)):
//                     in_expenditure_cont = False
//                     year_cols = [c for c in row0[1:] if is_year(c)]
//                     section   = expenditure_section_name(between_l, table)
//                     last_exp_section = section
//                     results.extend(emit_expenditure_table(section, year_cols, table[2:]))

//                 # ── (I) EXPENDITURE — header-only row then data on next page ──
//                 # Detected when: "Financial Year" header with no data rows,
//                 # followed next page by a table starting with '' + 'Utilised Amount'.
//                 # We set a flag when we see the header-only table.
//                 elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
//                         and len(table) == 1):
//                     # Header-only expenditure table — data is on the next page
//                     section = expenditure_section_name(between_l, table)
//                     last_exp_section    = section
//                     in_expenditure_cont = True

//                 # ── (J) EXPENDITURE continuation — subheader + data rows ───
//                 # row0: ['', 'Utilised Amount', 'Utilised Amount', ...]
//                 # This is the page that continues from the header-only table above.
//                 elif (in_expenditure_cont
//                         and not row0[0]
//                         and any("utilised amount" in clean(c).lower() for c in row0[1:] if c)):
//                     in_expenditure_cont = False
//                     section = last_exp_section or expenditure_section_name(between_l, table)
//                     results.extend(emit_expenditure_table(section, last_fin_year_cols, table[1:]))

//                 # ── (K) SPONSORED RESEARCH ─────────────────────────────────
//                 # Use 'between' (not 'above') to avoid bleeding from earlier sections
//                 elif (table_contains(table, "sponsored projects")
//                         or "sponsored research" in between_l):
//                     in_expenditure_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Sponsored Research Details", "All Programs", yr_cols, data_rows))

//                 # ── (L) EXECUTIVE DEVELOPMENT PROGRAMS ────────────────────
//                 # Before Consultancy — both may share "Financial Year" header
//                 elif (table_contains(table, "executive development programs")
//                         or table_contains(table, "management development")
//                         or "executive development" in between_l):
//                     in_expenditure_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Executive Development Program/Management Development Programs",
//                         "All Programs", yr_cols, data_rows))

//                 # ── (M) CONSULTANCY PROJECT DETAILS ───────────────────────
//                 elif (table_contains(table, "consultancy projects")
//                         or "consultancy project" in between_l):
//                     in_expenditure_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Consultancy Project Details", "All Programs", yr_cols, data_rows))

//     return {
//         "institute_name": institute_name,
//         "institute_code": institute_code,
//         "rows": results,
//     }

// if __name__ == "__main__":
//     if len(sys.argv) < 2:
//         print(json.dumps({"error": "Usage: pdf_extract.py <path.pdf>"}))
//         sys.exit(1)
//     out = parse_pdf(sys.argv[1])
//     print(json.dumps(out, ensure_ascii=False))
// `;

// const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
// const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");
// if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
// fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

// async function runPythonExtractor(pdfPath: string): Promise<{
//   institute_name: string;
//   institute_code: string;
//   rows: { section: string; program: string; year: string; metric: string; value: string }[];
// }> {
//   for (const exe of ["python3", "python", "py"]) {
//     try {
//       const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
//         timeout: 60_000,
//         maxBuffer: 50 * 1024 * 1024,
//       });
//       return JSON.parse(stdout);
//     } catch { /* try next */ }
//   }
//   throw new Error("Python with pdfplumber not found. Install: pip install pdfplumber");
// }

// function csvCell(v: string | undefined | null): string {
//   const s = String(v ?? "");
//   return s.includes(",") || s.includes('"') || s.includes("\n")
//     ? `"${s.replace(/"/g, '""')}"` : s;
// }

// function toCsvLine(cells: (string | undefined | null)[]): string {
//   return cells.map(csvCell).join(",");
// }

// export function getCSVPath(baseFolder: string): string {
//   return path.join(baseFolder, "nirf-pdf-data.csv");
// }

// export function resetCSVFile(baseFolder: string): void {
//   const p = getCSVPath(baseFolder);
//   if (fs.existsSync(p)) fs.unlinkSync(p);
// }

// function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
//   if (!fs.existsSync(csvPath)) {
//     fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
//   }
//   if (rows.length === 0) return;
//   fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
// }

// export interface ExtractedData {
//   filename: string;
//   instituteName: string;
//   instituteCode: string;
//   rowsWritten: number;
//   error?: string;
// }

// export async function extractFromPdf(
//   filePath: string,
//   csvPath: string,
//   year: string,
//   category: string
// ): Promise<ExtractedData> {
//   const filename = path.basename(filePath);
//   try {
//     const result = await runPythonExtractor(filePath);
//     const csvRows = result.rows.map((r) => [
//       year, category,
//       result.institute_code, result.institute_name,
//       r.section, r.program, r.year, r.metric, r.value,
//     ]);
//     appendRows(csvPath, csvRows);
//     console.log(`[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows`);
//     return {
//       filename,
//       instituteName: result.institute_name,
//       instituteCode: result.institute_code,
//       rowsWritten: csvRows.length,
//     };
//   } catch (err) {
//     console.error(`[PDF] Error extracting ${filename}:`, err);
//     return { filename, instituteName: "", instituteCode: "", rowsWritten: 0, error: String(err) };
//   }
// }

































// import fs from "fs";
// import path from "path";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

// export const CSV_HEADER = [
//   "Ranking Year",
//   "Category",
//   "Institute Code",
//   "Institute Name",
//   "Section",
//   "Program",
//   "Year",
//   "Metric",
//   "Value",
// ];

// const PYTHON_SCRIPT = String.raw`
// import sys, json, re, pdfplumber

// def clean(s):
//     if s is None: return ""
//     return re.sub(r'\s+', ' ', str(s)).strip()

// def is_year(s):
//     return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

// def num_only(s):
//     s = clean(s)
//     m = re.match(r'^(\d[\d,]*)', s)
//     return m.group(1).replace(',', '') if m else s

// def words_only(s):
//     s = clean(s)
//     m = re.match(r'^\d[\d,]*\s*\((.+)\)\s*$', s)
//     return m.group(1).strip() if m else ""

// def mkrow(section, program, year, metric, value):
//     return {"section": section, "program": program,
//             "year": year, "metric": metric, "value": str(value)}

// def table_contains(table, keyword):
//     kw = keyword.lower()
//     for r in table:
//         for c in r:
//             if c and kw in clean(c).lower(): return True
//     return False

// def has_utilised_amount_subheader(table):
//     if len(table) < 2: return False
//     return any("utilised amount" in clean(c).lower() for c in table[1] if c)

// # ── placement ─────────────────────────────────────────────────────────────────

// PROG_PATTERN = r'((?:PG-Integrated|PG|UG)\s*\[[^\]]+\])\s*[:\-]?\s*[Pp]lacement'

// def year_context_label(year_val, metric_header):
//     h = metric_header.lower()
//     if "intake in the year" in h or "admitted in the year" in h:
//         return "{} (Intake Year)".format(year_val)
//     if "lateral entry" in h:
//         return "{} (Lateral entry year)".format(year_val)
//     return "{} (Graduation Year)".format(year_val)

// def emit_placement_rows(headers, data_rows, program):
//     results = []
//     yr_pos = [i for i, h in enumerate(headers) if clean(h) == "Academic Year"]
//     yr_owner = {}
//     for i, h in enumerate(headers):
//         if clean(h) == "Academic Year": continue
//         owned_by = [yp for yp in yr_pos if yp < i]
//         yr_owner[i] = max(owned_by) if owned_by else None
//     for row in data_rows:
//         cells = [clean(c) for c in row]
//         if not cells or not cells[0]: continue
//         for ci, metric in enumerate(headers):
//             metric = clean(metric)
//             if metric == "Academic Year": continue
//             if ci >= len(cells): continue
//             val = cells[ci]
//             if not val: continue
//             owner  = yr_owner.get(ci)
//             raw_yr = cells[owner] if (owner is not None and owner < len(cells)) else ""
//             yr_lbl = year_context_label(raw_yr, metric) if raw_yr else "-"
//             if "salary" in metric.lower() or "median" in metric.lower():
//                 val = num_only(val)
//             results.append(mkrow("Placement & Higher Studies", program, yr_lbl, metric, val))
//     return results

// # ── PhD ───────────────────────────────────────────────────────────────────────
// # pdfplumber gives the entire PhD section as ONE table (~7-8 rows):
// #   row0: ['Ph.D (Student pursuing doctoral program till 2020-21)', '', '', '']
// #   row1: ['', '', 'Total Students', '']
// #   row2: ['Full Time', '', '2355', '']
// #   row3: ['Part Time', '', '1179', '']
// #   row4: ['No. of Ph.D students graduated (including Integrated Ph.D)', '', '', '']
// #   row5: ['', '2020-21', '2019-20', '2018-19']
// #   row6: ['Full Time', '171', '299', '319']          <- sometimes last row splits to next page
// # Next page T0: ['Part Time', '210', '86', '61']      <- continuation row

// def emit_phd_rows(table, above):
//     results   = []
//     sec       = "Ph.D Student Details"
//     row0_text = " ".join(clean(c) for c in table[0] if c)
//     m = re.search(r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
//                   row0_text + " " + above, re.I)
//     phd_prog  = clean(m.group(1)) if m else row0_text or "Ph.D (Student pursuing doctoral program)"
//     grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
//     in_grad   = False
//     grad_yrs  = []
//     for r in table[1:]:
//         cells = [clean(c) for c in r]
//         first = cells[0] if cells else ""
//         if "graduated" in first.lower() or "integrated ph.d" in first.lower():
//             in_grad = True
//             continue
//         if in_grad and not first and any(is_year(c) for c in cells[1:] if c):
//             grad_yrs = [c for c in cells[1:] if is_year(c)]
//             continue
//         if in_grad and grad_yrs and first in ("Full Time", "Part Time"):
//             for ci, yr in enumerate(grad_yrs):
//                 val = cells[ci + 1] if ci + 1 < len(cells) else ""
//                 if val:
//                     results.append(mkrow(sec, grad_prog, yr, "{} Graduated".format(first), val))
//             continue
//         if first in ("Full Time", "Part Time"):
//             val = next((c for c in reversed(cells) if re.match(r'^\d+$', c or "")), None)
//             if val:
//                 results.append(mkrow(sec, phd_prog, "-",
//                                      "{} Students (Total Students)".format(first), val))
//     return results, grad_yrs  # return grad_yrs so caller can use for continuation

// # ── expenditure ───────────────────────────────────────────────────────────────

// def emit_expenditure_rows(section, line_item, year, raw_val):
//     results = []
//     num   = num_only(raw_val)
//     words = words_only(raw_val)
//     if num:   results.append(mkrow(section, line_item, year, "Utilised Amount", num))
//     if words: results.append(mkrow(section, line_item, year, "Utilised Amount (In Words)", words))
//     if not num and not words and raw_val:
//         results.append(mkrow(section, line_item, year, "Utilised Amount", raw_val))
//     return results

// def expenditure_section_name(between_l, table):
//     if "operational" in between_l or table_contains(table, "salaries"):
//         return "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years"
//     return "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years"

// def emit_expenditure_table(section, year_cols, rows):
//     results = []
//     for r in rows:
//         if not r or not r[0]: continue
//         lbl = clean(r[0])
//         if not lbl or lbl == "Utilised Amount" or lbl.lower().startswith("annual"): continue
//         for ci, yr in enumerate(year_cols):
//             raw_val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//             results.extend(emit_expenditure_rows(section, lbl, yr, raw_val))
//     return results

// # ── simple year-column tables (SR / Consultancy / EDP) ───────────────────────

// WORDS_HINTS = {"amount received in words", "total annual earnings in words", "in words"}

// # Keywords that identify data rows belonging to SR / Consultancy / EDP
// # Used to detect continuation tables that have no section heading
// SIMPLE_DATA_KEYS = [
//     "sponsored projects", "funding agencies",
//     "consultancy projects", "client organizations",
//     "executive development programs", "management development",
//     "total no. of participants", "annual earnings",
//     "amount received"
// ]

// def is_simple_data_row(text):
//     t = text.lower()
//     return any(k in t for k in SIMPLE_DATA_KEYS)

// def emit_simple_year_table(section, program, year_cols, data_rows):
//     results = []
//     for row in data_rows:
//         if not row or not row[0]: continue
//         metric = clean(row[0])
//         if not metric: continue
//         is_words = any(k in metric.lower() for k in WORDS_HINTS)
//         for ci, yr in enumerate(year_cols):
//             val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
//             if not val: continue
//             if is_words:
//                 results.append(mkrow(section, program, yr, metric, val))
//             else:
//                 n = num_only(val); w = words_only(val)
//                 if n: results.append(mkrow(section, program, yr, metric, n))
//                 if w: results.append(mkrow(section, program, yr, metric + " (In Words)", w))
//                 if not n and not w: results.append(mkrow(section, program, yr, metric, val))
//     return results

// # ── main parser ───────────────────────────────────────────────────────────────

// def parse_pdf(pdf_path):
//     results        = []
//     institute_name = ""
//     institute_code = ""

//     with pdfplumber.open(pdf_path) as pdf:
//         full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
//         m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
//         if m:
//             institute_name = clean(m.group(1))
//             institute_code = clean(m.group(2))

//         cur_placement_program = None
//         cur_placement_headers = None

//         # Cross-page state
//         last_fin_year_cols     = []    # year cols from last "Financial Year" header
//         last_exp_section       = None  # expenditure section name
//         in_exp_cont            = False # expecting expenditure data on next table
//         in_phd_grad            = False # inside PhD graduated section
//         last_phd_grad_years    = []    # year cols for PhD graduated (for continuation)
//         last_simple_section    = None  # last SR/Consultancy/EDP section name
//         last_simple_year_cols  = []    # year cols for that section
//         prev_page_last_prog    = None  # last placement heading seen in previous page's text

//         for page in pdf.pages:
//             found_tables = page.find_tables()
//             raw_tables   = page.extract_tables()
//             page_text    = clean(page.extract_text() or "")
//             prev_y       = 0

//             for ft, table in zip(found_tables, raw_tables):
//                 if not table: continue

//                 row0      = [clean(c) for c in table[0]]
//                 ncols     = len(row0)
//                 y_top     = ft.bbox[1]
//                 between   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
//                 between_l = between.lower()
//                 above     = clean(page.crop((0, 0, page.width, y_top)).extract_text() or "")
//                 prev_y    = ft.bbox[3]

//                 # Always track Financial Year columns
//                 if row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1]):
//                     last_fin_year_cols = [c for c in row0[1:] if is_year(c)]

//                 # ── (A) SANCTIONED INTAKE ──────────────────────────────────
//                 if row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1]):
//                     in_phd_grad = False; in_exp_cont = False
//                     year_cols = [c for c in row0[1:] if c]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         prog = clean(r[0])
//                         for ci, yr in enumerate(year_cols):
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow("Sanctioned (Approved) Intake",
//                                                  prog, yr, "Intake", val or "-"))

//                 # ── (B) TOTAL ACTUAL STUDENT STRENGTH ─────────────────────
//                 elif any("No. of Male" in h for h in row0):
//                     in_phd_grad = False; in_exp_cont = False
//                     metrics = [clean(h) for h in row0[1:]]
//                     for r in table[1:]:
//                         if not r or not r[0]: continue
//                         prog = clean(r[0])
//                         for ci, metric in enumerate(metrics):
//                             if not metric: continue
//                             val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
//                             results.append(mkrow(
//                                 "Total Actual Student Strength (Program(s) Offered by your Institution)",
//                                 prog, "-", metric, val))

//                 # ── (C) PLACEMENT header ───────────────────────────────────
//                 elif (row0[0] == "Academic Year"
//                         and any("first year" in h.lower() for h in row0)):
//                     in_phd_grad = False; in_exp_cont = False
//                     pm = re.search(PROG_PATTERN, between, re.I)
//                     if pm:
//                         cur_placement_program = clean(pm.group(1))
//                     elif not between.strip():
//                         # Table at top of page — heading was at bottom of previous page
//                         # Use the last program heading seen in previous page's text
//                         if prev_page_last_prog:
//                             cur_placement_program = prev_page_last_prog
//                     cur_placement_headers = [clean(h) for h in row0]
//                     results.extend(emit_placement_rows(
//                         cur_placement_headers, table[1:],
//                         cur_placement_program or "Unknown"))

//                 # ── (D) PLACEMENT data continuation ───────────────────────
//                 # Row starts with a year, second cell is a plain number
//                 elif (cur_placement_headers and ncols >= 7
//                         and is_year(row0[0])
//                         and row0[1] and not is_year(row0[1])
//                         and re.match(r'^\d+$', row0[1])):
//                     results.extend(emit_placement_rows(
//                         cur_placement_headers, table,
//                         cur_placement_program or "Unknown"))

//                 # ── (E) PhD main table ─────────────────────────────────────
//                 elif "ph.d" in clean(row0[0]).lower() or "doctoral" in clean(row0[0]).lower():
//                     in_exp_cont = False
//                     phd_rows, grad_yrs = emit_phd_rows(table, above)
//                     results.extend(phd_rows)
//                     if grad_yrs:
//                         last_phd_grad_years = grad_yrs
//                         in_phd_grad = True

//                 # ── (F) PhD graduated continuation (Part Time split to next page) ──
//                 # Row: ['Part Time', '210', '86', '61'] with between=''
//                 elif (in_phd_grad
//                         and row0[0] in ("Full Time", "Part Time")
//                         and ncols >= 2 and not is_year(row0[1])
//                         and re.match(r'^\d+$', row0[1] or "")):
//                     sec       = "Ph.D Student Details"
//                     grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
//                     cells = [clean(c) for c in table[0]]
//                     first = cells[0]
//                     for ci, yr in enumerate(last_phd_grad_years):
//                         val = cells[ci + 1] if ci + 1 < len(cells) else ""
//                         if val:
//                             results.append(mkrow(sec, grad_prog, yr,
//                                                  "{} Graduated".format(first), val))

//                 # ── (G) PCS FACILITIES ─────────────────────────────────────
//                 elif (ncols == 2 and any(
//                         any(kw in clean(r[0] or "").lower()
//                             for kw in ("lifts","ramps","wheelchair","toilet",
//                                        "physically challenged","handicap"))
//                         for r in table)):
//                     in_phd_grad = False; in_exp_cont = False
//                     for r in table:
//                         if not r or not r[0]: continue
//                         q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
//                         a = clean(r[1]) if len(r) > 1 else ""
//                         results.append(mkrow(
//                             "PCS Facilities: Facilities of Physically Challenged Students",
//                             "-", "-", q, a))

//                 # ── (H) FACULTY DETAILS ────────────────────────────────────
//                 elif ncols >= 2 and "faculty" in row0[0].lower():
//                     in_phd_grad = False; in_exp_cont = False
//                     for r in table:
//                         if not r or not r[0]: continue
//                         metric = clean(r[0])
//                         val    = clean(r[1]) if len(r) > 1 else ""
//                         if "faculty" in metric.lower() and val:
//                             results.append(mkrow("Faculty Details", "-", "-", metric, val))

//                 # ── (I) EXPENDITURE full table (header + utilised subrow + data) ──
//                 elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
//                         and has_utilised_amount_subheader(table)):
//                     in_phd_grad = False; in_exp_cont = False
//                     year_cols = [c for c in row0[1:] if is_year(c)]
//                     section   = expenditure_section_name(between_l, table)
//                     last_exp_section = section
//                     results.extend(emit_expenditure_table(section, year_cols, table[2:]))

//                 # ── (J) EXPENDITURE header-only (data on next page) ───────
//                 elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
//                         and len(table) == 1):
//                     in_phd_grad   = False
//                     in_exp_cont   = True
//                     last_exp_section = expenditure_section_name(between_l, table)

//                 # ── (K) EXPENDITURE continuation (subheader + data on new page) ─
//                 elif (in_exp_cont and not row0[0]
//                         and any("utilised amount" in clean(c).lower() for c in row0[1:] if c)):
//                     in_exp_cont = False
//                     section = last_exp_section or expenditure_section_name(between_l, table)
//                     results.extend(emit_expenditure_table(section, last_fin_year_cols, table[1:]))

//                 # ── (L) SPONSORED RESEARCH ────────────────────────────────
//                 elif (table_contains(table, "sponsored projects")
//                         or "sponsored research" in between_l):
//                     in_phd_grad = False; in_exp_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Sponsored Research Details", "All Programs", yr_cols, data_rows))
//                     last_simple_section   = "Sponsored Research Details"
//                     last_simple_year_cols = yr_cols

//                 # ── (M) EDP — before Consultancy ──────────────────────────
//                 elif (table_contains(table, "executive development programs")
//                         or table_contains(table, "management development")
//                         or "executive development" in between_l):
//                     in_phd_grad = False; in_exp_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Executive Development Program/Management Development Programs",
//                         "All Programs", yr_cols, data_rows))
//                     last_simple_section   = "Executive Development Program/Management Development Programs"
//                     last_simple_year_cols = yr_cols

//                 # ── (N) CONSULTANCY ────────────────────────────────────────
//                 elif (table_contains(table, "consultancy projects")
//                         or "consultancy project" in between_l):
//                     in_phd_grad = False; in_exp_cont = False
//                     yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
//                     data_rows = table[1:] if row0[0] == "Financial Year" else table
//                     results.extend(emit_simple_year_table(
//                         "Consultancy Project Details", "All Programs", yr_cols, data_rows))
//                     last_simple_section   = "Consultancy Project Details"
//                     last_simple_year_cols = yr_cols

//                 # ── (O) SIMPLE SECTION continuation (data rows split to next page) ─
//                 # e.g. "Total Amount Received" / "Amount Received in Words" rows
//                 # that appear at top of next page with between='' and no section heading
//                 elif (last_simple_section
//                         and not between.strip()
//                         and ncols >= 2
//                         and is_simple_data_row(row0[0])):
//                     results.extend(emit_simple_year_table(
//                         last_simple_section, "All Programs",
//                         last_simple_year_cols, table))

//             # After all tables on this page: record last placement heading
//             # (may be used by first table on next page when between='')
//             all_prog = list(re.finditer(PROG_PATTERN, page_text, re.I))
//             prev_page_last_prog = clean(all_prog[-1].group(1)) if all_prog else None

//     return {
//         "institute_name": institute_name,
//         "institute_code": institute_code,
//         "rows": results,
//     }

// if __name__ == "__main__":
//     if len(sys.argv) < 2:
//         print(json.dumps({"error": "Usage: pdf_extract.py <path.pdf>"}))
//         sys.exit(1)
//     out = parse_pdf(sys.argv[1])
//     print(json.dumps(out, ensure_ascii=False))
// `;

// const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
// const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");
// if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
// fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

// async function runPythonExtractor(pdfPath: string): Promise<{
//   institute_name: string;
//   institute_code: string;
//   rows: { section: string; program: string; year: string; metric: string; value: string }[];
// }> {
//   for (const exe of ["python3", "python", "py"]) {
//     try {
//       const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
//         timeout: 60_000,
//         maxBuffer: 50 * 1024 * 1024,
//       });
//       return JSON.parse(stdout);
//     } catch { /* try next */ }
//   }
//   throw new Error("Python with pdfplumber not found. Install: pip install pdfplumber");
// }

// function csvCell(v: string | undefined | null): string {
//   const s = String(v ?? "");
//   return s.includes(",") || s.includes('"') || s.includes("\n")
//     ? `"${s.replace(/"/g, '""')}"` : s;
// }

// function toCsvLine(cells: (string | undefined | null)[]): string {
//   return cells.map(csvCell).join(",");
// }

// export function getCSVPath(baseFolder: string): string {
//   return path.join(baseFolder, "nirf-pdf-data.csv");
// }

// export function resetCSVFile(baseFolder: string): void {
//   const p = getCSVPath(baseFolder);
//   if (fs.existsSync(p)) fs.unlinkSync(p);
// }

// function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
//   if (!fs.existsSync(csvPath)) {
//     fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
//   }
//   if (rows.length === 0) return;
//   fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
// }

// export interface ExtractedData {
//   filename: string;
//   instituteName: string;
//   instituteCode: string;
//   rowsWritten: number;
//   error?: string;
// }

// export async function extractFromPdf(
//   filePath: string,
//   csvPath: string,
//   year: string,
//   category: string
// ): Promise<ExtractedData> {
//   const filename = path.basename(filePath);
//   try {
//     const result = await runPythonExtractor(filePath);
//     const csvRows = result.rows.map((r) => [
//       year, category,
//       result.institute_code, result.institute_name,
//       r.section, r.program, r.year, r.metric, r.value,
//     ]);
//     appendRows(csvPath, csvRows);
//     console.log(`[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows`);
//     return {
//       filename,
//       instituteName: result.institute_name,
//       instituteCode: result.institute_code,
//       rowsWritten: csvRows.length,
//     };
//   } catch (err) {
//     console.error(`[PDF] Error extracting ${filename}:`, err);
//     return { filename, instituteName: "", instituteCode: "", rowsWritten: 0, error: String(err) };
//   }
// }

































import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const CSV_HEADER = [
  "Ranking Year",
  "Category",
  "Institute Code",
  "Institute Name",
  "Section",
  "Program",
  "Year",
  "Metric",
  "Value",
];

const PYTHON_SCRIPT = String.raw`
import sys, json, re, pdfplumber

def clean(s):
    if s is None: return ""
    return re.sub(r'\s+', ' ', str(s)).strip()

def is_year(s):
    return bool(re.match(r'^\d{4}-\d{2,4}$', clean(s or "")))

def num_only(s):
    s = clean(s)
    m = re.match(r'^(\d[\d,]*)', s)
    return m.group(1).replace(',', '') if m else s

def words_only(s):
    s = clean(s)
    m = re.match(r'^\d[\d,]*\s*\((.+)\)\s*$', s)
    return m.group(1).strip() if m else ""

def mkrow(section, program, year, metric, value):
    return {"section": section, "program": program,
            "year": year, "metric": metric, "value": str(value)}

def table_contains(table, keyword):
    kw = keyword.lower()
    for r in table:
        for c in r:
            if c and kw in clean(c).lower(): return True
    return False

def has_utilised_amount_subheader(table):
    if len(table) < 2: return False
    return any("utilised amount" in clean(c).lower() for c in table[1] if c)

# ── placement ─────────────────────────────────────────────────────────────────

PROG_PATTERN = r'((?:PG-Integrated|PG|UG)\s*\[[^\]]+\])\s*[:\-]?\s*[Pp]lacement'

def year_context_label(year_val, metric_header):
    h = metric_header.lower()
    if "intake in the year" in h or "admitted in the year" in h:
        return "{} (Intake Year)".format(year_val)
    if "lateral entry" in h:
        return "{} (Lateral entry year)".format(year_val)
    return "{} (Graduation Year)".format(year_val)

def emit_placement_rows(headers, data_rows, program):
    results = []
    yr_pos = [i for i, h in enumerate(headers) if clean(h) == "Academic Year"]
    yr_owner = {}
    for i, h in enumerate(headers):
        if clean(h) == "Academic Year": continue
        owned_by = [yp for yp in yr_pos if yp < i]
        yr_owner[i] = max(owned_by) if owned_by else None
    for row in data_rows:
        cells = [clean(c) for c in row]
        if not cells or not cells[0]: continue
        for ci, metric in enumerate(headers):
            metric = clean(metric)
            if metric == "Academic Year": continue
            if ci >= len(cells): continue
            val = cells[ci]
            if not val: continue
            owner  = yr_owner.get(ci)
            raw_yr = cells[owner] if (owner is not None and owner < len(cells)) else ""
            yr_lbl = year_context_label(raw_yr, metric) if raw_yr else "-"
            if "salary" in metric.lower() or "median" in metric.lower():
                val = num_only(val)
            results.append(mkrow("Placement & Higher Studies", program, yr_lbl, metric, val))
    return results

# ── PhD ───────────────────────────────────────────────────────────────────────
# pdfplumber gives the entire PhD section as ONE table (~7-8 rows):
#   row0: ['Ph.D (Student pursuing doctoral program till 2020-21)', '', '', '']
#   row1: ['', '', 'Total Students', '']
#   row2: ['Full Time', '', '2355', '']
#   row3: ['Part Time', '', '1179', '']
#   row4: ['No. of Ph.D students graduated (including Integrated Ph.D)', '', '', '']
#   row5: ['', '2020-21', '2019-20', '2018-19']
#   row6: ['Full Time', '171', '299', '319']          <- sometimes last row splits to next page
# Next page T0: ['Part Time', '210', '86', '61']      <- continuation row

def emit_phd_rows(table, above):
    results   = []
    sec       = "Ph.D Student Details"
    row0_text = " ".join(clean(c) for c in table[0] if c)
    m = re.search(r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
                  row0_text + " " + above, re.I)
    phd_prog  = clean(m.group(1)) if m else row0_text or "Ph.D (Student pursuing doctoral program)"
    grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
    in_grad   = False
    grad_yrs  = []
    for r in table[1:]:
        cells = [clean(c) for c in r]
        first = cells[0] if cells else ""
        if "graduated" in first.lower() or "integrated ph.d" in first.lower():
            in_grad = True
            continue
        if in_grad and not first and any(is_year(c) for c in cells[1:] if c):
            grad_yrs = [c for c in cells[1:] if is_year(c)]
            continue
        if in_grad and grad_yrs and first in ("Full Time", "Part Time"):
            for ci, yr in enumerate(grad_yrs):
                val = cells[ci + 1] if ci + 1 < len(cells) else ""
                if val:
                    results.append(mkrow(sec, grad_prog, yr, "{} Graduated".format(first), val))
            continue
        if first in ("Full Time", "Part Time"):
            val = next((c for c in reversed(cells) if re.match(r'^\d+$', c or "")), None)
            if val:
                results.append(mkrow(sec, phd_prog, "-",
                                     "{} Students (Total Students)".format(first), val))
    return results, grad_yrs  # return grad_yrs so caller can use for continuation

# ── expenditure ───────────────────────────────────────────────────────────────

def emit_expenditure_rows(section, line_item, year, raw_val):
    results = []
    num   = num_only(raw_val)
    words = words_only(raw_val)
    if num:   results.append(mkrow(section, line_item, year, "Utilised Amount", num))
    if words: results.append(mkrow(section, line_item, year, "Utilised Amount (In Words)", words))
    if not num and not words and raw_val:
        results.append(mkrow(section, line_item, year, "Utilised Amount", raw_val))
    return results

def expenditure_section_name(between_l, table):
    if "operational" in between_l or table_contains(table, "salaries"):
        return "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years"
    return "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years"

def emit_expenditure_table(section, year_cols, rows):
    results = []
    for r in rows:
        if not r or not r[0]: continue
        lbl = clean(r[0])
        if not lbl or lbl == "Utilised Amount" or lbl.lower().startswith("annual"): continue
        for ci, yr in enumerate(year_cols):
            raw_val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
            results.extend(emit_expenditure_rows(section, lbl, yr, raw_val))
    return results

# ── simple year-column tables (SR / Consultancy / EDP) ───────────────────────

WORDS_HINTS = {"amount received in words", "total annual earnings in words", "in words"}

# Keywords that identify data rows belonging to SR / Consultancy / EDP
# Used to detect continuation tables that have no section heading
SIMPLE_DATA_KEYS = [
    "sponsored projects", "funding agencies",
    "consultancy projects", "client organizations",
    "executive development programs", "management development",
    "total no. of participants", "annual earnings",
    "amount received"
]

def is_simple_data_row(text):
    t = text.lower()
    return any(k in t for k in SIMPLE_DATA_KEYS)

def emit_simple_year_table(section, program, year_cols, data_rows):
    results = []
    for row in data_rows:
        if not row or not row[0]: continue
        metric = clean(row[0])
        if not metric: continue
        is_words = any(k in metric.lower() for k in WORDS_HINTS)
        for ci, yr in enumerate(year_cols):
            val = clean(row[ci + 1]) if ci + 1 < len(row) else ""
            if not val: continue
            if is_words:
                results.append(mkrow(section, program, yr, metric, val))
            else:
                n = num_only(val); w = words_only(val)
                if n: results.append(mkrow(section, program, yr, metric, n))
                if w: results.append(mkrow(section, program, yr, metric + " (In Words)", w))
                if not n and not w: results.append(mkrow(section, program, yr, metric, val))
    return results

# ── main parser ───────────────────────────────────────────────────────────────

def parse_pdf(pdf_path):
    results        = []
    institute_name = ""
    institute_code = ""

    with pdfplumber.open(pdf_path) as pdf:
        full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
        if m:
            institute_name = clean(m.group(1))
            institute_code = clean(m.group(2))

        cur_placement_program = None
        cur_placement_headers = None

        # Cross-page state
        last_fin_year_cols     = []    # year cols from last "Financial Year" header
        last_exp_section       = None  # expenditure section name
        in_exp_cont            = False # expecting expenditure data on next table
        in_phd_grad            = False # inside PhD graduated section
        last_phd_grad_years    = []    # year cols for PhD graduated (for continuation)
        last_simple_section    = None  # last SR/Consultancy/EDP section name
        last_simple_year_cols  = []    # year cols for that section
        prev_page_last_prog    = None  # last placement heading seen in previous page's text

        for page in pdf.pages:
            found_tables = page.find_tables()
            raw_tables   = page.extract_tables()
            page_text    = clean(page.extract_text() or "")
            prev_y       = 0

            for ft, table in zip(found_tables, raw_tables):
                if not table: continue

                row0      = [clean(c) for c in table[0]]
                ncols     = len(row0)
                y_top     = ft.bbox[1]
                between   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
                between_l = between.lower()
                above     = clean(page.crop((0, 0, page.width, y_top)).extract_text() or "")
                prev_y    = ft.bbox[3]

                # Always track Financial Year columns
                if row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1]):
                    last_fin_year_cols = [c for c in row0[1:] if is_year(c)]

                # ── (A) SANCTIONED INTAKE ──────────────────────────────────
                if row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1]):
                    in_phd_grad = False; in_exp_cont = False
                    year_cols = [c for c in row0[1:] if c]
                    for r in table[1:]:
                        if not r or not r[0]: continue
                        prog = clean(r[0])
                        for ci, yr in enumerate(year_cols):
                            val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
                            results.append(mkrow("Sanctioned (Approved) Intake",
                                                 prog, yr, "Intake", val or "-"))

                # ── (B) TOTAL ACTUAL STUDENT STRENGTH ─────────────────────
                elif any("No. of Male" in h for h in row0):
                    in_phd_grad = False; in_exp_cont = False
                    metrics = [clean(h) for h in row0[1:]]
                    for r in table[1:]:
                        if not r or not r[0]: continue
                        prog = clean(r[0])
                        for ci, metric in enumerate(metrics):
                            if not metric: continue
                            val = clean(r[ci + 1]) if ci + 1 < len(r) else ""
                            results.append(mkrow(
                                "Total Actual Student Strength (Program(s) Offered by your Institution)",
                                prog, "-", metric, val))

                # ── (C) PLACEMENT header ───────────────────────────────────
                elif (row0[0] == "Academic Year"
                        and any("first year" in h.lower() for h in row0)):
                    in_phd_grad = False; in_exp_cont = False
                    pm = re.search(PROG_PATTERN, between, re.I)
                    if pm:
                        cur_placement_program = clean(pm.group(1))
                    elif not between.strip():
                        # Table at top of page — heading was at bottom of previous page
                        # Use the last program heading seen in previous page's text
                        if prev_page_last_prog:
                            cur_placement_program = prev_page_last_prog
                    cur_placement_headers = [clean(h) for h in row0]
                    results.extend(emit_placement_rows(
                        cur_placement_headers, table[1:],
                        cur_placement_program or "Unknown"))

                # ── (D) PLACEMENT data continuation ───────────────────────
                # Row starts with a year, second cell is a plain number
                elif (cur_placement_headers and ncols >= 7
                        and is_year(row0[0])
                        and row0[1] and not is_year(row0[1])
                        and re.match(r'^\d+$', row0[1])):
                    results.extend(emit_placement_rows(
                        cur_placement_headers, table,
                        cur_placement_program or "Unknown"))

                # ── (E) PhD main table ─────────────────────────────────────
                elif "ph.d" in clean(row0[0]).lower() or "doctoral" in clean(row0[0]).lower():
                    in_exp_cont = False
                    phd_rows, grad_yrs = emit_phd_rows(table, above)
                    results.extend(phd_rows)
                    if grad_yrs:
                        last_phd_grad_years = grad_yrs
                        in_phd_grad = True

                # ── (F) PhD graduated continuation (Part Time split to next page) ──
                # Row: ['Part Time', '210', '86', '61'] with between=''
                elif (in_phd_grad
                        and row0[0] in ("Full Time", "Part Time")
                        and ncols >= 2 and not is_year(row0[1])
                        and re.match(r'^\d+$', row0[1] or "")):
                    sec       = "Ph.D Student Details"
                    grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
                    cells = [clean(c) for c in table[0]]
                    first = cells[0]
                    for ci, yr in enumerate(last_phd_grad_years):
                        val = cells[ci + 1] if ci + 1 < len(cells) else ""
                        if val:
                            results.append(mkrow(sec, grad_prog, yr,
                                                 "{} Graduated".format(first), val))

                # ── (G) PCS FACILITIES ─────────────────────────────────────
                elif (ncols == 2 and any(
                        any(kw in clean(r[0] or "").lower()
                            for kw in ("lifts","ramps","wheelchair","toilet",
                                       "physically challenged","handicap"))
                        for r in table)):
                    in_phd_grad = False; in_exp_cont = False
                    for r in table:
                        if not r or not r[0]: continue
                        q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
                        a = clean(r[1]) if len(r) > 1 else ""
                        results.append(mkrow(
                            "PCS Facilities: Facilities of Physically Challenged Students",
                            "-", "-", q, a))

                # ── (H) FACULTY DETAILS ────────────────────────────────────
                elif ncols >= 2 and "faculty" in row0[0].lower():
                    in_phd_grad = False; in_exp_cont = False
                    for r in table:
                        if not r or not r[0]: continue
                        metric = clean(r[0])
                        val    = clean(r[1]) if len(r) > 1 else ""
                        if "faculty" in metric.lower() and val:
                            results.append(mkrow("Faculty Details", "-", "-", metric, val))

                # ── (I) EXPENDITURE full table (header + utilised subrow + data) ──
                elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
                        and has_utilised_amount_subheader(table)):
                    in_phd_grad = False
                    year_cols = [c for c in row0[1:] if is_year(c)]
                    section   = expenditure_section_name(between_l, table)
                    last_exp_section = section
                    in_exp_cont = True   # more line items may continue on next page
                    results.extend(emit_expenditure_table(section, year_cols, table[2:]))

                # ── (J) EXPENDITURE header-only (data on next page) ───────
                elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
                        and len(table) == 1):
                    in_phd_grad   = False
                    in_exp_cont   = True
                    last_exp_section = expenditure_section_name(between_l, table)

                # ── (K) EXPENDITURE continuation — subheader+data on new page ──
                elif (in_exp_cont and not row0[0]
                        and any("utilised amount" in clean(c).lower() for c in row0[1:] if c)):
                    in_exp_cont = False
                    section = last_exp_section or expenditure_section_name(between_l, table)
                    results.extend(emit_expenditure_table(section, last_fin_year_cols, table[1:]))

                # ── (K2) EXPENDITURE continuation — line items overflow to next page ──
                # Guard: must not be an SR/Consultancy/EDP table sneaking in with between=''
                elif (in_exp_cont
                        and not between.strip()
                        and row0[0] and row0[0] != "Financial Year"
                        and not is_year(row0[0])
                        and len(row0) > 1 and re.match(r'^\d', (row0[1] or "").strip())
                        and not table_contains(table, "sponsored projects")
                        and not table_contains(table, "consultancy projects")
                        and not table_contains(table, "executive development programs")
                        and not table_contains(table, "management development")):
                    section = last_exp_section or expenditure_section_name(between_l, table)
                    results.extend(emit_expenditure_table(section, last_fin_year_cols, table))

                # ── (L) SPONSORED RESEARCH ────────────────────────────────
                elif (table_contains(table, "sponsored projects")
                        or "sponsored research" in between_l):
                    in_phd_grad = False; in_exp_cont = False
                    yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
                    data_rows = table[1:] if row0[0] == "Financial Year" else table
                    results.extend(emit_simple_year_table(
                        "Sponsored Research Details", "All Programs", yr_cols, data_rows))
                    last_simple_section   = "Sponsored Research Details"
                    last_simple_year_cols = yr_cols

                # ── (M) EDP — before Consultancy ──────────────────────────
                elif (table_contains(table, "executive development programs")
                        or table_contains(table, "management development")
                        or "executive development" in between_l):
                    in_phd_grad = False; in_exp_cont = False
                    yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
                    data_rows = table[1:] if row0[0] == "Financial Year" else table
                    results.extend(emit_simple_year_table(
                        "Executive Development Program/Management Development Programs",
                        "All Programs", yr_cols, data_rows))
                    last_simple_section   = "Executive Development Program/Management Development Programs"
                    last_simple_year_cols = yr_cols

                # ── (N) CONSULTANCY ────────────────────────────────────────
                elif (table_contains(table, "consultancy projects")
                        or "consultancy project" in between_l):
                    in_phd_grad = False; in_exp_cont = False
                    yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
                    data_rows = table[1:] if row0[0] == "Financial Year" else table
                    results.extend(emit_simple_year_table(
                        "Consultancy Project Details", "All Programs", yr_cols, data_rows))
                    last_simple_section   = "Consultancy Project Details"
                    last_simple_year_cols = yr_cols

                # ── (O) SIMPLE SECTION continuation (data rows split to next page) ─
                # e.g. "Total Amount Received" / "Amount Received in Words" rows
                # that appear at top of next page with between='' and no section heading
                elif (last_simple_section
                        and not between.strip()
                        and ncols >= 2
                        and is_simple_data_row(row0[0])):
                    results.extend(emit_simple_year_table(
                        last_simple_section, "All Programs",
                        last_simple_year_cols, table))

            # After all tables on this page: record last placement heading
            # (may be used by first table on next page when between='')
            all_prog = list(re.finditer(PROG_PATTERN, page_text, re.I))
            prev_page_last_prog = clean(all_prog[-1].group(1)) if all_prog else None

    return {
        "institute_name": institute_name,
        "institute_code": institute_code,
        "rows": results,
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: pdf_extract.py <path.pdf>"}))
        sys.exit(1)
    out = parse_pdf(sys.argv[1])
    print(json.dumps(out, ensure_ascii=False))
`;

const SCRIPT_DIR  = path.join(process.cwd(), "scripts");
const SCRIPT_PATH = path.join(SCRIPT_DIR, "pdf_extract.py");
if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
fs.writeFileSync(SCRIPT_PATH, PYTHON_SCRIPT, "utf8");

async function runPythonExtractor(pdfPath: string): Promise<{
  institute_name: string;
  institute_code: string;
  rows: { section: string; program: string; year: string; metric: string; value: string }[];
}> {
  for (const exe of ["python3", "python", "py"]) {
    try {
      const { stdout } = await execFileAsync(exe, [SCRIPT_PATH, pdfPath], {
        timeout: 60_000,
        maxBuffer: 50 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch { /* try next */ }
  }
  throw new Error("Python with pdfplumber not found. Install: pip install pdfplumber");
}

function csvCell(v: string | undefined | null): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvLine(cells: (string | undefined | null)[]): string {
  return cells.map(csvCell).join(",");
}

export function getCSVPath(baseFolder: string): string {
  return path.join(baseFolder, "nirf-pdf-data.csv");
}

export function resetCSVFile(baseFolder: string): void {
  const p = getCSVPath(baseFolder);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function appendRows(csvPath: string, rows: (string | null | undefined)[][]): void {
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, toCsvLine(CSV_HEADER) + "\n", "utf8");
  }
  if (rows.length === 0) return;
  fs.appendFileSync(csvPath, rows.map(toCsvLine).join("\n") + "\n", "utf8");
}

export interface ExtractedData {
  filename: string;
  instituteName: string;
  instituteCode: string;
  rowsWritten: number;
  error?: string;
}

export async function extractFromPdf(
  filePath: string,
  csvPath: string,
  year: string,
  category: string
): Promise<ExtractedData> {
  const filename = path.basename(filePath);
  try {
    const result = await runPythonExtractor(filePath);
    const csvRows = result.rows.map((r) => [
      year, category,
      result.institute_code, result.institute_name,
      r.section, r.program, r.year, r.metric, r.value,
    ]);
    appendRows(csvPath, csvRows);
    console.log(`[PDF] ${result.institute_code} | ${result.institute_name} | ${csvRows.length} rows`);
    return {
      filename,
      instituteName: result.institute_name,
      instituteCode: result.institute_code,
      rowsWritten: csvRows.length,
    };
  } catch (err) {
    console.error(`[PDF] Error extracting ${filename}:`, err);
    return { filename, instituteName: "", instituteCode: "", rowsWritten: 0, error: String(err) };
  }
}