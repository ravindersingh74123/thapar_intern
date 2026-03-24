// "use client";
// /**
//  * CompareView.tsx
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Side-by-side institute comparison.
//  * Sections: NIRF Scores · Trends · Placement · Financial · PhD & Research
//  *
//  * Layout: sticky institute header columns, then section rows below.
//  * Each metric row highlights the best value in crimson.
//  */

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
// } from "recharts";
// import type { SearchHit } from "@/app/page";

// // ── Types ─────────────────────────────────────────────────────────────────────

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
//   category: string;
// }

// interface InstituteProfile {
//   institute_code: string;
//   institute_name: string;
//   categories: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   rawSections: { section: string; metrics: RawMetric[] }[];
// }

// type CompareData = Record<string, InstituteProfile>;

// interface Props {
//   institutes: SearchHit[];          // 2–4 selected institutes
//   onRemove: (code: string) => void; // remove one from comparison
//   onClose: () => void;
// }

// // ── Palette — one colour per institute slot ───────────────────────────────────

// const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: unknown) => BAD.has(String(v ?? "").trim().toLowerCase());
// const toNum = (v: unknown) => {
//   const n = Number(String(v ?? "").replace(/,/g, ""));
//   return isNaN(n) ? null : n;
// };

// function fmtScore(v: unknown) {
//   const n = toNum(v);
//   return n != null ? n.toFixed(2) : "—";
// }
// function fmtN(v: unknown) {
//   const n = toNum(v);
//   return n != null ? n.toLocaleString("en-IN") : "—";
// }
// function fmtAmt(v: unknown) {
//   const n = toNum(v);
//   if (n == null) return "—";
//   if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
//   if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtSal(v: unknown) {
//   const n = toNum(v);
//   return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—";
// }

// function bestIdx(values: (number | null)[], higher = true): number {
//   let best: number | null = null;
//   let idx = -1;
//   values.forEach((v, i) => {
//     if (v == null) return;
//     if (best == null || (higher ? v > best : v < best)) {
//       best = v;
//       idx = i;
//     }
//   });
//   return idx;
// }

// // ── Shared styles ─────────────────────────────────────────────────────────────

// const MONO = "'IBM Plex Mono', monospace";
// const BODY = "'Plus Jakarta Sans', sans-serif";
// const SERIF = "'DM Serif Display', serif";
// const BORDER = "#e4e2dd";
// const OFF_WHITE = "#f7f6f3";
// const CRIMSON = "#c0392b";
// const CRIMSON_PALE = "#fdf1f0";
// const INK900 = "#1a1916";
// const INK500 = "#6b6860";
// const INK300 = "#a8a49c";

// // ── Score parameter definitions ───────────────────────────────────────────────

// const SCORE_PARAMS = [
//   { key: "img_ss_score",      label: "Student Strength",        short: "SS"   },
//   { key: "img_fsr_score",     label: "Faculty-Student Ratio",   short: "FSR"  },
//   { key: "img_fqe_score",     label: "Faculty Qualification",   short: "FQE"  },
//   { key: "img_fru_score",     label: "Financial Resources",     short: "FRU"  },
//   { key: "img_oe_mir_score",  label: "Outreach & Inclusivity",  short: "OE"   },
//   { key: "img_pu_score",      label: "Publications",            short: "PU"   },
//   { key: "img_qp_score",      label: "Quality Publications",    short: "QP"   },
//   { key: "img_ipr_score",     label: "IPR & Patents",           short: "IPR"  },
//   { key: "img_fppp_score",    label: "Projects & Practice",     short: "FP"   },
//   { key: "img_gue_score",     label: "Graduate UE",             short: "GUE"  },
//   { key: "img_gphd_score",    label: "PhD Graduates",           short: "PhD"  },
//   { key: "img_pr_score",      label: "Perception",              short: "PR"   },
// ];

// const PDF_METRICS = [
//   { key: "pdf_placement_placed",        label: "Students Placed",          fmt: fmtN,   higher: true  },
//   { key: "pdf_median_salary",           label: "Median Salary",            fmt: fmtSal, higher: true  },
//   { key: "pdf_phd_ft_graduated",        label: "PhD Graduated (FT)",       fmt: fmtN,   higher: true  },
//   { key: "pdf_phd_pt_graduated",        label: "PhD Graduated (PT)",       fmt: fmtN,   higher: true  },
//   { key: "pdf_sponsored_projects",      label: "Sponsored Projects",       fmt: fmtN,   higher: true  },
//   { key: "pdf_sponsored_amount",        label: "Sponsored Amount",         fmt: fmtAmt, higher: true  },
//   { key: "pdf_consultancy_projects",    label: "Consultancy Projects",     fmt: fmtN,   higher: true  },
//   { key: "pdf_capital_expenditure",     label: "Capital Expenditure",      fmt: fmtAmt, higher: true  },
//   { key: "pdf_operational_expenditure", label: "Operational Expenditure",  fmt: fmtAmt, higher: true  },
// ];

// // ── Sub-components ────────────────────────────────────────────────────────────

// function SectionHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <div style={{
//       padding: "14px 24px 10px",
//       borderBottom: `1px solid ${BORDER}`,
//       borderTop: `3px solid ${CRIMSON}`,
//       background: CRIMSON_PALE,
//       marginTop: 24,
//     }}>
//       <p style={{
//         fontFamily: MONO,
//         fontSize: "0.65rem",
//         textTransform: "uppercase",
//         letterSpacing: "0.1em",
//         color: CRIMSON,
//         fontWeight: 600,
//       }}>
//         {children}
//       </p>
//     </div>
//   );
// }

// function MetricRow({
//   label, values, bestI, fmt,
//   subLabel,
// }: {
//   label: string;
//   values: (number | null)[];
//   bestI: number;
//   fmt?: (v: unknown) => string;
//   subLabel?: string;
// }) {
//   const fmtFn = fmt ?? fmtScore;
//   return (
//     <div style={{
//       display: "grid",
//       gridTemplateColumns: `200px repeat(${values.length}, 1fr)`,
//       borderBottom: `1px solid ${BORDER}`,
//       minHeight: 42,
//     }}>
//       <div style={{
//         padding: "10px 16px",
//         background: OFF_WHITE,
//         borderRight: `1px solid ${BORDER}`,
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//       }}>
//         <span style={{ fontFamily: BODY, fontSize: "0.78rem", color: INK900 }}>{label}</span>
//         {subLabel && (
//           <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>{subLabel}</span>
//         )}
//       </div>
//       {values.map((v, i) => {
//         const isBest = i === bestI && v != null;
//         return (
//           <div
//             key={i}
//             style={{
//               padding: "10px 16px",
//               borderRight: i < values.length - 1 ? `1px solid ${BORDER}` : "none",
//               background: isBest ? CRIMSON_PALE : "transparent",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <span style={{
//               fontFamily: MONO,
//               fontSize: "0.8rem",
//               fontWeight: isBest ? 700 : 400,
//               color: isBest ? CRIMSON : (v != null ? INK900 : INK300),
//             }}>
//               {v != null ? fmtFn(v) : "—"}
//             </span>
//             {isBest && v != null && (
//               <span style={{
//                 marginLeft: 4,
//                 fontSize: "0.5rem",
//                 color: CRIMSON,
//                 verticalAlign: "super",
//               }}>★</span>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Radar chart for NIRF scores ───────────────────────────────────────────────

// function ScoreRadar({
//   profiles, codes, year,
// }: {
//   profiles: CompareData;
//   codes: string[];
//   year: number;
// }) {
//   const data = SCORE_PARAMS.map(p => {
//     const pt: Record<string, unknown> = { param: p.short };
//     for (const code of codes) {
//       const row = profiles[code]?.scoresByYear[year];
//       if (row) {
//         const v = toNum(row[p.key]);
//         const t = toNum(row[p.key.replace("_score", "_total")]) ?? 100;
//         pt[code] = v != null && t > 0 ? +((v / t) * 100).toFixed(1) : null;
//       }
//     }
//     return pt;
//   });

//   return (
//     <ResponsiveContainer width="100%" height={320}>
//       <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
//         <PolarGrid stroke={BORDER} />
//         <PolarAngleAxis
//           dataKey="param"
//           tick={{ fontFamily: MONO, fontSize: 10, fill: INK500 }}
//         />
//         {codes.map((code, i) => (
//           <Radar
//             key={code}
//             name={profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? code}
//             dataKey={code}
//             stroke={INST_COLORS[i]}
//             fill={INST_COLORS[i]}
//             fillOpacity={0.08}
//             strokeWidth={2}
//           />
//         ))}
//         <Legend
//           wrapperStyle={{ fontFamily: MONO, fontSize: "0.65rem" }}
//           formatter={(value, entry) => {
//             const idx = codes.indexOf(String(entry.dataKey));
//             return (
//               <span style={{ color: INST_COLORS[idx] }}>
//                 {profiles[String(entry.dataKey)]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? value}
//               </span>
//             );
//           }}
//         />
//       </RadarChart>
//     </ResponsiveContainer>
//   );
// }

// // ── Trend chart (multi-institute, one metric) ─────────────────────────────────

// function MultiTrendChart({
//   profiles, codes, metricKey, title, fmt,
// }: {
//   profiles: CompareData;
//   codes: string[];
//   metricKey: string;
//   title: string;
//   fmt?: (v: number) => string;
// }) {
//   // Build year → {code: value} map
//   const yearSet = new Set<number>();
//   for (const code of codes) {
//     const p = profiles[code];
//     if (!p) continue;
//     Object.keys(p.scoresByYear).forEach(y => yearSet.add(Number(y)));
//   }
//   const years = Array.from(yearSet).sort((a, b) => a - b);
//   if (years.length < 2) return null;

//   const data = years.map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       const row = profiles[code]?.scoresByYear[yr];
//       if (row) {
//         const v = toNum(row[metricKey]);
//         if (v != null) pt[code] = v;
//       }
//     }
//     return pt;
//   });

//   const hasData = codes.some(code => data.some(d => d[code] != null));
//   if (!hasData) return null;

//   return (
//     <div style={{ marginBottom: 24 }}>
//       <p style={{
//         fontFamily: MONO, fontSize: "0.62rem",
//         textTransform: "uppercase", letterSpacing: "0.08em",
//         color: INK500, marginBottom: 10,
//       }}>
//         {title}
//       </p>
//       <ResponsiveContainer width="100%" height={200}>
//         <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
//           <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//           <XAxis dataKey="year" tick={{ fontFamily: MONO, fontSize: 10, fill: INK300 }} axisLine={false} tickLine={false} />
//           <YAxis tick={{ fontFamily: MONO, fontSize: 10, fill: INK300 }} axisLine={false} tickLine={false} />
//           <Tooltip
//             contentStyle={{ fontFamily: MONO, fontSize: "0.68rem", background: "#1a1916", border: "1px solid #3d3b36", color: "#f7f6f3" }}
//             formatter={(v) => {
//               const n = typeof v === "number" ? v : Number(v);
//               return fmt ? fmt(n) : n.toFixed(2);
//             }}
//           />
//           <Legend wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem" }}
//             formatter={(_v, entry) => {
//               const idx = codes.indexOf(String(entry.dataKey));
//               return (
//                 <span style={{ color: INST_COLORS[idx] }}>
//                   {profiles[String(entry.dataKey)]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? entry.dataKey}
//                 </span>
//               );
//             }}
//           />
//           {codes.map((code, i) => (
//             <Line
//               key={code}
//               type="monotone"
//               dataKey={code}
//               stroke={INST_COLORS[i]}
//               strokeWidth={2}
//               dot={{ r: 3, fill: INST_COLORS[i], strokeWidth: 0 }}
//               activeDot={{ r: 5 }}
//               connectNulls
//             />
//           ))}
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

// // ── Raw section metric aggregation ────────────────────────────────────────────

// function getLatestSectionValue(
//   profile: InstituteProfile,
//   sectionKw: string,
//   metricKw: string,
// ): number | null {
//   const allYears = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const latestYear = allYears[0];
//   if (!latestYear) return null;

//   for (const sec of profile.rawSections) {
//     if (!sec.section.toLowerCase().includes(sectionKw.toLowerCase())) continue;
//     const metrics = sec.metrics.filter(
//       m => m.ranking_year === latestYear &&
//         m.metric.toLowerCase().includes(metricKw.toLowerCase()) &&
//         !isBAD(m.value)
//     );
//     if (!metrics.length) continue;
//     let sum = 0;
//     let count = 0;
//     for (const m of metrics) {
//       const n = toNum(m.value);
//       if (n != null) { sum += n; count++; }
//     }
//     return count > 0 ? sum : null;
//   }
//   return null;
// }

// // ── Main Component ────────────────────────────────────────────────────────────

// export default function CompareView({ institutes, onRemove, onClose }: Props) {
//   const [data, setData]       = useState<CompareData>({});
//   const [loading, setLoading] = useState(true);
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   const codes = institutes.map(i => i.institute_code);

//   useEffect(() => {
//     if (!codes.length) return;
//     setLoading(true);
//     fetch(`/api/compare?codes=${codes.join(",")}`)
//       .then(r => r.json())
//       .then((d: CompareData) => {
//         setData(d);
//         // Pick most recent year common across institutes
//         const yearSets = codes.map(c =>
//           new Set(Object.keys(d[c]?.scoresByYear ?? {}).map(Number))
//         );
//         const allYears = Array.from(yearSets[0] ?? new Set<number>())
//           .filter(y => yearSets.every(s => s.has(y)))
//           .sort((a, b) => b - a);
//         setActiveYear(allYears[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [codes.join(",")]);

//   // All years across all loaded institutes
//   const allAvailYears = Array.from(
//     new Set(
//       codes.flatMap(c => Object.keys(data[c]?.scoresByYear ?? {}).map(Number))
//     )
//   ).sort((a, b) => b - a);

//   // Score values for active year
//   const scoreRow = useCallback((key: string) => {
//     return codes.map(c => {
//       if (!activeYear || !data[c]) return null;
//       return toNum(data[c].scoresByYear[activeYear]?.[key]);
//     });
//   }, [codes, data, activeYear]);

//   if (loading) {
//     return (
//       <div style={{
//         display: "flex", alignItems: "center", justifyContent: "center",
//         height: "60vh",
//       }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>
//           Loading comparison…
//         </p>
//       </div>
//     );
//   }

//   const loadedCodes = codes.filter(c => !!data[c]);

//   return (
//     <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 80px" }}>

//       {/* ── Sticky institute header ── */}
//       <div style={{
//         position: "sticky",
//         top: 52, // below app header
//         zIndex: 40,
//         background: "var(--white)",
//         borderBottom: `2px solid ${BORDER}`,
//         boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
//       }}>
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: `200px repeat(${loadedCodes.length}, 1fr)`,
//         }}>
//           {/* Corner cell */}
//           <div style={{
//             padding: "16px 16px",
//             borderRight: `1px solid ${BORDER}`,
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "center",
//             gap: 8,
//           }}>
//             <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem", color: CRIMSON }}>
//               Comparison
//             </p>
//             {/* Year selector */}
//             {allAvailYears.length > 1 && (
//               <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
//                 {allAvailYears.slice(0, 5).map(y => (
//                   <button
//                     key={y}
//                     onClick={() => setActiveYear(y)}
//                     style={{
//                       fontFamily: MONO,
//                       fontSize: "0.6rem",
//                       padding: "2px 7px",
//                       border: `1px solid ${activeYear === y ? CRIMSON : BORDER}`,
//                       background: activeYear === y ? CRIMSON : "transparent",
//                       color: activeYear === y ? "#fff" : INK500,
//                       cursor: "pointer",
//                     }}
//                   >
//                     {y}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Institute columns */}
//           {loadedCodes.map((code, i) => {
//             const p = data[code];
//             const score = activeYear ? toNum(p?.scoresByYear[activeYear]?.img_total) : null;
//             return (
//               <div
//                 key={code}
//                 style={{
//                   padding: "14px 16px",
//                   borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
//                   borderTop: `3px solid ${INST_COLORS[i]}`,
//                 }}
//               >
//                 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <p style={{
//                       fontFamily: BODY, fontWeight: 600,
//                       fontSize: "0.82rem", color: INK900,
//                       lineHeight: 1.3, marginBottom: 3,
//                     }}>
//                       {p?.institute_name ?? code}
//                     </p>
//                     <p style={{ fontFamily: MONO, fontSize: "0.62rem", color: INK300 }}>
//                       {code}
//                     </p>
//                     {p?.categories?.length > 0 && (
//                       <span style={{
//                         display: "inline-block",
//                         marginTop: 4,
//                         fontFamily: MONO, fontSize: "0.58rem",
//                         textTransform: "uppercase", letterSpacing: "0.06em",
//                         color: INST_COLORS[i],
//                         border: `1px solid ${INST_COLORS[i]}`,
//                         padding: "1px 6px",
//                       }}>
//                         {p.categories[0]}
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ textAlign: "right", flexShrink: 0 }}>
//                     {score != null && (
//                       <p style={{
//                         fontFamily: SERIF, fontStyle: "italic",
//                         fontSize: "1.6rem", color: INST_COLORS[i],
//                         lineHeight: 1,
//                       }}>
//                         {score.toFixed(2)}
//                       </p>
//                     )}
//                     <button
//                       onClick={() => onRemove(code)}
//                       title="Remove"
//                       style={{
//                         fontFamily: MONO, fontSize: "0.6rem",
//                         color: INK300, background: "none",
//                         border: `1px solid ${BORDER}`,
//                         padding: "2px 6px", cursor: "pointer",
//                         marginTop: 4,
//                       }}
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           SECTION 1 — NIRF Score Breakdown
//       ══════════════════════════════════════════════════════════════ */}
//       <SectionHeader>NIRF Score Breakdown</SectionHeader>

//       {/* Column header row */}
//       <div style={{
//         display: "grid",
//         gridTemplateColumns: `200px repeat(${loadedCodes.length}, 1fr)`,
//         borderBottom: `2px solid ${BORDER}`,
//         background: OFF_WHITE,
//       }}>
//         <div style={{ padding: "8px 16px", borderRight: `1px solid ${BORDER}` }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>
//             Parameter
//           </span>
//         </div>
//         {loadedCodes.map((code, i) => (
//           <div key={code} style={{
//             padding: "8px 16px",
//             borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
//             textAlign: "center",
//           }}>
//             <div style={{ width: 10, height: 10, background: INST_COLORS[i], borderRadius: "50%", display: "inline-block" }} />
//           </div>
//         ))}
//       </div>

//       {/* Total score row */}
//       {(() => {
//         const vals = scoreRow("img_total");
//         const bi = bestIdx(vals);
//         return <MetricRow label="NIRF Total Score" values={vals} bestI={bi} subLabel="out of 100" />;
//       })()}

//       {/* Parameter rows */}
//       {SCORE_PARAMS.map(p => {
//         const vals = scoreRow(p.key);
//         if (vals.every(v => v == null)) return null;
//         const bi = bestIdx(vals);
//         return <MetricRow key={p.key} label={p.label} values={vals} bestI={bi} />;
//       })}

//       {/* Radar chart */}
//       {activeYear && loadedCodes.length >= 2 && (
//         <div style={{ padding: "24px 0 8px" }}>
//           <p style={{
//             fontFamily: MONO, fontSize: "0.62rem", textTransform: "uppercase",
//             letterSpacing: "0.08em", color: INK500,
//             padding: "0 24px", marginBottom: 4,
//           }}>
//             Score Profile — Radar
//           </p>
//           <ScoreRadar profiles={data} codes={loadedCodes} year={activeYear} />
//         </div>
//       )}

