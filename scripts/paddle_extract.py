# WORKING FOR 2025 AND 2024

# # -*- coding: utf-8 -*-
# """
# nirf_extract.py  -  NIRF score-card image -> Excel extractor
# Install: pip install pytesseract openpyxl Pillow
# Tesseract binary: https://github.com/UB-Mannheim/tesseract/wiki
# Usage: python scripts/paddle_extract.py <image_or_folder> [--output out.xlsx] [--workers N]
# """

# import io, os, sys, re, json, argparse
# from pathlib import Path
# from concurrent.futures import ThreadPoolExecutor, as_completed
# import multiprocessing

# if hasattr(sys.stdout, "reconfigure"):
#     sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# else:
#     sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# # TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# TESSERACT_CMD = None


# def setup_tesseract():
#     import pytesseract
#     if TESSERACT_CMD:
#         pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
#     else:
#         default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
#         if os.path.exists(default):
#             pytesseract.pytesseract.tesseract_cmd = default
#     return pytesseract


# def open_image(path):
#     from PIL import Image
#     return Image.open(path).convert("RGB")

# def to_numpy(img):
#     import numpy as np
#     return np.array(img)


# # ── ORIGINAL border detection (was working) ───────────────────────────────────

# def find_borders(arr):
#     import numpy as np
#     h, w = arr.shape[:2]
#     threshold = w * 0.3
#     borders = []
#     in_border = False
#     for y in range(h):
#         row = arr[y]
#         dark = int(np.sum((row[:,0] < 100) & (row[:,1] < 100) & (row[:,2] < 100)))
#         if dark > threshold:
#             if not in_border:
#                 borders.append(y)
#                 in_border = True
#         else:
#             in_border = False
#     return borders


# # ── ORIGINAL OCR helpers (were working) ──────────────────────────────────────

# def ocr_band_text(pytesseract, band_img, digits_only=False):
#     from PIL import Image
#     import numpy as np
#     w, h = band_img.size
#     band_img = band_img.resize((w * 3, h * 3), Image.LANCZOS)
#     gray = band_img.convert("L")
#     arr = np.array(gray)
#     if arr.mean() < 128:
#         gray = gray.point(lambda x: 255 - x)
#     config = "--psm 7 -c tessedit_char_whitelist=" + (
#         "0123456789. " if digits_only else
#         "ABCDEFGHIJKLMNOPQRSTUVWXYZ+. 0123456789"
#     )
#     return pytesseract.image_to_string(gray, config=config).strip()


# def ocr_band_data(pytesseract, band_img):
#     from PIL import Image
#     import numpy as np
#     w, h = band_img.size
#     band_img = band_img.resize((w * 3, h * 3), Image.LANCZOS)
#     gray = band_img.convert("L")
#     arr = np.array(gray)
#     if arr.mean() < 128:
#         gray = gray.point(lambda x: 255 - x)
#     config = "--psm 11 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ+.0123456789"
#     data = pytesseract.image_to_data(
#         gray, config=config, output_type=pytesseract.Output.DICT
#     )
#     items = []
#     for i, text in enumerate(data["text"]):
#         text = text.strip()
#         if not text or data["conf"][i] < 10:
#             continue
#         x_center = (data["left"][i] + data["width"][i] / 2) / 3
#         items.append((x_center, text))
#     items.sort(key=lambda t: t[0])
#     return items


# GROUP_HEADERS = {"TLR", "RP", "GO", "OI"}
# ROW_LABELS    = {"SCORE", "TOTAL", "RANK"}

# # Known NIRF column headers — used to correct common OCR misreads
# KNOWN_COLS = {
#     "SS", "FSR", "FQE", "FRU", "OE+MIR", "OE",
#     "PU", "QP", "IPR", "FPPP", "SDG",
#     "GUE", "GPHD",
#     "RD", "WD", "ESCS", "PCS",
#     "PR", "MS", "GPH", "PERCEPTION",
# }

# # Maps common tesseract misreads -> correct token
# OCR_FIXES = {
#     "S5": "SS", "5S": "SS", "S$": "SS", "55": "SS",
#     "W0": "WD", "VVD": "WD", "WO": "WD", "W0": "WD",
#     "FQF": "FQE", "FRO": "FRU", "FR0": "FRU",
#     "1PR": "IPR", "lPR": "IPR",
#     "GU3": "GUE",
#     "P5": "PCS", "PC5": "PCS",
#     "E5CS": "ESCS", "ESC5": "ESCS",
#     "0E+MIR": "OE+MIR", "OE-MIR": "OE+MIR",
#     "5DG": "SDG", "SDC": "SDG", "5DC": "SDG",
# }

