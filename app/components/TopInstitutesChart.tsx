"use client";
/**
 * components/TopInstitutesChart.tsx
 *
 * Horizontal bar chart of top N institutes by NIRF total score.
 * Bars animate in on mount — ticker-tape fill effect.
 * Clicking a bar fires onSelectInstitute(code).
 */

import { useEffect, useRef, useState } from "react";
import type { InstituteScore } from "@/types/nirf";

interface Props {
  year:                number | null;
  category:            string;
  limit?:              number;
  onSelectInstitute?:  (code: string, name: string) => void;
}

const MAX_SCORE = 100;

export default function TopInstitutesChart({
  year,
  category,
  limit = 15,
  onSelectInstitute,
}: Props) {
  const [rows, setRows]       = useState<InstituteScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!year || !category) { setRows([]); return; }

    setLoading(true);
    setAnimated(false);

    fetch(`/api/top-institutes?year=${year}&category=${encodeURIComponent(category)}&limit=${limit}`)
      .then((r) => r.json())
      .then((data: InstituteScore[]) => {
        setRows(data);
        setLoading(false);
        // Trigger bar animation after paint
        timerRef.current = setTimeout(() => setAnimated(true), 60);
      })
      .catch(() => setLoading(false));

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [year, category, limit]);

  const topScore = rows[0]?.img_total ?? MAX_SCORE;

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <h2 style={{
          fontFamily:   "var(--font-display)",
          fontWeight:   700,
          fontSize:     "1rem",
          color:        "var(--white)",
          letterSpacing:"0.01em",
        }}>
          Top {limit} Institutes
        </h2>
        {year && category && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)" }}>
            {category} · {year}
          </span>
        )}
      </div>

      {/* Empty / loading states */}
      {(!year || !category) && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Select a year and category to view rankings.
        </p>
      )}
      {loading && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Loading…
        </p>
      )}

      {/* Bar chart */}
      {!loading && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row, i) => {
            const score   = row.img_total ?? 0;
            const pct     = topScore > 0 ? (score / topScore) * 100 : 0;
            const barPct  = animated ? `${pct}%` : "0%";
            const shortName = row.institute_name.length > 46
              ? row.institute_name.slice(0, 44) + "…"
              : row.institute_name;

            return (
              <div
                key={row.institute_code}
                onClick={() => onSelectInstitute?.(row.institute_code, row.institute_name)}
                style={{
                  display:    "grid",
                  gridTemplateColumns: "22px 1fr 60px",
                  alignItems: "center",
                  gap:        8,
                  cursor:     onSelectInstitute ? "pointer" : "default",
                  padding:    "4px 0",
                  animation:  `fadeUp 0.4s var(--ease-out) ${i * 30}ms both`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "var(--navy-800)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {/* Rank number */}
                <span style={{
                  fontFamily:  "var(--font-mono)",
                  fontSize:    "0.65rem",
                  color:       i < 3 ? "var(--amber)" : "var(--navy-500)",
                  textAlign:   "right",
                  lineHeight:  1,
                }}>
                  {i + 1}
                </span>

                {/* Bar track + label */}
                <div>
                  <div style={{
                    position:   "relative",
                    height:     20,
                    background: "var(--navy-700)",
                    overflow:   "hidden",
                  }}>
                    {/* Fill bar */}
                    <div style={{
                      position:   "absolute",
                      left:       0,
                      top:        0,
                      height:     "100%",
                      width:      barPct,
                      background: i === 0
                        ? "var(--amber)"
                        : i < 3
                        ? `linear-gradient(90deg, var(--amber-dim), var(--teal))`
                        : "var(--navy-500)",
                      transition: `width 0.8s var(--ease-out) ${i * 40}ms`,
                    }} />
                    {/* Institute name */}
                    <span style={{
                      position:    "absolute",
                      left:        8,
                      top:         "50%",
                      transform:   "translateY(-50%)",
                      fontFamily:  "var(--font-body)",
                      fontSize:    "0.72rem",
                      color:       score > topScore * 0.4 ? "var(--navy-950)" : "var(--slate-300)",
                      whiteSpace:  "nowrap",
                      letterSpacing: "0.01em",
                      mixBlendMode: score > topScore * 0.4 ? "multiply" : "normal",
                    }}>
                      {shortName}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <span style={{
                  fontFamily:  "var(--font-mono)",
                  fontSize:    "0.75rem",
                  color:       i === 0 ? "var(--amber)" : "var(--slate-300)",
                  textAlign:   "right",
                  fontWeight:  i === 0 ? 600 : 400,
                }}>
                  {score.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}