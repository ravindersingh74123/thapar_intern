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




import axios from "axios";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { extractFromPdf, ExtractedData } from "./extractor"

export type FileStatus = "pending" | "downloading" | "extracting" | "done";

export interface FileItem {
  name: string;
  status: FileStatus;
}

export interface DownloadState {
  progress: number;
  files: FileItem[];
  extractedData: ExtractedData[];
}

export const downloadState: DownloadState = {
  progress: 0,
  files: [],
  extractedData: [],
};

/* ─── helpers ─────────────────────────────────────────── */

function createWritePromise(stream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

function getFileNameFromUrl(url: string): string {
  const u = new URL(url);
  return path.basename(u.pathname);
}

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}

/* ─── download + extract a single file ───────────────── */

async function downloadFile(
  url: string,
  folder: string,
  index: number,
  total: number,
  extractionOutputPath: string
) {
  try {
    downloadState.files[index].status = "downloading";

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NIRF-Downloader/1.0)" },
    });

    const filename = getFileNameFromUrl(url);
    const filePath = path.join(folder, filename);

    downloadState.files[index].name = filename;

    // Download the file
    if (!fs.existsSync(filePath)) {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      await createWritePromise(writer);
    }

    // Extract data immediately if it's a PDF
    if (isPdf(url)) {
      downloadState.files[index].status = "extracting";

      const extracted = await extractFromPdf(filePath);
      downloadState.extractedData.push(extracted);

      // Append to the running JSON file so data is never lost
      fs.writeFileSync(extractionOutputPath, JSON.stringify(downloadState.extractedData, null, 2));
    }

    downloadState.files[index].status = "done";
  } catch (err) {
    console.error("Failed:", url, err);
    downloadState.files[index].status = "done";
  }
}

/* ─── main ────────────────────────────────────────────── */

export async function startDownload(
  websiteUrl: string,
  year: string
): Promise<void> {
  downloadState.progress = 0;
  downloadState.files = [];
  downloadState.extractedData = [];

  const baseFolder = path.join(process.cwd(), "downloads", year);
  const pdfFolder = path.join(baseFolder, "university-pdf");
  const imageFolder = path.join(baseFolder, "university-image");
  const extractionOutputPath = path.join(baseFolder, "extracted-data.json");

  fs.mkdirSync(pdfFolder, { recursive: true });
  fs.mkdirSync(imageFolder, { recursive: true });

  // Start with an empty extraction file
  fs.writeFileSync(extractionOutputPath, "[]");

  let browser;

  if (year === "2016") {
    websiteUrl = "https://www.nirfindia.org/Rankings/2016/univ.html";
  }

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(websiteUrl, { waitUntil: "networkidle2" });

    const links = await page.evaluate((year) => {
      const pdfs: string[] = [];
      const images: string[] = [];

      document.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;

        if (
          href.includes(`/nirfpdfcdn/${year}/pdf/`) ||
          href.includes("https://www.nirfindia.org/nirfpdfcdn/2017/") ||
          href.includes("https://www.nirfindia.org/nirfpdfcdn/2016/")
        ) {
          pdfs.push(href);
        }

        if (href.includes(`/nirfpdfcdn/${year}/graph/`)) {
          images.push(href);
        }
      });

      return { pdfs, images };
    }, year);

    const pdfLinks = links.pdfs;
    const imageLinks = links.images;
    console.log(`Found ${pdfLinks.length} PDFs and ${imageLinks.length} images`);

    const total = pdfLinks.length + imageLinks.length;

    if (total === 0) {
      downloadState.progress = 100;
      return;
    }

    downloadState.files = new Array(total).fill(null).map(() => ({
      name: "pending...",
      status: "pending",
    }));

    let index = 0;

    // Download PDFs — extract immediately after each one
    for (const pdf of pdfLinks) {
      await downloadFile(pdf, pdfFolder, index, total, extractionOutputPath);
      index++;
      downloadState.progress = Math.round((index / total) * 100);
    }

    // Download images (no extraction needed)
    for (const img of imageLinks) {
      await downloadFile(img, imageFolder, index, total, extractionOutputPath);
      index++;
      downloadState.progress = Math.round((index / total) * 100);
    }

    console.log(
      `Extraction complete. ${downloadState.extractedData.length} records saved to ${extractionOutputPath}`
    );

    downloadState.progress = 100;
  } catch (err) {
    console.error("startDownload error:", err);
    downloadState.progress = 100;
  } finally {
    if (browser) await browser.close();
  }
}