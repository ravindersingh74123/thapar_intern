
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
