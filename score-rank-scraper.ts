// import puppeteer, { Browser, Page } from "puppeteer";
// import fs from "fs";
// import path from "path";

// /* ─── Types ───────────────────────────────────────────────── */

// export type ScrapeStatus = "pending" | "scraping" | "done" | "failed";

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface ScrapeState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
// }

// export interface InstituteRow {
//   instituteCode: string;
//   instituteName: string;
//   score: string;
//   rank: string;
//   category: string;
//   year: string;
// }

// export const scrapeState: ScrapeState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
// };

// /* ─── URL helpers ─────────────────────────────────────────── */

// function getRankingIndexUrl(year: string): string {
//   const customUrls: Record<string, string> = {
//     "2016": "https://www.nirfindia.org/Rankings/2016/Ranking2016.html",
//     "2017": "https://www.nirfindia.org/Rankings/2017/Ranking2017.html",
//     "2018": "https://www.nirfindia.org/Rankings/2018/Ranking2018.html",
//     "2019": "https://www.nirfindia.org/Rankings/2019/Ranking2019.html",
//     "2020": "https://www.nirfindia.org/Rankings/2020/Ranking2020.html",
//   };
//   return (
//     customUrls[year] ??
//     `https://www.nirfindia.org/Rankings/${year}/Ranking.html`
//   );
// }

// function slugify(label: string): string {
//   return (
//     label
//       .toLowerCase()
//       .replace(/ranking/gi, "")
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "")
//       .trim() || "misc"
//   );
// }

// /* ─── CSV helpers ─────────────────────────────────────────── */

// const CSV_HEADER = "Institute Code,Institute Name,Score,Rank,Category,Year\n";

// function escapeCSV(value: string): string {
//   // Wrap in quotes if the value contains commas, quotes, or newlines
//   if (value.includes(",") || value.includes('"') || value.includes("\n")) {
//     return `"${value.replace(/"/g, '""')}"`;
//   }
//   return value;
// }

// function rowToCSV(row: InstituteRow): string {
//   return [
//     escapeCSV(row.instituteCode),
//     escapeCSV(row.instituteName),
//     escapeCSV(row.score),
//     escapeCSV(row.rank),
//     escapeCSV(row.category),
//     escapeCSV(row.year),
//   ].join(",") + "\n";
// }

// function initCSV(csvPath: string): void {
//   fs.writeFileSync(csvPath, CSV_HEADER, "utf8");
// }

// function appendRowsToCSV(csvPath: string, rows: InstituteRow[]): void {
//   const lines = rows.map(rowToCSV).join("");
//   fs.appendFileSync(csvPath, lines, "utf8");
// }

// /* ─── Category discovery — same logic as working version ─── */

// interface CategoryLink {
//   label: string;
//   slug: string;
//   url: string;
// }

// async function discoverCategories(
//   browser: Browser,
//   year: string
// ): Promise<CategoryLink[]> {
//   const indexUrl = getRankingIndexUrl(year);
//   const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const links = await page.evaluate(() => {
//       const results: { label: string; href: string }[] = [];
//       const seen = new Set<string>();

//       document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
//         const href = a.getAttribute("href")?.trim() ?? "";
//         if (!href || !href.endsWith(".html") || seen.has(href)) return;

//         const fileName = href.split("/").pop() ?? "";
//         const raw = fileName.replace(".html", "").toLowerCase();

//         const map: Record<string, string> = {
//           univ:                "University",
//           universityranking:   "University",
//           engg:                "Engineering",
//           engineeringranking:  "Engineering",
//           mgmt:                "Management",
//           managementranking:   "Management",
//           pharma:              "Pharmacy",
//           pharmaranking:       "Pharmacy",
//           pharmacyranking:     "Pharmacy",
//           overall:             "Overall",
//           overallranking:      "Overall",
//           college:             "College",
//           collegeranking:      "College",
//           medical:             "Medical",
//           medicalranking:      "Medical",
//           law:                 "Law",
//           lawranking:          "Law",
//           arch:                "Architecture",
//           archranking:         "Architecture",
//           architectureranking: "Architecture",
//           dental:              "Dental",
//           dentalranking:       "Dental",
//           research:            "Research",
//           researchranking:     "Research",
//           innovation:          "Innovation",
//           innovationranking:   "Innovation",
//           agriculture:         "Agriculture",
//           agricultureranking:  "Agriculture",
//           stateuniranking:     "State University",
//           openuniversity:      "Open University",
//           openuniranking:      "Open University",
//           skilluniversity:     "Skill University",
//           skilluniranking:     "Skill University",
//         };

//         const label = map[raw] ?? raw;
//         seen.add(href);
//         results.push({ label, href });
//       });

//       return results;
//     });

//     return links.map(({ label, href }) => {
//       const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Scrape institute rows from the currently visible DataTable page ──────── */

// /**
//  * Reads every visible <tr> in the DataTable and extracts:
//  *   col 0  → Institute Code  (must start with "IR-")
//  *   col 1  → Institute Name  (first text node only — skips "More Details" links)
//  *   Score  → <td class="dt-type-numeric sorting_1"> (the currently sorted col)
//  *   Rank   → last <td class="dt-type-numeric"> in the row
//  *
//  * Using CSS classes instead of fixed indices makes this robust against
//  * NIRF adding/removing columns in future years.
//  */
// async function scrapeRowsFromCurrentPage(
//   page: Page,
//   categoryLabel: string,
//   year: string
// ): Promise<InstituteRow[]> {
//   return page.evaluate(
//     (category, yr) => {
//       const rows: {
//         instituteCode: string;
//         instituteName: string;
//         score: string;
//         rank: string;
//         category: string;
//         year: string;
//       }[] = [];

