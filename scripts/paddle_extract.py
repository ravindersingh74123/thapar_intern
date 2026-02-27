# -*- coding: utf-8 -*-
"""
nirf_extract.py  -  NIRF score-card image -> Excel extractor
Uses EasyOCR. Install: pip install easyocr openpyxl Pillow

Usage:
    python scripts/paddle_extract.py <image_or_folder> [--output out.xlsx] [--json out.json]
"""

import io, os, sys, re, json, argparse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# ── OCR engine ────────────────────────────────────────────────────────────────

_reader = None

def get_ocr():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _reader


# ── Image helpers ─────────────────────────────────────────────────────────────

def open_image(path):
    from PIL import Image
    return Image.open(path).convert("RGB")

def to_numpy(img):
    import numpy as np
    return np.array(img)


# ── Find table border y-positions ─────────────────────────────────────────────

def find_borders(arr):
    import numpy as np
    h, w = arr.shape[:2]
    threshold = w * 0.3
    borders = []
    in_border = False
    for y in range(h):
        row = arr[y]
        dark = int(np.sum((row[:,0] < 100) & (row[:,1] < 100) & (row[:,2] < 100)))
        if dark > threshold:
            if not in_border:
                borders.append(y)
                in_border = True
        else:
            in_border = False
    return borders


# ── OCR with bounding boxes, returned as (x_center, text) sorted by x ────────

def ocr_with_x(reader, band_arr):
    """
    Returns list of (x_center, text) sorted left-to-right.
    Filters out row label words like 'Score', 'Total', 'SS' label column.
    """
    try:
        results = reader.readtext(band_arr, detail=1, paragraph=False)
    except Exception as e:
        print(f"  [warn] OCR error: {e}", flush=True)
        return []
    if not results:
        return []

    items = []
    for (bbox, text, conf) in results:
        text = text.strip()
        if not text:
            continue
        # x_center = average of all bbox x coords
        x_center = sum(pt[0] for pt in bbox) / len(bbox)
        items.append((x_center, text))

    items.sort(key=lambda t: t[0])
    return items


# ── Parse title ───────────────────────────────────────────────────────────────

def parse_title(lines):
    full = " ".join(lines)
    m = re.search(r"(.+?)\s*\(([A-Z0-9\-]+)\)", full)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return full.strip(), ""


# ── Known group header words to skip ─────────────────────────────────────────

GROUP_HEADERS = {"TLR", "RP", "GO", "OI"}
ROW_LABELS    = {"SCORE", "TOTAL", "RANK"}