# def fix_ocr(tok):
#     """Correct common tesseract misreads for NIRF column headers."""
#     t = tok.upper().replace(" ", "")
#     if t in OCR_FIXES:
#         return OCR_FIXES[t]
#     return t

# def is_float(s):
#     try:
#         float(s)
#         return True
#     except ValueError:
#         return False

# def is_col_header(tok):
#     t = fix_ocr(tok)
#     if t in GROUP_HEADERS or t in ROW_LABELS:
#         return False
#     # Accept known cols directly
#     if t in KNOWN_COLS:
#         return True
#     # Also accept any 2-8 uppercase letter token
#     return bool(re.fullmatch(r"[A-Z+]{2,8}", t))


# def match_by_x(header_items, value_items):
#     result = {}
#     used = set()
#     for hx, htext in header_items:
#         best_dist, best_idx = float("inf"), None
#         for i, (vx, _) in enumerate(value_items):
#             if i in used:
#                 continue
#             dist = abs(hx - vx)
#             if dist < best_dist:
#                 best_dist, best_idx = dist, i
#         if best_idx is not None:
#             used.add(best_idx)
#             result[htext] = value_items[best_idx][1]
#     return result


# def extract_one(image_path):
#     pytesseract = setup_tesseract()
#     import numpy as np

#     img = open_image(image_path)
#     arr = to_numpy(img)
#     h, w = arr.shape[:2]

#     # ── Institute code from filename (always correct) ─────────────────────────
#     fname = Path(image_path).stem
#     institute_code = fname if re.match(r"IR-[A-Z]-[A-Z]-\d+", fname) else ""

#     # ── Institute name: find title row by scanning top 80px for non-white ─────
#     title_start = title_end = None
#     for y in range(min(80, h)):
#         non_white = int(np.sum(~((arr[y,:,0] > 220) & (arr[y,:,1] > 220) & (arr[y,:,2] > 220))))
#         if non_white > 20:
#             if title_start is None:
#                 title_start = y
#             title_end = y
#     if title_start is None:
#         title_start, title_end = 15, 32

#     # Crop with padding and upscale for tesseract
#     t1, t2 = max(0, title_start - 4), min(h, title_end + 4)
#     title_crop = img.crop((0, t1, w, t2))
#     tw, th = title_crop.size
#     title_big = title_crop.resize((tw * 4, th * 4), __import__('PIL').Image.LANCZOS)
#     gray = title_big.convert("L")
#     # PSM 7 = single line, no whitelist so lowercase is allowed
#     title_text = pytesseract.image_to_string(gray, config="--psm 7").strip()

#     # Extract name = text before "(IR-...)"
#     m = re.search(r"(.+?)\s*\(IR-[A-Z]-[A-Z]-\d+\)", title_text)
#     if m:
#         institute_name = m.group(1).strip()
#     else:
#         lines = [l.strip() for l in title_text.splitlines() if len(l.strip()) > 4]
#         institute_name = max(lines, key=len) if lines else ""

#     # ── ORIGINAL table extraction (unchanged) ─────────────────────────────────
#     borders = find_borders(arr)
#     if len(borders) < 4:
#         borders = [int(h*0.357), int(h*0.390), int(h*0.425), int(h*0.459)]

#     b0, b1, b2, b3 = borders[0], borders[1], borders[2], borders[3]
#     pad = 3

#     col_img   = img.crop((0, b1+pad, w, b2-pad))
#     score_img = img.crop((0, b2+pad, w, b3-pad))
#     total_img = img.crop((0, b3+pad, w, min(b3+48, h)))

#     col_items   = ocr_band_data(pytesseract, col_img)
#     score_items = ocr_band_data(pytesseract, score_img)
#     total_items = ocr_band_data(pytesseract, total_img)

#     header_items = [(x, fix_ocr(t)) for x, t in col_items if is_col_header(t)]
#     score_vals   = [(x, t)         for x, t in score_items if is_float(t)]
#     total_vals   = [(x, t)         for x, t in total_items if is_float(t)]

#     score_map = match_by_x(header_items, score_vals)
#     total_map = match_by_x(header_items, total_vals)

#     table = {
#         hname: {"score": score_map.get(hname, ""), "total": total_map.get(hname, "")}
#         for _, hname in header_items
#     }