//       // Target the DataTables tbody — works for both #tbl_id and generic DataTable
//       const tbodies = document.querySelectorAll("table tbody");

//       tbodies.forEach((tbody) => {
//         tbody.querySelectorAll("tr").forEach((tr) => {
//           const tds = Array.from(tr.querySelectorAll("td"));
//           if (tds.length < 3) return;

//           // col 0: Institute Code
//           const instituteCode = (tds[0].textContent ?? "").trim();
//           if (!instituteCode || !instituteCode.startsWith("IR-")) return;

//           // col 1: Name — grab ONLY the first text node to skip "More Details" links
//           const nameCell = tds[1];
//           let instituteName = "";
//           for (const node of Array.from(nameCell.childNodes)) {
//             if (node.nodeType === Node.TEXT_NODE) {
//               const t = (node.textContent ?? "").trim();
//               if (t) { instituteName = t; break; }
//             }
//           }
//           if (!instituteName) {
//             instituteName = (nameCell.textContent ?? "")
//               .replace(/More\s+Details.*/gi, "")
//               .trim();
//           }

//           // Handle "Rank Withdrawn" rows — identified by the tr class.
//           // These rows have: <td colspan="2">Rank Withdrawn*</td> (merges Score+Rank)
//           // and a hidden <td style="display:none" class="dt-type-numeric">18</td> for rank.
//           const isRankWithdrawn = tr.classList.contains("rank-withdrawn-row");

//           if (isRankWithdrawn) {
//             const hiddenTd = tds.find(
//               (td) =>
//                 td.getAttribute("style")?.includes("display:none") &&
//                 td.classList.contains("dt-type-numeric")
//             );
//             const rank = hiddenTd ? (hiddenTd.textContent ?? "").trim() : "";
//             rows.push({ instituteCode, instituteName, score: "Rank Withdrawn*", rank, category, year: yr });
//             return;
//           }

//           // Normal rows: Score = second-to-last visible numeric td, Rank = last visible numeric td.
//           // Exclude hidden tds (display:none) used only for DataTables sorting internals.
//           let score = "";
//           let rank  = "";

//           const numericTds = tds.filter(
//             (td) =>
//               td.classList.contains("dt-type-numeric") &&
//               !td.getAttribute("style")?.includes("display:none")
//           );

//           if (numericTds.length >= 2) {
//             score = (numericTds[numericTds.length - 2].textContent ?? "").trim();
//             rank  = (numericTds[numericTds.length - 1].textContent ?? "").trim();
//           } else if (numericTds.length === 1) {
//             rank  = (numericTds[0].textContent ?? "").trim();
//           } else {
//             score = (tds[tds.length - 2]?.textContent ?? "").trim();
//             rank  = (tds[tds.length - 1]?.textContent ?? "").trim();
//           }

//           if (!score && !rank) return;

//           rows.push({ instituteCode, instituteName, score, rank, category, year: yr });
//         });
//       });

//       return rows;
//     },
//     categoryLabel,
//     year
//   );
// }

// /* ─── Paginate through ALL DataTable pages, collect rows ─────────────────── */

// async function scrapeAllRowsFromDataTable(
//   page: Page,
//   categoryLabel: string,
//   year: string,
//   pageLabel: string
// ): Promise<InstituteRow[]> {
//   const allRows: InstituteRow[] = [];
//   const seenCodes = new Set<string>();
//   let pageNum = 1;

//   while (true) {
//     const rows = await scrapeRowsFromCurrentPage(page, categoryLabel, year);

//     // Detect if DataTable re-rendered by checking if first institute code is new
//     const firstCode = rows[0]?.instituteCode ?? "";
//     if (pageNum > 1 && firstCode && seenCodes.has(firstCode)) {
//       console.warn(`    [warn] Page ${pageNum} returned same data as a previous page — stopping.`);
//       break;
//     }

//     let newRows = 0;
//     for (const row of rows) {
//       if (!seenCodes.has(row.instituteCode)) {
//         seenCodes.add(row.instituteCode);
//         allRows.push(row);
//         newRows++;
//       }
//     }

//     console.log(
//       `    [dt-page ${pageNum}] +${newRows} new rows (total: ${allRows.length})`
//     );

//     // Check if Next button is disabled / absent
//     const nextDisabled: boolean = await page.evaluate(() => {
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       if (!btn) return true;
//       return (
//         btn.disabled ||
//         btn.getAttribute("aria-disabled") === "true" ||
//         btn.classList.contains("disabled")
//       );
//     });

//     if (nextDisabled) break;

//     // Get first row's text BEFORE clicking, so we can detect when table re-renders
//     const firstRowTextBefore: string = await page.evaluate(() => {
//       const firstTr = document.querySelector("table tbody tr");
//       return firstTr?.textContent?.trim() ?? "";
//     });

//     // Click Next
//     await page.evaluate(() => {
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       btn?.click();
//     });

//     // Wait until the first row's content actually changes (table re-rendered)
//     // with a max wait of 5 seconds
//     const maxWait = 5000;
//     const interval = 100;
//     let waited = 0;
//     while (waited < maxWait) {
//       await new Promise((r) => setTimeout(r, interval));
//       waited += interval;
//       const firstRowTextAfter: string = await page.evaluate(() => {
//         const firstTr = document.querySelector("table tbody tr");
//         return firstTr?.textContent?.trim() ?? "";
//       });
//       if (firstRowTextAfter !== firstRowTextBefore) break;
//     }

