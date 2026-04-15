"use client";
/**
 * NIRFCharts.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Trend-line charts for every InstituteDetail tab.
 * Every chart is null-safe — renders nothing when data is insufficient.
 *
 * Exports:
 *   ScoresTrendChart      — one line per NIRF parameter (SS, FSR…) over ranking years
 *   IntakeTrendChart      — one line per program over academic years
 *   PlacementTrendChart   — placed / salary / higher studies per program over grad years
 *   FinancialTrendChart   — one line per expenditure line item over academic years (₹ Cr)
 *   ResearchTrendChart    — projects / agencies / amount per section over academic years
 */

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Theme ──────────────────────────────────────────────────────────────────────
const PALETTE = [
  "#c0392b",
  "#1a7a6e",
  "#7d4fa8",
  "#b5651d",
  "#2e6da4",
  "#5a8a3a",
  "#c0762b",
  "#2b6dc0",
  "#8a5a2e",
  "#3a8a5a",
  "#6d2eb5",
  "#b52e6d",
];
const MONO = "'IBM Plex Mono', monospace";
const BORDER = "#e4e2dd";
const INK300 = "#a8a49c";
const CRIMSON = "#c0392b";

// ── Shared primitives ─────────────────────────────────────────────────────────
export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: `1px solid ${BORDER}`,
        padding: "16px 20px 20px",
        marginBottom: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: CRIMSON,
          marginBottom: 14,
          paddingBottom: 6,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Program Selector ──────────────────────────────────────────────────────────
// Pill-style buttons that sit beside the chart title.
// "All" is always the first option.

const ALL_PROG = "All Programs";

export function ProgramSelector({
  programs,
  selected,
  onChange,
}: {
  programs: string[];
  selected: string;
  onChange: (p: string) => void;
}) {
  if (programs.length <= 1) return null;
  const opts = [ALL_PROG, ...programs];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 14,
        paddingBottom: 12,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: "0.58rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: INK300,
          alignSelf: "center",
          marginRight: 4,
          flexShrink: 0,
        }}
      >
        Program
      </span>
      {opts.map((p) => {
        const active = p === selected;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              fontFamily: MONO,
              fontSize: "0.65rem",
              padding: "3px 10px",
              border: `1px solid ${active ? CRIMSON : BORDER}`,
              background: active ? CRIMSON : "var(--white)",
              color: active ? "#fff" : INK300,
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            {p === ALL_PROG ? "All" : p}
          </button>
        );
      })}
    </div>
  );
}

function Tip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1916",
        border: "1px solid #3d3b36",
        fontFamily: MONO,
        fontSize: "0.68rem",
        color: "#f7f6f3",
      }}
    >
      <p
        style={{
          padding: "6px 10px 4px",
          color: INK300,
          borderBottom: "1px solid #3d3b36",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ padding: "2px 10px", color: p.color }}>
          {p.name}:{" "}
          <strong>
            {fmt ? fmt(p.value, p.name) : p.value?.toLocaleString("en-IN")}
          </strong>
        </p>
      ))}
      <div style={{ height: 6 }} />
    </div>
  );
}

