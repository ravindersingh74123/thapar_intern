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

  const load = useCallback((year: number, cat: string) => {
    setLoading(true);
    fetch(`/api/rankings?year=${year}&category=${encodeURIComponent(cat)}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        setYears(d.years ?? []);
        setCategories(d.categories ?? []);
        setYearCategoryMap(d.yearCategoryMap ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(selYear, selCat);
  }, [selYear, selCat, load]);

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
                  // Reset category to first available for this year
                  const catsForYear = yearCategoryMap[y] ?? [];
                  const firstCat = catsForYear[0] ?? "Overall";
                  setSelCat(firstCat);
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
                  onClick={() => setSelCat(cat)}
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
                <th style={{ ...TH, textAlign: "right" }}>Score</th>
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
                    {row.nirf_rank != null ? row.nirf_rank : i + 1}
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

                  {/* Score */}
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: MONO,
                      fontSize: "0.9rem",
                      color: col,
                      fontWeight: 700,
                      minWidth: 90,
                    }}
                  >
                    {row.nirf_score != null ? row.nirf_score.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan={3}
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
