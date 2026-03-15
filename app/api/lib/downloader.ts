// import axios from "axios";
// import puppeteer from "puppeteer";
// import fs from "fs";
// import path from "path";

// export type FileStatus = "pending" | "downloading" | "done";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
// }

// export interface DownloadState {
//   progress: number;
//   files: FileItem[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   files: [],
// };

// /* ===============================
//    Helpers
// ================================ */

// function createWritePromise(
//   stream: NodeJS.WritableStream
// ): Promise<void> {
//   return new Promise((resolve, reject) => {
//     stream.on("finish", resolve);
//     stream.on("error", reject);
//   });
// }

// function getFileNameFromUrl(url: string): string {
//   const u = new URL(url);
//   console.log(path.basename(u.pathname))
//   return path.basename(u.pathname);
// }

// /* ===============================
//    Download File
// ================================ */

// async function downloadFile(
//   url: string,
//   folder: string,
//   index: number,
//   total: number
// ) {
//   try {
//     downloadState.files[index].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)",
//       },
//     });

//     const filename = getFileNameFromUrl(url);
//     const filePath = path.join(folder, filename);

//     downloadState.files[index].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await createWritePromise(writer);
//     }

//     downloadState.files[index].status = "done";
//   } catch (err) {
//     console.error("Failed:", url);
//     downloadState.files[index].status = "done";
//   }
// }

// /* ===============================
//    MAIN FUNCTION
// ================================ */

// export async function startDownload(
//   websiteUrl: string,
//   year: string
// ): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.files = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const pdfFolder = path.join(baseFolder, "university-pdf");
//   const imageFolder = path.join(baseFolder, "university-image");

//   fs.mkdirSync(pdfFolder, { recursive: true });
//   fs.mkdirSync(imageFolder, { recursive: true });

//   let browser;

//   if(year=="2016"){
//     websiteUrl="https://www.nirfindia.org/Rankings/2016/univ.html"
//   }

//   try {
//     browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.goto(websiteUrl, {
//       waitUntil: "networkidle2",
//     });

//     // Extract PDF + image links AFTER JS execution
//     const links = await page.evaluate((year) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href");
//         if (!href) return;

//         if (href.includes(`/nirfpdfcdn/${year}/pdf/`) || href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") || href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${year}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);

//     const pdfLinks = links.pdfs;
//     const imageLinks = links.images;
//     console.log(pdfLinks)

//     const total = pdfLinks.length + imageLinks.length;

//     if (total === 0) {
//       downloadState.progress = 100;
//       return;
//     }

//     downloadState.files = new Array(total).fill(null).map(() => ({
//       name: "pending...",
//       status: "pending",
//     }));

//     let index = 0;

//     for (const pdf of pdfLinks) {
//       await downloadFile(pdf, pdfFolder, index, total);
//       index++;
//       downloadState.progress = Math.round((index / total) * 100);
//     }

//     for (const img of imageLinks) {
//       await downloadFile(img, imageFolder, index, total);
//       index++;
//       downloadState.progress = Math.round((index / total) * 100);
//     }

//     downloadState.progress = 100;
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

//working

// import axios from "axios";
// import puppeteer from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, ExtractedData } from "./extractor"

// export type FileStatus = "pending" | "downloading" | "extracting" | "done";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
// }

// export interface DownloadState {
//   progress: number;
//   files: FileItem[];
//   extractedData: ExtractedData[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   files: [],
//   extractedData: [],
// };

// /* ─── helpers ─────────────────────────────────────────── */

// function createWritePromise(stream: NodeJS.WritableStream): Promise<void> {
//   return new Promise((resolve, reject) => {
//     stream.on("finish", resolve);
//     stream.on("error", reject);
//   });
// }

// function getFileNameFromUrl(url: string): string {
//   const u = new URL(url);
//   return path.basename(u.pathname);
// }

// function isPdf(url: string): boolean {
//   return url.toLowerCase().endsWith(".pdf");
// }

// /* ─── download + extract a single file ───────────────── */

// async function downloadFile(
//   url: string,
//   folder: string,
//   index: number,
//   total: number,
//   extractionOutputPath: string
// ) {
//   try {
//     downloadState.files[index].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = getFileNameFromUrl(url);
//     const filePath = path.join(folder, filename);

//     downloadState.files[index].name = filename;

//     // Download the file
//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await createWritePromise(writer);
//     }

//     // Extract data immediately if it's a PDF
//     if (isPdf(url)) {
//       downloadState.files[index].status = "extracting";

//       const extracted = await extractFromPdf(filePath);
//       downloadState.extractedData.push(extracted);

//       // Append to the running JSON file so data is never lost
//       fs.writeFileSync(extractionOutputPath, JSON.stringify(downloadState.extractedData, null, 2));
//     }

//     downloadState.files[index].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[index].status = "done";
//   }
// }

// /* ─── main ────────────────────────────────────────────── */

// export async function startDownload(
//   websiteUrl: string,
//   year: string
// ): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.files = [];
//   downloadState.extractedData = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const pdfFolder = path.join(baseFolder, "university-pdf");
//   const imageFolder = path.join(baseFolder, "university-image");
//   const extractionOutputPath = path.join(baseFolder, "extracted-data.json");

//   fs.mkdirSync(pdfFolder, { recursive: true });
//   fs.mkdirSync(imageFolder, { recursive: true });

//   // Start with an empty extraction file
//   fs.writeFileSync(extractionOutputPath, "[]");

//   let browser;

//   if (year === "2016") {
//     websiteUrl = "https://www.nirfindia.org/Rankings/2016/univ.html";
//   }

//   try {
//     browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.goto(websiteUrl, { waitUntil: "networkidle2" });

//     const links = await page.evaluate((year) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href");
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${year}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${year}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);

//     const pdfLinks = links.pdfs;
//     const imageLinks = links.images;
//     console.log(`Found ${pdfLinks.length} PDFs and ${imageLinks.length} images`);

//     const total = pdfLinks.length + imageLinks.length;

//     if (total === 0) {
//       downloadState.progress = 100;
//       return;
//     }

//     downloadState.files = new Array(total).fill(null).map(() => ({
//       name: "pending...",
//       status: "pending",
//     }));

//     let index = 0;

//     // Download PDFs — extract immediately after each one
//     for (const pdf of pdfLinks) {
//       await downloadFile(pdf, pdfFolder, index, total, extractionOutputPath);
//       index++;
//       downloadState.progress = Math.round((index / total) * 100);
//     }

//     // Download images (no extraction needed)
//     for (const img of imageLinks) {
//       await downloadFile(img, imageFolder, index, total, extractionOutputPath);
//       index++;
//       downloadState.progress = Math.round((index / total) * 100);
//     }

//     console.log(
//       `Extraction complete. ${downloadState.extractedData.length} records saved to ${extractionOutputPath}`
//     );

//     downloadState.progress = 100;
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, ExtractedData } from "./extractor";

// export type FileStatus = "pending" | "downloading" | "extracting" | "done" | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
// };

// /* ─── URL helpers ─────────────────────────────────────── */

// function getRankingIndexUrl(year: string): string {
//   const customUrls: Record<string, string> = {
//     "2016": "https://www.nirfindia.org/Rankings/2016/Ranking2016.html",
//     "2017": "https://www.nirfindia.org/Rankings/2017/Ranking2017.html",
//     "2018": "https://www.nirfindia.org/Rankings/2018/Ranking2018.html",
//     "2019": "https://www.nirfindia.org/Rankings/2019/Ranking2019.html",
//     "2020": "https://www.nirfindia.org/Rankings/2020/Ranking2020.html",
//   };
//   return customUrls[year] ?? `https://www.nirfindia.org/Rankings/${year}/Ranking.html`;
// }

// function slugify(label: string): string {
//   return label
//     .toLowerCase()
//     .replace(/ranking/gi, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "")
//     .trim() || "misc";
// }