#     parts = Path(image_path).resolve().parts
#     year = category = ""
#     for i, p in enumerate(parts):
#         if p == "image" and i >= 2:
#             year, category = parts[i-2], parts[i-1]
#             break

#     n_cols   = len(table)
#     n_scores = sum(1 for v in table.values() if v["score"])
#     flag     = " MISMATCH" if n_cols != n_scores and n_cols > 0 else " OK"

#     return {
#         "image_path":     image_path,
#         "year":           year,
#         "category":       category,
#         "institute_name": institute_name,
#         "institute_code": institute_code,
#         "table":          table,
#         "_msg":           f"  {institute_code} | {institute_name[:40] if institute_name else '?'} | cols={n_cols} scores={n_scores}{flag}",
#     }


# IMAGE_EXTS = {".jpg", ".jpeg", ".png"}

# def collect_images(path):
#     p = Path(os.path.normpath(path))
#     if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
#         return [str(p)]
#     if p.is_dir():
#         imgs = []
#         for ext in IMAGE_EXTS:
#             imgs.extend(str(f) for f in p.rglob(f"*{ext}"))
#         imgs.sort()
#         return imgs
#     print(f"Path not found: {p}", file=sys.stderr)
#     return []


# def build_excel(rows, output_path):
#     from openpyxl import Workbook
#     from openpyxl.styles import Font, PatternFill, Alignment

#     header_fill  = PatternFill("solid", fgColor="1F4E79")
#     header_font  = Font(color="FFFFFF", bold=True)
#     alt_fill     = PatternFill("solid", fgColor="D9E1F2")
#     center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

#     all_headers, seen_h = [], set()
#     for row in rows:
#         for hk in row.get("table", {}):
#             if hk not in seen_h:
#                 seen_h.add(hk)
#                 all_headers.append(hk)

#     fixed_cols = ["Year", "Category", "Institute Name", "Institute Code"]
#     all_cols   = fixed_cols \
#                + [f"{h} Score" for h in all_headers] \
#                + [f"{h} Total" for h in all_headers]

#     wb = Workbook()
#     ws = wb.active
#     ws.title = "NIRF Scores"

#     for ci, col in enumerate(all_cols, 1):
#         cell = ws.cell(row=1, column=ci, value=col)
#         cell.fill = header_fill
#         cell.font = header_font
#         cell.alignment = center_align
#     ws.row_dimensions[1].height = 30

#     for ri, row in enumerate(rows, 2):
#         tbl  = row.get("table", {})
#         fill = alt_fill if ri % 2 == 0 else PatternFill()
#         vals = [
#             row.get("year", ""),
#             row.get("category", ""),
#             row.get("institute_name", ""),
#             row.get("institute_code", ""),
#         ] + [tbl.get(h, {}).get("score", "") for h in all_headers] \
#           + [tbl.get(h, {}).get("total", "") for h in all_headers]

#         for ci, val in enumerate(vals, 1):
#             cell = ws.cell(row=ri, column=ci, value=val)
#             cell.fill = fill
#             cell.alignment = Alignment(horizontal="center", vertical="center")

#     for ci in range(1, len(all_cols) + 1):
#         col_letter = ws.cell(row=1, column=ci).column_letter
#         max_len = max(
#             len(str(ws.cell(row=1, column=ci).value or "")),
#             *(len(str(ws.cell(row=ri, column=ci).value or "")) for ri in range(2, len(rows)+2))
#         )
#         ws.column_dimensions[col_letter].width = min(max_len + 2, 40)

#     ws.freeze_panes = "A2"
#     wb.save(output_path)
#     print(f"\nDone. Saved {len(rows)} rows -> {output_path}", flush=True)


# def main():
#     parser = argparse.ArgumentParser(description="Extract NIRF score-card table data")
#     parser.add_argument("input",     help="Image file or folder (recursive)")
#     parser.add_argument("--output",  "-o", default="nirf_scores.xlsx")
#     parser.add_argument("--json",    "-j", default=None)
#     parser.add_argument("--workers", "-w", type=int,
#                         default=min(8, multiprocessing.cpu_count()),
#                         help="Parallel threads (default: min(8, cpu_count))")
#     args = parser.parse_args()

#     images = collect_images(args.input)
#     if not images:
#         print(f"No images found at: {args.input}", file=sys.stderr)
#         sys.exit(1)

#     n = len(images)
#     w = min(args.workers, n)
#     print(f"Found {n} image(s). Running with {w} thread(s)...\n", flush=True)