//       {/* ══════════════════════════════════════════════════════════════
//           SECTION 2 — Year-on-Year Trends
//       ══════════════════════════════════════════════════════════════ */}
//       <SectionHeader>Year-on-Year Trends</SectionHeader>
//       <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="img_total"
//           title="NIRF Total Score"
//           fmt={v => v.toFixed(2)}
//         />
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="img_fsr_score"
//           title="Faculty–Student Ratio Score"
//           fmt={v => v.toFixed(2)}
//         />
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="img_ss_score"
//           title="Student Strength Score"
//           fmt={v => v.toFixed(2)}
//         />
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="img_pr_score"
//           title="Perception Score"
//           fmt={v => v.toFixed(2)}
//         />
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="pdf_placement_placed"
//           title="Students Placed"
//           fmt={v => v.toLocaleString("en-IN")}
//         />
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="pdf_median_salary"
//           title="Median Salary"
//           fmt={v => `₹${(v / 1e5).toFixed(1)}L`}
//         />
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           SECTION 3 — Placement & Salary
//       ══════════════════════════════════════════════════════════════ */}
//       <SectionHeader>Placement & Salary</SectionHeader>
//       <div style={{
//         display: "grid",
//         gridTemplateColumns: `200px repeat(${loadedCodes.length}, 1fr)`,
//         borderBottom: `2px solid ${BORDER}`,
//         background: OFF_WHITE,
//       }}>
//         <div style={{ padding: "8px 16px", borderRight: `1px solid ${BORDER}` }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>
//             Metric
//           </span>
//         </div>
//         {loadedCodes.map((code, i) => (
//           <div key={code} style={{
//             padding: "8px 16px", textAlign: "center",
//             borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
//           }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INST_COLORS[i] }}>
//               {data[code]?.institute_name?.split(" ").slice(0, 2).join(" ") ?? code}
//             </span>
//           </div>
//         ))}
//       </div>

//       {[
//         { key: "pdf_placement_placed",     label: "Students Placed",     fmt: fmtN,   higher: true  },
//         { key: "pdf_placement_higher",     label: "Higher Studies",       fmt: fmtN,   higher: true  },
//         { key: "pdf_median_salary",        label: "Median Salary",        fmt: fmtSal, higher: true  },
//         { key: "pdf_total_intake",         label: "Total Intake",         fmt: fmtN,   higher: false },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return (
//           <MetricRow
//             key={m.key}
//             label={m.label}
//             values={vals}
//             bestI={bestIdx(vals, m.higher)}
//             fmt={m.fmt}
//           />
//         );
//       })}

//       {/* ══════════════════════════════════════════════════════════════
//           SECTION 4 — PhD & Research
//       ══════════════════════════════════════════════════════════════ */}
//       <SectionHeader>PhD & Research</SectionHeader>
//       <div style={{
//         display: "grid",
//         gridTemplateColumns: `200px repeat(${loadedCodes.length}, 1fr)`,
//         borderBottom: `2px solid ${BORDER}`,
//         background: OFF_WHITE,
//       }}>
//         <div style={{ padding: "8px 16px", borderRight: `1px solid ${BORDER}` }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>
//             Metric
//           </span>
//         </div>
//         {loadedCodes.map((code, i) => (
//           <div key={code} style={{
//             padding: "8px 16px", textAlign: "center",
//             borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
//           }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INST_COLORS[i] }}>
//               {data[code]?.institute_name?.split(" ").slice(0, 2).join(" ") ?? code}
//             </span>
//           </div>
//         ))}
//       </div>

//       {[
//         { key: "pdf_phd_ft_total",       label: "PhD Students (FT)",        fmt: fmtN, higher: true },
//         { key: "pdf_phd_pt_total",       label: "PhD Students (PT)",        fmt: fmtN, higher: true },
//         { key: "pdf_phd_ft_graduated",   label: "PhD Graduated (FT, 3yr)", fmt: fmtN, higher: true },
//         { key: "pdf_phd_pt_graduated",   label: "PhD Graduated (PT, 3yr)", fmt: fmtN, higher: true },
//         { key: "pdf_sponsored_projects", label: "Sponsored Projects",       fmt: fmtN, higher: true },
//         { key: "pdf_sponsored_amount",   label: "Sponsored Amount",         fmt: fmtAmt, higher: true },
//         { key: "pdf_consultancy_projects", label: "Consultancy Projects",   fmt: fmtN, higher: true },
//         { key: "pdf_consultancy_amount", label: "Consultancy Amount",       fmt: fmtAmt, higher: true },
//         { key: "pdf_edp_participants",   label: "EDP Participants",         fmt: fmtN, higher: true },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return (
//           <MetricRow
//             key={m.key}
//             label={m.label}
//             values={vals}
//             bestI={bestIdx(vals, m.higher)}
//             fmt={m.fmt}
//           />
//         );
//       })}

//       {/* ══════════════════════════════════════════════════════════════
//           SECTION 5 — Financial
//       ══════════════════════════════════════════════════════════════ */}
//       <SectionHeader>Financial Resources</SectionHeader>
//       <div style={{
//         display: "grid",
//         gridTemplateColumns: `200px repeat(${loadedCodes.length}, 1fr)`,
//         borderBottom: `2px solid ${BORDER}`,
//         background: OFF_WHITE,
//       }}>
//         <div style={{ padding: "8px 16px", borderRight: `1px solid ${BORDER}` }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>
//             Metric
//           </span>
//         </div>
//         {loadedCodes.map((code, i) => (
//           <div key={code} style={{
//             padding: "8px 16px", textAlign: "center",
//             borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none",
//           }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INST_COLORS[i] }}>
//               {data[code]?.institute_name?.split(" ").slice(0, 2).join(" ") ?? code}
//             </span>
//           </div>
//         ))}
//       </div>

//       {[
//         { key: "pdf_capital_expenditure",     label: "Capital Expenditure (3yr)",     fmt: fmtAmt, higher: true },
//         { key: "pdf_operational_expenditure", label: "Operational Expenditure (3yr)", fmt: fmtAmt, higher: true },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return (
//           <MetricRow
//             key={m.key}
//             label={m.label}
//             values={vals}
//             bestI={bestIdx(vals, m.higher)}
//             fmt={m.fmt}
//           />
//         );
//       })}

//       {/* Financial trend chart */}
//       <div style={{ padding: "20px 24px" }}>
//         <MultiTrendChart
//           profiles={data} codes={loadedCodes}
//           metricKey="pdf_capital_expenditure"
//           title="Capital Expenditure Trend"
//           fmt={v => fmtAmt(v)}
//         />
//       </div>

//       {/* ── Legend note ── */}
//       <div style={{
//         padding: "12px 24px",
//         borderTop: `1px solid ${BORDER}`,
//         marginTop: 8,
//       }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.62rem", color: INK300 }}>
//           ★ Best value in row &nbsp;·&nbsp; Score data from NIRF image scorecard &nbsp;·&nbsp;
//           PDF aggregates are 3-year sums/averages from institutional reports
//         </p>
//       </div>
//     </div>
//   );
// }























// "use client";
// /**
//  * CompareView.tsx  (v3 — full rebuild)
//  * ─────────────────────────────────────────────────────────────────────────────
//  * 1. NIRF Score chart — every score column as toggle pill, multi-line per institute
//  * 2. Section charts — tabs for every section (Intake, Placement, PhD, Students,
//  *    Research, Financial…) each with their own metric toggle pills
//  * 3. Comparison table — every metric, best value highlighted ★
//  */

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid,
//   Tooltip, Legend, ResponsiveContainer,
//   RadarChart, Radar, PolarGrid, PolarAngleAxis,
// } from "recharts";
// import type { SearchHit } from "@/app/page";

// // ── Types ─────────────────────────────────────────────────────────────────────

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
//   category: string;
// }

// interface InstituteProfile {
//   institute_code: string;
//   institute_name: string;
//   categories: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   rawSections: { section: string; metrics: RawMetric[] }[];
// }

// type CompareData = Record<string, InstituteProfile>;

// interface Props {
//   institutes: SearchHit[];
//   onRemove: (code: string) => void;
//   onClose: () => void;
// }

// // ── Palette ───────────────────────────────────────────────────────────────────

// const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

// const METRIC_PALETTE = [
//   "#c0392b","#1a7a6e","#7d4fa8","#b5651d","#1d6fa8","#5a8a3a",
//   "#c0762b","#2e6da4","#8a5a2e","#3a8a5a","#6d2eb5","#b52e6d",
// ];

// // ── All NIRF score parameters ─────────────────────────────────────────────────

// const ALL_SCORE_PARAMS: { key: string; label: string; short: string; color: string }[] = [
//   { key: "img_ss_score",      label: "Student Strength",       short: "SS",    color: "#1a7a6e" },
//   { key: "img_fsr_score",     label: "Faculty-Student Ratio",  short: "FSR",   color: "#1d6fa8" },
//   { key: "img_fqe_score",     label: "Faculty Qualification",  short: "FQE",   color: "#7d4fa8" },
//   { key: "img_fru_score",     label: "Faculty Research",       short: "FRU",   color: "#5a8a3a" },
//   { key: "img_oe_mir_score",  label: "OE/MIR Score",           short: "OE+MIR",color: "#6b5a1a" },
//   { key: "img_oemir_score",   label: "OE/MIR (alt)",           short: "OEMIR", color: "#8b4513" },
//   { key: "img_pu_score",      label: "Perception",             short: "PU",    color: "#c0762b" },
//   { key: "img_qp_score",      label: "Quality Publication",    short: "QP",    color: "#2e6da4" },
//   { key: "img_ipr_score",     label: "IPR & Patents",          short: "IPR",   color: "#b5651d" },
//   { key: "img_fppp_score",    label: "Footprint of Projects",  short: "FPPP",  color: "#3a8a5a" },
//   { key: "img_gue_score",     label: "Graduate Performance",   short: "GUE",   color: "#1a5a7a" },
//   { key: "img_gphd_score",    label: "PhD Graduates",          short: "GPHD",  color: "#6d2eb5" },
//   { key: "img_rd_score",      label: "R&D",                    short: "RD",    color: "#c0392b" },
//   { key: "img_wd_score",      label: "Wider Impact",           short: "WD",    color: "#2b6dc0" },
//   { key: "img_escs_score",    label: "Economic & Social",      short: "ESCS",  color: "#8a5a2e" },
//   { key: "img_pcs_score",     label: "Peer Perception",        short: "PCS",   color: "#4a5568" },
//   { key: "img_pr_score",      label: "Perception (PR)",        short: "PR",    color: "#b52e6d" },
// ];

// // ── Section tab definitions ───────────────────────────────────────────────────

// const SECTION_TABS = [
//   { id: "intake",       label: "Intake",        kw: "Sanctioned",         isAmt: false, useRankingYear: false },
//   { id: "placement",    label: "Placement",     kw: "Placement",          isAmt: false, useRankingYear: false },
//   { id: "students",     label: "Students",      kw: "Student",            isAmt: false, useRankingYear: true  },
//   { id: "phd",          label: "PhD",           kw: "Ph.D",               isAmt: false, useRankingYear: false },
//   { id: "research",     label: "Research",      kw: "Sponsored Research", isAmt: false, useRankingYear: false },
//   { id: "consultancy",  label: "Consultancy",   kw: "Consultancy",        isAmt: true,  useRankingYear: false },
//   { id: "financial",    label: "Financial",     kw: "expenditure",        isAmt: true,  useRankingYear: false },
//   { id: "patents",      label: "Patents/IPR",   kw: "Patent",             isAmt: false, useRankingYear: false },
//   { id: "faculty",      label: "Faculty",       kw: "Faculty",            isAmt: false, useRankingYear: true  },
//   { id: "innovation",   label: "Innovation",    kw: "Startup",            isAmt: false, useRankingYear: false },
//   { id: "publications", label: "Publications",  kw: "Publication",        isAmt: false, useRankingYear: false },
//   { id: "edp",          label: "EDP/MDP",       kw: "Executive",          isAmt: false, useRankingYear: false },
//   { id: "scholarship",  label: "Scholarships",  kw: "Scholarship",        isAmt: false, useRankingYear: false },
//   { id: "graduation",   label: "Graduation",    kw: "Graduation Outcome", isAmt: false, useRankingYear: false },
//   { id: "facilities",   label: "Facilities",    kw: "Facilities",         isAmt: false, useRankingYear: true  },
// ];

// // ── CSS constants ─────────────────────────────────────────────────────────────

// const MONO  = "'IBM Plex Mono', monospace";
// const BODY  = "'Plus Jakarta Sans', sans-serif";
// const SERIF = "'DM Serif Display', serif";
// const BORDER       = "#e4e2dd";
// const OFF_WHITE    = "#f7f6f3";
// const CRIMSON      = "#c0392b";
// const CRIMSON_PALE = "#fdf1f0";
// const INK900       = "#1a1916";
// const INK500       = "#6b6860";
// const INK300       = "#a8a49c";
// const WHITE        = "#ffffff";

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const BAD_SET = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: unknown) => BAD_SET.has(String(v ?? "").trim().toLowerCase());
// const toNum = (v: unknown): number | null => {
//   if (v == null) return null;
//   const n = Number(String(v).replace(/,/g, ""));
//   return isNaN(n) ? null : n;
// };

// const fmtScore = (v: unknown) => { const n = toNum(v); return n != null ? n.toFixed(2) : "—"; };
// const fmtN     = (v: unknown) => { const n = toNum(v); return n != null ? n.toLocaleString("en-IN") : "—"; };
// const fmtAmt   = (v: unknown) => {
//   const n = toNum(v); if (n == null) return "—";
//   if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
//   if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// };
// const fmtSal = (v: unknown) => { const n = toNum(v); return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—"; };

// function bestIdx(vals: (number | null)[], higher = true): number {
//   let best: number | null = null, idx = -1;
//   vals.forEach((v, i) => {
//     if (v == null) return;
//     if (best == null || (higher ? v > best : v < best)) { best = v; idx = i; }
//   });
//   return idx;
// }

// function baseYear(y: string): string {
//   return y?.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y?.trim() ?? "";
// }
// function isRealYear(y: string): boolean {
//   return !!y && !isBAD(y) && /^\d{4}(-\d{2})?/.test(y.trim());
// }
// function sortYrs(years: string[]): string[] {
//   return [...years].sort((a, b) => {
//     const ay = parseInt(a), by = parseInt(b);
//     return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
//   });
// }

// const shortName = (p: InstituteProfile | undefined, code: string, words = 3) =>
//   p?.institute_name?.split(" ").slice(0, words).join(" ") ?? code;

// // ── UI primitives ─────────────────────────────────────────────────────────────

// function SectionHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <div style={{
//       padding: "12px 24px 10px",
//       borderBottom: `1px solid ${BORDER}`,
//       borderTop: `3px solid ${CRIMSON}`,
//       background: CRIMSON_PALE,
//       marginTop: 28,
//     }}>
//       <p style={{
//         fontFamily: MONO, fontSize: "0.65rem",
//         textTransform: "uppercase", letterSpacing: "0.1em",
//         color: CRIMSON, fontWeight: 600,
//       }}>
//         {children}
//       </p>
//     </div>
//   );
// }

// function PillBar({
//   pills, active, onToggle, onAll,
// }: {
//   pills: { key: string; label: string; color?: string }[];
//   active: Set<string>;
//   onToggle: (k: string) => void;
//   onAll: () => void;
// }) {
//   const allOn = pills.every(p => active.has(p.key));
//   return (
//     <div style={{
//       display: "flex", flexWrap: "wrap", gap: 5,
//       padding: "10px 24px 8px",
//       borderBottom: `1px solid ${BORDER}`,
//       background: OFF_WHITE,
//     }}>
//       <span style={{
//         fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase",
//         letterSpacing: "0.08em", color: INK300,
//         alignSelf: "center", marginRight: 4, flexShrink: 0,
//       }}>
//         Parameters
//       </span>
//       <button onClick={onAll} style={{
//         fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//         border: `1px solid ${allOn ? CRIMSON : BORDER}`,
//         background: allOn ? CRIMSON : WHITE,
//         color: allOn ? WHITE : INK300,
//         cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//       }}>
//         All
//       </button>
//       {pills.map(p => {
//         const on  = active.has(p.key);
//         const col = p.color ?? CRIMSON;
//         return (
//           <button key={p.key} onClick={() => onToggle(p.key)} style={{
//             fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//             border: `1px solid ${on ? col : BORDER}`,
//             background: on ? col : WHITE,
//             color: on ? WHITE : INK300,
//             cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//             whiteSpace: "nowrap",
//           }}>
//             {p.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// function ChartTip({ active: isActive, payload, label, fmtFn }: {
//   active?: boolean; payload?: { name: string; value: unknown; color: string }[];
//   label?: string; fmtFn?: (v: unknown) => string;
// }) {
//   if (!isActive || !payload?.length) return null;
//   return (
//     <div style={{
//       background: "#1a1916", border: "1px solid #3d3b36",
//       fontFamily: MONO, fontSize: "0.67rem", color: "#f7f6f3", padding: "8px 12px",
//     }}>
//       <p style={{ color: INK300, marginBottom: 5 }}>{label}</p>
//       {payload.map((p, i) => (
//         <p key={i} style={{ color: p.color, marginBottom: 2 }}>
//           {p.name}: <strong>{fmtFn ? fmtFn(p.value) : (toNum(p.value)?.toFixed(2) ?? "—")}</strong>
//         </p>
//       ))}
//     </div>
//   );
// }

// const AX = { axisLine: false as const, tickLine: false as const, tick: { fontFamily: MONO, fontSize: 10, fill: INK300 } };

// // ── NIRF Score Chart ──────────────────────────────────────────────────────────

// function NIRFScoreChart({ profiles, codes, years }: { profiles: CompareData; codes: string[]; years: number[] }) {
//   const available = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => years.some(y => toNum(profiles[c]?.scoresByYear[y]?.[p.key]) != null))
//   );

//   const [active, setActive] = useState<Set<string>>(
//     () => new Set(available.slice(0, 5).map(p => p.key))
//   );

//   const toggle = (k: string) => setActive(prev => {
//     const s = new Set(prev);
//     if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
//     return s;
//   });
//   const toggleAll = () => setActive(prev =>
//     prev.size === available.length ? new Set([available[0]?.key ?? ""]) : new Set(available.map(p => p.key))
//   );

//   const activeParams = available.filter(p => active.has(p.key));

//   const chartData = years.slice().reverse().map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const p of activeParams) {
//         const v = toNum(profiles[code]?.scoresByYear[yr]?.[p.key]);
//         if (v != null) pt[`${code}::${p.key}`] = v;
//       }
//     }
//     return pt;
//   });

//   if (!available.length) return (
//     <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//       No score data available.
//     </div>
//   );

//   return (
//     <>
//       <PillBar
//         pills={available.map(p => ({ key: p.key, label: p.label, color: p.color }))}
//         active={active}
//         onToggle={toggle}
//         onAll={toggleAll}
//       />
//       <div style={{ padding: "20px 24px 8px" }}>
//         <ResponsiveContainer width="100%" height={360}>
//           <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
//             <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//             <XAxis dataKey="year" {...AX} />
//             <YAxis domain={[0, "auto"]} {...AX} width={32} />
//             <Tooltip content={<ChartTip fmtFn={fmtScore} />} />
//             <Legend
//               wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 10 }}
//               formatter={(value: string) => {
//                 const sep = value.indexOf("::");
//                 const code = value.slice(0, sep);
//                 const paramKey = value.slice(sep + 2);
//                 const pLabel = ALL_SCORE_PARAMS.find(p => p.key === paramKey)?.short ?? paramKey;
//                 return `${shortName(profiles[code], code, 2)} · ${pLabel}`;
//               }}
//             />
//             {codes.flatMap((code, ci) =>
//               activeParams.map(p => {
//                 const col   = ci === 0 ? p.color : INST_COLORS[ci];
//                 const dash  = ci === 0 ? undefined : "6 3";
//                 const dKey  = `${code}::${p.key}`;
//                 const hasData = chartData.some(d => d[dKey] != null);
//                 if (!hasData) return null;
//                 return (
//                   <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                     stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
//                     strokeDasharray={dash}
//                     dot={{ r: 3, fill: col, strokeWidth: 0 }}
//                     activeDot={{ r: 5 }} connectNulls
//                   />
//                 );
//               })
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </>
//   );
// }

// // ── Radar ─────────────────────────────────────────────────────────────────────

// function ScoreRadar({ profiles, codes, year }: { profiles: CompareData; codes: string[]; year: number }) {
//   const params = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => toNum(profiles[c]?.scoresByYear[year]?.[p.key]) != null)
//   );
//   if (params.length < 3) return null;

//   const data = params.map(p => {
//     const pt: Record<string, unknown> = { param: p.short };
//     for (const code of codes) {
//       const row = profiles[code]?.scoresByYear[year];
//       const v = toNum(row?.[p.key]);
//       const t = toNum(row?.[p.key.replace("_score", "_total")]) ?? 100;
//       pt[code] = v != null && t > 0 ? +((v / t) * 100).toFixed(1) : 0;
//     }
//     return pt;
//   });