const AX = {
  axisLine: false,
  tickLine: false,
  tick: { fontFamily: MONO, fontSize: 10, fill: INK300 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const BAD_V = new Set([
  "",
  "nan",
  "<na>",
  "-",
  "n/a",
  "na",
  "null",
  "undefined",
  "none",
]);
const isBAD = (v: any) =>
  BAD_V.has(
    String(v ?? "")
      .trim()
      .toLowerCase(),
  );
const toNum = (v: any) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return isNaN(n) ? null : n;
};
function baseYear(y: string) {
  return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
}
function isRealYear(y: any) {
  const s = String(y ?? "").trim();
  return !isBAD(s) && /^\d{4}(-\d{2})?/.test(s);
}
function sortYrs(years: string[]) {
  return [...years].sort((a, b) => {
    const ay = parseInt(a),
      by = parseInt(b);
    return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
  });
}
const shorten = (s: string, n = 22) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

export interface RawMetric {
  metric: string;
  year: string;
  value: string;
  ranking_year: number;
  program: string;
}

function normalizeProg(p: string): string {
  if (!p) return p;
  const s = p.trim();
  // "PG [2 Year Program(s)]" → "PG [2 Years]"
  // "UG [4 Year Program(s)]" → "UG [4 Years]"
  return s
    .replace(/\[(\d+)\s+Year\s+Program\(?s?\)?\]/i, (_, n) => `[${n} Years]`)
    .replace(/\[(\d+)\s+Years?\s+Program\(?s?\)?\]/i, (_, n) => `[${n} Years]`)
    .replace(/\bProgram\(s\)/gi, "")
    .replace(/\bPrograms\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCORES — one line per NIRF parameter over ranking years
// ─────────────────────────────────────────────────────────────────────────────
const PARAM_SHORT: Record<string, string> = {
  img_ss_score: "SS",
  img_fsr_score: "FSR",
  img_fqe_score: "FQE",
  img_fru_score: "FRU",
  img_oe_mir_score: "OE/MIR",
  img_oemir_score: "OEMIR",
  img_pu_score: "PU",
  img_qp_score: "QP",
  img_ipr_score: "IPR",
  img_fppp_score: "FPPP",
  img_gue_score: "GUE",
  img_gphd_score: "GPHD",
  img_rd_score: "RD",
  img_wd_score: "WD",
  img_escs_score: "ESCS",
  img_pcs_score: "PCS",
  img_pr_score: "PR",
  img_pra_score: "PRA",
  img_gph_score: "GPH",
  img_gqe_score: "GQE",
  img_gpg_score: "GPG",
  img_fpi_score: "FPI",
  img_jcr_score: "JCR",
  img_in_score: "IN",
  img_gc_score: "GC",
  img_sctc_score: "SCTC",
  img_fpf_score: "FPF",
  img_gi_score: "GI",
  img_fp_score: "FP",
  img_inx_score: "INX",
  img_tp_score: "TP",
  img_sees_score: "SEES",
  img_sdg_score: "SDG",
  img_col4_score: "COL4",
  img_col1_score: "COL1",
  img_col5_score: "COL5",
  img_col7_score: "COL7",
  img_jex_score: "JEX",
  img_jx_score: "JX",
  img_premp_score: "PREMP",
  img_gphe_score: "GPHE",
  img_ms_score: "MS",
  img_gss_score: "GSS",
  img_oe_score: "OE",
  img_ie_score: "IE",
  img_je_score: "JE",
};

const PARAM_FULL: Record<string, string> = {
  SS: "Student Strength",
  FSR: "Faculty-Student Ratio",
  FQE: "Faculty Qualification & Experience",
  FRU: "Financial Resources Utilization",
  "OE/MIR": "Outreach & Equity Metric (Intl + Regional)",
  OEMIR: "Outreach & Equity Metric (Intl + Regional)",
  PU: "Perception (University)",
  QP: "Quality Publication",
  IPR: "Intellectual Property Rights (Patents)",
  FPPP: "Footprint of Projects & Professional Practice",
  GUE: "Graduation Outcome (UG Employment)",
  GPHD: "Graduation Outcome (PhD Students)",
  RD: "Regional Diversity",
  WD: "Women Diversity",
  ESCS: "Economically Challenged Students",
  PCS: "Physically Challenged Students",
  PR: "Perception Score",
  PRA: "Publications (Research Articles)",
  GPH: "Publications in High Impact Journals",
  GQE: "Quality of Publications",
  GPG: "Publications per Faculty",
  FPI: "Faculty with PhD Index",
  JCR: "Journal Citation Reports",
  IN: "Impact Normalized Citations",
  GC: "Global Citations",
  SCTC: "Scopus Citation Count",
  FPF: "Faculty Publication Productivity",
  GI: "Global Impact",
  FP: "Faculty Publications",
  INX: "Indexed Publications",
  TP: "Teaching Performance",
  SEES: "Social/Environmental Engagement Score",
  SDG: "Sustainable Development Goals Contribution",
  COL1: "Research Collaboration Metric 1",
  COL4: "Collaboration Metric 4",
  COL5: "Collaboration Metric 5",
  COL7: "Collaboration Metric 7",
  JEX: "Joint Exchange Programs",
  JX: "Joint Research/Exchange",
  IE: "International Engagement",
  JE: "Joint Publications",
  PREMP: "Pre-Employment Score",
  GPHE: "Global Perception (Higher Education)",
  MS: "Median Salary",
  GSS: "Graduate Student Strength",
  OE: "Overall Employment Outcome",
};

export function ScoresTrendChart({
  scoresByYear,
  imgCols,
}: {
  scoresByYear: Record<number, Record<string, unknown>>;
  imgCols: string[];
}) {
  const years = Object.keys(scoresByYear)
    .filter((k) => !k.includes("::"))
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (years.length < 2 || !imgCols.length) return null;

  // Include img_total as a special "TOTAL" series
  const allKeys = ["img_total", ...imgCols];

  const data = years.map((yr) => {
    const row = (scoresByYear as Record<string, unknown>)[String(yr)] as Record<
      string,
      unknown
    >;
    if (!row) return { year: yr };
    const pt: Record<string, any> = { year: yr };
    // Add total score
    if (row["img_total"] != null) {
      pt["TOTAL"] = +Number(row["img_total"]).toFixed(2);
    }
    // Add param scores
    for (const k of imgCols) {
      const v = row[k];
      if (v != null) pt[PARAM_SHORT[k] ?? k] = +Number(v).toFixed(2);
    }
    return pt;
  });

  // Build list of available series keys (short names)
  const availableKeys = [
    "TOTAL",
    ...imgCols
      .filter(
        (k) => data.filter((d) => d[PARAM_SHORT[k] ?? k] != null).length >= 2,
      )
      .map((k) => PARAM_SHORT[k] ?? k),
  ].filter((key, _, arr) => arr.indexOf(key) === arr.indexOf(key)); // dedupe

  // Colour per key — TOTAL gets a distinct dark color
  const paramColor: Record<string, string> = { TOTAL: "#1a1916" };
  let ci = 0;
  for (const k of imgCols) {
    const short = PARAM_SHORT[k] ?? k;
    if (!paramColor[short]) {
      paramColor[short] = PALETTE[ci % PALETTE.length];
      ci++;
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(availableKeys.slice(0, 6)),
  );

  const toggleParam = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ALL toggle: if all selected → deselect all except TOTAL; if not all → select all
  const allSelected = availableKeys.every((k) => selected.has(k));
  const toggleAll = () => {
    if (allSelected) {
      // Deselect all — keep only TOTAL so chart isn't empty
      setSelected(new Set(["TOTAL"]));
    } else {
      setSelected(new Set(availableKeys));
    }
  };

  const visibleKeys = availableKeys.filter((k) => selected.has(k));

  // Helper: get pill label with full form
  const pillLabel = (key: string) => {
    if (key === "TOTAL") return "NIRF Total Score";
    const full = PARAM_FULL[key];
    return full ? `${key} (${full})` : key;
  };

  return (
    <ChartCard title="Parameter Scores — Trend by Ranking Year">
      {/* Parameter toggle pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.58rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: INK300,
            alignSelf: "center",
            marginRight: 4,
            flexShrink: 0,
          }}
        >
          Parameters
        </span>

        {/* All toggle */}
        <button
          onClick={toggleAll}
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            padding: "2px 10px",
            border: `1px solid ${allSelected ? CRIMSON : BORDER}`,
            background: allSelected ? CRIMSON : "var(--white)",
            color: allSelected ? "#fff" : INK300,
            cursor: "pointer",
            borderRadius: 2,
            transition: "all 0.12s",
            fontWeight: allSelected ? 600 : 400,
          }}
        >
          {allSelected ? "All ✓" : "All"}
        </button>

        {/* TOTAL pill */}
        {(() => {
          const key = "TOTAL";
          const on = selected.has(key);
          const color = paramColor[key];
          return (
            <button
              key={key}
              onClick={() => toggleParam(key)}
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                padding: "3px 10px",
                border: `1px solid ${on ? color : BORDER}`,
                background: on ? color : "var(--white)",
                color: on ? "#fff" : INK300,
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.12s",
                whiteSpace: "nowrap",
                fontWeight: on ? 600 : 400,
              }}
            >
              NIRF Total Score
            </button>
          );
        })()}

        {/* Individual param pills */}
        {imgCols.map((k) => {
          const key = PARAM_SHORT[k] ?? k;
          const full = PARAM_FULL[key];
          const label = full ? `${key} (${full})` : key;
          const on = selected.has(key);
          const color = paramColor[key];
          if (!availableKeys.includes(key)) return null;
          return (
            <button
              key={k}
              onClick={() => toggleParam(key)}
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                padding: "3px 10px",
                border: `1px solid ${on ? color : BORDER}`,
                background: on ? color : "var(--white)",
                color: on ? "#fff" : INK300,
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.12s",
                whiteSpace: "nowrap",
                fontWeight: on ? 600 : 400,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={380}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 20, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis
            dataKey="year"
            {...AX}
            tick={{ fontFamily: MONO, fontSize: 11, fill: INK300 }}
            tickMargin={8}
          />
          <YAxis
            domain={[0, "auto"]}
            {...AX}
            tick={{ fontFamily: MONO, fontSize: 11, fill: INK300 }}
            width={32}
          />
          <Tooltip content={<Tip fmt={(v: number) => v?.toFixed(2)} />} />
          {/* TOTAL line */}
          {selected.has("TOTAL") && (
            <Line
              key="TOTAL"
              type="monotone"
              dataKey="TOTAL"
              name="NIRF Total Score"
              stroke={paramColor["TOTAL"]}
              strokeWidth={3}
              strokeDasharray="6 3"
              dot={{ r: 5, strokeWidth: 0, fill: paramColor["TOTAL"] }}
              activeDot={{
                r: 7,
                stroke: paramColor["TOTAL"],
                strokeWidth: 2,
                fill: "#fff",
              }}
              connectNulls
            />
          )}
          {/* Param lines */}
          {imgCols.map((k) => {
            const key = PARAM_SHORT[k] ?? k;
            if (!selected.has(key)) return null;
            if (!availableKeys.includes(key)) return null;
            const color = paramColor[key];
            const fullName = PARAM_FULL[key] ?? key;
            return (
              <Line
                key={k}
                type="monotone"
                dataKey={key}
                name={`${key} — ${fullName}`}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 0, fill: color }}
                activeDot={{
                  r: 6,
                  stroke: color,
                  strokeWidth: 2,
                  fill: "#fff",
                }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INTAKE — one line per program over academic years + program selector
// ─────────────────────────────────────────────────────────────────────────────
export function IntakeTrendChart({ metrics }: { metrics: RawMetric[] }) {
  const valid = metrics.filter(
    (m) => isRealYear(m.year) && !isBAD(m.value) && !isBAD(m.program),
  );
  if (!valid.length) return null;

  const yearSet = new Set<string>();
  const map = new Map<string, Map<string, number>>(); // program → year → total

  for (const m of valid) {
    const yr = baseYear(m.year);
    const prog = normalizeProg(m.program);
    const val = toNum(m.value);
    if (!val || val <= 0) continue;
    yearSet.add(yr);
    if (!map.has(prog)) map.set(prog, new Map());
    // Use max instead of sum — same intake value repeats across categories
    const prev = map.get(prog)!.get(yr) ?? 0;
    map.get(prog)!.set(yr, Math.max(prev, val));
  }

  const years = sortYrs(Array.from(yearSet));
  const progs = Array.from(map.keys()).sort();
  if (years.length < 2 || !progs.length) return null;

  // Colour index stable per prog (not per filtered subset)
  const progColor = Object.fromEntries(
    progs.map((p, i) => [p, PALETTE[i % PALETTE.length]]),
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedProg, setSelectedProg] = useState(ALL_PROG);
  const validProg = progs.includes(selectedProg) ? selectedProg : ALL_PROG;

  const visibleProgs =
    validProg === ALL_PROG
      ? progs.filter((p) => {
          const data = years.map((yr) => map.get(p)!.get(yr) ?? null);
          return data.filter((v) => v != null).length >= 2;
        })
      : progs.filter((p) => p === validProg);

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    for (const p of visibleProgs) {
      const v = map.get(p)!.get(yr);
      if (v != null) pt[shorten(p, 20)] = v;
    }
    return pt;
  });

  return (
    <ChartCard title="Sanctioned Intake — Trend by Academic Year">
      <ProgramSelector
        programs={progs}
        selected={validProg}
        onChange={setSelectedProg}
      />
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 16, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis {...AX} />
          <Tooltip content={<Tip />} />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {visibleProgs.map((p) => (
            <Line
              key={p}
              type="monotone"
              dataKey={shorten(p, 20)}
              stroke={progColor[p]}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: progColor[p] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PLACEMENT — full trend covering all year types:
//    • Graduation Year  → Placed, Graduated, Higher Studies, Median Salary
//    • Intake Year      → Intake (sanctioned), Admitted
//    • Lateral Entry    → Lateral Entry admissions
//
//    X-axis = base academic year (e.g. "2019-20")
//    Salary on right Y-axis (₹ L), all counts on left
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 3. PLACEMENT — single chart with program selector pill
//    Props:
//      allMetrics — metrics from ALL programs across ALL ranking years
//      programs   — ordered list of program names for the selector
//
//    X-axis = base academic year ("2016-17" … "2023-24")
//    Salary dashed on right Y-axis (₹ L), counts on left
//    Internal "View" selector switches Graduation / Intake metrics
// ─────────────────────────────────────────────────────────────────────────────
export function PlacementTrendChart({
  allMetrics,
  programs,
}: {
  allMetrics: RawMetric[];
  programs: string[]; // all distinct programs in order
}) {
  const K_PLACED = "Placed";
  const K_HIGHER = "Higher Studies";
  const K_GRAD = "Graduated";
  const K_SALARY = "Median Salary (L)";
  const K_INTAKE = "Intake (Sanctioned)";
  const K_ADMITTED = "Admitted";
  const K_LATERAL = "Lateral Entry";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedProg, setSelectedProg] = useState(ALL_PROG);
  const validProg = programs.includes(selectedProg) ? selectedProg : ALL_PROG;

  const metrics =
    validProg === ALL_PROG
      ? allMetrics
      : allMetrics.filter((m) => normalizeProg(m.program) === validProg);
  const yearSet = new Set<string>();
  const mmap = new Map<string, Map<string, number>>();

  const addVal = (key: string, yr: string, val: number) => {
    yearSet.add(yr);
    if (!mmap.has(key)) mmap.set(key, new Map());
    const prev = mmap.get(key)!.get(yr) ?? 0;
    mmap.get(key)!.set(yr, Math.max(prev, val));
  };

  for (const m of metrics) {
    if (isBAD(m.value) || isBAD(m.year)) continue;
    const val = toNum(m.value);
    if (val === null || val < 0) continue;
    const yr = baseYear(m.year);
    if (!yr) continue;
    const ml = m.year.toLowerCase();
    const met = m.metric.toLowerCase();

    if (ml.includes("graduation")) {
      if (met.includes("students placed")) addVal(K_PLACED, yr, val);
      else if (
        met.includes("higher stud") ||
        met.includes("selected for higher")
      )
        addVal(K_HIGHER, yr, val);
      else if (met.includes("graduating in minimum")) addVal(K_GRAD, yr, val);
      else if (met.includes("salary") || met.includes("median"))
        addVal(K_SALARY, yr, +(val / 100_000).toFixed(2));
    } else if (ml.includes("intake year")) {
      if (
        met.includes("intake in the year") ||
        met.includes("sanctioned intake")
      )
        addVal(K_INTAKE, yr, val);
      else if (met.includes("admitted in the year"))
        addVal(K_ADMITTED, yr, val);
    } else if (ml.includes("lateral entry")) {
      if (
        met.includes("lateral entry") ||
        met.includes("admitted through lateral")
      )
        addVal(K_LATERAL, yr, val);
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [group, setGroup] = useState("All");

  const years = sortYrs(Array.from(yearSet));
  if (years.length < 2)
    return (
      <ChartCard title="Placement Trend">
        <ProgramSelector
          programs={programs}
          selected={validProg}
          onChange={setSelectedProg}
        />
        <p
          style={{
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: INK300,
            padding: "16px 0",
          }}
        >
          Not enough data across years for the selected program.
        </p>
      </ChartCard>
    );

  const gradKeys = [K_PLACED, K_GRAD, K_HIGHER].filter((k) => mmap.has(k));
  const intakeKeys = [K_INTAKE, K_ADMITTED, K_LATERAL].filter((k) =>
    mmap.has(k),
  );
  const hasSalary = mmap.has(K_SALARY);

  const GROUPS: string[] = [];
  if (gradKeys.length) GROUPS.push("Graduation");
  if (intakeKeys.length) GROUPS.push("Intake");
  if (GROUPS.length > 1) GROUPS.unshift("All");

  const activeGroup = GROUPS.includes(group) ? group : (GROUPS[0] ?? "All");

  const visibleCountKeys = (() => {
    if (activeGroup === "Graduation") return gradKeys;
    if (activeGroup === "Intake") return intakeKeys;
    return [...gradKeys, ...intakeKeys];
  })().filter((k) => {
    const pts = years.map((yr) => mmap.get(k)?.get(yr) ?? null);
    return pts.filter((v) => v != null).length >= 2;
  });

  const showSalary =
    hasSalary &&
    (activeGroup === "All" || activeGroup === "Graduation") &&
    years.filter((yr) => mmap.get(K_SALARY)?.get(yr) != null).length >= 2;

  if (!visibleCountKeys.length && !showSalary) return null;

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    for (const k of visibleCountKeys) {
      const v = mmap.get(k)?.get(yr);
      if (v != null) pt[k] = v;
    }
    if (showSalary) {
      const v = mmap.get(K_SALARY)?.get(yr);
      if (v != null) pt[K_SALARY] = v;
    }
    return pt;
  });

  const KC: Record<string, string> = {
    [K_PLACED]: PALETTE[0],
    [K_GRAD]: PALETTE[2],
    [K_HIGHER]: PALETTE[1],
    [K_SALARY]: PALETTE[3],
    [K_INTAKE]: PALETTE[4],
    [K_ADMITTED]: PALETTE[5],
    [K_LATERAL]: PALETTE[6],
  };

  const fmtTip = (v: number, name: string) =>
    name === K_SALARY ? `₹${v}L` : v?.toLocaleString("en-IN");

  return (
    <ChartCard title="Placement Trend">
      {/* Row 1 — Program selector */}
      <ProgramSelector
        programs={programs}
        selected={validProg}
        onChange={setSelectedProg}
      />

      {/* Row 2 — View selector (Graduation / Intake) */}
      {GROUPS.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
            paddingBottom: 12,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              alignSelf: "center",
              marginRight: 4,
            }}
          >
            View
          </span>
          {GROUPS.map((g) => {
            const active = g === activeGroup;
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.65rem",
                  padding: "3px 10px",
                  border: `1px solid ${active ? CRIMSON : BORDER}`,
                  background: active ? CRIMSON : "var(--white)",
                  color: active ? "#fff" : INK300,
                  cursor: "pointer",
                  borderRadius: 2,
                  transition: "all 0.12s",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 4, right: showSalary ? 56 : 16, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis yAxisId="left" {...AX} />
          {showSalary && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `₹${v}L`}
              axisLine={false}
              tickLine={false}
              tick={{ fontFamily: MONO, fontSize: 10, fill: KC[K_SALARY] }}
            />
          )}
          <Tooltip content={<Tip fmt={fmtTip} />} />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {visibleCountKeys.map((k) => (
            <Line
              key={k}
              yAxisId="left"
              type="monotone"
              dataKey={k}
              stroke={KC[k]}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: KC[k] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
          {showSalary && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={K_SALARY}
              stroke={KC[K_SALARY]}
              strokeWidth={1.8}
              strokeDasharray="5 3"
              dot={{ r: 3, strokeWidth: 0, fill: KC[K_SALARY] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FINANCIAL — one line per line item over academic years (₹ Cr)
// ─────────────────────────────────────────────────────────────────────────────
export function FinancialTrendChart({
  metrics,
  title,
}: {
  metrics: RawMetric[];
  title: string;
}) {
  const valid = metrics.filter(
    (m) =>
      !isBAD(m.value) &&
      !m.metric.toLowerCase().includes("in words") &&
      !isBAD(m.program) &&
      isRealYear(m.year),
  );
  if (!valid.length) return null;

  const yearSet = new Set<string>();
  const lineMap = new Map<string, Map<string, number>>();

  for (const m of valid) {
    const yr = baseYear(m.year);
    const prog = m.program.trim();
    const val = toNum(m.value);
    if (!val || val <= 0) continue;
    yearSet.add(yr);
    if (!lineMap.has(prog)) lineMap.set(prog, new Map());
    const prev = lineMap.get(prog)!.get(yr) ?? 0;
    lineMap.get(prog)!.set(yr, Math.max(prev, +(val / 1e7).toFixed(2)));
  }

  const years = sortYrs(Array.from(yearSet));
  const lines = Array.from(lineMap.keys()).sort();
  if (years.length < 2 || !lines.length) return null;

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    for (const l of lines) {
      const v = lineMap.get(l)!.get(yr);
      if (v != null) pt[shorten(l, 22)] = v;
    }
    return pt;
  });

  const active = lines.filter(
    (l) => data.filter((d) => d[shorten(l, 22)] != null).length >= 2,
  );
  if (!active.length) return null;

  return (
    <ChartCard title={`${title} — Trend by Year (₹ Crore)`}>
      <ResponsiveContainer
        width="100%"
        height={Math.min(280, 140 + active.length * 20)}
      >
        <LineChart
          data={data}
          margin={{ top: 4, right: 16, bottom: 0, left: -4 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis tickFormatter={(v) => `₹${v}Cr`} {...AX} />
          <Tooltip content={<Tip fmt={(v: number) => `₹${v} Cr`} />} />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {active.map((l, i) => (
            <Line
              key={l}
              type="monotone"
              dataKey={shorten(l, 22)}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: PALETTE[i % PALETTE.length] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RESEARCH — projects / agencies / amount over academic years
//    Amount on right axis (₹ Cr), counts on left
// ─────────────────────────────────────────────────────────────────────────────
export function ResearchTrendChart({
  metrics,
  title,
}: {
  metrics: RawMetric[];
  title: string;
}) {
  const valid = metrics.filter(
    (m) =>
      !isBAD(m.value) &&
      !m.metric.toLowerCase().includes("in words") &&
      isRealYear(m.year),
  );
  if (!valid.length) return null;

  const K_PROJ = "Projects / Programs";
  const K_AGENCY = "Funding Agencies";
  const K_AMT = "Amount (Cr)";
  const K_PART = "Participants";

  const yearSet = new Set<string>();
  const mmap = new Map<string, Map<string, number>>();

  for (const m of valid) {
    const yr = baseYear(m.year);
    const val = toNum(m.value);
    if (val === null || val < 0) continue;
    yearSet.add(yr);
    const ml = m.metric.toLowerCase();
    let key: string | null = null;
    if (
      ml.includes("no. of") &&
      (ml.includes("project") || ml.includes("program"))
    )
      key = K_PROJ;
    else if (ml.includes("total no.") && ml.includes("project")) key = K_PROJ;
    else if (
      ml.includes("number of projects") ||
      ml.includes("number of programs")
    )
      key = K_PROJ;
    else if (ml.includes("funding agenc") || ml.includes("no. of agenc"))
      key = K_AGENCY;
    else if (ml.includes("participants")) key = K_PART;
    else if (ml.includes("amount") && !ml.includes("words")) key = K_AMT;
    if (!key) continue;
    const mapped = key === K_AMT ? +(val / 1e7).toFixed(2) : val;
    if (!mmap.has(key)) mmap.set(key, new Map());
    mmap.get(key)!.set(yr, (mmap.get(key)!.get(yr) ?? 0) + mapped);
  }

  const years = sortYrs(Array.from(yearSet));
  if (years.length < 2 || !mmap.size) return null;

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    for (const [k, ym] of mmap) {
      const v = ym.get(yr);
      if (v != null) pt[k] = v;
    }
    return pt;
  });

  const countKeys = [K_PROJ, K_AGENCY, K_PART].filter(
    (k) => mmap.has(k) && data.filter((d) => d[k] != null).length >= 2,
  );
  const hasAmt =
    mmap.has(K_AMT) && data.filter((d) => d[K_AMT] != null).length >= 2;
  if (!countKeys.length && !hasAmt) return null;

  const KC: Record<string, string> = {
    [K_PROJ]: PALETTE[0],
    [K_AGENCY]: PALETTE[1],
    [K_PART]: PALETTE[2],
    [K_AMT]: PALETTE[3],
  };

  return (
    <ChartCard title={`${title} — Trend by Year`}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: hasAmt ? 56 : 16, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis yAxisId="left" {...AX} />
          {hasAmt && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `₹${v}Cr`}
              axisLine={false}
              tickLine={false}
              tick={{ fontFamily: MONO, fontSize: 10, fill: KC[K_AMT] }}
            />
          )}
          <Tooltip
            content={
              <Tip
                fmt={(v: number, name: string) =>
                  name === K_AMT ? `₹${v} Cr` : v?.toLocaleString("en-IN")
                }
              />
            }
          />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {countKeys.map((k) => (
            <Line
              key={k}
              yAxisId="left"
              type="monotone"
              dataKey={k}
              stroke={KC[k]}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: KC[k] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
          {hasAmt && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={K_AMT}
              stroke={KC[K_AMT]}
              strokeWidth={1.8}
              strokeDasharray="5 3"
              dot={{ r: 3, strokeWidth: 0, fill: KC[K_AMT] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PhD — graduated (Full Time + Part Time) over academic years
//    Pulls from all ranking year submissions combined so the full
//    2019-20 → 2023-24 run is visible in one chart.
//
//    Data shape:
//      program = "No. of Ph.D students graduated..."
//      year    = "2021-22", "2022-23", ...
//      metric  = "Full Time Graduated" | "Part Time Graduated"
// ─────────────────────────────────────────────────────────────────────────────
export function PhdTrendChart({ metrics }: { metrics: RawMetric[] }) {
  const K_FT = "Full Time Graduated";
  const K_PT = "Part Time Graduated";

  const yearSet = new Set<string>();
  // key → year → value  (keep max across duplicate ranking-year submissions)
  const mmap = new Map<string, Map<string, number>>();

  const set = (key: string, yr: string, val: number) => {
    yearSet.add(yr);
    if (!mmap.has(key)) mmap.set(key, new Map());
    const prev = mmap.get(key)!.get(yr) ?? 0;
    mmap.get(key)!.set(yr, Math.max(prev, val));
  };

  for (const m of metrics) {
    if (isBAD(m.value) || !isRealYear(m.year)) continue;
    const val = toNum(m.value);
    if (val === null || val < 0) continue;
    const yr = baseYear(m.year);
    const met = m.metric.toLowerCase();
    if (met.includes("full time")) set(K_FT, yr, val);
    else if (met.includes("part time")) set(K_PT, yr, val);
  }

  const years = sortYrs(Array.from(yearSet));
  if (years.length < 2) return null;

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    for (const [k, ym] of mmap) {
      const v = ym.get(yr);
      if (v != null) pt[k] = v;
    }
    return pt;
  });

  const active = [K_FT, K_PT].filter(
    (k) => mmap.has(k) && data.filter((d) => d[k] != null).length >= 2,
  );
  if (!active.length) return null;

  const KC: Record<string, string> = {
    [K_FT]: PALETTE[2], // purple
    [K_PT]: PALETTE[1], // teal
  };

  return (
    <ChartCard title="PhD Graduated — Trend by Academic Year">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 16, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis {...AX} />
          <Tooltip content={<Tip />} />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {active.map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={KC[k]}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: KC[k] }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STUDENTS — all 12 metrics trend over ranking years
//
//    Students data has no academic year axis — snapshot per ranking year.
//    X-axis = ranking_year (2020 … 2025).
//    Values summed across all programs for institution-level totals.
//
//    Three charts:
//      A — Composition : Total Students, Male, Female
//      B — Diversity   : SC/ST/OBC, Within State, Outside State,
//                        Outside Country, Econ. Backward
//      C — Fee Status  : Reimbursed (Inst), Reimbursed (Govt),
//                        Reimbursed (Private), Not Receiving
// ─────────────────────────────────────────────────────────────────────────────

interface StudentRawMetric extends RawMetric {
  ranking_year: number;
}

type StudentChart = "composition" | "diversity" | "fee";

const STUDENT_SERIES: Array<{
  match: string[];
  label: string;
  chart: StudentChart;
}> = [
  // Composition — order: Female BEFORE Male to prevent "female students" matching "male students"
  { match: ["total students"], label: "Total Students", chart: "composition" },
  {
    match: ["no. of female", "of female students"],
    label: "Female",
    chart: "composition",
  },
  {
    match: ["no. of male", "of male students"],
    label: "Male",
    chart: "composition",
  },
  // Diversity
  {
    match: ["sc+st+obc", "socially challenged"],
    label: "SC/ST/OBC",
    chart: "diversity",
  },
  { match: ["within state"], label: "Within State", chart: "diversity" },
  { match: ["outside state"], label: "Outside State", chart: "diversity" },
  { match: ["outside country"], label: "Outside Country", chart: "diversity" },
  {
    match: ["economically backward"],
    label: "Econ. Backward",
    chart: "diversity",
  },
  // Fee reimbursement — most specific first
  {
    match: ["institution funds", "from institution"],
    label: "Reimb. (Institution)",
    chart: "fee",
  },
  {
    match: ["private bod", "from private"],
    label: "Reimb. (Private)",
    chart: "fee",
  },
  {
    match: ["state and central", "central government", "from the state"],
    label: "Reimb. (Govt)",
    chart: "fee",
  },
  {
    match: ["not receiving full tuition", "not receiving"],
    label: "Not Reimbursed",
    chart: "fee",
  },
];

function matchStudentSeries(
  metric: string,
): { label: string; chart: StudentChart } | null {
  const ml = metric.toLowerCase();
  for (const s of STUDENT_SERIES) {
    if (s.match.some((kw) => ml.includes(kw)))
      return { label: s.label, chart: s.chart };
  }
  return null;
}

const STUDENT_COLORS: Record<string, string> = {
  // Composition
  "Total Students": PALETTE[4], // blue
  Male: PALETTE[0], // crimson
  Female: PALETTE[1], // teal
  // Diversity
  "SC/ST/OBC": PALETTE[2], // purple
  "Within State": PALETTE[4], // blue
  "Outside State": PALETTE[3], // amber
  "Outside Country": PALETTE[5], // green
  "Econ. Backward": PALETTE[6], // orange
  // Fee
  "Reimb. (Institution)": PALETTE[1], // teal
  "Reimb. (Private)": PALETTE[5], // green
  "Reimb. (Govt)": PALETTE[2], // purple
  "Not Reimbursed": PALETTE[0], // crimson
};

export function StudentsTrendChart({
  metrics,
}: {
  metrics: StudentRawMetric[];
}) {
  // Collect all distinct programs
  const progSet = new Set<string>();
  for (const m of metrics) {
    if (!isBAD(m.program) && m.program.trim() !== "-")
      progSet.add(normalizeProg(m.program));
  }
  const progs = Array.from(progSet).sort();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedProg, setSelectedProg] = useState(ALL_PROG);
  const validProg = progs.includes(selectedProg) ? selectedProg : ALL_PROG;

  const filtered =
    validProg === ALL_PROG
      ? metrics
      : metrics.filter((m) => normalizeProg(m.program) === validProg);

  // ranking_year → label → summed value
  const yearMap = new Map<string, Map<string, number>>();
  for (const m of filtered) {
    if (isBAD(m.value)) continue;
    const val = toNum(m.value);
    if (val === null || val < 0) continue;
    const match = matchStudentSeries(m.metric);
    if (!match) continue;
    // Use academic year if available, else fall back to ranking_year
    const yr = isRealYear(m.year)
      ? baseYear(m.year)
      : m.ranking_year
        ? String(m.ranking_year)
        : null;
    if (!yr) continue;
    if (!yearMap.has(yr)) yearMap.set(yr, new Map());
    const ym = yearMap.get(yr)!;
    ym.set(match.label, Math.max(ym.get(match.label) ?? 0, val));
  }

  const years = sortYrs(Array.from(yearMap.keys()));
  if (years.length < 2)
    return (
      <>
        <ChartCard title="Student Composition — Trend by Ranking Year">
          <ProgramSelector
            programs={progs}
            selected={validProg}
            onChange={setSelectedProg}
          />
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              color: INK300,
              padding: "16px 0",
            }}
          >
            Not enough data across years for the selected program.
          </p>
        </ChartCard>
      </>
    );

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    const ym = yearMap.get(yr)!;
    for (const [label, val] of ym) pt[label] = val;
    return pt;
  });

  // Series with ≥2 data points (≥1 when a specific program is selected to avoid blank charts)
  const minPoints = validProg === ALL_PROG ? 2 : 1;
  const activeSeries = (chart: StudentChart) =>
    STUDENT_SERIES.filter((s) => s.chart === chart)
      .map((s) => s.label)
      .filter((l) => data.filter((d) => d[l] != null).length >= minPoints);

  const compSeries = activeSeries("composition");
  const divSeries = activeSeries("diversity");
  const feeSeries = activeSeries("fee");

  if (!compSeries.length && !divSeries.length && !feeSeries.length)
    return (
      <ChartCard title="Student Trends">
        <ProgramSelector
          programs={progs}
          selected={validProg}
          onChange={setSelectedProg}
        />
        <p
          style={{
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: INK300,
            padding: "16px 0",
          }}
        >
          Not enough data across years for the selected program.
        </p>
      </ChartCard>
    );

  // Inline chart renderer — takes series labels, renders a full chart card
  // selector is rendered fresh inside each card so React doesn't share instances
  const renderChart = (title: string, series: string[]) => {
    if (!series.length)
      return (
        <ChartCard title={title}>
          <ProgramSelector
            programs={progs}
            selected={validProg}
            onChange={setSelectedProg}
          />
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              color: INK300,
              padding: "16px 0",
            }}
          >
            Not enough data across years for the selected program.
          </p>
        </ChartCard>
      );
    return (
      <ChartCard title={title}>
        <ProgramSelector
          programs={progs}
          selected={validProg}
          onChange={setSelectedProg}
        />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 16, bottom: 0, left: -10 }}
          >
            <CartesianGrid
              strokeDasharray="2 4"
              stroke={BORDER}
              vertical={false}
            />
            <XAxis dataKey="year" {...AX} />
            <YAxis {...AX} />
            <Tooltip content={<Tip />} />
            <Legend
              wrapperStyle={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                paddingTop: 10,
              }}
            />
            {series.map((k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={STUDENT_COLORS[k] ?? PALETTE[0]}
                strokeWidth={1.8}
                dot={{
                  r: 3,
                  strokeWidth: 0,
                  fill: STUDENT_COLORS[k] ?? PALETTE[0],
                }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  };

  return (
    <>
      {renderChart("Student Composition — Trend by Ranking Year", compSeries)}
      {renderChart("Student Diversity — Trend by Ranking Year", divSeries)}
      {renderChart("Fee Reimbursement — Trend by Ranking Year", feeSeries)}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. UNIVERSITY EXAM DETAILS — admitted / lateral / graduating over ranking years
//
//    Data shape (2016-2018 sections):
//      ranking_year = 2016 | 2017 | 2018   ← x-axis
//      program      = "UG [4 Years]", "PG [2 Years]", …
//      metric       = "admitted in the first year" | "lateral entry" | "graduating..."
//      year         = "2016-17"  (academic year label — NOT used as x-axis)
//      value        = numeric count
//
//    One chart per section occurrence. Program selector pill filters lines.
//    Three lines: Admitted (first year), Lateral Entry, Graduating (min time)
// ─────────────────────────────────────────────────────────────────────────────

interface ExamRawMetric extends RawMetric {
  ranking_year: number;
}

const EXAM_SERIES = [
  {
    match: ["admitted in the first year", "admitted in first year"],
    label: "Admitted (1st Year)",
    color: PALETTE[0],
  },
  {
    match: ["lateral entry", "admitted through lateral"],
    label: "Lateral Entry",
    color: PALETTE[1],
  },
  {
    match: ["graduating in minimum", "graduating in min"],
    label: "Graduating (Min Time)",
    color: PALETTE[2],
  },
];

function matchExamSeries(metric: string): (typeof EXAM_SERIES)[number] | null {
  const ml = metric.toLowerCase();
  return EXAM_SERIES.find((s) => s.match.some((kw) => ml.includes(kw))) ?? null;
}

export function UniversityExamTrendChart({
  metrics,
}: {
  metrics: ExamRawMetric[];
}) {
  // Collect all distinct programs
  const progSet = new Set<string>();
  for (const m of metrics) {
    if (!isBAD(m.program) && m.program.trim() !== "-")
      progSet.add(normalizeProg(m.program));
  }
  const progs = Array.from(progSet).sort((a, b) => {
    const ag = a.toUpperCase().startsWith("UG") ? 0 : 1;
    const bg = b.toUpperCase().startsWith("UG") ? 0 : 1;
    return ag !== bg ? ag - bg : a.localeCompare(b);
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedProg, setSelectedProg] = useState(ALL_PROG);
  const validProg = progs.includes(selectedProg) ? selectedProg : ALL_PROG;

  const filtered =
    validProg === ALL_PROG
      ? metrics
      : metrics.filter((m) => normalizeProg(m.program) === validProg);

  // Use `year` field (e.g. "2016-17", "2017-18") as x-axis — always present in exam sections.
  // Fall back to ranking_year if year is not a real year string.
  // Deduplicate by keeping max value when the same academic year appears in multiple submissions.
  const yearMap = new Map<string, Map<string, number>>();

  for (const m of filtered) {
    if (isBAD(m.value)) continue;
    const val = toNum(m.value);
    if (val === null || val < 0) continue;
    const series = matchExamSeries(m.metric);
    if (!series) continue;

    // Prefer the academic year field; fall back to ranking_year as string
    const yr = isRealYear(m.year)
      ? baseYear(m.year)
      : m.ranking_year
        ? String(m.ranking_year)
        : null;
    if (!yr) continue;

    if (!yearMap.has(yr)) yearMap.set(yr, new Map());
    const ym = yearMap.get(yr)!;
    // Keep max across duplicate submissions for the same year
    const prev = ym.get(series.label) ?? 0;
    ym.set(series.label, Math.max(prev, val));
  }

  const years = sortYrs(Array.from(yearMap.keys()));
  if (years.length < 1) return null;

  const data = years.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    const ym = yearMap.get(yr)!;
    for (const [label, val] of ym) pt[label] = val;
    return pt;
  });

  // Need at least 1 series with at least 1 data point
  const minPoints = 1;
  const activeSeries = EXAM_SERIES.filter(
    (s) => data.filter((d) => d[s.label] != null).length >= minPoints,
  );

  if (!activeSeries.length) return null;

  return (
    <ChartCard title="University Exam Details — Trend by Academic Year">
      <ProgramSelector
        programs={progs}
        selected={validProg}
        onChange={setSelectedProg}
      />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 16, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis dataKey="year" {...AX} />
          <YAxis {...AX} />
          <Tooltip content={<Tip />} />
          <Legend
            wrapperStyle={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              paddingTop: 10,
            }}
          />
          {activeSeries.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={1.8}
              dot={{ r: 3, strokeWidth: 0, fill: s.color }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