// /* ─── discover category links from the ranking index ──── */

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
//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const links = await page.evaluate((baseYear) => {
//       const results: { label: string; url: string }[] = [];
//       const seen = new Set<string>();

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         console.log(href)
//         const text = (a as HTMLElement).innerText?.trim() ?? "";

//         const isRankingPage =
//           href.includes(`/Rankings/${baseYear}/`) &&
//           href.endsWith(".html") &&
//           !href.toUpperCase().includes("ALL") &&
//           !href.endsWith("Ranking.html") &&
//           !href.match(/Ranking20\d\d\.html/);

//         if (isRankingPage && !seen.has(href)) {
//           seen.add(href);
//           results.push({ label: text || href, url: href });
//         }
//       });

//       return results;
//     }, year);

//     return links.map(({ label, url }) => {
//       const absoluteUrl = url.startsWith("http")
//         ? url
//         : `https://www.nirfindia.org${url.startsWith("/") ? "" : "/"}${url}`;
//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── scrape PDF + image links from a category page ───── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── download a single file ──────────────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   category: string,
//   extractionOutputPath: string
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     if (url.toLowerCase().endsWith(".pdf")) {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath);
//       downloadState.extractedData.push(extracted);
//       fs.writeFileSync(
//         extractionOutputPath,
//         JSON.stringify(downloadState.extractedData, null, 2)
//       );
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── main ────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const extractionOutputPath = path.join(baseFolder, "extracted-data.json");
//   fs.mkdirSync(baseFolder, { recursive: true });
//   fs.writeFileSync(extractionOutputPath, "[]");

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(`[${year}] Categories:`, categories.map((c) => c.label));

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending",
//     }));

//     let totalFiles = 0;
//     let doneFiles = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder, { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       console.log(`[${year}/${cat.slug}] Scraping: ${cat.url}`);
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       console.log(`[${year}/${cat.slug}] PDFs: ${pdfs.length}, Images: ${images.length}`);

//       downloadState.categories[ci].total = pdfs.length + images.length;
//       totalFiles += pdfs.length + images.length;

//       const fileOffset = downloadState.files.length;
//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
//       }

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(pdfs[i], pdfFolder, fileOffset + i, cat.slug, extractionOutputPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / Math.max(totalFiles, 1)) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(images[i], imageFolder, fileOffset + pdfs.length + i, cat.slug, extractionOutputPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / Math.max(totalFiles, 1)) * 100);
//       }

//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(`[${year}] All done. ${downloadState.extractedData.length} records extracted.`);
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

//working 2

// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, ExtractedData } from "./extractor";

// export type FileStatus = "pending" | "downloading" | "extracting" | "done" | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
// };

// /* ─── URL helpers ─────────────────────────────────────── */

// function getRankingIndexUrl(year: string): string {
//   const customUrls: Record<string, string> = {
//     "2016": "https://www.nirfindia.org/Rankings/2016/Ranking2016.html",
//     "2017": "https://www.nirfindia.org/Rankings/2017/Ranking2017.html",
//     "2018": "https://www.nirfindia.org/Rankings/2018/Ranking2018.html",
//     "2019": "https://www.nirfindia.org/Rankings/2019/Ranking2019.html",
//     "2020": "https://www.nirfindia.org/Rankings/2020/Ranking2020.html",
//   };
//   return customUrls[year] ?? `https://www.nirfindia.org/Rankings/${year}/Ranking.html`;
// }

// function slugify(label: string): string {
//   return label
//     .toLowerCase()
//     .replace(/ranking/gi, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "")
//     .trim() || "misc";
// }

// /* ─── discover category links from the ranking index ──── */

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
//   // Base for resolving relative hrefs — same folder as the index page
//   const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);

//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     // Category links are inside col-* divs with class "p-circle-N".
//     // Their hrefs are RELATIVE filenames like "UniversityRanking.html".
//     // We grab the <a> href + the sibling <p> text as the label.
//     const links = await page.evaluate(() => {
//       const results: { label: string; href: string }[] = [];
//       const seen = new Set<string>();

//       document
//         .querySelectorAll("div[class*='col-lg-2'] a")
//         .forEach((a) => {
//           const href = a.getAttribute("href")?.trim() ?? "";
//           if (!href || !href.endsWith(".html") || seen.has(href)) return;

//           // Label: prefer the <p> sibling text, fallback to <img> alt, fallback to href
//           const parent = a.closest("div");
//           const labelEl =
//             parent?.querySelector("p") ??
//             parent?.querySelector("img");
//           const label =
//             (labelEl instanceof HTMLImageElement
//               ? labelEl.alt
//               : labelEl?.innerText) ?? href;

//           seen.add(href);
//           results.push({ label: label.trim(), href });
//         });

//       return results;
//     });

//     return links.map(({ label, href }) => {
//       // href is a bare filename like "UniversityRanking.html" or a relative path
//       const absoluteUrl = href.startsWith("http")
//         ? href
//         : `${baseUrl}${href}`;

//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── scrape PDF + image links from a category page ───── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── download a single file ──────────────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   category: string,
//   extractionOutputPath: string
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     if (url.toLowerCase().endsWith(".pdf")) {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath);
//       downloadState.extractedData.push(extracted);
//       fs.writeFileSync(
//         extractionOutputPath,
//         JSON.stringify(downloadState.extractedData, null, 2)
//       );
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── main ────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const extractionOutputPath = path.join(baseFolder, "extracted-data.json");
//   fs.mkdirSync(baseFolder, { recursive: true });
//   fs.writeFileSync(extractionOutputPath, "[]");

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(`[${year}] Categories:`, categories.map((c) => c.label));

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending",
//     }));

//     let totalFiles = 0;
//     let doneFiles = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder, { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       console.log(`[${year}/${cat.slug}] Scraping: ${cat.url}`);
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       console.log(`[${year}/${cat.slug}] PDFs: ${pdfs.length}, Images: ${images.length}`);

//       downloadState.categories[ci].total = pdfs.length + images.length;
//       totalFiles += pdfs.length + images.length;

//       const fileOffset = downloadState.files.length;
//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
//       }

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(pdfs[i], pdfFolder, fileOffset + i, cat.slug, extractionOutputPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / Math.max(totalFiles, 1)) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(images[i], imageFolder, fileOffset + pdfs.length + i, cat.slug, extractionOutputPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / Math.max(totalFiles, 1)) * 100);
//       }

//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(`[${year}] All done. ${downloadState.extractedData.length} records extracted.`);
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }


























//working-latest

// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, ExtractedData } from "./extractor";

// export type FileStatus =
//   | "pending"
//   | "downloading"
//   | "extracting"
//   | "done"
//   | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
// };

// /* ─── URL helpers ─────────────────────────────────────── */

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

// /* ─── discover category links from the ranking index ──── */

// interface CategoryLink {
//   label: string;
//   slug: string;
//   url: string;
// }

// async function discoverCategories(
//   browser: Browser,
//   year: string,
// ): Promise<CategoryLink[]> {
//   const indexUrl = getRankingIndexUrl(year);
//   // Base for resolving relative hrefs — same folder as the index page
//   const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);

//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     // Category links are inside col-* divs with class "p-circle-N".
//     // Their hrefs are RELATIVE filenames like "UniversityRanking.html".
//     // We grab the <a> href + the sibling <p> text as the label.
//     const links = await page.evaluate(() => {
//       const results: { label: string; href: string }[] = [];
//       const seen = new Set<string>();

//       document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
//         const href = a.getAttribute("href")?.trim() ?? "";
//         if (!href || !href.endsWith(".html") || seen.has(href)) return;

//         //  const labelEl =
//         //     parent?.querySelector("p") ??
//         //     parent?.querySelector("img");
//         //   const label =
//         //     (labelEl instanceof HTMLImageElement
//         //       ? labelEl.alt
//         //       : labelEl?.innerText) ?? href;