//     pageNum++;

//     if (pageNum > 50) {
//       console.warn(`    [warn] 50-page safety limit reached for "${pageLabel}"`);
//       break;
//     }
//   }

//   return allRows;
// }

// /* ─── Scrape one full category: paginate through DataTable only ─────────────
//  *
//  * NOTE: We do NOT follow rank-band sub-pages (e.g. "Rank-band: 101-200").
//  * The DataTable's "Next" pagination already exposes ALL rows — the rank-band
//  * links are an alternate static view of the same data and would cause
//  * every institute to appear multiple times in the CSV.
//  */
// async function scrapeCategory(
//   browser: Browser,
//   categoryUrl: string,
//   categoryLabel: string,
//   year: string,
//   csvPath: string
// ): Promise<number> {
//   const page = await browser.newPage();

//   try {
//     const mainFile = categoryUrl.split("/").pop() ?? categoryUrl;
//     console.log(`  [scraping  ] ${mainFile}`);

//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const rows = await scrapeAllRowsFromDataTable(page, categoryLabel, year, mainFile);
//     appendRowsToCSV(csvPath, rows);

//     console.log(`  [✓ total   ] ${categoryLabel}: ${rows.length} rows`);
//     return rows.length;
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Main export ─────────────────────────────────────────── */

// export async function startScrape(year: string): Promise<void> {
//   scrapeState.progress = 0;
//   scrapeState.currentCategory = "";
//   scrapeState.categories = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   fs.mkdirSync(baseFolder, { recursive: true });

//   const csvPath = path.join(baseFolder, `nirf-rankings-${year}.csv`);
//   initCSV(csvPath);
//   console.log(`[${year}] CSV initialised → ${csvPath}`);

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // Phase 1 — discover category pages
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found — check URL structure.`);
//       scrapeState.progress = 100;
//       return;
//     }

//     console.log(
//       `[${year}] Found ${categories.length} categories:`,
//       categories.map((c) => c.label)
//     );

//     scrapeState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // Phase 2 — scrape each category
//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       scrapeState.currentCategory = cat.label;
//       scrapeState.categories[ci].status = "active";

//       console.log(`\n[${year}] Scraping: ${cat.label} (${cat.url})`);

//       const rowsScraped = await scrapeCategory(
//         browser,
//         cat.url,
//         cat.label,
//         year,
//         csvPath
//       );

//       scrapeState.categories[ci].total = rowsScraped;
//       scrapeState.categories[ci].done  = rowsScraped;
//       scrapeState.categories[ci].status = "done";
//       scrapeState.progress = Math.round(((ci + 1) / categories.length) * 100);

//       console.log(`[${year}/${cat.slug}] Complete — ${rowsScraped} rows written.`);
//     }

//     scrapeState.progress = 100;

//     const totalRows = scrapeState.categories.reduce((s, c) => s + c.total, 0);
//     console.log(
//       `\n[${year}] ✓ Done. ${totalRows} total rows → ${csvPath}`
//     );
//   } catch (err) {
//     console.error("startScrape error:", err);
//     scrapeState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

























// import puppeteer, { Browser, Page } from "puppeteer";
// import fs from "fs";
// import path from "path";

// /* ─── Types ───────────────────────────────────────────────── */

// export type ScrapeStatus = "pending" | "scraping" | "done" | "failed";

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface ScrapeState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
// }

// export interface InstituteRow {
//   instituteCode: string;
//   instituteName: string;
//   score: string;
//   rank: string;
//   category: string;
//   year: string;
// }

// export const scrapeState: ScrapeState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
// };

// /* ─── URL helpers ─────────────────────────────────────────── */

// function getRankingIndexUrl(year: string): string {
//   const customUrls: Record<string, string> = {
//     "2016": "https://www.nirfindia.org/Rankings/2016/Ranking2016.html",
//     "2017": "https://www.nirfindia.org/Rankings/2017/Ranking2017.html",
//     "2018": "https://www.nirfindia.org/Rankings/2018/Ranking2018.html",
//     "2019": "https://www.nirfindia.org/Rankings/2019/Ranking2019.html",
//     "2020": "https://www.nirfindia.org/Rankings/2020/Ranking2020.html",
//   };
//   return (
//     customUrls[year] ??
//     `https://www.nirfindia.org/Rankings/${year}/Ranking.html`
//   );
// }

// function slugify(label: string): string {
//   return (
//     label
//       .toLowerCase()
//       .replace(/ranking/gi, "")
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "")
//       .trim() || "misc"
//   );
// }

// /* ─── CSV helpers ─────────────────────────────────────────── */

// const CSV_HEADER = "Institute Code,Institute Name,Score,Rank,Category,Year\n";

// function escapeCSV(value: string): string {
//   // Wrap in quotes if the value contains commas, quotes, or newlines
//   if (value.includes(",") || value.includes('"') || value.includes("\n")) {
//     return `"${value.replace(/"/g, '""')}"`;
//   }
//   return value;
// }

// function rowToCSV(row: InstituteRow): string {
//   return [
//     escapeCSV(row.instituteCode),
//     escapeCSV(row.instituteName),
//     escapeCSV(row.score),
//     escapeCSV(row.rank),
//     escapeCSV(row.category),
//     escapeCSV(row.year),
//   ].join(",") + "\n";
// }