def is_float(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def is_col_header(tok):
    t = tok.upper().replace(" ", "")
    if t in GROUP_HEADERS or t in ROW_LABELS:
        return False
    # Must be 2-8 uppercase letters possibly with +
    return bool(re.fullmatch(r"[A-Z+]{2,8}", t))


# ── Match headers to values by closest X position ────────────────────────────

def match_by_x(header_items, value_items):
    """
    Given sorted (x, text) for headers and (x, value) for a value row,
    match each value to the nearest header by x_center distance.
    Returns dict {header: value}.
    """
    if not header_items or not value_items:
        return {}

    result = {}
    used = set()

    for hx, htext in header_items:
        # Find closest unused value
        best_dist = float("inf")
        best_idx  = None
        for i, (vx, vtext) in enumerate(value_items):
            if i in used:
                continue
            dist = abs(hx - vx)
            if dist < best_dist:
                best_dist = dist
                best_idx  = i
        if best_idx is not None:
            used.add(best_idx)
            result[htext] = value_items[best_idx][1]

    return result


# ── Per-image extraction ──────────────────────────────────────────────────────

def extract_from_image(reader, image_path):
    img = open_image(image_path)
    arr = to_numpy(img)
    h, w = arr.shape[:2]

    # ── Title ─────────────────────────────────────────────────────────────────
    title_items = ocr_with_x(reader, arr[10:38, :, :])
    title_lines = [t for _, t in title_items]
    institute_name, institute_code = parse_title(title_lines)

    # ── Auto-detect 4 table borders ───────────────────────────────────────────
    borders = find_borders(arr)
    print(f"  borders at y={borders}", flush=True)

    if len(borders) < 4:
        print(f"  [warn] Only {len(borders)} borders found, using fallback.", flush=True)
        borders = [int(h*0.357), int(h*0.390), int(h*0.425), int(h*0.459)]

    b0, b1, b2, b3 = borders[0], borders[1], borders[2], borders[3]
    pad = 3

    # ── OCR each band with x positions ────────────────────────────────────────
    col_items   = ocr_with_x(reader, arr[b1+pad : b2-pad, :, :])
    score_items = ocr_with_x(reader, arr[b2+pad : b3-pad, :, :])
    total_items = ocr_with_x(reader, arr[b3+pad : min(b3+48, h), :, :])

    print(f"  col_items  : {col_items}", flush=True)
    print(f"  score_items: {score_items}", flush=True)
    print(f"  total_items: {total_items}", flush=True)

    # ── Filter headers: keep only col header tokens, preserve x order ─────────
    header_items = [(x, t.upper().replace(" ", ""))
                    for x, t in col_items
                    if is_col_header(t.upper().replace(" ", ""))]

    # ── Filter values: keep only floats ───────────────────────────────────────
    score_vals = [(x, t) for x, t in score_items if is_float(t)]
    total_vals = [(x, t) for x, t in total_items if is_float(t)]

    print(f"  header_items: {header_items}", flush=True)
    print(f"  score_vals  : {score_vals}", flush=True)
    print(f"  total_vals  : {total_vals}", flush=True)

    # ── Match by x position ───────────────────────────────────────────────────
    score_map = match_by_x(header_items, score_vals)
    total_map = match_by_x(header_items, total_vals)

    table = {}
    for _, hname in header_items:
        table[hname] = {
            "score": score_map.get(hname, ""),
            "total": total_map.get(hname, ""),
        }

    # ── Year + category ───────────────────────────────────────────────────────
    parts = Path(image_path).resolve().parts
    year = category = ""
    for i, p in enumerate(parts):
        if p == "image" and i >= 2:
            year     = parts[i - 2]
            category = parts[i - 1]
            break

    n_cols   = len(table)
    n_scores = sum(1 for v in table.values() if v["score"])
    flag = " MISMATCH" if n_cols != n_scores and n_cols > 0 else " OK"
    print(f"  institute : {institute_name} ({institute_code})", flush=True)
    print(f"  cols={n_cols} scores={n_scores}{flag}", flush=True)
    print(f"  table: {table}", flush=True)

    return {
        "image_path":     image_path,
        "year":           year,
        "category":       category,
        "institute_name": institute_name,
        "institute_code": institute_code,
        "table":          table,
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

    header_fill  = PatternFill("solid", fgColor="1F4E79")
    header_font  = Font(color="FFFFFF", bold=True)
    alt_fill     = PatternFill("solid", fgColor="D9E1F2")
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Collect all unique table headers in insertion order
    all_headers = []
    seen_h = set()
    for row in rows:
        for hk in row.get("table", {}):
            if hk not in seen_h:
                seen_h.add(hk)
                all_headers.append(hk)

    fixed_cols = ["Year", "Category", "Institute Name", "Institute Code"]
    all_cols   = fixed_cols \
               + [f"{h} Score" for h in all_headers] \
               + [f"{h} Total" for h in all_headers]

    wb = Workbook()
    ws = wb.active
    ws.title = "NIRF Scores"

    for ci, col in enumerate(all_cols, 1):
        cell = ws.cell(row=1, column=ci, value=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
    ws.row_dimensions[1].height = 30

    for ri, row in enumerate(rows, 2):
        tbl  = row.get("table", {})
        fill = alt_fill if ri % 2 == 0 else PatternFill()
        vals = [
            row.get("year", ""),
            row.get("category", ""),
            row.get("institute_name", ""),
            row.get("institute_code", ""),
        ] + [tbl.get(h, {}).get("score", "") for h in all_headers] \
          + [tbl.get(h, {}).get("total", "") for h in all_headers]

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
    parser.add_argument("input",  help="Image file or folder (recursive)")
    parser.add_argument("--output", "-o", default="nirf_scores.xlsx")
    parser.add_argument("--json",   "-j", default=None)
    args = parser.parse_args()

    images = collect_images(args.input)
    if not images:
        print(f"No images found at: {args.input}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(images)} image(s). Initialising EasyOCR ...", flush=True)
    reader = get_ocr()
    print("EasyOCR ready.\n", flush=True)

    rows = []
    for i, img_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {Path(img_path).name}", flush=True)
        try:
            rows.append(extract_from_image(reader, img_path))
        except Exception as e:
            import traceback
            print(f"  ERROR: {e}", flush=True)
            traceback.print_exc()

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