//         //   seen.add(href);
//         //   results.push({ label: label.trim(), href });

//         // Label: prefer the <p> sibling text, fallback to <img> alt, fallback to href
//         const parent = a.closest("div");
//         const fileName = href.split("/").pop() ?? "";

//         // Derive raw label from filename
//         let raw = fileName.replace(".html", "").toLowerCase();

//         // Normalize known slugs
//         const map: Record<string, string> = {
//           univ: "University",
//           universityranking: "University",
//           engg: "Engineering",
//           engineeringranking: "Engineering",
//           mgmt: "Management",
//           managementranking: "Management",
//           pharma: "Pharmacy",
//           pharmaranking: "Pharmacy",
//         };

//         const label = map[raw] ?? raw;

//         seen.add(href);
//         results.push({ label, href });
//       });

//       return results;
//     });

//     console.log(links);

//     return links.map(({ label, href }) => {
//       // href is a bare filename like "UniversityRanking.html" or a relative path
//       const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── scrape PDF + image links from a category page ───── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string,
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── download a single file ──────────────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   category: string,
//   extractionOutputPath: string,
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: {
//         "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)",
//       },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     if (url.toLowerCase().endsWith(".pdf")) {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath);
//       downloadState.extractedData.push(extracted);
//       fs.writeFileSync(
//         extractionOutputPath,
//         JSON.stringify(downloadState.extractedData, null, 2),
//       );
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── main ────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const extractionOutputPath = path.join(baseFolder, "extracted-data.json");
//   fs.mkdirSync(baseFolder, { recursive: true });
//   fs.writeFileSync(extractionOutputPath, "[]");

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // ── Phase 1: discover categories ──────────────────────
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(
//       `[${year}] Categories:`,
//       categories.map((c) => c.label),
//     );

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // ── Phase 2: scrape ALL category pages first to get the
//     //    true total file count BEFORE any downloading starts.
//     //    This prevents progress hitting 100% after the first
//     //    category finishes and the frontend stopping polling.
//     console.log(`[${year}] Pre-scanning all categories for file counts...`);

//     const categoryLinks: { pdfs: string[]; images: string[] }[] = [];

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       categoryLinks.push({ pdfs, images });

//       downloadState.categories[ci].total = pdfs.length + images.length;

//       // Pre-allocate all file slots so the UI can show them immediately
//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({
//           name: "pending...",
//           status: "pending",
//           category: cat.slug,
//         });
//       }

//       console.log(
//         `[${year}/${cat.slug}] Found: ${pdfs.length} PDFs, ${images.length} images`,
//       );
//     }

//     const totalFiles = downloadState.files.length;
//     let doneFiles = 0;

//     console.log(`[${year}] Total files across all categories: ${totalFiles}`);

//     // ── Phase 3: download everything now that total is known
//     let fileOffset = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = categoryLinks[ci];

//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder, { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(
//           pdfs[i],
//           pdfFolder,
//           fileOffset + i,
//           cat.slug,
//           extractionOutputPath,
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(
//           images[i],
//           imageFolder,
//           fileOffset + pdfs.length + i,
//           cat.slug,
//           extractionOutputPath,
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       fileOffset += pdfs.length + images.length;
//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(
//       `[${year}] All done. ${downloadState.extractedData.length} records extracted.`,
//     );
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }




























// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, ExtractedData } from "./extractor";
// import { extractFromImage, ImageRow, buildExcel } from "./image-extractor";

// export type FileStatus =
//   | "pending"
//   | "downloading"
//   | "extracting"
//   | "done"
//   | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
//   imageData: ImageRow[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
//   imageData: [],
// };

// /* ─── URL helpers ─────────────────────────────────────── */

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

// /* ─── discover category links from the ranking index ──── */

// interface CategoryLink {
//   label: string;
//   slug: string;
//   url: string;
// }

// async function discoverCategories(
//   browser: Browser,
//   year: string,
// ): Promise<CategoryLink[]> {
//   const indexUrl = getRankingIndexUrl(year);
//   // Base for resolving relative hrefs — same folder as the index page
//   const baseUrl = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);

//   const page = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     // Category links are inside col-* divs with class "p-circle-N".
//     // Their hrefs are RELATIVE filenames like "UniversityRanking.html".
//     // We grab the <a> href + the sibling <p> text as the label.
//     const links = await page.evaluate(() => {
//       const results: { label: string; href: string }[] = [];
//       const seen = new Set<string>();

//       document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
//         const href = a.getAttribute("href")?.trim() ?? "";
//         if (!href || !href.endsWith(".html") || seen.has(href)) return;

//         const parent = a.closest("div");
//         const fileName = href.split("/").pop() ?? "";

//         // Derive raw label from filename
//         let raw = fileName.replace(".html", "").toLowerCase();

//         // Normalize known slugs
//         const map: Record<string, string> = {
//           univ: "University",
//           universityranking: "University",
//           engg: "Engineering",
//           engineeringranking: "Engineering",
//           mgmt: "Management",
//           managementranking: "Management",
//           pharma: "Pharmacy",
//           pharmaranking: "Pharmacy",
//         };

//         const label = map[raw] ?? raw;

//         seen.add(href);
//         results.push({ label, href });
//       });

//       return results;
//     });

//     return links.map(({ label, href }) => {
//       // href is a bare filename like "UniversityRanking.html" or a relative path
//       const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

//       return { label, slug: slugify(label), url: absoluteUrl };
//     });
//   } finally {
//     await page.close();
//   }
// }

// /* ─── scrape PDF + image links from a category page ───── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string,
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── download a single file ──────────────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   category: string,
//   extractionOutputPath: string,
//   imageXLSXPath: string,
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: {
//         "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)",
//       },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     const ext = url.toLowerCase().split(".").pop() ?? "";

//     if (ext === "pdf") {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath);
//       downloadState.extractedData.push(extracted);
//       fs.writeFileSync(
//         extractionOutputPath,
//         JSON.stringify(downloadState.extractedData, null, 2),
//       );
//     } else if (["jpg", "jpeg", "png"].includes(ext)) {
//       downloadState.files[fileIndex].status = "extracting";
//       const imgData = await extractFromImage(filePath);
//       if (imgData) {
//         downloadState.imageData.push(imgData);
//         fs.writeFileSync(imageXLSXPath, buildExcel(downloadState.imageData));
//       }
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── main ────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];
//   downloadState.imageData = [];

//   const baseFolder = path.join(process.cwd(), "downloads", year);
//   const extractionOutputPath = path.join(baseFolder, "extracted-data.json");
//   const imageXLSXPath = path.join(baseFolder, "image-data.xlsx");
//   fs.mkdirSync(baseFolder, { recursive: true });
//   fs.writeFileSync(extractionOutputPath, "[]");

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // ── Phase 1: discover categories ──────────────────────
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(
//       `[${year}] Categories:`,
//       categories.map((c) => c.label),
//     );

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // ── Phase 2: scrape ALL category pages first to get the
//     //    true total file count BEFORE any downloading starts.
//     //    This prevents progress hitting 100% after the first
//     //    category finishes and the frontend stopping polling.
//     console.log(`[${year}] Pre-scanning all categories for file counts...`);

//     const categoryLinks: { pdfs: string[]; images: string[] }[] = [];

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       categoryLinks.push({ pdfs, images });

//       downloadState.categories[ci].total = pdfs.length + images.length;

//       // Pre-allocate all file slots so the UI can show them immediately
//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({
//           name: "pending...",
//           status: "pending",
//           category: cat.slug,
//         });
//       }

//       console.log(
//         `[${year}/${cat.slug}] Found: ${pdfs.length} PDFs, ${images.length} images`,
//       );
//     }

//     const totalFiles = downloadState.files.length;
//     let doneFiles = 0;

//     console.log(`[${year}] Total files across all categories: ${totalFiles}`);

//     // ── Phase 3: download everything now that total is known
//     let fileOffset = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = categoryLinks[ci];

//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder, { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(
//           pdfs[i],
//           pdfFolder,
//           fileOffset + i,
//           cat.slug,
//           extractionOutputPath,
//           imageXLSXPath,
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(
//           images[i],
//           imageFolder,
//           fileOffset + pdfs.length + i,
//           cat.slug,
//           extractionOutputPath,
//           imageXLSXPath,
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       fileOffset += pdfs.length + images.length;
//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(
//       `[${year}] All done. ${downloadState.extractedData.length} records extracted.`,
//     );
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }







// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, getCSVPath, resetCSVFile, ExtractedData } from "./extractor";
// import { extractFromImage, ImageRow, buildExcel } from "./image-extractor";

// export type FileStatus =
//   | "pending"
//   | "downloading"
//   | "extracting"
//   | "done"
//   | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
//   imageData: ImageRow[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
//   imageData: [],
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

// /* ─── Category link discovery ─────────────────────────────── */

// interface CategoryLink {
//   label: string;   // display name, e.g. "University", "Engineering"
//   slug: string;    // folder name, e.g. "university", "engineering"
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
//           univ:              "University",
//           universityranking: "University",
//           engg:              "Engineering",
//           engineeringranking:"Engineering",
//           mgmt:              "Management",
//           managementranking: "Management",
//           pharma:            "Pharmacy",
//           pharmaranking:     "Pharmacy",
//           overall:           "Overall",
//           overallranking:    "Overall",
//           college:           "College",
//           collegeranking:    "College",
//           medical:           "Medical",
//           medicalranking:    "Medical",
//           law:               "Law",
//           lawranking:        "Law",
//           arch:              "Architecture",
//           archranking:       "Architecture",
//           dental:            "Dental",
//           dentalranking:     "Dental",
//           research:          "Research",
//           researchranking:   "Research",
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

// /* ─── Scrape PDF + image links from a category page ──────── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Download + extract a single file ───────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   categoryLabel: string,  // full display name, e.g. "Overall", "University"
//   year: string,
//   csvPath: string,
//   imageXLSXPath: string
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     const ext = url.toLowerCase().split(".").pop() ?? "";

//     if (ext === "pdf") {
//       // Parse PDF → append rows to nirf-pdf-data.csv immediately
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath, csvPath, year, categoryLabel);
//       downloadState.extractedData.push(extracted);
//       console.log(
//         `[PDF] ${extracted.instituteCode} | ${extracted.instituteName} | ${extracted.rowsWritten} rows written`
//       );
//     } else if (["jpg", "jpeg", "png"].includes(ext)) {
//       // Parse image → rewrite image-data.xlsx immediately
//       downloadState.files[fileIndex].status = "extracting";
//       const imgData = await extractFromImage(filePath);
//       if (imgData) {
//         downloadState.imageData.push(imgData);
//         fs.writeFileSync(imageXLSXPath, buildExcel(downloadState.imageData));
//       }
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── Main ────────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];
//   downloadState.imageData = [];

//   const baseFolder    = path.join(process.cwd(), "downloads", year);
//   const imageXLSXPath = path.join(baseFolder, "image-data.xlsx");

//   fs.mkdirSync(baseFolder, { recursive: true });

//   // Wipe the CSV so a fresh run starts clean
//   resetCSVFile(baseFolder);
//   const csvPath = getCSVPath(baseFolder);

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // Phase 1 — discover categories
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(`[${year}] Categories:`, categories.map((c) => c.label));

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // Phase 2 — pre-scan to get accurate total file count
//     console.log(`[${year}] Pre-scanning categories...`);
//     const categoryLinks: { pdfs: string[]; images: string[] }[] = [];

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       categoryLinks.push({ pdfs, images });
//       downloadState.categories[ci].total = pdfs.length + images.length;

//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
//       }

//       console.log(`[${year}/${cat.slug}] ${pdfs.length} PDFs, ${images.length} images`);
//     }

//     const totalFiles = downloadState.files.length;
//     let doneFiles = 0;
//     console.log(`[${year}] Total files: ${totalFiles}`);

//     // Phase 3 — download and extract
//     let fileOffset = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = categoryLinks[ci];

//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder   = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder,   { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(
//           pdfs[i], pdfFolder, fileOffset + i,
//           cat.label,   // ← full display name goes into the CSV "Category" column
//           year, csvPath, imageXLSXPath
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(
//           images[i], imageFolder, fileOffset + pdfs.length + i,
//           cat.label,
//           year, csvPath, imageXLSXPath
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       fileOffset += pdfs.length + images.length;
//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(
//       `[${year}] Done. ${downloadState.extractedData.length} PDFs → nirf-pdf-data.csv | ` +
//       `${downloadState.imageData.length} images → image-data.xlsx`
//     );
//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

























// import axios from "axios";
// import puppeteer, { Browser } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, getCSVPath, resetCSVFile, printAuditSummary, ExtractedData } from "./extractor";
// import { extractFromImage, ImageRow, buildExcel } from "./image-extractor";

// export type FileStatus =
//   | "pending"
//   | "downloading"
//   | "extracting"
//   | "done"
//   | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
//   imageData: ImageRow[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
//   imageData: [],
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

// /* ─── Category link discovery ─────────────────────────────── */

// interface CategoryLink {
//   label: string;   // display name, e.g. "University", "Engineering"
//   slug: string;    // folder name, e.g. "university", "engineering"
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
//           univ:              "University",
//           universityranking: "University",
//           engg:              "Engineering",
//           engineeringranking:"Engineering",
//           mgmt:              "Management",
//           managementranking: "Management",
//           pharma:            "Pharmacy",
//           pharmaranking:     "Pharmacy",
//           overall:           "Overall",
//           overallranking:    "Overall",
//           college:           "College",
//           collegeranking:    "College",
//           medical:           "Medical",
//           medicalranking:    "Medical",
//           law:               "Law",
//           lawranking:        "Law",
//           arch:              "Architecture",
//           archranking:       "Architecture",
//           dental:            "Dental",
//           dentalranking:     "Dental",
//           research:          "Research",
//           researchranking:   "Research",
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

// /* ─── Scrape PDF + image links from a category page ──────── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string
// ): Promise<PageLinks> {
//   const page = await browser.newPage();
//   try {
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     return await page.evaluate((y) => {
//       const pdfs: string[] = [];
//       const images: string[] = [];

//       document.querySelectorAll("a").forEach((a) => {
//         const href = a.getAttribute("href") ?? "";
//         if (!href) return;

//         if (
//           href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
//           href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
//         ) {
//           pdfs.push(href);
//         }

//         if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//           images.push(href);
//         }
//       });

//       return { pdfs, images };
//     }, year);
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Download + extract a single file ───────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   categoryLabel: string,
//   year: string,
//   csvPath: string,
//   imageXLSXPath: string
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     const ext = url.toLowerCase().split(".").pop() ?? "";

//     if (ext === "pdf") {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath, csvPath, year, categoryLabel);
//       downloadState.extractedData.push(extracted);

//       // ── per-PDF log now includes op_exp row count + warning flag ─────────
//       const opFlag = extracted.opExpRows === 0 ? "  ⚠ NO_OP_EXP" : "";
//       console.log(
//         `[PDF] ${extracted.instituteCode.padEnd(18)} | ` +
//         `${extracted.instituteName.substring(0, 40).padEnd(41)} | ` +
//         `${extracted.rowsWritten} rows | op_exp=${extracted.opExpRows}${opFlag}`
//       );
//     } else if (["jpg", "jpeg", "png"].includes(ext)) {
//       downloadState.files[fileIndex].status = "extracting";
//       const imgData = await extractFromImage(filePath);
//       if (imgData) {
//         downloadState.imageData.push(imgData);
//         fs.writeFileSync(imageXLSXPath, buildExcel(downloadState.imageData));
//       }
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── Main ────────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];
//   downloadState.imageData = [];

//   const baseFolder    = path.join(process.cwd(), "downloads", year);
//   const imageXLSXPath = path.join(baseFolder, "image-data.xlsx");

//   fs.mkdirSync(baseFolder, { recursive: true });

//   // Wipe the CSV so a fresh run starts clean (also resets auditMap)
//   resetCSVFile(baseFolder);
//   const csvPath = getCSVPath(baseFolder);

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     // Phase 1 — discover categories
//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(`[${year}] Categories:`, categories.map((c) => c.label));

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     // Phase 2 — pre-scan to get accurate total file count
//     console.log(`[${year}] Pre-scanning categories...`);
//     const categoryLinks: { pdfs: string[]; images: string[] }[] = [];

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
//       categoryLinks.push({ pdfs, images });
//       downloadState.categories[ci].total = pdfs.length + images.length;

//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
//       }

//       console.log(`[${year}/${cat.slug}] ${pdfs.length} PDFs, ${images.length} images`);
//     }

//     const totalFiles = downloadState.files.length;
//     let doneFiles = 0;
//     console.log(`[${year}] Total files: ${totalFiles}`);

//     // Phase 3 — download and extract
//     let fileOffset = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = categoryLinks[ci];

//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder   = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder,   { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(
//           pdfs[i], pdfFolder, fileOffset + i,
//           cat.label,
//           year, csvPath, imageXLSXPath
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(
//           images[i], imageFolder, fileOffset + pdfs.length + i,
//           cat.label,
//           year, csvPath, imageXLSXPath
//         );
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       fileOffset += pdfs.length + images.length;
//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(
//       `[${year}] Done. ${downloadState.extractedData.length} PDFs → nirf-pdf-data.csv | ` +
//       `${downloadState.imageData.length} images → image-data.xlsx`
//     );

//     // ── AUDIT: print Operational Expenditure row counts per institute ─────
//     printAuditSummary();

//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;

//     // Still print audit even if batch errored partway through
//     printAuditSummary();
//   } finally {
//     if (browser) await browser.close();
//   }
// }























// import axios from "axios";
// import puppeteer, { Browser, Page } from "puppeteer";
// import fs from "fs";
// import path from "path";
// import { extractFromPdf, getCSVPath, resetCSVFile, printAuditSummary, ExtractedData } from "./extractor";
// import { extractFromImage, ImageRow, buildExcel } from "./image-extractor";

// export type FileStatus =
//   | "pending"
//   | "downloading"
//   | "extracting"
//   | "done"
//   | "failed";

// export interface FileItem {
//   name: string;
//   status: FileStatus;
//   category: string;
// }

// export interface CategoryProgress {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// }

// export interface DownloadState {
//   progress: number;
//   currentCategory: string;
//   categories: CategoryProgress[];
//   files: FileItem[];
//   extractedData: ExtractedData[];
//   imageData: ImageRow[];
// }

// export const downloadState: DownloadState = {
//   progress: 0,
//   currentCategory: "",
//   categories: [],
//   files: [],
//   extractedData: [],
//   imageData: [],
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

// function labelFromSlug(raw: string): string {
//   const rules: [string, string][] = [
//     ["overall",      "Overall"],
//     ["engineering",  "Engineering"],
//     ["management",   "Management"],
//     ["university",   "University"],
//     ["college",      "College"],
//     ["medical",      "Medical"],
//     ["pharmacy",     "Pharmacy"],
//     ["pharma",       "Pharmacy"],
//     ["dental",       "Dental"],
//     ["law",          "Law"],
//     ["architecture", "Architecture"],
//     ["arch",         "Architecture"],
//     ["research",     "Research"],
//     ["innovation",   "Innovation"],
//     ["agriculture",  "Agriculture"],
//   ];
//   for (const [substr, label] of rules) {
//     if (raw.includes(substr)) return label;
//   }
//   return raw.charAt(0).toUpperCase() + raw.slice(1);
// }

// /* ─── Category link discovery ─────────────────────────────── */

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
//   const baseUrl  = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
//   const page     = await browser.newPage();

//   try {
//     await page.goto(indexUrl, { waitUntil: "networkidle2", timeout: 30000 });

//     const links = await page.evaluate(() => {
//       const results: { raw: string; href: string }[] = [];
//       const seen = new Set<string>();
//       document.querySelectorAll("div[class*='col-lg'] a").forEach((a) => {
//         const href = a.getAttribute("href")?.trim() ?? "";
//         if (!href || !href.endsWith(".html") || seen.has(href)) return;
//         const fileName = href.split("/").pop() ?? "";
//         const raw = fileName.replace(".html", "").toLowerCase();
//         seen.add(href);
//         results.push({ raw, href });
//       });
//       return results;
//     });

//     const seenLabels = new Set<string>();
//     const result: CategoryLink[] = [];

//     for (const { raw, href } of links) {
//       const label = labelFromSlug(raw);
//       if (seenLabels.has(label)) continue;
//       seenLabels.add(label);
//       const absoluteUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
//       result.push({ label, slug: slugify(label), url: absoluteUrl });
//     }

//     return result;
//   } finally {
//     await page.close();
//   }
// }

// /* ─── Collect links from current DataTables page ─────────── */

// async function collectLinksFromCurrentPage(
//   page: Page,
//   year: string
// ): Promise<{ pdfs: string[]; images: string[] }> {
//   return page.evaluate((y) => {
//     const pdfs: string[]   = [];
//     const images: string[] = [];
//     document.querySelectorAll("a[href]").forEach((el) => {
//       const a    = el as HTMLAnchorElement;
//       const href = a.href; // absolute URL
//       if (href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
//           href.includes(`/nirfpdfcdn/2017/`) ||
//           href.includes(`/nirfpdfcdn/2016/`)) {
//         pdfs.push(href);
//       }
//       if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
//         images.push(href);
//       }
//     });
//     return { pdfs, images };
//   }, year);
// }

// /* ─── Click through ALL DataTables pages, harvest every link ─
//  *
//  * DataTables removes non-visible rows from the DOM entirely (not just hides
//  * them with CSS). We must click the "Next" button on each page and collect
//  * links after each render.
//  *
//  * Strategy:
//  *   1. Collect links on page 1
//  *   2. Find the "Next" paging button — if it's disabled, we're done
//  *   3. Click Next, wait for re-render, collect links, repeat
//  *
//  * The Next button is identified by aria-label="Next" inside the dt-paging nav.
//  */
// async function collectAllLinksFromDataTable(
//   page: Page,
//   year: string,
//   label: string
// ): Promise<{ pdfs: string[]; images: string[] }> {
//   const allPdfs:   string[] = [];
//   const allImages: string[] = [];
//   const seen = new Set<string>();

//   const add = ({ pdfs, images }: { pdfs: string[]; images: string[] }) => {
//     for (const u of pdfs)   { if (!seen.has(u)) { seen.add(u); allPdfs.push(u); } }
//     for (const u of images) { if (!seen.has(u)) { seen.add(u); allImages.push(u); } }
//   };

//   let pageNum = 1;

//   while (true) {
//     // Collect links from currently rendered rows
//     const links = await collectLinksFromCurrentPage(page, year);
//     add(links);
//     console.log(
//       `    [page ${pageNum}] +${links.pdfs.length} PDFs, +${links.images.length} images` +
//       ` (running total: ${allPdfs.length} PDFs, ${allImages.length} images)`
//     );

//     // Check if "Next" button exists and is enabled
//     const nextDisabled = await page.evaluate(() => {
//       // DataTables Next button: button with aria-label="Next" inside .dt-paging
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       if (!btn) return true; // no button = single page
//       return btn.disabled || btn.getAttribute("aria-disabled") === "true" ||
//              btn.classList.contains("disabled");
//     });

//     if (nextDisabled) break; // no more pages

//     // Click Next and wait for DataTables to re-render
//     await page.evaluate(() => {
//       const btn = document.querySelector<HTMLButtonElement>(
//         "nav[aria-label='pagination'] button[aria-label='Next'], " +
//         ".dt-paging button[aria-label='Next'], " +
//         "button.dt-paging-button.next"
//       );
//       btn?.click();
//     });

//     // Wait for DOM update — DataTables re-renders synchronously after click
//     // but we give it a moment to settle
//     await new Promise((r) => setTimeout(r, 600));
//     pageNum++;

//     // Safety: bail out after 50 pages to avoid infinite loops
//     if (pageNum > 50) {
//       console.warn(`    [warn] Hit 50-page safety limit for ${label}`);
//       break;
//     }
//   }

//   return { pdfs: allPdfs, images: allImages };
// }

// /* ─── Discover static rank-band sub-pages ────────────────────
//  *
//  * For very large categories, NIRF also has static sibling HTML pages linked
//  * at the top-right as "Rank-band: 201-250", "Rank-band: 251-300".
//  * These are plain HTML links separate from DataTables pagination.
//  */
// async function discoverRankBandPages(
//   page: Page,
//   categoryUrl: string
// ): Promise<string[]> {
//   const baseUrl     = categoryUrl.substring(0, categoryUrl.lastIndexOf("/") + 1);
//   const currentFile = categoryUrl.split("/").pop() ?? "";

//   const subHrefs: string[] = await page.evaluate((current) => {
//     const hrefs: string[] = [];
//     document.querySelectorAll("a[href]").forEach((a) => {
//       const href = a.getAttribute("href")?.trim() ?? "";
//       const text = (a.textContent ?? "").trim().toLowerCase();
//       const file = href.split("/").pop() ?? "";
//       if (!href || !href.endsWith(".html")) return;
//       if (file === current)          return;
//       if (file.endsWith("ALL.html")) return;
//       if (text.includes("rank") && text.includes("band")) {
//         hrefs.push(href);
//       }
//     });
//     return [...new Set(hrefs)];
//   }, currentFile);

//   const subUrls = subHrefs.map((h) =>
//     h.startsWith("http") ? h : `${baseUrl}${h}`
//   );

//   if (subUrls.length > 0) {
//     console.log(
//       `  [rank-band ] ${subUrls.length} static sub-page(s): ` +
//       subUrls.map((u) => u.split("/").pop()).join(", ")
//     );
//   }
//   return subUrls;
// }

// /* ─── Full scrape: main page + rank-band sub-pages, each paginated ── */

// interface PageLinks {
//   pdfs: string[];
//   images: string[];
// }

// async function scrapePageLinks(
//   browser: Browser,
//   categoryUrl: string,
//   year: string,
//   categoryLabel: string
// ): Promise<PageLinks> {
//   const allPdfs:   string[] = [];
//   const allImages: string[] = [];
//   const seen = new Set<string>();

//   const addLinks = ({ pdfs, images }: PageLinks) => {
//     for (const u of pdfs)   { if (!seen.has(u)) { seen.add(u); allPdfs.push(u); } }
//     for (const u of images) { if (!seen.has(u)) { seen.add(u); allImages.push(u); } }
//   };

//   const page = await browser.newPage();
//   try {
//     const mainFile = categoryUrl.split("/").pop() ?? categoryUrl;

//     // ── Main page — click through all DataTables pages ──────────────────────
//     console.log(`  [scraping  ] ${mainFile}`);
//     await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });
//     addLinks(await collectAllLinksFromDataTable(page, year, mainFile));

//     // ── Static rank-band sub-pages ──────────────────────────────────────────
//     const subUrls = await discoverRankBandPages(page, categoryUrl);

//     for (const subUrl of subUrls) {
//       const subFile = subUrl.split("/").pop() ?? subUrl;
//       console.log(`  [scraping  ] ${subFile}`);
//       await page.goto(subUrl, { waitUntil: "networkidle2", timeout: 30000 });
//       addLinks(await collectAllLinksFromDataTable(page, year, subFile));
//     }

//     console.log(
//       `  [total     ] ${categoryLabel}: ${allPdfs.length} PDFs + ${allImages.length} images ` +
//       `= ${allPdfs.length + allImages.length} files`
//     );
//   } finally {
//     await page.close();
//   }

//   return { pdfs: allPdfs, images: allImages };
// }

// /* ─── Download + extract a single file ───────────────────── */

// async function downloadFile(
//   url: string,
//   destFolder: string,
//   fileIndex: number,
//   categoryLabel: string,
//   year: string,
//   csvPath: string,
//   imageXLSXPath: string
// ): Promise<void> {
//   try {
//     downloadState.files[fileIndex].status = "downloading";

//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
//     });

//     const filename = path.basename(new URL(url).pathname);
//     const filePath = path.join(destFolder, filename);
//     downloadState.files[fileIndex].name = filename;

//     if (!fs.existsSync(filePath)) {
//       const writer = fs.createWriteStream(filePath);
//       response.data.pipe(writer);
//       await new Promise<void>((resolve, reject) => {
//         writer.on("finish", resolve);
//         writer.on("error", reject);
//       });
//     }

//     const ext = url.toLowerCase().split(".").pop() ?? "";

//     if (ext === "pdf") {
//       downloadState.files[fileIndex].status = "extracting";
//       const extracted = await extractFromPdf(filePath, csvPath, year, categoryLabel);
//       downloadState.extractedData.push(extracted);
//       const opFlag = extracted.opExpRows === 0 ? "  ⚠ NO_OP_EXP" : "";
//       console.log(
//         `[PDF] ${extracted.instituteCode.padEnd(18)} | ` +
//         `${extracted.instituteName.substring(0, 40).padEnd(41)} | ` +
//         `${extracted.rowsWritten} rows | op_exp=${extracted.opExpRows}${opFlag}`
//       );
//     } else if (["jpg", "jpeg", "png"].includes(ext)) {
//       downloadState.files[fileIndex].status = "extracting";
//       const imgData = await extractFromImage(filePath);
//       if (imgData) {
//         downloadState.imageData.push(imgData);
//         fs.writeFileSync(imageXLSXPath, buildExcel(downloadState.imageData));
//       }
//     }

//     downloadState.files[fileIndex].status = "done";
//   } catch (err) {
//     console.error("Failed:", url, err);
//     downloadState.files[fileIndex].status = "failed";
//   }
// }

// /* ─── Main ────────────────────────────────────────────────── */

// export async function startDownload(year: string): Promise<void> {
//   downloadState.progress = 0;
//   downloadState.currentCategory = "";
//   downloadState.categories = [];
//   downloadState.files = [];
//   downloadState.extractedData = [];
//   downloadState.imageData = [];

//   const baseFolder    = path.join(process.cwd(), "downloads", year);
//   const imageXLSXPath = path.join(baseFolder, "image-data.xlsx");
//   fs.mkdirSync(baseFolder, { recursive: true });

//   resetCSVFile(baseFolder);
//   const csvPath = getCSVPath(baseFolder);

//   let browser: Browser | undefined;

//   try {
//     browser = await puppeteer.launch({ headless: true });

//     console.log(`[${year}] Discovering categories...`);
//     const categories = await discoverCategories(browser, year);

//     if (categories.length === 0) {
//       console.warn(`[${year}] No categories found`);
//       downloadState.progress = 100;
//       return;
//     }

//     console.log(`[${year}] Categories:`, categories.map((c) => `${c.label} (${c.slug})`));

//     downloadState.categories = categories.map((c) => ({
//       name: c.label,
//       slug: c.slug,
//       total: 0,
//       done: 0,
//       status: "pending" as const,
//     }));

//     console.log(`[${year}] Pre-scanning all categories...`);
//     const categoryLinks: PageLinks[] = [];

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       console.log(`\n[${year}/${cat.slug}] Scanning...`);
//       const { pdfs, images } = await scrapePageLinks(browser, cat.url, year, cat.label);
//       categoryLinks.push({ pdfs, images });
//       downloadState.categories[ci].total = pdfs.length + images.length;

//       for (let i = 0; i < pdfs.length + images.length; i++) {
//         downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
//       }
//     }

//     const totalFiles = downloadState.files.length;
//     let doneFiles = 0;
//     console.log(`\n[${year}] Grand total: ${totalFiles} files to download`);

//     let fileOffset = 0;

//     for (let ci = 0; ci < categories.length; ci++) {
//       const cat = categories[ci];
//       const { pdfs, images } = categoryLinks[ci];

//       downloadState.currentCategory = cat.label;
//       downloadState.categories[ci].status = "active";

//       const pdfFolder   = path.join(baseFolder, cat.slug, "pdf");
//       const imageFolder = path.join(baseFolder, cat.slug, "image");
//       fs.mkdirSync(pdfFolder,   { recursive: true });
//       fs.mkdirSync(imageFolder, { recursive: true });

//       for (let i = 0; i < pdfs.length; i++) {
//         await downloadFile(pdfs[i], pdfFolder, fileOffset + i, cat.label, year, csvPath, imageXLSXPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       for (let i = 0; i < images.length; i++) {
//         await downloadFile(images[i], imageFolder, fileOffset + pdfs.length + i, cat.label, year, csvPath, imageXLSXPath);
//         doneFiles++;
//         downloadState.categories[ci].done++;
//         downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
//       }

//       fileOffset += pdfs.length + images.length;
//       downloadState.categories[ci].status = "done";
//       console.log(`[${year}/${cat.slug}] Complete`);
//     }

//     downloadState.progress = 100;
//     console.log(
//       `\n[${year}] Done. ${downloadState.extractedData.length} PDFs → nirf-pdf-data.csv | ` +
//       `${downloadState.imageData.length} images → image-data.xlsx`
//     );
//     printAuditSummary();

//   } catch (err) {
//     console.error("startDownload error:", err);
//     downloadState.progress = 100;
//     printAuditSummary();
//   } finally {
//     if (browser) await browser.close();
//   }
// }
































import axios from "axios";
import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import { extractFromPdf, getCSVPath, resetCSVFile, printAuditSummary, ExtractedData } from "./extractor";
import { extractFromImage, ImageRow, buildExcel } from "./image-extractor";

export type FileStatus =
  | "pending"
  | "downloading"
  | "extracting"
  | "done"
  | "failed";

export interface FileItem {
  name: string;
  status: FileStatus;
  category: string;
}

export interface CategoryProgress {
  name: string;
  slug: string;
  total: number;
  done: number;
  status: "pending" | "active" | "done";
}

export interface DownloadState {
  progress: number;
  currentCategory: string;
  categories: CategoryProgress[];
  files: FileItem[];
  extractedData: ExtractedData[];
  imageData: ImageRow[];
}

export const downloadState: DownloadState = {
  progress: 0,
  currentCategory: "",
  categories: [],
  files: [],
  extractedData: [],
  imageData: [],
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

/* ─── Category link discovery — UNCHANGED from working version ─────────────
 * Uses exact-match map inside page.evaluate so all 16 categories are found.
 * Unknown filenames fall through as raw slug (no deduplication).
 */
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
  const baseUrl  = indexUrl.substring(0, indexUrl.lastIndexOf("/") + 1);
  const page     = await browser.newPage();

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

        // Exact-match map — preserves all categories including ones with
        // longer filenames like "pharmacyranking", "architectureranking"
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
          // 2024 additions
          stateuniranking:     "State University",
          openuniversity:      "Open University",
          openuniranking:      "Open University",
          skilluniversity:     "Skill University",
          skilluniranking:     "Skill University",
        };

        const label = map[raw] ?? raw; // fallback: use raw slug as label
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

/* ─── Collect PDF + image links from currently visible DataTable rows ─────── */

async function collectLinksFromCurrentPage(
  page: Page,
  year: string
): Promise<{ pdfs: string[]; images: string[] }> {
  return page.evaluate((y) => {
    const pdfs:   string[] = [];
    const images: string[] = [];
    document.querySelectorAll("a[href]").forEach((el) => {
      const a    = el as HTMLAnchorElement;
      const href = a.href; // absolute URL — works regardless of relative/absolute attribute
      if (href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
          href.includes(`/nirfpdfcdn/2017/`) ||
          href.includes(`/nirfpdfcdn/2016/`)) {
        pdfs.push(href);
      }
      if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
        images.push(href);
      }
    });
    return { pdfs, images };
  }, year);
}

/* ─── Click through ALL DataTables pages, harvest links from each ────────────
 *
 * DataTables (used on NIRF category pages) removes non-current-page rows
 * from the DOM entirely — they are NOT just hidden with CSS. Each page shows
 * 100 rows. We must click "Next" and re-scrape after each render.
 *
 * The Next button is identified by aria-label="Next" inside the dt-paging nav
 * (confirmed from DevTools inspection of the live page).
 */
async function collectAllLinksFromDataTable(
  page: Page,
  year: string,
  label: string
): Promise<{ pdfs: string[]; images: string[] }> {
  const allPdfs:   string[] = [];
  const allImages: string[] = [];
  const seen = new Set<string>();

  const add = ({ pdfs, images }: { pdfs: string[]; images: string[] }) => {
    for (const u of pdfs)   { if (!seen.has(u)) { seen.add(u); allPdfs.push(u); } }
    for (const u of images) { if (!seen.has(u)) { seen.add(u); allImages.push(u); } }
  };

  let pageNum = 1;

  while (true) {
    const links = await collectLinksFromCurrentPage(page, year);
    add(links);
    console.log(
      `    [dt-page ${pageNum}] +${links.pdfs.length} PDFs, +${links.images.length} images` +
      ` (total so far: ${allPdfs.length} PDFs, ${allImages.length} images)`
    );

    // Check if Next button exists and is enabled
    const nextDisabled: boolean = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        "nav[aria-label='pagination'] button[aria-label='Next'], " +
        ".dt-paging button[aria-label='Next'], " +
        "button.dt-paging-button.next"
      );
      if (!btn) return true;
      return btn.disabled ||
             btn.getAttribute("aria-disabled") === "true" ||
             btn.classList.contains("disabled");
    });

    if (nextDisabled) break;

    // Click Next and wait for DataTables to re-render the new rows
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        "nav[aria-label='pagination'] button[aria-label='Next'], " +
        ".dt-paging button[aria-label='Next'], " +
        "button.dt-paging-button.next"
      );
      btn?.click();
    });

    await new Promise((r) => setTimeout(r, 800));
    pageNum++;

    if (pageNum > 50) {
      console.warn(`    [warn] 50-page safety limit hit for "${label}"`);
      break;
    }
  }

  return { pdfs: allPdfs, images: allImages };
}