#     try:
#         pyt = setup_tesseract()
#         from PIL import Image as PILImage
#         import numpy as np
#         test = PILImage.fromarray(np.ones((10,10,3), dtype=np.uint8)*255)
#         pyt.image_to_string(test)
#         print("Tesseract ready.\n", flush=True)
#     except Exception as e:
#         print(f"\nERROR: Tesseract not found: {e}", file=sys.stderr)
#         print("Install from: https://github.com/UB-Mannheim/tesseract/wiki", file=sys.stderr)
#         print("Then add to PATH or set TESSERACT_CMD at top of this script.", file=sys.stderr)
#         sys.exit(1)

#     rows_by_path = {}
#     done = 0

#     with ThreadPoolExecutor(max_workers=w) as exe:
#         futures = {exe.submit(extract_one, p): p for p in images}
#         for fut in as_completed(futures):
#             done += 1
#             img_path = futures[fut]
#             try:
#                 row = fut.result()
#                 msg = row.pop("_msg", "")
#                 rows_by_path[img_path] = row
#                 print(f"[{done}/{n}] {Path(img_path).name}{msg}", flush=True)
#             except Exception as e:
#                 print(f"[{done}/{n}] ERROR {Path(img_path).name}: {e}", flush=True)

#     rows = [rows_by_path[p] for p in images if p in rows_by_path]

#     if args.json:
#         with open(args.json, "w", encoding="utf-8") as f:
#             json.dump(rows, f, indent=2, ensure_ascii=False)
#         print(f"JSON -> {args.json}", flush=True)

#     if not rows:
#         print("No rows extracted.", flush=True)
#         sys.exit(0)

#     build_excel(rows, args.output)


# if __name__ == "__main__":
#     main()

















#LATEST WORKING FOR 2023



# -*- coding: utf-8 -*-
"""
nirf_extract.py  -  NIRF score-card image -> Excel extractor

Install:  pip install pytesseract openpyxl Pillow
Tesseract binary: https://github.com/UB-Mannheim/tesseract/wiki

How it works:
  JPG (2025) -> thick dark borders -> pad=3, scale=3, standard grayscale OCR
  PNG (2023) -> thin light borders -> pad=0, scale=8
             -> per-column OCR using max-channel binarization (thresh=155)
                removes colored bar-chart bleed from score/total cells
             -> smart_fix_decimal recovers missing decimal points

Usage:
  python scripts/paddle_extract.py <image_or_folder> [--output out.xlsx] [--workers N]
"""

import io, os, sys, re, json, argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSERACT_CMD = None


def setup_tesseract():
    import pytesseract
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    else:
        default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(default):
            pytesseract.pytesseract.tesseract_cmd = default
    return pytesseract


def open_image(path):
    from PIL import Image
    return Image.open(path).convert("RGB")

def to_numpy(img):
    import numpy as np
    return np.array(img)


# ── Border detection ──────────────────────────────────────────────────────────

def find_dark_borders(arr):
    """Thick dark horizontal lines — JPG/2025 style."""
    import numpy as np
    h, w = arr.shape[:2]
    borders, in_b = [], False
    for y in range(int(h * 0.25), h):
        dark = int(np.sum((arr[y,:,0]<100)&(arr[y,:,1]<100)&(arr[y,:,2]<100)))
        if dark > w * 0.3:
            if not in_b: borders.append(y); in_b = True
        else: in_b = False
    return borders


def find_light_borders(arr):
    """Thin uniform light-gray lines — PNG/2023 style. Returns deduped list."""
    import numpy as np
    h, w = arr.shape[:2]
    raw, in_b = [], False
    for y in range(int(h * 0.25), h):
        row = arr[y]
        std = float(row.std(axis=0).mean())
        nw  = int(np.sum((row[:,0]>200)&(row[:,1]>200)&(row[:,2]>200)))
        if std < 15 and nw > w * 0.85:
            if not in_b: raw.append(y); in_b = True
        else: in_b = False
    deduped = []
    for b in raw:
        if not deduped or b - deduped[-1] >= 20:
            deduped.append(b)
    return deduped