// function initCSV(csvPath: string): void {
//   fs.writeFileSync(csvPath, CSV_HEADER, "utf8");
// }

// function appendRowsToCSV(csvPath: string, rows: InstituteRow[]): void {
//   const lines = rows.map(rowToCSV).join("");
//   fs.appendFileSync(csvPath, lines, "utf8");
// }

// /* ─── Category discovery — same logic as working version ─── */

// interface CategoryLink {
//   label: string;
//   slug: string;
//   url: string;
// }

// async function discoverCategories(
//   browser: Browser,
//   year: string
// ): Promise<CategoryLink[]> {
//   const indexUrl = getRankingIndexUrl(year);
//   const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const links = await page.evaluate(() => {
//       const results: { label: string; href: string }[] = [];
//       const seen = new Set<string>();

//       document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
//         const href = a.getAttribute("href")?.trim() ?? "";
//         if (!href || !href.endsWith(".html") || seen.has(href)) return;

//         const fileName = href.split("/").pop() ?? "";
//         const raw = fileName.replace(".html", "").toLowerCase();

//         const map: Record<string, string> = {
//           univ:                "University",
//           universityranking:   "University",
//           engg:                "Engineering",
//           engineeringranking:  "Engineering",
//           mgmt:                "Management",
//           managementranking:   "Management",
//           pharma:              "Pharmacy",
//           pharmaranking:       "Pharmacy",
//           pharmacyranking:     "Pharmacy",
//           overall:             "Overall",
//           overallranking:      "Overall",
//           college:             "College",
//           collegeranking:      "College",
//           medical:             "Medical",
//           medicalranking:      "Medical",
//           law:                 "Law",
//           lawranking:          "Law",
//           arch:                "Architecture",
//           archranking:         "Architecture",
//           architectureranking: "Architecture",
//           dental:              "Dental",
//           dentalranking:       "Dental",
//           research:            "Research",
//           researchranking:     "Research",
//           innovation:          "Innovation",
//           innovationranking:   "Innovation",
//           agriculture:         "Agriculture",
//           agricultureranking:  "Agriculture",
//           stateuniranking:     "State University",
//           openuniversity:      "Open University",
//           openuniranking:      "Open University",
//           skilluniversity:     "Skill University",
//           skilluniranking:     "Skill University",
//         };

//         const label = map[raw] ?? raw;
//         seen.add(href);
//         results.push({ label, href });
//       });

//       return results;
//     });

//     return links.map(({ label, href }) => {
//       const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Scrape institute rows from the currently visible DataTable page ──────── */

// /**
//  * Reads every visible <tr> in the DataTable and extracts:
//  *   col 0  → Institute Code  (must start with "IR-")
//  *   col 1  → Institute Name  (first text node only — skips "More Details" links)
//  *   Score  → <td class="dt-type-numeric sorting_1"> (the currently sorted col)
//  *   Rank   → last <td class="dt-type-numeric"> in the row
//  *
//  * Using CSS classes instead of fixed indices makes this robust against
//  * NIRF adding/removing columns in future years.
//  */
// async function scrapeRowsFromCurrentPage(
//   page: Page,
//   categoryLabel: string,
//   year: string
// ): Promise<InstituteRow[]> {
//   return page.evaluate(
//     (category, yr) => {
//       const rows: {
//         instituteCode: string;
//         instituteName: string;
//         score: string;
//         rank: string;
//         category: string;
//         year: string;
//       }[] = [];

//       // Target the DataTables tbody — works for both #tbl_id and generic DataTable
//       const tbodies = document.querySelectorAll("table tbody");

//       tbodies.forEach((tbody) => {
//         tbody.querySelectorAll("tr").forEach((tr) => {
//           const tds = Array.from(tr.querySelectorAll("td"));
//           if (tds.length < 3) return;

//           // col 0: Institute Code
//           const instituteCode = (tds[0].textContent ?? "").trim();
//           if (!instituteCode || !instituteCode.startsWith("IR-")) return;

//           // col 1: Name — grab ONLY the first text node to skip "More Details" links
//           const nameCell = tds[1];
//           let instituteName = "";
//           for (const node of Array.from(nameCell.childNodes)) {
//             if (node.nodeType === Node.TEXT_NODE) {
//               const t = (node.textContent ?? "").trim();
//               if (t) { instituteName = t; break; }
//             }
//           }
//           if (!instituteName) {
//             instituteName = (nameCell.textContent ?? "")
//               .replace(/More\s+Details.*/gi, "")
//               .trim();
//           }

//           // Handle "Rank Withdrawn" rows — identified by the tr class.
//           // These rows have: <td colspan="2">Rank Withdrawn*</td> (merges Score+Rank)
//           // and a hidden <td style="display:none" class="dt-type-numeric">18</td> for rank.
//           const isRankWithdrawn = tr.classList.contains("rank-withdrawn-row");

//           if (isRankWithdrawn) {
//             const hiddenTd = tds.find(
//               (td) =>
//                 td.getAttribute("style")?.includes("display:none") &&
//                 td.classList.contains("dt-type-numeric")
//             );
//             const rank = hiddenTd ? (hiddenTd.textContent ?? "").trim() : "";
//             rows.push({ instituteCode, instituteName, score: "Rank Withdrawn*", rank, category, year: yr });
//             return;
//           }

//           // Normal rows: Score = second-to-last visible numeric td, Rank = last visible numeric td.
//           // Exclude hidden tds (display:none) used only for DataTables sorting internals.
//           let score = "";
//           let rank  = "";