/* ─── Discover static rank-band sub-pages ────────────────────────────────────
 *
 * Some categories have additional STATIC HTML sub-pages linked at the top-right
 * as "Rank-band: 201-250", "Rank-band: 251-300". These are separate from
 * DataTables pagination and must be scraped independently.
 */
async function discoverRankBandPages(
  page: Page,
  categoryUrl: string
): Promise<string[]> {
  const baseUrl     = categoryUrl.substring(0, categoryUrl.lastIndexOf("/") + 1);
  const currentFile = categoryUrl.split("/").pop() ?? "";

  const subHrefs: string[] = await page.evaluate((current) => {
    const hrefs: string[] = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href")?.trim() ?? "";
      const text = (a.textContent ?? "").trim().toLowerCase();
      const file = href.split("/").pop() ?? "";
      if (!href || !href.endsWith(".html")) return;
      if (file === current)          return; // skip self
      if (file.endsWith("ALL.html")) return; // skip participant list
      if (text.includes("rank") && text.includes("band")) {
        hrefs.push(href);
      }
    });
    return [...new Set(hrefs)];
  }, currentFile);

  const subUrls = subHrefs.map((h) =>
    h.startsWith("http") ? h : `${baseUrl}${h}`
  );

  if (subUrls.length > 0) {
    console.log(
      `  [rank-band ] ${subUrls.length} static sub-page(s): ` +
      subUrls.map((u) => u.split("/").pop()).join(", ")
    );
  }
  return subUrls;
}