//   return (
//     <div style={{ padding: "16px 24px 8px" }}>
//       <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
//         Score Profile Radar — % of parameter maximum
//       </p>
//       <ResponsiveContainer width="100%" height={300}>
//         <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
//           <PolarGrid stroke={BORDER} />
//           <PolarAngleAxis dataKey="param" tick={{ fontFamily: MONO, fontSize: 9, fill: INK500 }} />
//           {codes.map((code, i) => (
//             <Radar key={code} name={shortName(profiles[code], code, 3)} dataKey={code}
//               stroke={INST_COLORS[i]} fill={INST_COLORS[i]} fillOpacity={0.09} strokeWidth={2}
//             />
//           ))}
//           <Legend
//             wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem" }}
//             formatter={(_v, entry) => {
//               const idx = codes.indexOf(String(entry.dataKey));
//               return <span style={{ color: INST_COLORS[idx] }}>{shortName(profiles[String(entry.dataKey)], String(entry.dataKey), 3)}</span>;
//             }}
//           />
//         </RadarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

// // ── Section Chart ─────────────────────────────────────────────────────────────

// function SectionChart({
//   profiles, codes, sectionKw, isAmt, useRankingYear,
// }: {
//   profiles: CompareData; codes: string[];
//   sectionKw: string; isAmt: boolean; useRankingYear: boolean;
// }) {
//   type CM = Map<string, Map<string, number>>; // metric → year → value
//   const yearSet   = new Set<string>();
//   const allMetrics = new Set<string>();
//   const instData  = new Map<string, CM>();

//   for (const code of codes) {
//     const cm: CM = new Map();
//     instData.set(code, cm);
//     const p = profiles[code];
//     if (!p) continue;
//     for (const sec of p.rawSections) {
//       if (!sec.section.toLowerCase().includes(sectionKw.toLowerCase())) continue;
//       for (const m of sec.metrics) {
//         if (isBAD(m.value) || m.metric.toLowerCase().includes("in words")) continue;
//         const v = toNum(m.value);
//         if (v == null || v < 0) continue;
//         const yr = useRankingYear
//           ? String(m.ranking_year)
//           : (isRealYear(m.year) ? baseYear(m.year) : String(m.ranking_year));
//         if (!yr) continue;
//         const label = m.metric.trim();
//         yearSet.add(yr);
//         allMetrics.add(label);
//         if (!cm.has(label)) cm.set(label, new Map());
//         const prev = cm.get(label)!.get(yr) ?? 0;
//         cm.get(label)!.set(yr, Math.max(prev, v));
//       }
//     }
//   }

//   const validMetrics = Array.from(allMetrics).filter(m =>
//     codes.some(c => (instData.get(c)?.get(m)?.size ?? 0) > 0)
//   );
//   const sortedYears = sortYrs(Array.from(yearSet));

//   const [active, setActive] = useState<Set<string>>(() => new Set(validMetrics.slice(0, 3)));
//   // Reset when tab changes (sectionKw changes)
//   const prevKw = React.useRef(sectionKw);
//   if (prevKw.current !== sectionKw) {
//     prevKw.current = sectionKw;
//     // Use a layout effect-like approach: just update on next render via key prop on parent
//   }

//   if (!validMetrics.length || !sortedYears.length) {
//     return (
//       <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//         No data found for this section in the selected institutes.
//       </div>
//     );
//   }

//   const toggle = (k: string) => setActive(prev => {
//     const s = new Set(prev);
//     if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
//     return s;
//   });
//   const toggleAll = () => setActive(prev =>
//     prev.size === validMetrics.length ? new Set([validMetrics[0]]) : new Set(validMetrics)
//   );

//   const activeMetrics = validMetrics.filter(m => active.has(m));
//   const fmtFn = isAmt ? fmtAmt : fmtN;

//   const chartData = sortedYears.map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const m of activeMetrics) {
//         const v = instData.get(code)?.get(m)?.get(yr);
//         if (v != null) pt[`${code}::${m}`] = v;
//       }
//     }
//     return pt;
//   });

//   return (
//     <>
//       <PillBar
//         pills={validMetrics.map((m, i) => ({
//           key: m,
//           label: m.length > 42 ? m.slice(0, 40) + "…" : m,
//           color: METRIC_PALETTE[i % METRIC_PALETTE.length],
//         }))}
//         active={active}
//         onToggle={toggle}
//         onAll={toggleAll}
//       />
//       <div style={{ padding: "16px 24px 8px" }}>
//         <ResponsiveContainer width="100%" height={280}>
//           <LineChart data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
//             <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//             <XAxis dataKey="year" {...AX} />
//             <YAxis {...AX} />
//             <Tooltip content={<ChartTip fmtFn={fmtFn} />} />
//             <Legend
//               wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 8 }}
//               formatter={(value: string) => {
//                 const sep = value.indexOf("::");
//                 const code   = value.slice(0, sep);
//                 const mLabel = value.slice(sep + 2);
//                 return `${shortName(profiles[code], code, 2)} · ${mLabel.length > 28 ? mLabel.slice(0, 26) + "…" : mLabel}`;
//               }}
//             />
//             {codes.flatMap((code, ci) =>
//               activeMetrics.map((m, mi) => {
//                 const col   = ci === 0 ? METRIC_PALETTE[validMetrics.indexOf(m) % METRIC_PALETTE.length] : INST_COLORS[ci];
//                 const dash  = ci === 0 ? undefined : "6 3";
//                 const dKey  = `${code}::${m}`;
//                 const hasData = chartData.some(d => d[dKey] != null);
//                 if (!hasData) return null;
//                 return (
//                   <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                     stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
//                     strokeDasharray={dash}
//                     dot={{ r: 3, fill: col, strokeWidth: 0 }}
//                     activeDot={{ r: 5 }} connectNulls
//                   />
//                 );
//               })
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </>
//   );
// }

// // ── Table primitives ──────────────────────────────────────────────────────────

// function TableColHeader({ codes, profiles }: { codes: string[]; profiles: CompareData }) {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${codes.length}, 1fr)`, borderBottom: `2px solid ${BORDER}`, background: OFF_WHITE }}>
//       <div style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
//         <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>Metric</span>
//       </div>
//       {codes.map((code, i) => (
//         <div key={code} style={{ padding: "8px 14px", textAlign: "center", borderRight: i < codes.length - 1 ? `1px solid ${BORDER}` : "none" }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INST_COLORS[i], fontWeight: 600 }}>
//             {profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? code}
//           </span>
//         </div>
//       ))}
//     </div>
//   );
// }

// function MetricRow({ label, values, bestI, fmt, subLabel }: {
//   label: string; values: (number | null)[]; bestI: number;
//   fmt?: (v: unknown) => string; subLabel?: string;
// }) {
//   const n = values.length;
//   const fmtFn = fmt ?? fmtScore;
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${n}, 1fr)`, borderBottom: `1px solid ${BORDER}`, minHeight: 38 }}>
//       <div style={{ padding: "9px 14px", background: OFF_WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
//         <span style={{ fontFamily: BODY, fontSize: "0.74rem", color: INK900 }}>{label}</span>
//         {subLabel && <span style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300 }}>{subLabel}</span>}
//       </div>
//       {values.map((v, i) => {
//         const isBest = i === bestI && v != null;
//         return (
//           <div key={i} style={{ padding: "9px 14px", borderRight: i < n - 1 ? `1px solid ${BORDER}` : "none", background: isBest ? CRIMSON_PALE : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: isBest ? 700 : 400, color: isBest ? CRIMSON : (v != null ? INK900 : INK300) }}>
//               {v != null ? fmtFn(v) : "—"}
//               {isBest && v != null && <span style={{ marginLeft: 3, fontSize: "0.55rem" }}> ★</span>}
//             </span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main ──────────────────────────────────────────────────────────────────────

// export default function CompareView({ institutes, onRemove }: Props) {
//   const [data,         setData]         = useState<CompareData>({});
//   const [loading,      setLoading]      = useState(true);
//   const [activeYear,   setActiveYear]   = useState<number | null>(null);
//   const [activeSecTab, setActiveSecTab] = useState("intake");

//   const codes = institutes.map(i => i.institute_code);

//   useEffect(() => {
//     if (!codes.length) return;
//     setLoading(true);
//     fetch(`/api/compare?codes=${codes.join(",")}`)
//       .then(r => r.json())
//       .then((d: CompareData) => {
//         setData(d);
//         const yearSets = codes.map(c => new Set(Object.keys(d[c]?.scoresByYear ?? {}).map(Number)));
//         const common = Array.from(yearSets[0] ?? new Set<number>())
//           .filter(y => yearSets.every(s => s.has(y))).sort((a, b) => b - a);
//         const fallback = Array.from(
//           new Set(codes.flatMap(c => Object.keys(d[c]?.scoresByYear ?? {}).map(Number)))
//         ).sort((a, b) => b - a);
//         setActiveYear(common[0] ?? fallback[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [codes.join(",")]);

//   const allYears    = Array.from(new Set(codes.flatMap(c => Object.keys(data[c]?.scoresByYear ?? {}).map(Number)))).sort((a, b) => b - a);
//   const loadedCodes = codes.filter(c => !!data[c]);

//   const scoreRow = useCallback((key: string) =>
//     loadedCodes.map(c => toNum(data[c]?.scoresByYear[activeYear ?? 0]?.[key])),
//   [loadedCodes, data, activeYear]);

//   if (loading) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>Loading comparison…</p>
//       </div>
//     );
//   }

//   const activeSecDef = SECTION_TABS.find(t => t.id === activeSecTab) ?? SECTION_TABS[0];

//   return (
//     <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 100px" }}>

//       {/* ── Sticky header ── */}
//       <div style={{ position: "sticky", top: 52, zIndex: 40, background: WHITE, borderBottom: `2px solid ${BORDER}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
//         <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${loadedCodes.length}, 1fr)` }}>
//           <div style={{ padding: "14px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
//             <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: CRIMSON }}>Comparison</p>
//             {allYears.length > 1 && (
//               <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
//                 {allYears.slice(0, 6).map(y => (
//                   <button key={y} onClick={() => setActiveYear(y)} style={{
//                     fontFamily: MONO, fontSize: "0.58rem", padding: "2px 6px",
//                     border: `1px solid ${activeYear === y ? CRIMSON : BORDER}`,
//                     background: activeYear === y ? CRIMSON : "transparent",
//                     color: activeYear === y ? WHITE : INK500, cursor: "pointer",
//                   }}>
//                     {y}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//           {loadedCodes.map((code, i) => {
//             const p     = data[code];
//             const score = activeYear ? toNum(p?.scoresByYear[activeYear]?.img_total) : null;
//             return (
//               <div key={code} style={{ padding: "12px 14px", borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none", borderTop: `3px solid ${INST_COLORS[i]}` }}>
//                 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: "0.8rem", color: INK900, lineHeight: 1.3, marginBottom: 3 }}>{p?.institute_name ?? code}</p>
//                     <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>{code}</p>
//                     {p?.categories?.[0] && (
//                       <span style={{ display: "inline-block", marginTop: 4, fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", color: INST_COLORS[i], border: `1px solid ${INST_COLORS[i]}`, padding: "1px 5px" }}>
//                         {p.categories[0]}
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ textAlign: "right", flexShrink: 0 }}>
//                     {score != null && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "1.5rem", color: INST_COLORS[i], lineHeight: 1 }}>{score.toFixed(2)}</p>}
//                     <button onClick={() => onRemove(code)} style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300, background: "none", border: `1px solid ${BORDER}`, padding: "2px 6px", cursor: "pointer", marginTop: 4 }}>✕</button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ═══════════════════ 1. NIRF SCORE CHART ═══════════════════ */}
//       <SectionHeader>NIRF Score Trends — All Parameters</SectionHeader>
//       <NIRFScoreChart profiles={data} codes={loadedCodes} years={allYears} />
//       {activeYear && <ScoreRadar profiles={data} codes={loadedCodes} year={activeYear} />}

//       {/* ═══════════════════ 2. SCORE BREAKDOWN TABLE ═══════════════════ */}
//       <SectionHeader>NIRF Score Breakdown · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {(() => { const vals = scoreRow("img_total"); return <MetricRow label="NIRF Total Score" values={vals} bestI={bestIdx(vals)} subLabel="/ 100" />; })()}
//       {ALL_SCORE_PARAMS.map(p => {
//         const vals = scoreRow(p.key);
//         if (vals.every(v => v == null)) return null;
//         const tvs = scoreRow(p.key.replace("_score", "_total"));
//         const maxT = tvs.find(v => v != null);
//         return <MetricRow key={p.key} label={p.label} values={vals} bestI={bestIdx(vals)} subLabel={maxT ? `/ ${maxT.toFixed(0)}` : undefined} />;
//       })}

//       {/* ═══════════════════ 3. SECTION CHARTS ═══════════════════ */}
//       <SectionHeader>Section-wise Comparison — Charts</SectionHeader>

//       {/* Section tab strip */}
//       <div style={{ display: "flex", overflowX: "auto", borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
//         {SECTION_TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveSecTab(tab.id)} style={{
//             fontFamily: BODY, fontWeight: activeSecTab === tab.id ? 600 : 400,
//             fontSize: "0.75rem", padding: "10px 16px",
//             background: "transparent", border: "none",
//             borderBottom: activeSecTab === tab.id ? `2px solid ${CRIMSON}` : "2px solid transparent",
//             marginBottom: "-2px",
//             color: activeSecTab === tab.id ? CRIMSON : INK300,
//             cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.12s",
//           }}>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       <SectionChart
//         key={activeSecTab}
//         profiles={data}
//         codes={loadedCodes}
//         sectionKw={activeSecDef.kw}
//         isAmt={activeSecDef.isAmt}
//         useRankingYear={activeSecDef.useRankingYear}
//       />

//       {/* ═══════════════════ 4. KEY METRICS TABLE ═══════════════════ */}
//       <SectionHeader>Key Metrics Table · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {[
//         { key: "pdf_total_intake",            label: "Total Intake",                   fmt: fmtN,   higher: false },
//         { key: "pdf_placement_placed",        label: "Students Placed",                fmt: fmtN,   higher: true  },
//         { key: "pdf_placement_higher",        label: "Higher Studies",                 fmt: fmtN,   higher: true  },
//         { key: "pdf_median_salary",           label: "Median Salary",                  fmt: fmtSal, higher: true  },
//         { key: "pdf_phd_ft_total",            label: "PhD Students — Full Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_total",            label: "PhD Students — Part Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_ft_graduated",        label: "PhD Graduated FT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_graduated",        label: "PhD Graduated PT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_projects",      label: "Sponsored Projects (3yr)",       fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_amount",        label: "Sponsored Amount (3yr)",         fmt: fmtAmt, higher: true  },
//         { key: "pdf_consultancy_projects",    label: "Consultancy Projects (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_consultancy_amount",      label: "Consultancy Amount (3yr)",       fmt: fmtAmt, higher: true  },
//         { key: "pdf_edp_participants",        label: "EDP/MDP Participants (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_capital_expenditure",     label: "Capital Expenditure (3yr sum)",  fmt: fmtAmt, higher: true  },
//         { key: "pdf_operational_expenditure", label: "Operational Expenditure (3yr)",  fmt: fmtAmt, higher: true  },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return <MetricRow key={m.key} label={m.label} values={vals} bestI={bestIdx(vals, m.higher)} fmt={m.fmt} />;
//       })}

//       <div style={{ padding: "14px 24px", borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>
//           ★ Best value in row &nbsp;·&nbsp; Solid line = first institute · dashed = others &nbsp;·&nbsp;
//           Score data from NIRF image scorecard &nbsp;·&nbsp; PDF aggregates are 3-year sums from institutional reports
//         </p>
//       </div>
//     </div>
//   );
// }








































// "use client";
// /**
//  * CompareView.tsx  (v3 — full rebuild)
//  * ─────────────────────────────────────────────────────────────────────────────
//  * 1. NIRF Score chart — every score column as toggle pill, multi-line per institute
//  * 2. Section charts — tabs for every section (Intake, Placement, PhD, Students,
//  *    Research, Financial…) each with their own metric toggle pills
//  * 3. Comparison table — every metric, best value highlighted ★
//  */

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid,
//   Tooltip, Legend, ResponsiveContainer,
//   RadarChart, Radar, PolarGrid, PolarAngleAxis,
// } from "recharts";
// import type { SearchHit } from "@/app/page";

// // ── Types ─────────────────────────────────────────────────────────────────────

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
//   category: string;
// }

// interface InstituteProfile {
//   institute_code: string;
//   institute_name: string;
//   categories: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   rawSections: { section: string; metrics: RawMetric[] }[];
// }

// type CompareData = Record<string, InstituteProfile>;

// interface Props {
//   institutes: SearchHit[];
//   onRemove: (code: string) => void;
//   onClose: () => void;
// }

// // ── Palette ───────────────────────────────────────────────────────────────────

// const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

// const METRIC_PALETTE = [
//   "#c0392b","#1a7a6e","#7d4fa8","#b5651d","#1d6fa8","#5a8a3a",
//   "#c0762b","#2e6da4","#8a5a2e","#3a8a5a","#6d2eb5","#b52e6d",
// ];

// // ── All NIRF score parameters ─────────────────────────────────────────────────

// const ALL_SCORE_PARAMS: { key: string; label: string; short: string; color: string }[] = [
//   { key: "img_ss_score",      label: "Student Strength",       short: "SS",    color: "#1a7a6e" },
//   { key: "img_fsr_score",     label: "Faculty-Student Ratio",  short: "FSR",   color: "#1d6fa8" },
//   { key: "img_fqe_score",     label: "Faculty Qualification",  short: "FQE",   color: "#7d4fa8" },
//   { key: "img_fru_score",     label: "Faculty Research",       short: "FRU",   color: "#5a8a3a" },
//   { key: "img_oe_mir_score",  label: "OE/MIR Score",           short: "OE+MIR",color: "#6b5a1a" },
//   { key: "img_oemir_score",   label: "OE/MIR (alt)",           short: "OEMIR", color: "#8b4513" },
//   { key: "img_pu_score",      label: "Perception",             short: "PU",    color: "#c0762b" },
//   { key: "img_qp_score",      label: "Quality Publication",    short: "QP",    color: "#2e6da4" },
//   { key: "img_ipr_score",     label: "IPR & Patents",          short: "IPR",   color: "#b5651d" },
//   { key: "img_fppp_score",    label: "Footprint of Projects",  short: "FPPP",  color: "#3a8a5a" },
//   { key: "img_gue_score",     label: "Graduate Performance",   short: "GUE",   color: "#1a5a7a" },
//   { key: "img_gphd_score",    label: "PhD Graduates",          short: "GPHD",  color: "#6d2eb5" },
//   { key: "img_rd_score",      label: "R&D",                    short: "RD",    color: "#c0392b" },
//   { key: "img_wd_score",      label: "Wider Impact",           short: "WD",    color: "#2b6dc0" },
//   { key: "img_escs_score",    label: "Economic & Social",      short: "ESCS",  color: "#8a5a2e" },
//   { key: "img_pcs_score",     label: "Peer Perception",        short: "PCS",   color: "#4a5568" },
//   { key: "img_pr_score",      label: "Perception (PR)",        short: "PR",    color: "#b52e6d" },
// ];

// // ── Section tab definitions ───────────────────────────────────────────────────

// const SECTION_TABS = [
//   { id: "intake",       label: "Intake",        kw: "Sanctioned",         isAmt: false, useRankingYear: false },
//   { id: "placement",    label: "Placement",     kw: "Placement",          isAmt: false, useRankingYear: false },
//   { id: "students",     label: "Students",      kw: "Student",            isAmt: false, useRankingYear: true  },
//   { id: "phd",          label: "PhD",           kw: "Ph.D",               isAmt: false, useRankingYear: false },
//   { id: "research",     label: "Research",      kw: "Sponsored Research", isAmt: false, useRankingYear: false },
//   { id: "consultancy",  label: "Consultancy",   kw: "Consultancy",        isAmt: true,  useRankingYear: false },
//   { id: "financial",    label: "Financial",     kw: "expenditure",        isAmt: true,  useRankingYear: false },
//   { id: "patents",      label: "Patents/IPR",   kw: "Patent",             isAmt: false, useRankingYear: false },
//   { id: "faculty",      label: "Faculty",       kw: "Faculty",            isAmt: false, useRankingYear: true  },
//   { id: "innovation",   label: "Innovation",    kw: "Startup",            isAmt: false, useRankingYear: false },
//   { id: "publications", label: "Publications",  kw: "Publication",        isAmt: false, useRankingYear: false },
//   { id: "edp",          label: "EDP/MDP",       kw: "Executive",          isAmt: false, useRankingYear: false },
//   { id: "scholarship",  label: "Scholarships",  kw: "Scholarship",        isAmt: false, useRankingYear: false },
//   { id: "graduation",   label: "Graduation",    kw: "Graduation Outcome", isAmt: false, useRankingYear: false },
//   { id: "facilities",   label: "Facilities",    kw: "Facilities",         isAmt: false, useRankingYear: true  },
// ];