def get_band_borders(arr):
    """
    Returns (img_type, pad, scale, b0, b1, b2, b3, b4).
    JPG: pad=3, scale=3
    PNG: pad=0, scale=8
    """
    import numpy as np
    h = arr.shape[0]

    dark = find_dark_borders(arr)
    if len(dark) >= 4:
        b0, b1, b2, b3 = dark[0], dark[1], dark[2], dark[3]
        b4 = min(b3 + 50, h)
        return 'jpg', 3, 3, b0, b1, b2, b3, b4
    else:
        light = find_light_borders(arr)
        inner = light[1:] if len(light) >= 6 else light
        if len(inner) >= 5:
            b0, b1, b2, b3, b4 = inner[0], inner[1], inner[2], inner[3], inner[4]
        else:
            b0 = int(h*0.323); b1 = int(h*0.357)
            b2 = int(h*0.390); b3 = int(h*0.425); b4 = int(h*0.459)
        return 'png', 0, 8, b0, b1, b2, b3, b4


# ── Column header OCR (full-band) ─────────────────────────────────────────────

def ocr_headers(pytesseract, pil_crop, scale):
    """OCR header band. Returns [(x_center, text), ...] sorted left to right."""
    from PIL import Image
    import numpy as np

    w, h = pil_crop.size
    if w < 1 or h < 1:
        return []

    up   = pil_crop.resize((w * scale, h * scale), Image.LANCZOS)
    gray = up.convert("L")
    arr  = np.array(gray)
    if arr.mean() < 128:
        gray = gray.point(lambda x: 255 - x)

    config = "--psm 11 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ+.0123456789"
    data   = pytesseract.image_to_data(gray, config=config,
                                       output_type=pytesseract.Output.DICT)
    items = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if not text or data["conf"][i] < 10:
            continue
        xc = (data["left"][i] + data["width"][i] / 2) / scale
        items.append((xc, text))

    items.sort(key=lambda t: t[0])
    return items


# ── Per-column value OCR (max-channel binarization) ───────────────────────────

def ocr_col_value(arr, t_band, b_band, x1, x2, img_w, scale=8, thresh=155):
    """
    OCR a single score/total cell using max-channel binarization.

    Max-channel binarization:  for each pixel, take max(R,G,B).
    If max < thresh -> black (text pixel).  Else -> white (background).

    This cleanly separates near-black text from colored bar-chart bleed
    even when the bar overlaps the score cell.

    thresh=155:  experimentally found to capture all digit strokes while
                 eliminating colored backgrounds.
    """
    from PIL import Image
    import numpy as np

    margin = (x2 - x1) * 0.3     # 30% overlap into neighbors for context
    x1w = max(0,   int(x1 - margin))
    x2w = min(img_w, int(x2 + margin))

    cell = arr[t_band:b_band, x1w:x2w, :]
    if cell.shape[0] < 3 or cell.shape[1] < 3:
        return ''

    pil = Image.fromarray(cell)
    cw, ch = pil.size

    # LANCZOS upscale preserves sub-pixel detail
    up_rgb = pil.resize((cw * scale, ch * scale), Image.LANCZOS)
    up_arr = np.array(up_rgb)

    # Max-channel binarize: isolate near-black text
    r  = up_arr[:, :, 0].astype(int)
    g  = up_arr[:, :, 1].astype(int)
    b  = up_arr[:, :, 2].astype(int)
    max_ch = np.maximum(np.maximum(r, g), b)
    clean  = np.where(max_ch < thresh, 0, 255).astype('uint8')

    pil_clean = Image.fromarray(clean)
    pytesseract = setup_tesseract()

    data = pytesseract.image_to_data(
        pil_clean,
        config="--psm 11 -c tessedit_char_whitelist=.0123456789",
        output_type=pytesseract.Output.DICT
    )

    # Collect all tokens, rank by proximity to column center
    col_cx = (x1 + x2) / 2
    items  = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if not text:
            continue
        xc = (data["left"][i] + data["width"][i] / 2) / scale + x1w
        items.append((abs(xc - col_cx), text))

    if not items:
        return ''
    items.sort()
    return items[0][1]


# ── JPG value OCR (standard grayscale full-band) ──────────────────────────────

def ocr_band_jpg(pytesseract, pil_crop, scale):
    """Standard grayscale PSM-11 OCR for JPG score/total bands."""
    from PIL import Image
    import numpy as np

    w, h = pil_crop.size
    if w < 1 or h < 1:
        return []

    up   = pil_crop.resize((w * scale, h * scale), Image.LANCZOS)
    gray = up.convert("L")
    arr  = np.array(gray)
    if arr.mean() < 128:
        gray = gray.point(lambda x: 255 - x)

    config = "--psm 11 -c tessedit_char_whitelist=.0123456789"
    data   = pytesseract.image_to_data(gray, config=config,
                                       output_type=pytesseract.Output.DICT)
    items = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if not text or data["conf"][i] < 10:
            continue
        xc = (data["left"][i] + data["width"][i] / 2) / scale
        items.append((xc, text))

    items.sort(key=lambda t: t[0])
    return items


