import fs from "fs";
import path from "path";

// Dynamically import pdfjs-dist so Next.js webpack never statically analyses
// or bundles it. Combined with serverExternalPackages it stays in node_modules.
async function getPdfText(filePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs" as any);

  // disableWorker=true makes pdfjs run entirely in the main thread — no worker
  // file needed at all.
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str)
      .join(" ") + "\n";
  }

  return text;
}

export interface SponsoredResearch {
  year: string;
  totalProjects: string;
  totalFundingAgencies: string;
  totalAmountReceived: string;
}

export interface ConsultancyProject {
  year: string;
  totalProjects: string;
  totalClientOrgs: string;
  totalAmountReceived: string;
}

export interface ExtractedData {
  filename: string;
  instituteName?: string;
  instituteCode?: string;
  sponsoredResearch?: SponsoredResearch[];
  consultancyProjects?: ConsultancyProject[];
  error?: string;
}

/* ─── helpers ─────────────────────────────────────────── */

function extractBetween(text: string, start: string, end: string): string {
  const regex = new RegExp(`${start}([\\s\\S]*?)${end}`, "i");
  return text.match(regex)?.[1]?.trim() ?? "";
}

function parseInstituteMeta(text: string) {
  const m = text.match(/Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]/i);
  return m ? { name: m[1].trim(), code: m[2].trim() } : {};
}

/* ─── sponsored research ───────────────────────────────── */

function parseSponsoredResearch(text: string): SponsoredResearch[] | undefined {
  const section = extractBetween(
    text,
    "Sponsored Research Details",
    "Consultancy Project Details"
  );
  if (!section) return undefined;

  const yearMatch = section.match(
    /(\d{4}-\d{2,4})\s+(\d{4}-\d{2,4})(?:\s+(\d{4}-\d{2,4}))?/
  );
  const years = yearMatch ? yearMatch.slice(1).filter(Boolean) : [];
  if (!years.length) return undefined;

  const projects = section
    .match(/Total\s+no\.\s+of\s+Sponsored\s+Projects\s+([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  const agencies = section
    .match(/Total\s+no\.\s+of\s+Funding\s+Agencies\s+([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  const amounts = section
    .match(/Total\s+Amount\s+Received[^\d]*([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  return years.map((year, i) => ({
    year,
    totalProjects: projects[i] ?? "N/A",
    totalFundingAgencies: agencies[i] ?? "N/A",
    totalAmountReceived: amounts[i] ?? "N/A",
  }));
}

/* ─── consultancy projects ─────────────────────────────── */

function parseConsultancyProjects(
  text: string
): ConsultancyProject[] | undefined {
  const section = extractBetween(
    text,
    "Consultancy Project Details",
    "Executive Development Program"
  );
  if (!section) return undefined;

  const yearMatch = section.match(
    /(\d{4}-\d{2,4})\s+(\d{4}-\d{2,4})(?:\s+(\d{4}-\d{2,4}))?/
  );
  const years = yearMatch ? yearMatch.slice(1).filter(Boolean) : [];
  if (!years.length) return undefined;

  const projects = section
    .match(/Total\s+no\.\s+of\s+Consultancy\s+Projects\s+([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  const clients = section
    .match(/Total\s+no\.\s+of\s+Client\s+Organ[^\d]*([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  const amounts = section
    .match(/Total\s+Amount\s+Received[^\d]*([\d\s]+)/i)?.[1]
    ?.trim()
    .split(/\s+/) ?? [];

  return years.map((year, i) => ({
    year,
    totalProjects: projects[i] ?? "N/A",
    totalClientOrgs: clients[i] ?? "N/A",
    totalAmountReceived: amounts[i] ?? "N/A",
  }));
}

/* ─── main export ──────────────────────────────────────── */

export async function extractFromPdf(filePath: string): Promise<ExtractedData> {
  const filename = path.basename(filePath);
  try {
    const text = await getPdfText(filePath);
    const meta = parseInstituteMeta(text);

    return {
      filename,
      instituteName: meta.name,
      instituteCode: meta.code,
      sponsoredResearch: parseSponsoredResearch(text),
      consultancyProjects: parseConsultancyProjects(text),
    };
  } catch (err) {
    return { filename, error: String(err) };
  }
}