// // ── CSS constants ─────────────────────────────────────────────────────────────

// const MONO  = "'IBM Plex Mono', monospace";
// const BODY  = "'Plus Jakarta Sans', sans-serif";
// const SERIF = "'DM Serif Display', serif";
// const BORDER       = "#e4e2dd";
// const OFF_WHITE    = "#f7f6f3";
// const CRIMSON      = "#c0392b";
// const CRIMSON_PALE = "#fdf1f0";
// const INK900       = "#1a1916";
// const INK500       = "#6b6860";
// const INK300       = "#a8a49c";
// const WHITE        = "#ffffff";

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const BAD_SET = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: unknown) => BAD_SET.has(String(v ?? "").trim().toLowerCase());
// const toNum = (v: unknown): number | null => {
//   if (v == null) return null;
//   const n = Number(String(v).replace(/,/g, ""));
//   return isNaN(n) ? null : n;
// };

// const fmtScore = (v: unknown) => { const n = toNum(v); return n != null ? n.toFixed(2) : "—"; };
// const fmtN     = (v: unknown) => { const n = toNum(v); return n != null ? n.toLocaleString("en-IN") : "—"; };
// const fmtAmt   = (v: unknown) => {
//   const n = toNum(v); if (n == null) return "—";
//   if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
//   if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// };
// const fmtSal = (v: unknown) => { const n = toNum(v); return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—"; };

// function bestIdx(vals: (number | null)[], higher = true): number {
//   let best: number | null = null, idx = -1;
//   vals.forEach((v, i) => {
//     if (v == null) return;
//     if (best == null || (higher ? v > best : v < best)) { best = v; idx = i; }
//   });
//   return idx;
// }

// function baseYear(y: string): string {
//   return y?.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y?.trim() ?? "";
// }
// function isRealYear(y: string): boolean {
//   return !!y && !isBAD(y) && /^\d{4}(-\d{2})?/.test(y.trim());
// }
// function sortYrs(years: string[]): string[] {
//   return [...years].sort((a, b) => {
//     const ay = parseInt(a), by = parseInt(b);
//     return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
//   });
// }

// const shortName = (p: InstituteProfile | undefined, code: string, words = 3) =>
//   p?.institute_name?.split(" ").slice(0, words).join(" ") ?? code;

// // ── UI primitives ─────────────────────────────────────────────────────────────

// function SectionHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <div style={{
//       padding: "12px 24px 10px",
//       borderBottom: `1px solid ${BORDER}`,
//       borderTop: `3px solid ${CRIMSON}`,
//       background: CRIMSON_PALE,
//       marginTop: 28,
//     }}>
//       <p style={{
//         fontFamily: MONO, fontSize: "0.65rem",
//         textTransform: "uppercase", letterSpacing: "0.1em",
//         color: CRIMSON, fontWeight: 600,
//       }}>
//         {children}
//       </p>
//     </div>
//   );
// }

// function PillBar({
//   pills, active, onToggle, onAll,
// }: {
//   pills: { key: string; label: string; color?: string }[];
//   active: Set<string>;
//   onToggle: (k: string) => void;
//   onAll: () => void;
// }) {
//   const allOn = pills.every(p => active.has(p.key));
//   return (
//     <div style={{
//       display: "flex", flexWrap: "wrap", gap: 5,
//       padding: "10px 24px 8px",
//       borderBottom: `1px solid ${BORDER}`,
//       background: OFF_WHITE,
//     }}>
//       <span style={{
//         fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase",
//         letterSpacing: "0.08em", color: INK300,
//         alignSelf: "center", marginRight: 4, flexShrink: 0,
//       }}>
//         Parameters
//       </span>
//       <button onClick={onAll} style={{
//         fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//         border: `1px solid ${allOn ? CRIMSON : BORDER}`,
//         background: allOn ? CRIMSON : WHITE,
//         color: allOn ? WHITE : INK300,
//         cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//       }}>
//         All
//       </button>
//       {pills.map(p => {
//         const on  = active.has(p.key);
//         const col = p.color ?? CRIMSON;
//         return (
//           <button key={p.key} onClick={() => onToggle(p.key)} style={{
//             fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//             border: `1px solid ${on ? col : BORDER}`,
//             background: on ? col : WHITE,
//             color: on ? WHITE : INK300,
//             cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//             whiteSpace: "nowrap",
//           }}>
//             {p.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// function ChartTip({ active: isActive, payload, label, fmtFn }: {
//   active?: boolean; payload?: { name: string; value: unknown; color: string }[];
//   label?: string; fmtFn?: (v: unknown) => string;
// }) {
//   if (!isActive || !payload?.length) return null;
//   return (
//     <div style={{
//       background: "#1a1916", border: "1px solid #3d3b36",
//       fontFamily: MONO, fontSize: "0.67rem", color: "#f7f6f3", padding: "8px 12px",
//     }}>
//       <p style={{ color: INK300, marginBottom: 5 }}>{label}</p>
//       {payload.map((p, i) => (
//         <p key={i} style={{ color: p.color, marginBottom: 2 }}>
//           {p.name}: <strong>{fmtFn ? fmtFn(p.value) : (toNum(p.value)?.toFixed(2) ?? "—")}</strong>
//         </p>
//       ))}
//     </div>
//   );
// }

// const AX = { axisLine: false as const, tickLine: false as const, tick: { fontFamily: MONO, fontSize: 10, fill: INK300 } };

// // ── NIRF Score Chart ──────────────────────────────────────────────────────────

// function NIRFScoreChart({ profiles, codes, years }: { profiles: CompareData; codes: string[]; years: number[] }) {
//   const available = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => years.some(y => toNum(profiles[c]?.scoresByYear[y]?.[p.key]) != null))
//   );

//   const [active, setActive] = useState<Set<string>>(
//     () => new Set(available.slice(0, 5).map(p => p.key))
//   );

//   const toggle = (k: string) => setActive(prev => {
//     const s = new Set(prev);
//     if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
//     return s;
//   });
//   const toggleAll = () => setActive(prev =>
//     prev.size === available.length ? new Set([available[0]?.key ?? ""]) : new Set(available.map(p => p.key))
//   );

//   const activeParams = available.filter(p => active.has(p.key));

//   const chartData = years.slice().reverse().map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const p of activeParams) {
//         const v = toNum(profiles[code]?.scoresByYear[yr]?.[p.key]);
//         if (v != null) pt[`${code}::${p.key}`] = v;
//       }
//     }
//     return pt;
//   });

//   if (!available.length) return (
//     <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//       No score data available.
//     </div>
//   );

//   return (
//     <>
//       <PillBar
//         pills={available.map(p => ({ key: p.key, label: p.label, color: p.color }))}
//         active={active}
//         onToggle={toggle}
//         onAll={toggleAll}
//       />
//       <div style={{ padding: "20px 24px 8px" }}>
//         <ResponsiveContainer width="100%" height={360}>
//           <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
//             <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//             <XAxis dataKey="year" {...AX} />
//             <YAxis domain={[0, "auto"]} {...AX} width={32} />
//             <Tooltip content={<ChartTip fmtFn={fmtScore} />} />
//             <Legend
//               wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 10 }}
//               formatter={(value: string) => {
//                 const sep = value.indexOf("::");
//                 const code = value.slice(0, sep);
//                 const paramKey = value.slice(sep + 2);
//                 const pLabel = ALL_SCORE_PARAMS.find(p => p.key === paramKey)?.short ?? paramKey;
//                 return `${shortName(profiles[code], code, 2)} · ${pLabel}`;
//               }}
//             />
//             {codes.flatMap((code, ci) =>
//               activeParams.map(p => {
//                 const col   = ci === 0 ? p.color : INST_COLORS[ci];
//                 const dash  = ci === 0 ? undefined : "6 3";
//                 const dKey  = `${code}::${p.key}`;
//                 const hasData = chartData.some(d => d[dKey] != null);
//                 if (!hasData) return null;
//                 return (
//                   <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                     stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
//                     strokeDasharray={dash}
//                     dot={{ r: 3, fill: col, strokeWidth: 0 }}
//                     activeDot={{ r: 5 }} connectNulls
//                   />
//                 );
//               })
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </>
//   );
// }

// // ── Radar ─────────────────────────────────────────────────────────────────────

// function ScoreRadar({ profiles, codes, year }: { profiles: CompareData; codes: string[]; year: number }) {
//   const params = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => toNum(profiles[c]?.scoresByYear[year]?.[p.key]) != null)
//   );
//   if (params.length < 3) return null;

//   const data = params.map(p => {
//     const pt: Record<string, unknown> = { param: p.short };
//     for (const code of codes) {
//       const row = profiles[code]?.scoresByYear[year];
//       const v = toNum(row?.[p.key]);
//       const t = toNum(row?.[p.key.replace("_score", "_total")]) ?? 100;
//       pt[code] = v != null && t > 0 ? +((v / t) * 100).toFixed(1) : 0;
//     }
//     return pt;
//   });

//   return (
//     <div style={{ padding: "16px 24px 8px" }}>
//       <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
//         Score Profile Radar — % of parameter maximum
//       </p>
//       <ResponsiveContainer width="100%" height={300}>
//         <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
//           <PolarGrid stroke={BORDER} />
//           <PolarAngleAxis dataKey="param" tick={{ fontFamily: MONO, fontSize: 9, fill: INK500 }} />
//           {codes.map((code, i) => (
//             <Radar key={code} name={shortName(profiles[code], code, 3)} dataKey={code}
//               stroke={INST_COLORS[i]} fill={INST_COLORS[i]} fillOpacity={0.09} strokeWidth={2}
//             />
//           ))}
//           <Legend
//             wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem" }}
//             formatter={(_v, entry) => {
//               const idx = codes.indexOf(String(entry.dataKey));
//               return <span style={{ color: INST_COLORS[idx] }}>{shortName(profiles[String(entry.dataKey)], String(entry.dataKey), 3)}</span>;
//             }}
//           />
//         </RadarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

// // ── Section Chart ─────────────────────────────────────────────────────────────

// function SectionChart({
//   profiles, codes, sectionKw, isAmt, useRankingYear,
// }: {
//   profiles: CompareData; codes: string[];
//   sectionKw: string; isAmt: boolean; useRankingYear: boolean;
// }) {
//   type CM = Map<string, Map<string, number>>; // seriesLabel → year → value
//   const yearSet    = new Set<string>();
//   const allMetrics = new Set<string>();
//   const instData   = new Map<string, CM>();

//   // Detect whether this section is program-driven (Intake, Placement, Students…)
//   // by checking if multiple distinct non-empty program values exist.
//   const BAD_PROG = new Set(["", "-", "nan", "<na>", "null", "undefined", "none", "n/a"]);
//   const countDistinctProgs = (code: string): number => {
//     const p = profiles[code]; if (!p) return 0;
//     const progs = new Set<string>();
//     for (const sec of p.rawSections) {
//       if (!sec.section.toLowerCase().includes(sectionKw.toLowerCase())) continue;
//       for (const m of sec.metrics) {
//         const prog = (m.program ?? "").trim();
//         if (!BAD_PROG.has(prog.toLowerCase())) progs.add(prog);
//       }
//     }
//     return progs.size;
//   };
//   const useProgram = codes.some(c => countDistinctProgs(c) > 1);

//   // Count distinct metric labels across all matched sections (to decide label format)
//   const distinctMetricNames = new Set<string>();
//   for (const code of codes) {
//     const p = profiles[code]; if (!p) continue;
//     for (const sec of p.rawSections) {
//       if (!sec.section.toLowerCase().includes(sectionKw.toLowerCase())) continue;
//       for (const m of sec.metrics) distinctMetricNames.add(m.metric.trim());
//     }
//   }
//   const multipleMetrics = distinctMetricNames.size > 1;

//   for (const code of codes) {
//     const cm: CM = new Map();
//     instData.set(code, cm);
//     const p = profiles[code];
//     if (!p) continue;
//     for (const sec of p.rawSections) {
//       if (!sec.section.toLowerCase().includes(sectionKw.toLowerCase())) continue;
//       for (const m of sec.metrics) {
//         if (isBAD(m.value) || m.metric.toLowerCase().includes("in words")) continue;
//         const v = toNum(m.value);
//         if (v == null || v < 0) continue;
//         const yr = useRankingYear
//           ? String(m.ranking_year)
//           : (isRealYear(m.year) ? baseYear(m.year) : String(m.ranking_year));
//         if (!yr) continue;

//         // Series label strategy:
//         //  - Program section, single metric type  → program name only (e.g. "UG [4 Years]")
//         //  - Program section, multiple metrics    → "program — metric" (e.g. "UG [4 Years] — Students Placed")
//         //  - No program                           → metric name
//         const prog = (m.program ?? "").trim();
//         const hasProg = !BAD_PROG.has(prog.toLowerCase());
//         let label: string;
//         if (useProgram && hasProg) {
//           label = multipleMetrics ? `${prog} — ${m.metric.trim()}` : prog;
//         } else {
//           label = m.metric.trim();
//         }

//         yearSet.add(yr);
//         allMetrics.add(label);
//         if (!cm.has(label)) cm.set(label, new Map());
//         const prev = cm.get(label)!.get(yr) ?? 0;
//         cm.get(label)!.set(yr, Math.max(prev, v));
//       }
//     }
//   }

//   const validMetrics = Array.from(allMetrics).filter(m =>
//     codes.some(c => (instData.get(c)?.get(m)?.size ?? 0) > 0)
//   );
//   const sortedYears = sortYrs(Array.from(yearSet));

//   const [active, setActive] = useState<Set<string>>(() => new Set(validMetrics.slice(0, 3)));
//   // Reset when tab changes (sectionKw changes)
//   const prevKw = React.useRef(sectionKw);
//   if (prevKw.current !== sectionKw) {
//     prevKw.current = sectionKw;
//     // Use a layout effect-like approach: just update on next render via key prop on parent
//   }

//   if (!validMetrics.length || !sortedYears.length) {
//     return (
//       <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//         No data found for this section in the selected institutes.
//       </div>
//     );
//   }

//   const toggle = (k: string) => setActive(prev => {
//     const s = new Set(prev);
//     if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
//     return s;
//   });
//   const toggleAll = () => setActive(prev =>
//     prev.size === validMetrics.length ? new Set([validMetrics[0]]) : new Set(validMetrics)
//   );

//   const activeMetrics = validMetrics.filter(m => active.has(m));
//   const fmtFn = isAmt ? fmtAmt : fmtN;

//   const chartData = sortedYears.map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const m of activeMetrics) {
//         const v = instData.get(code)?.get(m)?.get(yr);
//         if (v != null) pt[`${code}::${m}`] = v;
//       }
//     }
//     return pt;
//   });

//   return (
//     <>
//       <PillBar
//         pills={validMetrics.map((m, i) => ({
//           key: m,
//           label: m.length > 42 ? m.slice(0, 40) + "…" : m,
//           color: METRIC_PALETTE[i % METRIC_PALETTE.length],
//         }))}
//         active={active}
//         onToggle={toggle}
//         onAll={toggleAll}
//       />
//       <div style={{ padding: "16px 24px 8px" }}>
//         <ResponsiveContainer width="100%" height={280}>
//           <LineChart data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
//             <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//             <XAxis dataKey="year" {...AX} />
//             <YAxis {...AX} />
//             <Tooltip content={<ChartTip fmtFn={fmtFn} />} />
//             <Legend
//               wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 8 }}
//               formatter={(value: string) => {
//                 const sep = value.indexOf("::");
//                 const code   = value.slice(0, sep);
//                 const mLabel = value.slice(sep + 2);
//                 return `${shortName(profiles[code], code, 2)} · ${mLabel.length > 28 ? mLabel.slice(0, 26) + "…" : mLabel}`;
//               }}
//             />
//             {codes.flatMap((code, ci) =>
//               activeMetrics.map((m, mi) => {
//                 const col   = ci === 0 ? METRIC_PALETTE[validMetrics.indexOf(m) % METRIC_PALETTE.length] : INST_COLORS[ci];
//                 const dash  = ci === 0 ? undefined : "6 3";
//                 const dKey  = `${code}::${m}`;
//                 const hasData = chartData.some(d => d[dKey] != null);
//                 if (!hasData) return null;
//                 return (
//                   <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                     stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
//                     strokeDasharray={dash}
//                     dot={{ r: 3, fill: col, strokeWidth: 0 }}
//                     activeDot={{ r: 5 }} connectNulls
//                   />
//                 );
//               })
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </>
//   );
// }

// // ── Table primitives ──────────────────────────────────────────────────────────

// function TableColHeader({ codes, profiles }: { codes: string[]; profiles: CompareData }) {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${codes.length}, 1fr)`, borderBottom: `2px solid ${BORDER}`, background: OFF_WHITE }}>
//       <div style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
//         <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>Metric</span>
//       </div>
//       {codes.map((code, i) => (
//         <div key={code} style={{ padding: "8px 14px", textAlign: "center", borderRight: i < codes.length - 1 ? `1px solid ${BORDER}` : "none" }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INST_COLORS[i], fontWeight: 600 }}>
//             {profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? code}
//           </span>
//         </div>
//       ))}
//     </div>
//   );
// }