/* ─── Full scrape for one category: paginate DataTable + rank-band sub-pages ─ */

interface PageLinks {
  pdfs: string[];
  images: string[];
}

async function scrapePageLinks(
  browser: Browser,
  categoryUrl: string,
  year: string,
  categoryLabel: string
): Promise<PageLinks> {
  const allPdfs:   string[] = [];
  const allImages: string[] = [];
  const seen = new Set<string>();

  const addLinks = ({ pdfs, images }: PageLinks) => {
    for (const u of pdfs)   { if (!seen.has(u)) { seen.add(u); allPdfs.push(u); } }
    for (const u of images) { if (!seen.has(u)) { seen.add(u); allImages.push(u); } }
  };

  const page = await browser.newPage();
  try {
    const mainFile = categoryUrl.split("/").pop() ?? categoryUrl;

    // ── Main page: paginate through all DataTables pages ───────────────────
    console.log(`  [scraping  ] ${mainFile}`);
    await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });
    addLinks(await collectAllLinksFromDataTable(page, year, mainFile));

    // ── Static rank-band sub-pages (each also paginated) ───────────────────
    const subUrls = await discoverRankBandPages(page, categoryUrl);
    for (const subUrl of subUrls) {
      const subFile = subUrl.split("/").pop() ?? subUrl;
      console.log(`  [scraping  ] ${subFile}`);
      await page.goto(subUrl, { waitUntil: "networkidle2", timeout: 30000 });
      addLinks(await collectAllLinksFromDataTable(page, year, subFile));
    }

    console.log(
      `  [✓ total   ] ${categoryLabel}: ${allPdfs.length} PDFs + ${allImages.length} images` +
      ` = ${allPdfs.length + allImages.length} files`
    );
  } finally {
    await page.close();
  }

  return { pdfs: allPdfs, images: allImages };
}

