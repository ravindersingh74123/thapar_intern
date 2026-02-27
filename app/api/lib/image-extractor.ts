/**
 * image-extractor.ts  –  calls paddle_extract.py to OCR NIRF score-card images
 *
 * Prerequisites:
 *   pip install paddleocr paddlepaddle openpyxl Pillow
 *   Copy scripts/paddle_extract.py to your project root's scripts/ folder.
 */

import { execFile, exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);
const execAsync     = promisify(exec);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImageRow {
  year: string;
  category: string;
  instituteName: string;
  instituteCode: string;
  [key: string]: string;
}

interface PythonRow {
  year: string;
  category: string;
  institute_name: string;
  institute_code: string;
  table: Record<string, { score: string; total: string }>;
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "paddle_extract.py");

// ── Python executable detection ───────────────────────────────────────────────

let _pythonExe: string | null = null;

const PADDLE_ENV = {
  ...process.env,
  PYTHONUTF8: "1",
};

async function resolvePython(): Promise<string> {
  if (_pythonExe) return _pythonExe;

  const candidates = ["python", "python3", "py"];

  for (const exe of candidates) {
    try {
      const { stdout } = await execAsync(
        `${exe} -c "import easyocr; print('ok')"`,
        { timeout: 15_000, env: PADDLE_ENV }
      );
      if (stdout.trim() === "ok") {
        console.log(`[image-extractor] Python: ${exe}`);
        _pythonExe = exe;
        return exe;
      }
    } catch { /* try next */ }
  }

  // Fallback: use sys.executable from whichever python is on PATH
  for (const exe of candidates) {
    try {
      const { stdout: exePath } = await execAsync(
        `${exe} -c "import sys; print(sys.executable)"`,
        { timeout: 5_000 }
      );
      const fullExe = exePath.trim();
      if (!fullExe) continue;

      const { stdout } = await execAsync(
        `"${fullExe}" -c "import easyocr; print('ok')"`,
        { timeout: 15_000, env: PADDLE_ENV }
      );
      if (stdout.trim() === "ok") {
        console.log(`[image-extractor] Python (full path): ${fullExe}`);
        _pythonExe = fullExe;
        return fullExe;
      }
    } catch { /* try next */ }
  }

  // Last resort: just use python and hope for the best
  console.warn(
    "[image-extractor] Could not verify paddleocr import. " +
    "Falling back to 'python'. Run: pip install paddleocr paddlepaddle openpyxl Pillow"
  );
  _pythonExe = "python";
  return "python";
}

// ── Run the Python script ─────────────────────────────────────────────────────

async function runPaddleScript(
  input: string,
  jsonOut: string,
  xlsxOut: string
): Promise<void> {
  const exe = await resolvePython();

  // PaddleOCR v3 is slow to initialise — allow 3 minutes per call
  await execFileAsync(
    exe,
    [SCRIPT_PATH, input, "--json", jsonOut, "--output", xlsxOut],
    { timeout: 180_000, env: PADDLE_ENV }
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractFromImage(
  filePath: string
): Promise<ImageRow | null> {
  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error(`[image-extractor] Script not found: ${SCRIPT_PATH}`);
    return null;
  }

  const tmpJson = filePath + ".paddle_out.json";
  const tmpXlsx = filePath + ".paddle_tmp.xlsx";

  try {
    await runPaddleScript(filePath, tmpJson, tmpXlsx);
  } catch (err) {
    // Even if the process exited non-zero, the JSON may have been written
    console.error(`[image-extractor] Script error for ${path.basename(filePath)}:`, (err as Error).message?.split("\n")[0]);
  }

  try {
    if (!fs.existsSync(tmpJson)) return null;
    const raw: PythonRow[] = JSON.parse(fs.readFileSync(tmpJson, "utf8"));
    if (!raw.length) return null;
    return toImageRow(raw[0]);
  } catch (parseErr) {
    console.error(`[image-extractor] JSON parse error:`, parseErr);
    return null;
  } finally {
    for (const tmp of [tmpJson, tmpXlsx]) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
    }
  }
}

export async function extractFromFolder(
  folderPath: string
): Promise<ImageRow[]> {
  const tmpJson = path.join(folderPath, "_paddle_out.json");
  const tmpXlsx = path.join(folderPath, "_paddle_tmp.xlsx");

  try {
    await runPaddleScript(folderPath, tmpJson, tmpXlsx);
  } catch (err) {
    console.error(`[image-extractor] Script error for folder:`, (err as Error).message?.split("\n")[0]);
  }

  try {
    if (!fs.existsSync(tmpJson)) return [];
    const raw: PythonRow[] = JSON.parse(fs.readFileSync(tmpJson, "utf8"));
    return raw.map(toImageRow);
  } catch {
    return [];
  } finally {
    for (const tmp of [tmpJson, tmpXlsx]) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toImageRow(r: PythonRow): ImageRow {
  const row: ImageRow = {
    year:          r.year           ?? "",
    category:      r.category       ?? "",
    instituteName: r.institute_name ?? "",
    instituteCode: r.institute_code ?? "",
  };
  for (const [header, { score, total }] of Object.entries(r.table ?? {})) {
    row[`${header}_score`] = score ?? "";
    row[`${header}_total`] = total ?? "";
  }
  return row;
}

function getDynamicHeaders(rows: ImageRow[]): string[] {
  const seen = new Set<string>();
  const scoreKeys: string[] = [];
  const totalKeys: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (["year","category","instituteName","instituteCode"].includes(key)) continue;
      if (!seen.has(key)) {
        seen.add(key);
        if (key.endsWith("_score"))      scoreKeys.push(key);
        else if (key.endsWith("_total")) totalKeys.push(key);
      }
    }
  }
  return [...scoreKeys, ...totalKeys];
}

export function buildExcel(rows: ImageRow[]): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");

  const dynKeys   = getDynamicHeaders(rows);
  const fixedKeys = ["year", "category", "instituteName", "instituteCode"];
  const allKeys   = [...fixedKeys, ...dynKeys];

  const toLabel = (k: string) =>
    ({ year: "Year", category: "Category",
       instituteName: "Institute Name", instituteCode: "Institute Code",
    } as Record<string, string>)[k]
    ?? k.replace(/_score$/, " Score").replace(/_total$/, " Total");

  const wsData = [
    allKeys.map(toLabel),
    ...rows.map(r => allKeys.map(k => r[k] ?? "")),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = allKeys.map(k => ({
    wch: Math.min(
      Math.max(toLabel(k).length, ...rows.map(r => String(r[k] ?? "").length)) + 2,
      40
    ),
  }));
  XLSX.utils.book_append_sheet(wb, ws, "NIRF Scores");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}