// function MetricRow({ label, values, bestI, fmt, subLabel }: {
//   label: string; values: (number | null)[]; bestI: number;
//   fmt?: (v: unknown) => string; subLabel?: string;
// }) {
//   const n = values.length;
//   const fmtFn = fmt ?? fmtScore;
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${n}, 1fr)`, borderBottom: `1px solid ${BORDER}`, minHeight: 38 }}>
//       <div style={{ padding: "9px 14px", background: OFF_WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
//         <span style={{ fontFamily: BODY, fontSize: "0.74rem", color: INK900 }}>{label}</span>
//         {subLabel && <span style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300 }}>{subLabel}</span>}
//       </div>
//       {values.map((v, i) => {
//         const isBest = i === bestI && v != null;
//         return (
//           <div key={i} style={{ padding: "9px 14px", borderRight: i < n - 1 ? `1px solid ${BORDER}` : "none", background: isBest ? CRIMSON_PALE : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: isBest ? 700 : 400, color: isBest ? CRIMSON : (v != null ? INK900 : INK300) }}>
//               {v != null ? fmtFn(v) : "—"}
//               {isBest && v != null && <span style={{ marginLeft: 3, fontSize: "0.55rem" }}> ★</span>}
//             </span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main ──────────────────────────────────────────────────────────────────────

// export default function CompareView({ institutes, onRemove }: Props) {
//   const [data,         setData]         = useState<CompareData>({});
//   const [loading,      setLoading]      = useState(true);
//   const [activeYear,   setActiveYear]   = useState<number | null>(null);
//   const [activeSecTab, setActiveSecTab] = useState("intake");

//   const codes = institutes.map(i => i.institute_code);

//   useEffect(() => {
//     if (!codes.length) return;
//     setLoading(true);
//     fetch(`/api/compare?codes=${codes.join(",")}`)
//       .then(r => r.json())
//       .then((d: CompareData) => {
//         setData(d);
//         const yearSets = codes.map(c => new Set(Object.keys(d[c]?.scoresByYear ?? {}).map(Number)));
//         const common = Array.from(yearSets[0] ?? new Set<number>())
//           .filter(y => yearSets.every(s => s.has(y))).sort((a, b) => b - a);
//         const fallback = Array.from(
//           new Set(codes.flatMap(c => Object.keys(d[c]?.scoresByYear ?? {}).map(Number)))
//         ).sort((a, b) => b - a);
//         setActiveYear(common[0] ?? fallback[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [codes.join(",")]);

//   const allYears    = Array.from(new Set(codes.flatMap(c => Object.keys(data[c]?.scoresByYear ?? {}).map(Number)))).sort((a, b) => b - a);
//   const loadedCodes = codes.filter(c => !!data[c]);

//   const scoreRow = useCallback((key: string) =>
//     loadedCodes.map(c => toNum(data[c]?.scoresByYear[activeYear ?? 0]?.[key])),
//   [loadedCodes, data, activeYear]);

//   if (loading) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>Loading comparison…</p>
//       </div>
//     );
//   }

//   const activeSecDef = SECTION_TABS.find(t => t.id === activeSecTab) ?? SECTION_TABS[0];

//   return (
//     <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 100px" }}>

//       {/* ── Sticky header ── */}
//       <div style={{ position: "sticky", top: 52, zIndex: 40, background: WHITE, borderBottom: `2px solid ${BORDER}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
//         <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${loadedCodes.length}, 1fr)` }}>
//           <div style={{ padding: "14px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
//             <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: CRIMSON }}>Comparison</p>
//             {allYears.length > 1 && (
//               <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
//                 {allYears.slice(0, 6).map(y => (
//                   <button key={y} onClick={() => setActiveYear(y)} style={{
//                     fontFamily: MONO, fontSize: "0.58rem", padding: "2px 6px",
//                     border: `1px solid ${activeYear === y ? CRIMSON : BORDER}`,
//                     background: activeYear === y ? CRIMSON : "transparent",
//                     color: activeYear === y ? WHITE : INK500, cursor: "pointer",
//                   }}>
//                     {y}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//           {loadedCodes.map((code, i) => {
//             const p     = data[code];
//             const score = activeYear ? toNum(p?.scoresByYear[activeYear]?.img_total) : null;
//             return (
//               <div key={code} style={{ padding: "12px 14px", borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none", borderTop: `3px solid ${INST_COLORS[i]}` }}>
//                 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: "0.8rem", color: INK900, lineHeight: 1.3, marginBottom: 3 }}>{p?.institute_name ?? code}</p>
//                     <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>{code}</p>
//                     {p?.categories?.[0] && (
//                       <span style={{ display: "inline-block", marginTop: 4, fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", color: INST_COLORS[i], border: `1px solid ${INST_COLORS[i]}`, padding: "1px 5px" }}>
//                         {p.categories[0]}
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ textAlign: "right", flexShrink: 0 }}>
//                     {score != null && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "1.5rem", color: INST_COLORS[i], lineHeight: 1 }}>{score.toFixed(2)}</p>}
//                     <button onClick={() => onRemove(code)} style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300, background: "none", border: `1px solid ${BORDER}`, padding: "2px 6px", cursor: "pointer", marginTop: 4 }}>✕</button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ═══════════════════ 1. NIRF SCORE CHART ═══════════════════ */}
//       <SectionHeader>NIRF Score Trends — All Parameters</SectionHeader>
//       <NIRFScoreChart profiles={data} codes={loadedCodes} years={allYears} />
//       {activeYear && <ScoreRadar profiles={data} codes={loadedCodes} year={activeYear} />}

//       {/* ═══════════════════ 2. SCORE BREAKDOWN TABLE ═══════════════════ */}
//       <SectionHeader>NIRF Score Breakdown · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {(() => { const vals = scoreRow("img_total"); return <MetricRow label="NIRF Total Score" values={vals} bestI={bestIdx(vals)} subLabel="/ 100" />; })()}
//       {ALL_SCORE_PARAMS.map(p => {
//         const vals = scoreRow(p.key);
//         if (vals.every(v => v == null)) return null;
//         const tvs = scoreRow(p.key.replace("_score", "_total"));
//         const maxT = tvs.find(v => v != null);
//         return <MetricRow key={p.key} label={p.label} values={vals} bestI={bestIdx(vals)} subLabel={maxT ? `/ ${maxT.toFixed(0)}` : undefined} />;
//       })}

//       {/* ═══════════════════ 3. SECTION CHARTS ═══════════════════ */}
//       <SectionHeader>Section-wise Comparison — Charts</SectionHeader>

//       {/* Section tab strip */}
//       <div style={{ display: "flex", overflowX: "auto", borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
//         {SECTION_TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveSecTab(tab.id)} style={{
//             fontFamily: BODY, fontWeight: activeSecTab === tab.id ? 600 : 400,
//             fontSize: "0.75rem", padding: "10px 16px",
//             background: "transparent", border: "none",
//             borderBottom: activeSecTab === tab.id ? `2px solid ${CRIMSON}` : "2px solid transparent",
//             marginBottom: "-2px",
//             color: activeSecTab === tab.id ? CRIMSON : INK300,
//             cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.12s",
//           }}>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       <SectionChart
//         key={activeSecTab}
//         profiles={data}
//         codes={loadedCodes}
//         sectionKw={activeSecDef.kw}
//         isAmt={activeSecDef.isAmt}
//         useRankingYear={activeSecDef.useRankingYear}
//       />

//       {/* ═══════════════════ 4. KEY METRICS TABLE ═══════════════════ */}
//       <SectionHeader>Key Metrics Table · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {[
//         { key: "pdf_total_intake",            label: "Total Intake",                   fmt: fmtN,   higher: false },
//         { key: "pdf_placement_placed",        label: "Students Placed",                fmt: fmtN,   higher: true  },
//         { key: "pdf_placement_higher",        label: "Higher Studies",                 fmt: fmtN,   higher: true  },
//         { key: "pdf_median_salary",           label: "Median Salary",                  fmt: fmtSal, higher: true  },
//         { key: "pdf_phd_ft_total",            label: "PhD Students — Full Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_total",            label: "PhD Students — Part Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_ft_graduated",        label: "PhD Graduated FT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_graduated",        label: "PhD Graduated PT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_projects",      label: "Sponsored Projects (3yr)",       fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_amount",        label: "Sponsored Amount (3yr)",         fmt: fmtAmt, higher: true  },
//         { key: "pdf_consultancy_projects",    label: "Consultancy Projects (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_consultancy_amount",      label: "Consultancy Amount (3yr)",       fmt: fmtAmt, higher: true  },
//         { key: "pdf_edp_participants",        label: "EDP/MDP Participants (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_capital_expenditure",     label: "Capital Expenditure (3yr sum)",  fmt: fmtAmt, higher: true  },
//         { key: "pdf_operational_expenditure", label: "Operational Expenditure (3yr)",  fmt: fmtAmt, higher: true  },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return <MetricRow key={m.key} label={m.label} values={vals} bestI={bestIdx(vals, m.higher)} fmt={m.fmt} />;
//       })}

//       <div style={{ padding: "14px 24px", borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>
//           ★ Best value in row &nbsp;·&nbsp; Solid line = first institute · dashed = others &nbsp;·&nbsp;
//           Score data from NIRF image scorecard &nbsp;·&nbsp; PDF aggregates are 3-year sums from institutional reports
//         </p>
//       </div>
//     </div>
//   );
// }

































// "use client";
// /**
//  * CompareView.tsx  (v3 — full rebuild)
//  * ─────────────────────────────────────────────────────────────────────────────
//  * 1. NIRF Score chart — every score column as toggle pill, multi-line per institute
//  * 2. Section charts — tabs for every section (Intake, Placement, PhD, Students,
//  *    Research, Financial…) each with their own metric toggle pills
//  * 3. Comparison table — every metric, best value highlighted ★
//  */

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid,
//   Tooltip, Legend, ResponsiveContainer,
//   RadarChart, Radar, PolarGrid, PolarAngleAxis,
// } from "recharts";
// import type { SearchHit } from "@/app/page";

// // ── Types ─────────────────────────────────────────────────────────────────────

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
//   category: string;
// }

// interface InstituteProfile {
//   institute_code: string;
//   institute_name: string;
//   categories: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   rawSections: { section: string; metrics: RawMetric[] }[];
// }

// type CompareData = Record<string, InstituteProfile>;

// interface Props {
//   institutes: SearchHit[];
//   onRemove: (code: string) => void;
//   onClose: () => void;
// }

// // ── Palette ───────────────────────────────────────────────────────────────────

// const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

// const METRIC_PALETTE = [
//   "#c0392b","#1a7a6e","#7d4fa8","#b5651d","#1d6fa8","#5a8a3a",
//   "#c0762b","#2e6da4","#8a5a2e","#3a8a5a","#6d2eb5","#b52e6d",
// ];

// // ── All NIRF score parameters ─────────────────────────────────────────────────

// const ALL_SCORE_PARAMS: { key: string; label: string; short: string; color: string }[] = [
//   { key: "img_ss_score",      label: "Student Strength",       short: "SS",    color: "#1a7a6e" },
//   { key: "img_fsr_score",     label: "Faculty-Student Ratio",  short: "FSR",   color: "#1d6fa8" },
//   { key: "img_fqe_score",     label: "Faculty Qualification",  short: "FQE",   color: "#7d4fa8" },
//   { key: "img_fru_score",     label: "Faculty Research",       short: "FRU",   color: "#5a8a3a" },
//   { key: "img_oe_mir_score",  label: "OE/MIR Score",           short: "OE+MIR",color: "#6b5a1a" },
//   { key: "img_oemir_score",   label: "OE/MIR (alt)",           short: "OEMIR", color: "#8b4513" },
//   { key: "img_pu_score",      label: "Perception",             short: "PU",    color: "#c0762b" },
//   { key: "img_qp_score",      label: "Quality Publication",    short: "QP",    color: "#2e6da4" },
//   { key: "img_ipr_score",     label: "IPR & Patents",          short: "IPR",   color: "#b5651d" },
//   { key: "img_fppp_score",    label: "Footprint of Projects",  short: "FPPP",  color: "#3a8a5a" },
//   { key: "img_gue_score",     label: "Graduate Performance",   short: "GUE",   color: "#1a5a7a" },
//   { key: "img_gphd_score",    label: "PhD Graduates",          short: "GPHD",  color: "#6d2eb5" },
//   { key: "img_rd_score",      label: "R&D",                    short: "RD",    color: "#c0392b" },
//   { key: "img_wd_score",      label: "Wider Impact",           short: "WD",    color: "#2b6dc0" },
//   { key: "img_escs_score",    label: "Economic & Social",      short: "ESCS",  color: "#8a5a2e" },
//   { key: "img_pcs_score",     label: "Peer Perception",        short: "PCS",   color: "#4a5568" },
//   { key: "img_pr_score",      label: "Perception (PR)",        short: "PR",    color: "#b52e6d" },
// ];

// // ── Section tab definitions ───────────────────────────────────────────────────

// // Section tab config — kw is matched against section name (case-insensitive)
// // excludeKw: if set, section name must NOT contain this (prevents cross-contamination)
// const SECTION_TABS: { id: string; label: string; kw: string; excludeKw?: string; isAmt: boolean; useRankingYear: boolean }[] = [
//   { id: "intake",       label: "Intake",        kw: "Sanctioned",         isAmt: false, useRankingYear: false },
//   { id: "placement",    label: "Placement",     kw: "Placement",          isAmt: false, useRankingYear: false },
//   { id: "students",     label: "Students",      kw: "Student",            excludeKw: "Ph.D", isAmt: false, useRankingYear: true  },
//   { id: "phd",          label: "PhD",           kw: "Ph.D",               isAmt: false, useRankingYear: false },
//   { id: "research",     label: "Research",      kw: "Sponsored Research", isAmt: false, useRankingYear: false },
//   { id: "consultancy",  label: "Consultancy",   kw: "Consultancy",        isAmt: true,  useRankingYear: false },
//   { id: "financial",    label: "Financial",     kw: "expenditure",        isAmt: true,  useRankingYear: false },
//   { id: "patents",      label: "Patents/IPR",   kw: "Patent",             isAmt: false, useRankingYear: false },
//   { id: "faculty",      label: "Faculty",       kw: "Faculty",            isAmt: false, useRankingYear: true  },
//   { id: "innovation",   label: "Innovation",    kw: "Startup",            isAmt: false, useRankingYear: false },
//   { id: "publications", label: "Publications",  kw: "Publication",        isAmt: false, useRankingYear: false },
//   { id: "edp",          label: "EDP/MDP",       kw: "Executive",          isAmt: false, useRankingYear: false },
//   { id: "scholarship",  label: "Scholarships",  kw: "Scholarship",        isAmt: false, useRankingYear: false },
//   { id: "graduation",   label: "Graduation",    kw: "Graduation Outcome", isAmt: false, useRankingYear: false },
//   { id: "facilities",   label: "Facilities",    kw: "Facilities",         isAmt: false, useRankingYear: true  },
// ];

// // ── CSS constants ─────────────────────────────────────────────────────────────

// const MONO  = "'IBM Plex Mono', monospace";
// const BODY  = "'Plus Jakarta Sans', sans-serif";
// const SERIF = "'DM Serif Display', serif";
// const BORDER       = "#e4e2dd";
// const OFF_WHITE    = "#f7f6f3";
// const CRIMSON      = "#c0392b";
// const CRIMSON_PALE = "#fdf1f0";
// const INK900       = "#1a1916";
// const INK500       = "#6b6860";
// const INK300       = "#a8a49c";
// const WHITE        = "#ffffff";

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const BAD_SET = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: unknown) => BAD_SET.has(String(v ?? "").trim().toLowerCase());
// const toNum = (v: unknown): number | null => {
//   if (v == null) return null;
//   const n = Number(String(v).replace(/,/g, ""));
//   return isNaN(n) ? null : n;
// };

// const fmtScore = (v: unknown) => { const n = toNum(v); return n != null ? n.toFixed(2) : "—"; };
// const fmtN     = (v: unknown) => { const n = toNum(v); return n != null ? n.toLocaleString("en-IN") : "—"; };
// const fmtAmt   = (v: unknown) => {
//   const n = toNum(v); if (n == null) return "—";
//   if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
//   if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// };
// const fmtSal = (v: unknown) => { const n = toNum(v); return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—"; };

// function bestIdx(vals: (number | null)[], higher = true): number {
//   let best: number | null = null, idx = -1;
//   vals.forEach((v, i) => {
//     if (v == null) return;
//     if (best == null || (higher ? v > best : v < best)) { best = v; idx = i; }
//   });
//   return idx;
// }

// function baseYear(y: string): string {
//   return y?.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y?.trim() ?? "";
// }
// function isRealYear(y: string): boolean {
//   return !!y && !isBAD(y) && /^\d{4}(-\d{2})?/.test(y.trim());
// }
// function sortYrs(years: string[]): string[] {
//   return [...years].sort((a, b) => {
//     const ay = parseInt(a), by = parseInt(b);
//     return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
//   });
// }

// const shortName = (p: InstituteProfile | undefined, code: string, words = 3) =>
//   p?.institute_name?.split(" ").slice(0, words).join(" ") ?? code;

// // ── UI primitives ─────────────────────────────────────────────────────────────

// function SectionHeader({ children }: { children: React.ReactNode }) {
//   return (
//     <div style={{
//       padding: "12px 24px 10px",
//       borderBottom: `1px solid ${BORDER}`,
//       borderTop: `3px solid ${CRIMSON}`,
//       background: CRIMSON_PALE,
//       marginTop: 28,
//     }}>
//       <p style={{
//         fontFamily: MONO, fontSize: "0.65rem",
//         textTransform: "uppercase", letterSpacing: "0.1em",
//         color: CRIMSON, fontWeight: 600,
//       }}>
//         {children}
//       </p>
//     </div>
//   );
// }

// function PillBar({
//   pills, active, onToggle, onAll,
// }: {
//   pills: { key: string; label: string; color?: string }[];
//   active: Set<string>;
//   onToggle: (k: string) => void;
//   onAll: () => void;
// }) {
//   const allOn = pills.every(p => active.has(p.key));
//   return (
//     <div style={{
//       display: "flex", flexWrap: "wrap", gap: 5,
//       padding: "10px 24px 8px",
//       borderBottom: `1px solid ${BORDER}`,
//       background: OFF_WHITE,
//     }}>
//       <span style={{
//         fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase",
//         letterSpacing: "0.08em", color: INK300,
//         alignSelf: "center", marginRight: 4, flexShrink: 0,
//       }}>
//         Parameters
//       </span>
//       <button onClick={onAll} style={{
//         fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//         border: `1px solid ${allOn ? CRIMSON : BORDER}`,
//         background: allOn ? CRIMSON : WHITE,
//         color: allOn ? WHITE : INK300,
//         cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//       }}>
//         All
//       </button>
//       {pills.map(p => {
//         const on  = active.has(p.key);
//         const col = p.color ?? CRIMSON;
//         return (
//           <button key={p.key} onClick={() => onToggle(p.key)} style={{
//             fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
//             border: `1px solid ${on ? col : BORDER}`,
//             background: on ? col : WHITE,
//             color: on ? WHITE : INK300,
//             cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
//             whiteSpace: "nowrap",
//           }}>
//             {p.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// function ChartTip({ active: isActive, payload, label, fmtFn }: {
//   active?: boolean; payload?: { name: string; value: unknown; color: string }[];
//   label?: string; fmtFn?: (v: unknown) => string;
// }) {
//   if (!isActive || !payload?.length) return null;
//   return (
//     <div style={{
//       background: "#1a1916", border: "1px solid #3d3b36",
//       fontFamily: MONO, fontSize: "0.67rem", color: "#f7f6f3", padding: "8px 12px",
//     }}>
//       <p style={{ color: INK300, marginBottom: 5 }}>{label}</p>
//       {payload.map((p, i) => (
//         <p key={i} style={{ color: p.color, marginBottom: 2 }}>
//           {p.name}: <strong>{fmtFn ? fmtFn(p.value) : (toNum(p.value)?.toFixed(2) ?? "—")}</strong>
//         </p>
//       ))}
//     </div>
//   );
// }

// const AX = { axisLine: false as const, tickLine: false as const, tick: { fontFamily: MONO, fontSize: 10, fill: INK300 } };

// // ── NIRF Score Chart ──────────────────────────────────────────────────────────

// function NIRFScoreChart({ profiles, codes, years }: { profiles: CompareData; codes: string[]; years: number[] }) {
//   const available = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => years.some(y => toNum(profiles[c]?.scoresByYear[y]?.[p.key]) != null))
//   );

//   const [active, setActive] = useState<Set<string>>(
//     () => new Set(available.slice(0, 5).map(p => p.key))
//   );

//   const toggle = (k: string) => setActive(prev => {
//     const s = new Set(prev);
//     if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
//     return s;
//   });
//   const toggleAll = () => setActive(prev =>
//     prev.size === available.length ? new Set([available[0]?.key ?? ""]) : new Set(available.map(p => p.key))
//   );

//   const activeParams = available.filter(p => active.has(p.key));

//   const chartData = years.slice().reverse().map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const p of activeParams) {
//         const v = toNum(profiles[code]?.scoresByYear[yr]?.[p.key]);
//         if (v != null) pt[`${code}::${p.key}`] = v;
//       }
//     }
//     return pt;
//   });

//   if (!available.length) return (
//     <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//       No score data available.
//     </div>
//   );

//   return (
//     <>
//       <PillBar
//         pills={available.map(p => ({ key: p.key, label: p.label, color: p.color }))}
//         active={active}
//         onToggle={toggle}
//         onAll={toggleAll}
//       />
//       <div style={{ padding: "20px 24px 8px" }}>
//         <ResponsiveContainer width="100%" height={360}>
//           <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
//             <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//             <XAxis dataKey="year" {...AX} />
//             <YAxis domain={[0, "auto"]} {...AX} width={32} />
//             <Tooltip content={<ChartTip fmtFn={fmtScore} />} />
//             <Legend
//               wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 10 }}
//               formatter={(value: string) => {
//                 const sep = value.indexOf("::");
//                 const code = value.slice(0, sep);
//                 const paramKey = value.slice(sep + 2);
//                 const pLabel = ALL_SCORE_PARAMS.find(p => p.key === paramKey)?.short ?? paramKey;
//                 const instFull = profiles[code]?.institute_name ?? code;
//                 return `${instFull} · ${pLabel}`;
//               }}
//             />
//             {codes.flatMap((code, ci) =>
//               activeParams.map(p => {
//                 const col   = ci === 0 ? p.color : INST_COLORS[ci];
//                 const dash  = ci === 0 ? undefined : "6 3";
//                 const dKey  = `${code}::${p.key}`;
//                 const hasData = chartData.some(d => d[dKey] != null);
//                 if (!hasData) return null;
//                 return (
//                   <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                     stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
//                     strokeDasharray={dash}
//                     dot={{ r: 3, fill: col, strokeWidth: 0 }}
//                     activeDot={{ r: 5 }} connectNulls
//                   />
//                 );
//               })
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </>
//   );
// }

