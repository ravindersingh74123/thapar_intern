
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

# 2025 between-text can be either:
#   "Placement & Higher Studies UG [4 Years Program(s)]: Placement & higher studies..."
#   "UG [4 Years Program(s)]: Placement & higher studies..."   (subsequent programs)
#   "PG [2 Years Program(s)]: Placement & higher studies for previous 3 years"  (older style)
# Old style (2023/2024): text before table: "UG [4 Years Program(s)]: Placement"
PROG_PATTERN = r'((?:PG-Integrated|PG|UG)\s*\[[^\]]+\])\s*[:\-]?\s*(?:[Pp]lacement|[Hh]igher)'

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

def emit_phd_rows(table, above):
    """
    Parse a PhD table. table[0] should contain the PhD program name (or a synthetic row).
    Returns (rows, grad_yrs, found_fullpart).
    found_fullpart=False means no Full Time / Part Time count rows were found
    (stub table — just heading + subheader, data is all on next page).

    Also handles medical-college extras that appear after the graduated section:
      - "Number of students pursuing PG (MD/MS/DNB) program"  -> single value
      - "No. of students Graduating in PG (MD/MS/DNB) program" -> year-wise values
      - "No. of students Graduating in Super Speciality program (DM/MCH)" -> year-wise
    """
    results   = []
    sec       = "Ph.D Student Details"
    row0_text = " ".join(clean(c) for c in table[0] if c)
    m = re.search(r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
                  row0_text + " " + above, re.I)
    phd_prog  = clean(m.group(1)) if m else row0_text or "Ph.D (Student pursuing doctoral program)"
    grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
    in_grad        = False
    grad_yrs       = []
    found_fullpart = False

    # Medical extra state
    medical_metric  = None   # current metric label (PG/DNB or Super Speciality)
    medical_yrs     = []     # year labels for current medical metric

    for r in table[1:]:
        cells = [clean(c) for c in r]
        first = cells[0] if cells else ""
        fl    = first.lower()

        # ── graduated section header ──────────────────────────────────────
        if "graduated" in fl and "integrated ph.d" in fl:
            in_grad = True; medical_metric = None
            continue

        # ── graduated year-header row ─────────────────────────────────────
        if in_grad and not first and any(is_year(c) for c in cells[1:] if c):
            grad_yrs = [c for c in cells[1:] if is_year(c)]
            continue

        # ── graduated Full/Part Time values ───────────────────────────────
        if in_grad and grad_yrs and first in ("Full Time", "Part Time"):
            for ci, yr in enumerate(grad_yrs):
                val = cells[ci + 1] if ci + 1 < len(cells) else ""
                if val:
                    results.append(mkrow(sec, grad_prog, yr,
                                         "{} Graduated".format(first), val))
            continue

        # ── after grad section: medical extras ────────────────────────────
        if "pursuing pg" in fl or ("pursuing" in fl and ("md" in fl or "ms" in fl or "dnb" in fl)):
            in_grad = False
            val = next((c for c in reversed(cells) if c and re.match(r'^\d+$', c)), None)
            if val:
                results.append(mkrow(sec, first, "-", "Total Students", val))
            medical_metric = None
            continue

        if ("graduating in pg" in fl or "graduating in super" in fl
                or ("graduating" in fl and ("md" in fl or "ms" in fl or "dnb" in fl
                                            or "dm" in fl or "mch" in fl))):
            in_grad = False
            medical_metric = first
            medical_yrs    = []
            continue

        if medical_metric and not first and not medical_yrs:
            yrs = [c for c in cells if is_year(c)]
            if yrs:
                medical_yrs = yrs
                continue
        if medical_metric and not medical_yrs and is_year(first):
            medical_yrs = [c for c in cells if is_year(c)]
            continue

        if medical_metric and medical_yrs:
            vals = [c for c in cells if c and re.match(r'^\d+$', c)]
            if vals:
                for ci, yr in enumerate(medical_yrs):
                    v = vals[ci] if ci < len(vals) else ""
                    if v:
                        results.append(mkrow(sec, medical_metric, yr,
                                             "Students Graduating", v))
                medical_metric = None; medical_yrs = []
            continue

        # ── standard Full Time / Part Time count rows ─────────────────────
        if first in ("Full Time", "Part Time"):
            found_fullpart = True
            val = next((c for c in reversed(cells) if re.match(r'^\d+$', c or "")), None)
            if val:
                results.append(mkrow(sec, phd_prog, "-",
                                     "{} Students (Total Students)".format(first), val))

    return results, grad_yrs, found_fullpart

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

WORDS_HINTS = {"amount received in words", "total annual earnings in words", "in words"}

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

# ── 2025 NEW: emit a year-col table with arbitrary metrics ────────────────────
def emit_year_col_table(section, program, table):
    """
    For 2025 sustainability sub-tables like:
      row0: ['Academic Year'|'Description', '2023-24', '2022-23', '2021-22']
      row1+: ['Metric label', val1, val2, val3]
    Emits one row per (metric, year).
    """
    results = []
    if not table or not table[0]: return results
    row0 = [clean(c) for c in table[0]]
    # Find year columns (skip first cell which is header label)
    yr_cols = [c for c in row0[1:] if c]
    if not yr_cols: return results
    for r in table[1:]:
        cells = [clean(c) for c in r]
        if not cells or not cells[0]: continue
        metric = cells[0]
        for ci, yr in enumerate(yr_cols):
            val = cells[ci + 1] if ci + 1 < len(cells) else ""
            if val:
                results.append(mkrow(section, program, yr, metric, val))
    return results

