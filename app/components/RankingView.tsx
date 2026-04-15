"use client";
import React, { useEffect, useState, useCallback } from "react";
import type { SearchHit } from "@/app/page";

interface RankRow {
  institute_code: string;
  institute_name: string;
  category: string;
  ranking_year: number;
  nirf_score: number | null;
  nirf_rank: number | null;
  img_ss_score: number | null;
  img_fsr_score: number | null;
  img_fqe_score: number | null;
  img_fru_score: number | null;
  img_pu_score: number | null;
  img_qp_score: number | null;
  img_ipr_score: number | null;
  img_fppp_score: number | null;
  img_gue_score: number | null;
  img_gphd_score: number | null;
  img_rd_score: number | null;
  img_wd_score: number | null;
  img_escs_score: number | null;
  img_pcs_score: number | null;
  img_pr_score: number | null;
  img_oemir_score: number | null;
}

interface Props {
  onSelectInstitute: (hit: SearchHit) => void;
}

const MONO = "'IBM Plex Mono', monospace";
const BODY = "'Plus Jakarta Sans', sans-serif";
const SERIF = "'DM Serif Display', serif";
const BORDER = "var(--border)";
const OFF_WHITE = "var(--off-white)";
const INK300 = "var(--ink-300)";
const INK500 = "var(--ink-500)";
const INK900 = "var(--ink-900)";
const WHITE = "var(--white)";

const PARAM_LABELS: Record<string, string> = {
  img_ss_score: "SS",
  img_fsr_score: "FSR",
  img_fqe_score: "FQE",
  img_fru_score: "FRU",
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
  img_oemir_score: "OE/MIR",
  img_pra_score: "PRA",
  img_gph_score: "GPH",
  img_gqe_score: "GQE",
  img_je_score: "JE",
  img_ie_score: "IE",
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
  img_jex_score: "JEX",
  img_jx_score: "JX",
  img_premp_score: "PREMP",
  img_gphe_score: "GPHE",
  img_ms_score: "MS",
  img_gss_score: "GSS",
  img_col1_score: "COL1",
  img_oe_score: "OE",
  img_col5_score: "COL5",
  img_col7_score: "COL7",
};

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
  Dental: "#b5651d",
  Innovation: "#2e6da4",
};
const catColor = (cat: string) => CAT_COLORS[cat] ?? "#6b6860";

