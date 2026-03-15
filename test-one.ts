import { extractFromPdf, getCSVPath } from "./app/api/lib/extractor";

const PDF  = process.argv[2];
const CSV  = getCSVPath("downloads/test");
const YEAR = process.argv[3] ?? "2023";
const CAT  = process.argv[4] ?? "Test";

if (!PDF) {
  console.error("Usage: npx ts-node test-one.ts <path/to/file.pdf>");
  process.exit(1);
}

extractFromPdf(PDF, CSV, YEAR, CAT).then(r => {
  console.log("\nResult:", r);
  console.log("CSV written to:", CSV);
}).catch(console.error);