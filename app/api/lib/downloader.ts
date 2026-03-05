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







import axios from "axios";
import puppeteer, { Browser } from "puppeteer";
import fs from "fs";
import path from "path";
import { extractFromPdf, getCSVPath, resetCSVFile, ExtractedData } from "./extractor";
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

/* ─── Category link discovery ─────────────────────────────── */

interface CategoryLink {
  label: string;   // display name, e.g. "University", "Engineering"
  slug: string;    // folder name, e.g. "university", "engineering"
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
          univ:              "University",
          universityranking: "University",
          engg:              "Engineering",
          engineeringranking:"Engineering",
          mgmt:              "Management",
          managementranking: "Management",
          pharma:            "Pharmacy",
          pharmaranking:     "Pharmacy",
          overall:           "Overall",
          overallranking:    "Overall",
          college:           "College",
          collegeranking:    "College",
          medical:           "Medical",
          medicalranking:    "Medical",
          law:               "Law",
          lawranking:        "Law",
          arch:              "Architecture",
          archranking:       "Architecture",
          dental:            "Dental",
          dentalranking:     "Dental",
          research:          "Research",
          researchranking:   "Research",
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

/* ─── Scrape PDF + image links from a category page ──────── */

interface PageLinks {
  pdfs: string[];
  images: string[];
}

async function scrapePageLinks(
  browser: Browser,
  categoryUrl: string,
  year: string
): Promise<PageLinks> {
  const page = await browser.newPage();
  try {
    await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 30000 });

    return await page.evaluate((y) => {
      const pdfs: string[] = [];
      const images: string[] = [];

      document.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        if (!href) return;

        if (
          href.includes(`/nirfpdfcdn/${y}/pdf/`) ||
          href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
          href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
        ) {
          pdfs.push(href);
        }

        if (href.includes(`/nirfpdfcdn/${y}/graph/`)) {
          images.push(href);
        }
      });

      return { pdfs, images };
    }, year);
  } finally {
    await page.close();
  }
}

/* ─── Download + extract a single file ───────────────────── */

async function downloadFile(
  url: string,
  destFolder: string,
  fileIndex: number,
  categoryLabel: string,  // full display name, e.g. "Overall", "University"
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
      // Parse PDF → append rows to nirf-pdf-data.csv immediately
      downloadState.files[fileIndex].status = "extracting";
      const extracted = await extractFromPdf(filePath, csvPath, year, categoryLabel);
      downloadState.extractedData.push(extracted);
      console.log(
        `[PDF] ${extracted.instituteCode} | ${extracted.instituteName} | ${extracted.rowsWritten} rows written`
      );
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      // Parse image → rewrite image-data.xlsx immediately
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

  // Wipe the CSV so a fresh run starts clean
  resetCSVFile(baseFolder);
  const csvPath = getCSVPath(baseFolder);

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({ headless: true });

    // Phase 1 — discover categories
    console.log(`[${year}] Discovering categories...`);
    const categories = await discoverCategories(browser, year);

    if (categories.length === 0) {
      console.warn(`[${year}] No categories found`);
      downloadState.progress = 100;
      return;
    }

    console.log(`[${year}] Categories:`, categories.map((c) => c.label));

    downloadState.categories = categories.map((c) => ({
      name: c.label,
      slug: c.slug,
      total: 0,
      done: 0,
      status: "pending" as const,
    }));

    // Phase 2 — pre-scan to get accurate total file count
    console.log(`[${year}] Pre-scanning categories...`);
    const categoryLinks: { pdfs: string[]; images: string[] }[] = [];

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      const { pdfs, images } = await scrapePageLinks(browser, cat.url, year);
      categoryLinks.push({ pdfs, images });
      downloadState.categories[ci].total = pdfs.length + images.length;

      for (let i = 0; i < pdfs.length + images.length; i++) {
        downloadState.files.push({ name: "pending...", status: "pending", category: cat.slug });
      }

      console.log(`[${year}/${cat.slug}] ${pdfs.length} PDFs, ${images.length} images`);
    }

    const totalFiles = downloadState.files.length;
    let doneFiles = 0;
    console.log(`[${year}] Total files: ${totalFiles}`);

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
          cat.label,   // ← full display name goes into the CSV "Category" column
          year, csvPath, imageXLSXPath
        );
        doneFiles++;
        downloadState.categories[ci].done++;
        downloadState.progress = Math.round((doneFiles / totalFiles) * 100);
      }

      for (let i = 0; i < images.length; i++) {
        await downloadFile(
          images[i], imageFolder, fileOffset + pdfs.length + i,
          cat.label,
          year, csvPath, imageXLSXPath
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
      `[${year}] Done. ${downloadState.extractedData.length} PDFs → nirf-pdf-data.csv | ` +
      `${downloadState.imageData.length} images → image-data.xlsx`
    );
  } catch (err) {
    console.error("startDownload error:", err);
    downloadState.progress = 100;
  } finally {
    if (browser) await browser.close();
  }
}