// // ── Radar ─────────────────────────────────────────────────────────────────────

// function ScoreRadar({ profiles, codes, year }: { profiles: CompareData; codes: string[]; year: number }) {
//   const params = ALL_SCORE_PARAMS.filter(p =>
//     codes.some(c => toNum(profiles[c]?.scoresByYear[year]?.[p.key]) != null)
//   );
//   if (params.length < 3) return null;

//   const data = params.map(p => {
//     const pt: Record<string, unknown> = { param: p.short };
//     for (const code of codes) {
//       const row = profiles[code]?.scoresByYear[year];
//       const v = toNum(row?.[p.key]);
//       const t = toNum(row?.[p.key.replace("_score", "_total")]) ?? 100;
//       pt[code] = v != null && t > 0 ? +((v / t) * 100).toFixed(1) : 0;
//     }
//     return pt;
//   });

//   return (
//     <div style={{ padding: "16px 24px 8px" }}>
//       <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
//         Score Profile Radar — % of parameter maximum
//       </p>
//       <ResponsiveContainer width="100%" height={300}>
//         <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
//           <PolarGrid stroke={BORDER} />
//           <PolarAngleAxis dataKey="param" tick={{ fontFamily: MONO, fontSize: 9, fill: INK500 }} />
//           {codes.map((code, i) => (
//             <Radar key={code} name={shortName(profiles[code], code, 3)} dataKey={code}
//               stroke={INST_COLORS[i]} fill={INST_COLORS[i]} fillOpacity={0.09} strokeWidth={2}
//             />
//           ))}
//           <Legend
//             wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem" }}
//             formatter={(_v, entry) => {
//               const idx = codes.indexOf(String(entry.dataKey));
//               return <span style={{ color: INST_COLORS[idx] }}>{shortName(profiles[String(entry.dataKey)], String(entry.dataKey), 3)}</span>;
//             }}
//           />
//         </RadarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }

// // ── Section Chart — Program dropdown + Metric controls ───────────────────────

// // Indexed data: code → program → metric → year → value
// type SectionIndex = Map<string, Map<string, Map<string, Map<string, number>>>>;

// function buildSectionIndex(
//   profiles: CompareData,
//   codes: string[],
//   sectionKw: string,
//   useRankingYear: boolean,
//   excludeKw?: string,
// ): { index: SectionIndex; programs: string[]; metrics: string[]; years: string[] } {
//   const BAD_PROG  = new Set(["", "-", "nan", "<na>", "null", "undefined", "none", "n/a"]);
//   const progSet   = new Set<string>();
//   const metricSet = new Set<string>();
//   const yearSet   = new Set<string>();
//   const index: SectionIndex = new Map();

//   for (const code of codes) {
//     const codeMap: Map<string, Map<string, Map<string, number>>> = new Map();
//     index.set(code, codeMap);
//     const p = profiles[code]; if (!p) continue;
//     for (const sec of p.rawSections) {
//       const secLower = sec.section.toLowerCase();
//       if (!secLower.includes(sectionKw.toLowerCase())) continue;
//       if (excludeKw && secLower.includes(excludeKw.toLowerCase())) continue;
//       for (const m of sec.metrics) {
//         if (isBAD(m.value) || m.metric.toLowerCase().includes("in words")) continue;
//         const v = toNum(m.value);
//         if (v == null || v < 0) continue;
//         const yr = useRankingYear
//           ? String(m.ranking_year)
//           : (isRealYear(m.year) ? baseYear(m.year) : String(m.ranking_year));
//         if (!yr) continue;
//         const prog   = BAD_PROG.has((m.program ?? "").trim().toLowerCase()) ? "(All)" : m.program.trim();
//         const metric = m.metric.trim();
//         progSet.add(prog); metricSet.add(metric); yearSet.add(yr);
//         if (!codeMap.has(prog)) codeMap.set(prog, new Map());
//         const pm = codeMap.get(prog)!;
//         if (!pm.has(metric)) pm.set(metric, new Map());
//         const mm = pm.get(metric)!;
//         mm.set(yr, Math.max(mm.get(yr) ?? 0, v));
//       }
//     }
//   }

//   const programs = Array.from(progSet).sort((a, b) => {
//     if (a === "(All)") return -1; if (b === "(All)") return 1;
//     const rank = (s: string) => s.startsWith("UG") ? 0 : s.startsWith("PG-Int") ? 2 : s.startsWith("PG") ? 1 : 3;
//     return rank(a) !== rank(b) ? rank(a) - rank(b) : a.localeCompare(b);
//   });
//   return { index, programs, metrics: Array.from(metricSet).sort(), years: sortYrs(Array.from(yearSet)) };
// }

// const SEL: React.CSSProperties = {
//   fontFamily: MONO, fontSize: "0.72rem",
//   background: WHITE, color: INK900,
//   border: `1px solid ${BORDER}`,
//   padding: "6px 28px 6px 10px",
//   cursor: "pointer", outline: "none",
//   appearance: "none" as const,
//   WebkitAppearance: "none" as const,
//   minWidth: 160, maxWidth: 320, letterSpacing: "0.02em",
// };

// function SectionChart({
//   profiles, codes, sectionKw, excludeKw, isAmt, useRankingYear,
// }: {
//   profiles: CompareData; codes: string[];
//   sectionKw: string; excludeKw?: string; isAmt: boolean; useRankingYear: boolean;
// }) {
//   const { index, programs, metrics, years } = buildSectionIndex(profiles, codes, sectionKw, useRankingYear, excludeKw);

//   const [selProg,    setSelProg]    = useState<string>(() => programs[0] ?? "");
//   const [selMetrics, setSelMetrics] = useState<Set<string>>(() => new Set(metrics.slice(0, 4)));

//   React.useEffect(() => {
//     setSelProg(programs[0] ?? "");
//     setSelMetrics(new Set(metrics.slice(0, 4)));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [sectionKw]);

//   if (!programs.length || !metrics.length || !years.length) {
//     return (
//       <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
//         No data found for this section in the selected institutes.
//       </div>
//     );
//   }

//   const fmtFn       = isAmt ? fmtAmt : fmtN;
//   const hasPrograms = programs.length > 1 || programs[0] !== "(All)";
//   const useDropdown = metrics.length > 10;

//   const toggleMetric = (m: string) => setSelMetrics(prev => {
//     const s = new Set(prev);
//     if (s.has(m)) { if (s.size > 1) s.delete(m); } else s.add(m);
//     return s;
//   });
//   const activeMetrics = metrics.filter(m => selMetrics.has(m));

//   const chartData = years.map(yr => {
//     const pt: Record<string, unknown> = { year: yr };
//     for (const code of codes) {
//       for (const metric of activeMetrics) {
//         const v = index.get(code)?.get(selProg)?.get(metric)?.get(yr);
//         if (v != null) pt[`${code}::${metric}`] = v;
//       }
//     }
//     return pt;
//   });
//   const hasData = chartData.some(pt => Object.keys(pt).length > 1);

//   return (
//     <>
//       {/* ── Controls ── */}
//       <div style={{
//         display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap",
//         padding: "14px 24px 12px",
//         borderBottom: `1px solid ${BORDER}`,
//         background: OFF_WHITE,
//       }}>

//         {/* Program dropdown */}
//         {hasPrograms && (
//           <div style={{ flexShrink: 0 }}>
//             <label style={{ display: "block", fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: INK300, marginBottom: 5 }}>
//               Program
//             </label>
//             <div style={{ position: "relative", display: "inline-block" }}>
//               <select value={selProg} onChange={e => setSelProg(e.target.value)} style={SEL}>
//                 {programs.map(p => <option key={p} value={p}>{p}</option>)}
//               </select>
//               <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: INK300, fontSize: "0.65rem" }}>▾</span>
//             </div>
//           </div>
//         )}

//         {/* Metrics — pill toggles when ≤10, chip+dropdown when >10 */}
//         <div style={{ flex: 1, minWidth: 260 }}>
//           <label style={{ display: "block", fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: INK300, marginBottom: 5 }}>
//             Metrics {useDropdown && <span style={{ color: CRIMSON }}>({selMetrics.size} selected)</span>}
//           </label>

//           {!useDropdown ? (
//             <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
//               <button onClick={() => setSelMetrics(new Set(metrics))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "3px 8px", border: `1px solid ${selMetrics.size === metrics.length ? CRIMSON : BORDER}`, background: selMetrics.size === metrics.length ? CRIMSON : WHITE, color: selMetrics.size === metrics.length ? WHITE : INK300, cursor: "pointer", borderRadius: 2 }}>
//                 All
//               </button>
//               {metrics.map((m, i) => {
//                 const on = selMetrics.has(m);
//                 const col = METRIC_PALETTE[i % METRIC_PALETTE.length];
//                 return (
//                   <button key={m} onClick={() => toggleMetric(m)} title={m} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px", border: `1px solid ${on ? col : BORDER}`, background: on ? col : WHITE, color: on ? WHITE : INK300, cursor: "pointer", borderRadius: 2, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
//                     {m.length > 32 ? m.slice(0, 30) + "…" : m}
//                   </button>
//                 );
//               })}
//             </div>
//           ) : (
//             /* Many metrics → active chips + "Add metric" dropdown */
//             <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
//               {Array.from(selMetrics).map((m) => {
//                 const col = METRIC_PALETTE[metrics.indexOf(m) % METRIC_PALETTE.length];
//                 return (
//                   <div key={m} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px 4px 10px", border: `1px solid ${col}`, background: `${col}18`, borderRadius: 3, maxWidth: 260 }}>
//                     <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
//                     <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INK900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }} title={m}>
//                       {m.length > 28 ? m.slice(0, 26) + "…" : m}
//                     </span>
//                     <button onClick={() => toggleMetric(m)} style={{ background: "none", border: "none", cursor: "pointer", color: INK300, fontSize: "0.65rem", padding: 0, flexShrink: 0, lineHeight: 1 }}>✕</button>
//                   </div>
//                 );
//               })}
//               <div style={{ position: "relative", display: "inline-block" }}>
//                 <select value="" onChange={e => { if (e.target.value) toggleMetric(e.target.value); }} style={{ ...SEL, minWidth: 180, color: INK500 }}>
//                   <option value="">+ Add metric…</option>
//                   {metrics.filter(m => !selMetrics.has(m)).map(m => (
//                     <option key={m} value={m}>{m.length > 56 ? m.slice(0, 54) + "…" : m}</option>
//                   ))}
//                 </select>
//                 <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: INK300, fontSize: "0.65rem" }}>▾</span>
//               </div>
//               <button onClick={() => setSelMetrics(new Set([metrics[0]]))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "4px 10px", border: `1px solid ${BORDER}`, background: WHITE, color: INK300, cursor: "pointer", borderRadius: 2 }}>Clear</button>
//               <button onClick={() => setSelMetrics(new Set(metrics))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "4px 10px", border: `1px solid ${BORDER}`, background: WHITE, color: INK300, cursor: "pointer", borderRadius: 2 }}>All</button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Chart ── */}
//       {!hasData ? (
//         <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.72rem" }}>
//           No data for the selected program / metric combination.
//         </div>
//       ) : (
//         <div style={{ padding: "16px 24px 8px" }}>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
//               <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
//               <XAxis dataKey="year" {...AX} />
//               <YAxis {...AX} />
//               <Tooltip content={<ChartTip fmtFn={fmtFn} />} />
//               <Legend
//                 wrapperStyle={{ fontFamily: MONO, fontSize: "0.6rem", paddingTop: 10 }}
//                 formatter={(value: string) => {
//                   const sep    = value.indexOf("::");
//                   const code   = value.slice(0, sep);
//                   const metric = value.slice(sep + 2);
//                   const instFull = profiles[code]?.institute_name ?? code;
//                   return `${instFull} · ${metric}`;
//                 }}
//               />
//               {codes.flatMap((code, ci) =>
//                 activeMetrics.map((metric) => {
//                   const mi   = metrics.indexOf(metric);
//                   const col  = ci === 0 ? METRIC_PALETTE[mi % METRIC_PALETTE.length] : INST_COLORS[ci];
//                   const dash = ci === 0 ? undefined : "6 3";
//                   const dKey = `${code}::${metric}`;
//                   if (!chartData.some(d => d[dKey] != null)) return null;
//                   return (
//                     <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
//                       stroke={col} strokeWidth={ci === 0 ? 2.2 : 1.8} strokeDasharray={dash}
//                       dot={{ r: 3, fill: col, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls
//                     />
//                   );
//                 })
//               )}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       )}
//     </>
//   );
// }


// // ── Table primitives ──────────────────────────────────────────────────────────

// function TableColHeader({ codes, profiles }: { codes: string[]; profiles: CompareData }) {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${codes.length}, 1fr)`, borderBottom: `2px solid ${BORDER}`, background: OFF_WHITE }}>
//       <div style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
//         <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>Metric</span>
//       </div>
//       {codes.map((code, i) => (
//         <div key={code} style={{ padding: "8px 14px", textAlign: "center", borderRight: i < codes.length - 1 ? `1px solid ${BORDER}` : "none" }}>
//           <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INST_COLORS[i], fontWeight: 600 }}>
//             {profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? code}
//           </span>
//         </div>
//       ))}
//     </div>
//   );
// }

// function MetricRow({ label, values, bestI, fmt, subLabel }: {
//   label: string; values: (number | null)[]; bestI: number;
//   fmt?: (v: unknown) => string; subLabel?: string;
// }) {
//   const n = values.length;
//   const fmtFn = fmt ?? fmtScore;
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${n}, 1fr)`, borderBottom: `1px solid ${BORDER}`, minHeight: 38 }}>
//       <div style={{ padding: "9px 14px", background: OFF_WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
//         <span style={{ fontFamily: BODY, fontSize: "0.74rem", color: INK900 }}>{label}</span>
//         {subLabel && <span style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300 }}>{subLabel}</span>}
//       </div>
//       {values.map((v, i) => {
//         const isBest = i === bestI && v != null;
//         return (
//           <div key={i} style={{ padding: "9px 14px", borderRight: i < n - 1 ? `1px solid ${BORDER}` : "none", background: isBest ? CRIMSON_PALE : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: isBest ? 700 : 400, color: isBest ? CRIMSON : (v != null ? INK900 : INK300) }}>
//               {v != null ? fmtFn(v) : "—"}
//               {isBest && v != null && <span style={{ marginLeft: 3, fontSize: "0.55rem" }}> ★</span>}
//             </span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main ──────────────────────────────────────────────────────────────────────

// export default function CompareView({ institutes, onRemove }: Props) {
//   const [data,         setData]         = useState<CompareData>({});
//   const [loading,      setLoading]      = useState(true);
//   const [activeYear,   setActiveYear]   = useState<number | null>(null);
//   const [activeSecTab, setActiveSecTab] = useState("intake");

//   const codes = institutes.map(i => i.institute_code);

//   useEffect(() => {
//     if (!codes.length) return;
//     setLoading(true);
//     fetch(`/api/compare?codes=${codes.join(",")}`)
//       .then(r => r.json())
//       .then((d: CompareData) => {
//         setData(d);
//         const yearSets = codes.map(c => new Set(Object.keys(d[c]?.scoresByYear ?? {}).map(Number)));
//         const common = Array.from(yearSets[0] ?? new Set<number>())
//           .filter(y => yearSets.every(s => s.has(y))).sort((a, b) => b - a);
//         const fallback = Array.from(
//           new Set(codes.flatMap(c => Object.keys(d[c]?.scoresByYear ?? {}).map(Number)))
//         ).sort((a, b) => b - a);
//         setActiveYear(common[0] ?? fallback[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [codes.join(",")]);

//   const allYears    = Array.from(new Set(codes.flatMap(c => Object.keys(data[c]?.scoresByYear ?? {}).map(Number)))).sort((a, b) => b - a);
//   const loadedCodes = codes.filter(c => !!data[c]);

//   const scoreRow = useCallback((key: string) =>
//     loadedCodes.map(c => toNum(data[c]?.scoresByYear[activeYear ?? 0]?.[key])),
//   [loadedCodes, data, activeYear]);

//   if (loading) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>Loading comparison…</p>
//       </div>
//     );
//   }

//   const activeSecDef = SECTION_TABS.find(t => t.id === activeSecTab) ?? SECTION_TABS[0];

//   return (
//     <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 100px" }}>

//       {/* ── Sticky header ── */}
//       <div style={{ position: "sticky", top: 52, zIndex: 40, background: WHITE, borderBottom: `2px solid ${BORDER}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
//         <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${loadedCodes.length}, 1fr)` }}>
//           <div style={{ padding: "14px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
//             <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: CRIMSON }}>Comparison</p>
//             {allYears.length > 1 && (
//               <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
//                 {allYears.slice(0, 6).map(y => (
//                   <button key={y} onClick={() => setActiveYear(y)} style={{
//                     fontFamily: MONO, fontSize: "0.58rem", padding: "2px 6px",
//                     border: `1px solid ${activeYear === y ? CRIMSON : BORDER}`,
//                     background: activeYear === y ? CRIMSON : "transparent",
//                     color: activeYear === y ? WHITE : INK500, cursor: "pointer",
//                   }}>
//                     {y}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//           {loadedCodes.map((code, i) => {
//             const p     = data[code];
//             const score = activeYear ? toNum(p?.scoresByYear[activeYear]?.img_total) : null;
//             return (
//               <div key={code} style={{ padding: "12px 14px", borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none", borderTop: `3px solid ${INST_COLORS[i]}` }}>
//                 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: "0.8rem", color: INK900, lineHeight: 1.3, marginBottom: 3 }}>{p?.institute_name ?? code}</p>
//                     <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>{code}</p>
//                     {p?.categories?.[0] && (
//                       <span style={{ display: "inline-block", marginTop: 4, fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", color: INST_COLORS[i], border: `1px solid ${INST_COLORS[i]}`, padding: "1px 5px" }}>
//                         {p.categories[0]}
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ textAlign: "right", flexShrink: 0 }}>
//                     {score != null && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "1.5rem", color: INST_COLORS[i], lineHeight: 1 }}>{score.toFixed(2)}</p>}
//                     <button onClick={() => onRemove(code)} style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300, background: "none", border: `1px solid ${BORDER}`, padding: "2px 6px", cursor: "pointer", marginTop: 4 }}>✕</button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ═══════════════════ 1. NIRF SCORE CHART ═══════════════════ */}
//       <SectionHeader>NIRF Score Trends — All Parameters</SectionHeader>
//       <NIRFScoreChart profiles={data} codes={loadedCodes} years={allYears} />
//       {activeYear && <ScoreRadar profiles={data} codes={loadedCodes} year={activeYear} />}

//       {/* ═══════════════════ 2. SCORE BREAKDOWN TABLE ═══════════════════ */}
//       <SectionHeader>NIRF Score Breakdown · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {(() => { const vals = scoreRow("img_total"); return <MetricRow label="NIRF Total Score" values={vals} bestI={bestIdx(vals)} subLabel="/ 100" />; })()}
//       {ALL_SCORE_PARAMS.map(p => {
//         const vals = scoreRow(p.key);
//         if (vals.every(v => v == null)) return null;
//         const tvs = scoreRow(p.key.replace("_score", "_total"));
//         const maxT = tvs.find(v => v != null);
//         return <MetricRow key={p.key} label={p.label} values={vals} bestI={bestIdx(vals)} subLabel={maxT ? `/ ${maxT.toFixed(0)}` : undefined} />;
//       })}

//       {/* ═══════════════════ 3. SECTION CHARTS ═══════════════════ */}
//       <SectionHeader>Section-wise Comparison — Charts</SectionHeader>

//       {/* Section tab strip */}
//       <div style={{ display: "flex", overflowX: "auto", borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
//         {SECTION_TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveSecTab(tab.id)} style={{
//             fontFamily: BODY, fontWeight: activeSecTab === tab.id ? 600 : 400,
//             fontSize: "0.75rem", padding: "10px 16px",
//             background: "transparent", border: "none",
//             borderBottom: activeSecTab === tab.id ? `2px solid ${CRIMSON}` : "2px solid transparent",
//             marginBottom: "-2px",
//             color: activeSecTab === tab.id ? CRIMSON : INK300,
//             cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.12s",
//           }}>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       <SectionChart
//         key={activeSecTab}
//         profiles={data}
//         codes={loadedCodes}
//         sectionKw={activeSecDef.kw}
//         excludeKw={activeSecDef.excludeKw}
//         isAmt={activeSecDef.isAmt}
//         useRankingYear={activeSecDef.useRankingYear}
//       />