//           const numericTds = tds.filter(
//             (td) =>
//               td.classList.contains("dt-type-numeric") &&
//               !td.getAttribute("style")?.includes("display:none")
//           );

//           if (numericTds.length >= 2) {
//             score = (numericTds[numericTds.length - 2].textContent ?? "").trim();
//             rank  = (numericTds[numericTds.length - 1].textContent ?? "").trim();
//           } else if (numericTds.length === 1) {
//             // Only one numeric column — this is the Score (e.g. 2018 Engineering/Pharmacy/College
//             // tables which have no separate Rank column). Rank = row position in the tbody.
//             score = (numericTds[0].textContent ?? "").trim();
//             rank  = ""; // will be filled by position counter below
//           } else {
//             score = (tds[tds.length - 2]?.textContent ?? "").trim();
//             rank  = (tds[tds.length - 1]?.textContent ?? "").trim();
//           }

//           if (!score && !rank) return;

//           rows.push({ instituteCode, instituteName, score, rank, category, year: yr });
//         });
//       });

//       return rows;
//     },
//     categoryLabel,
//     year
//   );
// }

// /* ─── Paginate through ALL DataTable pages, collect rows ─────────────────── */

// async function scrapeAllRowsFromDataTable(
//   page: Page,
//   categoryLabel: string,
//   year: string,
//   pageLabel: string
// ): Promise<InstituteRow[]> {
//   const allRows: InstituteRow[] = [];
//   const seenCodes = new Set<string>();
//   let pageNum = 1;

//   while (true) {
//     const rows = await scrapeRowsFromCurrentPage(page, categoryLabel, year);

//     // Detect if DataTable re-rendered by checking if first institute code is new
//     const firstCode = rows[0]?.instituteCode ?? "";
//     if (pageNum > 1 && firstCode && seenCodes.has(firstCode)) {
//       console.warn(`    [warn] Page ${pageNum} returned same data as a previous page — stopping.`);
//       break;
//     }

//     let newRows = 0;
//     for (const row of rows) {
//       if (!seenCodes.has(row.instituteCode)) {
//         seenCodes.add(row.instituteCode);
//         allRows.push(row);
//         newRows++;
//       }
//     }

//     console.log(
//       `    [dt-page ${pageNum}] +${newRows} new rows (total: ${allRows.length})`
//     );

//     // Check if Next button is disabled / absent
//     const nextDisabled: boolean = await page.evaluate(() => {
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       if (!btn) return true;
//       return (
//         btn.disabled ||
//         btn.getAttribute("aria-disabled") === "true" ||
//         btn.classList.contains("disabled")
//       );
//     });

//     if (nextDisabled) break;

//     // Get first row's text BEFORE clicking, so we can detect when table re-renders
//     const firstRowTextBefore: string = await page.evaluate(() => {
//       const firstTr = document.querySelector("table tbody tr");
//       return firstTr?.textContent?.trim() ?? "";
//     });

//     // Click Next
//     await page.evaluate(() => {
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       btn?.click();
//     });

//     // Wait until the first row's content actually changes (table re-rendered)
//     // with a max wait of 5 seconds
//     const maxWait = 5000;
//     const interval = 100;
//     let waited = 0;
//     while (waited < maxWait) {
//       await new Promise((r) => setTimeout(r, interval));
//       waited += interval;
//       const firstRowTextAfter: string = await page.evaluate(() => {
//         const firstTr = document.querySelector("table tbody tr");
//         return firstTr?.textContent?.trim() ?? "";
//       });
//       if (firstRowTextAfter !== firstRowTextBefore) break;
//     }

//     pageNum++;

//     if (pageNum > 50) {
//       console.warn(`    [warn] 50-page safety limit reached for "${pageLabel}"`);
//       break;
//     }
//   }

//   // If this category has no rank column (e.g. 2018 Engineering/Pharmacy/College),
//   // all rank fields will be empty — fill them in as sequential position numbers.
//   const allRanksEmpty = allRows.length > 0 && allRows.every((r) => !r.rank);
//   if (allRanksEmpty) {
//     console.log(`    [info] No rank column found — assigning ranks by position (1..${allRows.length})`);
//     allRows.forEach((r, i) => { r.rank = String(i + 1); });
//   }

//   return allRows;
// }

// /* ─── Scrape one full category: paginate through DataTable only ─────────────
//  *
//  * NOTE: We do NOT follow rank-band sub-pages (e.g. "Rank-band: 101-200").
//  * The DataTable's "Next" pagination already exposes ALL rows — the rank-band
//  * links are an alternate static view of the same data and would cause
//  * every institute to appear multiple times in the CSV.
//  */
// async function scrapeCategory(
//   browser: Browser,
//   categoryUrl: string,
//   categoryLabel: string,
//   year: string,
//   csvPath: string
// ): Promise<number> {
//   const page = await browser.newPage();

//   try {
//     const mainFile = categoryUrl.split("/").pop() ?? categoryUrl;
//     console.log(`  [scraping  ] ${mainFile}`);

//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const rows = await scrapeAllRowsFromDataTable(page, categoryLabel, year, mainFile);
//     appendRowsToCSV(csvPath, rows);

//     console.log(`  [✓ total   ] ${categoryLabel}: ${rows.length} rows`);
//     return rows.length;
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Main export ─────────────────────────────────────────── */

// export async function startScrape(year: string): Promise<void> {
//   scrapeState.progress = 0;
//   scrapeState.currentCategory = "";
//   scrapeState.categories = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   fs.mkdirSync(baseFolder, { recursive: true });