# ── Post-processing ───────────────────────────────────────────────────────────

def smart_fix_decimal(s):
    """
    Recover missing decimal point in NIRF score/total values.
    NIRF format: always exactly 2 decimal places (X.XX or XX.XX).

    '2747'  -> '27.47'  (4 digits: dd.dd)
    '1760'  -> '17.60'  (4 digits: dd.dd)
    '593'   -> '5.93'   (3 digits: d.dd)
    '17.60' -> '17.60'  (unchanged — already correct)
    """
    s = s.strip()
    if not s:
        return s
    if re.fullmatch(r'\d+\.\d+', s):
        return s      # already has decimal
    if s.isdigit():
        n = len(s)
        if n >= 3:
            return s[:-2] + '.' + s[-2:]   # insert before last 2 digits
        if n == 2:
            return s[0] + '.' + s[1]
    return s


# ── Column header classification & OCR correction ────────────────────────────

GROUP_HEADERS = {"TLR", "RP", "GO", "OI"}
ROW_LABELS    = {"SCORE", "TOTAL", "RANK"}

KNOWN_COLS = {
    "SS", "FSR", "FQE", "FRU", "OE+MIR", "OE",
    "PU", "QP", "IPR", "FPPP", "SDG",
    "GPH", "GUE", "MS", "GPHD",
    "RD", "WD", "ESCS", "PCS",
    "PR", "PERCEPTION",
}

OCR_FIXES = {
    "S5":  "SS",       "5S":  "SS",      "S$": "SS",     "55": "SS",
    "W0":  "WD",       "VVD": "WD",      "WO": "WD",
    "FQF": "FQE",      "FOE": "FQE",     "FDE": "FQE",
    "FRO": "FRU",      "FR0": "FRU",
    "1PR": "IPR",      "lPR": "IPR",
    "GU3": "GUE",
    "P5":  "PCS",      "PC5": "PCS",
    "E5CS":"ESCS",     "ESC5":"ESCS",
    "0E+MIR":"OE+MIR", "OE-MIR":"OE+MIR","OE+MR":"OE+MIR",
    "5DG": "SDG",      "SDC": "SDG",
    "M5":  "MS",       "GP H":"GPH",
    "OP":  "QP",       "OF":  "OE",
}

def fix_ocr(tok):
    t = tok.upper().replace(" ", "")
    return OCR_FIXES.get(t, t)

def is_float(s):
    try: float(s); return True
    except ValueError: return False

def is_col_header(tok):
    t = fix_ocr(tok)
    if t in GROUP_HEADERS or t in ROW_LABELS:
        return False
    if t in KNOWN_COLS:
        return True
    return bool(re.fullmatch(r"[A-Z+]{2,8}", t))


# ── Per-image extraction ──────────────────────────────────────────────────────