//       {/* ═══════════════════ 4. KEY METRICS TABLE ═══════════════════ */}
//       <SectionHeader>Key Metrics Table · {activeYear ?? "Latest Year"}</SectionHeader>
//       <TableColHeader codes={loadedCodes} profiles={data} />
//       {[
//         { key: "pdf_total_intake",            label: "Total Intake",                   fmt: fmtN,   higher: false },
//         { key: "pdf_placement_placed",        label: "Students Placed",                fmt: fmtN,   higher: true  },
//         { key: "pdf_placement_higher",        label: "Higher Studies",                 fmt: fmtN,   higher: true  },
//         { key: "pdf_median_salary",           label: "Median Salary",                  fmt: fmtSal, higher: true  },
//         { key: "pdf_phd_ft_total",            label: "PhD Students — Full Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_total",            label: "PhD Students — Part Time",       fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_ft_graduated",        label: "PhD Graduated FT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_phd_pt_graduated",        label: "PhD Graduated PT (3yr)",         fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_projects",      label: "Sponsored Projects (3yr)",       fmt: fmtN,   higher: true  },
//         { key: "pdf_sponsored_amount",        label: "Sponsored Amount (3yr)",         fmt: fmtAmt, higher: true  },
//         { key: "pdf_consultancy_projects",    label: "Consultancy Projects (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_consultancy_amount",      label: "Consultancy Amount (3yr)",       fmt: fmtAmt, higher: true  },
//         { key: "pdf_edp_participants",        label: "EDP/MDP Participants (3yr)",     fmt: fmtN,   higher: true  },
//         { key: "pdf_capital_expenditure",     label: "Capital Expenditure (3yr sum)",  fmt: fmtAmt, higher: true  },
//         { key: "pdf_operational_expenditure", label: "Operational Expenditure (3yr)",  fmt: fmtAmt, higher: true  },
//       ].map(m => {
//         const vals = scoreRow(m.key);
//         if (vals.every(v => v == null)) return null;
//         return <MetricRow key={m.key} label={m.label} values={vals} bestI={bestIdx(vals, m.higher)} fmt={m.fmt} />;
//       })}

//       <div style={{ padding: "14px 24px", borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
//         <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>
//           ★ Best value in row &nbsp;·&nbsp; Solid line = first institute · dashed = others &nbsp;·&nbsp;
//           Score data from NIRF image scorecard &nbsp;·&nbsp; PDF aggregates are 3-year sums from institutional reports
//         </p>
//       </div>
//     </div>
//   );
// }


