def parse_pdf(pdf_path):
    results        = []
    institute_name = ""
    institute_code = ""

    with pdfplumber.open(pdf_path) as pdf:
        full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)

        # ── Detect 2016, 2017, 2018 PDFs ────────────────────────────────────────
        # 2016 codes: NIRF-ENGG-INF-77, NIRF-MGMT-INF-217, NIRF-PHRM-1-2452430866, etc.
        #   Header: "InstituteID :NIRF-..." (no space before colon, different from 2017/2018)
        # 2017 codes: IR17-ENGG-1-1-77 etc.
        # 2018 codes: IR-1-D-D-N-15 etc.
        is_2016 = bool(re.search(r"InstituteID\s*:\s*NIRF-", full_text))
        is_2017 = bool(re.search(r"Institute\s+ID\s*:\s*IR17-", full_text))
        is_2018 = bool(re.search(r"Institute\s+ID\s*:", full_text)) and not is_2017
        if is_2016:
            m_id   = re.search(r"InstituteID\s*:\s*(NIRF-[\w-]+)", full_text)
            # Name follows "Institute Name :" and ends before a long line of dashes or "Considered"
            m_name = re.search(r"Institute\s*Name\s*:\s*(.+?)(?:\s*-{5,}|\s*Considered)", full_text)
            if m_id:   institute_code = clean(m_id.group(1))
            if m_name: institute_name = clean(m_name.group(1))
        elif is_2017:
            m_id   = re.search(r"Institute\s+ID\s*:\s*(IR17-[\w-]+)", full_text)
            m_name = re.search(r"Institute\s+Name\s*:\s*(.+?)\s+Faculty Details", full_text)
            if m_id:   institute_code = clean(m_id.group(1))
            if m_name: institute_name = clean(m_name.group(1))
        elif is_2018:
            m_id   = re.search(r"Institute\s+ID\s*:\s*(IR-[\w-]+)", full_text)
            m_name = re.search(r"Institute\s+Name\s*:\s*(.+?)\s+Faculty Details", full_text)
            if m_id:   institute_code = clean(m_id.group(1))
            if m_name: institute_name = clean(m_name.group(1))
        else:
            m = re.search(r"Institute\s*Name\s*:\s*([^\[]+)\[([^\]]+)\]", full_text)
            if m:
                institute_name = clean(m.group(1))
                institute_code = clean(m.group(2))

        # ── 2017/2018 cross-page state ────────────────────────────────────────
        # Financial Resources can split: header+rows on p1, more rows on p2 (same between-text)
        last_2018_fin_open    = False   # Financial Resources header seen
        # Sponsored Research can split: header-only on p1, data on p2 (both have same between)
        # OR header+partial data on p1, rest on p2 (same between, no header on p2)
        last_2018_sr_open     = False
        # EDP can split: broken header row on p1, continuation row + data on p2
        last_2018_edp_open    = False
        # Publications can split (Scopus on next page with same between-text)
        last_2018_pub_hdrs    = []
        # Patent can split: header-only on p1, single data row on p2 (same between-text)
        last_2018_patent_hdrs = []
        # PCS can split: question-header table on p1, answers table on p2 (same between-text)
        last_2018_pcs_hdrs    = []
        # 2017 Publication: Indian Citation Index arrives in a second table with empty between-text
        last_2017_pub_hdrs    = []
        # 2016 cross-page state:
        # SR heading can appear in page TRAIL (after last table on p1), table on p2 with empty BTW
        # Consultancy can split: header+partial data on p1, 1 row on p2 with empty BTW
        # SR can split: header+partial data on p1, 1 row on p2 with empty BTW
        last_2016_section     = None   # last 2016 section name (for trail/empty-BTW continuations)
        last_2016_sr_open     = False  # SR has been opened (header seen)
        last_2016_con_open    = False  # Consultancy has been opened (header seen)

        cur_placement_program = None
        cur_placement_headers = None

        last_fin_year_cols     = []
        last_exp_section       = None
        in_exp_cont            = False
        in_phd_grad            = False
        last_phd_grad_years    = []
        last_simple_section     = None
        last_simple_year_cols   = []
        prev_page_last_prog     = None
        prev_page_trailing_text = ""

        # PhD cross-page split state
        phd_pending_prog    = None
        phd_pending_partial = False

        # Multi-page generic section tracking (Branches Q, R, S)
        last_generic_section   = None
        last_generic_headers   = []
        last_generic_extractor = None

        # Sustainability cross-page continuation tracking (Branch P)
        in_sustainability = False

        # 2025 NEW: Sustainable Living Practices cross-page question tracking
        # When Q text ends a page and bullets are on the next page, we carry the
        # last-seen question forward so bullets can be attributed to it.
        slp_current_q = None

        # 2025 NEW: MEI/IKS cross-page continuation tracking (Branch G3)
        # The 5-question table is often split: first page has 1–2 rows, the rest
        # continue on the next page with no between-text.
        in_mei_iks = False

        # 2025 NEW: Sustainability numeric sub-section tracking
        # Tracks which named sub-section (e.g. 'Details of Energy and Water Consumption')
        # we are inside, so continuation tables (between='') can be routed correctly.
        in_sustainability_numeric = False
        last_sustainability_subsec = None   # e.g. "Details of Energy and Water Consumption"
        last_sustainability_yrcols = []     # year columns from the opening row

        for page in pdf.pages:
            found_tables = page.find_tables()
            raw_tables   = page.extract_tables()
            page_text    = clean(page.extract_text() or "")
            prev_y       = 0

            for ft, table in zip(found_tables, raw_tables):
                if not table: continue

                # ══════════════════════════════════════════════════════════════
                # 2016 FORMAT HANDLER
                # 2016 PDFs use code format NIRF-ENGG-INF-77, NIRF-PHRM-1-2452430866, etc.
                # Header: "InstituteID :NIRF-..." (no space before colon)
                #
                # Sections: Faculty Details, Student Details, Facilities Summaries,
                #   Student Events, Publication Details, Perception Details, IPR Summary,
                #   Sponsored Research Details, Consultancy Project Details,
                #   Education Program Details, Graduation Outcome, Student Exam Details,
                #   Physical Facilties [sic], Student Entrepreneurship,
                #   Revenue from Executive Education (MGMT only)
                #
                # KEY DIFFERENCES FROM 2017/2018:
                #   - Code format NIRF-... (not IR17-/IR-)
                #   - Faculty: single horizontal row, more columns (Regular/Visiting/PhD/etc.)
                #   - Student Details: 11 columns incl. Male/Female/Total/SocChallenged
                #   - No Scholarships, No PhD section, No Financial Resources section
                #   - Facilities Summaries replaces Financial Resources (library/lab expenses)
                #   - Graduation Outcome = Placement (campus placed + avg salary)
                #   - Student Exam Details = University Exam
                #   - IPR Summary = Patent Details (multi-col: filed/granted/licenced/design)
                #   - Physical Facilties [sic] = PCS (multi-row vertical, year+6 yes/no answers)
                #   - Perception: 2 cols (Public+Peer) for most, 1 col (Peer only) for some
                #   - Publication: same table, 7 data rows (ICI×1 + Scopus×3 + WoS×3)
                #   - Student Events: simple year-count table
                #   - Student Entrepreneurship: optional
                #   - Revenue from Executive Education: MGMT only
                #
                # CROSS-PAGE SPLITS (all produce empty BTW on continuation page):
                #   1. SR heading in page TRAIL → table on p2 with empty BTW
                #      (ENGG-423, PHRM-2452430866)
                #   2. SR header+partial data on p1 → 1 data row on p2 with empty BTW
                #      (PHRM-2456020972)
                #   3. Consultancy header+partial data on p1 → 1 data row on p2 with empty BTW
                #      (MGMT-217)
                # Detection: any table with empty BTW on p2 is a continuation of
                #   last_2016_section (SR or Consultancy)
                # ══════════════════════════════════════════════════════════════
                if is_2016:
                    r0    = [clean(c) for c in table[0]]
                    y_top = ft.bbox[1]
                    btw   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
                    btw_l = btw.lower()
                    prev_y = ft.bbox[3]
                    # After last table on this page, capture trailing text for next-page context
                    # (We do this at table-loop end using a look-ahead; simpler: we track
                    #  last_2016_section whenever we open SR/Consultancy and handle empty BTW)

                    # ── (2016-A) FACULTY DETAILS ──────────────────────────────
                    # Single horizontal row.
                    # row0 = ['No of Regular Faculty','No of Visiting Faculty For 1 Semester',
                    #          'No of Visiting Faculty For 2 Semester','No of PhD Faculty',
                    #          'No of Faculty with Phd And M.Tech Qualification',
                    #          'Teaching Experience of Regular Faculty (In Yrs)',
                    #          'Industry Experience of Regular Faculty (In Yrs)',
                    #          'No of Women Faculty']
                    # row1 = ['540','0','0','554','554','6884.58','344.08','70']
                    if "no of regular faculty" in r0[0].lower():
                        if len(table) > 1:
                            vals = [clean(c) for c in table[1]]
                            for hi, hdr in enumerate(r0):
                                if hdr and hi < len(vals) and vals[hi]:
                                    results.append(mkrow("Faculty Details", "-", "-", hdr, vals[hi]))
                        continue

                    # ── (2016-B) STUDENT DETAILS ─────────────────────────────
                    # row0 = ['Academic-Year','Program Level','Approved Intake',
                    #          'No. of student admitted in 1st year from outside state', ...
                    #          'No. of Male student of all years...','No. of Female student...',
                    #          'Total student of all years...','Socially Challenged...']
                    elif "student details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Student Details", prog, yr, h, val))
                        continue

                    # ── (2016-C) FACILITIES SUMMARIES ─────────────────────────
                    # row0 = ['Financial-Year','Annual Expenses of Library On Physical Resources...',
                    #          'Annual Expenses of Library On e-Resources...',
                    #          'Annual Expenses of Laboratories On Creation/Up-gradation...',
                    #          'Annual Expenses of Laboratories On Maintenance & Safety...',
                    #          'Total outdoor sports area (in Sq. Mtrs.)',
                    #          'Total indoor sports area (in Sq. Mtrs.)',
                    #          'Annual Expenditure on sports facilities (Rs. In Lakhs)',
                    #          'Annual Expenditure on Extra Curricular activities(Rs. In Lakhs)',
                    #          'No. of Women Members of eminence as Institute Head/Governing Board']
                    elif "facilities summaries" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Facilities Summaries", "-", yr, h, val))
                        continue

                    # ── (2016-D) STUDENT EVENTS ──────────────────────────────
                    # row0 = ['Academic-Year','Total no. of student secured top positions in events']
                    elif "student events" in btw_l:
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr  = cells[0]
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow("Student Events", "-", yr,
                                    "Total no. of student secured top positions in events", val))
                        continue

                    # ── (2016-E) PUBLICATION DETAILS ─────────────────────────
                    # row0 = ['Academic-Year','Title','Total No. of Publication reported',
                    #          'Total No. of Citations reported',
                    #          'Total No. of Publication with oustide collaborators']
                    # 7 data rows: ICI×1 + Scopus×3 + WoS×3
                    # Note: "Scpous" typo in PDF; normalize to "Scopus"
                    elif "publication details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr  = cells[0]
                            src_label = clean(cells[1]) if len(cells) > 1 else ""
                            # Normalize common typos
                            src_label = re.sub(r"(?i)^scpous$", "Scopus", src_label)
                            src_label = re.sub(r"(?i)^indian citation index$", "Indian Citation Index", src_label)
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Publication Details", src_label, yr, h, val))
                        continue

                    # ── (2016-F) PERCEPTION DETAILS ──────────────────────────
                    # row0 = ['Public Perception','Peer Perception']  (most PDFs — 2 cols)
                    # row1 = ['333','17']
                    # OR row0 = ['Peer Perception']  (NIRF-UNIV-67 — 1 col only)
                    # row1 = ['3']
                    elif "perception details" in btw_l:
                        if len(table) > 1:
                            hdrs    = r0
                            answers = [clean(c) for c in table[1]]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(answers) and answers[hi]:
                                    results.append(mkrow(
                                        "Perception Details", "-", "-", hdr, answers[hi]))
                        continue

                    # ── (2016-G) IPR SUMMARY ─────────────────────────────────
                    # row0 = ['Financial-Year','No. of Patents Filed','No. of Patents Granted',
                    #          'No. of Patents Licenced','No. of Design Filed','No. of Design Granted',
                    #          'No. of collaborative patents','Earnings from patent (Rs. in Lakhs)']
                    # (columns vary slightly between PDFs)
                    elif "ipr summary" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("IPR Summary", "-", yr, h, val))
                        continue

                    # ── (2016-H) SPONSORED RESEARCH PROJECT DETAILS ──────────
                    # row0 = ['Financial-Year','Amount (Rs. In Lakhs)']
                    # 3 data rows (or fewer if splitting)
                    #
                    # CROSS-PAGE SPLITS:
                    #   Pattern A (ENGG-423, PHRM-2452430866):
                    #     p1 TRAIL = "Sponsored Research Project Details" (heading only, no table)
                    #     p2 T0    btw="" → full table (header + 3 data rows)
                    #   Pattern B (PHRM-2456020972):
                    #     p1: btw="Sponsored Research Project Details" → header + 2 data rows
                    #     p2 T0: btw="" → 1 data row (no header)
                    # Both patterns produce empty BTW on p2.
                    # We handle via last_2016_section tracking.
                    elif "sponsored research project details" in btw_l:
                        last_2016_section = "Sponsored Research Details"
                        if r0[0] == "Financial-Year":
                            last_2016_sr_open = True
                            data_rows = table[1:]
                        else:
                            last_2016_sr_open = False
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Sponsored Research Details", "-", yr,
                                    "Amount (Rs. In Lakhs)", val))
                        continue

                    # ── (2016-I) CONSULTANCY PROJECT DETAILS ─────────────────
                    # row0 = ['Financial-Year','Amount (Rs. In Lakhs)']
                    # 3 data rows (or fewer if splitting)
                    #
                    # CROSS-PAGE SPLIT (MGMT-217):
                    #   p1: btw="Consultancy Project Details" → header + 2 data rows
                    #   p2 T0: btw="" → 1 data row (no header)
                    elif "consultancy project details" in btw_l:
                        last_2016_section = "Consultancy Project Details"
                        if r0[0] == "Financial-Year":
                            last_2016_con_open = True
                            data_rows = table[1:]
                        else:
                            last_2016_con_open = False
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Consultancy Project Details", "-", yr,
                                    "Amount (Rs. In Lakhs)", val))
                        continue

                    # ── (2016-J) EMPTY BTW CONTINUATION ──────────────────────
                    # Any section heading can end up in page-1's trailing text
                    # when the section header and its table are split across pages.
                    # The table on p2 then has empty between-text.
                    #
                    # Known splits (from observed PDFs):
                    #   SR heading in trail  → ENGG-423, PHRM-2452430866
                    #   Consultancy partial  → MGMT-217, PHRM-2456020972
                    #   Education Program    → MGMT-380  (heading in trail, full table on p2)
                    #
                    # We determine the target section by checking:
                    #   1. last_2016_section (set when we opened SR/Consultancy on p1)
                    #   2. prev_page_trailing_text (heading overflowed to p1 trail)
                    #
                    # Each section type has its own emitter.
                    elif btw == "" and (
                            last_2016_section in (
                                "Sponsored Research Details",
                                "Consultancy Project Details")
                            or "sponsored research" in prev_page_trailing_text.lower()
                            or "consultancy project" in prev_page_trailing_text.lower()
                            or "education program details" in prev_page_trailing_text.lower()
                            or "graduation outcome" in prev_page_trailing_text.lower()
                            or "student exam details" in prev_page_trailing_text.lower()
                            or "student enterpreneurship" in prev_page_trailing_text.lower()
                            or "student entrepreneurship" in prev_page_trailing_text.lower()
                            or "physical facilties" in prev_page_trailing_text.lower()
                            or "physical facilities" in prev_page_trailing_text.lower()
                            or "revenue from executive" in prev_page_trailing_text.lower()):
                        _trail_l = prev_page_trailing_text.lower()

                        # ── Determine which section this continuation belongs to ──
                        # PRIORITY: an explicit heading in the page-1 trail ALWAYS wins
                        # over last_2016_section. last_2016_section may still be set from
                        # a section (e.g. Consultancy) that was fully emitted on page 1
                        # but whose state variable was never cleared. The trail heading is
                        # the authoritative signal for what belongs on the next page.
                        if "education program details" in _trail_l:
                            _sec_2016 = "Education Program Details"
                        elif "graduation outcome" in _trail_l:
                            _sec_2016 = "Graduation Outcome"
                        elif "student exam details" in _trail_l:
                            _sec_2016 = "Student Exam Details"
                        elif "student enterpreneurship" in _trail_l or "student entrepreneurship" in _trail_l:
                            _sec_2016 = "Student Entrepreneurship"
                        elif "physical facilties" in _trail_l or "physical facilities" in _trail_l:
                            _sec_2016 = "Physical Facilties"
                        elif "revenue from executive" in _trail_l:
                            _sec_2016 = "Revenue from Executive Education"
                        elif "sponsored research" in _trail_l:
                            _sec_2016 = "Sponsored Research Details"
                        elif "consultancy project" in _trail_l:
                            _sec_2016 = "Consultancy Project Details"
                        elif last_2016_section in (
                                "Sponsored Research Details",
                                "Consultancy Project Details"):
                            # No heading in trail — use open section state (mid-table split)
                            _sec_2016 = last_2016_section
                        else:
                            _sec_2016 = "Sponsored Research Details"  # fallback

                        # ── Emit rows based on section type ──────────────────────
                        if _sec_2016 in ("Sponsored Research Details",
                                         "Consultancy Project Details",
                                         "Revenue from Executive Education"):
                            # Financial-Year / Amount table
                            _data_rows = table[1:] if r0[0] == "Financial-Year" else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr = cells[0]
                                if not re.match(r"\d{4}-\d{2}", yr): continue
                                val = cells[1] if len(cells) > 1 else ""
                                if val:
                                    results.append(mkrow(
                                        _sec_2016, "-", yr, "Amount (Rs. In Lakhs)", val))

                        elif _sec_2016 == "Education Program Details":
                            # Academic-Year / No. of participants
                            _data_rows = table[1:] if (r0[0] in ("Academic-Year", "Academic Year")) else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr  = cells[0]
                                val = cells[1] if len(cells) > 1 else ""
                                if yr and val:
                                    results.append(mkrow(
                                        "Education Program Details", "-", yr,
                                        "No. of participants to whom certificate issued", val))

                        elif _sec_2016 == "Graduation Outcome":
                            _hdrs = r0
                            _data_rows = table[1:] if (r0[0] in ("Academic-Year", "Academic Year")) else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr = cells[0]
                                for ci, h in enumerate(_hdrs[1:], 1):
                                    if not h: continue
                                    val = cells[ci] if ci < len(cells) else ""
                                    if val:
                                        v_out = re.sub(r"\.00$", "", val) if re.match(r"[\d.]+$", val) else val
                                        results.append(mkrow("Graduation Outcome", "-", yr, h, v_out))

                        elif _sec_2016 == "Student Exam Details":
                            _hdrs = r0
                            _data_rows = table[1:] if (r0[0] in ("Academic-Year", "Academic Year")) else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr = cells[0]
                                for ci, h in enumerate(_hdrs[1:], 1):
                                    if not h: continue
                                    val = cells[ci] if ci < len(cells) else ""
                                    if val:
                                        results.append(mkrow("Student Exam Details", "-", yr, h, val))

                        elif _sec_2016 == "Student Entrepreneurship":
                            _hdrs = r0
                            _data_rows = table[1:] if (r0[0] in ("Academic-Year", "Academic Year")) else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr = cells[0]
                                for ci, h in enumerate(_hdrs[1:], 1):
                                    if not h: continue
                                    val = cells[ci] if ci < len(cells) else ""
                                    if val:
                                        results.append(mkrow("Student Entrepreneurship", "-", yr, h, val))

                        elif _sec_2016 == "Physical Facilties":
                            _hdrs = r0
                            _data_rows = table[1:] if (r0[0] in ("Academic-Year", "Academic Year")) else table
                            for r in _data_rows:
                                cells = [clean(c) for c in r]
                                if not cells or not cells[0]: continue
                                yr = cells[0]
                                for ci, h in enumerate(_hdrs[1:], 1):
                                    if not h: continue
                                    val = cells[ci] if ci < len(cells) else ""
                                    if val:
                                        results.append(mkrow("Physical Facilties", "-", yr, h, val))

                        # Once consumed, clear section
                        last_2016_section = None
                        continue

                    # ── (2016-K) EDUCATION PROGRAM DETAILS ───────────────────
                    # row0 = ['Academic-Year','No. of participants to whom certificate issued']
                    elif "education program details" in btw_l:
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr  = cells[0]
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow("Education Program Details", "-", yr,
                                    "No. of participants to whom certificate issued", val))
                        continue

                    # ── (2016-L) GRADUATION OUTCOME ──────────────────────────
                    # row0 = ['Academic-Year','Total Student placed in Campus',
                    #          'Placement Annual Average Salary (In Rs.)']
                    elif "graduation outcome" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    v_out = re.sub(r"\.00$", "", val) if re.match(r"[\d.]+$", val) else val
                                    results.append(mkrow("Graduation Outcome", "-", yr, h, v_out))
                        continue

                    # ── (2016-M) STUDENT EXAM DETAILS ────────────────────────
                    # row0 = ['Academic-Year','No. of student admitted in first year as per batch',
                    #          'No. of student admitted in lateral as per batch',
                    #          'No. of student graduating in minimum time']
                    elif "student exam details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Student Exam Details", "-", yr, h, val))
                        continue

                    # ── (2016-N) PHYSICAL FACILTIES (PCS) ────────────────────
                    # Note: "Facilties" is a typo in the PDF — we preserve the section name.
                    # row0 = ['Academic-Year','Do your buildings have ramps?',
                    #          'Do your buildings have lifts?',
                    #          'Do you have provision for walking aids?',
                    #          'Do your buildings have specially designed toilets for handicapped student?',
                    #          'Do you have braille lab/special lab for blind/handicapped student?',
                    #          'Do you have special facilities for blind student?']  (7th col optional)
                    # row1 = ['2015','More than 50%','More than 50%','Yes',...]
                    elif "physical facilties" in btw_l or "physical facilities" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Physical Facilties", "-", yr, h, val))
                        continue

                    # ── (2016-O) STUDENT ENTREPRENEURSHIP ────────────────────
                    # row0 = ['Academic-Year',
                    #          'No of Enterpreneurs Produced Over Previous 10 Years',
                    #          'No of graduated student passed out over previous 10 years']
                    elif "student enterpreneurship" in btw_l or "student entrepreneurship" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Student Entrepreneurship", "-", yr, h, val))
                        continue

                    # ── (2016-P) REVENUE FROM EXECUTIVE EDUCATION (MGMT only)─
                    # row0 = ['Financial-Year','Amount (Rs. In Lakhs)']
                    elif "revenue from executive education" in btw_l:
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow("Revenue from Executive Education",
                                    "-", yr, "Amount (Rs. In Lakhs)", val))
                        continue

                    # ── (2016-Z) Unknown 2016 table ───────────────────────────
                    else:
                        continue
                # ══ End of 2016 block ════════════════════════════════════════

                # ══════════════════════════════════════════════════════════════
                # 2017 FORMAT HANDLER
                # 2017 PDFs use code format IR17-ENGG-1-1-77, IR17-COLL-1-29115, etc.
                # Differences from 2018:
                #   - No Scholarships, No PhD Student Details, No Executive Dev Programs
                #   - Publication has a 3rd source (Indian Citation Index) in a separate
                #     table immediately after, with EMPTY between-text
                #   - Perception has 3 columns: Peer / Employer / Public (not 1 column)
                #   - Consultancy can split pages (same pattern as 2018-L)
                #   - Patent / PCS / SR / Financial / Faculty / Student / Exam / Placement
                #     all structurally identical to 2018
                # ══════════════════════════════════════════════════════════════
                if is_2017:
                    r0    = [clean(c) for c in table[0]]
                    y_top = ft.bbox[1]
                    btw   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
                    btw_l = btw.lower()
                    prev_y = ft.bbox[3]

                    # ── (2017-A) FACULTY DETAILS ──────────────────────────────
                    # Identical to 2018-A
                    if "no. of faculty members with ph.d" in r0[0].lower():
                        if len(table) > 1:
                            vals = [clean(c) for c in table[1]]
                            for hi, hdr in enumerate(r0):
                                if hdr and hi < len(vals) and vals[hi]:
                                    results.append(mkrow("Faculty Details", "-", "-", hdr, vals[hi]))
                        continue

                    # ── (2017-B) STUDENT DETAILS ─────────────────────────────
                    # row0 = ['Academic Year','Program Level','Approve Intake...',
                    #          'No. of Male...','No. of Female...','Total no.of...', ...]
                    # 2017 has 11 columns (same as 2018-B). No PhD guard needed since
                    # 2017 has no PhD Student Details section.
                    elif "student details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Student Details", prog, yr, h, val))
                        continue

                    # ── (2017-C) PLACEMENT AND HIGHER STUDIES ────────────────
                    # row0 = ['Academic Year','Program',
                    #          'No. of students placed through campus placement',  ← "campus" vs 2018
                    #          'No. of students selected for Higher Studies',
                    #          'Median salary of placed graduates (in Rs.)']
                    elif "placement and higher studies" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Placement & Higher Studies", prog, yr, h, val))
                        continue

                    # ── (2017-D) UNIVERSITY EXAM DETAILS ─────────────────────
                    # Identical to 2018 University Exam
                    elif "university exam details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("University Exam Details", prog, yr, h, val))
                        continue

                    # ── (2017-E) FINANCIAL RESOURCES AND ITS UTILIZATION ─────
                    # Identical to 2018-H: 4-col table (FY, CapEx, OpEx, Total) x 3 years
                    # Can split pages (same between-text, row0 is a data row on continuation)
                    elif "financial resources and its utilization" in btw_l:
                        if r0[0] == "Financial Year":
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        fin_hdrs = ["Annual Capital Expenditure (in Rs.)",
                                    "Annual Operational Expenditure (in Rs.)",
                                    "Total Annual Expenditure (in Rs.)"]
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            for ci, h in enumerate(fin_hdrs, 1):
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Financial Resources and its Utilization",
                                        "-", yr, h, re.sub(r"\.00$", "", val)))
                        continue

                    # ── (2017-F) PUBLICATION DETAILS ─────────────────────────
                    # 2017 has THREE sources:
                    #   Table 1 (between="Publication Details..."): WoS + Scopus (4 cols)
                    #   Table 2 (between=""):                        Indian Citation Index (3 cols)
                    #
                    # Table 1 row0 = ['Source of Data','Publications','Citations','Top 25%...']
                    # Table 2 row0 = ['Source of Data','Publications','Citations']   ← 3 cols only
                    #
                    # DETECTION: "publication details" in btw_l → main table
                    #            btw == "" and r0[0]=="Source of Data" → Indian Citation Index
                    elif "publication details" in btw_l:
                        # Main publication table (WoS + Scopus)
                        if r0[0] == "Source of Data":
                            last_2017_pub_hdrs = r0
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        hdrs = last_2017_pub_hdrs if last_2017_pub_hdrs else r0
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            src_label = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Publication Details", src_label, "-", h, val))
                        continue

                    elif btw == "" and r0 and r0[0] == "Source of Data":
                        # Indian Citation Index table (no between-text, 3 cols)
                        # row0 = ['Source of Data','Publications','Citations']
                        # row1 = ['Indian Citation Index','2','0']
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            src_label = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Publication Details", src_label, "-", h, val))
                        continue

                    # ── (2017-G) PATENT DETAILS ──────────────────────────────
                    # Identical to 2018-J.
                    # row0 = ['No. of Patents Granted','No. of Patents Published','Earnings from Patents (in Rs.)']
                    # row1 = ['33','234','38849000']
                    # Cross-page split handled via last_2018_patent_hdrs (shared state).
                    elif "patent details" in btw_l:
                        _is_patent_hdr = any(
                            "patent" in (c or "").lower() or "earning" in (c or "").lower()
                            for c in r0)
                        if _is_patent_hdr:
                            last_2018_patent_hdrs = r0
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        hdrs = last_2018_patent_hdrs if last_2018_patent_hdrs else r0
                        for data_r in data_rows:
                            vals = [clean(c) for c in data_r]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(vals):
                                    val = re.sub(r"\.00$", "", vals[hi])
                                    if val:
                                        results.append(mkrow(
                                            "Patent Details", "-", "-", hdr, val))
                        continue

                    # ── (2017-H) SPONSORED RESEARCH PROJECT DETAILS ──────────
                    # Identical to 2018-K (can split pages, same between-text)
                    elif "sponsored research project details" in btw_l:
                        if r0[0] == "Financial Year":
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Sponsored Research Details", "-", yr,
                                    "Amount (in Rs.)", re.sub(r"\.00$", "", val)))
                        continue

                    # ── (2017-I) CONSULTANCY PROJECT DETAILS ─────────────────
                    # CROSS-PAGE SPLIT observed in IR17-I-2-18243 and IR17-PHRM-2-17784:
                    #   p1: between="Consultancy Project Details"
                    #       row0=['Financial Year','Amount (in Rs.)'] + 2 data rows
                    #   p2: between="Consultancy Project Details"
                    #       row0=['2015-16','1640000.00']  (data row, no header)
                    elif "consultancy project details" in btw_l:
                        if r0[0] == "Financial Year":
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r"\d{4}-\d{2}", yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Consultancy Project Details", "-", yr,
                                    "Amount (in Rs.)", re.sub(r"\.00$", "", val)))
                        continue

                    # ── (2017-J) FACILITIES FOR PHYSICALLY CHALLENGED ─────────
                    # HORIZONTAL table identical to 2018-N.
                    # Cross-page split handled via last_2018_pcs_hdrs (shared state).
                    elif ("facilities for physically challenged" in btw_l
                          or any("lifts/ramps" in (c or "").lower() for c in r0)):
                        _is_pcs_hdr = any(
                            "do your" in (c or "").lower() or "lifts/ramps" in (c or "").lower()
                            for c in r0)
                        if _is_pcs_hdr:
                            last_2018_pcs_hdrs = r0
                            answer_rows = table[1:]
                        else:
                            answer_rows = table
                        hdrs = last_2018_pcs_hdrs if last_2018_pcs_hdrs else r0
                        for ans_r in answer_rows:
                            answers = [clean(c) for c in ans_r]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(answers) and answers[hi]:
                                    results.append(mkrow(
                                        "PCS Facilities: Facilities of Physically Challenged Students",
                                        "-", "-", hdr, answers[hi]))
                        continue

                    # ── (2017-K) PERCEPTION DETAILS ──────────────────────────
                    # 2017 has 3 perception columns (not 1 like 2018):
                    # row0 = ['Peer Perception', 'Employer Perception', 'Public Perception']
                    # row1 = ['325', '46', '3859']
                    elif "perception details" in btw_l:
                        if len(table) > 1:
                            hdrs    = r0
                            answers = [clean(c) for c in table[1]]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(answers) and answers[hi]:
                                    results.append(mkrow(
                                        "Perception Details", "-", "-", hdr, answers[hi]))
                        continue

                    # ── (2017-Z) Unknown 2017 table ───────────────────────────
                    else:
                        continue
                # ══ End of 2017 block ════════════════════════════════════════

                # ══════════════════════════════════════════════════════════════
                # 2018 FORMAT HANDLER
                # 2018 PDFs have a completely different structure from 2019+.
                
                if is_2018:
                    r0    = [clean(c) for c in table[0]]
                    y_top = ft.bbox[1]
                    btw   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
                    btw_l = btw.lower()
                    prev_y = ft.bbox[3]

                    # ── (2018-A) FACULTY DETAILS ──────────────────────────────
                    # row0 = ['No. of Faculty members with Ph.D...','Total no. of Faculty...','No. of Women...']
                    # row1 = ['90','676','181']   (one data row, no year dimension)
                    if "no. of faculty members with ph.d" in r0[0].lower():
                        if len(table) > 1:
                            vals = [clean(c) for c in table[1]]
                            for hi, hdr in enumerate(r0):
                                if hdr and hi < len(vals) and vals[hi]:
                                    results.append(mkrow("Faculty Details", "-", "-", hdr, vals[hi]))
                        continue

                    # ── (2018-B) STUDENT DETAILS ──────────────────────────────
                    # Combined Intake + Strength table.
                    # row0 = ['Academic Year','Program Level','Approve Intake of all years of duration',
                    #          'No. of Male students studying...','No. of Female students studying...']
                    elif "student details" in btw_l and "ph.d" not in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Student Details", prog, yr, h, val))
                        continue

                    # ── (2018-C) SCHOLARSHIPS ─────────────────────────────────
                    # row0 = ['Academic Year','Program','No. of students receiving Freeships/Scholarships
                    #          from State and Central Govt','...from Institution Funds','...from Private Bodies']
                    elif "scholarships" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Scholarships", prog, yr, h, val))
                        continue

                    # ── (2018-D) PLACEMENT AND HIGHER STUDIES ─────────────────
                    # row0 = ['Academic Year','Program','No. of students placed through placement',
                    #          'No. of students selected for Higher Studies',
                    #          'Median salary of placed graduates (in Rs.)']
                    elif "placement and higher studies" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("Placement & Higher Studies", prog, yr, h, val))
                        continue

                    # ── (2018-E) PhD STUDENT DETAILS ──────────────────────────
                    # row0 = ['Ph.D (Student pursuing doctoral program till 2016-17).','Total Students']
                    # row1 = ['Full Time','470']   row2 = ['Part Time','0']
                    elif "ph.d student details" in btw_l or (
                            len(r0) >= 2 and "ph.d" in r0[0].lower()
                            and "total students" in (r0[1] or "").lower()):
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            label = cells[0]
                            val   = cells[1] if len(cells) > 1 else ""
                            if label in ("Full Time", "Part Time") and val:
                                results.append(mkrow(
                                    "Ph.D Student Details", "-", "-",
                                    label + " (Total Students)", val))
                        continue

                    # ── (2018-F) PhD GRADUATED ────────────────────────────────
                    # Separate table with its own heading.
                    # row0 = ['','2016-17','2015-16','2014-15']
                    # row1 = ['Full Time','172','193','197']   row2 = ['Part Time','0','0','0']
                    elif "no. of ph.d students graduated" in btw_l:
                        yr_cols = [c for c in r0[1:] if c and re.match(r'\d{4}-\d{2}', c)]
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells: continue
                            label = cells[0]
                            if label not in ("Full Time", "Part Time"): continue
                            for ci, yr in enumerate(yr_cols):
                                val = cells[ci + 1] if ci + 1 < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Ph.D Student Details",
                                        "No. of Ph.D students graduated (including Integrated Ph.D)",
                                        yr, label + " Graduated", val))
                        continue

                    # ── (2018-G) UNIVERSITY EXAM DETAILS ─────────────────────
                    # row0 = ['Academic Year','Program','No. of students admitted in the first year',
                    #          'No. of students admitted through lateral entry',
                    #          'No. of students graduating in minimum stipulated time']
                    elif "university exam details" in btw_l:
                        hdrs = r0
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr   = cells[0]
                            prog = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(hdrs[2:], 2):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow("University Exam Details", prog, yr, h, val))
                        continue

                    # ── (2018-H) FINANCIAL RESOURCES AND ITS UTILIZATION ──────
                    # Single combined table: CapEx + OpEx + Total in columns.
                    # row0 = ['Financial Year','Annual Capital Expenditure (in Rs.)',
                    #          'Annual Operational Expenditure (in Rs.)','Total Annual Expenditure (in Rs.)']
                    # Data rows: ['2014-15','12562128799.00','14487100000.00','27049228799.00']
                    #
                    # CROSS-PAGE SPLIT (IR-2-E-OE-U-0456):
                    #   p1: between="Financial Resources..." + header + 2 data rows
                    #   p2: between="Financial Resources..." + 1 data row (no header)
                    elif "financial resources and its utilization" in btw_l:
                        FIN_HDRS = ["Financial Year",
                                    "Annual Capital Expenditure (in Rs.)",
                                    "Annual Operational Expenditure (in Rs.)",
                                    "Total Annual Expenditure (in Rs.)"]
                        # Determine if row0 is header or first data row
                        if r0[0] == "Financial Year":
                            last_2018_fin_open = True
                            data_rows = table[1:]
                        else:
                            # Continuation page: row0 is already a data row
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r'\d{4}-\d{2}', yr): continue
                            for ci, h in enumerate(FIN_HDRS[1:], 1):
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Financial Resources and its Utilization",
                                        "-", yr, h, re.sub(r'\.00$', '', val)))
                        continue

                    # ── (2018-I) PUBLICATION DETAILS ──────────────────────────
                    # row0 = ['Source of Data','Publications','Citations','Top 25 % Highly Cited Papers']
                    # data: ['Web of Science','4517','19643','1291'], ['Scopus','4926','22764','812']
                    #
                    # CROSS-PAGE SPLIT (IR-1-D-D-N-15):
                    #   p1: between="Publication Details..." + header + Web of Science row
                    #   p2: between="Publication Details..." + Scopus row (no header)
                    elif "publication details" in btw_l:
                        if r0[0] == "Source of Data":
                            # Opening table: has header row
                            last_2018_pub_hdrs = r0
                            data_rows = table[1:]
                        else:
                            # Continuation: row0 is already a data row (e.g. Scopus)
                            data_rows = table
                        hdrs = last_2018_pub_hdrs if last_2018_pub_hdrs else r0
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            src_label = cells[0]
                            for ci, h in enumerate(hdrs[1:], 1):
                                if not h: continue
                                val = cells[ci] if ci < len(cells) else ""
                                if val:
                                    results.append(mkrow(
                                        "Publication Details", src_label, "-", h, val))
                        continue

                    # ── (2018-J) PATENT DETAILS ───────────────────────────────
                    # row0 = ['No. of Patents Granted','No. of Patents Published','Earnings from Patents (in Rs.)']
                    # row1 = ['6','34','0.00']   (single aggregate row, no year)
                    #
                    # CROSS-PAGE SPLIT (IR-1-D-D-C-29255):
                    #   p1: between="Patent Details..." + header-only table (no data row)
                    #   p2: between="Patent Details..." + data row ['0','0','15256000000.00']
                    elif "patent details" in btw_l:
                        # Detect if this is a header row (contains text like "No. of Patents")
                        _is_patent_hdr = any("patent" in (c or "").lower() or "earning" in (c or "").lower()
                                             for c in r0)
                        if _is_patent_hdr:
                            # Header row seen — store it and wait for data row
                            last_2018_patent_hdrs = r0
                            data_rows = table[1:]   # may be empty (header-only split)
                        else:
                            # Continuation: row0 is already the data row
                            data_rows = table
                        hdrs = last_2018_patent_hdrs if last_2018_patent_hdrs else r0
                        for data_r in data_rows:
                            vals = [clean(c) for c in data_r]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(vals):
                                    val = re.sub(r'\.00$', '', vals[hi])
                                    if val:
                                        results.append(mkrow(
                                            "Patent Details", "-", "-", hdr, val))
                        continue

                    # ── (2018-K) SPONSORED RESEARCH PROJECT DETAILS ───────────
                    # row0 = ['Financial Year','Amount (in Rs.)'] — header (may be header-only)
                    #  OR  row0 = ['2014-15','1695716216.00']     — data row (continuation page)
                    #
                    # CROSS-PAGE SPLITS:
                    #   IR-1-L-L-U-0238: p1 header-only table, p2 data rows (same between-text)
                    #   IR-1-P-P-U-0380: p1 header + 1 row, p2 remaining rows (same between-text)
                    #   IR-5-A-OEMAL-U-0573: p1 header-only, p2 data rows (same between-text)
                    elif "sponsored research project details" in btw_l:
                        if r0[0] == "Financial Year":
                            last_2018_sr_open = True
                            data_rows = table[1:]   # may be empty if header-only
                        else:
                            # Continuation: row0 is already a data row
                            last_2018_sr_open = False
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r'\d{4}-\d{2}', yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Sponsored Research Details", "-", yr,
                                    "Amount (in Rs.)", re.sub(r'\.00$', '', val)))
                        continue

                    # ── (2018-L) CONSULTANCY PROJECT DETAILS ─────────────────
                    # row0 = ['Financial Year','Amount (in Rs.)'] always has header
                    elif "consultancy project details" in btw_l:
                        if r0[0] == "Financial Year":
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r'\d{4}-\d{2}', yr): continue
                            val = cells[1] if len(cells) > 1 else ""
                            if val:
                                results.append(mkrow(
                                    "Consultancy Project Details", "-", yr,
                                    "Amount (in Rs.)", re.sub(r'\.00$', '', val)))
                        continue

                    # ── (2018-M) EXECUTIVE DEVELOPMENT PROGRAMS ───────────────
                    # row0 = ['Financial Year','Total no. of Executive Development Programs',
                    #          'Total no. of Participants','Total Annual Earnings (Amount in Rupees)',
                    #          'Total Annual Earnings in Words)']
                    #
                    # CROSS-PAGE SPLIT (IR-1-O-O-U-0220):
                    #   p1: between="Executive Development Programs"
                    #       row0 = ['Financial Year','Total no. of Executive Development',...] ← BROKEN header
                    #       (no data rows — header broke across pages)
                    #   p2: between="Executive Development Programs"
                    #       row0 = ['','Programs','','',''] ← continuation of broken header → SKIP
                    #       row1 = ['2014-15','0','0','0.00','Zero'] ← first data row
                    elif "executive development programs" in btw_l:
                        EDP_HDRS = ["Total no. of Executive Development Programs",
                                    "Total no. of Participants",
                                    "Total Annual Earnings (Amount in Rupees)",
                                    "Total Annual Earnings in Words"]
                        if r0[0] == "Financial Year":
                            # Normal header row — data follows in same table
                            last_2018_edp_open = True
                            data_rows = table[1:]
                        elif r0[0] == "" and "programs" in (r0[1] or "").lower():
                            # Broken header continuation row — skip it, data is in rows below
                            last_2018_edp_open = False
                            data_rows = table[1:]
                        else:
                            data_rows = table
                        for r in data_rows:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            if not re.match(r'\d{4}-\d{2}', yr): continue
                            for ci, h in enumerate(EDP_HDRS):
                                val = cells[ci + 1] if ci + 1 < len(cells) else ""
                                if val:
                                    v_out = re.sub(r'\.00$', '', val) if re.match(r'[\d.]+$', val) else val
                                    results.append(mkrow(
                                        "Executive Development Programs",
                                        "-", yr, h, v_out))
                        continue

                    # ── (2018-N) FACILITIES FOR PHYSICALLY CHALLENGED ─────────
                    # HORIZONTAL table: row0 = 3 question columns, row1 = 3 answer columns.
                    # Heading: "Facilities for Physically Challenged Students"
                    # (different wording from 2019+ "PCS Facilities: Facilities of Physically Challenged Students")
                    #
                    # CROSS-PAGE SPLIT (IR-1-C-C-C-8213):
                    #   p1: between="Facilities for Physically Challenged Students"
                    #       row0 = ['Do your institution have Lifts/Ramps ?', ...]  (questions only, no answer row)
                    #   p2: between="Facilities for Physically Challenged Students"
                    #       row0 = ['Yes, in some of the buildings', ...]  (answers only, no question row)
                    elif ("facilities for physically challenged" in btw_l
                          or any("lifts/ramps" in (c or "").lower() for c in r0)):
                        # Detect if row0 contains questions (header) or answers (data)
                        _is_pcs_hdr = any("do your" in (c or "").lower() or "lifts/ramps" in (c or "").lower()
                                          for c in r0)
                        if _is_pcs_hdr:
                            # Header row: store questions, wait for answer row
                            last_2018_pcs_hdrs = r0
                            answer_rows = table[1:]   # may be empty if split
                        else:
                            # Continuation: row0 is the answer row
                            answer_rows = table
                        hdrs = last_2018_pcs_hdrs if last_2018_pcs_hdrs else r0
                        for ans_r in answer_rows:
                            answers = [clean(c) for c in ans_r]
                            for hi, hdr in enumerate(hdrs):
                                if hdr and hi < len(answers) and answers[hi]:
                                    results.append(mkrow(
                                        "PCS Facilities: Facilities of Physically Challenged Students",
                                        "-", "-", hdr, answers[hi]))
                        continue

                    # ── (2018-O) PERCEPTION DETAILS ───────────────────────────
                    # Single-value table: row0=['Perception'], row1=['453']
                    elif "perception details" in btw_l:
                        if len(table) > 1:
                            val = clean(table[1][0]) if table[1] else ""
                            if val:
                                results.append(mkrow("Perception Details", "-", "-", "Perception", val))
                        continue

                    # ── (2018-Z) Unknown 2018 table ───────────────────────────
                    else:
                        continue
                # ══ End of 2018 block — fall through to 2019+ chain ══════════

                row0      = [clean(c) for c in table[0]]
                ncols     = len(row0)
                y_top     = ft.bbox[1]
                between   = clean(page.crop((0, prev_y, page.width, y_top)).extract_text() or "")
                between_l = between.lower()
                above     = clean(page.crop((0, 0, page.width, y_top)).extract_text() or "")
                prev_y    = ft.bbox[3]

                # Reset in_sustainability whenever a clearly different section heading appears
                if between.strip() and "sustainable" not in between_l:
                    in_sustainability = False
                    slp_current_q = None

                # Reset in_mei_iks whenever a new non-blank section heading that is not MEI appears
                if between.strip() and "multiple entry" not in between_l and "indian knowledge" not in between_l:
                    in_mei_iks = False

                # Reset sustainability numeric tracking when a new non-blank between appears
                # that is not one of the sub-sections inside the sustainability block
                SUSTAINABILITY_NUMERIC_SUBSECS = (
                    "details of energy", "details related to environment",
                    "details of waste", "sustainable living"
                )
                if between.strip() and not any(
                        kw in between_l for kw in
                        ("sustainability", "details of energy", "details related",
                         "details of waste", "sustainable living")):
                    in_sustainability_numeric = False
                    last_sustainability_subsec = None
                    last_sustainability_yrcols = []

                if row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1]):
                    last_fin_year_cols = [c for c in row0[1:] if is_year(c)]
                # 2019 expenditure tables use "Academic Year" instead of "Financial Year"
                # Helper: is this an Academic Year expenditure table?
                # True when the section heading is visible either in between-text OR in the
                # trailing text of the previous page (heading fell after the last table there).
                _prev_trail_l = prev_page_trailing_text.lower()
                _is_2019_exp = (
                    row0[0] == "Academic Year" and len(row0) > 1 and is_year(row0[1])
                    and (
                        "financial resources" in between_l
                        or "capital expenditure"   in between_l
                        or "operational expenditure" in between_l
                        or "financial resources"   in _prev_trail_l
                        or "capital expenditure"   in _prev_trail_l
                        or "operational expenditure" in _prev_trail_l
                        or has_utilised_amount_subheader(table)   # row1 = ['','Utilised Amount',...]
                    )
                )
                if _is_2019_exp:
                    last_fin_year_cols = [c for c in row0[1:] if is_year(c)]

                # ── (A) SANCTIONED INTAKE ──────────────────────────────────
                if row0[0] == "Academic Year" and ncols > 1 and is_year(row0[1]):
                    # Guard: don't fire for sustainability numeric tables that also
                    # use "Academic Year" as header (2025 new sections).
                    # Guard: don't fire for 2019-style expenditure tables which use
                    # "Academic Year" instead of "Financial Year" as their year-header row.
                    # Detection uses between-text, prev-page trailing text, OR the presence
                    # of a "Utilised Amount" sub-header row in the table itself.
                    if in_sustainability_numeric:
                        # Route to sustainability numeric extractor instead
                        sec_label = last_sustainability_subsec or "Sustainability Details"
                        results.extend(emit_year_col_table(sec_label, "-", table))
                    elif _is_2019_exp:
                        # 2019-style expenditure: "Academic Year" header instead of "Financial Year".
                        # Section name comes from between-text when present; falls back to
                        # prev_page_trailing_text when the heading overflowed to the previous page.
                        in_phd_grad = False
                        last_generic_section = None; last_generic_extractor = None; in_sustainability = False
                        year_cols = [c for c in row0[1:] if is_year(c)]
                        last_fin_year_cols = year_cols
                        _exp_ctx = between_l if between_l else _prev_trail_l
                        section = expenditure_section_name(_exp_ctx, table)
                        last_exp_section = section
                        in_exp_cont = True
                        # Table structure: row0=year header, row1=['','Utilised Amount',...],
                        # row2=['Annual ...',None,...] (section label), row3+=data rows
                        if has_utilised_amount_subheader(table):
                            results.extend(emit_expenditure_table(section, year_cols, table[2:]))
                        elif len(table) <= 2:
                            pass  # header-only, data on next page
                        else:
                            results.extend(emit_expenditure_table(section, year_cols, table[1:]))
                    else:
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

                # ── (B2) 2025 NEW: IR-V open university student strength ───
                # IR-V uses different columns: No. of Male/Female Students, Socially Challenged,
                # No. of students from Urban/Rural Areas — no Within/Outside State breakdown.
                # Branch B already handles this (detects "No. of Male" in row0), so no change needed.

                # ── (C) PLACEMENT header ───────────────────────────────────
                # 2025: between-text format changed to:
                #   "Placement & Higher Studies UG [4 Years Program(s)]: Placement & higher studies..."
                #   "UG [4 Years Program(s)]: Placement & higher studies for previous 3 years"
                # Both are caught by PROG_PATTERN (looks for UG/PG/PG-Integrated [...])
                elif (row0[0] == "Academic Year"
                        and any("first year" in h.lower() for h in row0)):
                    in_phd_grad = False; in_exp_cont = False
                    pm = re.search(PROG_PATTERN, between, re.I)
                    if pm:
                        cur_placement_program = clean(pm.group(1))
                    elif not between.strip():
                        if prev_page_last_prog:
                            cur_placement_program = prev_page_last_prog
                    cur_placement_headers = [clean(h) for h in row0]
                    results.extend(emit_placement_rows(
                        cur_placement_headers, table[1:],
                        cur_placement_program or "Unknown"))

                # ── (D) PLACEMENT data continuation ───────────────────────
                elif (cur_placement_headers and ncols >= 7
                        and is_year(row0[0])
                        and row0[1] and not is_year(row0[1])
                        and re.match(r'^\d+$', row0[1])):
                    results.extend(emit_placement_rows(
                        cur_placement_headers, table,
                        cur_placement_program or "Unknown"))

                # ── (E) PhD normal layout ─────────────────────────────────
                elif "ph.d" in clean(row0[0]).lower() or "doctoral" in clean(row0[0]).lower():
                    in_exp_cont = False
                    phd_rows, grad_yrs, found_fullpart = emit_phd_rows(table, above)
                    results.extend(phd_rows)
                    if grad_yrs:
                        last_phd_grad_years = grad_yrs; in_phd_grad = True
                        phd_pending_prog = None; phd_pending_partial = False
                    elif not found_fullpart:
                        m_prog = re.search(
                            r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
                            " ".join(clean(c) for c in table[0] if c) + " " + above, re.I)
                        phd_pending_prog    = clean(m_prog.group(1)) if m_prog else \
                                              "Ph.D (Student pursuing doctoral program)"
                        phd_pending_partial = False
                    else:
                        has_parttime = any(clean(r[0] if r else "") == "Part Time"
                                           for r in table[1:])
                        if not has_parttime:
                            m_prog = re.search(
                                r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
                                " ".join(clean(c) for c in table[0] if c) + " " + above, re.I)
                            phd_pending_prog    = clean(m_prog.group(1)) if m_prog else \
                                                  "Ph.D (Student pursuing doctoral program)"
                            phd_pending_partial = True
                        else:
                            phd_pending_prog = None; phd_pending_partial = False

                # ── (E2) PhD agriculture-style ─────────────────────────────
                elif (not between.strip()
                        and not row0[0]
                        and any("total students" in clean(c).lower() for c in row0 if c)
                        and "ph.d" in prev_page_trailing_text.lower()):
                    in_exp_cont = False; phd_pending_prog = None; phd_pending_partial = False
                    m_prog = re.search(
                        r'(Ph\.?D\s*\(Student pursuing doctoral program[^)]+\))',
                        prev_page_trailing_text, re.I)
                    phd_heading = clean(m_prog.group(1)) if m_prog else \
                                  "Ph.D (Student pursuing doctoral program)"
                    synthetic = [[phd_heading]] + list(table)
                    phd_rows, grad_yrs, _ = emit_phd_rows(synthetic, prev_page_trailing_text)
                    results.extend(phd_rows)
                    if grad_yrs:
                        last_phd_grad_years = grad_yrs; in_phd_grad = True

                # ── (E3) PhD cross-page continuation ──────────────────────
                elif (phd_pending_prog is not None
                        and not between.strip()
                        and row0[0] in ("Full Time", "Part Time")
                        and ncols >= 3
                        and any(re.match(r'^\d+$', clean(c)) for c in row0[1:] if c)):
                    in_exp_cont = False
                    sec       = "Ph.D Student Details"
                    grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
                    in_grad_here = False; grad_yrs_here = []
                    for r in table:
                        cells = [clean(c) for c in r]; first = cells[0] if cells else ""
                        if "graduated" in first.lower() or "integrated ph.d" in first.lower():
                            in_grad_here = True; continue
                        if in_grad_here and not first and any(is_year(c) for c in cells[1:] if c):
                            grad_yrs_here = [c for c in cells[1:] if is_year(c)]
                            last_phd_grad_years = grad_yrs_here; in_phd_grad = True; continue
                        if in_grad_here and grad_yrs_here and first in ("Full Time", "Part Time"):
                            for ci, yr in enumerate(grad_yrs_here):
                                val = cells[ci + 1] if ci + 1 < len(cells) else ""
                                if val:
                                    results.append(mkrow(sec, grad_prog, yr,
                                                         "{} Graduated".format(first), val))
                            continue
                        if first in ("Full Time", "Part Time"):
                            val = next((c for c in reversed(cells)
                                        if re.match(r'^\d+$', c or "")), None)
                            if val:
                                results.append(mkrow(sec, phd_pending_prog, "-",
                                                     "{} Students (Total Students)".format(first),
                                                     val))
                    phd_pending_prog = None; phd_pending_partial = False

                # ── (F) PhD graduated continuation ────────────────────────
                elif (in_phd_grad
                        and row0[0] in ("Full Time", "Part Time")
                        and ncols >= 2 and not is_year(row0[1])
                        and re.match(r'^\d+$', row0[1] or "")):
                    sec       = "Ph.D Student Details"
                    grad_prog = "No. of Ph.D students graduated (including Integrated Ph.D)"
                    for r in table:
                        cells = [clean(c) for c in r]
                        first = cells[0] if cells else ""
                        if first not in ("Full Time", "Part Time"): continue
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
                    last_generic_section = None; last_generic_extractor = None; in_sustainability = False
                    for r in table:
                        if not r or not r[0]: continue
                        q = re.sub(r'^\d+[a-z]?\.\s*', '', clean(r[0]))
                        a = clean(r[1]) if len(r) > 1 else ""
                        results.append(mkrow(
                            "PCS Facilities: Facilities of Physically Challenged Students",
                            "-", "-", q, a))

                # ── (G1) OPD ATTENDANCE & BED OCCUPANCY ───────────────────
                elif ("opd" in between_l or "bed occupancy" in between_l
                      or "out patient" in between_l or "outpatient" in between_l
                      or (not between.strip() and
                          ("opd" in prev_page_trailing_text.lower()
                           or "bed occupancy" in prev_page_trailing_text.lower()))):
                    in_phd_grad = False; in_exp_cont = False
                    for r in table:
                        if not r or not r[0]: continue
                        q = re.sub(r'^\d+[a-z]?\.\s*', '', clean(r[0]))
                        a = clean(r[1]) if len(r) > 1 else ""
                        if q:
                            results.append(mkrow(
                                "OPD Attendance & Bed Occupancy", "-", "-", q, a))

                # ── (G2) ACCREDITATION ─────────────────────────────────────
                elif "accredit" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    body_m = re.search(r'(NAAC|NBA|NIRF|IET|ABET|UGC)', between, re.I)
                    body   = body_m.group(1).upper() if body_m else "Accreditation"
                    sec    = "Accreditation"
                    q0   = clean(table[0][0]) if table[0] else ""
                    ans0 = next((clean(c) for c in table[0][1:] if clean(c) and
                                 clean(c).upper() in ("YES","NO")), "")
                    if q0 and ans0:
                        q0 = re.sub(r'^\d+\.\s*', '', q0)
                        results.append(mkrow(sec, body, "-", q0, ans0))
                    if len(table) >= 3:
                        headers = [clean(c) for c in table[1]]
                        values  = [clean(c) for c in table[2]]
                        for ci, h in enumerate(headers):
                            if not h: continue
                            v = values[ci] if ci < len(values) else ""
                            if v:
                                results.append(mkrow(sec, body, "-", h, v))

                # ── (G3) 2025 NEW: MULTIPLE ENTRY/EXIT AND INDIAN KNOWLEDGE SYSTEM ──
                # New section in 2025 PDFs. 2-col key-value table with 5 YES/NO questions.
                # Three arrival patterns:
                #   a) between = "Multiple Entry/Exit and Indian Knowledge System"  (normal)
                #   b) between = ""  but row0[0] starts with "1. Has your institution implemented"
                #      (MEI/IKS table immediately follows PCS with no visible heading text)
                #   c) between = ""  and in_mei_iks = True  (split-page continuation, rows 2-5)
                #      GUARD: ncols >= 2 required — MEI/IKS is always a 2-col Q/A table.
                #      This prevents 1-col Sustainable Living bullet tables from being stolen
                #      when in_mei_iks happens to still be True at the page boundary.
                elif ("multiple entry" in between_l or "indian knowledge" in between_l
                      or (not between.strip() and in_mei_iks and ncols >= 2)
                      or (not between.strip() and ncols >= 2
                          and row0[0] and "has your institution implemented multiple entry" in row0[0].lower())):
                    in_phd_grad = False; in_exp_cont = False
                    in_mei_iks = True
                    sec = "Multiple Entry/Exit and Indian Knowledge System"
                    for r in table:
                        if not r or not r[0]: continue
                        q = re.sub(r'^\d+\.\s*', '', clean(r[0]))
                        a = clean(r[1]) if len(r) > 1 else ""
                        if q and a:
                            results.append(mkrow(sec, "-", "-", q, a))

                # ── (G4) 2025 NEW: PRIOR LEARNING AT DIFFERENT LEVELS (IR-S) ──
                # New section specific to IR-S (skill university) PDFs.
                # between = "Prior Learning at Different Levels (Certificate/Diploma/UG)"
                # Table: Academic Year | Certificate Level | Diploma Level | UG Level
                elif "prior learning" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    sec = "Prior Learning at Different Levels"
                    headers = [clean(h) for h in row0]
                    for r in table[1:]:
                        cells = [clean(c) for c in r]
                        if not cells or not cells[0]: continue
                        yr = cells[0]
                        for ci, h in enumerate(headers[1:], 1):
                            if not h or ci >= len(cells): continue
                            val = cells[ci]
                            if val:
                                results.append(mkrow(sec, "-", yr, h, val))

                # ── (G5) 2025 NEW: CURRICULUM DESIGN (IR-S) ───────────────
                # New section specific to IR-S (skill university) PDFs.
                # between = "Curriculum Design 1.Details of the programs..."
                # Table: ['Total Number of Programs', 'No. of Programs...'] / ['6', '6'] /
                #        ['2. Number of Qualifications...', '187']
                elif "curriculum design" in between_l or "ncvet" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    sec = "Curriculum Design"
                    if len(row0) == 2 and row0[0] and not re.match(r'^\d+$', row0[0]):
                        # Header row present: row0=[col1_header, col2_header], row1=[val1, val2]
                        col1_hdr = row0[0]; col2_hdr = row0[1]
                        for r in table[1:]:
                            cells = [clean(c) for c in r]
                            if not cells: continue
                            first = cells[0]
                            if not first: continue
                            # Numbered sub-question like "2. Number of Qualifications..."
                            if re.match(r'^\d+\.', first):
                                q = re.sub(r'^\d+\.\s*', '', first)
                                val = cells[1] if len(cells) > 1 else ""
                                if val:
                                    results.append(mkrow(sec, "-", "-", q, val))
                            else:
                                # Value row matching header columns
                                val2 = cells[1] if len(cells) > 1 else ""
                                if first:
                                    results.append(mkrow(sec, "-", "-", col1_hdr, first))
                                if val2:
                                    results.append(mkrow(sec, "-", "-", col2_hdr, val2))
                    else:
                        # Fallback: just emit first two cells per row
                        for r in table:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            q = re.sub(r'^\d+\.\s*', '', cells[0])
                            val = cells[1] if len(cells) > 1 else ""
                            if q and val:
                                results.append(mkrow(sec, "-", "-", q, val))

                # ── (H) FACULTY DETAILS ────────────────────────────────────
                elif ncols >= 2 and "faculty" in row0[0].lower():
                    in_phd_grad = False; in_exp_cont = False
                    last_generic_section = None; last_generic_extractor = None; in_sustainability = False
                    for r in table:
                        if not r or not r[0]: continue
                        metric = clean(r[0])
                        val    = clean(r[1]) if len(r) > 1 else ""
                        if "faculty" in metric.lower() and val:
                            results.append(mkrow("Faculty Details", "-", "-", metric, val))

                # ── (I) EXPENDITURE full table ─────────────────────────────
                elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
                        and has_utilised_amount_subheader(table)):
                    in_phd_grad = False
                    last_generic_section = None; last_generic_extractor = None; in_sustainability = False
                    year_cols = [c for c in row0[1:] if is_year(c)]
                    section   = expenditure_section_name(between_l, table)
                    last_exp_section = section
                    in_exp_cont = True
                    results.extend(emit_expenditure_table(section, year_cols, table[2:]))

                # ── (J) EXPENDITURE header-only (data on next page) ────────
                elif (row0[0] == "Financial Year" and len(row0) > 1 and is_year(row0[1])
                        and len(table) <= 2
                        and not any(
                            row and row[0] and not is_year(row[0])
                            and row[0] not in ("", "Financial Year")
                            and "utilised amount" not in clean(row[0]).lower()
                            and "annual" not in clean(row[0]).lower()
                            for row in table[1:]
                        )):
                    in_phd_grad   = False
                    in_exp_cont   = True
                    last_exp_section = expenditure_section_name(between_l, table)

                # ── (K) EXPENDITURE continuation — subheader + data ────────
                elif (in_exp_cont and not row0[0]
                        and any("utilised amount" in clean(c).lower() for c in row0[1:] if c)):
                    in_exp_cont = False
                    section = last_exp_section or expenditure_section_name(between_l, table)
                    results.extend(emit_expenditure_table(section, last_fin_year_cols, table[1:]))

                # ── (K3) EXPENDITURE continuation — "Annual ..." header row then data ──
                elif (in_exp_cont
                        and not between.strip()
                        and row0[0] and "annual" in row0[0].lower()
                        and not is_year(row0[0])
                        and len(table) > 1):
                    section = last_exp_section or expenditure_section_name(between_l, table)
                    results.extend(emit_expenditure_table(section, last_fin_year_cols, table[1:]))

                # ── (K2) EXPENDITURE continuation — line items overflow ─────
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

                # ── (L) SPONSORED RESEARCH ─────────────────────────────────
                elif (table_contains(table, "sponsored projects")
                        or "sponsored research" in between_l):
                    in_phd_grad = False; in_exp_cont = False
                    yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
                    data_rows = table[1:] if row0[0] == "Financial Year" else table
                    results.extend(emit_simple_year_table(
                        "Sponsored Research Details", "All Programs", yr_cols, data_rows))
                    last_simple_section   = "Sponsored Research Details"
                    last_simple_year_cols = yr_cols

                # ── (M) EDP ────────────────────────────────────────────────
                elif (table_contains(table, "executive development programs")
                        or table_contains(table, "management development")
                        or "executive development" in between_l
                        or ("executive development" in prev_page_trailing_text.lower()
                            and not between.strip()
                            and row0[0] == "Financial Year"
                            and len(row0) > 1 and is_year(row0[1]))):
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
                        or "consultancy project" in between_l
                        or ("consultancy" in prev_page_trailing_text.lower()
                            and not between.strip()
                            and row0[0] == "Financial Year"
                            and len(row0) > 1 and is_year(row0[1]))):
                    in_phd_grad = False; in_exp_cont = False
                    yr_cols   = [c for c in row0[1:] if is_year(c)] or last_fin_year_cols
                    data_rows = table[1:] if row0[0] == "Financial Year" else table
                    results.extend(emit_simple_year_table(
                        "Consultancy Project Details", "All Programs", yr_cols, data_rows))
                    last_simple_section   = "Consultancy Project Details"
                    last_simple_year_cols = yr_cols

                # ── (O) SIMPLE SECTION continuation ───────────────────────
                elif (last_simple_section
                        and not between.strip()
                        and ncols >= 2
                        and is_simple_data_row(row0[0])):
                    results.extend(emit_simple_year_table(
                        last_simple_section, "All Programs",
                        last_simple_year_cols, table))

                # ── (P) SUSTAINABILITY DETAILS (2025 updated) ─────────────
                # 2025 adds multiple sub-sections inside Sustainability:
                #   a) "Sustainability Details" header → opens with a Description+year col table
                #   b) "Details of Energy and Water Consumption" → Academic Year + year col table
                #   c) "Details Related to Environment" → continuation of (b) with more metrics
                #   d) "Details of Waste generated, recycled and reused" → Academic Year + year col table
                #   e) "Sustainable Living Practices" → multi-choice text table (1-col lists)
                # Old YES/NO pattern (2023/2024) still fires for those PDFs.

                # P-1: "Sustainability Details" header → Description + year cols (numeric table)
                elif "sustainability details" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True
                    in_sustainability_numeric = True
                    last_sustainability_subsec = "Sustainability Details"
                    yr_cols = [c for c in row0[1:] if c]
                    last_sustainability_yrcols = yr_cols
                    results.extend(emit_year_col_table("Sustainability Details", "-", table))

                # P-2: "Details of Energy and Water Consumption" (2025)
                elif "details of energy" in between_l or "energy and water" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True
                    in_sustainability_numeric = True
                    last_sustainability_subsec = "Sustainability Details: Energy and Water Consumption"
                    yr_cols = [c for c in row0[1:] if c]
                    last_sustainability_yrcols = yr_cols
                    results.extend(emit_year_col_table(
                        "Sustainability Details: Energy and Water Consumption", "-", table))

                # P-3: "Details Related to Environment" (2025) — often between='' continuation
                elif ("details related to environment" in between_l
                      or (in_sustainability_numeric
                          and not between.strip()
                          and last_sustainability_subsec and
                          "energy" in last_sustainability_subsec.lower()
                          and row0[0] and not is_year(row0[0])
                          and row0[0] != "Academic Year")):
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True
                    in_sustainability_numeric = True
                    if between.strip():
                        last_sustainability_subsec = "Sustainability Details: Environment"
                    results.extend(emit_year_col_table(
                        last_sustainability_subsec or "Sustainability Details: Environment",
                        "-", table))

                # P-4: "Details of Waste generated, recycled and reused" (2025)
                elif "details of waste" in between_l or "waste generated" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True
                    in_sustainability_numeric = True
                    last_sustainability_subsec = "Sustainability Details: Waste"
                    yr_cols = [c for c in row0[1:] if c]
                    last_sustainability_yrcols = yr_cols
                    results.extend(emit_year_col_table(
                        "Sustainability Details: Waste", "-", table))

                # P-5: "Sustainable Living Practices" (2025) — multi-choice text answers
                elif "sustainable living" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True
                    in_sustainability_numeric = False
                    last_sustainability_subsec = "Sustainable Living Practices"
                    # Table is a 1-col list: numbered questions mixed with answer-option rows.
                    # slp_current_q persists across tables/pages so that bullet rows arriving
                    # on a continuation page can still be attributed to the last question.
                    for r in table:
                        if not r or not r[0]: continue
                        cell = clean(r[0])
                        if not cell: continue
                        if re.match(r'^\d+[\.\)]', cell):
                            slp_current_q = re.sub(r'^\d+[\.\)]\s*', '', cell)
                            if len(r) > 1 and clean(r[1]):
                                results.append(mkrow(
                                    "Sustainable Living Practices", "-", "-",
                                    slp_current_q, clean(r[1])))
                        elif slp_current_q:
                            option = re.sub(r'^[•\-]\s*', '', cell)
                            if option:
                                results.append(mkrow(
                                    "Sustainable Living Practices", "-", "-",
                                    slp_current_q, option))

                # P-6: Old-style sustainability YES/NO table (2023/2024 PDFs)
                # and continuation of multi-page Sustainable Living Practices (2025).
                #
                # Fires when any of these are true:
                #   a) between contains "sustainability" (old-style heading)
                #   b) between='' and prev_page_trailing_text contains "sustainability"
                #   c) between='' and in_sustainability=True and
                #      last_sustainability_subsec == "Sustainable Living Practices"
                #      (catches bullet-only tables that start with '•' after a page break)
                #
                # The old guard requiring row0[0] to start with a digit has been removed —
                # that was causing bullet-only continuation tables to be silently dropped.
                elif ("sustainability" in between_l
                      or (not between.strip()
                          and "sustainable" in prev_page_trailing_text.lower())
                      or (in_sustainability
                          and last_sustainability_subsec == "Sustainable Living Practices"
                          and not between.strip())):
                    in_phd_grad = False; in_exp_cont = False
                    in_sustainability = True

                    # Is this 2025 Sustainable Living Practices (multi-choice text)?
                    is_slp = (last_sustainability_subsec == "Sustainable Living Practices"
                              or (in_sustainability_numeric is False
                                  and "sustainable living" in prev_page_trailing_text.lower()))

                    if is_slp:
                        # Seed slp_current_q from prev_page_trailing_text when the page
                        # boundary falls between a question row and its bullet answers.
                        # Pattern: trailing text ends with "... N. <question text>?"
                        # Example (IR-O-U-0691): trailing = "Sustainable Living Practices
                        #   1. What specific programs does ... single-use plastics on campus?"
                        if slp_current_q is None and prev_page_trailing_text:
                            q_match = re.search(
                                r'\d+[\.\)]\s+((?:what|which|does|is|how)[^?]+\?)',
                                prev_page_trailing_text, re.I)
                            if q_match:
                                slp_current_q = q_match.group(1).strip()

                        for r in table:
                            if not r or not r[0]: continue
                            cell = clean(r[0])
                            if not cell: continue
                            if re.match(r'^\d+[\.\)]', cell):
                                slp_current_q = re.sub(r'^\d+[\.\)]\s*', '', cell)
                                if len(r) > 1 and clean(r[1]):
                                    results.append(mkrow(
                                        "Sustainable Living Practices", "-", "-",
                                        slp_current_q, clean(r[1])))
                            elif slp_current_q:
                                option = re.sub(r'^[•\-]\s*', '', cell)
                                if option:
                                    results.append(mkrow(
                                        "Sustainable Living Practices", "-", "-",
                                        slp_current_q, option))
                    else:
                        # Old-style YES/NO questions (2023/2024 PDFs)
                        for r in table:
                            if not r or not r[0]: continue
                            q = re.sub(r'^\d+[\.\d]*\s*', '', clean(r[0]))
                            a = clean(r[1]) if len(r) > 1 else ""
                            if q:
                                results.append(mkrow(
                                    "Sustainability Details", "-", "-", q, a))

                # ── (Q) VOCATIONAL CERTIFICATE COURSES ────────────────────
                elif "vocational" in between_l:
                    in_phd_grad = False; in_exp_cont = False
                    headers = [clean(h) for h in table[0]]
                    last_generic_section   = "Vocational Certificate Courses"
                    last_generic_headers   = headers
                    last_generic_extractor = 'vocational'
                    for r in table[1:]:
                        cells = [clean(c) for c in r]
                        if not cells or not cells[0]: continue
                        yr = cells[0]
                        for ci, h in enumerate(headers[1:], 1):
                            if not h or ci >= len(cells): continue
                            val = cells[ci]
                            if not val: continue
                            if "salary" in h.lower() or "median" in h.lower():
                                val = re.match(r'^([\d,.]+)', val.replace(' ', ''))
                                val = val.group(1).replace(',', '') if val else cells[ci]
                            results.append(mkrow(
                                "Vocational Certificate Courses", "-",
                                "{} (Graduation Year)".format(yr), h, val))

                # ── (R) NEW PROGRAMS DEVELOPED / PROGRAMS REVISED ─────────
                elif ("new programs developed" in between_l or "programs revised" in between_l
                      or "new programmes developed" in between_l or "programmes revised" in between_l
                      or (not between.strip() and
                          ("programs revised" in prev_page_trailing_text.lower()
                           or "programmes revised" in prev_page_trailing_text.lower()
                           or "new programs developed" in prev_page_trailing_text.lower()
                           or "new programmes developed" in prev_page_trailing_text.lower()))):
                    in_phd_grad = False; in_exp_cont = False
                    trail_l = prev_page_trailing_text.lower()
                    if between.strip():
                        sec_label = ("New Programs Developed" if "new programs" in between_l
                                     else "Programs Revised")
                    else:
                        sec_label = ("Programs Revised"
                                     if ("programs revised" in trail_l or "programmes revised" in trail_l)
                                     else "New Programs Developed")
                    headers = [clean(h) for h in table[0]]
                    last_generic_section   = sec_label
                    last_generic_headers   = headers
                    last_generic_extractor = 'new_programs'
                    for r in table[1:]:
                        cells = [clean(c) for c in r]
                        if not cells or not cells[0]: continue
                        yr        = cells[0]
                        prog_name = cells[1] if len(cells) > 1 else "-"
                        for ci, h in enumerate(headers[2:], 2):
                            if not h or ci >= len(cells): continue
                            val = cells[ci]
                            if val:
                                results.append(mkrow(
                                    sec_label, prog_name,
                                    "{} (Academic Year)".format(yr), h, val))

                # ── (S) INNOVATION CATEGORY SECTIONS ──────────────────────
                elif (any(k in between_l for k in (
                        "start up recognized", "startups which have got",
                        "patents", "innovation grant", "innovations at various",
                        "ventures/startups", "alumni that are",
                        "pre-incubation", "incubation", "fdp",
                        "academic courses in innovation", "fdi investment"))
                      or
                      (not between.strip() and
                       any(k in prev_page_trailing_text.lower() for k in (
                        "startups which have got vc", "start up recognized",
                        "innovations at various", "ventures/startups grown",
                        "alumni that are founders", "fdp",
                        "academic courses in innovation",
                        "incubation")))):
                    in_phd_grad = False; in_exp_cont = False
                    if between.strip():
                        sec_label = between.strip()
                    else:
                        trail_l = prev_page_trailing_text.lower()
                        if "startups which have got vc" in trail_l:
                            sec_label = "Startups which have got VC investment in previous 3 years"
                        elif "start up recognized" in trail_l:
                            sec_label = "Start up recognized by DPIIT/startup India"
                        elif "innovations at various" in trail_l:
                            sec_label = "Innovations at various stages of Technology Readiness Level"
                        elif "ventures/startups grown" in trail_l:
                            sec_label = "Ventures/startups grown to turnover of 50 lacs"
                        elif "alumni that are founders" in trail_l:
                            sec_label = "Alumni that are Founders of Forbes/Fortune 500 companies"
                        elif "fdp" in trail_l:
                            sec_label = "FDP"
                        elif "academic courses in innovation" in trail_l:
                            sec_label = "Academic Courses in Innovation, Entrepreneurship and IPR"
                        else:
                            sec_label = prev_page_trailing_text.strip()
                    headers = [clean(h) for h in table[0]]
                    is_header = any(c for c in headers if c and not is_year(c)
                                    and not re.match(r'^\d+$', c))
                    data_start = 1 if is_header else 0
                    last_generic_section   = sec_label
                    last_generic_headers   = headers if is_header else []
                    last_generic_extractor = 'row_per_entry'
                    for r in table[data_start:]:
                        cells = [clean(c) for c in r]
                        if not any(c for c in cells if c): continue
                        if last_generic_headers:
                            prog = cells[0] if cells[0] else "-"
                            for ci, h in enumerate(last_generic_headers[1:], 1):
                                if not h or ci >= len(cells): continue
                                v = cells[ci]
                                if v:
                                    results.append(mkrow(sec_label, prog, "-", h, v))
                        else:
                            val = " | ".join(c for c in cells if c)
                            results.append(mkrow(sec_label, "-", "-", "Entry", val))

                # ── (T) MULTI-PAGE GENERIC SECTION CONTINUATION ───────────
                elif (last_generic_section
                        and not between.strip()
                        and last_generic_extractor is not None
                        and not in_mei_iks
                        and row0[0] not in ("Financial Year", "Number of faculty members entered",
                                            "Academic Year", "(All programs of all years)",
                                            "1. Do your institution buildings have Lifts/Ramps?",
                                            "1. Has your institution implemented multiple entry/exit in your institution?")):
                    in_phd_grad = False; in_exp_cont = False
                    sec_label = last_generic_section
                    headers   = last_generic_headers
                    if last_generic_extractor == 'vocational':
                        for r in table:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr = cells[0]
                            for ci, h in enumerate(headers[1:], 1):
                                if not h or ci >= len(cells): continue
                                val = cells[ci]
                                if not val: continue
                                if "salary" in h.lower() or "median" in h.lower():
                                    val = re.match(r'^([\d,.]+)', val.replace(' ', ''))
                                    val = val.group(1).replace(',', '') if val else cells[ci]
                                results.append(mkrow(
                                    sec_label, "-",
                                    "{} (Graduation Year)".format(yr), h, val))
                    elif last_generic_extractor == 'new_programs':
                        for r in table:
                            cells = [clean(c) for c in r]
                            if not cells or not cells[0]: continue
                            yr        = cells[0]
                            prog_name = cells[1] if len(cells) > 1 else "-"
                            for ci, h in enumerate(headers[2:], 2):
                                if not h or ci >= len(cells): continue
                                val = cells[ci]
                                if val:
                                    results.append(mkrow(
                                        sec_label, prog_name,
                                        "{} (Academic Year)".format(yr), h, val))
                    elif last_generic_extractor == 'row_per_entry':
                        for r in table:
                            cells = [clean(c) for c in r]
                            if not any(c for c in cells if c): continue
                            if headers:
                                prog = cells[0] if cells[0] else "-"
                                for ci, h in enumerate(headers[1:], 1):
                                    if not h or ci >= len(cells): continue
                                    v = cells[ci]
                                    if v:
                                        results.append(mkrow(sec_label, prog, "-", h, v))
                            else:
                                val = " | ".join(c for c in cells if c)
                                results.append(mkrow(sec_label, "-", "-", "Entry", val))

            # ── End-of-page tracking ───────────────────────────────────────
            all_prog = list(re.finditer(PROG_PATTERN, page_text, re.I))
            prev_page_last_prog = clean(all_prog[-1].group(1)) if all_prog else None

            if found_tables:
                last_table_bottom = found_tables[-1].bbox[3]
                prev_page_trailing_text = clean(
                    page.crop((0, last_table_bottom, page.width, page.height))
                    .extract_text() or "")
            else:
                prev_page_trailing_text = page_text

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