//   const csvPath = path.join(baseFolder, `nirf-rankings-${year}.csv`);
//   initCSV(csvPath);
//   console.log(`[${year}] CSV initialised → ${csvPath}`);

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // Phase 1 — discover category pages
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found — check URL structure.`);
//       scrapeState.progress = 100;
//       return;
//     }

//     console.log(
//       `[${year}] Found ${categories.length} categories:`,
//       categories.map((c) => c.label)
//     );

//     scrapeState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // Phase 2 — scrape each category
//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       scrapeState.currentCategory = cat.label;
//       scrapeState.categories[ci].status = "active";

//       console.log(`\n[${year}] Scraping: ${cat.label} (${cat.url})`);

//       const rowsScraped = await scrapeCategory(
//         browser,
//         cat.url,
//         cat.label,
//         year,
//         csvPath
//       );

//       scrapeState.categories[ci].total = rowsScraped;
//       scrapeState.categories[ci].done  = rowsScraped;
//       scrapeState.categories[ci].status = "done";
//       scrapeState.progress = Math.round(((ci + 1) / categories.length) * 100);

//       console.log(`[${year}/${cat.slug}] Complete — ${rowsScraped} rows written.`);
//     }

//     scrapeState.progress = 100;

//     const totalRows = scrapeState.categories.reduce((s, c) => s + c.total, 0);
//     console.log(
//       `\n[${year}] ✓ Done. ${totalRows} total rows → ${csvPath}`
//     );
//   } catch (err) {
//     console.error("startScrape error:", err);
//     scrapeState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }























import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";

/* ─── Types ───────────────────────────────────────────────── */

export type ScrapeStatus = "pending" | "scraping" | "done" | "failed";

export interface CategoryProgress {
  name: string;
  slug: string;
  total: number;
  done: number;
  status: "pending" | "active" | "done";
}

export interface ScrapeState {
  progress: number;
  currentCategory: string;
  categories: CategoryProgress[];
}

export interface InstituteRow {
  instituteCode: string;
  instituteName: string;
  score: string;
  rank: string;
  category: string;
  year: string;
}

export const scrapeState: ScrapeState = {
  progress: 0,
  currentCategory: "",
  categories: [],
};

/* ─── URL helpers ─────────────────────────────────────────── */

function getRankingIndexUrl(year: string): string {
  const customUrls: Record<string, string> = {
    "2016": "https://www.nirfindia.org/Rankings/2016/Ranking2016.html",
    "2017": "https://www.nirfindia.org/Rankings/2017/Ranking2017.html",
    "2018": "https://www.nirfindia.org/Rankings/2018/Ranking2018.html",
    "2019": "https://www.nirfindia.org/Rankings/2019/Ranking2019.html",
    "2020": "https://www.nirfindia.org/Rankings/2020/Ranking2020.html",
  };
  return (
    customUrls[year] ??
    `https://www.nirfindia.org/Rankings/${year}/Ranking.html`
  );
}

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/ranking/gi, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim() || "misc"
  );
}

/* ─── CSV helpers ─────────────────────────────────────────── */

const CSV_HEADER = "Institute Code,Institute Name,Score,Rank,Category,Year\n";

function escapeCSV(value: string): string {
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCSV(row: InstituteRow): string {
  return [
    escapeCSV(row.instituteCode),
    escapeCSV(row.instituteName),
    escapeCSV(row.score),
    escapeCSV(row.rank),
    escapeCSV(row.category),
    escapeCSV(row.year),
  ].join(",") + "\n";
}

function initCSV(csvPath: string): void {
  fs.writeFileSync(csvPath, CSV_HEADER, "utf8");
}

function appendRowsToCSV(csvPath: string, rows: InstituteRow[]): void {
  const lines = rows.map(rowToCSV).join("");
  fs.appendFileSync(csvPath, lines, "utf8");
}

/* ─── Category discovery — same logic as working version ─── */

interface CategoryLink {
  label: string;
  slug: string;
  url: string;
}

async function discoverCategories(
  browser: Browser,
  year: string
): Promise<CategoryLink[]> {
  const indexUrl = getRankingIndexUrl(year);
  const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
  const page = await browser.newPage();

  try {
    await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

    const links = await page.evaluate(() => {
      const results: { label: string; href: string }[] = [];
      const seen = new Set<string>();

      document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
        const href = a.getAttribute("href")?.trim() ?? "";
        if (!href || !href.endsWith(".html") || seen.has(href)) return;

        const fileName = href.split("/").pop() ?? "";
        const raw = fileName.replace(".html", "").toLowerCase();

        const map: Record<string, string> = {
          univ:                "University",
          universityranking:   "University",
          engg:                "Engineering",
          engineeringranking:  "Engineering",
          mgmt:                "Management",
          managementranking:   "Management",
          pharma:              "Pharmacy",
          pharmaranking:       "Pharmacy",
          pharmacyranking:     "Pharmacy",
          overall:             "Overall",
          overallranking:      "Overall",
          college:             "College",
          collegeranking:      "College",
          medical:             "Medical",
          medicalranking:      "Medical",
          law:                 "Law",
          lawranking:          "Law",
          arch:                "Architecture",
          archranking:         "Architecture",
          architectureranking: "Architecture",
          dental:              "Dental",
          dentalranking:       "Dental",
          research:            "Research",
          researchranking:     "Research",
          innovation:          "Innovation",
          innovationranking:   "Innovation",
          agriculture:         "Agriculture",
          agricultureranking:  "Agriculture",
          stateuniranking:     "State University",
          openuniversity:      "Open University",
          openuniranking:      "Open University",
          skilluniversity:     "Skill University",
          skilluniranking:     "Skill University",
        };

        const label = map[raw] ?? raw;
        seen.add(href);
        results.push({ label, href });
      });

      return results;
    });

    return links.map(({ label, href }) => {
      const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      return { label, slug: slugify(label), url: absoluteUrl };
    });
  } finally {
    await page.close();
  }
}