def extract_one(image_path):
    pytesseract = setup_tesseract()
    import numpy as np
    from PIL import Image as PILImage

    img = open_image(image_path)
    arr = to_numpy(img)
    h, w = arr.shape[:2]

    # ── Institute code ────────────────────────────────────────────────────────
    fname = Path(image_path).stem
    institute_code = fname if re.match(r"IR-[A-Z]-[A-Z]-\d+", fname) else ""

    # ── Institute name ────────────────────────────────────────────────────────
    title_start = title_end = None
    for y in range(min(80, h)):
        nw = int(np.sum(~((arr[y,:,0]>220)&(arr[y,:,1]>220)&(arr[y,:,2]>220))))
        if nw > 20:
            if title_start is None: title_start = y
            title_end = y
    if title_start is None:
        title_start, title_end = 15, 32

    t1, t2 = max(0, title_start - 4), min(h, title_end + 4)
    title_crop = img.crop((0, t1, w, t2))
    tw, th = title_crop.size
    title_big  = title_crop.resize((tw * 4, th * 4), PILImage.LANCZOS)
    title_text = pytesseract.image_to_string(title_big.convert("L"), config="--psm 7").strip()

    m = re.search(r"(.+?)\s*\(IR-[A-Z]-[A-Z]-\d+\)", title_text)
    if m:
        institute_name = m.group(1).strip()
    else:
        lines = [l.strip() for l in title_text.splitlines() if len(l.strip()) > 4]
        institute_name = max(lines, key=len) if lines else ""
    institute_name = re.sub(r"^[^A-Za-z]+", "", institute_name).strip()

    # ── Band borders ──────────────────────────────────────────────────────────
    img_type, pad, scale, b0, b1, b2, b3, b4 = get_band_borders(arr)

    # ── Crop bands ────────────────────────────────────────────────────────────
    col_pil = img.crop((0, b1 + pad, w, b2 - pad))

    # ── OCR column headers (full-band LANCZOS) ────────────────────────────────
    col_items    = ocr_headers(pytesseract, col_pil, scale)
    header_items = [(x, fix_ocr(t)) for x, t in col_items if is_col_header(t)]

    if not header_items:
        n_cols = n_scores = 0
        table  = {}
        return {
            "image_path": image_path, "year": "", "category": "",
            "institute_name": institute_name, "institute_code": institute_code,
            "table": table,
            "_msg": f"  [{img_type.upper()}] {institute_code} | {institute_name[:38] or '?'} | cols=0 scores=0 MISMATCH",
        }

    # ── Compute column x-boundaries ───────────────────────────────────────────
    x_centers = [xc for xc, _ in header_items]
    x_bounds  = (
        [0]
        + [(x_centers[i] + x_centers[i+1]) / 2 for i in range(len(x_centers) - 1)]
        + [w]
    )

    # ── OCR score and total rows ───────────────────────────────────────────────
    table = {}

    if img_type == 'png':
        # PNG: per-column max-channel binarization
        # Removes colored bar-chart bleed that overlaps into score cells
        for i, (hx, hname) in enumerate(header_items):
            x1, x2 = x_bounds[i], x_bounds[i + 1]

            score_raw = ocr_col_value(arr, b2, b3, x1, x2, w, scale=8, thresh=155)
            total_raw = ocr_col_value(arr, b3, b4, x1, x2, w, scale=8, thresh=155)

            score_val = smart_fix_decimal(score_raw)
            total_val = smart_fix_decimal(total_raw)

            table[hname] = {
                "score": score_val if is_float(score_val) else "",
                "total": total_val if is_float(total_val) else "",
            }

    else:
        # JPG: full-band standard grayscale OCR
        score_pil  = img.crop((0, b2 + pad, w, b3 - pad))
        total_pil  = img.crop((0, b3 + pad, w, b4 - pad))

        score_items = ocr_band_jpg(pytesseract, score_pil, scale)
        total_items = ocr_band_jpg(pytesseract, total_pil, scale)

        def match_by_x(header_items, value_items):
            result, used = {}, set()
            for hx, htext in header_items:
                best_dist, best_idx = float("inf"), None
                for i, (vx, _) in enumerate(value_items):
                    if i in used: continue
                    dist = abs(hx - vx)
                    if dist < best_dist:
                        best_dist, best_idx = dist, i
                if best_idx is not None:
                    used.add(best_idx)
                    result[htext] = value_items[best_idx][1]
            return result

        score_map = match_by_x(header_items, [(x, v) for x, v in score_items if is_float(v)])
        total_map = match_by_x(header_items, [(x, v) for x, v in total_items if is_float(v)])

        for _, hname in header_items:
            table[hname] = {
                "score": score_map.get(hname, ""),
                "total": total_map.get(hname, ""),
            }

    # ── Year / category from folder structure ─────────────────────────────────
    parts = Path(image_path).resolve().parts
    year = category = ""
    for i, p in enumerate(parts):
        if p == "image" and i >= 2:
            year, category = parts[i-2], parts[i-1]
            break

    n_cols   = len(table)
    n_scores = sum(1 for v in table.values() if v["score"])
    flag     = " MISMATCH" if n_cols != n_scores and n_cols > 0 else " OK"

    return {
        "image_path":     image_path,
        "year":           year,
        "category":       category,
        "institute_name": institute_name,
        "institute_code": institute_code,
        "table":          table,
        "_msg":           f"  [{img_type.upper()}] {institute_code} | {institute_name[:38] if institute_name else '?'} | cols={n_cols} scores={n_scores}{flag}",
    }


# ── Collect images ────────────────────────────────────────────────────────────

IMAGE_EXTS = {".jpg", ".jpeg", ".png"}