/* ─── Download + extract a single file ───────────────────── */

async function downloadFile(
  url: string,
  destFolder: string,
  fileIndex: number,
  categoryLabel: string,
  year: string,
  csvPath: string,
  imageXLSXPath: string
): Promise<void> {
  try {
    downloadState.files[fileIndex].status = "downloading";

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
    });

    const filename = path.basename(new URL(url).pathname);
    const filePath = path.join(destFolder, filename);
    downloadState.files[fileIndex].name = filename;

    if (!fs.existsSync(filePath)) {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    }

    const ext = url.toLowerCase().split(".").pop() ?? "";

    if (ext === "pdf") {
      downloadState.files[fileIndex].status = "extracting";
      const extracted = await extractFromPdf(filePath, csvPath, year, categoryLabel);
      downloadState.extractedData.push(extracted);
      const opFlag = extracted.opExpRows === 0 ? "  ⚠ NO_OP_EXP" : "";
      console.log(
        `[PDF] ${extracted.instituteCode.padEnd(18)} | ` +
        `${extracted.instituteName.substring(0, 40).padEnd(41)} | ` +
        `${extracted.rowsWritten} rows | op_exp=${extracted.opExpRows}${opFlag}`
      );
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      downloadState.files[fileIndex].status = "extracting";
      const imgData = await extractFromImage(filePath);
      if (imgData) {
        downloadState.imageData.push(imgData);
        fs.writeFileSync(imageXLSXPath, buildExcel(downloadState.imageData));
      }
    }

    downloadState.files[fileIndex].status = "done";
  } catch (err) {
    console.error("Failed:", url, err);
    downloadState.files[fileIndex].status = "failed";
  }
}