/* ─── Scrape institute rows from the currently visible DataTable page ──────── */

/**
 * Reads every visible <tr> in the DataTable and extracts:
 *   col 0  → Institute Code  (must start with "IR-")
 *   col 1  → Institute Name  (first text node only — skips "More Details" links)
 *   Score  → <td class="dt-type-numeric sorting_1"> (the currently sorted col)
 *   Rank   → last <td class="dt-type-numeric"> in the row
 *
 * Using CSS classes instead of fixed indices makes this robust against
 * NIRF adding/removing columns in future years.
 */
async function scrapeRowsFromCurrentPage(
  page: Page,
  categoryLabel: string,
  year: string
): Promise<InstituteRow[]> {
  return page.evaluate(
    (category, yr) => {
      const rows: {
        instituteCode: string;
        instituteName: string;
        score: string;
        rank: string;
        category: string;
        year: string;
      }[] = [];

      // Target the DataTables tbody — works for both #tbl_id and generic DataTable
      const tbodies = document.querySelectorAll("table tbody");

      tbodies.forEach((tbody) => {
        tbody.querySelectorAll("tr").forEach((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          if (tds.length < 3) return;

          // col 0: Institute Code — accept both modern "IR-" and legacy "NIRF-" formats
          const instituteCode = (tds[0].textContent ?? "").trim();
          if (!instituteCode || (!instituteCode.startsWith("IR") && !instituteCode.startsWith("NIRF-"))) return;

          // col 1: Name — grab ONLY the first text node to skip "More Details" links
          const nameCell = tds[1];
          let instituteName = "";
          for (const node of Array.from(nameCell.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              const t = (node.textContent ?? "").trim();
              if (t) { instituteName = t; break; }
            }
          }
          if (!instituteName) {
            instituteName = (nameCell.textContent ?? "")
              .replace(/More\s+Details.*/gi, "")
              .trim();
          }

          // Handle "Rank Withdrawn" rows — identified by the tr class.
          // These rows have: <td colspan="2">Rank Withdrawn*</td> (merges Score+Rank)
          // and a hidden <td style="display:none" class="dt-type-numeric">18</td> for rank.
          const isRankWithdrawn = tr.classList.contains("rank-withdrawn-row");

          if (isRankWithdrawn) {
            const hiddenTd = tds.find(
              (td) =>
                td.getAttribute("style")?.includes("display:none") &&
                td.classList.contains("dt-type-numeric")
            );
            const rank = hiddenTd ? (hiddenTd.textContent ?? "").trim() : "";
            rows.push({ instituteCode, instituteName, score: "Rank Withdrawn*", rank, category, year: yr });
            return;
          }

          // Normal rows: Score = second-to-last visible numeric td, Rank = last visible numeric td.
          // Exclude hidden tds (display:none) used only for DataTables sorting internals.
          let score = "";
          let rank  = "";

          const numericTds = tds.filter(
            (td) =>
              td.classList.contains("dt-type-numeric") &&
              !td.getAttribute("style")?.includes("display:none")
          );

          if (numericTds.length >= 2) {
            // Modern NIRF pages (2018+): DataTables with dt-type-numeric class
            score = (numericTds[numericTds.length - 2].textContent ?? "").trim();
            rank  = (numericTds[numericTds.length - 1].textContent ?? "").trim();
          } else if (numericTds.length === 1) {
            // Only one numeric column — this is the Score (e.g. 2018 Engineering/Pharmacy/College
            // tables which have no separate Rank column). Rank assigned by position later.
            score = (numericTds[0].textContent ?? "").trim();
            rank  = "";
          } else {
            // 2016/2017 static tables — no dt-type-numeric class at all.
            // Score is second-to-last td, Rank is last td.
            score = (tds[tds.length - 2]?.textContent ?? "").trim();
            rank  = (tds[tds.length - 1]?.textContent ?? "").trim();
          }

          if (!score && !rank) return;

          rows.push({ instituteCode, instituteName, score, rank, category, year: yr });
        });
      });

      return rows;
    },
    categoryLabel,
    year
  );
}

/* ─── Paginate through ALL DataTable pages, collect rows ─────────────────── */