export default function RankingView({ onSelectInstitute }: Props) {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selYear, setSelYear] = useState<number>(2025);
  const [selCat, setSelCat] = useState<string>("Overall");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearCategoryMap, setYearCategoryMap] = useState<
    Record<number, string[]>
  >({});
  const [sortBy, setSortBy] = useState<string>("nirf_rank");
  const [availableParams, setAvailableParams] = useState<string[]>([]);

  const load = useCallback((year: number, cat: string, sort: string) => {
    setLoading(true);
    fetch(
      `/api/rankings?year=${year}&category=${encodeURIComponent(cat)}&sortBy=${sort}`,
    )
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        setYears(d.years ?? []);
        setCategories(d.categories ?? []);
        setYearCategoryMap(d.yearCategoryMap ?? {});
        setLoading(false);
        setAvailableParams(d.availableParams ?? []);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(selYear, selCat, sortBy);
  }, [selYear, selCat, sortBy, load]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.institute_name.toLowerCase().includes(search.toLowerCase()) ||
      r.institute_code.toLowerCase().includes(search.toLowerCase()),
  );

  const col = catColor(selCat);

  const handleRowClick = (row: RankRow) => {
    onSelectInstitute({
      institute_code: row.institute_code,
      institute_name: row.institute_name,
      category: row.category,
      best_year: row.ranking_year,
      img_total: row.nirf_score,
    });
  };

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 64px" }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
            color: INK900,
            marginBottom: 4,
          }}
        >
          India Rankings
        </h1>
        <p style={{ fontFamily: MONO, fontSize: "0.7rem", color: INK300 }}>
          {loading
            ? "Loading…"
            : `${filtered.length} institutes · ${selYear} · ${selCat}`}
        </p>
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          background: WHITE,
          border: `1px solid ${BORDER}`,
          boxShadow: "var(--shadow-sm)",
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Year buttons */}
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              marginBottom: 8,
            }}
          >
            Year
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setSelYear(y);
                  const catsForYear = yearCategoryMap[y] ?? [];
                  const firstCat = catsForYear[0] ?? "Overall";
                  setSelCat(firstCat);
                  setSortBy("nirf_rank");
                }}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.68rem",
                  padding: "4px 11px",
                  background: selYear === y ? col : WHITE,
                  color: selYear === y ? "#fff" : INK500,
                  border: `1px solid ${selYear === y ? col : BORDER}`,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  fontWeight: selYear === y ? 600 : 400,
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Category buttons */}
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              marginBottom: 8,
            }}
          >
            Category
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(yearCategoryMap[selYear] ?? categories).map((cat) => {
              const isActive = cat === selCat;
              const c = catColor(cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelCat(cat);
                    setSortBy("nirf_rank");
                  }}
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.68rem",
                    padding: "4px 12px",
                    background: isActive ? c : WHITE,
                    color: isActive ? "#fff" : c,
                    border: `1px solid ${c}`,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort by parameter */}
        {/* Sort by parameter — only show params with data */}
        {/* <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              marginBottom: 8,
            }}
          >
            Sort By
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[
              { key: "nirf_rank", label: "Overall Rank" },
              ...availableParams.map((p) => ({
                key: p,
                label:
                  PARAM_LABELS[p] ??
                  p.replace("img_", "").replace("_score", "").toUpperCase(),
              })),
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setSortBy(p.key)}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.65rem",
                  padding: "3px 10px",
                  background: sortBy === p.key ? col : WHITE,
                  color: sortBy === p.key ? "#fff" : INK500,
                  border: `1px solid ${sortBy === p.key ? col : BORDER}`,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  fontWeight: sortBy === p.key ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Parameter column selector */}
        {availableParams.length > 0 && (
          <div>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "0.58rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: INK300,
                marginBottom: 8,
              }}
            >
              Add Parameter Column
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <button
                onClick={() => setSortBy("nirf_rank")}
                style={{
                  fontFamily: MONO,
                  fontSize: "0.65rem",
                  padding: "3px 10px",
                  background: sortBy === "nirf_rank" ? col : WHITE,
                  color: sortBy === "nirf_rank" ? "#fff" : INK500,
                  border: `1px solid ${sortBy === "nirf_rank" ? col : BORDER}`,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                None
              </button>
              {availableParams.map((p) => (
                <button
                  key={p}
                  onClick={() => setSortBy(p)}
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.65rem",
                    padding: "3px 10px",
                    background: sortBy === p ? col : WHITE,
                    color: sortBy === p ? "#fff" : INK500,
                    border: `1px solid ${sortBy === p ? col : BORDER}`,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    fontWeight: sortBy === p ? 600 : 400,
                  }}
                >
                  {PARAM_LABELS[p] ??
                    p.replace("img_", "").replace("_score", "").toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "0.58rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: INK300,
              marginBottom: 8,
            }}
          >
            Filter
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or code…"
            style={{
              fontFamily: MONO,
              fontSize: "0.72rem",
              border: `1px solid ${BORDER}`,
              padding: "6px 12px",
              outline: "none",
              background: WHITE,
              color: INK900,
              width: 280,
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <p
          style={{
            fontFamily: MONO,
            fontSize: "0.8rem",
            color: INK300,
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          Loading rankings…
        </p>
      ) : (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            boxShadow: "var(--shadow-sm)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${BORDER}`,
                  background: OFF_WHITE,
                }}
              >
                <th style={TH}>Rank</th>
                <th style={TH}>Institute</th>
                {/* Score — click to sort by overall score */}
                <th
                  onClick={() => setSortBy("nirf_rank")}
                  style={{
                    ...TH,
                    textAlign: "right",
                    cursor: "pointer",
                    color: sortBy === "nirf_rank" ? col : "var(--ink-400)",
                    userSelect: "none",
                    minWidth: 90,
                  }}
                >
                  Score {sortBy === "nirf_rank" ? "▼" : "↕"}
                </th>
                {/* Parameter column — always visible when selected, click header to sort by it */}
                {sortBy !== "nirf_rank" && (
                  <th
                    style={{
                      ...TH,
                      textAlign: "right",
                      color: col,
                      minWidth: 80,
                    }}
                  >
                    {PARAM_LABELS[sortBy] ??
                      sortBy
                        .replace("img_", "")
                        .replace("_score", "")
                        .toUpperCase()}{" "}
                    ▼
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={`${row.institute_code}-${i}`}
                  onClick={() => handleRowClick(row)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: i % 2 ? OFF_WHITE : WHITE,
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = `${col}12`)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 ? "var(--off-white)" : "var(--white)")
                  }
                >
                  {/* Rank */}
                  {/* Rank — always shows position based on current sort */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: MONO,
                      fontSize: "1rem",
                      color: col,
                      fontWeight: 700,
                      minWidth: 70,
                      textAlign: "center",
                    }}
                  >
                    {i + 1}
                  </td>

                  {/* Institute */}
                  <td style={{ padding: "12px 16px", minWidth: 280 }}>
                    <p
                      style={{
                        fontFamily: BODY,
                        fontSize: "0.85rem",
                        color: INK900,
                        fontWeight: 500,
                        marginBottom: 3,
                      }}
                    >
                      {row.institute_name}
                    </p>
                    <p
                      style={{
                        fontFamily: MONO,
                        fontSize: "0.62rem",
                        color: INK300,
                      }}
                    >
                      {row.institute_code}
                    </p>
                  </td>

                  {/* Score — always shown */}
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: MONO,
                      fontSize: "0.9rem",
                      color: sortBy === "nirf_rank" ? col : "var(--ink-500)",
                      fontWeight: sortBy === "nirf_rank" ? 700 : 400,
                      minWidth: 90,
                    }}
                  >
                    {row.nirf_score != null ? row.nirf_score.toFixed(2) : "—"}
                  </td>
                  {/* Parameter column — sorted, shown in accent color */}
                  {sortBy !== "nirf_rank" && (
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontFamily: MONO,
                        fontSize: "0.9rem",
                        color: col,
                        fontWeight: 700,
                        minWidth: 80,
                      }}
                    >
                      {(row as any)[sortBy] != null
                        ? Number((row as any)[sortBy]).toFixed(2)
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan={sortBy !== "nirf_rank" ? 4 : 3}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      fontFamily: MONO,
                      fontSize: "0.75rem",
                      color: INK300,
                    }}
                  >
                    No institutes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TH: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.6rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--ink-400)",
  padding: "10px 16px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontWeight: 600,
};
