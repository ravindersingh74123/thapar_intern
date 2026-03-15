"use client";
/**
 * components/InstituteDrawer.tsx
 *
 * Slide-in right panel showing full institute profile:
 * score history, raw section data, score breakdown.
 */

import { useEffect, useState } from "react";
import type { InstituteProfileResponse } from "@/types/nirf";
import { SCORE_LABELS } from "@/types/nirf";

interface Props {
  code:     string | null;
  category: string;
  onClose:  () => void;
}

export default function InstituteDrawer({ code, category, onClose }: Props) {
  const [profile, setProfile] = useState<InstituteProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    if (!code) { setProfile(null); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);

    fetch(`/api/institute/${encodeURIComponent(code)}?${params}`)
      .then((r) => r.json())
      .then((d: InstituteProfileResponse) => {
        setProfile(d);
        const years = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
        setActiveYear(years[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code, category]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const open = !!code;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   "fixed",
          inset:      0,
          background: "rgba(5, 8, 15, 0.7)",
          zIndex:     90,
          opacity:    open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position:   "fixed",
        top:        0,
        right:      0,
        bottom:     0,
        width:      "min(520px, 95vw)",
        background: "var(--navy-900)",
        borderLeft: "1px solid var(--navy-700)",
        zIndex:     100,
        overflowY:  "auto",
        transform:  open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s var(--ease-out)",
        display:    "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding:      "20px 24px 16px",
          borderBottom: "1px solid var(--navy-700)",
          position:     "sticky",
          top:          0,
          background:   "var(--navy-900)",
          zIndex:       10,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              {loading ? (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--slate-400)" }}>
                  Loading…
                </p>
              ) : profile ? (
                <>
                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize:   "1rem",
                    color:      "var(--white)",
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}>
                    {profile.institute_name}
                  </h3>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--slate-400)" }}>
                    {profile.institute_code}
                    {profile.categories.length > 0 && (
                      <span style={{ marginLeft: 8 }}>
                        {profile.categories.join(" · ")}
                      </span>
                    )}
                  </p>
                </>
              ) : null}
            </div>
            <button
              onClick={onClose}
              style={{
                background:  "none",
                border:      "1px solid var(--navy-600)",
                color:       "var(--slate-400)",
                cursor:      "pointer",
                padding:     "4px 10px",
                fontFamily:  "var(--font-mono)",
                fontSize:    "0.7rem",
                flexShrink:  0,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {profile && (
          <div style={{ padding: "0 0 32px" }}>
            {/* Year tabs */}
            {Object.keys(profile.scoresByYear).length > 1 && (
              <div style={{
                display:    "flex",
                gap:        2,
                padding:    "12px 24px",
                overflowX:  "auto",
                borderBottom: "1px solid var(--navy-800)",
              }}>
                {Object.keys(profile.scoresByYear)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map((y) => (
                    <button
                      key={y}
                      onClick={() => setActiveYear(y)}
                      style={{
                        fontFamily:  "var(--font-mono)",
                        fontSize:    "0.7rem",
                        padding:     "4px 10px",
                        background:  activeYear === y ? "var(--amber-glow)" : "transparent",
                        color:       activeYear === y ? "var(--amber)" : "var(--slate-400)",
                        border:      `1px solid ${activeYear === y ? "var(--amber-dim)" : "var(--navy-700)"}`,
                        cursor:      "pointer",
                        flexShrink:  0,
                        transition:  "all 0.15s",
                      }}
                    >
                      {y}
                    </button>
                  ))}
              </div>
            )}

            {/* Score breakdown for active year */}
            {activeYear && profile.scoresByYear[activeYear] && (
              <div style={{ padding: "20px 24px" }}>
                <p style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.65rem",
                  color:         "var(--slate-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom:  12,
                }}>
                  Score Breakdown · {activeYear}
                </p>

                {/* Total score — big display */}
                {profile.scoresByYear[activeYear].img_total != null && (
                  <div style={{
                    display:      "flex",
                    alignItems:   "baseline",
                    gap:          6,
                    marginBottom: 20,
                  }}>
                    <span style={{
                      fontFamily:  "var(--font-display)",
                      fontWeight:  800,
                      fontSize:    "3rem",
                      color:       "var(--amber)",
                      lineHeight:  1,
                    }}>
                      {(profile.scoresByYear[activeYear].img_total as number).toFixed(2)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--slate-400)" }}>
                      / 100
                    </span>
                  </div>
                )}

                {/* Score sub-breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(SCORE_LABELS)
                    .filter(([k]) => k !== "img_total" && k.startsWith("img_"))
                    .map(([key, label]) => {
                      const row = profile.scoresByYear[activeYear] as Record<string, unknown>;
                      const val = row[key] as number | null | undefined;
                      if (val == null) return null;

                      const totalKey = key.replace("_score", "_total");
                      const total    = (row[totalKey] as number | null) ?? 100;
                      const pct      = total > 0 ? Math.min((val / total) * 100, 100) : 0;

                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--slate-400)" }}>
                              {label}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--slate-300)" }}>
                              {val.toFixed(2)} / {total.toFixed(0)}
                            </span>
                          </div>
                          <div style={{ height: 4, background: "var(--navy-700)", overflow: "hidden" }}>
                            <div style={{
                              height:     "100%",
                              width:      `${pct}%`,
                              background: "var(--teal)",
                              transition: "width 0.6s var(--ease-out)",
                            }} />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* PDF aggregates */}
                <div style={{ marginTop: 24 }}>
                  <p style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.65rem",
                    color:         "var(--slate-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom:  12,
                  }}>
                    Institutional Data
                  </p>
                  <div style={{
                    display:             "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap:                 "8px 16px",
                  }}>
                    {Object.entries(SCORE_LABELS)
                      .filter(([k]) => k.startsWith("pdf_"))
                      .map(([key, label]) => {
                        const row = profile.scoresByYear[activeYear] as Record<string, unknown>;
                        const val = row[key] as number | null | undefined;
                        if (val == null) return null;
                        const display = key === "pdf_median_salary"
                          ? `₹${(val / 100000).toFixed(1)}L`
                          : val.toLocaleString();
                        return (
                          <div key={key} style={{
                            background: "var(--navy-800)",
                            padding:    "10px 12px",
                          }}>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--slate-400)", marginBottom: 4 }}>
                              {label}
                            </p>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--teal)", fontWeight: 500 }}>
                              {display}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Raw PDF sections */}
            {profile.rawSections.length > 0 && (
              <div style={{ padding: "0 24px" }}>
                <p style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.65rem",
                  color:         "var(--slate-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom:  12,
                }}>
                  Raw Data Sections
                </p>
                {profile.rawSections.slice(0, 6).map((sec) => (
                  <details key={sec.section} style={{ marginBottom: 6 }}>
                    <summary style={{
                      fontFamily:  "var(--font-body)",
                      fontSize:    "0.75rem",
                      color:       "var(--slate-300)",
                      padding:     "8px 0",
                      borderBottom:"1px solid var(--navy-800)",
                      cursor:      "pointer",
                      userSelect:  "none",
                      listStyle:   "none",
                    }}>
                      <span style={{ color: "var(--amber)", marginRight: 6 }}>▸</span>
                      {sec.section}
                      <span style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", marginLeft: 8 }}>
                        ({sec.metrics.length} rows)
                      </span>
                    </summary>
                    <div style={{ paddingLeft: 12, paddingTop: 8 }}>
                      {sec.metrics.slice(0, 20).map((m, i) => (
                        <div key={i} style={{
                          display:      "flex",
                          justifyContent:"space-between",
                          gap:          12,
                          padding:      "3px 0",
                          borderBottom: "1px solid var(--navy-800)",
                          fontSize:     "0.7rem",
                        }}>
                          <span style={{ color: "var(--slate-400)", flex: 1 }}>
                            {m.metric}
                            {m.year && <span style={{ color: "var(--navy-500)", marginLeft: 4 }}>({m.year})</span>}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "var(--slate-300)", flexShrink: 0 }}>
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}