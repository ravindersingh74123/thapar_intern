"use client";
/**
 * CompareView.tsx  (v5 — per-institute category selectors)
 * ─────────────────────────────────────────────────────────────────────────────
 * Each institute has its OWN category selector — you can compare
 * IIT Madras (Engineering) vs IIT Bombay (Overall) side-by-side.
 *
 * The category selector lives prominently inside the comparison view,
 * shown as a styled selector card directly under each institute's header column.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import type { SearchHit } from "@/app/page";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawMetric {
  metric: string;
  year: string;
  value: string;
  ranking_year: number;
  program: string;
  category: string;
}

interface InstituteProfile {
  institute_code: string;
  institute_name: string;
  categories: string[];
  scoresByYear: Record<string, Record<string, unknown>>;
  rawSections: { section: string; metrics: RawMetric[] }[];
}

type CompareData = Record<string, InstituteProfile>;

interface Props {
  institutes: SearchHit[];
  onRemove: (code: string) => void;
  onClose: () => void;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

const METRIC_PALETTE = [
  "#c0392b",
  "#1a7a6e",
  "#7d4fa8",
  "#b5651d",
  "#1d6fa8",
  "#5a8a3a",
  "#c0762b",
  "#2e6da4",
  "#8a5a2e",
  "#3a8a5a",
  "#6d2eb5",
  "#b52e6d",
];

const ALL_SCORE_PARAMS: {
  key: string;
  label: string;
  short: string;
  color: string;
}[] = [
  {
    key: "img_ss_score",
    label: "Student Strength",
    short: "SS",
    color: "#1a7a6e",
  },
  {
    key: "img_fsr_score",
    label: "Faculty-Student Ratio",
    short: "FSR",
    color: "#1d6fa8",
  },
  {
    key: "img_fqe_score",
    label: "Faculty Qualification",
    short: "FQE",
    color: "#7d4fa8",
  },
  {
    key: "img_fru_score",
    label: "Faculty Research",
    short: "FRU",
    color: "#5a8a3a",
  },
  {
    key: "img_oe_mir_score",
    label: "OE/MIR Score",
    short: "OE+MIR",
    color: "#6b5a1a",
  },
  {
    key: "img_oemir_score",
    label: "OE/MIR (alt)",
    short: "OEMIR",
    color: "#8b4513",
  },
  { key: "img_pu_score", label: "Perception", short: "PU", color: "#c0762b" },
  {
    key: "img_qp_score",
    label: "Quality Publication",
    short: "QP",
    color: "#2e6da4",
  },
  {
    key: "img_ipr_score",
    label: "IPR & Patents",
    short: "IPR",
    color: "#b5651d",
  },
  {
    key: "img_fppp_score",
    label: "Footprint of Projects",
    short: "FPPP",
    color: "#3a8a5a",
  },
  {
    key: "img_gue_score",
    label: "Graduate Performance",
    short: "GUE",
    color: "#1a5a7a",
  },
  {
    key: "img_gphd_score",
    label: "PhD Graduates",
    short: "GPHD",
    color: "#6d2eb5",
  },
  { key: "img_rd_score", label: "R&D", short: "RD", color: "#c0392b" },
  { key: "img_wd_score", label: "Wider Impact", short: "WD", color: "#2b6dc0" },
  {
    key: "img_escs_score",
    label: "Economic & Social",
    short: "ESCS",
    color: "#8a5a2e",
  },
  {
    key: "img_pcs_score",
    label: "Peer Perception",
    short: "PCS",
    color: "#4a5568",
  },
  {
    key: "img_pr_score",
    label: "Perception (PR)",
    short: "PR",
    color: "#b52e6d",
  },
];

const SECTION_TABS: {
  id: string;
  label: string;
  kw: string;
  excludeKw?: string;
  isAmt: boolean;
  useRankingYear: boolean;
}[] = [
  {
    id: "intake",
    label: "Intake",
    kw: "Sanctioned",
    isAmt: false,
    useRankingYear: false,
  },
  {
    id: "placement",
    label: "Placement",
    kw: "Placement",
    isAmt: false,
    useRankingYear: false,
  },
  {
    id: "students",
    label: "Students",
    kw: "Student",
    excludeKw: "Ph.D",
    isAmt: false,
    useRankingYear: true,
  },
  { id: "phd", label: "PhD", kw: "Ph.D", isAmt: false, useRankingYear: false },
  {
    id: "research",
    label: "Research",
    kw: "Sponsored Research",
    isAmt: false,
    useRankingYear: false,
  },
  {
    id: "consultancy",
    label: "Consultancy",
    kw: "Consultancy",
    isAmt: true,
    useRankingYear: false,
  },
  {
    id: "financial",
    label: "Financial",
    kw: "expenditure",
    isAmt: true,
    useRankingYear: false,
  },
  {
    id: "faculty",
    label: "Faculty",
    kw: "Faculty",
    isAmt: false,
    useRankingYear: true,
  },
  {
    id: "publications",
    label: "Publications",
    kw: "Publication",
    isAmt: false,
    useRankingYear: false,
  },
];

// ── CSS constants ─────────────────────────────────────────────────────────────

const MONO = "'IBM Plex Mono', monospace";
const BODY = "'Plus Jakarta Sans', sans-serif";
const SERIF = "'DM Serif Display', serif";
const BORDER = "#e4e2dd";
const OFF_WHITE = "#f7f6f3";
const CRIMSON = "#c0392b";
const CRIMSON_PALE = "#fdf1f0";
const INK900 = "#1a1916";
const INK500 = "#6b6860";
const INK300 = "#a8a49c";
const WHITE = "#ffffff";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BAD_SET = new Set([
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
const isBAD = (v: unknown) =>
  BAD_SET.has(
    String(v ?? "")
      .trim()
      .toLowerCase(),
  );
const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};

const fmtScore = (v: unknown) => {
  const n = toNum(v);
  return n != null ? n.toFixed(2) : "—";
};
const fmtN = (v: unknown) => {
  const n = toNum(v);
  return n != null ? n.toLocaleString("en-IN") : "—";
};
const fmtAmt = (v: unknown) => {
  const n = toNum(v);
  if (n == null) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const fmtSal = (v: unknown) => {
  const n = toNum(v);
  return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—";
};

function bestIdx(vals: (number | null)[], higher = true): number {
  let best: number | null = null,
    idx = -1;
  vals.forEach((v, i) => {
    if (v == null) return;
    if (best == null || (higher ? v > best : v < best)) {
      best = v;
      idx = i;
    }
  });
  return idx;
}

function baseYear(y: string): string {
  return y?.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y?.trim() ?? "";
}
function isRealYear(y: string): boolean {
  return !!y && !isBAD(y) && /^\d{4}(-\d{2})?/.test(y.trim());
}
function sortYrs(years: string[]): string[] {
  return [...years].sort((a, b) => {
    const ay = parseInt(a),
      by = parseInt(b);
    return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
  });
}

// ── Row resolver — picks the right score row for a given code + year + category ──

function resolveRow(
  profile: InstituteProfile | undefined,
  year: number,
  category: string,
): Record<string, unknown> | null {
  if (!profile || year <= 0) return null;
  const sby = profile.scoresByYear;
  if (category) {
    const catKey = `${year}::${category}`;
    if (sby[catKey]) return sby[catKey];
  }
  // Fall back to plain year key
  return sby[String(year)] ?? null;
}

// ── Per-institute category selector ──────────────────────────────────────────

function InstCategorySelector({
  profile,
  activeCategory,
  onChange,
  color,
}: {
  profile: InstituteProfile;
  activeCategory: string;
  onChange: (cat: string) => void;
  color: string;
}) {
  const cats = profile.categories;
  if (!cats || cats.length <= 1) {
    // Only one category — show it as a static badge, no selector needed
    return (
      <div
        style={{
          marginTop: 6,
          padding: "4px 10px",
          background: `${color}12`,
          border: `1px solid ${color}40`,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: color,
            fontWeight: 600,
          }}
        >
          {cats[0] ?? "—"}
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "0.55rem",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: INK300,
          marginBottom: 5,
        }}
      >
        Category
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {cats.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                padding: "4px 10px",
                background: isActive ? color : "transparent",
                color: isActive ? WHITE : color,
                border: `1.5px solid ${color}`,
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.12s",
                fontWeight: isActive ? 700 : 400,
                opacity: isActive ? 1 : 0.65,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = `${color}18`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "0.65";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── UI Primitives ─────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 24px 10px",
        borderBottom: `1px solid ${BORDER}`,
        borderTop: `3px solid ${CRIMSON}`,
        background: CRIMSON_PALE,
        marginTop: 28,
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: CRIMSON,
          fontWeight: 600,
        }}
      >
        {children}
      </p>
    </div>
  );
}

function ChartTip({
  active: isActive,
  payload,
  label,
  fmtFn,
}: {
  active?: boolean;
  payload?: { name: string; value: unknown; color: string }[];
  label?: string;
  fmtFn?: (v: unknown) => string;
}) {
  if (!isActive || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1916",
        border: "1px solid #3d3b36",
        fontFamily: MONO,
        fontSize: "0.67rem",
        color: "#f7f6f3",
        padding: "8px 12px",
      }}
    >
      <p style={{ color: INK300, marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}:{" "}
          <strong>
            {fmtFn ? fmtFn(p.value) : (toNum(p.value)?.toFixed(2) ?? "—")}
          </strong>
        </p>
      ))}
    </div>
  );
}

const AX = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fontFamily: MONO, fontSize: 10, fill: INK300 },
};

function PillBar({
  pills,
  active,
  onToggle,
  onAll,
}: {
  pills: { key: string; label: string; color?: string }[];
  active: Set<string>;
  onToggle: (k: string) => void;
  onAll: () => void;
}) {
  const allOn = pills.every((p) => active.has(p.key));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 5,
        padding: "10px 24px 8px",
        borderBottom: `1px solid ${BORDER}`,
        background: OFF_WHITE,
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
        Parameters
      </span>
      <button
        onClick={onAll}
        style={{
          fontFamily: MONO,
          fontSize: "0.6rem",
          padding: "3px 9px",
          border: `1px solid ${allOn ? CRIMSON : BORDER}`,
          background: allOn ? CRIMSON : WHITE,
          color: allOn ? WHITE : INK300,
          cursor: "pointer",
          borderRadius: 2,
        }}
      >
        All
      </button>
      {pills.map((p) => {
        const on = active.has(p.key);
        const col = p.color ?? CRIMSON;
        return (
          <button
            key={p.key}
            onClick={() => onToggle(p.key)}
            style={{
              fontFamily: MONO,
              fontSize: "0.6rem",
              padding: "3px 9px",
              border: `1px solid ${on ? col : BORDER}`,
              background: on ? col : WHITE,
              color: on ? WHITE : INK300,
              cursor: "pointer",
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Table column header (shows per-institute category badge) ──────────────────

function TableColHeader({
  codes,
  profiles,
  instCategories,
}: {
  codes: string[];
  profiles: CompareData;
  instCategories: Record<string, string>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `200px repeat(${codes.length}, 1fr)`,
        borderBottom: `2px solid ${BORDER}`,
        background: OFF_WHITE,
      }}
    >
      <div style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            color: INK300,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Metric
        </span>
      </div>
      {codes.map((code, i) => (
        <div
          key={code}
          style={{
            padding: "8px 14px",
            textAlign: "center",
            borderRight: i < codes.length - 1 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: "0.62rem",
              color: INST_COLORS[i],
              fontWeight: 600,
              display: "block",
            }}
          >
            {profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ??
              code}
          </span>
          {instCategories[code] && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: "0.55rem",
                color: INST_COLORS[i],
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {instCategories[code]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricRow({
  label,
  values,
  bestI,
  fmt,
  subLabel,
}: {
  label: string;
  values: (number | null)[];
  bestI: number;
  fmt?: (v: unknown) => string;
  subLabel?: string;
}) {
  const n = values.length;
  const fmtFn = fmt ?? fmtScore;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `200px repeat(${n}, 1fr)`,
        borderBottom: `1px solid ${BORDER}`,
        minHeight: 38,
      }}
    >
      <div
        style={{
          padding: "9px 14px",
          background: OFF_WHITE,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: BODY, fontSize: "0.74rem", color: INK900 }}>
          {label}
        </span>
        {subLabel && (
          <span
            style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300 }}
          >
            {subLabel}
          </span>
        )}
      </div>
      {values.map((v, i) => {
        const isBest = i === bestI && v != null;
        return (
          <div
            key={i}
            style={{
              padding: "9px 14px",
              borderRight: i < n - 1 ? `1px solid ${BORDER}` : "none",
              background: isBest ? CRIMSON_PALE : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: "0.76rem",
                fontWeight: isBest ? 700 : 400,
                color: isBest ? CRIMSON : v != null ? INK900 : INK300,
              }}
            >
              {v != null ? fmtFn(v) : "—"}
              {isBest && v != null && (
                <span style={{ marginLeft: 3, fontSize: "0.55rem" }}> ★</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── NIRF Score Chart (per-institute category aware) ───────────────────────────

function NIRFScoreChart({
  profiles,
  codes,
  years,
  instCategories,
}: {
  profiles: CompareData;
  codes: string[];
  years: number[];
  instCategories: Record<string, string>;
}) {
  const getRow = (code: string, yr: number) =>
    resolveRow(profiles[code], yr, instCategories[code] ?? "");

  const available = ALL_SCORE_PARAMS.filter((p) =>
    codes.some((c) => years.some((y) => toNum(getRow(c, y)?.[p.key]) != null)),
  );

  const [active, setActive] = useState<Set<string>>(
    () => new Set(available.slice(0, 5).map((p) => p.key)),
  );

  const toggle = (k: string) =>
    setActive((prev) => {
      const s = new Set(prev);
      s.has(k) ? s.size > 1 && s.delete(k) : s.add(k);
      return s;
    });
  const toggleAll = () =>
    setActive((prev) =>
      prev.size === available.length
        ? new Set([available[0]?.key ?? ""])
        : new Set(available.map((p) => p.key)),
    );

  const activeParams = available.filter((p) => active.has(p.key));

  const chartData = [...years].reverse().map((yr) => {
    const pt: Record<string, unknown> = { year: yr };
    for (const code of codes) {
      for (const p of activeParams) {
        const v = toNum(getRow(code, yr)?.[p.key]);
        if (v != null) pt[`${code}::${p.key}`] = v;
      }
    }
    return pt;
  });

  if (!available.length)
    return (
      <div
        style={{
          padding: "20px 24px",
          color: INK300,
          fontFamily: MONO,
          fontSize: "0.75rem",
        }}
      >
        No score data available for the selected categories.
      </div>
    );

  return (
    <>
      <PillBar
        pills={available.map((p) => ({
          key: p.key,
          label: p.label,
          color: p.color,
        }))}
        active={active}
        onToggle={toggle}
        onAll={toggleAll}
      />
      <div style={{ padding: "20px 24px 8px" }}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="2 4"
              stroke={BORDER}
              vertical={false}
            />
            <XAxis dataKey="year" {...AX} />
            <YAxis domain={[0, "auto"]} {...AX} width={32} />
            <Tooltip content={<ChartTip fmtFn={fmtScore} />} />
            <Legend
              wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 10 }}
              content={(props: any) => {
                const { payload } = props;
                if (!payload?.length) return null;
                const DASHES = [
                  undefined, "6 3", "2 3", "8 3 2 3", "12 3", "4 2 4 2",
                ];
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px", paddingTop: 10 }}>
                    {payload.map((entry: any, idx: number) => {
                      const value = entry.dataKey ?? "";
                      const sep = value.indexOf("::");
                      const code = value.slice(0, sep);
                      const paramKey = value.slice(sep + 2);
                      const pLabel = ALL_SCORE_PARAMS.find(p => p.key === paramKey)?.short ?? paramKey;
                      const instName = profiles[code]?.institute_name?.split(" ").slice(0, 4).join(" ") ?? code;
                      const cat = instCategories[code];
                      const ci = codes.indexOf(code);
                      const col = INST_COLORS[ci];
                      // figure out which param index this is for dash pattern
                      const pi = activeParams.findIndex(p => p.key === paramKey);
                      const dash = DASHES[pi % DASHES.length];
                      const isDashed = !!dash;
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width={28} height={10}>
                            <line
                              x1={0} y1={5} x2={28} y2={5}
                              stroke={col} strokeWidth={2}
                              strokeDasharray={dash ?? undefined}
                            />
                            <circle cx={14} cy={5} r={3} fill={col} />
                          </svg>
                          <span style={{ color: col, fontFamily: MONO, fontSize: "0.58rem" }}>
                            {instName}{cat ? ` (${cat})` : ""} · {pLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {codes.flatMap((code, ci) =>
              activeParams.map((p, pi) => {
                // Institute = color, Parameter = dash pattern
                const col = INST_COLORS[ci];
                const DASHES = [
                  undefined,    // solid
                  "6 3",        // dashed
                  "2 3",        // dotted
                  "8 3 2 3",    // dash-dot
                  "12 3",       // long dash
                  "4 2 4 2",    // alternating
                ];
                const dash = DASHES[pi % DASHES.length];
                const dKey = `${code}::${p.key}`;
                if (!chartData.some((d) => d[dKey] != null)) return null;
                return (
                  <Line
                    key={dKey}
                    type="monotone"
                    dataKey={dKey}
                    name={dKey}
                    stroke={col}
                    strokeWidth={ci === 0 ? 2.5 : 1.8}
                    strokeDasharray={dash}
                    dot={{ r: 3, fill: col, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                );
              }),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── Radar (per-institute category aware) ──────────────────────────────────────

function ScoreRadar({
  profiles, codes, instYears, instCategories,
}: {
  profiles: CompareData;
  codes: string[];
  instYears: Record<string, number>;
  instCategories: Record<string, string>;
}) {
  const getRow = (code: string) =>
    resolveRow(profiles[code], instYears[code] ?? 0, instCategories[code] ?? "");

  const params = ALL_SCORE_PARAMS.filter((p) =>
    codes.some((c) => toNum(getRow(c)?.[p.key]) != null),
  );
  if (params.length < 3) return null;

  const data = params.map((p) => {
    const pt: Record<string, unknown> = { param: p.short };
    for (const code of codes) {
      const row = getRow(code);
      const v = toNum(row?.[p.key]);
      const t = toNum(row?.[p.key.replace("_score", "_total")]) ?? 100;
      pt[code] = v != null && t > 0 ? +((v / t) * 100).toFixed(1) : 0;
    }
    return pt;
  });

  return (
    <div style={{ padding: "16px 24px 8px" }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "0.6rem",
          color: INK300,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        Score Profile Radar — % of parameter maximum
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={data} margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
          <PolarGrid stroke={BORDER} />
          <PolarAngleAxis
            dataKey="param"
            tick={(props: any) => {
              const { x, y, payload, cx, cy } = props;
              const FULL: Record<string, string> = {
                SS: "Student Strength", FSR: "Faculty–Student Ratio",
                FQE: "Faculty Qualification", FRU: "Faculty Research",
                "OE/MIR": "Outreach & Inclusivity", OEMIR: "OE/MIR Score",
                PU: "Perception", QP: "Quality Publication",
                IPR: "IPR & Patents", FPPP: "Footprint of Projects",
                GUE: "Graduate Performance", GPHD: "PhD Graduates",
                RD: "R&D", WD: "Wider Impact",
                ESCS: "Economic & Social", PCS: "Peer Perception",
                PR: "Perception (PR)",
              };
              const short = payload.value;
              const full  = FULL[short] ?? short;
              const anchor = x > cx + 5 ? "start" : x < cx - 5 ? "end" : "middle";
              return (
                <g>
                  <text x={x} y={y - 6} textAnchor={anchor}
                    fontFamily={MONO} fontSize={9} fontWeight={600} fill={INK500}>
                    {short}
                  </text>
                  <text x={x} y={y + 5} textAnchor={anchor}
                    fontFamily={MONO} fontSize={7.5} fill={INK300}>
                    {full}
                  </text>
                </g>
              );
            }}
          />
          {codes.map((code, i) => (
            <Radar
              key={code}
              name={`${profiles[code]?.institute_name?.split(" ").slice(0, 2).join(" ") ?? code}${instCategories[code] ? ` (${instCategories[code]})` : ""}${instYears[code] ? ` · ${instYears[code]}` : ""}`}
              dataKey={code}
              stroke={INST_COLORS[i]}
              fill={INST_COLORS[i]}
              fillOpacity={0.09}
              strokeWidth={2}
            />
          ))}
          {/* <Legend
            wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem", paddingTop: 10 }}
            formatter={(value: string) => {
              const ci = codes.indexOf(value);
              const col = INST_COLORS[ci] ?? INST_COLORS[0];
              const instName = profiles[value]?.institute_name?.split(" ").slice(0, 4).join(" ") ?? value;
              const cat = instCategories[value];
              const yr = instYears[value];
              return (
                <span style={{ color: col }}>
                  {instName}{cat ? ` (${cat})` : ""}{yr ? ` · ${yr}` : ""}
                </span>
              );
            }}
          /> */}
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", paddingTop: 14 }}>
        {codes.map((code, ci) => {
          const col = INST_COLORS[ci];
          const instName = profiles[code]?.institute_name ?? code;
          const cat = instCategories[code];
          const yr = instYears[code];
          const row = resolveRow(profiles[code], yr ?? 0, cat ?? "");
          if (!row) return null;
          return (
            <div key={code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={36} height={12}>
                <line x1={0} y1={6} x2={36} y2={6} stroke={col} strokeWidth={2} />
                <circle cx={2} cy={6} r={2} fill={col} />
                <circle cx={18} cy={6} r={3.5} fill={col} />
                <circle cx={34} cy={6} r={2} fill={col} />
              </svg>
              <span style={{ color: col, fontFamily: MONO, fontSize: "0.58rem" }}>
                {instName}{cat ? ` (${cat})` : ""}{yr ? ` · ${yr}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section Chart ─────────────────────────────────────────────────────────────

type SectionIndex = Map<string, Map<string, Map<string, Map<string, number>>>>;

function buildSectionIndex(
  profiles: CompareData,
  codes: string[],
  sectionKw: string,
  useRankingYear: boolean,
  excludeKw?: string,
  instCategories?: Record<string, string>,
): {
  index: SectionIndex;
  programs: string[];
  metrics: string[];
  years: string[];
} {
  const BAD_PROG = new Set([
    "",
    "-",
    "nan",
    "<na>",
    "null",
    "undefined",
    "none",
    "n/a",
  ]);
  const progSet = new Set<string>();
  const metricSet = new Set<string>();
  const yearSet = new Set<string>();
  const index: SectionIndex = new Map();

  for (const code of codes) {
    const catFilter = instCategories?.[code] ?? "";
    const codeMap: Map<string, Map<string, Map<string, number>>> = new Map();
    index.set(code, codeMap);
    const p = profiles[code];
    if (!p) continue;
    for (const sec of p.rawSections) {
      const secLower = sec.section.toLowerCase();
      if (!secLower.includes(sectionKw.toLowerCase())) continue;
      if (excludeKw && secLower.includes(excludeKw.toLowerCase())) continue;
      for (const m of sec.metrics) {
        if (isBAD(m.value) || m.metric.toLowerCase().includes("in words"))
          continue;
        if (catFilter && m.category && m.category !== catFilter) continue;
        const v = toNum(m.value);
        if (v == null || v < 0) continue;
        const yr = useRankingYear
          ? String(m.ranking_year)
          : isRealYear(m.year)
            ? baseYear(m.year)
            : String(m.ranking_year);
        if (!yr) continue;
        const prog = BAD_PROG.has((m.program ?? "").trim().toLowerCase())
          ? "(All)"
          : m.program.trim();
        const metric = m.metric.trim();
        progSet.add(prog);
        metricSet.add(metric);
        yearSet.add(yr);
        if (!codeMap.has(prog)) codeMap.set(prog, new Map());
        const pm = codeMap.get(prog)!;
        if (!pm.has(metric)) pm.set(metric, new Map());
        pm.get(metric)!.set(yr, Math.max(pm.get(metric)!.get(yr) ?? 0, v));
      }
    }
  }

  const programs = Array.from(progSet).sort((a, b) => {
    if (a === "(All)") return -1;
    if (b === "(All)") return 1;
    const rank = (s: string) =>
      s.startsWith("UG")
        ? 0
        : s.startsWith("PG-Int")
          ? 2
          : s.startsWith("PG")
            ? 1
            : 3;
    return rank(a) !== rank(b) ? rank(a) - rank(b) : a.localeCompare(b);
  });
  return {
    index,
    programs,
    metrics: Array.from(metricSet).sort(),
    years: sortYrs(Array.from(yearSet)),
  };
}

const SEL: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: "0.72rem",
  background: WHITE,
  color: INK900,
  border: `1px solid ${BORDER}`,
  padding: "6px 28px 6px 10px",
  cursor: "pointer",
  outline: "none",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  minWidth: 160,
  maxWidth: 320,
  letterSpacing: "0.02em",
};

function SectionChart({
  profiles,
  codes,
  sectionKw,
  excludeKw,
  isAmt,
  useRankingYear,
  instCategories,
}: {
  profiles: CompareData;
  codes: string[];
  sectionKw: string;
  excludeKw?: string;
  isAmt: boolean;
  useRankingYear: boolean;
  instCategories: Record<string, string>;
}) {
  const { index, programs, metrics, years } = buildSectionIndex(
    profiles,
    codes,
    sectionKw,
    useRankingYear,
    excludeKw,
    instCategories,
  );

  const [selProg, setSelProg] = useState<string>(() => programs[0] ?? "");
  const [selMetrics, setSelMetrics] = useState<Set<string>>(
    () => new Set(metrics.slice(0, 4)),
  );

  React.useEffect(() => {
    setSelProg(programs[0] ?? "");
    setSelMetrics(new Set(metrics.slice(0, 4)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKw, JSON.stringify(instCategories)]);

  if (!programs.length || !metrics.length || !years.length) {
    return (
      <div
        style={{
          padding: "20px 24px",
          color: INK300,
          fontFamily: MONO,
          fontSize: "0.75rem",
        }}
      >
        No data found for this section with the current category selection.
      </div>
    );
  }

  const fmtFn = isAmt ? fmtAmt : fmtN;
  const hasPrograms = programs.length > 1 || programs[0] !== "(All)";
  const useDropdown = metrics.length > 10;

  const toggleMetric = (m: string) =>
    setSelMetrics((prev) => {
      const s = new Set(prev);
      s.has(m) ? s.size > 1 && s.delete(m) : s.add(m);
      return s;
    });
  const activeMetrics = metrics.filter((m) => selMetrics.has(m));

  const chartData = years.map((yr) => {
    const pt: Record<string, unknown> = { year: yr };
    for (const code of codes) {
      for (const metric of activeMetrics) {
        const v = index.get(code)?.get(selProg)?.get(metric)?.get(yr);
        if (v != null) pt[`${code}::${metric}`] = v;
      }
    }
    return pt;
  });
  const hasData = chartData.some((pt) => Object.keys(pt).length > 1);

  return (
    <>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 28,
          flexWrap: "wrap",
          padding: "14px 24px 12px",
          borderBottom: `1px solid ${BORDER}`,
          background: OFF_WHITE,
        }}
      >
        {hasPrograms && (
          <div style={{ flexShrink: 0 }}>
            <label
              style={{
                display: "block",
                fontFamily: MONO,
                fontSize: "0.58rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: INK300,
                marginBottom: 5,
              }}
            >
              Program
            </label>
            <div style={{ position: "relative", display: "inline-block" }}>
              <select
                value={selProg}
                onChange={(e) => setSelProg(e.target.value)}
                style={SEL}
              >
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: INK300,
                  fontSize: "0.65rem",
                }}
              >
                ▾
              </span>
            </div>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 260 }}>
          <label
            style={{
              display: "block",
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              marginBottom: 5,
            }}
          >
            Metrics{" "}
            {useDropdown && (
              <span style={{ color: CRIMSON }}>
                ({selMetrics.size} selected)
              </span>
            )}
          </label>
          {!useDropdown ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <button
                onClick={() => setSelMetrics(new Set(metrics))}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  padding: "3px 8px",
                  border: `1px solid ${selMetrics.size === metrics.length ? CRIMSON : BORDER}`,
                  background:
                    selMetrics.size === metrics.length ? CRIMSON : WHITE,
                  color: selMetrics.size === metrics.length ? WHITE : INK300,
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                All
              </button>
              {metrics.map((m, i) => {
                const on = selMetrics.has(m);
                const col = METRIC_PALETTE[i % METRIC_PALETTE.length];
                return (
                  <button
                    key={m}
                    onClick={() => toggleMetric(m)}
                    title={m}
                    style={{
                      fontFamily: MONO,
                      fontSize: "0.6rem",
                      padding: "3px 9px",
                      border: `1px solid ${on ? col : BORDER}`,
                      background: on ? col : WHITE,
                      color: on ? WHITE : INK300,
                      cursor: "pointer",
                      borderRadius: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.length > 32 ? m.slice(0, 30) + "…" : m}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              {Array.from(selMetrics).map((m) => {
                const col =
                  METRIC_PALETTE[metrics.indexOf(m) % METRIC_PALETTE.length];
                return (
                  <div
                    key={m}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 8px 4px 10px",
                      border: `1px solid ${col}`,
                      background: `${col}18`,
                      borderRadius: 3,
                      maxWidth: 260,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: col,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "0.62rem",
                        color: INK900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 190,
                      }}
                      title={m}
                    >
                      {m.length > 28 ? m.slice(0, 26) + "…" : m}
                    </span>
                    <button
                      onClick={() => toggleMetric(m)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: INK300,
                        fontSize: "0.65rem",
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <div style={{ position: "relative", display: "inline-block" }}>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) toggleMetric(e.target.value);
                  }}
                  style={{ ...SEL, minWidth: 180, color: INK500 }}
                >
                  <option value="">+ Add metric…</option>
                  {metrics
                    .filter((m) => !selMetrics.has(m))
                    .map((m) => (
                      <option key={m} value={m}>
                        {m.length > 56 ? m.slice(0, 54) + "…" : m}
                      </option>
                    ))}
                </select>
                <span
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: INK300,
                    fontSize: "0.65rem",
                  }}
                >
                  ▾
                </span>
              </div>
              <button
                onClick={() => setSelMetrics(new Set([metrics[0]]))}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  padding: "4px 10px",
                  border: `1px solid ${BORDER}`,
                  background: WHITE,
                  color: INK300,
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setSelMetrics(new Set(metrics))}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  padding: "4px 10px",
                  border: `1px solid ${BORDER}`,
                  background: WHITE,
                  color: INK300,
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div
          style={{
            padding: "20px 24px",
            color: INK300,
            fontFamily: MONO,
            fontSize: "0.72rem",
          }}
        >
          No data for the selected program / metric combination.
        </div>
      ) : (
        <div style={{ padding: "16px 24px 8px" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke={BORDER}
                vertical={false}
              />
              <XAxis dataKey="year" {...AX} />
              <YAxis {...AX} />
              <Tooltip content={<ChartTip fmtFn={fmtFn} />} />
              <Legend
                wrapperStyle={{
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  paddingTop: 10,
                }}
                formatter={(value: string) => {
                  const sep = value.indexOf("::");
                  const code = value.slice(0, sep);
                  const metric = value.slice(sep + 2);
                  const cat = instCategories[code];
                  return `${profiles[code]?.institute_name ?? code}${cat ? ` (${cat})` : ""} · ${metric}`;
                }}
              />
              {codes.flatMap((code, ci) =>
                activeMetrics.map((metric) => {
                  const mi = metrics.indexOf(metric);
                  const col =
                    ci === 0
                      ? METRIC_PALETTE[mi % METRIC_PALETTE.length]
                      : INST_COLORS[ci];
                  const dash = ci === 0 ? undefined : "6 3";
                  const dKey = `${code}::${metric}`;
                  if (!chartData.some((d) => d[dKey] != null)) return null;
                  return (
                    <Line
                      key={dKey}
                      type="monotone"
                      dataKey={dKey}
                      name={dKey}
                      stroke={col}
                      strokeWidth={ci === 0 ? 2.2 : 1.8}
                      strokeDasharray={dash}
                      dot={{ r: 3, fill: col, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  );
                }),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

// ── Main CompareView ──────────────────────────────────────────────────────────

export default function CompareView({ institutes, onRemove }: Props) {
  const [data, setData] = useState<CompareData>({});
  const [loading, setLoading] = useState(true);
  const [instYears, setInstYears] = useState<Record<string, number>>({});
  // Per-institute category: code → selected category
  const [instCategories, setInstCategories] = useState<Record<string, string>>(
    {},
  );
  const [activeSecTab, setActiveSecTab] = useState("intake");

  const codes = institutes.map((i) => i.institute_code);

  useEffect(() => {
    if (!codes.length) return;
    setLoading(true);
    fetch(`/api/compare?codes=${codes.join(",")}`)
      .then((r) => r.json())
      .then((d: CompareData) => {
        setData(d);

        // Default year — most recent year common to all, or fallback
        // Default per-institute category — pick first available category for each
        const catDefaults: Record<string, string> = {};
        const yearDefaults: Record<string, number> = {};
        for (const code of codes) {
          const cats = d[code]?.categories ?? [];
          catDefaults[code] = cats[0] ?? "";
          // Default year = most recent year that has data for the default category
          const defaultCat = cats[0] ?? "";
          const availYears = Object.keys(d[code]?.scoresByYear ?? {})
            .filter(
              (k) =>
                !k.includes("::") &&
                (!defaultCat ||
                  d[code].scoresByYear[`${k}::${defaultCat}`] != null),
            )
            .map(Number)
            .filter((n) => !isNaN(n))
            .sort((a, b) => b - a);
          yearDefaults[code] = availYears[0] ?? 0;
        }
        setInstCategories(catDefaults);
        setInstYears(yearDefaults);

        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes.join(",")]);

  const updateInstCategory = useCallback((code: string, cat: string) => {
    setInstCategories(prev => ({ ...prev, [code]: cat }));
    const availYears = Object.keys(data[code]?.scoresByYear ?? {})
      .filter(k => !k.includes("::") &&
        (!cat || data[code]?.scoresByYear[`${k}::${cat}`] != null))
      .map(Number)
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);
    // Set to first available year, or -1 to signal "no data for this category"
    setInstYears(prev => ({ ...prev, [code]: availYears[0] ?? -1 }));
  }, [data]);

  const updateInstYear = useCallback((code: string, yr: number) => {
    setInstYears((prev) => ({ ...prev, [code]: yr }));
  }, []);

  // Years available for a given institute + category
  const getAvailYears = useCallback(
    (code: string, cat: string): number[] => {
      return Object.keys(data[code]?.scoresByYear ?? {})
        .filter(
          (k) =>
            !k.includes("::") &&
            (!cat || data[code].scoresByYear[`${k}::${cat}`] != null),
        )
        .map(Number)
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a);
    },
    [data],
  );

  // Numeric years only
  // All years union (for charts that need the full range)
  const allYears = Array.from(
    new Set(
      codes.flatMap((c) =>
        Object.keys(data[c]?.scoresByYear ?? {})
          .filter((k) => !k.includes("::"))
          .map(Number)
          .filter((n) => !isNaN(n)),
      ),
    ),
  ).sort((a, b) => b - a);

  const loadedCodes = codes.filter((c) => !!data[c]);

  // Score row per-institute using their own category
  // Score row per-institute using their own category AND their own year
  const scoreRow = useCallback(
    (key: string) =>
      loadedCodes.map((c) => {
        const row = resolveRow(
          data[c],
          instYears[c] ?? 0,
          instCategories[c] ?? "",
        );
        return toNum(row?.[key]);
      }),
    [loadedCodes, data, instYears, instCategories],
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>
          Loading comparison…
        </p>
      </div>
    );
  }

  const activeSecDef =
    SECTION_TABS.find((t) => t.id === activeSecTab) ?? SECTION_TABS[0];

  // Summary label for section headers
  const catSummary = loadedCodes
    .map((c) => instCategories[c])
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .join(" vs ");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 100px" }}>
      {/* ── Sticky institute header ── */}
      <div
        style={{
          position: "sticky",
          top: 52,
          zIndex: 40,
          background: WHITE,
          borderBottom: `2px solid ${BORDER}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `160px repeat(${loadedCodes.length}, 1fr)`,
          }}
        >
          {/* Corner cell — year selector */}
          {/* Corner cell — static label */}
          <div
            style={{
              padding: "14px",
              borderRight: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: CRIMSON,
              }}
            >
              Comparison
            </p>
          </div>

          {/* Institute columns — each with its own category selector */}
          {loadedCodes.map((code, i) => {
            const p = data[code];
            const row = resolveRow(
              p,
              instYears[code] ?? 0,
              instCategories[code] ?? "",
            );
            const score = toNum(row?.img_total);

            return (
              <div
                key={code}
                style={{
                  padding: "12px 14px",
                  borderRight:
                    i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
                  borderTop: `3px solid ${INST_COLORS[i]}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: BODY,
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        color: INK900,
                        lineHeight: 1.3,
                        marginBottom: 2,
                      }}
                    >
                      {p?.institute_name ?? code}
                    </p>
                    <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, marginBottom: 2 }}>
                      {(row?.institute_code as string | undefined) ?? code}
                    </p>

                    {/* ── Per-institute year selector ── */}
                    {(() => {
                      const availYears = getAvailYears(code, instCategories[code] ?? "");
                      const activeYr = instYears[code];
                      if (availYears.length === 0) return (
                        <p style={{
                          fontFamily: MONO, fontSize: "0.6rem",
                          color: INK300, marginTop: 6,
                          fontStyle: "italic",
                        }}>
                          No data available for this category
                        </p>
                      );
                      return (
                        <div style={{ marginTop: 6, marginBottom: 2 }}>
                          <p
                            style={{
                              fontFamily: MONO,
                              fontSize: "0.55rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.09em",
                              color: INK300,
                              marginBottom: 4,
                            }}
                          >
                            Year
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            {availYears.map((y) => (
                              <button
                                key={y}
                                onClick={() => updateInstYear(code, y)}
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.58rem",
                                  padding: "2px 7px",
                                  border: `1px solid ${activeYr === y ? INST_COLORS[i] : BORDER}`,
                                  background:
                                    activeYr === y
                                      ? INST_COLORS[i]
                                      : "transparent",
                                  color: activeYr === y ? WHITE : INK500,
                                  cursor: "pointer",
                                  transition: "all 0.12s",
                                }}
                              >
                                {y}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Per-institute category selector ── */}
                    {p && (
                      <InstCategorySelector
                        profile={p}
                        activeCategory={instCategories[code] ?? ""}
                        onChange={(cat) => updateInstCategory(code, cat)}
                        color={INST_COLORS[i]}
                      />
                    )}
                  </div>

                  {/* Score + remove */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {score != null && (
                      <p
                        style={{
                          fontFamily: SERIF,
                          fontStyle: "italic",
                          fontSize: "1.5rem",
                          color: INST_COLORS[i],
                          lineHeight: 1,
                        }}
                      >
                        {score.toFixed(2)}
                      </p>
                    )}
                    <button
                      onClick={() => onRemove(code)}
                      style={{
                        fontFamily: MONO,
                        fontSize: "0.58rem",
                        color: INK300,
                        background: "none",
                        border: `1px solid ${BORDER}`,
                        padding: "2px 6px",
                        cursor: "pointer",
                        marginTop: 4,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ 1. NIRF SCORE CHART ═══════════════════ */}
      <SectionHeader>
        NIRF Score Trends{catSummary ? ` — ${catSummary}` : ""}
      </SectionHeader>
      <NIRFScoreChart
        profiles={data}
        codes={loadedCodes}
        years={allYears}
        instCategories={instCategories}
      />
      {loadedCodes.some(c => instYears[c]) && (
        <ScoreRadar
          profiles={data} codes={loadedCodes}
          instYears={instYears} instCategories={instCategories}
        />
      )}

      {/* ═══════════════════ 2. SCORE BREAKDOWN TABLE ═══════════════════ */}
      <SectionHeader>
        NIRF Score Breakdown ·{" "}
        {loadedCodes
          .map((c) => instYears[c])
          .filter(Boolean)
          .join(" vs ") || "Latest Year"}
      </SectionHeader>
      <TableColHeader
        codes={loadedCodes}
        profiles={data}
        instCategories={instCategories}
      />
      {(() => {
        const vals = scoreRow("img_total");
        return (
          <MetricRow
            label="NIRF Total Score"
            values={vals}
            bestI={bestIdx(vals)}
            subLabel="/ 100"
          />
        );
      })()}
      {ALL_SCORE_PARAMS.map((p) => {
        const vals = scoreRow(p.key);
        if (vals.every((v) => v == null)) return null;
        const tvs = scoreRow(p.key.replace("_score", "_total"));
        const maxT = tvs.find((v) => v != null);
        return (
          <MetricRow
            key={p.key}
            label={p.label}
            values={vals}
            bestI={bestIdx(vals)}
            subLabel={maxT ? `/ ${maxT.toFixed(0)}` : undefined}
          />
        );
      })}

      {/* ═══════════════════ 3. SECTION CHARTS ═══════════════════ */}
      <SectionHeader>Section-wise Comparison</SectionHeader>

      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: `2px solid ${BORDER}`,
          background: WHITE,
        }}
      >
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSecTab(tab.id)}
            style={{
              fontFamily: BODY,
              fontWeight: activeSecTab === tab.id ? 600 : 400,
              fontSize: "0.75rem",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeSecTab === tab.id
                  ? `2px solid ${CRIMSON}`
                  : "2px solid transparent",
              marginBottom: "-2px",
              color: activeSecTab === tab.id ? CRIMSON : INK300,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.12s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SectionChart
        key={`${activeSecTab}-${JSON.stringify(instCategories)}`}
        profiles={data}
        codes={loadedCodes}
        sectionKw={activeSecDef.kw}
        excludeKw={activeSecDef.excludeKw}
        isAmt={activeSecDef.isAmt}
        useRankingYear={activeSecDef.useRankingYear}
        instCategories={instCategories}
      />

      {/* ═══════════════════ 4. KEY METRICS TABLE ═══════════════════ */}
      <SectionHeader>
        Key Metrics ·{" "}
        {loadedCodes
          .map((c) => instYears[c])
          .filter(Boolean)
          .join(" vs ") || "Latest Year"}
      </SectionHeader>
      <TableColHeader
        codes={loadedCodes}
        profiles={data}
        instCategories={instCategories}
      />
      {[
        {
          key: "pdf_total_intake",
          label: "Total Intake",
          fmt: fmtN,
          higher: false,
        },
        {
          key: "pdf_placement_placed",
          label: "Students Placed",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_placement_higher",
          label: "Higher Studies",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_median_salary",
          label: "Median Salary",
          fmt: fmtSal,
          higher: true,
        },
        {
          key: "pdf_phd_ft_total",
          label: "PhD Students — Full Time",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_phd_pt_total",
          label: "PhD Students — Part Time",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_phd_ft_graduated",
          label: "PhD Graduated FT (3yr)",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_phd_pt_graduated",
          label: "PhD Graduated PT (3yr)",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_sponsored_projects",
          label: "Sponsored Projects (3yr)",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_sponsored_amount",
          label: "Sponsored Amount (3yr)",
          fmt: fmtAmt,
          higher: true,
        },
        {
          key: "pdf_consultancy_projects",
          label: "Consultancy Projects (3yr)",
          fmt: fmtN,
          higher: true,
        },
        {
          key: "pdf_consultancy_amount",
          label: "Consultancy Amount (3yr)",
          fmt: fmtAmt,
          higher: true,
        },
        {
          key: "pdf_capital_expenditure",
          label: "Capital Expenditure (3yr sum)",
          fmt: fmtAmt,
          higher: true,
        },
        {
          key: "pdf_operational_expenditure",
          label: "Operational Expenditure (3yr)",
          fmt: fmtAmt,
          higher: true,
        },
      ].map((m) => {
        const vals = scoreRow(m.key);
        if (vals.every((v) => v == null)) return null;
        return (
          <MetricRow
            key={m.key}
            label={m.label}
            values={vals}
            bestI={bestIdx(vals, m.higher)}
            fmt={m.fmt}
          />
        );
      })}

      <div
        style={{
          padding: "14px 24px",
          borderTop: `1px solid ${BORDER}`,
          marginTop: 12,
        }}
      >
        <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>
          ★ Best value in row &nbsp;·&nbsp; Each institute compared under its
          own selected category &nbsp;·&nbsp; Score data from NIRF image
          scorecard &nbsp;·&nbsp; PDF aggregates are 3-year sums
        </p>
      </div>
    </div>
  );
}