def collect_images(path):
    p = Path(os.path.normpath(path))
    if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
        return [str(p)]
    if p.is_dir():
        imgs = []
        for ext in IMAGE_EXTS:
            imgs.extend(str(f) for f in p.rglob(f"*{ext}"))
        imgs.sort()
        return imgs
    print(f"Path not found: {p}", file=sys.stderr)
    return []


# ── Build Excel ───────────────────────────────────────────────────────────────

def build_excel(rows, output_path):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    header_fill = PatternFill("solid", fgColor="1F4E79")
    header_font = Font(color="FFFFFF", bold=True)
    alt_fill    = PatternFill("solid", fgColor="D9E1F2")

    all_headers, seen_h = [], set()
    for row in rows:
        for hk in row.get("table", {}):
            if hk not in seen_h:
                seen_h.add(hk); all_headers.append(hk)

    fixed_cols = ["Year", "Category", "Institute Name", "Institute Code"]
    all_cols   = (fixed_cols
                  + [f"{h} Score" for h in all_headers]
                  + [f"{h} Total" for h in all_headers])

    wb = Workbook()
    ws = wb.active
    ws.title = "NIRF Scores"

    for ci, col in enumerate(all_cols, 1):
        cell = ws.cell(row=1, column=ci, value=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 30

    for ri, row in enumerate(rows, 2):
        tbl  = row.get("table", {})
        fill = alt_fill if ri % 2 == 0 else PatternFill()
        vals = ([row.get("year",""), row.get("category",""),
                 row.get("institute_name",""), row.get("institute_code","")]
                + [tbl.get(h, {}).get("score", "") for h in all_headers]
                + [tbl.get(h, {}).get("total", "") for h in all_headers])
        for ci, val in enumerate(vals, 1):
            cell = ws.cell(row=ri, column=ci, value=val)
            cell.fill = fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

    for ci in range(1, len(all_cols) + 1):
        col_letter = ws.cell(row=1, column=ci).column_letter
        max_len = max(
            len(str(ws.cell(row=1, column=ci).value or "")),
            *(len(str(ws.cell(row=ri, column=ci).value or "")) for ri in range(2, len(rows)+2))
        )
        ws.column_dimensions[col_letter].width = min(max_len + 2, 40)

    ws.freeze_panes = "A2"
    wb.save(output_path)
    print(f"\nDone. Saved {len(rows)} rows -> {output_path}", flush=True)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extract NIRF score-card table data")
    parser.add_argument("input",     help="Image file or folder (recursive)")
    parser.add_argument("--output",  "-o", default="nirf_scores.xlsx")
    parser.add_argument("--json",    "-j", default=None)
    parser.add_argument("--workers", "-w", type=int,
                        default=min(8, multiprocessing.cpu_count()),
                        help="Parallel threads (default: min(8, cpu_count))")
    args = parser.parse_args()

    images = collect_images(args.input)
    if not images:
        print(f"No images found at: {args.input}", file=sys.stderr)
        sys.exit(1)

    n = len(images)
    w = min(args.workers, n)
    print(f"Found {n} image(s). Running with {w} thread(s)...\n", flush=True)

    try:
        pyt = setup_tesseract()
        from PIL import Image as PILImage
        import numpy as np
        pyt.image_to_string(PILImage.fromarray(np.ones((10,10,3), dtype=np.uint8)*255))
        print("Tesseract ready.\n", flush=True)
    except Exception as e:
        print(f"\nERROR: Tesseract not found: {e}", file=sys.stderr)
        print("Install from: https://github.com/UB-Mannheim/tesseract/wiki", file=sys.stderr)
        sys.exit(1)

    rows_by_path = {}
    done = 0

    with ThreadPoolExecutor(max_workers=w) as exe:
        futures = {exe.submit(extract_one, p): p for p in images}
        for fut in as_completed(futures):
            done += 1
            img_path = futures[fut]
            try:
                row = fut.result()
                msg = row.pop("_msg", "")
                rows_by_path[img_path] = row
                print(f"[{done}/{n}] {Path(img_path).name}{msg}", flush=True)
            except Exception as e:
                print(f"[{done}/{n}] ERROR {Path(img_path).name}: {e}", flush=True)

    rows = [rows_by_path[p] for p in images if p in rows_by_path]

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2, ensure_ascii=False)
        print(f"JSON -> {args.json}", flush=True)

    if not rows:
        print("No rows extracted.", flush=True)
        sys.exit(0)

    build_excel(rows, args.output)


if __name__ == "__main__":
    main()