async function scrapeAllRowsFromDataTable(
  page: Page,
  categoryLabel: string,
  year: string,
  pageLabel: string
): Promise<InstituteRow[]> {
  const allRows: InstituteRow[] = [];
  const seenCodes = new Set<string>();
  let pageNum = 1;

  while (true) {
    const rows = await scrapeRowsFromCurrentPage(page, categoryLabel, year);

    // Detect if DataTable re-rendered by checking if first institute code is new
    const firstCode = rows[0]?.instituteCode ?? "";
    if (pageNum > 1 && firstCode && seenCodes.has(firstCode)) {
      console.warn(`    [warn] Page ${pageNum} returned same data as a previous page — stopping.`);
      break;
    }

    let newRows = 0;
    for (const row of rows) {
      if (!seenCodes.has(row.instituteCode)) {
        seenCodes.add(row.instituteCode);
        allRows.push(row);
        newRows++;
      }
    }

    console.log(
      `    [dt-page ${pageNum}] +${newRows} new rows (total: ${allRows.length})`
    );

    // Check if Next button is disabled / absent
    const nextDisabled: boolean = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        "nav[aria-label='pagination'] button[aria-label='Next'], " +
        ".dt-paging button[aria-label='Next'], " +
        "button.dt-paging-button.next"
      );
      if (!btn) return true;
      return (
        btn.disabled ||
        btn.getAttribute("aria-disabled") === "true" ||
        btn.classList.contains("disabled")
      );
    });

    if (nextDisabled) break;

    // Get first row's text BEFORE clicking, so we can detect when table re-renders
    const firstRowTextBefore: string = await page.evaluate(() => {
      const firstTr = document.querySelector("table tbody tr");
      return firstTr?.textContent?.trim() ?? "";
    });

    // Click Next
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        "nav[aria-label='pagination'] button[aria-label='Next'], " +
        ".dt-paging button[aria-label='Next'], " +
        "button.dt-paging-button.next"
      );
      btn?.click();
    });

    // Wait until the first row's content actually changes (table re-rendered)
    // with a max wait of 5 seconds
    const maxWait = 5000;
    const interval = 100;
    let waited = 0;
    while (waited < maxWait) {
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
      const firstRowTextAfter: string = await page.evaluate(() => {
        const firstTr = document.querySelector("table tbody tr");
        return firstTr?.textContent?.trim() ?? "";
      });
      if (firstRowTextAfter !== firstRowTextBefore) break;
    }

    pageNum++;

    if (pageNum > 50) {
      console.warn(`    [warn] 50-page safety limit reached for "${pageLabel}"`);
      break;
    }
  }

  // If this category has no rank column (e.g. 2018 Engineering/Pharmacy/College),
  // all rank fields will be empty — fill them in as sequential position numbers.
  const allRanksEmpty = allRows.length > 0 && allRows.every((r) => !r.rank);
  if (allRanksEmpty) {
    console.log(`    [info] No rank column found — assigning ranks by position (1..${allRows.length})`);
    allRows.forEach((r, i) => { r.rank = String(i + 1); });
  }

  return allRows;
}

/* ─── Scrape one full category: paginate through DataTable only ─────────────
 *
 * NOTE: We do NOT follow rank-band sub-pages (e.g. "Rank-band: 101-200").
 * The DataTable's "Next" pagination already exposes ALL rows — the rank-band
 * links are an alternate static view of the same data and would cause
 * every institute to appear multiple times in the CSV.
 */
async function scrapeCategory(
  browser: Browser,
  categoryUrl: string,
  categoryLabel: string,
  year: string,
  csvPath: string
): Promise<number> {
  const page = await browser.newPage();

  try {
    const mainFile = categoryUrl.split("/").pop() ?? categoryUrl;
    console.log(`  [scraping  ] ${mainFile}`);

    await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

    const rows = await scrapeAllRowsFromDataTable(page, categoryLabel, year, mainFile);
    appendRowsToCSV(csvPath, rows);

    console.log(`  [✓ total   ] ${categoryLabel}: ${rows.length} rows`);
    return rows.length;
  } finally {
    await page.close();
  }
}

/* ─── Main export ─────────────────────────────────────────── */

export async function startScrape(year: string): Promise<void> {
  scrapeState.progress = 0;
  scrapeState.currentCategory = "";
  scrapeState.categories = [];

  const baseFolder = path.join(process.cwd(), "downloads", year);
  fs.mkdirSync(baseFolder, { recursive: true });

  const csvPath = path.join(baseFolder, `nirf-rankings-${year}.csv`);
  initCSV(csvPath);
  console.log(`[${year}] CSV initialised → ${csvPath}`);

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({ headless: true });

    // Phase 1 — discover category pages
    console.log(`[${year}] Discovering categories...`);
    const categories = await discoverCategories(browser, year);

    if (categories.length === 0) {
      console.warn(`[${year}] No categories found — check URL structure.`);
      scrapeState.progress = 100;
      return;
    }

    console.log(
      `[${year}] Found ${categories.length} categories:`,
      categories.map((c) => c.label)
    );

    scrapeState.categories = categories.map((c) => ({
      name: c.label,
      slug: c.slug,
      total: 0,
      done: 0,
      status: "pending" as const,
    }));

    // Phase 2 — scrape each category
    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      scrapeState.currentCategory = cat.label;
      scrapeState.categories[ci].status = "active";

      console.log(`\n[${year}] Scraping: ${cat.label} (${cat.url})`);

      const rowsScraped = await scrapeCategory(
        browser,
        cat.url,
        cat.label,
        year,
        csvPath
      );

      scrapeState.categories[ci].total = rowsScraped;
      scrapeState.categories[ci].done  = rowsScraped;
      scrapeState.categories[ci].status = "done";
      scrapeState.progress = Math.round(((ci + 1) / categories.length) * 100);

      console.log(`[${year}/${cat.slug}] Complete — ${rowsScraped} rows written.`);
    }

    scrapeState.progress = 100;

    const totalRows = scrapeState.categories.reduce((s, c) => s + c.total, 0);
    console.log(
      `\n[${year}] ✓ Done. ${totalRows} total rows → ${csvPath}`
    );
  } catch (err) {
    console.error("startScrape error:", err);
    scrapeState.progress = 100;
  } finally {
    if (browser) await browser.close();
  }
}