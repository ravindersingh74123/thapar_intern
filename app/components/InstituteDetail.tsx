"use client";
import React, { useEffect, useState } from "react";
import type { SearchHit } from "@/app/page";
import type { InstituteProfileResponse } from "@/types/nirf";
import { SCORE_LABELS } from "@/types/nirf";
import {
  ScoresTrendChart,
  IntakeTrendChart,
  PlacementTrendChart,
  FinancialTrendChart,
  ResearchTrendChart,
  PhdTrendChart,
  StudentsTrendChart,
  UniversityExamTrendChart,
} from "@/app/components/NIRFCharts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  hit: SearchHit;
  initialCategory?: string; // ← NEW: pre-select a category on open
}

interface RawMetric {
  metric: string;
  year: string;
  value: string;
  ranking_year: number;
  program: string;
  category?: string;
}

interface RawSection {
  section: string;
  metrics: RawMetric[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────

type TabId =
  | "scores"
  | "intake"
  | "placement"
  | "phd"
  | "students"
  | "research"
  | "innovation"
  | "financial"
  | "faculty"
  | "publications"
  | "facilities"
  | "accreditation"
  | "other";

const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "scores", label: "NIRF Scores", icon: "★" },
  { id: "intake", label: "Intake", icon: "⊕" },
  { id: "placement", label: "Placement", icon: "↗" },
  { id: "phd", label: "PhD", icon: "⚗" },
  { id: "students", label: "Students", icon: "◎" },
  { id: "research", label: "Research", icon: "◈" },
  { id: "innovation", label: "Innovation", icon: "⚡" },
  { id: "financial", label: "Financial", icon: "₹" },
  { id: "faculty", label: "Faculty", icon: "✦" },
  { id: "publications", label: "Publications", icon: "📄" },
  { id: "facilities", label: "Facilities", icon: "⌂" },
  { id: "accreditation", label: "Accreditation", icon: "✓" },
  { id: "other", label: "Other", icon: "+" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section → Tab mapping (covers all years 2016–2025)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TAB: Record<string, TabId> = {
  "Sanctioned (Approved) Intake": "intake",
  "University Exam Details": "intake",
  "Student Exam Details": "intake",
  "Exam Details": "intake",
  Scholarships: "students",
  "Scholarship Details": "students",
  "Placement & Higher Studies": "placement",
  "Placement and Higher Studies": "placement",
  "Graduation Outcome": "placement",
  "Ph.D Student Details": "phd",
  "Total Actual Student Strength (Program(s) Offered by your Institution)":
    "students",
  "Student Details": "students",
  "Sponsored Research Details": "research",
  "Consultancy Project Details": "research",
  "Executive Development Programs": "research",
  "Executive Development Program/Management Development Programs": "research",
  "Education Program Details": "research",
  "Revenue from Executive Education": "research",
  FDP: "research",
  "Innovations at various stages of Technology Readiness Level": "innovation",
  "Start up recognized by DPIIT/startup India": "innovation",
  "Ventures/startups grown to turnover of 50 lacs": "innovation",
  "Startups which have got VC investment in previous 3 years": "innovation",
  "Innovation grant received from govt. organization in previous 3 years":
    "innovation",
  "Academic Courses in Innovation, Entrepreneurship and IPR": "innovation",
  "Pre-incubation:expenditure/income": "innovation",
  "Incubation:expenditure/income": "innovation",
  "Alumni that are Founders of Forbes/Fortune 500 companies": "innovation",
  "FDI investment in previous 3 years": "innovation",
  Patents: "innovation",
  "Patents Commercialized & Technology Transferred": "innovation",
  "Patent Details": "innovation",
  "IPR Summary": "innovation",
  "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":
    "financial",
  "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years":
    "financial",
  "Financial Resources and its Utilization": "financial",
  "Facilities Summaries": "financial",
  "Faculty Details": "faculty",
  "Publication Details": "publications",
  "PCS Facilities: Facilities of Physically Challenged Students": "facilities",
  "Facilities for Physically Challenged": "facilities",
  "Physical Facilties": "facilities",
  "Physical Facilities": "facilities",
  "Sustainability Details": "facilities",
  "Sustainable Living Practices": "facilities",
  Accreditation: "accreditation",
  "OPD Attendance & Bed Occupancy": "accreditation",
  "Perception Details": "other",
  "Student Events": "other",
  "Student Entrepreneurship": "other",
  "New Programs Developed": "other",
  "Programs Revised": "other",
  "Vocational Certificate Courses": "other",
  "Multiple Entry/Exit and Indian Knowledge System": "other",
  "Prior Learning at Different Levels": "other",
  "Curriculum Design": "other",
};

// ─────────────────────────────────────────────────────────────────────────────
// Category colours
// ─────────────────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Overall: "#c0392b",
  University: "#1a7a6e",
  Engineering: "#1d6fa8",
  Management: "#7d4fa8",
  Medical: "#b55a1a",
  College: "#2e7d52",
  Pharmacy: "#6b5a1a",
  Law: "#4a5568",
  Architecture: "#8b4513",
  Research: "#1a5a7a",
  "State Public University": "#c0392b",
};
const catColor = (cat: string) => CAT_COLORS[cat] ?? "#6b6860";

// ─────────────────────────────────────────────────────────────────────────────
// Value helpers
// ─────────────────────────────────────────────────────────────────────────────

const BAD = new Set([
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

const isBAD = (v: string | null | undefined) =>
  BAD.has((v ?? "").trim().toLowerCase());

const cl = (v: string | null | undefined): string =>
  isBAD(v) ? "" : (v ?? "").trim();

function isRealYear(y: string | null | undefined): boolean {
  const v = (y ?? "").trim();
  return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
}

function baseYear(y: string): string {
  return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
}

function normalizeProg(p: string): string {
  if (!p) return p;
  const s = p.trim();
  return s
    .replace(/\[(\d+)\s+Year\s+Program\(?s?\)?\]/i, (_, n) => `[${n} Years]`)
    .replace(/\[(\d+)\s+Years?\s+Program\(?s?\)?\]/i, (_, n) => `[${n} Years]`)
    .replace(/\bProgram\(s\)/gi, "")
    .replace(/\bPrograms\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtN(v: string): string {
  const s = cl(v);
  if (!s) return "—";
  const n = Number(s.replace(/,/g, ""));
  if (isNaN(n)) return s;
  return n.toLocaleString("en-IN");
}

function fmtAmt(v: string): string {
  const s = cl(v);
  if (!s) return "—";
  const n = Number(s.replace(/,/g, ""));
  if (isNaN(n)) return s;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtSal(v: string): string {
  const s = cl(v);
  if (!s) return "—";
  const n = Number(s.replace(/,/g, ""));
  if (isNaN(n)) return s;
  return `₹${(n / 100_000).toFixed(1)}L`;
}

function fmtV(v: string, metric: string): string {
  if (isBAD(v)) return "—";
  const m = metric.toLowerCase();
  if (m.includes("salary") || m.includes("median")) return fmtSal(v);
  if (
    (m.includes("amount") || m.includes("expenditure")) &&
    !m.includes("words")
  )
    return fmtAmt(v);
  return fmtN(v);
}

const isWords = (m: string) => m.toLowerCase().includes("in words");

function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of arr) {
    const k = fn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(x);
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.6rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--ink-400)",
  padding: "8px 14px",
  textAlign: "left",
  borderBottom: "2px solid var(--border)",
  background: "var(--off-white)",
  whiteSpace: "nowrap",
};
const THR: React.CSSProperties = { ...TH, textAlign: "right" };
const TD: React.CSSProperties = {
  padding: "8px 14px",
  color: "var(--ink-700)",
  verticalAlign: "middle",
  fontSize: "0.78rem",
};
const TDM: React.CSSProperties = {
  ...TD,
  color: "var(--ink-400)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.68rem",
};
const TDR: React.CSSProperties = {
  ...TD,
  textAlign: "right",
  fontFamily: "var(--font-mono)",
};

function rh(i: number) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.currentTarget.style.background = "var(--crimson-pale)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.currentTarget.style.background =
        i % 2 ? "var(--off-white)" : "transparent";
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

function KV({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value?: string | null;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "var(--crimson-pale)" : "var(--off-white)",
        border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: accent ? "var(--crimson)" : "var(--ink-500)",
          marginBottom: 5,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: big ? "1.9rem" : "1.35rem",
          color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
          lineHeight: 1,
        }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function Card({
  title,
  children,
  noPad,
  style: extraStyle,
}: {
  title?: string;
  children: React.ReactNode;
  noPad?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 14,
        overflow: "hidden",
        padding: noPad ? 0 : "20px 24px",
        ...extraStyle,
      }}
    >
      {title && (
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "var(--ink-900)",
            margin: 0,
            padding: noPad ? "16px 24px 14px" : "0 0 8px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 14,
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.62rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--crimson)",
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </p>
  );
}

function Empty({ msg = "No data available." }: { msg?: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        color: "var(--ink-300)",
        padding: "20px 0",
      }}
    >
      {msg}
    </p>
  );
}

function ScoreBar({
  label,
  score,
  total,
}: {
  label: string;
  score: number | null;
  total: number | null;
}) {
  const pct =
    score != null && (total ?? 100) > 0
      ? Math.min((score / (total ?? 100)) * 100, 100)
      : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--ink-700)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--ink-400)",
          }}
        >
          {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
        </span>
      </div>
      <div style={{ height: 5, background: "var(--border)" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--crimson)",
            transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Year Pivot Table
// ─────────────────────────────────────────────────────────────────────────────

interface PivotRow {
  label: string;
  subLabel?: string;
  yearVals: Record<string, string>;
  isSal?: boolean;
  isAmt?: boolean;
  isBold?: boolean;
}

function YearPivotTable({
  rows,
  years,
  col1 = "Metric",
}: {
  rows: PivotRow[];
  years: string[];
  col1?: string;
}) {
  if (!rows.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
            {years.map((yr) => (
              <th key={yr} style={THR}>
                {yr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: "1px solid var(--border)",
                background: i % 2 ? "var(--off-white)" : "transparent",
                transition: "background 0.1s",
              }}
              {...rh(i)}
            >
              <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
                {row.label}
                {row.subLabel && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--ink-300)",
                      marginLeft: 6,
                    }}
                  >
                    {row.subLabel}
                  </span>
                )}
              </td>
              {years.map((yr) => {
                const val = row.yearVals[yr];
                const hasVal = val && val !== "";
                let d = "—";
                if (hasVal) {
                  if (row.isSal) d = fmtSal(val);
                  else if (row.isAmt) d = fmtAmt(val);
                  else d = fmtN(val);
                }
                return (
                  <td
                    key={yr}
                    style={{
                      ...TDR,
                      color: hasVal
                        ? row.isBold
                          ? "var(--crimson-dark)"
                          : "var(--ink-700)"
                        : "var(--ink-100)",
                      fontWeight: row.isBold && hasVal ? 700 : 400,
                      background:
                        row.isBold && hasVal
                          ? "var(--crimson-pale)"
                          : undefined,
                    }}
                  >
                    {d}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildPivotRows(
  metrics: RawMetric[],
  opts?: { isSal?: boolean; isAmt?: boolean },
): { rows: PivotRow[]; years: string[] } {
  const yearSet = new Set<string>();
  const metricMap = new Map<string, Record<string, string>>();
  for (const m of metrics) {
    if (isBAD(m.value) || isWords(m.metric) || !isRealYear(m.year)) continue;
    const yr = m.year.trim();
    const key = cl(m.metric) || m.metric;
    if (!metricMap.has(key)) metricMap.set(key, {});
    yearSet.add(yr);
    metricMap.get(key)![yr] = cl(m.value);
  }
  const years = Array.from(yearSet).sort((a, b) =>
    baseYear(a).localeCompare(baseYear(b)),
  );
  const rows: PivotRow[] = Array.from(metricMap.entries())
    .filter(([, yv]) => Object.keys(yv).length > 0)
    .map(([metric, yearVals]) => ({
      label: metric,
      yearVals,
      isSal:
        opts?.isSal ??
        (metric.toLowerCase().includes("salary") ||
          metric.toLowerCase().includes("median")),
      isAmt:
        opts?.isAmt ??
        ((metric.toLowerCase().includes("amount") ||
          metric.toLowerCase().includes("expenditure")) &&
          !metric.toLowerCase().includes("words")),
    }));
  return { rows, years };
}

function FlatTable({
  metrics,
  col1 = "Metric",
  col2 = "Value",
}: {
  metrics: RawMetric[];
  col1?: string;
  col2?: string;
}) {
  const valid = metrics.filter(
    (m) => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric),
  );
  if (!valid.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={TH}>{col1}</th>
            <th style={THR}>{col2}</th>
          </tr>
        </thead>
        <tbody>
          {valid.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom: "1px solid var(--border)",
                background: i % 2 ? "var(--off-white)" : "transparent",
              }}
              {...rh(i)}
            >
              <td style={TD}>{r.metric}</td>
              <td style={TDR}>{fmtV(r.value, r.metric)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordTable({
  metrics,
  nameCol = "Name",
}: {
  metrics: RawMetric[];
  nameCol?: string;
}) {
  const valid = metrics.filter((m) => !isBAD(m.value) && !isBAD(m.metric));
  if (!valid.length) return <Empty />;
  const pm = groupBy(valid, (r) => cl(r.program) || "—");
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH, minWidth: 180 }}>{nameCol}</th>
            <th style={TH}>Field</th>
            <th style={THR}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
            rows.map((r, i) => (
              <tr
                key={`${gi}-${i}`}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
                }}
                {...rh(gi + i)}
              >
                {i === 0 ? (
                  <td
                    style={{ ...TDM, verticalAlign: "top" }}
                    rowSpan={rows.length}
                  >
                    {prog}
                  </td>
                ) : null}
                <td style={TD}>{r.metric}</td>
                <td style={TDR}>{r.value}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

function PGroup({
  label,
  children,
  open: init = true,
}: {
  label: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  const [o, setO] = useState(init);
  return (
    <div
      style={{
        marginBottom: 14,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setO((x) => !x)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "var(--off-white)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: "0.82rem",
          color: "var(--crimson-dark)",
          textAlign: "left",
          borderBottom: o ? "1px solid var(--border)" : "none",
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontSize: "0.65rem",
            color: "var(--ink-400)",
            transform: o ? "rotate(90deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▶
        </span>
      </button>
      {o && (
        <div style={{ padding: "16px 20px", background: "var(--white)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
  const words = metrics.filter((m) => isWords(m.metric) && !isBAD(m.value));
  if (!words.length) return null;
  return (
    <details style={{ marginTop: 10, padding: "0 0 8px" }}>
      <summary
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.63rem",
          color: "var(--ink-300)",
          cursor: "pointer",
          padding: "4px 0",
        }}
      >
        Show amounts in words ({words.length})
      </summary>
      <div style={{ marginTop: 6 }}>
        {words.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "4px 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.73rem",
              color: "var(--ink-500)",
              display: "flex",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.63rem",
                color: "var(--ink-300)",
                minWidth: 70,
                flexShrink: 0,
              }}
            >
              {m.year}
            </span>
            <span>{m.value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Scores
// ─────────────────────────────────────────────────────────────────────────────

function TabScores({
  row,
  imgCols,
  scoresByYear,
  activeYear,
}: {
  row: Record<string, unknown>;
  imgCols: string[];
  scoresByYear: Record<number, Record<string, unknown>>;
  activeYear: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
          gap: 10,
        }}
      >
        <KV
          label="NIRF Total"
          value={
            row.img_total != null ? (row.img_total as number).toFixed(2) : null
          }
          accent
          big
        />
        <KV
          label="Student Strength"
          value={
            row.img_ss_score != null
              ? (row.img_ss_score as number).toFixed(2)
              : null
          }
        />
        <KV
          label="Faculty Ratio"
          value={
            row.img_fsr_score != null
              ? (row.img_fsr_score as number).toFixed(2)
              : null
          }
        />
        <KV
          label="Perception"
          value={
            row.img_pr_score != null
              ? (row.img_pr_score as number).toFixed(2)
              : null
          }
        />
      </div>
      <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />
      <Card title="Parameter Breakdown">
        {imgCols.map((k) => (
          <ScoreBar
            key={k}
            label={
              SCORE_LABELS[k] ??
              k
                .replace("img_", "")
                .replace("_score", "")
                .replace(/_/g, " ")
                .toUpperCase()
            }
            score={row[k] as number | null}
            total={row[k.replace("_score", "_total")] as number | null}
          />
        ))}
      </Card>
      <Card title="Score Details" noPad>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Parameter</th>
                <th style={THR}>Score</th>
                <th style={THR}>Max</th>
                <th style={THR}>%</th>
              </tr>
            </thead>
            <tbody>
              {imgCols.map((k, i) => {
                const s = row[k] as number | null;
                const t = row[k.replace("_score", "_total")] as number | null;
                const p =
                  s != null && (t ?? 100) > 0
                    ? ((s / (t ?? 100)) * 100).toFixed(1) + "%"
                    : "—";
                return (
                  <tr
                    key={k}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: i % 2 ? "var(--off-white)" : "transparent",
                    }}
                    {...rh(i)}
                  >
                    <td style={TD}>
                      {SCORE_LABELS[k] ??
                        k
                          .replace("img_", "")
                          .replace("_score", "")
                          .replace(/_/g, " ")
                          .toUpperCase()}
                    </td>
                    <td
                      style={{
                        ...TDR,
                        color: "var(--crimson)",
                        fontWeight: 600,
                      }}
                    >
                      {s?.toFixed(2) ?? "—"}
                    </td>
                    <td style={{ ...TDR, color: "var(--ink-400)" }}>
                      {t?.toFixed(0) ?? "—"}
                    </td>
                    <td style={TDR}>{p}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Intake
// ─────────────────────────────────────────────────────────────────────────────

function TabIntake({
  sections,
  allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length) return <Empty />;

  const allMetrics = allSections
    .flatMap((s) => s.metrics)
    .filter((m) => isRealYear(m.year));

  const intakeSecs = sections.filter(
    (s) =>
      s.section.toLowerCase().includes("sanctioned") ||
      s.section.toLowerCase().includes("approved intake"),
  );
  const otherSecs = sections.filter((s) => !intakeSecs.includes(s));

  const all = intakeSecs
    .flatMap((s) => s.metrics)
    .filter((m) => isRealYear(m.year));
  const hasIntake = all.length > 0;
  const hasPrograms = all.some(
    (m) => !isBAD(m.program) && cl(m.program) !== "-",
  );

  if (!hasIntake && !otherSecs.length) return <Empty />;

  const pm = groupBy(
    all.filter((m) => !isBAD(m.program)),
    (r) => cl(r.program),
  );
  const allP = Array.from(pm.keys());
  const ugP = allP.filter((p) => p.toUpperCase().startsWith("UG"));
  const pgIP = allP.filter(
    (p) =>
      p.toUpperCase().startsWith("PG-INT") ||
      p.toLowerCase().includes("integrated"),
  );
  const pgP = allP.filter(
    (p) =>
      p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
  );
  const otP = allP.filter(
    (p) => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p),
  );

  const yearSet = new Set<string>();
  for (const rows of pm.values())
    for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
  const years = Array.from(yearSet).sort();

  function mkRows(progs: string[]): PivotRow[] {
    return progs.map((p) => {
      const yearVals: Record<string, string> = {};
      for (const r of pm.get(p)!) {
        if (!isRealYear(r.year)) continue;
        yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
      }
      return { label: p, yearVals };
    });
  }

  const totalYV: Record<string, string> = {};
  for (const yr of years) {
    let sum = 0,
      any = false;
    for (const rows of pm.values()) {
      const r = rows.find((x) => isRealYear(x.year) && baseYear(x.year) === yr);
      if (!r) continue;
      const n = Number((cl(r.value) || "").replace(/,/g, ""));
      if (!isNaN(n) && n > 0) {
        sum += n;
        any = true;
      }
    }
    totalYV[yr] = any ? String(sum) : "";
  }
  const latestYr = years.at(-1);
  const grandTotal =
    latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

  return (
    <div>
      <IntakeTrendChart metrics={allMetrics} />

      {hasIntake && (
        <>
          {grandTotal > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <KV
                label={`Total Intake (${latestYr})`}
                value={fmtN(String(grandTotal))}
                accent
              />
              {ugP.length > 0 && (
                <KV label="UG Programs" value={String(ugP.length)} />
              )}
              {pgP.length > 0 && (
                <KV label="PG Programs" value={String(pgP.length)} />
              )}
            </div>
          )}

          {hasPrograms ? (
            <>
              {ugP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Undergraduate Programs</SH>
                  <YearPivotTable
                    rows={mkRows(ugP)}
                    years={years}
                    col1="Program"
                  />
                </div>
              )}
              {pgP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Postgraduate Programs</SH>
                  <YearPivotTable
                    rows={mkRows(pgP)}
                    years={years}
                    col1="Program"
                  />
                </div>
              )}
              {pgIP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>PG-Integrated Programs</SH>
                  <YearPivotTable
                    rows={mkRows(pgIP)}
                    years={years}
                    col1="Program"
                  />
                </div>
              )}
              {otP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Other Programs</SH>
                  <YearPivotTable
                    rows={mkRows(otP)}
                    years={years}
                    col1="Program"
                  />
                </div>
              )}
              {years.length > 0 && allP.length > 1 && (
                <div style={{ borderTop: "2px solid var(--border)" }}>
                  <YearPivotTable
                    rows={[
                      { label: "Grand Total", yearVals: totalYV, isBold: true },
                    ]}
                    years={years}
                    col1=""
                  />
                </div>
              )}
            </>
          ) : (
            (() => {
              const { rows: flatRows, years: flatYears } = buildPivotRows(all);
              return <YearPivotTable rows={flatRows} years={flatYears} />;
            })()
          )}
        </>
      )}

      {allSections.length > 0 && (
        <UniversityExamTrendChart
          metrics={
            allSections
              .filter(
                (s) =>
                  s.section.toLowerCase().includes("exam") ||
                  s.section.toLowerCase().includes("university exam"),
              )
              .flatMap((s) => s.metrics) as any
          }
        />
      )}

      {otherSecs.map((sec) => {
        const metrics = sec.metrics.filter(
          (m) => !isBAD(m.value) && !isBAD(m.metric),
        );
        if (!metrics.length) return null;

        const secHasYears = metrics.some((m) => isRealYear(m.year));
        const secHasPrograms = metrics.some(
          (m) => !isBAD(m.program) && cl(m.program) !== "-",
        );

        if (secHasPrograms) {
          const secPm = groupBy(
            metrics.filter((m) => !isBAD(m.program)),
            (r) => cl(r.program),
          );
          const secYearSet = new Set<string>();
          for (const rows of secPm.values())
            for (const r of rows)
              if (isRealYear(r.year)) secYearSet.add(baseYear(r.year));
          const secYears = Array.from(secYearSet).sort();

          return (
            <Card
              key={sec.section}
              title={sec.section}
              noPad
              style={{ marginTop: 20 }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, minWidth: 180 }}>Program</th>
                      <th style={TH}>Metric</th>
                      {secYears.map((yr) => (
                        <th key={yr} style={THR}>
                          {yr}
                        </th>
                      ))}
                      {!secHasYears && <th style={THR}>Value</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(secPm.entries()).flatMap(([prog, rows], gi) => {
                      const mm = groupBy(rows, (r) => cl(r.metric));
                      return Array.from(mm.entries()).map(
                        ([metric, mrows], mi) => {
                          const yearVals: Record<string, string> = {};
                          for (const r of mrows)
                            if (isRealYear(r.year))
                              yearVals[baseYear(r.year)] = isBAD(r.value)
                                ? ""
                                : cl(r.value);
                          const flatVal = mrows[0]?.value ?? "";
                          return (
                            <tr
                              key={`${gi}-${mi}`}
                              style={{
                                borderBottom: "1px solid var(--border)",
                                background:
                                  (gi + mi) % 2
                                    ? "var(--off-white)"
                                    : "transparent",
                              }}
                              {...rh(gi + mi)}
                            >
                              {mi === 0 ? (
                                <td
                                  style={{ ...TDM, verticalAlign: "top" }}
                                  rowSpan={mm.size}
                                >
                                  {prog}
                                </td>
                              ) : null}
                              <td style={TD}>{metric}</td>
                              {secHasYears ? (
                                secYears.map((yr) => (
                                  <td key={yr} style={TDR}>
                                    {yearVals[yr] ? (
                                      fmtV(yearVals[yr], metric)
                                    ) : (
                                      <span style={{ color: "var(--ink-100)" }}>
                                        —
                                      </span>
                                    )}
                                  </td>
                                ))
                              ) : (
                                <td style={TDR}>
                                  {isBAD(flatVal) ? "—" : fmtV(flatVal, metric)}
                                </td>
                              )}
                            </tr>
                          );
                        },
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        const { rows: secRows, years: secYears } = buildPivotRows(metrics);
        if (secRows.length && secYears.length) {
          return (
            <Card
              key={sec.section}
              title={sec.section}
              noPad
              style={{ marginTop: 20 }}
            >
              <YearPivotTable rows={secRows} years={secYears} />
            </Card>
          );
        }

        return (
          <Card
            key={sec.section}
            title={sec.section}
            noPad
            style={{ marginTop: 20 }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>Metric</th>
                    <th style={THR}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: i % 2 ? "var(--off-white)" : "transparent",
                      }}
                      {...rh(i)}
                    >
                      <td style={TD}>{m.metric}</td>
                      <td style={TDR}>{fmtV(m.value, m.metric)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Placement
// ─────────────────────────────────────────────────────────────────────────────

function TabPlacement({
  sections,
  allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length) return <Empty />;

  const all = sections
    .flatMap((s) => s.metrics)
    .filter((m) => !isBAD(m.metric) && !isWords(m.metric));
  if (!all.length) return <Empty />;

  const allValid = allSections
    .flatMap((s) => s.metrics)
    .filter(
      (m) =>
        !isBAD(m.metric) &&
        !isWords(m.metric) &&
        isRealYear(m.year) &&
        !isBAD(m.program),
    );
  const hasPrograms = all.some(
    (m) => !isBAD(m.program) && cl(m.program) !== "-",
  );

  if (!hasPrograms) {
    const { rows, years } = buildPivotRows(all);
    if (!rows.length) return <Empty />;
    const latestYr = years.at(-1) ?? "";
    const placed = rows.find((r) => r.label.toLowerCase().includes("placed"))
      ?.yearVals[latestYr];
    const salary = rows.find((r) => r.isSal)?.yearVals[latestYr];
    return (
      <div>
        {(placed || salary) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {placed && (
              <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />
            )}
            {salary && (
              <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />
            )}
          </div>
        )}
        <Card title={sections[0]?.section} noPad>
          <YearPivotTable rows={rows} years={years} />
        </Card>
      </div>
    );
  }

  // Use allValid (all years) to derive programs so chart has multi-year data
  const validForProgs = allValid.filter((m) => isRealYear(m.year) && !isBAD(m.program));
  const pm = groupBy(validForProgs, (r) => normalizeProg(cl(r.program)));
  const allP = Array.from(pm.keys());
  const ugP = allP.filter(
    (p) =>
      p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"),
  );
  const pgIP = allP.filter(
    (p) =>
      p.toUpperCase().startsWith("PG-INT") ||
      p.toLowerCase().includes("integrated"),
  );
  const pgP = allP.filter(
    (p) =>
      p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
  );
  const otP = allP.filter(
    (p) => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p),
  );

  const orderedProgs = [...ugP, ...pgP, ...pgIP, ...otP];

  // Keep valid (year-filtered) for per-program detail blocks
  const valid = all.filter((m) => isRealYear(m.year) && !isBAD(m.program));
  const pmDetail = groupBy(valid, (r) => normalizeProg(cl(r.program)));

  function PBlock({ prog }: { prog: string }) {
    const rows = pmDetail.get(prog) ?? pm.get(prog) ?? [];
    const yearSet = new Set<string>();
    for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
    const years = Array.from(yearSet).sort((a, b) =>
      baseYear(a).localeCompare(baseYear(b)),
    );
    const mm = groupBy(rows, (r) => cl(r.metric));
    const pivotRows: PivotRow[] = Array.from(mm.entries())
      .map(([metric, mrows]) => {
        const yearVals: Record<string, string> = {};
        for (const r of mrows) {
          if (!isRealYear(r.year)) continue;
          yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value);
        }
        return {
          label: metric,
          yearVals,
          isSal:
            metric.toLowerCase().includes("salary") ||
            metric.toLowerCase().includes("median"),
        };
      })
      .filter((r) => Object.values(r.yearVals).some((v) => v !== ""));

    if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

    const latestGradYr =
      years
        .filter((y) => y.toLowerCase().includes("graduation"))
        .sort()
        .at(-1) ??
      years.at(-1) ??
      "";
    const kv = (kw: string) =>
      pivotRows.find((r) => r.label.toLowerCase().includes(kw))?.yearVals[
        latestGradYr
      ];
    const placed = kv("students placed");
    const salary = pivotRows.find((r) => r.isSal)?.yearVals[latestGradYr];
    const higher = kv("higher stud") || kv("selected for higher");

    return (
      <div>
        {(placed || salary || higher) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {placed && (
              <KV
                label={`Placed (${latestGradYr || "Latest"})`}
                value={fmtN(placed)}
                accent
              />
            )}
            {salary && <KV label="Median Salary" value={fmtSal(salary)} />}
            {higher && <KV label="Higher Studies" value={fmtN(higher)} />}
          </div>
        )}
        <YearPivotTable rows={pivotRows} years={years} />
      </div>
    );
  }

  function RG({
    progs,
    label,
    open = true,
  }: {
    progs: string[];
    label: string;
    open?: boolean;
  }) {
    if (!progs.length) return null;
    return (
      <PGroup
        label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`}
        open={open}
      >
        {progs.map((p, i) => (
          <div key={p}>
            {progs.length > 1 && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: "var(--crimson-dark)",
                  margin: i === 0 ? "0 0 10px" : "20px 0 10px",
                  paddingBottom: 6,
                  borderBottom: "1px dashed var(--border)",
                }}
              >
                {p}
              </div>
            )}
            <PBlock prog={p} />
          </div>
        ))}
      </PGroup>
    );
  }

  return (
    <div>
      <PlacementTrendChart allMetrics={allValid} programs={orderedProgs} />
      <RG progs={ugP} label="Undergraduate Programs" open={true} />
      <RG progs={pgP} label="Postgraduate Programs" open={true} />
      <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
      <RG progs={otP} label="Other Programs" open={false} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: PhD
// ─────────────────────────────────────────────────────────────────────────────

function TabPhd({
  sections,
  allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length)
    return <Empty msg="PhD data not available for this ranking year." />;

  const all = sections.flatMap((s) => s.metrics);
  const pursuing = all.filter((m) =>
    m.program?.toLowerCase().includes("pursuing"),
  );
  const graduated = all.filter((m) => isRealYear(m.year) && !isBAD(m.value));
  const ftP = pursuing.find((m) =>
    m.metric.toLowerCase().includes("full time"),
  )?.value;
  const ptP = pursuing.find((m) =>
    m.metric.toLowerCase().includes("part time"),
  )?.value;
  const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

  const allGraduated = allSections
    .flatMap((s) => s.metrics)
    .filter(
      (m) =>
        isRealYear(m.year) &&
        !isBAD(m.value) &&
        !m.program?.toLowerCase().includes("pursuing"),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PhdTrendChart metrics={allGraduated} />

      {(ftP || ptP) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
            gap: 10,
          }}
        >
          {ftP && !isBAD(ftP) && (
            <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />
          )}
          {ptP && !isBAD(ptP) && (
            <KV label="Part Time Students" value={fmtN(cl(ptP))} />
          )}
        </div>
      )}
      {pursuing.length > 0 && (
        <Card title="Currently Enrolled" noPad>
          {pursuing.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  color: "var(--ink-700)",
                }}
              >
                {m.program}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--ink-700)",
                  fontWeight: 600,
                }}
              >
                {isBAD(m.value) ? "—" : fmtN(cl(m.value))}
              </span>
            </div>
          ))}
        </Card>
      )}
      {gradRows.length > 0 && gradYears.length > 0 && (
        <Card title="Graduated — by Academic Year" noPad>
          <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Students
// ─────────────────────────────────────────────────────────────────────────────

function TabStudents({
  sections,
  allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length) return <Empty />;

  const allMetrics = allSections
    .filter(
      (s) =>
        s.section.toLowerCase().includes("student strength") ||
        s.section.toLowerCase().includes("student details"),
    )
    .flatMap((s) => s.metrics)


  return (
    <div>
      <StudentsTrendChart metrics={allMetrics as any} />

      {sections.map((sec) => {
        const metrics = sec.metrics.filter(
          (m) => !isBAD(m.value) && !isBAD(m.metric),
        );
        if (!metrics.length) return null;

        if (sec.section.toLowerCase().includes("scholarship")) {
          const valid = metrics.filter(
            (m) => isRealYear(m.year) && !isBAD(m.program),
          );
          if (!valid.length) return null;

          const yearSet = new Set<string>();
          const progSet = new Set<string>();
          for (const m of valid) {
            yearSet.add(baseYear(m.year));
            progSet.add(cl(m.program));
          }
          const years = Array.from(yearSet).sort();
          const progs = Array.from(progSet);

          const metricSet = new Set<string>();
          for (const m of valid) metricSet.add(m.metric);
          const metricLabels = Array.from(metricSet);

          function shortMetric(m: string): string {
            const ml = m.toLowerCase();
            if (ml.includes("institution")) return "Institution Funds";
            if (ml.includes("private")) return "Private Bodies";
            if (
              ml.includes("state") ||
              ml.includes("government") ||
              ml.includes("central")
            )
              return "State/Central Govt";
            if (ml.includes("not receiving")) return "Not Receiving";
            return m
              .replace(
                /No\. of students (receiving|who are)( full tuition fee)? /i,
                "",
              )
              .trim();
          }

          type YPM = Record<string, Record<string, Record<string, string>>>;
          const data: YPM = {};
          for (const m of valid) {
            const yr = baseYear(m.year);
            const pg = cl(m.program);
            const mt = m.metric;
            if (!data[yr]) data[yr] = {};
            if (!data[yr][pg]) data[yr][pg] = {};
            data[yr][pg][mt] = cl(m.value);
          }

          return (
            <Card key={sec.section} title={sec.section} noPad>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.78rem",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={TH}>Academic Year</th>
                      <th style={TH}>Program</th>
                      {metricLabels.map((m) => (
                        <th
                          key={m}
                          style={{
                            ...THR,
                            maxWidth: 130,
                            whiteSpace: "normal",
                            lineHeight: 1.3,
                          }}
                        >
                          {shortMetric(m)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {years.flatMap((yr) =>
                      progs
                        .filter((pg) => data[yr]?.[pg])
                        .map((pg, pi) => {
                          const rowIdx = years.indexOf(yr) * progs.length + pi;
                          return (
                            <tr
                              key={`${yr}-${pg}`}
                              style={{
                                borderBottom: "1px solid var(--border)",
                                background:
                                  rowIdx % 2
                                    ? "var(--off-white)"
                                    : "transparent",
                                transition: "background 0.1s",
                              }}
                              {...rh(rowIdx)}
                            >
                              {pi === 0 ? (
                                <td
                                  style={{ ...TDM, verticalAlign: "top" }}
                                  rowSpan={
                                    progs.filter((p) => data[yr]?.[p]).length
                                  }
                                >
                                  {yr}
                                </td>
                              ) : null}
                              <td style={TD}>{pg}</td>
                              {metricLabels.map((m) => {
                                const val = data[yr]?.[pg]?.[m] ?? "";
                                return (
                                  <td key={m} style={TDR}>
                                    {val ? (
                                      fmtN(val)
                                    ) : (
                                      <span style={{ color: "var(--ink-100)" }}>
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }),
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        const hasYears = metrics.some((m) => isRealYear(m.year));
        const hasPrograms = metrics.some(
          (m) => !isBAD(m.program) && cl(m.program) !== "-",
        );

        if (hasYears && hasPrograms) {
          const pm = groupBy(
            metrics.filter((m) => !isBAD(m.program)),
            (r) => cl(r.program),
          );
          const yearSet = new Set<string>();
          for (const rows of pm.values())
            for (const r of rows)
              if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
          const years = Array.from(yearSet).sort();
          return (
            <div key={sec.section}>
              {Array.from(pm.entries()).map(([prog, rows]) => {
                const { rows: pivotRows } = buildPivotRows(rows);
                if (!pivotRows.length) return null;
                return (
                  <Card key={prog} title={prog} noPad>
                    <YearPivotTable rows={pivotRows} years={years} />
                  </Card>
                );
              })}
            </div>
          );
        }

        const pm = groupBy(metrics, (r) => {
          const p = cl(r.program);
          return !p || p === "-" ? "All Programs" : p;
        });
        return (
          <Card key={sec.section} title={sec.section} noPad>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, minWidth: 180 }}>Program</th>
                    <th style={TH}>Metric</th>
                    <th style={THR}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
                    rows.map((r, i) => (
                      <tr
                        key={`${gi}-${i}`}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background:
                            (gi + i) % 2 ? "var(--off-white)" : "transparent",
                        }}
                        {...rh(gi + i)}
                      >
                        {i === 0 ? (
                          <td
                            style={{ ...TDM, verticalAlign: "top" }}
                            rowSpan={rows.length}
                          >
                            {prog}
                          </td>
                        ) : null}
                        <td style={TD}>{r.metric}</td>
                        <td style={TDR}>{fmtV(r.value, r.metric)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Research
// ─────────────────────────────────────────────────────────────────────────────

function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
  const valid = metrics.filter((m) => !isBAD(m.value) && !isWords(m.metric));
  if (!valid.length) return null;

  if (
    title.toLowerCase().includes("fdp") ||
    title.toLowerCase().includes("faculty development")
  ) {
    return (
      <Card title={title} noPad>
        <RecordTable
          metrics={metrics.filter((m) => !isBAD(m.value))}
          nameCol="Academic Year"
        />
      </Card>
    );
  }

  const hasYears = valid.some((m) => isRealYear(m.year));
  if (hasYears) {
    const { rows, years } = buildPivotRows(valid);
    if (!rows.length) return null;
    return (
      <Card title={title} noPad>
        <YearPivotTable rows={rows} years={years} />
        <div style={{ padding: "0 16px 4px" }}>
          <WordsDisclosure metrics={metrics} />
        </div>
      </Card>
    );
  }
  return (
    <Card title={title} noPad>
      <FlatTable metrics={valid} />
    </Card>
  );
}

function TabResearch({
  sections,
  allSections,
  row,
}: {
  sections: RawSection[];
  allSections: RawSection[];
  row: Record<string, unknown> | null;
}) {
  if (!sections.length) return <Empty />;
  const allSecMap = new Map(allSections.map((s) => [s.section, s]));
  return (
    <div>
      {sections.map((sec) => (
        <ResearchTrendChart
          key={sec.section}
          metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics}
          title={sec.section}
        />
      ))}
      {row && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {row.pdf_sponsored_projects != null && (
            <KV
              label="Sponsored Projects (3yr)"
              value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}
              accent
            />
          )}
          {row.pdf_consultancy_projects != null && (
            <KV
              label="Consultancy Projects (3yr)"
              value={Number(row.pdf_consultancy_projects).toLocaleString(
                "en-IN",
              )}
            />
          )}
          {row.pdf_edp_participants != null && (
            <KV
              label="EDP Participants (3yr)"
              value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}
            />
          )}
        </div>
      )}
      {sections.map((sec) => (
        <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Innovation
// ─────────────────────────────────────────────────────────────────────────────

function TabInnovation({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  return (
    <div>
      {sections.map((sec) => {
        const metrics = sec.metrics.filter((m) => !isBAD(m.value));
        if (!metrics.length) return null;

        if (sec.section.toLowerCase().includes("sustainab")) {
          return (
            <Card key={sec.section} title={sec.section}>
              {metrics
                .filter((m) => !isBAD(m.metric))
                .map((m, i) => {
                  const yes = m.value.toLowerCase().startsWith("yes");
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "10px 0",
                        borderBottom:
                          i < metrics.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.78rem",
                          color: "var(--ink-700)",
                          flex: 1,
                        }}
                      >
                        {m.metric}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          flexShrink: 0,
                          padding: "3px 10px",
                          color: yes ? "var(--teal)" : "var(--crimson)",
                          background: yes
                            ? "var(--teal-pale)"
                            : "var(--crimson-pale)",
                          border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                        }}
                      >
                        {m.value}
                      </span>
                    </div>
                  );
                })}
            </Card>
          );
        }

        if (
          sec.section.toLowerCase().includes("ipr") ||
          sec.section.toLowerCase().includes("patent")
        ) {
          const hasYears = metrics.some((m) => isRealYear(m.year));
          if (hasYears) {
            const { rows, years } = buildPivotRows(metrics);
            if (rows.length)
              return (
                <Card key={sec.section} title={sec.section} noPad>
                  <YearPivotTable rows={rows} years={years} />
                </Card>
              );
          }
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <FlatTable metrics={metrics} />
            </Card>
          );
        }

        const hasNamedProgram = metrics.some(
          (m) =>
            !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
        );
        if (hasNamedProgram) {
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <RecordTable metrics={metrics} nameCol="Name / Year" />
            </Card>
          );
        }

        return (
          <Card key={sec.section} title={sec.section} noPad>
            <FlatTable metrics={metrics} />
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Financial
// ─────────────────────────────────────────────────────────────────────────────

function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
  const valid = metrics.filter((m) => !isWords(m.metric));
  if (!valid.length) return null;
  const hasYears = valid.some((m) => isRealYear(m.year));
  const hasProg = valid.some((m) => !isBAD(m.program) && cl(m.program) !== "-");

  if (hasYears && hasProg) {
    const pm = groupBy(
      valid.filter((m) => isRealYear(m.year)),
      (r) => cl(r.program) || "General",
    );
    const yearSet = new Set<string>();
    for (const rows of pm.values())
      for (const r of rows)
        if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
    const years = Array.from(yearSet).sort();
    if (!years.length) return null;
    const pivotRows: PivotRow[] = Array.from(pm.entries())
      .map(([prog, rows]) => {
        const yearVals: Record<string, string> = {};
        for (const r of rows) {
          if (!isRealYear(r.year)) continue;
          yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
        }
        return { label: prog, yearVals, isAmt: true };
      })
      .filter((r) => Object.values(r.yearVals).some((v) => v !== ""));
    const totalYV: Record<string, string> = {};
    for (const yr of years) {
      let s = 0,
        any = false;
      for (const r of pivotRows) {
        const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
        if (!isNaN(n) && n > 0) {
          s += n;
          any = true;
        }
      }
      totalYV[yr] = any ? String(s) : "";
    }
    return (
      <Card title={title} noPad>
        <YearPivotTable
          rows={[
            ...pivotRows,
            { label: "Total", yearVals: totalYV, isAmt: true, isBold: true },
          ]}
          years={years}
          col1="Line Item"
        />
        <div style={{ padding: "0 16px 4px" }}>
          <WordsDisclosure metrics={metrics} />
        </div>
      </Card>
    );
  }

  if (hasYears) {
    const { rows, years } = buildPivotRows(valid);
    if (!rows.length) return null;
    return (
      <Card title={title} noPad>
        <YearPivotTable rows={rows} years={years} />
      </Card>
    );
  }
  return (
    <Card title={title} noPad>
      <FlatTable metrics={valid} />
    </Card>
  );
}

function TabFinancial({
  sections,
  allSections,
  row,
}: {
  sections: RawSection[];
  allSections: RawSection[];
  row: Record<string, unknown> | null;
}) {
  if (!sections.length) return <Empty />;
  const allSecMap = new Map(allSections.map((s) => [s.section, s]));
  return (
    <div>
      {sections.map((sec) => (
        <FinancialTrendChart
          key={sec.section}
          metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics}
          title={sec.section}
        />
      ))}
      {row && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {row.pdf_capital_expenditure != null && (
            <KV
              label="Capital Expenditure (3yr Sum)"
              value={fmtAmt(String(row.pdf_capital_expenditure))}
              accent
            />
          )}
          {row.pdf_operational_expenditure != null && (
            <KV
              label="Operational Expenditure (3yr Sum)"
              value={fmtAmt(String(row.pdf_operational_expenditure))}
            />
          )}
        </div>
      )}
      {sections.map((sec) => (
        <FinBlock
          key={`table-${sec.section}`}
          metrics={sec.metrics}
          title={sec.section}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Faculty
// ─────────────────────────────────────────────────────────────────────────────

function TabFaculty({ sections }: { sections: RawSection[] }) {
  const valid = sections
    .flatMap((s) => s.metrics)
    .filter((m) => !isBAD(m.value) && !isBAD(m.metric));
  if (!valid.length) return <Empty />;
  const count = valid.find(
    (m) =>
      m.metric.toLowerCase().includes("number of faculty") ||
      m.metric.toLowerCase().includes("no of regular faculty"),
  )?.value;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {count && !isBAD(count) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
            gap: 10,
          }}
        >
          <KV label="Faculty Members" value={fmtN(cl(count))} accent />
        </div>
      )}
      <Card title="Faculty Details" noPad>
        <FlatTable metrics={valid} />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Publications
// ─────────────────────────────────────────────────────────────────────────────

function TabPublications({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  const all = sections
    .flatMap((s) => s.metrics)
    .filter((m) => !isBAD(m.value) && !isBAD(m.metric));
  if (!all.length) return <Empty />;

  const hasYears = all.some((m) => isRealYear(m.year));
  const dbs = [...new Set(all.map((m) => cl(m.program)).filter(Boolean))];

  if (hasYears) {
    const pm = groupBy(
      all.filter((m) => !isBAD(m.program)),
      (r) => cl(r.program),
    );
    return (
      <div>
        {Array.from(pm.entries()).map(([db, rows]) => {
          const { rows: pivotRows, years } = buildPivotRows(rows);
          if (!pivotRows.length) return null;
          return (
            <Card key={db} title={db} noPad>
              <YearPivotTable rows={pivotRows} years={years} />
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {dbs.map((db) => (
        <Card key={db} title={db} noPad>
          <FlatTable metrics={all.filter((m) => cl(m.program) === db)} />
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Facilities
// ─────────────────────────────────────────────────────────────────────────────

function TabFacilities({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  return (
    <div>
      {sections.map((sec) => {
        const valid = sec.metrics.filter((m) => !isBAD(m.metric));
        if (!valid.length) return null;
        const hasYear = valid.some(
          (m) => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
        );

        if (sec.section.toLowerCase().includes("sustainab")) {
          return (
            <Card key={sec.section} title={sec.section}>
              {valid
                .filter((m) => !isBAD(m.value))
                .map((m, i) => {
                  const yes = m.value.toLowerCase().startsWith("yes");
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "10px 0",
                        borderBottom:
                          i < valid.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.78rem",
                          color: "var(--ink-700)",
                          flex: 1,
                        }}
                      >
                        {m.metric}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          padding: "3px 10px",
                          color: yes ? "var(--teal)" : "var(--crimson)",
                          background: yes
                            ? "var(--teal-pale)"
                            : "var(--crimson-pale)",
                          border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                        }}
                      >
                        {m.value}
                      </span>
                    </div>
                  );
                })}
            </Card>
          );
        }

        return (
          <Card key={sec.section} title={sec.section}>
            {valid.map((m, i) => {
              const yes = m.value.toLowerCase().startsWith("yes");
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: "12px 0",
                    borderBottom:
                      i < valid.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.78rem",
                        color: "var(--ink-700)",
                        lineHeight: 1.5,
                      }}
                    >
                      {m.metric}
                    </span>
                    {hasYear && m.year && m.year !== "-" && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.62rem",
                          color: "var(--ink-300)",
                          marginLeft: 8,
                        }}
                      >
                        ({m.year})
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      flexShrink: 0,
                      padding: "3px 10px",
                      color: yes ? "var(--teal)" : "var(--crimson)",
                      background: yes
                        ? "var(--teal-pale)"
                        : "var(--crimson-pale)",
                      border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Accreditation
// ─────────────────────────────────────────────────────────────────────────────

function TabAccreditation({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  return (
    <div>
      {sections.map((sec) => {
        const metrics = sec.metrics.filter(
          (m) => !isBAD(m.value) && !isBAD(m.metric),
        );
        if (!metrics.length) return null;
        const hasProgram = metrics.some(
          (m) => !isBAD(m.program) && cl(m.program) !== "-",
        );
        if (hasProgram)
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <RecordTable metrics={metrics} nameCol="Body" />
            </Card>
          );
        return (
          <Card key={sec.section} title={sec.section} noPad>
            <FlatTable metrics={metrics} />
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Other
// ─────────────────────────────────────────────────────────────────────────────

function TabOther({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  return (
    <div>
      {sections.map((sec) => {
        const metrics = sec.metrics.filter(
          (m) => !isBAD(m.value) && !isBAD(m.metric),
        );
        if (!metrics.length) return null;
        const hasYears = metrics.some((m) => isRealYear(m.year));
        const hasProgram = metrics.some(
          (m) => !isBAD(m.program) && cl(m.program) !== "-",
        );

        if (hasYears) {
          const { rows, years } = buildPivotRows(metrics);
          if (rows.length)
            return (
              <Card key={sec.section} title={sec.section} noPad>
                <YearPivotTable rows={rows} years={years} />
              </Card>
            );
        }
        if (hasProgram)
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <RecordTable metrics={metrics} />
            </Card>
          );
        return (
          <Card key={sec.section} title={sec.section} noPad>
            <FlatTable metrics={metrics} />
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function InstituteDetail({ hit, initialCategory }: Props) {
  const [profile, setProfile] = useState<InstituteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("scores");
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    initialCategory ?? "",
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
      .then((r) => r.json())
      .then((d: InstituteProfileResponse) => {
        setProfile(d);
        const yrs = Object.keys(d.scoresByYear)
          .filter((k) => !k.includes("::")) // skip "2025::Overall" composite keys
          .map(Number)
          .filter((n) => !isNaN(n))
          .sort((a, b) => b - a);
        setActiveYear(yrs[0] ?? null);

        // Set category: use initialCategory if valid, else first available
        const CAT_ORDER_LOAD: Record<string, number> = {
          Overall: 0,
          University: 1,
          Engineering: 2,
          Management: 3,
          Research: 4,
          Medical: 5,
          College: 6,
          Pharmacy: 7,
          Law: 8,
          Architecture: 9,
        };
        const sortedCats = [...(d.categories ?? [])].sort(
          (a, b) => (CAT_ORDER_LOAD[a] ?? 99) - (CAT_ORDER_LOAD[b] ?? 99),
        );
        if (initialCategory && d.categories.includes(initialCategory)) {
          setActiveCategory(initialCategory);
        } else {
          setActiveCategory(sortedCats[0] ?? "");
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit.institute_code]);

  if (loading) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--ink-300)",
            fontSize: "0.8rem",
          }}
        >
          Loading…
        </p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
          Could not load data.
        </p>
      </div>
    );
  }

  // allYears: years that have data for the active category
  // Keys are either plain "2025" or "2025::Overall" — filter to numeric only first
  const sby = profile.scoresByYear as Record<string, Record<string, unknown>>;
  const allYears = Object.keys(sby)
    .filter((k) => {
      if (k.includes("::")) return false; // skip composite keys for year list
      return !activeCategory || sby[`${k}::${activeCategory}`] != null;
    })
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);

  // All distinct categories for this institute
  const CAT_ORDER: Record<string, number> = {
    Overall: 0,
    University: 1,
    Engineering: 2,
    Management: 3,
    Research: 4,
    Medical: 5,
    College: 6,
    Pharmacy: 7,
    Law: 8,
    Architecture: 9,
  };
  console.log("categories from profile:", profile.categories);
  const allCategoriesForInst = [...(profile.categories ?? [])]
    .filter(Boolean)
    .sort(
      (a, b) =>
        (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99) || a.localeCompare(b),
    );

  // Get the active score row — filter by both year AND category

  const row: Record<string, unknown> | null = activeYear
    ? (sby[`${activeYear}::${activeCategory}`] ??
      sby[String(activeYear)] ??
      null)
    : null;

  const activeCode =
    (row?.institute_code as string | undefined) ?? hit.institute_code;
  // Filter raw sections by active category
  const allRawSections = profile.rawSections as RawSection[];
  const rawSections: RawSection[] = allRawSections
    .map((sec) => ({
      ...sec,
      metrics: activeCategory
        ? sec.metrics.filter(
            (m) => !m.category || m.category === activeCategory,
          )
        : sec.metrics,
    }))
    .filter((sec) => !activeCategory || sec.metrics.length > 0);

  const imgCols = Object.keys(row ?? {}).filter(
    (k) => k.startsWith("img_") && k.endsWith("_score"),
  );

  // secsByTab — filtered to active year
  const secsByTab = new Map<TabId, RawSection[]>();
  for (const s of rawSections) {
    const tabId = SECTION_TAB[s.section];
    if (!tabId) continue;
    const filtered: RawSection = {
      ...s,
      metrics: activeYear
        ? s.metrics.filter(
            (m) => m.ranking_year === activeYear || m.ranking_year === 0,
          )
        : s.metrics,
    };
    if (!filtered.metrics.length) continue;
    if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
    secsByTab.get(tabId)!.push(filtered);
  }

  // allSecsByTab — ALL ranking years (for trend charts)
  const allSecsByTab = new Map<TabId, RawSection[]>();
  for (const s of rawSections) {
    const tabId = SECTION_TAB[s.section];
    if (!tabId) continue;
    if (!s.metrics.length) continue;
    if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
    allSecsByTab.get(tabId)!.push(s);
  }

  const visibleTabs = ALL_TABS.filter(
    (t) => t.id === "scores" || secsByTab.has(t.id),
  );
  const safeTab: TabId = visibleTabs.find((t) => t.id === activeTab)
    ? activeTab
    : "scores";
  const getSecs = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
  const getAllSecs = (tabId: TabId): RawSection[] =>
    allSecsByTab.get(tabId) ?? [];
  const scoresByYear = profile.scoresByYear as Record<
    number,
    Record<string, unknown>
  >;

  const tabContent: Record<TabId, React.ReactNode> = {
    scores: row ? (
      <TabScores
        row={row}
        imgCols={imgCols}
        scoresByYear={scoresByYear}
        activeYear={activeYear!}
      />
    ) : (
      <Empty />
    ),
    intake: (
      <TabIntake
        sections={getSecs("intake")}
        allSections={getAllSecs("intake")}
      />
    ),
    placement: (
      <TabPlacement
        sections={getSecs("placement")}
        allSections={getAllSecs("placement")}
      />
    ),
    phd: <TabPhd sections={getSecs("phd")} allSections={getAllSecs("phd")} />,
    students: (
      <TabStudents
        sections={getSecs("students")}
        allSections={getAllSecs("students")}
      />
    ),
    research: (
      <TabResearch
        sections={getSecs("research")}
        allSections={getAllSecs("research")}
        row={row}
      />
    ),
    innovation: <TabInnovation sections={getSecs("innovation")} />,
    financial: (
      <TabFinancial
        sections={getSecs("financial")}
        allSections={getAllSecs("financial")}
        row={row}
      />
    ),
    faculty: <TabFaculty sections={getSecs("faculty")} />,
    publications: <TabPublications sections={getSecs("publications")} />,
    facilities: <TabFacilities sections={getSecs("facilities")} />,
    accreditation: <TabAccreditation sections={getSecs("accreditation")} />,
    other: <TabOther sections={getSecs("other")} />,
  };

  return (
    <div
      style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}
    >
      {/* ── Hero ── */}
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--border)",
          padding: "24px 28px",
          marginBottom: 20,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Active category badge */}
            {activeCategory && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: catColor(activeCategory),
                  background: `${catColor(activeCategory)}12`,
                  border: `1px solid ${catColor(activeCategory)}40`,
                  padding: "2px 8px",
                  marginBottom: 10,
                  display: "inline-block",
                }}
              >
                {activeCategory}
              </span>
            )}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(1.3rem,3vw,1.9rem)",
                color: "var(--ink-900)",
                lineHeight: 1.2,
                marginBottom: 5,
              }}
            >
              {profile.institute_name}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "var(--ink-300)",
              }}
            >
              {activeCode}
            </p>
          </div>

          {row?.img_total != null && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "3.2rem",
                  color: activeCategory
                    ? catColor(activeCategory)
                    : "var(--crimson)",
                  lineHeight: 1,
                  marginBottom: 3,
                }}
              >
                {(row.img_total as number).toFixed(2)}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-300)",
                }}
              >
                NIRF Total Score
              </p>
            </div>
          )}
        </div>

        {/* ── Ranking Year selector ── */}
        {allYears.length > 0 && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-300)",
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              Ranking Year
            </span>
            {allYears.map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  padding: "3px 11px",
                  background:
                    activeYear === y ? "var(--crimson)" : "var(--white)",
                  color: activeYear === y ? "var(--white)" : "var(--ink-500)",
                  border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* ── Category selector (NEW) — only shown when institute has multiple categories ── */}
        {allCategoriesForInst.length > 1 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-300)",
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              Category
            </span>
            {allCategoriesForInst.map((cat) => {
              const col = catColor(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    padding: "3px 12px",
                    background: isActive ? col : "var(--white)",
                    color: isActive ? "#fff" : col,
                    border: `1px solid ${col}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab strip ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border)",
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: safeTab === tab.id ? 600 : 400,
              fontSize: "0.78rem",
              padding: "9px 16px",
              background: "transparent",
              border: "none",
              borderBottom:
                safeTab === tab.id
                  ? `2px solid ${activeCategory ? catColor(activeCategory) : "var(--crimson)"}`
                  : "2px solid transparent",
              marginBottom: "-2px",
              color:
                safeTab === tab.id
                  ? activeCategory
                    ? catColor(activeCategory)
                    : "var(--crimson)"
                  : "var(--ink-400)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div style={{ animation: "fadeIn 0.18s ease both" }}>
        {safeTab === "scores" &&
          (row ? (
            <TabScores
              row={row}
              imgCols={imgCols}
              scoresByYear={scoresByYear}
              activeYear={activeYear!}
            />
          ) : (
            <Empty />
          ))}
        {safeTab === "intake" && (
          <TabIntake
            key="intake"
            sections={getSecs("intake")}
            allSections={getAllSecs("intake")}
          />
        )}
        {safeTab === "placement" && (
          <TabPlacement
            key="placement"
            sections={getSecs("placement")}
            allSections={getAllSecs("placement")}
          />
        )}
        {safeTab === "phd" && (
          <TabPhd
            key="phd"
            sections={getSecs("phd")}
            allSections={getAllSecs("phd")}
          />
        )}
        {safeTab === "students" && (
          <TabStudents
            key="students"
            sections={getSecs("students")}
            allSections={getAllSecs("students")}
          />
        )}
        {safeTab === "research" && (
          <TabResearch
            key="research"
            sections={getSecs("research")}
            allSections={getAllSecs("research")}
            row={row}
          />
        )}
        {safeTab === "innovation" && (
          <TabInnovation key="innovation" sections={getSecs("innovation")} />
        )}
        {safeTab === "financial" && (
          <TabFinancial
            key="financial"
            sections={getSecs("financial")}
            allSections={getAllSecs("financial")}
            row={row}
          />
        )}
        {safeTab === "faculty" && (
          <TabFaculty key="faculty" sections={getSecs("faculty")} />
        )}
        {safeTab === "publications" && (
          <TabPublications
            key="publications"
            sections={getSecs("publications")}
          />
        )}
        {safeTab === "facilities" && (
          <TabFacilities key="facilities" sections={getSecs("facilities")} />
        )}
        {safeTab === "accreditation" && (
          <TabAccreditation
            key="accreditation"
            sections={getSecs("accreditation")}
          />
        )}
        {safeTab === "other" && (
          <TabOther key="other" sections={getSecs("other")} />
        )}
      </div>
    </div>
  );
}