"use client";
/**
 * CompareView.tsx  (v3 — full rebuild)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. NIRF Score chart — every score column as toggle pill, multi-line per institute
 * 2. Section charts — tabs for every section (Intake, Placement, PhD, Students,
 *    Research, Financial…) each with their own metric toggle pills
 * 3. Comparison table — every metric, best value highlighted ★
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
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
  scoresByYear: Record<number, Record<string, unknown>>;
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
  "#c0392b","#1a7a6e","#7d4fa8","#b5651d","#1d6fa8","#5a8a3a",
  "#c0762b","#2e6da4","#8a5a2e","#3a8a5a","#6d2eb5","#b52e6d",
];

// ── All NIRF score parameters ─────────────────────────────────────────────────

const ALL_SCORE_PARAMS: { key: string; label: string; short: string; color: string }[] = [
  { key: "img_ss_score",      label: "Student Strength",       short: "SS",    color: "#1a7a6e" },
  { key: "img_fsr_score",     label: "Faculty-Student Ratio",  short: "FSR",   color: "#1d6fa8" },
  { key: "img_fqe_score",     label: "Faculty Qualification",  short: "FQE",   color: "#7d4fa8" },
  { key: "img_fru_score",     label: "Faculty Research",       short: "FRU",   color: "#5a8a3a" },
  { key: "img_oe_mir_score",  label: "OE/MIR Score",           short: "OE+MIR",color: "#6b5a1a" },
  { key: "img_oemir_score",   label: "OE/MIR (alt)",           short: "OEMIR", color: "#8b4513" },
  { key: "img_pu_score",      label: "Perception",             short: "PU",    color: "#c0762b" },
  { key: "img_qp_score",      label: "Quality Publication",    short: "QP",    color: "#2e6da4" },
  { key: "img_ipr_score",     label: "IPR & Patents",          short: "IPR",   color: "#b5651d" },
  { key: "img_fppp_score",    label: "Footprint of Projects",  short: "FPPP",  color: "#3a8a5a" },
  { key: "img_gue_score",     label: "Graduate Performance",   short: "GUE",   color: "#1a5a7a" },
  { key: "img_gphd_score",    label: "PhD Graduates",          short: "GPHD",  color: "#6d2eb5" },
  { key: "img_rd_score",      label: "R&D",                    short: "RD",    color: "#c0392b" },
  { key: "img_wd_score",      label: "Wider Impact",           short: "WD",    color: "#2b6dc0" },
  { key: "img_escs_score",    label: "Economic & Social",      short: "ESCS",  color: "#8a5a2e" },
  { key: "img_pcs_score",     label: "Peer Perception",        short: "PCS",   color: "#4a5568" },
  { key: "img_pr_score",      label: "Perception (PR)",        short: "PR",    color: "#b52e6d" },
];

// ── Section tab definitions ───────────────────────────────────────────────────

// Section tab config — kw is matched against section name (case-insensitive)
// excludeKw: if set, section name must NOT contain this (prevents cross-contamination)
const SECTION_TABS: { id: string; label: string; kw: string; excludeKw?: string; isAmt: boolean; useRankingYear: boolean }[] = [
  { id: "intake",       label: "Intake",        kw: "Sanctioned",         isAmt: false, useRankingYear: false },
  { id: "placement",    label: "Placement",     kw: "Placement",          isAmt: false, useRankingYear: false },
  { id: "students",     label: "Students",      kw: "Student",            excludeKw: "Ph.D", isAmt: false, useRankingYear: true  },
  { id: "phd",          label: "PhD",           kw: "Ph.D",               isAmt: false, useRankingYear: false },
  { id: "research",     label: "Research",      kw: "Sponsored Research", isAmt: false, useRankingYear: false },
  { id: "consultancy",  label: "Consultancy",   kw: "Consultancy",        isAmt: true,  useRankingYear: false },
  { id: "financial",    label: "Financial",     kw: "expenditure",        isAmt: true,  useRankingYear: false },
  { id: "patents",      label: "Patents/IPR",   kw: "Patent",             isAmt: false, useRankingYear: false },
  { id: "faculty",      label: "Faculty",       kw: "Faculty",            isAmt: false, useRankingYear: true  },
  { id: "innovation",   label: "Innovation",    kw: "Startup",            isAmt: false, useRankingYear: false },
  { id: "publications", label: "Publications",  kw: "Publication",        isAmt: false, useRankingYear: false },
  { id: "edp",          label: "EDP/MDP",       kw: "Executive",          isAmt: false, useRankingYear: false },
  { id: "scholarship",  label: "Scholarships",  kw: "Scholarship",        isAmt: false, useRankingYear: false },
  { id: "graduation",   label: "Graduation",    kw: "Graduation Outcome", isAmt: false, useRankingYear: false },
  { id: "facilities",   label: "Facilities",    kw: "Facilities",         isAmt: false, useRankingYear: true  },
];

// ── CSS constants ─────────────────────────────────────────────────────────────

const MONO  = "'IBM Plex Mono', monospace";
const BODY  = "'Plus Jakarta Sans', sans-serif";
const SERIF = "'DM Serif Display', serif";
const BORDER       = "#e4e2dd";
const OFF_WHITE    = "#f7f6f3";
const CRIMSON      = "#c0392b";
const CRIMSON_PALE = "#fdf1f0";
const INK900       = "#1a1916";
const INK500       = "#6b6860";
const INK300       = "#a8a49c";
const WHITE        = "#ffffff";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BAD_SET = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
const isBAD = (v: unknown) => BAD_SET.has(String(v ?? "").trim().toLowerCase());
const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = Number(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};

const fmtScore = (v: unknown) => { const n = toNum(v); return n != null ? n.toFixed(2) : "—"; };
const fmtN     = (v: unknown) => { const n = toNum(v); return n != null ? n.toLocaleString("en-IN") : "—"; };
const fmtAmt   = (v: unknown) => {
  const n = toNum(v); if (n == null) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const fmtSal = (v: unknown) => { const n = toNum(v); return n != null ? `₹${(n / 1e5).toFixed(1)} L` : "—"; };

function bestIdx(vals: (number | null)[], higher = true): number {
  let best: number | null = null, idx = -1;
  vals.forEach((v, i) => {
    if (v == null) return;
    if (best == null || (higher ? v > best : v < best)) { best = v; idx = i; }
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
    const ay = parseInt(a), by = parseInt(b);
    return isNaN(ay) || isNaN(by) ? a.localeCompare(b) : ay - by;
  });
}

const shortName = (p: InstituteProfile | undefined, code: string, words = 3) =>
  p?.institute_name?.split(" ").slice(0, words).join(" ") ?? code;

// ── UI primitives ─────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "12px 24px 10px",
      borderBottom: `1px solid ${BORDER}`,
      borderTop: `3px solid ${CRIMSON}`,
      background: CRIMSON_PALE,
      marginTop: 28,
    }}>
      <p style={{
        fontFamily: MONO, fontSize: "0.65rem",
        textTransform: "uppercase", letterSpacing: "0.1em",
        color: CRIMSON, fontWeight: 600,
      }}>
        {children}
      </p>
    </div>
  );
}

function PillBar({
  pills, active, onToggle, onAll,
}: {
  pills: { key: string; label: string; color?: string }[];
  active: Set<string>;
  onToggle: (k: string) => void;
  onAll: () => void;
}) {
  const allOn = pills.every(p => active.has(p.key));
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 5,
      padding: "10px 24px 8px",
      borderBottom: `1px solid ${BORDER}`,
      background: OFF_WHITE,
    }}>
      <span style={{
        fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase",
        letterSpacing: "0.08em", color: INK300,
        alignSelf: "center", marginRight: 4, flexShrink: 0,
      }}>
        Parameters
      </span>
      <button onClick={onAll} style={{
        fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
        border: `1px solid ${allOn ? CRIMSON : BORDER}`,
        background: allOn ? CRIMSON : WHITE,
        color: allOn ? WHITE : INK300,
        cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
      }}>
        All
      </button>
      {pills.map(p => {
        const on  = active.has(p.key);
        const col = p.color ?? CRIMSON;
        return (
          <button key={p.key} onClick={() => onToggle(p.key)} style={{
            fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px",
            border: `1px solid ${on ? col : BORDER}`,
            background: on ? col : WHITE,
            color: on ? WHITE : INK300,
            cursor: "pointer", borderRadius: 2, transition: "all 0.12s",
            whiteSpace: "nowrap",
          }}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartTip({ active: isActive, payload, label, fmtFn }: {
  active?: boolean; payload?: { name: string; value: unknown; color: string }[];
  label?: string; fmtFn?: (v: unknown) => string;
}) {
  if (!isActive || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a1916", border: "1px solid #3d3b36",
      fontFamily: MONO, fontSize: "0.67rem", color: "#f7f6f3", padding: "8px 12px",
    }}>
      <p style={{ color: INK300, marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{fmtFn ? fmtFn(p.value) : (toNum(p.value)?.toFixed(2) ?? "—")}</strong>
        </p>
      ))}
    </div>
  );
}

const AX = { axisLine: false as const, tickLine: false as const, tick: { fontFamily: MONO, fontSize: 10, fill: INK300 } };

// ── NIRF Score Chart ──────────────────────────────────────────────────────────

function NIRFScoreChart({ profiles, codes, years, categoryFilter }: { profiles: CompareData; codes: string[]; years: number[]; categoryFilter?: string }) {
  // Get score row for a code+year filtered by category using composite key
  const getRow = (code: string, yr: number): Record<string, unknown> | undefined => {
    const profile = profiles[code];
    if (!profile) return undefined;
    const sby = profile.scoresByYear as Record<string, Record<string, unknown>>;
    if (categoryFilter) {
      const catKey = `${yr}::${categoryFilter}`;
      if (sby[catKey]) return sby[catKey];
    }
    return sby[String(yr)];
  };

  const available = ALL_SCORE_PARAMS.filter(p =>
    codes.some(c => years.some(y => toNum(getRow(c, y)?.[p.key]) != null))
  );

  const [active, setActive] = useState<Set<string>>(
    () => new Set(available.slice(0, 5).map(p => p.key))
  );

  const toggle = (k: string) => setActive(prev => {
    const s = new Set(prev);
    if (s.has(k)) { if (s.size > 1) s.delete(k); } else s.add(k);
    return s;
  });
  const toggleAll = () => setActive(prev =>
    prev.size === available.length ? new Set([available[0]?.key ?? ""]) : new Set(available.map(p => p.key))
  );

  const activeParams = available.filter(p => active.has(p.key));

  const chartData = years.slice().reverse().map(yr => {
    const pt: Record<string, unknown> = { year: yr };
    for (const code of codes) {
      for (const p of activeParams) {
        const v = toNum(getRow(code, yr)?.[p.key]);
        if (v != null) pt[`${code}::${p.key}`] = v;
      }
    }
    return pt;
  });

  if (!available.length) return (
    <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
      No score data available.
    </div>
  );

  return (
    <>
      <PillBar
        pills={available.map(p => ({ key: p.key, label: p.label, color: p.color }))}
        active={active}
        onToggle={toggle}
        onAll={toggleAll}
      />
      <div style={{ padding: "20px 24px 8px" }}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
            <XAxis dataKey="year" {...AX} />
            <YAxis domain={[0, "auto"]} {...AX} width={32} />
            <Tooltip content={<ChartTip fmtFn={fmtScore} />} />
            <Legend
              wrapperStyle={{ fontFamily: MONO, fontSize: "0.58rem", paddingTop: 10 }}
              formatter={(value: string) => {
                const sep = value.indexOf("::");
                const code = value.slice(0, sep);
                const paramKey = value.slice(sep + 2);
                const pLabel = ALL_SCORE_PARAMS.find(p => p.key === paramKey)?.short ?? paramKey;
                const instFull = profiles[code]?.institute_name ?? code;
                return `${instFull} · ${pLabel}`;
              }}
            />
            {codes.flatMap((code, ci) =>
              activeParams.map(p => {
                const col   = ci === 0 ? p.color : INST_COLORS[ci];
                const dash  = ci === 0 ? undefined : "6 3";
                const dKey  = `${code}::${p.key}`;
                const hasData = chartData.some(d => d[dKey] != null);
                if (!hasData) return null;
                return (
                  <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
                    stroke={col} strokeWidth={ci === 0 ? 2 : 1.8}
                    strokeDasharray={dash}
                    dot={{ r: 3, fill: col, strokeWidth: 0 }}
                    activeDot={{ r: 5 }} connectNulls
                  />
                );
              })
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── Radar ─────────────────────────────────────────────────────────────────────

function ScoreRadar({ profiles, codes, year, categoryFilter }: { profiles: CompareData; codes: string[]; year: number; categoryFilter?: string }) {
  const getRow = (code: string) => {
    const profile = profiles[code]; if (!profile) return undefined;
    const sby = profile.scoresByYear as Record<string, Record<string, unknown>>;
    if (categoryFilter) {
      const catKey = `${year}::${categoryFilter}`;
      if (sby[catKey]) return sby[catKey];
    }
    return sby[String(year)];
  };
  const params = ALL_SCORE_PARAMS.filter(p =>
    codes.some(c => toNum(getRow(c)?.[p.key]) != null)
  );
  if (params.length < 3) return null;

  const data = params.map(p => {
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
      <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Score Profile Radar — % of parameter maximum
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
          <PolarGrid stroke={BORDER} />
          <PolarAngleAxis dataKey="param" tick={{ fontFamily: MONO, fontSize: 9, fill: INK500 }} />
          {codes.map((code, i) => (
            <Radar key={code} name={shortName(profiles[code], code, 3)} dataKey={code}
              stroke={INST_COLORS[i]} fill={INST_COLORS[i]} fillOpacity={0.09} strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontFamily: MONO, fontSize: "0.62rem" }}
            formatter={(_v, entry) => {
              const idx = codes.indexOf(String(entry.dataKey));
              return <span style={{ color: INST_COLORS[idx] }}>{shortName(profiles[String(entry.dataKey)], String(entry.dataKey), 3)}</span>;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Section Chart — Program dropdown + Metric controls ───────────────────────

// Indexed data: code → program → metric → year → value
type SectionIndex = Map<string, Map<string, Map<string, Map<string, number>>>>;

function buildSectionIndex(
  profiles: CompareData,
  codes: string[],
  sectionKw: string,
  useRankingYear: boolean,
  excludeKw?: string,
  categoryFilter?: string,
): { index: SectionIndex; programs: string[]; metrics: string[]; years: string[] } {
  const BAD_PROG  = new Set(["", "-", "nan", "<na>", "null", "undefined", "none", "n/a"]);
  const progSet   = new Set<string>();
  const metricSet = new Set<string>();
  const yearSet   = new Set<string>();
  const index: SectionIndex = new Map();

  for (const code of codes) {
    const codeMap: Map<string, Map<string, Map<string, number>>> = new Map();
    index.set(code, codeMap);
    const p = profiles[code]; if (!p) continue;
    for (const sec of p.rawSections) {
      const secLower = sec.section.toLowerCase();
      if (!secLower.includes(sectionKw.toLowerCase())) continue;
      if (excludeKw && secLower.includes(excludeKw.toLowerCase())) continue;
      for (const m of sec.metrics) {
        if (isBAD(m.value) || m.metric.toLowerCase().includes("in words")) continue;
        if (categoryFilter && m.category && m.category !== categoryFilter) continue;
        const v = toNum(m.value);
        if (v == null || v < 0) continue;
        const yr = useRankingYear
          ? String(m.ranking_year)
          : (isRealYear(m.year) ? baseYear(m.year) : String(m.ranking_year));
        if (!yr) continue;
        const prog   = BAD_PROG.has((m.program ?? "").trim().toLowerCase()) ? "(All)" : m.program.trim();
        const metric = m.metric.trim();
        progSet.add(prog); metricSet.add(metric); yearSet.add(yr);
        if (!codeMap.has(prog)) codeMap.set(prog, new Map());
        const pm = codeMap.get(prog)!;
        if (!pm.has(metric)) pm.set(metric, new Map());
        const mm = pm.get(metric)!;
        mm.set(yr, Math.max(mm.get(yr) ?? 0, v));
      }
    }
  }

  const programs = Array.from(progSet).sort((a, b) => {
    if (a === "(All)") return -1; if (b === "(All)") return 1;
    const rank = (s: string) => s.startsWith("UG") ? 0 : s.startsWith("PG-Int") ? 2 : s.startsWith("PG") ? 1 : 3;
    return rank(a) !== rank(b) ? rank(a) - rank(b) : a.localeCompare(b);
  });
  return { index, programs, metrics: Array.from(metricSet).sort(), years: sortYrs(Array.from(yearSet)) };
}

const SEL: React.CSSProperties = {
  fontFamily: MONO, fontSize: "0.72rem",
  background: WHITE, color: INK900,
  border: `1px solid ${BORDER}`,
  padding: "6px 28px 6px 10px",
  cursor: "pointer", outline: "none",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  minWidth: 160, maxWidth: 320, letterSpacing: "0.02em",
};

function SectionChart({
  profiles, codes, sectionKw, excludeKw, isAmt, useRankingYear, categoryFilter,
}: {
  profiles: CompareData; codes: string[];
  sectionKw: string; excludeKw?: string; isAmt: boolean; useRankingYear: boolean;
  categoryFilter?: string;
}) {
  const { index, programs, metrics, years } = buildSectionIndex(profiles, codes, sectionKw, useRankingYear, excludeKw, categoryFilter);

  const [selProg,    setSelProg]    = useState<string>(() => programs[0] ?? "");
  const [selMetrics, setSelMetrics] = useState<Set<string>>(() => new Set(metrics.slice(0, 4)));

  React.useEffect(() => {
    setSelProg(programs[0] ?? "");
    setSelMetrics(new Set(metrics.slice(0, 4)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKw, categoryFilter]);

  if (!programs.length || !metrics.length || !years.length) {
    return (
      <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.75rem" }}>
        No data found for this section in the selected institutes.
      </div>
    );
  }

  const fmtFn       = isAmt ? fmtAmt : fmtN;
  const hasPrograms = programs.length > 1 || programs[0] !== "(All)";
  const useDropdown = metrics.length > 10;

  const toggleMetric = (m: string) => setSelMetrics(prev => {
    const s = new Set(prev);
    if (s.has(m)) { if (s.size > 1) s.delete(m); } else s.add(m);
    return s;
  });
  const activeMetrics = metrics.filter(m => selMetrics.has(m));

  const chartData = years.map(yr => {
    const pt: Record<string, unknown> = { year: yr };
    for (const code of codes) {
      for (const metric of activeMetrics) {
        const v = index.get(code)?.get(selProg)?.get(metric)?.get(yr);
        if (v != null) pt[`${code}::${metric}`] = v;
      }
    }
    return pt;
  });
  const hasData = chartData.some(pt => Object.keys(pt).length > 1);

  return (
    <>
      {/* ── Controls ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap",
        padding: "14px 24px 12px",
        borderBottom: `1px solid ${BORDER}`,
        background: OFF_WHITE,
      }}>

        {/* Program dropdown */}
        {hasPrograms && (
          <div style={{ flexShrink: 0 }}>
            <label style={{ display: "block", fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: INK300, marginBottom: 5 }}>
              Program
            </label>
            <div style={{ position: "relative", display: "inline-block" }}>
              <select value={selProg} onChange={e => setSelProg(e.target.value)} style={SEL}>
                {programs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: INK300, fontSize: "0.65rem" }}>▾</span>
            </div>
          </div>
        )}

        {/* Metrics — pill toggles when ≤10, chip+dropdown when >10 */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <label style={{ display: "block", fontFamily: MONO, fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: INK300, marginBottom: 5 }}>
            Metrics {useDropdown && <span style={{ color: CRIMSON }}>({selMetrics.size} selected)</span>}
          </label>

          {!useDropdown ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <button onClick={() => setSelMetrics(new Set(metrics))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "3px 8px", border: `1px solid ${selMetrics.size === metrics.length ? CRIMSON : BORDER}`, background: selMetrics.size === metrics.length ? CRIMSON : WHITE, color: selMetrics.size === metrics.length ? WHITE : INK300, cursor: "pointer", borderRadius: 2 }}>
                All
              </button>
              {metrics.map((m, i) => {
                const on = selMetrics.has(m);
                const col = METRIC_PALETTE[i % METRIC_PALETTE.length];
                return (
                  <button key={m} onClick={() => toggleMetric(m)} title={m} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "3px 9px", border: `1px solid ${on ? col : BORDER}`, background: on ? col : WHITE, color: on ? WHITE : INK300, cursor: "pointer", borderRadius: 2, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.length > 32 ? m.slice(0, 30) + "…" : m}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Many metrics → active chips + "Add metric" dropdown */
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {Array.from(selMetrics).map((m) => {
                const col = METRIC_PALETTE[metrics.indexOf(m) % METRIC_PALETTE.length];
                return (
                  <div key={m} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px 4px 10px", border: `1px solid ${col}`, background: `${col}18`, borderRadius: 3, maxWidth: 260 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INK900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }} title={m}>
                      {m.length > 28 ? m.slice(0, 26) + "…" : m}
                    </span>
                    <button onClick={() => toggleMetric(m)} style={{ background: "none", border: "none", cursor: "pointer", color: INK300, fontSize: "0.65rem", padding: 0, flexShrink: 0, lineHeight: 1 }}>✕</button>
                  </div>
                );
              })}
              <div style={{ position: "relative", display: "inline-block" }}>
                <select value="" onChange={e => { if (e.target.value) toggleMetric(e.target.value); }} style={{ ...SEL, minWidth: 180, color: INK500 }}>
                  <option value="">+ Add metric…</option>
                  {metrics.filter(m => !selMetrics.has(m)).map(m => (
                    <option key={m} value={m}>{m.length > 56 ? m.slice(0, 54) + "…" : m}</option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: INK300, fontSize: "0.65rem" }}>▾</span>
              </div>
              <button onClick={() => setSelMetrics(new Set([metrics[0]]))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "4px 10px", border: `1px solid ${BORDER}`, background: WHITE, color: INK300, cursor: "pointer", borderRadius: 2 }}>Clear</button>
              <button onClick={() => setSelMetrics(new Set(metrics))} style={{ fontFamily: MONO, fontSize: "0.6rem", padding: "4px 10px", border: `1px solid ${BORDER}`, background: WHITE, color: INK300, cursor: "pointer", borderRadius: 2 }}>All</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      {!hasData ? (
        <div style={{ padding: "20px 24px", color: INK300, fontFamily: MONO, fontSize: "0.72rem" }}>
          No data for the selected program / metric combination.
        </div>
      ) : (
        <div style={{ padding: "16px 24px 8px" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
              <XAxis dataKey="year" {...AX} />
              <YAxis {...AX} />
              <Tooltip content={<ChartTip fmtFn={fmtFn} />} />
              <Legend
                wrapperStyle={{ fontFamily: MONO, fontSize: "0.6rem", paddingTop: 10 }}
                formatter={(value: string) => {
                  const sep    = value.indexOf("::");
                  const code   = value.slice(0, sep);
                  const metric = value.slice(sep + 2);
                  const instFull = profiles[code]?.institute_name ?? code;
                  return `${instFull} · ${metric}`;
                }}
              />
              {codes.flatMap((code, ci) =>
                activeMetrics.map((metric) => {
                  const mi   = metrics.indexOf(metric);
                  const col  = ci === 0 ? METRIC_PALETTE[mi % METRIC_PALETTE.length] : INST_COLORS[ci];
                  const dash = ci === 0 ? undefined : "6 3";
                  const dKey = `${code}::${metric}`;
                  if (!chartData.some(d => d[dKey] != null)) return null;
                  return (
                    <Line key={dKey} type="monotone" dataKey={dKey} name={dKey}
                      stroke={col} strokeWidth={ci === 0 ? 2.2 : 1.8} strokeDasharray={dash}
                      dot={{ r: 3, fill: col, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls
                    />
                  );
                })
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}


// ── Table primitives ──────────────────────────────────────────────────────────

function TableColHeader({ codes, profiles }: { codes: string[]; profiles: CompareData }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${codes.length}, 1fr)`, borderBottom: `2px solid ${BORDER}`, background: OFF_WHITE }}>
      <div style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
        <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300, textTransform: "uppercase", letterSpacing: "0.08em" }}>Metric</span>
      </div>
      {codes.map((code, i) => (
        <div key={code} style={{ padding: "8px 14px", textAlign: "center", borderRight: i < codes.length - 1 ? `1px solid ${BORDER}` : "none" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.62rem", color: INST_COLORS[i], fontWeight: 600 }}>
            {profiles[code]?.institute_name?.split(" ").slice(0, 3).join(" ") ?? code}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricRow({ label, values, bestI, fmt, subLabel }: {
  label: string; values: (number | null)[]; bestI: number;
  fmt?: (v: unknown) => string; subLabel?: string;
}) {
  const n = values.length;
  const fmtFn = fmt ?? fmtScore;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${n}, 1fr)`, borderBottom: `1px solid ${BORDER}`, minHeight: 38 }}>
      <div style={{ padding: "9px 14px", background: OFF_WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontFamily: BODY, fontSize: "0.74rem", color: INK900 }}>{label}</span>
        {subLabel && <span style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300 }}>{subLabel}</span>}
      </div>
      {values.map((v, i) => {
        const isBest = i === bestI && v != null;
        return (
          <div key={i} style={{ padding: "9px 14px", borderRight: i < n - 1 ? `1px solid ${BORDER}` : "none", background: isBest ? CRIMSON_PALE : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: isBest ? 700 : 400, color: isBest ? CRIMSON : (v != null ? INK900 : INK300) }}>
              {v != null ? fmtFn(v) : "—"}
              {isBest && v != null && <span style={{ marginLeft: 3, fontSize: "0.55rem" }}> ★</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CompareView({ institutes, onRemove }: Props) {
  const [data,         setData]         = useState<CompareData>({});
  const [loading,      setLoading]      = useState(true);
  const [activeYear,     setActiveYear]     = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(""); // "" = no filter yet
  const [activeSecTab,   setActiveSecTab]   = useState("intake");

  const codes = institutes.map(i => i.institute_code);

  useEffect(() => {
    if (!codes.length) return;
    setLoading(true);
    fetch(`/api/compare?codes=${codes.join(",")}`)
      .then(r => r.json())
      .then((d: CompareData) => {
        setData(d);
        const yearSets = codes.map(c => new Set(Object.keys(d[c]?.scoresByYear ?? {}).map(Number)));
        const common = Array.from(yearSets[0] ?? new Set<number>())
          .filter(y => yearSets.every(s => s.has(y))).sort((a, b) => b - a);
        const fallback = Array.from(
          new Set(codes.flatMap(c => Object.keys(d[c]?.scoresByYear ?? {}).map(Number)))
        ).sort((a, b) => b - a);
        setActiveYear(common[0] ?? fallback[0] ?? null);

        // Derive categories available across ALL loaded institutes
        const catSets = codes.map(c =>
          new Set((d[c]?.categories ?? []).map((s: string) => s))
        );
        // Common categories first, then union
        const commonCats = Array.from(catSets[0] ?? new Set<string>())
          .filter(cat => catSets.every(s => s.has(cat)))
          .sort();
        const allCats = Array.from(
          new Set(codes.flatMap(c => d[c]?.categories ?? []))
        ).sort();
        const defaultCat = commonCats[0] ?? allCats[0] ?? "";
        setActiveCategory(defaultCat);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes.join(",")]);

  // Only numeric year keys (filter out "year::category" composite keys)
  const allYears = Array.from(new Set(
    codes.flatMap(c =>
      Object.keys(data[c]?.scoresByYear ?? {})
        .filter(k => !k.includes("::"))
        .map(Number)
        .filter(n => !isNaN(n))
    )
  )).sort((a, b) => b - a);
  const loadedCodes = codes.filter(c => !!data[c]);

  // All categories across all loaded institutes
  const allCategories = Array.from(new Set(
    loadedCodes.flatMap(c => data[c]?.categories ?? [])
  )).sort();
  // Categories available in ALL institutes (common)
  const commonCategories = allCategories.filter(cat =>
    loadedCodes.every(c => (data[c]?.categories ?? []).includes(cat))
  );

  // Get the score row for a code filtered by activeCategory + activeYear
  // API stores rows under both "year" and "year::category" keys
  const getCatRow = useCallback((code: string): Record<string, unknown> | null => {
    const profile = data[code];
    if (!profile || !activeYear) return null;
    const sby = profile.scoresByYear as Record<string, Record<string, unknown>>;
    // Try category-qualified key first
    if (activeCategory) {
      const catKey = `${activeYear}::${activeCategory}`;
      if (sby[catKey]) return sby[catKey];
    }
    // Fallback to plain year key
    return sby[String(activeYear)] ?? null;
  }, [data, activeYear, activeCategory]);

  const scoreRow = useCallback((key: string) =>
    loadedCodes.map(c => toNum(getCatRow(c)?.[key])),
  [loadedCodes, getCatRow]);

  // Raw sections filtered by activeCategory
  const getFilteredSections = useCallback((code: string) => {
    const profile = data[code];
    if (!profile) return [];
    if (!activeCategory) return profile.rawSections;
    return profile.rawSections.map(sec => ({
      ...sec,
      metrics: sec.metrics.filter(m =>
        !activeCategory || !m.category || m.category === activeCategory
      ),
    })).filter(sec => sec.metrics.length > 0);
  }, [data, activeCategory]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ fontFamily: MONO, fontSize: "0.8rem", color: INK300 }}>Loading comparison…</p>
      </div>
    );
  }

  const activeSecDef = SECTION_TABS.find(t => t.id === activeSecTab) ?? SECTION_TABS[0];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 100px" }}>

      {/* ── Sticky header ── */}
      <div style={{ position: "sticky", top: 52, zIndex: 40, background: WHITE, borderBottom: `2px solid ${BORDER}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${loadedCodes.length}, 1fr)` }}>
          <div style={{ padding: "14px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: CRIMSON }}>Comparison</p>
            {allYears.length > 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {allYears.slice(0, 6).map(y => (
                  <button key={y} onClick={() => setActiveYear(y)} style={{
                    fontFamily: MONO, fontSize: "0.58rem", padding: "2px 6px",
                    border: `1px solid ${activeYear === y ? CRIMSON : BORDER}`,
                    background: activeYear === y ? CRIMSON : "transparent",
                    color: activeYear === y ? WHITE : INK500, cursor: "pointer",
                  }}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Category selector */}
            {allCategories.length > 1 && (
              <div>
                <p style={{ fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: INK300, marginBottom: 4 }}>
                  Category
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {allCategories.map(cat => {
                    const isCommon  = commonCategories.includes(cat);
                    const isActive  = activeCategory === cat;
                    return (
                      <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        fontFamily: MONO, fontSize: "0.58rem", padding: "3px 8px",
                        border: `1px solid ${isActive ? CRIMSON : BORDER}`,
                        background: isActive ? CRIMSON : "transparent",
                        color: isActive ? WHITE : (isCommon ? INK900 : INK300),
                        cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        {!isCommon && (
                          <span style={{ fontSize: "0.5rem", color: isActive ? "rgba(255,255,255,0.6)" : INK300 }} title="Not available in all institutes">⚠</span>
                        )}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {loadedCodes.map((code, i) => {
            const p     = data[code];
            const score = activeYear ? toNum(p?.scoresByYear[activeYear]?.img_total) : null;
            return (
              <div key={code} style={{ padding: "12px 14px", borderRight: i < loadedCodes.length - 1 ? `1px solid ${BORDER}` : "none", borderTop: `3px solid ${INST_COLORS[i]}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: "0.8rem", color: INK900, lineHeight: 1.3, marginBottom: 3 }}>{p?.institute_name ?? code}</p>
                    <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>{code}</p>
                    {/* Show active category if institute has it, else show warning */}
                    {activeCategory ? (
                      <span style={{
                        display: "inline-block", marginTop: 4,
                        fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em",
                        color: (p?.categories ?? []).includes(activeCategory) ? INST_COLORS[i] : "#b0a090",
                        border: `1px solid ${(p?.categories ?? []).includes(activeCategory) ? INST_COLORS[i] : BORDER}`,
                        padding: "1px 5px",
                        opacity: (p?.categories ?? []).includes(activeCategory) ? 1 : 0.6,
                      }}>
                        {(p?.categories ?? []).includes(activeCategory) ? activeCategory : `No ${activeCategory} data`}
                      </span>
                    ) : p?.categories?.[0] && (
                      <span style={{ display: "inline-block", marginTop: 4, fontFamily: MONO, fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.06em", color: INST_COLORS[i], border: `1px solid ${INST_COLORS[i]}`, padding: "1px 5px" }}>
                        {p.categories[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {score != null && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "1.5rem", color: INST_COLORS[i], lineHeight: 1 }}>{score.toFixed(2)}</p>}
                    <button onClick={() => onRemove(code)} style={{ fontFamily: MONO, fontSize: "0.58rem", color: INK300, background: "none", border: `1px solid ${BORDER}`, padding: "2px 6px", cursor: "pointer", marginTop: 4 }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ 1. NIRF SCORE CHART ═══════════════════ */}
      <SectionHeader>NIRF Score Trends — All Parameters</SectionHeader>
      <NIRFScoreChart profiles={data} codes={loadedCodes} years={allYears} categoryFilter={activeCategory} />
      {activeYear && <ScoreRadar profiles={data} codes={loadedCodes} year={activeYear} categoryFilter={activeCategory} />}

      {/* ═══════════════════ 2. SCORE BREAKDOWN TABLE ═══════════════════ */}
      <SectionHeader>NIRF Score Breakdown · {activeYear ?? "Latest Year"}</SectionHeader>
      <TableColHeader codes={loadedCodes} profiles={data} />
      {(() => { const vals = scoreRow("img_total"); return <MetricRow label="NIRF Total Score" values={vals} bestI={bestIdx(vals)} subLabel="/ 100" />; })()}
      {ALL_SCORE_PARAMS.map(p => {
        const vals = scoreRow(p.key);
        if (vals.every(v => v == null)) return null;
        const tvs = scoreRow(p.key.replace("_score", "_total"));
        const maxT = tvs.find(v => v != null);
        return <MetricRow key={p.key} label={p.label} values={vals} bestI={bestIdx(vals)} subLabel={maxT ? `/ ${maxT.toFixed(0)}` : undefined} />;
      })}

      {/* ═══════════════════ 3. SECTION CHARTS ═══════════════════ */}
      <SectionHeader>Section-wise Comparison — Charts</SectionHeader>

      {/* Section tab strip */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
        {SECTION_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveSecTab(tab.id)} style={{
            fontFamily: BODY, fontWeight: activeSecTab === tab.id ? 600 : 400,
            fontSize: "0.75rem", padding: "10px 16px",
            background: "transparent", border: "none",
            borderBottom: activeSecTab === tab.id ? `2px solid ${CRIMSON}` : "2px solid transparent",
            marginBottom: "-2px",
            color: activeSecTab === tab.id ? CRIMSON : INK300,
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.12s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <SectionChart
        key={`${activeSecTab}-${activeCategory}`}
        profiles={data}
        codes={loadedCodes}
        sectionKw={activeSecDef.kw}
        excludeKw={activeSecDef.excludeKw}
        isAmt={activeSecDef.isAmt}
        useRankingYear={activeSecDef.useRankingYear}
        categoryFilter={activeCategory}
      />

      {/* ═══════════════════ 4. KEY METRICS TABLE ═══════════════════ */}
      <SectionHeader>Key Metrics Table · {activeYear ?? "Latest Year"}</SectionHeader>
      <TableColHeader codes={loadedCodes} profiles={data} />
      {[
        { key: "pdf_total_intake",            label: "Total Intake",                   fmt: fmtN,   higher: false },
        { key: "pdf_placement_placed",        label: "Students Placed",                fmt: fmtN,   higher: true  },
        { key: "pdf_placement_higher",        label: "Higher Studies",                 fmt: fmtN,   higher: true  },
        { key: "pdf_median_salary",           label: "Median Salary",                  fmt: fmtSal, higher: true  },
        { key: "pdf_phd_ft_total",            label: "PhD Students — Full Time",       fmt: fmtN,   higher: true  },
        { key: "pdf_phd_pt_total",            label: "PhD Students — Part Time",       fmt: fmtN,   higher: true  },
        { key: "pdf_phd_ft_graduated",        label: "PhD Graduated FT (3yr)",         fmt: fmtN,   higher: true  },
        { key: "pdf_phd_pt_graduated",        label: "PhD Graduated PT (3yr)",         fmt: fmtN,   higher: true  },
        { key: "pdf_sponsored_projects",      label: "Sponsored Projects (3yr)",       fmt: fmtN,   higher: true  },
        { key: "pdf_sponsored_amount",        label: "Sponsored Amount (3yr)",         fmt: fmtAmt, higher: true  },
        { key: "pdf_consultancy_projects",    label: "Consultancy Projects (3yr)",     fmt: fmtN,   higher: true  },
        { key: "pdf_consultancy_amount",      label: "Consultancy Amount (3yr)",       fmt: fmtAmt, higher: true  },
        { key: "pdf_edp_participants",        label: "EDP/MDP Participants (3yr)",     fmt: fmtN,   higher: true  },
        { key: "pdf_capital_expenditure",     label: "Capital Expenditure (3yr sum)",  fmt: fmtAmt, higher: true  },
        { key: "pdf_operational_expenditure", label: "Operational Expenditure (3yr)",  fmt: fmtAmt, higher: true  },
      ].map(m => {
        const vals = scoreRow(m.key);
        if (vals.every(v => v == null)) return null;
        return <MetricRow key={m.key} label={m.label} values={vals} bestI={bestIdx(vals, m.higher)} fmt={m.fmt} />;
      })}

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
        <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: INK300 }}>
          ★ Best value in row &nbsp;·&nbsp; Solid line = first institute · dashed = others &nbsp;·&nbsp;
          Score data from NIRF image scorecard &nbsp;·&nbsp; PDF aggregates are 3-year sums from institutional reports
        </p>
      </div>
    </div>
  );
}