/* ─── Main ────────────────────────────────────────────────── */

export async function startDownload(year: string): Promise<void> {
  downloadState.progress = 0;
  downloadState.currentCategory = "";
  downloadState.categories = [];
  downloadState.files = [];
  downloadState.extractedData = [];
  downloadState.imageData = [];

  const baseFolder    = path.join(process.cwd(), "downloads", year);
  const imageXLSXPath = path.join(baseFolder, "image-data.xlsx");
  fs.mkdirSync(baseFolder, { recursive: true });

  resetCSVFile(baseFolder);
  const csvPath = getCSVPath(baseFolder);

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({ headless: true });

    // Phase 1 — discover categories (unchanged logic from working version)
    console.log(`[${year}] Discovering categories...`);
    const categories = await discoverCategories(browser, year);

    if (categories.length === 0) {
      console.warn(`[${year}] No categories found`);
      downloadState.progress = 100;
      return;
    }

    console.log(`[${year}] Categories (${categories.length}):`, categories.map((c) => c.label));

    downloadState.categories = categories.map((c) => ({
      name: c.label,
      slug: c.slug,
      total: 0,
      done: 0,
      status: "pending" as const,
    }));

    // Phase 2 — pre-scan: paginate DataTables + follow rank-band sub-pages
    console.log(`[${year}] Pre-scanning categories...`);
    const categoryLinks: PageLinks[] = [];

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      console.log(`\n[${year}] Scanning: ${cat.label}`);
      const { pdfs, images } = await scrapePageLinks(browser, cat.url, year, cat.label);
      categoryLinks.push({ pdfs, images });
      downloadState.categories[ci].total = pdfs.length + images.length;

      for (let i = 0; i < pdfs.length + images.length; i++) {
        downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
      }
    }

    const totalFiles = downloadState.files.length;
    let doneFiles = 0;
    console.log(`\n[${year}] Grand total: ${totalFiles} files`);

    // Phase 3 — download and extract
    let fileOffset = 0;

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      const { pdfs, images } = categoryLinks[ci];

      downloadState.currentCategory = cat.label;
      downloadState.categories[ci].status = "active";

      const pdfFolder   = path.join(baseFolder, cat.slug, "pdf");
      const imageFolder = path.join(baseFolder, cat.slug, "image");
      fs.mkdirSync(pdfFolder,   { recursive: true });
      fs.mkdirSync(imageFolder, { recursive: true });

      for (let i = 0; i < pdfs.length; i++) {
        await downloadFile(
          pdfs[i], pdfFolder, fileOffset + i,
          cat.label, year, csvPath, imageXLSXPath
        );
        doneFiles++;
        downloadState.categories[ci].done++;
        downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
      }

      for (let i = 0; i < images.length; i++) {
        await downloadFile(
          images[i], imageFolder, fileOffset + pdfs.length + i,
          cat.label, year, csvPath, imageXLSXPath
        );
        doneFiles++;
        downloadState.categories[ci].done++;
        downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
      }

      fileOffset += pdfs.length + images.length;
      downloadState.categories[ci].status = "done";
      console.log(`[${year}/${cat.slug}] Complete`);
    }

    downloadState.progress = 100;
    console.log(
      `\n[${year}] Done. ${downloadState.extractedData.length} PDFs → nirf-pdf-data.csv | ` +
      `${downloadState.imageData.length} images → image-data.xlsx`
    );
    printAuditSummary();

  } catch (err) {
    console.error("startDownload error:", err);
    downloadState.progress = 100;
    printAuditSummary();
  } finally {
    if (browser) await browser.close();
  }
}