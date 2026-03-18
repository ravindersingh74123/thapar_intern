// "use client";
// import { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";

// interface Props { hit: SearchHit; }

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
// }
// interface RawSection { section: string; metrics: RawMetric[]; }

// // ─── Tab config ───────────────────────────────────────────────────────────────
// type TabId = "scores" | "intake" | "students" | "placement" | "phd" | "research" | "financial" | "faculty" | "facilities";

// const TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",     label: "NIRF Scores",   icon: "★" },
//   { id: "intake",     label: "Intake",        icon: "⊕" },
//   { id: "students",   label: "Students",      icon: "◎" },
//   { id: "placement",  label: "Placement",     icon: "↗" },
//   { id: "phd",        label: "PhD",           icon: "⚗" },
//   { id: "research",   label: "Research",      icon: "◈" },
//   { id: "financial",  label: "Financial",     icon: "₹" },
//   { id: "faculty",    label: "Faculty",       icon: "✦" },
//   { id: "facilities", label: "Facilities",    icon: "⌂" },
// ];

// // ─── Section keyword map ──────────────────────────────────────────────────────
// const TAB_SECTIONS: Record<TabId, string[]> = {
//   scores:     [],
//   intake:     ["Sanctioned"],
//   students:   ["Student Strength", "Total Actual"],
//   placement:  ["Placement"],
//   phd:        ["Ph.D"],
//   research:   ["Sponsored", "Consultancy", "Executive Development"],
//   financial:  ["Capital expenditure", "Operational expenditure", "Financial"],
//   faculty:    ["Faculty"],
//   facilities: ["PCS", "Physically Challenged"],
// };

// // ─── Small helpers ────────────────────────────────────────────────────────────
// function fmt(v: unknown): string {
//   if (v == null) return "—";
//   const n = Number(v);
//   if (!isNaN(n) && n > 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (!isNaN(n) && n > 99999) return n.toLocaleString("en-IN");
//   return String(v);
// }
// function fmtSalary(v: unknown): string {
//   const n = Number(v);
//   if (isNaN(n)) return "—";
//   return `₹${(n / 100000).toFixed(1)}L`;
// }
// function isWords(metric: string): boolean {
//   return metric.toLowerCase().includes("in words");
// }

// // ─── Reusable primitives ──────────────────────────────────────────────────────
// function KV({ label, value, big, accent }: { label: string; value: string | null; big?: boolean; accent?: boolean }) {
//   return (
//     <div style={{
//       background: accent ? "var(--crimson-pale)" : "var(--off-white)",
//       border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
//       padding: "14px 16px",
//     }}>
//       <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.09em", color: accent ? "var(--crimson)" : "var(--ink-500)", marginBottom: 5 }}>{label}</p>
//       <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: big ? "2rem" : "1.35rem", color: accent ? "var(--crimson-dark)" : "var(--ink-900)", lineHeight: 1 }}>
//         {value ?? "—"}
//       </p>
//     </div>
//   );
// }

// function SectionHeading({ children }: { children: React.ReactNode }) {
//   return (
//     <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.05rem", color: "var(--ink-900)", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
//       {children}
//     </h3>
//   );
// }

// function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return (
//     <div style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "20px 24px", boxShadow: "var(--shadow-sm)", ...style }}>
//       {children}
//     </div>
//   );
// }

// function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
//   const max = total ?? 100;
//   const pct = score != null && max > 0 ? Math.min((score / max) * 100, 100) : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>{label}</span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
//           {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
//         </span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{ height: "100%", width: `${pct}%`, background: "var(--crimson)", transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
//       </div>
//     </div>
//   );
// }

// // Table for raw metrics
// function MetricTable({ rows, hideWords = true }: { rows: RawMetric[]; hideWords?: boolean }) {
//   const filtered = hideWords ? rows.filter(r => !isWords(r.metric)) : rows;
//   if (!filtered.length) return <p style={{ color: "var(--ink-300)", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>No data.</p>;

//   // Group by program
//   const programs = [...new Set(filtered.map(r => r.program || "—"))];

//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
//         <thead>
//           <tr style={{ background: "var(--off-white)" }}>
//             {programs.length > 1 && <th style={TH}>Program</th>}
//             <th style={TH}>Metric</th>
//             <th style={TH}>Year</th>
//             <th style={{ ...TH, textAlign: "right" }}>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filtered.map((m, i) => (
//             <tr key={i}
//               style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
//               onMouseEnter={e => (e.currentTarget.style.background = "var(--off-white)")}
//               onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
//             >
//               {programs.length > 1 && <td style={TD_MUTED}>{m.program || "—"}</td>}
//               <td style={TD}>{m.metric}</td>
//               <td style={TD_MUTED}>{m.year || "—"}</td>
//               <td style={{ ...TD, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--ink-700)" }}>
//                 {m.metric.toLowerCase().includes("salary") ? fmtSalary(m.value) : fmt(m.value)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// const TH: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-500)", padding: "7px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
// const TD: React.CSSProperties = { padding: "8px 12px", color: "var(--ink-700)", verticalAlign: "middle" };
// const TD_MUTED: React.CSSProperties = { ...TD, color: "var(--ink-300)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" };

// // ─── Helpers to extract sections ─────────────────────────────────────────────
// function getSections(rawSections: RawSection[], keywords: string[], activeYear: number | null): RawSection[] {
//   return rawSections
//     .filter(s => keywords.some(kw => s.section.toLowerCase().includes(kw.toLowerCase())))
//     .map(s => ({
//       ...s,
//       metrics: activeYear ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0) : s.metrics,
//     }))
//     .filter(s => s.metrics.length > 0);
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────
// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const years = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(years[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) return (
//     <div style={{ padding: "80px 32px", textAlign: "center" }}>
//       <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>Loading…</p>
//     </div>
//   );
//   if (!profile) return (
//     <div style={{ padding: "80px 32px", textAlign: "center" }}>
//       <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>Could not load data.</p>
//     </div>
//   );

//   const years = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row   = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
//   const rawSections: RawSection[] = profile.rawSections as RawSection[];
//   const imgScoreCols = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));

//   // ─── Rendered tab bodies ──────────────────────────────────────────────────

//   function renderScores() {
//     if (!row) return <p style={{ color: "var(--ink-300)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>No score data for this year.</p>;
//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {/* Big KV row */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           <KV label="NIRF Total"        value={row.img_total   != null ? (row.img_total   as number).toFixed(2) : null} accent big />
//           <KV label="Student Strength"  value={row.img_ss_score  != null ? (row.img_ss_score  as number).toFixed(2) : null} />
//           <KV label="Faculty Ratio"     value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null} />
//           <KV label="Perception"        value={row.img_pr_score  != null ? (row.img_pr_score  as number).toFixed(2) : null} />
//         </div>

//         {/* Score bars */}
//         <Card>
//           <SectionHeading>Parameter Breakdown</SectionHeading>
//           {imgScoreCols.map(key => {
//             const totalKey = key.replace("_score", "_total");
//             const label    = SCORE_LABELS[key] ?? key.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase();
//             return (
//               <ScoreBar key={key} label={label}
//                 score={row[key] as number | null}
//                 total={row[totalKey] as number | null}
//               />
//             );
//           })}
//         </Card>
//       </div>
//     );
//   }

//   function renderIntake() {
//     const sections = getSections(rawSections, TAB_SECTIONS.intake, activeYear);
//     if (!sections.length) return <Empty />;
//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {/* Summary grid */}
//         {row && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//             <KV label="Total Intake" value={row.pdf_total_intake != null ? Number(row.pdf_total_intake).toLocaleString("en-IN") : null} accent />
//           </div>
//         )}
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>{sec.section}</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   function renderStudents() {
//     const sections = getSections(rawSections, TAB_SECTIONS.students, activeYear);
//     if (!sections.length) return <Empty />;
//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>Student Strength</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   function renderPlacement() {
//     const sections = getSections(rawSections, TAB_SECTIONS.placement, activeYear);
//     if (!sections.length) return <Empty />;

//     // Pull headline stats from the metrics
//     const allMetrics = sections.flatMap(s => s.metrics);
//     const placed     = allMetrics.find(m => m.metric.toLowerCase().includes("students placed"))?.value;
//     const salary     = allMetrics.find(m => m.metric.toLowerCase().includes("median salary"))?.value;
//     const higher     = allMetrics.find(m => m.metric.toLowerCase().includes("higher studies"))?.value;

//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Students Placed"  value={placed  ? Number(placed).toLocaleString("en-IN") : null} accent />
//           <KV label="Median Salary"    value={salary  ? fmtSalary(salary) : null} />
//           <KV label="Higher Studies"   value={higher  ? Number(higher).toLocaleString("en-IN") : null} />
//         </div>
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>Placement & Higher Studies</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   function renderPhd() {
//     const sections = getSections(rawSections, TAB_SECTIONS.phd, activeYear);
//     if (!sections.length) return <Empty />;
//     const allMetrics = sections.flatMap(s => s.metrics);
//     const ftTotal    = allMetrics.find(m => m.metric.toLowerCase().includes("full time students"))?.value;
//     const ptTotal    = allMetrics.find(m => m.metric.toLowerCase().includes("part time students"))?.value;
//     const ftGrad     = allMetrics.find(m => m.metric.toLowerCase().includes("full time graduated"))?.value;

//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="FT Students"    value={ftTotal ? Number(ftTotal).toLocaleString("en-IN") : null} accent />
//           <KV label="PT Students"    value={ptTotal ? Number(ptTotal).toLocaleString("en-IN") : null} />
//           <KV label="FT Graduated"   value={ftGrad  ? Number(ftGrad).toLocaleString("en-IN")  : null} />
//         </div>
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>{sec.section}</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   function renderResearch() {
//     const sections = getSections(rawSections, TAB_SECTIONS.research, activeYear);
//     if (!sections.length) return <Empty />;
//     const allMetrics = sections.flatMap(s => s.metrics);

//     const sponsored  = allMetrics.find(m => m.metric.includes("Sponsored Projects"))?.value;
//     const consult    = allMetrics.find(m => m.metric.includes("Consultancy Projects"))?.value;
//     const edp        = allMetrics.find(m => m.metric.includes("Executive Development Programs"))?.value;
//     const edpPax     = allMetrics.find(m => m.metric.includes("Participants"))?.value;

//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Sponsored Projects" value={sponsored ? Number(sponsored).toLocaleString("en-IN") : null} accent />
//           <KV label="Consultancy Projects" value={consult ? Number(consult).toLocaleString("en-IN") : null} />
//           <KV label="EDP Programs"       value={edp   ? Number(edp).toLocaleString("en-IN") : null} />
//           <KV label="EDP Participants"   value={edpPax ? Number(edpPax).toLocaleString("en-IN") : null} />
//         </div>
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>{sec.section}</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   function renderFinancial() {
//     const sections = getSections(rawSections, TAB_SECTIONS.financial, activeYear);
//     if (!sections.length) return <Empty />;

//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {/* Summary KVs from PDF aggregates */}
//         {row && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
//             <KV label="Capital Expenditure"     value={row.pdf_capital_expenditure     != null ? `₹${(Number(row.pdf_capital_expenditure)/1e7).toFixed(2)} Cr`     : null} accent />
//             <KV label="Operational Expenditure" value={row.pdf_operational_expenditure != null ? `₹${(Number(row.pdf_operational_expenditure)/1e7).toFixed(2)} Cr` : null} />
//           </div>
//         )}

//         {sections.map(sec => {
//           // Separate numeric rows from "in words" rows
//           const numericRows = sec.metrics.filter(m => !isWords(m.metric));
//           const wordsRows   = sec.metrics.filter(m => isWords(m.metric));

//           return (
//             <Card key={sec.section}>
//               <SectionHeading>{sec.section}</SectionHeading>
//               <MetricTable rows={numericRows} hideWords={false} />
//               {wordsRows.length > 0 && (
//                 <details style={{ marginTop: 12 }}>
//                   <summary style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-300)", cursor: "pointer", userSelect: "none" }}>
//                     Show amounts in words ({wordsRows.length})
//                   </summary>
//                   <div style={{ marginTop: 8 }}>
//                     {wordsRows.map((m, i) => (
//                       <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "0.75rem" }}>
//                         <span style={{ color: "var(--ink-400)", marginRight: 8, fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>{m.year}</span>
//                         {m.value}
//                       </div>
//                     ))}
//                   </div>
//                 </details>
//               )}
//             </Card>
//           );
//         })}
//       </div>
//     );
//   }

//   function renderFaculty() {
//     const sections = getSections(rawSections, TAB_SECTIONS.faculty, activeYear);
//     const count    = sections.flatMap(s => s.metrics).find(m => m.metric.toLowerCase().includes("number of faculty"))?.value;
//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {count && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//             <KV label="Faculty Members" value={Number(count).toLocaleString("en-IN")} accent />
//           </div>
//         )}
//         {sections.length > 0 ? sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>Faculty Details</SectionHeading>
//             <MetricTable rows={sec.metrics} />
//           </Card>
//         )) : <Empty />}
//       </div>
//     );
//   }

//   function renderFacilities() {
//     const sections = getSections(rawSections, TAB_SECTIONS.facilities, activeYear);
//     if (!sections.length) return <Empty />;
//     return (
//       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//         {sections.map(sec => (
//           <Card key={sec.section}>
//             <SectionHeading>PCS Facilities — Physically Challenged Students</SectionHeading>
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               {sec.metrics.map((m, i) => (
//                 <div key={i} style={{
//                   display: "flex", justifyContent: "space-between", alignItems: "flex-start",
//                   gap: 16, padding: "10px 0", borderBottom: i < sec.metrics.length - 1 ? "1px solid var(--border)" : "none",
//                 }}>
//                   <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>{m.metric}</span>
//                   <span style={{
//                     fontFamily: "var(--font-mono)", fontSize: "0.72rem", flexShrink: 0,
//                     color: String(m.value).toLowerCase().startsWith("yes") ? "var(--teal)" : "var(--crimson)",
//                     background: String(m.value).toLowerCase().startsWith("yes") ? "var(--teal-pale)" : "var(--crimson-pale)",
//                     padding: "2px 8px", border: `1px solid ${String(m.value).toLowerCase().startsWith("yes") ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                   }}>
//                     {m.value}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   const tabRender: Record<TabId, () => React.ReactNode> = {
//     scores:     renderScores,
//     intake:     renderIntake,
//     students:   renderStudents,
//     placement:  renderPlacement,
//     phd:        renderPhd,
//     research:   renderResearch,
//     financial:  renderFinancial,
//     faculty:    renderFaculty,
//     facilities: renderFacilities,
//   };

//   // ─── Render ───────────────────────────────────────────────────────────────
//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* ── Hero header ── */}
//       <div style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{
//               fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase",
//               letterSpacing: "0.1em", color: "var(--crimson)", background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.2)", padding: "2px 8px", marginBottom: 10, display: "inline-block",
//             }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(1.3rem,3vw,1.9rem)", color: "var(--ink-900)", lineHeight: 1.2, marginBottom: 5 }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
//               {profile.institute_code}
//             </p>
//           </div>

//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "3.2rem", color: "var(--crimson)", lineHeight: 1, marginBottom: 3 }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-300)" }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Year selector */}
//         {years.length > 0 && (
//           <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-300)", marginRight: 4 }}>
//               Ranking Year
//             </span>
//             {years.map(y => (
//               <button key={y} onClick={() => setActiveYear(y)} style={{
//                 fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "3px 11px",
//                 background: activeYear === y ? "var(--crimson)" : "var(--white)",
//                 color: activeYear === y ? "var(--white)" : "var(--ink-500)",
//                 border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
//                 cursor: "pointer", transition: "all 0.15s",
//               }}>{y}</button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Tabs ── */}
//       <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
//         {TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
//             fontFamily: "var(--font-body)", fontWeight: activeTab === tab.id ? 600 : 400,
//             fontSize: "0.78rem", padding: "9px 16px",
//             background: "transparent", border: "none",
//             borderBottom: activeTab === tab.id ? "2px solid var(--crimson)" : "2px solid transparent",
//             marginBottom: "-2px",
//             color: activeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
//             cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
//             display: "flex", alignItems: "center", gap: 5,
//           }}>
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Tab body ── */}
//       <div key={`${activeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabRender[activeTab]()}
//       </div>
//     </div>
//   );
// }

// function Empty() {
//   return (
//     <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-300)", padding: "24px 0" }}>
//       No data available for this section / year.
//     </p>
//   );
// }


















// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";

// interface Props { hit: SearchHit; }
// interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
// interface RawSection { section: string; metrics: RawMetric[]; }
// type TabId = "scores"|"intake"|"placement"|"phd"|"students"|"research"|"financial"|"faculty"|"facilities";

// const TABS: {id:TabId;label:string;icon:string}[] = [
//   {id:"scores",    label:"NIRF Scores",  icon:"★"},
//   {id:"intake",    label:"Intake",       icon:"⊕"},
//   {id:"placement", label:"Placement",    icon:"↗"},
//   {id:"phd",       label:"PhD",          icon:"⚗"},
//   {id:"students",  label:"Students",     icon:"◎"},
//   {id:"research",  label:"Research",     icon:"◈"},
//   {id:"financial", label:"Financial",    icon:"₹"},
//   {id:"faculty",   label:"Faculty",      icon:"✦"},
//   {id:"facilities",label:"Facilities",   icon:"⌂"},
// ];

// // ─── Year helpers ─────────────────────────────────────────────────────────────
// // After ETL fix, year values are real strings like:
// //   "2023-24"
// //   "2023-24 (Graduation Year)"
// //   "2022-23 (Intake Year)"
// //   "2021-22 (Academic Year)"
// //   "2019-20 (Lateral entry year)"
// //   "-"  (no year for this metric)

// const BAD_YEAR = new Set(["", "-", "nan", "<na>", "null", "undefined", "none"]);

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim().toLowerCase();
//   return !BAD_YEAR.has(v) && /^\d{4}-\d{2}/.test((y ?? "").trim());
// }

// // Extract base academic year string "YYYY-YY" from full year label
// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// // Short display label — "2023-24 (Graduation Year)" → "2023-24"
// function shortYear(y: string): string {
//   return baseYear(y);
// }

// // ─── Value helpers ────────────────────────────────────────────────────────────

// const BAD_VAL = new Set(["nan", "<na>", "null", "undefined", "n/a", "na", "-", ""]);
// const isBAD = (v: string | null | undefined) => BAD_VAL.has((v ?? "").trim().toLowerCase());
// const cl = (v: string | null | undefined): string => isBAD(v) ? "" : (v ?? "").trim();

// function fmtN(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   return isNaN(n) ? v : n.toLocaleString("en-IN");
// }
// function fmtSal(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   return isNaN(n) ? v : `₹${(n / 100_000).toFixed(1)}L`;
// }
// function fmtCr(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   if (isNaN(n)) return v;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtV(v: string, metric: string): string {
//   if (!v) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtCr(v);
//   return fmtN(v);
// }

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
//   return m;
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = { fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-400)",padding:"8px 14px",textAlign:"left",borderBottom:"2px solid var(--border)",background:"var(--off-white)",whiteSpace:"nowrap" };
// const THR: React.CSSProperties = { ...TH, textAlign:"right" };
// const TD: React.CSSProperties = { padding:"8px 14px",color:"var(--ink-700)",verticalAlign:"middle",fontSize:"0.78rem" };
// const TDM: React.CSSProperties = { ...TD, color:"var(--ink-400)",fontFamily:"var(--font-mono)",fontSize:"0.68rem" };
// const TDR: React.CSSProperties = { ...TD, textAlign:"right",fontFamily:"var(--font-mono)" };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "var(--crimson-pale)"; },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent"; },
//   };
// }

// // ─── Primitives ───────────────────────────────────────────────────────────────

// function KV({ label, value, accent, big }: { label: string; value?: string | null; accent?: boolean; big?: boolean }) {
//   return (
//     <div style={{ background: accent ? "var(--crimson-pale)" : "var(--off-white)", border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`, padding: "14px 16px" }}>
//       <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.09em",color:accent?"var(--crimson)":"var(--ink-500)",marginBottom:5 }}>{label}</p>
//       <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:big?"1.9rem":"1.35rem",color:accent?"var(--crimson-dark)":"var(--ink-900)",lineHeight:1 }}>{value || "—"}</p>
//     </div>
//   );
// }

// function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }) {
//   return (
//     <div style={{ background:"var(--white)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",marginBottom:14,overflow:"hidden",padding:noPad?0:"20px 24px" }}>
//       {title && <h3 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"1rem",color:"var(--ink-900)",margin:0,padding:noPad?"16px 24px 14px":"0 0 8px",borderBottom:"1px solid var(--border)",marginBottom:14 }}>{title}</h3>}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)" }}>{children}</p>;
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-300)",padding:"20px 0" }}>{msg}</p>;
// }

// function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
//   const pct = score != null && (total ?? 100) > 0 ? Math.min((score / (total ?? 100)) * 100, 100) : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
//         <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)" }}>{label}</span>
//         <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-400)" }}>{score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}</span>
//       </div>
//       <div style={{ height:5,background:"var(--border)" }}>
//         <div style={{ height:"100%",width:`${pct}%`,background:"var(--crimson)",transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
//       </div>
//     </div>
//   );
// }

// // ─── Year-keyed pivot table ───────────────────────────────────────────────────
// // Used for ALL sections that have real year values.
// // Rows = metrics (or line items), columns = sorted academic years.

// interface YearPivotRow {
//   label: string;
//   subLabel?: string;
//   yearVals: Record<string, string>;  // baseYear → value
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({
//   rows, years, col1 = "Metric",
// }: {
//   rows: YearPivotRow[];
//   years: string[];   // sorted ascending base years e.g. ["2021-22","2022-23","2023-24"]
//   col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width:"100%",borderCollapse:"collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 220 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr key={`${row.label}${i}`} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent",transition:"background 0.1s" }} {...rh(i)}>
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--ink-300)",marginLeft:6 }}>{row.subLabel}</span>}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 let d = "—";
//                 if (val) { if (row.isSal) d = fmtSal(val); else if (row.isAmt) d = fmtCr(val); else d = fmtN(val); }
//                 return (
//                   <td key={yr} style={{ ...TDR, color: val ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)") : "var(--ink-100)", fontWeight: row.isBold && val ? 700 : 400, background: row.isBold && val ? "var(--crimson-pale)" : undefined }}>
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Build YearPivotRows from a list of metrics.
// // Groups by metric name, collects year→value from the 'year' field.
// function buildPivotRows(
//   metrics: RawMetric[],
//   opts?: { isSal?: boolean; isAmt?: boolean; groupByProgram?: boolean }
// ): { rows: YearPivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();

//   for (const m of metrics) {
//     if (isBAD(m.value) || !cl(m.metric)) continue;
//     if (m.metric.toLowerCase().includes("in words")) continue;
//     const yr = isRealYear(m.year) ? shortYear(m.year) : null;
//     const key = cl(m.metric);
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     if (yr) {
//       yearSet.add(yr);
//       metricMap.get(key)![yr] = cl(m.value);
//     }
//   }

//   const years = Array.from(yearSet).sort();
//   const rows: YearPivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric,
//       yearVals,
//       isSal: opts?.isSal ?? (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt: opts?.isAmt ?? ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) && !metric.toLowerCase().includes("words")),
//     }));

//   return { rows, years };
// }

// // ─── Collapsible program group ────────────────────────────────────────────────

// function PGroup({ label, children, open: init = true }: { label: string; children: React.ReactNode; open?: boolean }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom:14,border:"1px solid var(--border)",overflow:"hidden" }}>
//       <button onClick={() => setO(x => !x)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"var(--off-white)",border:"none",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.82rem",color:"var(--crimson-dark)",textAlign:"left",borderBottom:o?"1px solid var(--border)":"none" }}>
//         <span>{label}</span>
//         <span style={{ fontSize:"0.65rem",color:"var(--ink-400)",transform:o?"rotate(90deg)":"none",transition:"transform 0.2s" }}>▶</span>
//       </button>
//       {o && <div style={{ padding:"16px 20px",background:"var(--white)" }}>{children}</div>}
//     </div>
//   );
// }

// // ─── SCORES ───────────────────────────────────────────────────────────────────

// function TabScores({ row, imgCols }: { row: Record<string, unknown>; imgCols: string[] }) {
//   return (
//     <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
//         <KV label="NIRF Total" value={row.img_total != null ? (row.img_total as number).toFixed(2) : null} accent big />
//         <KV label="Student Strength" value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null} />
//         <KV label="Faculty Ratio" value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null} />
//         <KV label="Perception" value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null} />
//       </div>
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => <ScoreBar key={k} label={SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()} score={row[k] as number|null} total={row[k.replace("_score","_total")] as number|null} />)}
//       </Card>
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX:"auto" }}>
//           <table style={{ width:"100%",borderCollapse:"collapse" }}>
//             <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number|null, t = row[k.replace("_score","_total")] as number|null;
//                 const p = s != null && (t ?? 100) > 0 ? ((s / (t ?? 100)) * 100).toFixed(1) + "%" : "—";
//                 return (
//                   <tr key={k} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                     <td style={TD}>{SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}</td>
//                     <td style={{ ...TDR, color:"var(--crimson)",fontWeight:600 }}>{s?.toFixed(2) ?? "—"}</td>
//                     <td style={{ ...TDR, color:"var(--ink-400)" }}>{t?.toFixed(0) ?? "—"}</td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─── INTAKE ───────────────────────────────────────────────────────────────────
// // Year values: "2023-24", "2022-23", "2021-22", etc. (plain academic years)
// // Some rows have "-" (no data that year) — skip those.

// function TabIntake({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.value) && r.value !== "nan" && !isBAD(r.program));
//   if (!valid.length) return <Empty msg="No intake data." />;

//   // Group by program
//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgP = allP.filter(p => p.toUpperCase().startsWith("PG") || p.toUpperCase().startsWith("PG-"));
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p));

//   // Collect all real years across all programs
//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) {
//       if (isRealYear(r.year)) yearSet.add(shortYear(r.year));
//     }
//   }
//   const years = Array.from(yearSet).sort();

//   // Build pivot rows for a program group
//   function mkRows(progs: string[]): YearPivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (isRealYear(r.year) && !isBAD(r.value) && r.value !== "nan") {
//           yearVals[shortYear(r.year)] = cl(r.value);
//         }
//       }
//       return { label: p, yearVals };
//     }).filter(r => Object.keys(r.yearVals).length > 0);
//   }

//   // Grand total per year
//   const totals: Record<string, number> = {};
//   for (const rows of pm.values()) {
//     for (const r of rows) {
//       if (!isRealYear(r.year) || isBAD(r.value) || r.value === "nan") continue;
//       const yr = shortYear(r.year);
//       const n = Number(cl(r.value).replace(/,/g, ""));
//       if (!isNaN(n)) totals[yr] = (totals[yr] ?? 0) + n;
//     }
//   }
//   const latestYear = years.at(-1);
//   const grandTotal = latestYear ? totals[latestYear] : 0;

//   const totalRow: YearPivotRow = {
//     label: "Grand Total",
//     yearVals: Object.fromEntries(Object.entries(totals).map(([y, v]) => [y, String(v)])),
//     isBold: true,
//   };

//   return (
//     <div>
//       {grandTotal > 0 && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20 }}>
//           <KV label={`Grand Total (${latestYear ?? "Latest"})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}
//       {ugP.length > 0 && (<div style={{ marginBottom:20 }}><SH>Undergraduate Programs</SH><YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" /></div>)}
//       {pgP.length > 0 && (<div style={{ marginBottom:20 }}><SH>Postgraduate Programs</SH><YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" /></div>)}
//       {otP.length > 0 && (<div style={{ marginBottom:20 }}><SH>Other Programs</SH><YearPivotTable rows={mkRows(otP)} years={years} col1="Program" /></div>)}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ overflowX:"auto",borderTop:"2px solid var(--border)" }}>
//           <YearPivotTable rows={[totalRow]} years={years} col1="" />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── PLACEMENT ────────────────────────────────────────────────────────────────
// // Year values like "2023-24 (Graduation Year)", "2022-23 (Intake Year)", etc.
// // Each metric+year combination is a distinct row.
// // Group by program → UG / PG / PG-Integrated.

// function TabPlacement({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r =>
//     !isBAD(r.value) && r.value !== "nan" &&
//     !r.metric.toLowerCase().includes("in words") &&
//     !isBAD(r.program) && !isBAD(r.metric)
//   );
//   if (!valid.length) return <Empty />;

//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows = pm.get(prog)!;
//     const { rows: pivotRows, years } = buildPivotRows(rows);

//     if (!pivotRows.length || !years.length) return <Empty msg="No data for this program." />;

//     // Summary KVs using latest year
//     const latestYr = years.at(-1) ?? "";
//     const find = (kw: string) => pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestYr];
//     const placed = find("students placed");
//     const salary = pivotRows.find(r => r.label.toLowerCase().includes("salary") || r.label.toLowerCase().includes("median"))?.yearVals[latestYr];
//     const higher = find("higher studies") ?? find("selected for higher");

//     return (
//       <div>
//         {(placed || salary || higher) && (
//           <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:14 }}>
//             {placed && <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />}
//             {salary && <KV label={`Median Salary (${latestYr})`} value={fmtSal(salary)} />}
//             {higher && <KV label={`Higher Studies (${latestYr})`} value={fmtN(higher)} />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({ progs, label, open = true }: { progs: string[]; label: string; open?: boolean }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`} open={open}>
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && <div style={{ fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.78rem",color:"var(--crimson-dark)",margin:i===0?"0 0 10px":"20px 0 10px",paddingBottom:6,borderBottom:"1px dashed var(--border)" }}>{p}</div>}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP} label="Undergraduate Programs" open={true} />
//       <RG progs={pgP} label="Postgraduate Programs" open={true} />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP} label="Other Programs" open={false} />
//     </div>
//   );
// }

// // ─── PhD ──────────────────────────────────────────────────────────────────────
// // Pursuing: year="-" (single values, no year axis)
// // Graduated: year="2023-24", "2022-23", "2021-22" (real years)

// function TabPhd({ metrics }: { metrics: RawMetric[] }) {
//   if (!metrics.length) return <Empty />;

//   const pursuing  = metrics.filter(r => r.program.toLowerCase().includes("pursuing") && !isBAD(r.value));
//   const graduated = metrics.filter(r => r.program.toLowerCase().includes("graduated") && !isBAD(r.value));

//   const pmMap = groupBy(pursuing, r => cl(r.metric));
//   const ftP = pursuing.find(r => r.metric.toLowerCase().includes("full time"))?.value;
//   const ptP = pursuing.find(r => r.metric.toLowerCase().includes("part time"))?.value;

//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

//   return (
//     <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
//       {(ftP || ptP) && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
//           {ftP && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           <div style={{ overflowX:"auto" }}>
//             <table style={{ width:"100%",borderCollapse:"collapse" }}>
//               <thead><tr><th style={TH}>Category</th><th style={THR}>Total Students</th></tr></thead>
//               <tbody>
//                 {Array.from(pmMap.entries()).map(([m, rs], i) => (
//                   <tr key={m} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                     <td style={TD}>{m}</td>
//                     <td style={{ ...TDR, fontWeight:600, color:"var(--ink-700)" }}>{fmtN(cl(rs[0]?.value ?? ""))}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — Previous 3 Years" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─── STUDENTS ────────────────────────────────────────────────────────────────
// // year="-" (single snapshot, no year axis)

// function TabStudents({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "All Programs");
//   return (
//     <Card title="Total Student Strength" noPad>
//       <div style={{ overflowX:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"collapse" }}>
//           <thead><tr><th style={{ ...TH, minWidth:180 }}>Program</th><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//           <tbody>
//             {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//               rows.map((r, i) => (
//                 <tr key={`${prog}${i}`} style={{ borderBottom:"1px solid var(--border)",background:(gi+i)%2?"var(--off-white)":"transparent" }} {...rh(gi+i)}>
//                   {i === 0 ? <td style={{ ...TDM, verticalAlign:"top" }} rowSpan={rows.length}>{prog}</td> : null}
//                   <td style={TD}>{r.metric}</td>
//                   <td style={TDR}>{fmtN(cl(r.value))}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </Card>
//   );
// }

// // ─── RESEARCH ─────────────────────────────────────────────────────────────────
// // Year values: "2023-24", "2022-23", "2021-22" (real years — ETL fix preserved these)

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(r =>
//     !isBAD(r.value) && r.value !== "nan" &&
//     !r.metric.toLowerCase().includes("in words") &&
//     !isBAD(r.metric)
//   );
//   if (!valid.length) return null;

//   const pm = groupBy(valid, r => cl(r.program) || "All Programs");
//   const multi = pm.size > 1;

//   // Collect all years
//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) { if (isRealYear(r.year)) yearSet.add(shortYear(r.year)); }
//   }
//   const years = Array.from(yearSet).sort();

//   const rows: YearPivotRow[] = Array.from(pm.entries()).flatMap(([prog, prows]) => {
//     const mm = groupBy(prows, r => cl(r.metric));
//     return Array.from(mm.entries()).map(([metric, mrows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of mrows) {
//         if (isRealYear(r.year) && !isBAD(r.value)) yearVals[shortYear(r.year)] = cl(r.value);
//       }
//       return {
//         label: multi ? prog : metric,
//         subLabel: multi ? metric : undefined,
//         yearVals,
//         isAmt: metric.toLowerCase().includes("amount"),
//       };
//     }).filter(r => Object.keys(r.yearVals).length > 0);
//   });

//   if (!rows.length || !years.length) return null;

//   return (
//     <Card title={title} noPad>
//       <YearPivotTable rows={rows} years={years} />
//     </Card>
//   );
// }

// function TabResearch({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
//   const get = (kw: string) => sections
//     .filter(s => s.section.toLowerCase().includes(kw))
//     .flatMap(s => s.metrics)
//     .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

//   const sr = get("sponsored research"), co = get("consultancy"), edp = get("executive development");
//   if (!sr.length && !co.length && !edp.length) return <Empty />;

//   return (
//     <div>
//       {row && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:16 }}>
//           {row.pdf_sponsored_projects != null && <KV label="Sponsored Projects (3yr)" value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")} accent />}
//           {row.pdf_consultancy_projects != null && <KV label="Consultancy Projects (3yr)" value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")} />}
//           {row.pdf_edp_participants != null && <KV label="EDP Participants (3yr)" value={Number(row.pdf_edp_participants).toLocaleString("en-IN")} />}
//         </div>
//       )}
//       {sr.length > 0 && <ResBlock metrics={sr} title="Sponsored Research Details" />}
//       {co.length > 0 && <ResBlock metrics={co} title="Consultancy Project Details" />}
//       {edp.length > 0 && <ResBlock metrics={edp} title="Executive Development Programs" />}
//     </div>
//   );
// }

// // ─── FINANCIAL ────────────────────────────────────────────────────────────────
// // Year values: "2023-24", "2022-23", "2021-22" (real years)
// // program = line item (Library, Salaries, etc.), metric = "Utilised Amount"
// // Filter "In Words" rows completely.

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const nums = metrics.filter(r =>
//     !isBAD(r.value) && r.value !== "nan" &&
//     !r.metric.toLowerCase().includes("in words")
//   );
//   if (!nums.length) return null;

//   const pm = groupBy(nums, r => cl(r.program) || "General");

//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) { if (isRealYear(r.year)) yearSet.add(shortYear(r.year)); }
//   }
//   const years = Array.from(yearSet).sort();
//   if (!years.length) return null;

//   const rows: YearPivotRow[] = Array.from(pm.entries()).map(([prog, prows]) => {
//     const yearVals: Record<string, string> = {};
//     for (const r of prows) {
//       if (isRealYear(r.year) && !isBAD(r.value)) yearVals[shortYear(r.year)] = cl(r.value);
//     }
//     return { label: prog, yearVals, isAmt: true };
//   }).filter(r => Object.keys(r.yearVals).length > 0);

//   // Total row
//   const totalYearVals: Record<string, string> = {};
//   for (const yr of years) {
//     let s = 0;
//     for (const r of rows) { const n = Number((r.yearVals[yr] ?? "").replace(/,/g, "")); if (!isNaN(n)) s += n; }
//     if (s > 0) totalYearVals[yr] = String(s);
//   }
//   const allRows: YearPivotRow[] = [...rows, { label: "Total", yearVals: totalYearVals, isAmt: true, isBold: true }];

//   return (
//     <Card title={title} noPad>
//       <YearPivotTable rows={allRows} years={years} col1="Line Item" />
//     </Card>
//   );
// }

// function TabFinancial({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
//   const get = (kw: string) => sections
//     .filter(s => s.section.toLowerCase().includes(kw))
//     .flatMap(s => s.metrics)
//     .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

//   const cap = get("capital expenditure"), ops = get("operational expenditure");
//   if (!cap.length && !ops.length) return <Empty />;

//   return (
//     <div>
//       {row && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:16 }}>
//           {row.pdf_capital_expenditure != null && <KV label="Capital Expenditure (3yr Sum)" value={fmtCr(String(row.pdf_capital_expenditure))} accent />}
//           {row.pdf_operational_expenditure != null && <KV label="Operational Expenditure (3yr Sum)" value={fmtCr(String(row.pdf_operational_expenditure))} />}
//         </div>
//       )}
//       {cap.length > 0 && <FinBlock metrics={cap} title="Capital Expenditure" />}
//       {ops.length > 0 && <FinBlock metrics={ops} title="Operational Expenditure" />}
//     </div>
//   );
// }

// // ─── FACULTY ──────────────────────────────────────────────────────────────────

// function TabFaculty({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <Card title="Faculty Details" noPad>
//       <div style={{ overflowX:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"collapse" }}>
//           <thead><tr><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//           <tbody>
//             {valid.map((r, i) => (
//               <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{fmtN(cl(r.value))}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </Card>
//   );
// }

// // ─── FACILITIES ───────────────────────────────────────────────────────────────

// function TabFacilities({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <Card title="PCS Facilities — Physically Challenged Students">
//       {valid.map((r, i) => {
//         const yes = r.value.toLowerCase().startsWith("yes");
//         return (
//           <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"12px 0",borderBottom:i<valid.length-1?"1px solid var(--border)":"none" }}>
//             <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)",flex:1,lineHeight:1.5 }}>{r.metric}</span>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",flexShrink:0,padding:"3px 10px",color:yes?"var(--teal)":"var(--crimson)",background:yes?"var(--teal-pale)":"var(--crimson-pale)",border:`1px solid ${yes?"rgba(26,122,110,0.2)":"rgba(192,57,43,0.2)"}` }}>
//               {r.value}
//             </span>
//           </div>
//         );
//       })}
//     </Card>
//   );
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile, setProfile]     = useState<InstituteProfileResponse | null>(null);
//   const [loading, setLoading]     = useState(true);
//   const [activeTab, setActiveTab] = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const ys = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(ys[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) return <div style={{ padding:"80px 32px",textAlign:"center" }}><p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)",fontSize:"0.8rem" }}>Loading…</p></div>;
//   if (!profile) return <div style={{ padding:"80px 32px",textAlign:"center" }}><p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)" }}>Could not load data.</p></div>;

//   const allYears   = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row        = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols    = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));
//   const ry         = activeYear ?? new Date().getFullYear();

//   function sm(kw: string): RawMetric[] {
//     return rawSections
//       .filter(s => s.section.toLowerCase().includes(kw.toLowerCase()))
//       .flatMap(s => s.metrics)
//       .filter(m => !activeYear || m.ranking_year === activeYear || m.ranking_year === 0);
//   }

//   const tabs: Record<TabId, React.ReactNode> = {
//     scores:    row ? <TabScores row={row} imgCols={imgCols} /> : <Empty />,
//     intake:    <TabIntake metrics={sm("sanctioned")} />,
//     placement: <TabPlacement metrics={sm("placement")} />,
//     phd:       <TabPhd metrics={sm("ph.d")} />,
//     students:  <TabStudents metrics={[...sm("total actual"), ...sm("student strength")]} />,
//     research:  <TabResearch sections={rawSections} ry={ry} row={row} />,
//     financial: <TabFinancial sections={rawSections} ry={ry} row={row} />,
//     faculty:   <TabFaculty metrics={sm("faculty")} />,
//     facilities:<TabFacilities metrics={[...sm("pcs"), ...sm("physically challenged")]} />,
//   };

//   return (
//     <div style={{ maxWidth:1000,margin:"0 auto",padding:"28px 20px 64px" }}>

//       {/* Hero */}
//       <div style={{ background:"var(--white)",border:"1px solid var(--border)",padding:"24px 28px",marginBottom:20,boxShadow:"var(--shadow-sm)" }}>
//         <div style={{ display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap" }}>
//           <div style={{ flex:1,minWidth:200 }}>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",background:"var(--crimson-pale)",border:"1px solid rgba(192,57,43,0.2)",padding:"2px 8px",marginBottom:10,display:"inline-block" }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"clamp(1.3rem,3vw,1.9rem)",color:"var(--ink-900)",lineHeight:1.2,marginBottom:5 }}>{profile.institute_name}</h1>
//             <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-300)" }}>{profile.institute_code}</p>
//           </div>
//           {row?.img_total != null && (
//             <div style={{ textAlign:"right",flexShrink:0 }}>
//               <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"3.2rem",color:"var(--crimson)",lineHeight:1,marginBottom:3 }}>{(row.img_total as number).toFixed(2)}</p>
//               <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-300)" }}>NIRF Total Score</p>
//             </div>
//           )}
//         </div>
//         {allYears.length > 0 && (
//           <div style={{ marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-300)",marginRight:4 }}>Ranking Year</span>
//             {allYears.map(y => (
//               <button key={y} onClick={() => setActiveYear(y)} style={{ fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"3px 11px",background:activeYear===y?"var(--crimson)":"var(--white)",color:activeYear===y?"var(--white)":"var(--ink-500)",border:`1px solid ${activeYear===y?"var(--crimson)":"var(--border)"}`,cursor:"pointer",transition:"all 0.15s" }}>
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs */}
//       <div style={{ display:"flex",borderBottom:"2px solid var(--border)",marginBottom:20,overflowX:"auto" }}>
//         {TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily:"var(--font-body)",fontWeight:activeTab===tab.id?600:400,fontSize:"0.78rem",padding:"9px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid var(--crimson)":"2px solid transparent",marginBottom:"-2px",color:activeTab===tab.id?"var(--crimson)":"var(--ink-400)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5 }}>
//             <span style={{ fontSize:"0.7rem",opacity:0.7 }}>{tab.icon}</span>{tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab body */}
//       <div key={`${activeTab}-${activeYear}`} style={{ animation:"fadeIn 0.18s ease both" }}>
//         {tabs[activeTab]}
//       </div>
//     </div>
//   );
// }
































//working





// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";

// interface Props { hit: SearchHit; }
// interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
// interface RawSection { section: string; metrics: RawMetric[]; }
// type TabId = "scores"|"intake"|"placement"|"phd"|"students"|"research"|"financial"|"faculty"|"facilities";

// const TABS: {id:TabId;label:string;icon:string}[] = [
//   {id:"scores",    label:"NIRF Scores",  icon:"★"},
//   {id:"intake",    label:"Intake",       icon:"⊕"},
//   {id:"placement", label:"Placement",    icon:"↗"},
//   {id:"phd",       label:"PhD",          icon:"⚗"},
//   {id:"students",  label:"Students",     icon:"◎"},
//   {id:"research",  label:"Research",     icon:"◈"},
//   {id:"financial", label:"Financial",    icon:"₹"},
//   {id:"faculty",   label:"Faculty",      icon:"✦"},
//   {id:"facilities",label:"Facilities",   icon:"⌂"},
// ];

// // ─── Year helpers ─────────────────────────────────────────────────────────────

// const BAD_YEAR = new Set(["", "nan", "<na>", "null", "undefined", "none"]);

// // A year is "real" if it looks like YYYY-YY (with or without a suffix like "Graduation Year")
// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD_YEAR.has(v.toLowerCase()) && /^\d{4}-\d{2}/.test(v);
// }

// // Strip suffix: "2023-24 (Graduation Year)" → "2023-24"
// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// // ─── Value helpers ────────────────────────────────────────────────────────────

// const BAD_VAL = new Set(["nan", "<na>", "null", "undefined", "n/a", "na", ""]);
// const isBAD = (v: string | null | undefined) => BAD_VAL.has((v ?? "").trim().toLowerCase());
// const cl = (v: string | null | undefined): string => isBAD(v) ? "" : (v ?? "").trim();

// // A value is genuinely empty (dash or bad) — show as "—" in table
// function isEmpty(v: string | null | undefined): boolean {
//   const s = (v ?? "").trim();
//   return s === "" || s === "-" || isBAD(s);
// }

// function fmtN(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   return isNaN(n) ? v : n.toLocaleString("en-IN");
// }
// function fmtSal(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   return isNaN(n) ? v : `₹${(n / 100_000).toFixed(1)}L`;
// }
// function fmtCr(v: string): string {
//   const n = Number(v.replace(/,/g, ""));
//   if (isNaN(n)) return v;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtV(v: string, metric: string): string {
//   if (!v) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtCr(v);
//   return fmtN(v);
// }

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
//   return m;
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = { fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-400)",padding:"8px 14px",textAlign:"left",borderBottom:"2px solid var(--border)",background:"var(--off-white)",whiteSpace:"nowrap" };
// const THR: React.CSSProperties = { ...TH, textAlign:"right" };
// const TD: React.CSSProperties = { padding:"8px 14px",color:"var(--ink-700)",verticalAlign:"middle",fontSize:"0.78rem" };
// const TDM: React.CSSProperties = { ...TD, color:"var(--ink-400)",fontFamily:"var(--font-mono)",fontSize:"0.68rem" };
// const TDR: React.CSSProperties = { ...TD, textAlign:"right",fontFamily:"var(--font-mono)" };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "var(--crimson-pale)"; },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent"; },
//   };
// }

// // ─── Primitives ───────────────────────────────────────────────────────────────

// function KV({ label, value, accent, big }: { label: string; value?: string | null; accent?: boolean; big?: boolean }) {
//   return (
//     <div style={{ background:accent?"var(--crimson-pale)":"var(--off-white)",border:`1px solid ${accent?"rgba(192,57,43,0.18)":"var(--border)"}`,padding:"14px 16px" }}>
//       <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.09em",color:accent?"var(--crimson)":"var(--ink-500)",marginBottom:5 }}>{label}</p>
//       <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:big?"1.9rem":"1.35rem",color:accent?"var(--crimson-dark)":"var(--ink-900)",lineHeight:1 }}>{value || "—"}</p>
//     </div>
//   );
// }

// function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }) {
//   return (
//     <div style={{ background:"var(--white)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",marginBottom:14,overflow:"hidden",padding:noPad?0:"20px 24px" }}>
//       {title && <h3 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"1rem",color:"var(--ink-900)",margin:0,padding:noPad?"16px 24px 14px":"0 0 8px",borderBottom:"1px solid var(--border)",marginBottom:14 }}>{title}</h3>}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)" }}>{children}</p>;
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-300)",padding:"20px 0" }}>{msg}</p>;
// }

// function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
//   const pct = score != null && (total ?? 100) > 0 ? Math.min((score / (total ?? 100)) * 100, 100) : 0;
//   return (
//     <div style={{ marginBottom:12 }}>
//       <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
//         <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)" }}>{label}</span>
//         <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-400)" }}>{score?.toFixed(2)??"—"} / {total?.toFixed(0)??"—"}</span>
//       </div>
//       <div style={{ height:5,background:"var(--border)" }}>
//         <div style={{ height:"100%",width:`${pct}%`,background:"var(--crimson)",transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
//       </div>
//     </div>
//   );
// }

// // ─── YearPivotTable ───────────────────────────────────────────────────────────
// // Universal pivot table: rows = metrics/programs, columns = sorted academic years.
// // yearVals maps baseYear → value string (may be "" meaning no data → show "—").

// interface PivotRow {
//   label: string;
//   subLabel?: string;
//   // Map of baseYear → display value. Key exists if year was present in data (even if value is "—").
//   yearVals: Record<string, string>;
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({ rows, years, col1 = "Metric" }: {
//   rows: PivotRow[];
//   years: string[];   // sorted ascending base years e.g. ["2020-21","2021-22","2022-23","2023-24"]
//   col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX:"auto" }}>
//       <table style={{ width:"100%",borderCollapse:"collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth:220 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr key={`${row.label}${i}`} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent",transition:"background 0.1s" }} {...rh(i)}>
//               <td style={row.isBold ? { ...TD, fontWeight:700 } : TD}>
//                 {row.label}
//                 {row.subLabel && <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--ink-300)",marginLeft:6 }}>{row.subLabel}</span>}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 // val === undefined → year not in data at all (shouldn't happen if years is built correctly)
//                 // val === "" → year exists but value is "-" or empty → show "—" in muted style
//                 // val has content → format and show
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) {
//                   if (row.isSal) d = fmtSal(val);
//                   else if (row.isAmt) d = fmtCr(val);
//                   else d = fmtN(val);
//                 }
//                 return (
//                   <td key={yr} style={{
//                     ...TDR,
//                     color: hasVal ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)") : "var(--ink-100)",
//                     fontWeight: row.isBold && hasVal ? 700 : 400,
//                     background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
//                   }}>
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // ─── Collapsible program group ────────────────────────────────────────────────

// function PGroup({ label, children, open: init = true }: { label: string; children: React.ReactNode; open?: boolean }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom:14,border:"1px solid var(--border)",overflow:"hidden" }}>
//       <button onClick={() => setO(x => !x)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"var(--off-white)",border:"none",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.82rem",color:"var(--crimson-dark)",textAlign:"left",borderBottom:o?"1px solid var(--border)":"none" }}>
//         <span>{label}</span>
//         <span style={{ fontSize:"0.65rem",color:"var(--ink-400)",transform:o?"rotate(90deg)":"none",transition:"transform 0.2s" }}>▶</span>
//       </button>
//       {o && <div style={{ padding:"16px 20px",background:"var(--white)" }}>{children}</div>}
//     </div>
//   );
// }

// // ─── SCORES ───────────────────────────────────────────────────────────────────

// function TabScores({ row, imgCols }: { row: Record<string, unknown>; imgCols: string[] }) {
//   return (
//     <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
//         <KV label="NIRF Total"       value={row.img_total    != null ? (row.img_total    as number).toFixed(2) : null} accent big />
//         <KV label="Student Strength" value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null} />
//         <KV label="Faculty Ratio"    value={row.img_fsr_score!= null ? (row.img_fsr_score as number).toFixed(2): null} />
//         <KV label="Perception"       value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null} />
//       </div>
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar key={k}
//             label={SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}
//             score={row[k] as number|null}
//             total={row[k.replace("_score","_total")] as number|null}
//           />
//         ))}
//       </Card>
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX:"auto" }}>
//           <table style={{ width:"100%",borderCollapse:"collapse" }}>
//             <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number|null, t = row[k.replace("_score","_total")] as number|null;
//                 const p = s != null && (t ?? 100) > 0 ? ((s / (t ?? 100)) * 100).toFixed(1) + "%" : "—";
//                 return (
//                   <tr key={k} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                     <td style={TD}>{SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}</td>
//                     <td style={{ ...TDR, color:"var(--crimson)",fontWeight:600 }}>{s?.toFixed(2)??"—"}</td>
//                     <td style={{ ...TDR, color:"var(--ink-400)" }}>{t?.toFixed(0)??"—"}</td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─── INTAKE ───────────────────────────────────────────────────────────────────
// // Fix: ALL year rows for a program define the columns (including "-" value rows).
// // The year column is always present in the data (e.g. "2019-20", "2020-21"...).
// // Rows with "-" value show "—" in the cell, NOT hidden.

// function TabIntake({ metrics }: { metrics: RawMetric[] }) {
//   // Only keep rows that have a real year label (filter junk like <NA>)
//   const valid = metrics.filter(r => !isBAD(r.program) && isRealYear(r.year));
//   if (!valid.length) return <Empty msg="No intake data." />;

//   // Group by program
//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgP = allP.filter(p => p.toUpperCase().startsWith("PG") || p.toUpperCase().startsWith("PG-"));
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p));

//   // Collect ALL real years across all programs (even those with "-" values)
//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) {
//       if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     }
//   }
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         const yr = baseYear(r.year);
//         // If value is "-" or bad → store "" (will show as "—" in cell)
//         yearVals[yr] = isEmpty(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   // Grand total: only sum real numeric values per year
//   const totalYearVals: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, hasAny = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; hasAny = true; }
//     }
//     totalYearVals[yr] = hasAny ? String(sum) : "";
//   }

//   const latestYear = years.at(-1);
//   const grandTotal = latestYear && totalYearVals[latestYear] ? Number(totalYearVals[latestYear]) : 0;

//   return (
//     <div>
//       {grandTotal > 0 && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20 }}>
//           <KV label={`Grand Total (${latestYear})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}

//       {ugP.length > 0 && (
//         <div style={{ marginBottom:20 }}>
//           <SH>Undergraduate Programs</SH>
//           <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgP.length > 0 && (
//         <div style={{ marginBottom:20 }}>
//           <SH>Postgraduate Programs</SH>
//           <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
//         </div>
//       )}
//       {otP.length > 0 && (
//         <div style={{ marginBottom:20 }}>
//           <SH>Other Programs</SH>
//           <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
//         </div>
//       )}

//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ overflowX:"auto",borderTop:"2px solid var(--border)" }}>
//           <YearPivotTable
//             rows={[{ label:"Grand Total", yearVals: totalYearVals, isBold: true }]}
//             years={years}
//             col1=""
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── PLACEMENT ────────────────────────────────────────────────────────────────

// function TabPlacement({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r =>
//     !isBAD(r.program) && !isBAD(r.metric) &&
//     !r.metric.toLowerCase().includes("in words") &&
//     isRealYear(r.year)
//   );
//   if (!valid.length) return <Empty />;

//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows = pm.get(prog)!;

//     // Collect all real years for this program
//     const yearSet = new Set<string>();
//     for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
//     const years = Array.from(yearSet).sort();

//     // Build pivot rows grouped by metric
//     const mm = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries()).map(([metric, mrows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of mrows) {
//         if (!isRealYear(r.year)) continue;
//         const yr = baseYear(r.year);
//         yearVals[yr] = isEmpty(r.value) ? "" : cl(r.value);
//       }
//       return {
//         label: metric,
//         yearVals,
//         isSal: metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median"),
//       };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

//     if (!pivotRows.length || !years.length) return <Empty msg="No data for this program." />;

//     // Summary KVs using latest year
//     const latestYr = years.at(-1) ?? "";
//     const findVal = (kw: string) => {
//       const r = pivotRows.find(r => r.label.toLowerCase().includes(kw));
//       return r?.yearVals[latestYr] || undefined;
//     };
//     const placed = findVal("students placed");
//     const salary = pivotRows.find(r => r.isSal)?.yearVals[latestYr];
//     const higher = findVal("higher studies") ?? findVal("selected for higher");

//     return (
//       <div>
//         {(placed || salary || higher) && (
//           <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:14 }}>
//             {placed && <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />}
//             {salary && <KV label={`Median Salary (${latestYr})`} value={fmtSal(salary)} />}
//             {higher && <KV label={`Higher Studies (${latestYr})`} value={fmtN(higher)} />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({ progs, label, open = true }: { progs: string[]; label: string; open?: boolean }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`} open={open}>
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && (
//               <div style={{ fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.78rem",color:"var(--crimson-dark)",margin:i===0?"0 0 10px":"20px 0 10px",paddingBottom:6,borderBottom:"1px dashed var(--border)" }}>
//                 {p}
//               </div>
//             )}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true} />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true} />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─── PhD ──────────────────────────────────────────────────────────────────────
// // Fix 1: "Pursuing" section shows the program label which contains the cutoff
// //         year e.g. "Ph.D (Student pursuing doctoral program till 2023-24)"
// // Fix 2: Year column for pursuing is "-" (no year axis) — show as single value table.
// // Fix 3: Graduated section uses real year values from the year column.

// function TabPhd({ metrics }: { metrics: RawMetric[] }) {
//   if (!metrics.length) return <Empty />;

//   // Pursuing: program contains "pursuing", year is "-"
//   const pursuing  = metrics.filter(r => r.program.toLowerCase().includes("pursuing"));
//   // Graduated: program contains "graduated", year is real
//   const graduated = metrics.filter(r => r.program.toLowerCase().includes("graduated") && isRealYear(r.year));

//   // For pursuing: group by program (captures the cutoff label), then show metrics
//   const pursuingByProg = groupBy(pursuing, r => cl(r.program));

//   // KV summary from pursuing
//   const ftVal = pursuing.find(r => r.metric.toLowerCase().includes("full time"))?.value;
//   const ptVal = pursuing.find(r => r.metric.toLowerCase().includes("part time"))?.value;

//   // Graduated pivot
//   const yearSet = new Set<string>();
//   for (const r of graduated) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
//   const gradYears = Array.from(yearSet).sort();

//   const gradMM = groupBy(graduated, r => cl(r.metric));
//   const gradRows: PivotRow[] = Array.from(gradMM.entries()).map(([metric, mrows]) => {
//     const yearVals: Record<string, string> = {};
//     for (const r of mrows) {
//       if (!isRealYear(r.year)) continue;
//       yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
//     }
//     return { label: metric, yearVals };
//   }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

//   return (
//     <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

//       {/* Summary KVs */}
//       {(ftVal || ptVal) && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
//           {ftVal && !isEmpty(ftVal) && <KV label="Full Time Students" value={fmtN(cl(ftVal))} accent />}
//           {ptVal && !isEmpty(ptVal) && <KV label="Part Time Students" value={fmtN(cl(ptVal))} />}
//         </div>
//       )}

//       {/* Currently Enrolled — one card per pursuing program (shows cutoff year in title) */}
//       {Array.from(pursuingByProg.entries()).map(([prog, rows]) => (
//         <Card key={prog} title="Currently Enrolled" noPad>
//           {/* Show program label as subtitle — it contains "till 2023-24" */}
//           <div style={{ padding:"10px 16px 0",fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"var(--ink-400)",fontStyle:"italic" }}>
//             {prog}
//           </div>
//           <div style={{ overflowX:"auto" }}>
//             <table style={{ width:"100%",borderCollapse:"collapse" }}>
//               <thead>
//                 <tr>
//                   <th style={TH}>Category</th>
//                   <th style={THR}>Total Students</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.filter(r => !isBAD(r.metric)).map((r, i) => (
//                   <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                     <td style={TD}>{r.metric}</td>
//                     <td style={{ ...TDR, fontWeight:600, color:"var(--ink-700)" }}>
//                       {isEmpty(r.value) ? "—" : fmtN(cl(r.value))}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>
//       ))}

//       {/* Graduated — Previous 3 Years */}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — Previous 3 Years" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─── STUDENTS ─────────────────────────────────────────────────────────────────

// function TabStudents({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "All Programs");
//   return (
//     <Card title="Total Student Strength" noPad>
//       <div style={{ overflowX:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"collapse" }}>
//           <thead>
//             <tr>
//               <th style={{ ...TH,minWidth:180 }}>Program</th>
//               <th style={TH}>Metric</th>
//               <th style={THR}>Value</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//               rows.map((r, i) => (
//                 <tr key={`${prog}${i}`} style={{ borderBottom:"1px solid var(--border)",background:(gi+i)%2?"var(--off-white)":"transparent" }} {...rh(gi+i)}>
//                   {i === 0 ? <td style={{ ...TDM,verticalAlign:"top" }} rowSpan={rows.length}>{prog}</td> : null}
//                   <td style={TD}>{r.metric}</td>
//                   <td style={TDR}>{fmtN(cl(r.value))}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </Card>
//   );
// }

// // ─── RESEARCH ────────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(r =>
//     !isBAD(r.value) && r.value !== "nan" &&
//     !r.metric.toLowerCase().includes("in words") &&
//     !isBAD(r.metric) && isRealYear(r.year)
//   );
//   if (!valid.length) return null;

//   const pm = groupBy(valid, r => cl(r.program) || "All Programs");
//   const multi = pm.size > 1;

//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
//   }
//   const years = Array.from(yearSet).sort();
//   if (!years.length) return null;

//   const rows: PivotRow[] = Array.from(pm.entries()).flatMap(([prog, prows]) => {
//     const mm = groupBy(prows, r => cl(r.metric));
//     return Array.from(mm.entries()).map(([metric, mrows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of mrows) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
//       }
//       return {
//         label: multi ? prog : metric,
//         subLabel: multi ? metric : undefined,
//         yearVals,
//         isAmt: metric.toLowerCase().includes("amount"),
//       };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
//   });

//   if (!rows.length) return null;

//   return (
//     <Card title={title} noPad>
//       <YearPivotTable rows={rows} years={years} />
//     </Card>
//   );
// }

// function TabResearch({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
//   const get = (kw: string) => sections
//     .filter(s => s.section.toLowerCase().includes(kw))
//     .flatMap(s => s.metrics)
//     .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

//   const sr = get("sponsored research"), co = get("consultancy"), edp = get("executive development");
//   if (!sr.length && !co.length && !edp.length) return <Empty />;

//   return (
//     <div>
//       {row && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:16 }}>
//           {row.pdf_sponsored_projects  != null && <KV label="Sponsored Projects (3yr)"  value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}  accent />}
//           {row.pdf_consultancy_projects!= null && <KV label="Consultancy Projects (3yr)" value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")} />}
//           {row.pdf_edp_participants    != null && <KV label="EDP Participants (3yr)"     value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}     />}
//         </div>
//       )}
//       {sr.length  > 0 && <ResBlock metrics={sr}  title="Sponsored Research Details" />}
//       {co.length  > 0 && <ResBlock metrics={co}  title="Consultancy Project Details" />}
//       {edp.length > 0 && <ResBlock metrics={edp} title="Executive Development Programs" />}
//     </div>
//   );
// }

// // ─── FINANCIAL ────────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const nums = metrics.filter(r =>
//     !r.metric.toLowerCase().includes("in words") && isRealYear(r.year)
//   );
//   if (!nums.length) return null;

//   const pm = groupBy(nums, r => cl(r.program) || "General");

//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) {
//     for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
//   }
//   const years = Array.from(yearSet).sort();
//   if (!years.length) return null;

//   const rows: PivotRow[] = Array.from(pm.entries()).map(([prog, prows]) => {
//     const yearVals: Record<string, string> = {};
//     for (const r of prows) {
//       if (!isRealYear(r.year)) continue;
//       yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
//     }
//     return { label: prog, yearVals, isAmt: true };
//   }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

//   // Total row
//   const totalYearVals: Record<string, string> = {};
//   for (const yr of years) {
//     let s = 0, hasAny = false;
//     for (const r of rows) {
//       const n = Number((r.yearVals[yr] ?? "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { s += n; hasAny = true; }
//     }
//     totalYearVals[yr] = hasAny ? String(s) : "";
//   }

//   return (
//     <Card title={title} noPad>
//       <YearPivotTable
//         rows={[...rows, { label:"Total", yearVals:totalYearVals, isAmt:true, isBold:true }]}
//         years={years}
//         col1="Line Item"
//       />
//     </Card>
//   );
// }

// function TabFinancial({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
//   const get = (kw: string) => sections
//     .filter(s => s.section.toLowerCase().includes(kw))
//     .flatMap(s => s.metrics)
//     .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

//   const cap = get("capital expenditure"), ops = get("operational expenditure");
//   if (!cap.length && !ops.length) return <Empty />;

//   return (
//     <div>
//       {row && (
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:16 }}>
//           {row.pdf_capital_expenditure     != null && <KV label="Capital Expenditure (3yr Sum)"     value={fmtCr(String(row.pdf_capital_expenditure))}     accent />}
//           {row.pdf_operational_expenditure != null && <KV label="Operational Expenditure (3yr Sum)" value={fmtCr(String(row.pdf_operational_expenditure))} />}
//         </div>
//       )}
//       {cap.length > 0 && <FinBlock metrics={cap} title="Capital Expenditure" />}
//       {ops.length > 0 && <FinBlock metrics={ops} title="Operational Expenditure" />}
//     </div>
//   );
// }

// // ─── FACULTY ──────────────────────────────────────────────────────────────────

// function TabFaculty({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <Card title="Faculty Details" noPad>
//       <div style={{ overflowX:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"collapse" }}>
//           <thead><tr><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//           <tbody>
//             {valid.map((r, i) => (
//               <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{fmtN(cl(r.value))}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </Card>
//   );
// }

// // ─── FACILITIES ───────────────────────────────────────────────────────────────

// function TabFacilities({ metrics }: { metrics: RawMetric[] }) {
//   const valid = metrics.filter(r => !isBAD(r.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <Card title="PCS Facilities — Physically Challenged Students">
//       {valid.map((r, i) => {
//         const yes = r.value.toLowerCase().startsWith("yes");
//         return (
//           <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"12px 0",borderBottom:i<valid.length-1?"1px solid var(--border)":"none" }}>
//             <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)",flex:1,lineHeight:1.5 }}>{r.metric}</span>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",flexShrink:0,padding:"3px 10px",color:yes?"var(--teal)":"var(--crimson)",background:yes?"var(--teal-pale)":"var(--crimson-pale)",border:`1px solid ${yes?"rgba(26,122,110,0.2)":"rgba(192,57,43,0.2)"}` }}>
//               {r.value}
//             </span>
//           </div>
//         );
//       })}
//     </Card>
//   );
// }

// // ─── MAIN ─────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const ys = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(ys[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) return (
//     <div style={{ padding:"80px 32px",textAlign:"center" }}>
//       <p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)",fontSize:"0.8rem" }}>Loading…</p>
//     </div>
//   );
//   if (!profile) return (
//     <div style={{ padding:"80px 32px",textAlign:"center" }}>
//       <p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)" }}>Could not load data.</p>
//     </div>
//   );

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols     = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));
//   const ry          = activeYear ?? new Date().getFullYear();

//   function sm(kw: string): RawMetric[] {
//     return rawSections
//       .filter(s => s.section.toLowerCase().includes(kw.toLowerCase()))
//       .flatMap(s => s.metrics)
//       .filter(m => !activeYear || m.ranking_year === activeYear || m.ranking_year === 0);
//   }

//   const tabs: Record<TabId, React.ReactNode> = {
//     scores:    row ? <TabScores row={row} imgCols={imgCols} /> : <Empty />,
//     intake:    <TabIntake    metrics={sm("sanctioned")} />,
//     placement: <TabPlacement metrics={sm("placement")} />,
//     phd:       <TabPhd       metrics={sm("ph.d")} />,
//     students:  <TabStudents  metrics={[...sm("total actual"), ...sm("student strength")]} />,
//     research:  <TabResearch  sections={rawSections} ry={ry} row={row} />,
//     financial: <TabFinancial sections={rawSections} ry={ry} row={row} />,
//     faculty:   <TabFaculty   metrics={sm("faculty")} />,
//     facilities:<TabFacilities metrics={[...sm("pcs"), ...sm("physically challenged")]} />,
//   };

//   return (
//     <div style={{ maxWidth:1000,margin:"0 auto",padding:"28px 20px 64px" }}>

//       {/* Hero */}
//       <div style={{ background:"var(--white)",border:"1px solid var(--border)",padding:"24px 28px",marginBottom:20,boxShadow:"var(--shadow-sm)" }}>
//         <div style={{ display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap" }}>
//           <div style={{ flex:1,minWidth:200 }}>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",background:"var(--crimson-pale)",border:"1px solid rgba(192,57,43,0.2)",padding:"2px 8px",marginBottom:10,display:"inline-block" }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"clamp(1.3rem,3vw,1.9rem)",color:"var(--ink-900)",lineHeight:1.2,marginBottom:5 }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-300)" }}>{profile.institute_code}</p>
//           </div>
//           {row?.img_total != null && (
//             <div style={{ textAlign:"right",flexShrink:0 }}>
//               <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"3.2rem",color:"var(--crimson)",lineHeight:1,marginBottom:3 }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-300)" }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>
//         {allYears.length > 0 && (
//           <div style={{ marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
//             <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-300)",marginRight:4 }}>
//               Ranking Year
//             </span>
//             {allYears.map(y => (
//               <button key={y} onClick={() => setActiveYear(y)} style={{ fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"3px 11px",background:activeYear===y?"var(--crimson)":"var(--white)",color:activeYear===y?"var(--white)":"var(--ink-500)",border:`1px solid ${activeYear===y?"var(--crimson)":"var(--border)"}`,cursor:"pointer",transition:"all 0.15s" }}>
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs */}
//       <div style={{ display:"flex",borderBottom:"2px solid var(--border)",marginBottom:20,overflowX:"auto" }}>
//         {TABS.map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily:"var(--font-body)",fontWeight:activeTab===tab.id?600:400,fontSize:"0.78rem",padding:"9px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid var(--crimson)":"2px solid transparent",marginBottom:"-2px",color:activeTab===tab.id?"var(--crimson)":"var(--ink-400)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5 }}>
//             <span style={{ fontSize:"0.7rem",opacity:0.7 }}>{tab.icon}</span>{tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab body */}
//       <div key={`${activeTab}-${activeYear}`} style={{ animation:"fadeIn 0.18s ease both" }}>
//         {tabs[activeTab]}
//       </div>
//     </div>
//   );
// }







































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";

// interface Props { hit: SearchHit; }
// interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
// interface RawSection { section: string; metrics: RawMetric[]; }
// type TabId = "scores"|"intake"|"students"|"placement"|"phd"|"research"|"financial"|"faculty"|"facilities";

// const TABS: {id:TabId;label:string;icon:string}[] = [
//   {id:"scores",    label:"NIRF Scores",  icon:"★"},
//   {id:"intake",    label:"Intake",       icon:"⊕"},
//   {id:"placement", label:"Placement",    icon:"↗"},
//   {id:"phd",       label:"PhD",          icon:"⚗"},
//   {id:"students",  label:"Students",     icon:"◎"},
//   {id:"research",  label:"Research",     icon:"◈"},
//   {id:"financial", label:"Financial",    icon:"₹"},
//   {id:"faculty",   label:"Faculty",      icon:"✦"},
//   {id:"facilities",label:"Facilities",   icon:"⌂"},
// ];

// const TAB_SECTIONS: Record<TabId,string[]> = {
//   scores:[],
//   intake:["Sanctioned"],
//   placement:["Placement"],
//   phd:["Ph.D"],
//   students:["Total Actual Student Strength"],
//   research:["Sponsored Research","Consultancy Project","Executive Development"],
//   financial:["Capital expenditure","Operational expenditure"],
//   faculty:["Faculty Details"],
//   facilities:["PCS Facilities"],
// };

// // ── Value helpers ──────────────────────────────────────────────────────────────

// const BAD = new Set(["","nan","<na>","-","n/a","na","null","undefined","none"]);
// const isBAD = (v:string|null|undefined) => BAD.has((v??"").trim().toLowerCase());
// const cl    = (v:string|null|undefined):string => isBAD(v) ? "" : (v??"").trim();

// // A "real" year looks like YYYY-YY with or without a suffix
// function isRealYear(y:string|null|undefined):boolean {
//   const v = (y??"").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}-\d{2}/.test(v);
// }
// // Strip suffix: "2021-22 (Graduation Year)" → "2021-22"
// function baseYear(y:string):string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }
// // Keep full label for display but strip if needed
// function dispYear(y:string):string { return y.trim(); }

// function fmtN(v:string):string {
//   const s = cl(v); if(!s) return "—";
//   const n = Number(s.replace(/,/g,"")); if(isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }
// function fmtAmt(v:string):string {
//   const s = cl(v); if(!s) return "—";
//   const n = Number(s.replace(/,/g,""));  if(isNaN(n)) return s;
//   if(n>=1_00_00_000) return `₹${(n/1_00_00_000).toFixed(2)} Cr`;
//   if(n>=1_00_000)    return `₹${(n/1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtSal(v:string):string {
//   const s = cl(v); if(!s) return "—";
//   const n = Number(s.replace(/,/g,"")); if(isNaN(n)) return s;
//   return `₹${(n/100_000).toFixed(1)}L`;
// }
// function fmtV(v:string, metric:string):string {
//   if(isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if(m.includes("salary")||m.includes("median")) return fmtSal(v);
//   if((m.includes("amount")||m.includes("expenditure"))&&!m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }
// const isWords = (m:string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr:T[], fn:(x:T)=>string):Map<string,T[]> {
//   const m = new Map<string,T[]>();
//   for(const x of arr){const k=fn(x);if(!m.has(k))m.set(k,[]);m.get(k)!.push(x);}
//   return m;
// }

// // ── Styles ─────────────────────────────────────────────────────────────────────
// const TH:React.CSSProperties  = {fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-400)",padding:"8px 14px",textAlign:"left",borderBottom:"2px solid var(--border)",background:"var(--off-white)",whiteSpace:"nowrap"};
// const THR:React.CSSProperties = {...TH,textAlign:"right"};
// const TD:React.CSSProperties  = {padding:"8px 14px",color:"var(--ink-700)",verticalAlign:"middle",fontSize:"0.78rem"};
// const TDM:React.CSSProperties = {...TD,color:"var(--ink-400)",fontFamily:"var(--font-mono)",fontSize:"0.68rem",whiteSpace:"nowrap"};
// const TDR:React.CSSProperties = {...TD,textAlign:"right",fontFamily:"var(--font-mono)"};

// function rh(i:number){
//   return{
//     onMouseEnter:(e:React.MouseEvent<HTMLTableRowElement>)=>{e.currentTarget.style.background="var(--crimson-pale)";},
//     onMouseLeave:(e:React.MouseEvent<HTMLTableRowElement>)=>{e.currentTarget.style.background=i%2?"var(--off-white)":"transparent";},
//   };
// }

// // ── UI Primitives ──────────────────────────────────────────────────────────────
// function KV({label,value,accent,big}:{label:string;value?:string|null;accent?:boolean;big?:boolean}){
//   return(
//     <div style={{background:accent?"var(--crimson-pale)":"var(--off-white)",border:`1px solid ${accent?"rgba(192,57,43,0.18)":"var(--border)"}`,padding:"14px 16px"}}>
//       <p style={{fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.09em",color:accent?"var(--crimson)":"var(--ink-500)",marginBottom:5}}>{label}</p>
//       <p style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:big?"1.9rem":"1.35rem",color:accent?"var(--crimson-dark)":"var(--ink-900)",lineHeight:1}}>{value||"—"}</p>
//     </div>
//   );
// }
// function Card({title,children,noPad}:{title?:string;children:React.ReactNode;noPad?:boolean}){
//   return(
//     <div style={{background:"var(--white)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",marginBottom:14,overflow:"hidden",padding:noPad?0:"20px 24px"}}>
//       {title&&<h3 style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"1rem",color:"var(--ink-900)",margin:0,padding:noPad?"16px 24px 14px":"0 0 8px",borderBottom:"1px solid var(--border)",marginBottom:14}}>{title}</h3>}
//       {children}
//     </div>
//   );
// }
// function SH({children}:{children:React.ReactNode}){
//   return <p style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>{children}</p>;
// }
// function Empty({msg="No data available."}:{msg?:string}){
//   return <p style={{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-300)",padding:"20px 0"}}>{msg}</p>;
// }
// function ScoreBar({label,score,total}:{label:string;score:number|null;total:number|null}){
//   const pct=score!=null&&(total??100)>0?Math.min((score/(total??100))*100,100):0;
//   return(
//     <div style={{marginBottom:12}}>
//       <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
//         <span style={{fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)"}}>{label}</span>
//         <span style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-400)"}}>{score?.toFixed(2)??"—"} / {total?.toFixed(0)??"—"}</span>
//       </div>
//       <div style={{height:5,background:"var(--border)"}}>
//         <div style={{height:"100%",width:`${pct}%`,background:"var(--crimson)",transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)"}}/>
//       </div>
//     </div>
//   );
// }

// // ── YearPivotTable ─────────────────────────────────────────────────────────────
// // Generic pivot: rows (metric/program), columns (years), values
// interface PivotRow { label:string; subLabel?:string; yearVals:Record<string,string>; isSal?:boolean; isAmt?:boolean; isBold?:boolean; }

// function YearPivotTable({rows,years,col1="Metric"}:{rows:PivotRow[];years:string[];col1?:string}){
//   if(!rows.length) return <Empty/>;
//   return(
//     <div style={{overflowX:"auto"}}>
//       <table style={{width:"100%",borderCollapse:"collapse"}}>
//         <thead>
//           <tr>
//             <th style={{...TH,minWidth:200}}>{col1}</th>
//             {years.map(yr=><th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row,i)=>(
//             <tr key={i} style={{borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent",transition:"background 0.1s"}} {...rh(i)}>
//               <td style={row.isBold?{...TD,fontWeight:700}:TD}>
//                 {row.label}
//                 {row.subLabel&&<span style={{fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--ink-300)",marginLeft:6}}>{row.subLabel}</span>}
//               </td>
//               {years.map(yr=>{
//                 const val=row.yearVals[yr];
//                 const hasVal=val&&val!=="";
//                 let d="—";
//                 if(hasVal){if(row.isSal)d=fmtSal(val);else if(row.isAmt)d=fmtAmt(val);else d=fmtN(val);}
//                 return(
//                   <td key={yr} style={{...TDR,color:hasVal?(row.isBold?"var(--crimson-dark)":"var(--ink-700)"):"var(--ink-100)",fontWeight:row.isBold&&hasVal?700:400,background:row.isBold&&hasVal?"var(--crimson-pale)":undefined}}>
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Build pivot rows from metrics (groups by metric name, collects year→value)
// function buildPivotRows(metrics:RawMetric[],opts?:{isSal?:boolean;isAmt?:boolean}):{rows:PivotRow[];years:string[]}{
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string,Record<string,string>>();
//   for(const m of metrics){
//     if(isBAD(m.value)||isWords(m.metric)) continue;
//     if(!isRealYear(m.year)) continue;
//     const yr=dispYear(m.year);
//     const key=cl(m.metric)||m.metric;
//     if(!metricMap.has(key))metricMap.set(key,{});
//     yearSet.add(yr);
//     metricMap.get(key)![yr]=cl(m.value);
//   }
//   const years=Array.from(yearSet).sort((a,b)=>baseYear(a).localeCompare(baseYear(b)));
//   const rows:PivotRow[]=Array.from(metricMap.entries())
//     .filter(([,yv])=>Object.keys(yv).length>0)
//     .map(([metric,yearVals])=>({
//       label:metric,yearVals,
//       isSal:opts?.isSal??(metric.toLowerCase().includes("salary")||metric.toLowerCase().includes("median")),
//       isAmt:opts?.isAmt??((metric.toLowerCase().includes("amount")||metric.toLowerCase().includes("expenditure"))&&!metric.toLowerCase().includes("words")),
//     }));
//   return{rows,years};
// }

// // ── Collapsible program group ──────────────────────────────────────────────────
// function PGroup({label,children,open:init=true}:{label:string;children:React.ReactNode;open?:boolean}){
//   const[o,setO]=useState(init);
//   return(
//     <div style={{marginBottom:14,border:"1px solid var(--border)",overflow:"hidden"}}>
//       <button onClick={()=>setO(x=>!x)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"var(--off-white)",border:"none",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.82rem",color:"var(--crimson-dark)",textAlign:"left",borderBottom:o?"1px solid var(--border)":"none"}}>
//         <span>{label}</span>
//         <span style={{fontSize:"0.65rem",color:"var(--ink-400)",transform:o?"rotate(90deg)":"none",transition:"transform 0.2s"}}>▶</span>
//       </button>
//       {o&&<div style={{padding:"16px 20px",background:"var(--white)"}}>{children}</div>}
//     </div>
//   );
// }

// // ── Words disclosure ───────────────────────────────────────────────────────────
// function WordsDisclosure({metrics}:{metrics:RawMetric[]}){
//   const words=metrics.filter(m=>isWords(m.metric)&&!isBAD(m.value));
//   if(!words.length) return null;
//   return(
//     <details style={{marginTop:10}}>
//       <summary style={{fontFamily:"var(--font-mono)",fontSize:"0.63rem",color:"var(--ink-300)",cursor:"pointer",padding:"4px 0"}}>Show amounts in words ({words.length})</summary>
//       <div style={{marginTop:6}}>
//         {words.map((m,i)=>(
//           <div key={i} style={{padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:"0.73rem",color:"var(--ink-500)",display:"flex",gap:12}}>
//             <span style={{fontFamily:"var(--font-mono)",fontSize:"0.63rem",color:"var(--ink-300)",minWidth:70,flexShrink:0}}>{dispYear(m.year)}</span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ── getSections helper ─────────────────────────────────────────────────────────
// function getSections(raw:RawSection[],keywords:string[]):RawSection[]{
//   return raw.filter(s=>keywords.some(kw=>s.section.toLowerCase().includes(kw.toLowerCase()))).filter(s=>s.metrics.length>0);
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: SCORES
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabScores({row,imgCols}:{row:Record<string,unknown>;imgCols:string[]}){
//   return(
//     <div style={{display:"flex",flexDirection:"column",gap:16}}>
//       <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
//         <KV label="NIRF Total"       value={row.img_total    !=null?(row.img_total    as number).toFixed(2):null} accent big/>
//         <KV label="Student Strength" value={row.img_ss_score  !=null?(row.img_ss_score  as number).toFixed(2):null}/>
//         <KV label="Faculty Ratio"    value={row.img_fsr_score !=null?(row.img_fsr_score as number).toFixed(2):null}/>
//         <KV label="Perception"       value={row.img_pr_score  !=null?(row.img_pr_score  as number).toFixed(2):null}/>
//       </div>
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k=>(
//           <ScoreBar key={k} label={SCORE_LABELS[k]??k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()} score={row[k] as number|null} total={row[k.replace("_score","_total")] as number|null}/>
//         ))}
//       </Card>
//       <Card title="Score Details" noPad>
//         <div style={{overflowX:"auto"}}>
//           <table style={{width:"100%",borderCollapse:"collapse"}}>
//             <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
//             <tbody>
//               {imgCols.map((k,i)=>{
//                 const s=row[k] as number|null,t=row[k.replace("_score","_total")] as number|null;
//                 const p=s!=null&&(t??100)>0?((s/(t??100))*100).toFixed(1)+"%":"—";
//                 return(
//                   <tr key={k} style={{borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent"}} {...rh(i)}>
//                     <td style={TD}>{SCORE_LABELS[k]??k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}</td>
//                     <td style={{...TDR,color:"var(--crimson)",fontWeight:600}}>{s?.toFixed(2)??"—"}</td>
//                     <td style={{...TDR,color:"var(--ink-400)"}}>{t?.toFixed(0)??"—"}</td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: INTAKE
// // Data: year = "2016-17", "2017-18", ... "2021-22"
// // program = "UG [4 Years Program(s)]", "PG [2 Years Program(s)]", etc.
// // Pivot: programs as rows (grouped UG/PG), years as columns
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabIntake({sections}:{sections:RawSection[]}){
//   if(!sections.length) return <Empty/>;

//   const allMetrics = sections.flatMap(s=>s.metrics).filter(m=>isRealYear(m.year)&&!isBAD(m.program));

//   const pm = groupBy(allMetrics, r=>cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP = allP.filter(p=>p.toUpperCase().startsWith("UG"));
//   const pgP = allP.filter(p=>p.toUpperCase().startsWith("PG")&&!p.toUpperCase().startsWith("PG-INT"));
//   const pgIP= allP.filter(p=>p.toUpperCase().startsWith("PG-INT")||p.toLowerCase().includes("integrated"));
//   const otP = allP.filter(p=>!ugP.includes(p)&&!pgP.includes(p)&&!pgIP.includes(p));

//   // Collect all years
//   const yearSet = new Set<string>();
//   for(const rows of pm.values()) for(const r of rows) if(isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs:string[]):PivotRow[]{
//     return progs.map(p=>{
//       const yearVals:Record<string,string>={};
//       for(const r of pm.get(p)!){
//         if(!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)]=isBAD(r.value)?"":cl(r.value);
//       }
//       return{label:p,yearVals};
//     });
//   }

//   // Grand total row
//   const totalYearVals:Record<string,string>={};
//   for(const yr of years){
//     let sum=0,any=false;
//     for(const rows of pm.values()){
//       const r=rows.find(x=>isRealYear(x.year)&&baseYear(x.year)===yr);
//       if(!r) continue;
//       const n=Number((cl(r.value)||"").replace(/,/g,""));
//       if(!isNaN(n)&&n>0){sum+=n;any=true;}
//     }
//     totalYearVals[yr]=any?String(sum):"";
//   }

//   const latestYr=years.at(-1);
//   const grandTotal=latestYr&&totalYearVals[latestYr]?Number(totalYearVals[latestYr]):0;

//   return(
//     <div>
//       {grandTotal>0&&(
//         <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent/>
//           {ugP.length>0&&<KV label="UG Programs"  value={String(ugP.length)}/>}
//           {pgP.length>0&&<KV label="PG Programs"  value={String(pgP.length)}/>}
//         </div>
//       )}
//       {ugP.length>0&&<div style={{marginBottom:20}}><SH>Undergraduate Programs</SH><YearPivotTable rows={mkRows(ugP)} years={years} col1="Program"/></div>}
//       {pgP.length>0&&<div style={{marginBottom:20}}><SH>Postgraduate Programs</SH><YearPivotTable rows={mkRows(pgP)} years={years} col1="Program"/></div>}
//       {pgIP.length>0&&<div style={{marginBottom:20}}><SH>PG-Integrated Programs</SH><YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program"/></div>}
//       {otP.length>0&&<div style={{marginBottom:20}}><SH>Other Programs</SH><YearPivotTable rows={mkRows(otP)} years={years} col1="Program"/></div>}
//       {years.length>0&&allP.length>1&&(
//         <div style={{borderTop:"2px solid var(--border)"}}>
//           <YearPivotTable rows={[{label:"Grand Total",yearVals:totalYearVals,isBold:true}]} years={years} col1=""/>
//         </div>
//       )}
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: PLACEMENT
// // Data: year = "2019-20 (Graduation Year)", "2019-20 (Intake Year)", "2019-20 (Lateral entry year)"
// // We group by program, then within each program group by base year showing all year types
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabPlacement({sections}:{sections:RawSection[]}){
//   if(!sections.length) return <Empty/>;

//   const valid = sections.flatMap(s=>s.metrics).filter(m=>isRealYear(m.year)&&!isBAD(m.program)&&!isBAD(m.metric)&&!isWords(m.metric));
//   if(!valid.length) return <Empty/>;

//   const pm = groupBy(valid,r=>cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p=>p.toUpperCase().startsWith("UG")&&!p.toUpperCase().includes("PG-INT"));
//   const pgIP = allP.filter(p=>p.toUpperCase().startsWith("PG-INT")||p.toLowerCase().includes("integrated"));
//   const pgP  = allP.filter(p=>p.toUpperCase().startsWith("PG")&&!pgIP.includes(p)&&!ugP.includes(p));
//   const otP  = allP.filter(p=>!ugP.includes(p)&&!pgP.includes(p)&&!pgIP.includes(p));

//   function PBlock({prog}:{prog:string}){
//     const rows=pm.get(prog)!;
//     // Collect all year strings (full label e.g. "2021-22 (Graduation Year)")
//     const yearSet=new Set<string>();
//     for(const r of rows) if(isRealYear(r.year)) yearSet.add(dispYear(r.year));
//     const years=Array.from(yearSet).sort((a,b)=>baseYear(a).localeCompare(baseYear(b)));

//     // Build metric→year→value pivot
//     const mm = groupBy(rows,r=>cl(r.metric));
//     const pivotRows:PivotRow[]=Array.from(mm.entries()).map(([metric,mrows])=>{
//       const yearVals:Record<string,string>={};
//       for(const r of mrows){if(!isRealYear(r.year))continue;yearVals[dispYear(r.year)]=isBAD(r.value)?"":cl(r.value);}
//       return{label:metric,yearVals,isSal:metric.toLowerCase().includes("salary")||metric.toLowerCase().includes("median")};
//     }).filter(r=>Object.values(r.yearVals).some(v=>v!==""));

//     if(!pivotRows.length||!years.length) return <Empty msg="No data."/>;

//     // Headline KVs from latest graduation year
//     const latestGradYr=years.filter(y=>y.includes("Graduation")).sort().at(-1)??"";
//     const findV=(kw:string)=>pivotRows.find(r=>r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed=findV("students placed");
//     const salary=pivotRows.find(r=>r.isSal)?.yearVals[latestGradYr];
//     const higher=findV("higher stud")||findV("selected for higher");

//     return(
//       <div>
//         {(placed||salary||higher)&&(
//           <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:14}}>
//             {placed&&<KV label={`Placed (${latestGradYr})`} value={fmtN(placed)} accent/>}
//             {salary&&<KV label={`Median Salary (${latestGradYr})`} value={fmtSal(salary)}/>}
//             {higher&&<KV label={`Higher Studies (${latestGradYr})`} value={fmtN(higher)}/>}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years}/>
//       </div>
//     );
//   }

//   function RG({progs,label,open=true}:{progs:string[];label:string;open?:boolean}){
//     if(!progs.length) return null;
//     return(
//       <PGroup label={`${label} (${progs.length} program${progs.length>1?"s":""})`} open={open}>
//         {progs.map((p,i)=>(
//           <div key={p}>
//             {progs.length>1&&<div style={{fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.78rem",color:"var(--crimson-dark)",margin:i===0?"0 0 10px":"20px 0 10px",paddingBottom:6,borderBottom:"1px dashed var(--border)"}}>{p}</div>}
//             <PBlock prog={p}/>
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return(
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true}/>
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true}/>
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false}/>
//       <RG progs={otP}  label="Other Programs"         open={false}/>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: PhD
// // Data: year="-" for pursuing (snapshot), year="2019-20"/"2020-21"/"2021-22" for graduated
// // Pivot graduated by metric × year
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabPhd({sections}:{sections:RawSection[]}){
//   if(!sections.length) return <Empty/>;

//   const all      = sections.flatMap(s=>s.metrics);
//   const pursuing = all.filter(m=>m.program?.toLowerCase().includes("pursuing"));
//   const graduated= all.filter(m=>isRealYear(m.year)&&!isBAD(m.value));

//   const ftP = pursuing.find(m=>m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP = pursuing.find(m=>m.metric.toLowerCase().includes("part time"))?.value;

//   const {rows:gradRows,years:gradYears} = buildPivotRows(graduated);

//   return(
//     <div style={{display:"flex",flexDirection:"column",gap:14}}>
//       {(ftP||ptP)&&(
//         <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
//           {ftP&&!isBAD(ftP)&&<KV label="Full Time Students" value={fmtN(cl(ftP))} accent/>}
//           {ptP&&!isBAD(ptP)&&<KV label="Part Time Students" value={fmtN(cl(ptP))}/>}
//         </div>
//       )}
//       {pursuing.length>0&&(
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m,i)=>(
//             <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
//               <span style={{fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)"}}>{m.program}</span>
//               <span style={{fontFamily:"var(--font-mono)",fontSize:"0.78rem",color:"var(--ink-700)",fontWeight:600}}>{isBAD(m.value)?"—":fmtN(cl(m.value))}</span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length>0&&gradYears.length>0&&(
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category"/>
//         </Card>
//       )}
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: STUDENTS
// // Data: year="-" (no year), just program × metric × value
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabStudents({sections}:{sections:RawSection[]}){
//   if(!sections.length) return <Empty/>;
//   const valid = sections.flatMap(s=>s.metrics).filter(m=>!isBAD(m.value)&&!isBAD(m.metric));
//   if(!valid.length) return <Empty/>;
//   const pm = groupBy(valid,r=>cl(r.program)||"All Programs");
//   return(
//     <Card title="Total Student Strength" noPad>
//       <div style={{overflowX:"auto"}}>
//         <table style={{width:"100%",borderCollapse:"collapse"}}>
//           <thead><tr><th style={{...TH,minWidth:180}}>Program</th><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//           <tbody>
//             {Array.from(pm.entries()).flatMap(([prog,rows],gi)=>
//               rows.map((r,i)=>(
//                 <tr key={`${gi}-${i}`} style={{borderBottom:"1px solid var(--border)",background:(gi+i)%2?"var(--off-white)":"transparent"}} {...rh(gi+i)}>
//                   {i===0?<td style={{...TDM,verticalAlign:"top"}} rowSpan={rows.length}>{prog}</td>:null}
//                   <td style={TD}>{r.metric}</td>
//                   <td style={TDR}>{fmtN(cl(r.value))}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </Card>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: RESEARCH (Sponsored/Consultancy/EDP)
// // Data: year = "2019-20", "2020-21", "2021-22"
// // ═══════════════════════════════════════════════════════════════════════════════
// function ResBlock({metrics,title}:{metrics:RawMetric[];title:string}){
//   const valid=metrics.filter(m=>isRealYear(m.year)&&!isBAD(m.value)&&!isWords(m.metric));
//   if(!valid.length) return null;
//   const {rows,years}=buildPivotRows(valid);
//   if(!rows.length||!years.length) return null;
//   return(
//     <Card title={title} noPad>
//       <YearPivotTable rows={rows} years={years}/>
//       <div style={{padding:"0 16px 4px"}}><WordsDisclosure metrics={metrics}/></div>
//     </Card>
//   );
// }

// function TabResearch({sections,row}:{sections:RawSection[];row:Record<string,unknown>|null}){
//   const sr  = getSections(sections,["Sponsored Research"]).flatMap(s=>s.metrics);
//   const co  = getSections(sections,["Consultancy Project"]).flatMap(s=>s.metrics);
//   const edp = getSections(sections,["Executive Development"]).flatMap(s=>s.metrics);
//   if(!sr.length&&!co.length&&!edp.length) return <Empty/>;

//   const spV = sr.filter(m=>!isWords(m.metric)).find(m=>m.metric.includes("Sponsored Projects"))?.value;
//   const cpV = co.filter(m=>!isWords(m.metric)).find(m=>m.metric.includes("Consultancy Projects"))?.value;
//   const paxV= edp.filter(m=>!isWords(m.metric)).find(m=>m.metric.includes("Participants"))?.value;

//   return(
//     <div>
//       <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:16}}>
//         {spV&&!isBAD(spV)&&<KV label="Sponsored Projects" value={fmtN(spV)} accent/>}
//         {cpV&&!isBAD(cpV)&&<KV label="Consultancy Projects" value={fmtN(cpV)}/>}
//         {paxV&&!isBAD(paxV)&&<KV label="EDP Participants" value={fmtN(paxV)}/>}
//       </div>
//       {sr.length>0&&<ResBlock metrics={sr} title="Sponsored Research Details"/>}
//       {co.length>0&&<ResBlock metrics={co} title="Consultancy Project Details"/>}
//       {edp.length>0&&<ResBlock metrics={edp} title="Executive Development Programs"/>}
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: FINANCIAL
// // Data: year = "2019-20", "2020-21", "2021-22"
// // program = "Library", "Salaries", "Engineering Workshops", etc.
// // Pivot: line items (programs) as rows, years as columns
// // ═══════════════════════════════════════════════════════════════════════════════
// function FinBlock({metrics,title}:{metrics:RawMetric[];title:string}){
//   const valid=metrics.filter(m=>isRealYear(m.year)&&!isWords(m.metric));
//   if(!valid.length) return null;

//   const pm=groupBy(valid,r=>cl(r.program)||"General");
//   const yearSet=new Set<string>();
//   for(const rows of pm.values()) for(const r of rows) if(isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years=Array.from(yearSet).sort();
//   if(!years.length) return null;

//   // Build pivot: program → year → value
//   const pivotRows:PivotRow[]=Array.from(pm.entries()).map(([prog,rows])=>{
//     const yearVals:Record<string,string>={};
//     for(const r of rows){if(!isRealYear(r.year))continue;yearVals[baseYear(r.year)]=isBAD(r.value)?"":cl(r.value);}
//     return{label:prog,yearVals,isAmt:true};
//   }).filter(r=>Object.values(r.yearVals).some(v=>v!==""));

//   // Total row
//   const totalYV:Record<string,string>={};
//   for(const yr of years){
//     let s=0,any=false;
//     for(const r of pivotRows){const n=Number((r.yearVals[yr]||"").replace(/,/g,""));if(!isNaN(n)&&n>0){s+=n;any=true;}}
//     totalYV[yr]=any?String(s):"";
//   }

//   return(
//     <Card title={title} noPad>
//       <YearPivotTable rows={[...pivotRows,{label:"Total",yearVals:totalYV,isAmt:true,isBold:true}]} years={years} col1="Line Item"/>
//       <div style={{padding:"0 16px 4px"}}><WordsDisclosure metrics={metrics}/></div>
//     </Card>
//   );
// }

// function TabFinancial({sections,row}:{sections:RawSection[];row:Record<string,unknown>|null}){
//   const cap = getSections(sections,["Capital expenditure"]).flatMap(s=>s.metrics);
//   const ops = getSections(sections,["Operational expenditure"]).flatMap(s=>s.metrics);
//   if(!cap.length&&!ops.length) return <Empty/>;
//   return(
//     <div>
//       {row&&(
//         <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:16}}>
//           {row.pdf_capital_expenditure    !=null&&<KV label="Capital Expenditure (3yr Sum)"     value={fmtAmt(String(row.pdf_capital_expenditure))}     accent/>}
//           {row.pdf_operational_expenditure!=null&&<KV label="Operational Expenditure (3yr Sum)" value={fmtAmt(String(row.pdf_operational_expenditure))}/>}
//         </div>
//       )}
//       {cap.length>0&&<FinBlock metrics={cap} title="Capital Expenditure — Line Items"/>}
//       {ops.length>0&&<FinBlock metrics={ops} title="Operational Expenditure — Line Items"/>}
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: FACULTY
// // Data: year="-", single snapshot values
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabFaculty({sections}:{sections:RawSection[]}){
//   const valid=sections.flatMap(s=>s.metrics).filter(m=>!isBAD(m.value)&&!isBAD(m.metric));
//   if(!valid.length) return <Empty/>;
//   const count=valid.find(m=>m.metric.toLowerCase().includes("number of faculty"))?.value;
//   return(
//     <div style={{display:"flex",flexDirection:"column",gap:14}}>
//       {count&&!isBAD(count)&&(
//         <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent/>
//         </div>
//       )}
//       <Card title="Faculty Details" noPad>
//         <div style={{overflowX:"auto"}}>
//           <table style={{width:"100%",borderCollapse:"collapse"}}>
//             <thead><tr><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//             <tbody>
//               {valid.map((r,i)=>(
//                 <tr key={i} style={{borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent"}} {...rh(i)}>
//                   <td style={TD}>{r.metric}</td>
//                   <td style={TDR}>{fmtN(cl(r.value))}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // TAB: FACILITIES (PCS)
// // Data: year="-", Yes/No answers
// // ═══════════════════════════════════════════════════════════════════════════════
// function TabFacilities({sections}:{sections:RawSection[]}){
//   const valid=sections.flatMap(s=>s.metrics).filter(m=>!isBAD(m.metric));
//   if(!valid.length) return <Empty/>;
//   return(
//     <Card title="PCS Facilities — Physically Challenged Students">
//       {valid.map((m,i)=>{
//         const yes=m.value.toLowerCase().startsWith("yes");
//         return(
//           <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"12px 0",borderBottom:i<valid.length-1?"1px solid var(--border)":"none"}}>
//             <span style={{fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)",flex:1,lineHeight:1.5}}>{m.metric}</span>
//             <span style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",flexShrink:0,padding:"3px 10px",color:yes?"var(--teal)":"var(--crimson)",background:yes?"var(--teal-pale)":"var(--crimson-pale)",border:`1px solid ${yes?"rgba(26,122,110,0.2)":"rgba(192,57,43,0.2)"}`}}>
//               {m.value}
//             </span>
//           </div>
//         );
//       })}
//     </Card>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // MAIN
// // ═══════════════════════════════════════════════════════════════════════════════
// export default function InstituteDetail({hit}:Props){
//   const[profile,   setProfile]   =useState<InstituteProfileResponse|null>(null);
//   const[loading,   setLoading]   =useState(true);
//   const[activeTab, setActiveTab] =useState<TabId>("scores");
//   const[activeYear,setActiveYear]=useState<number|null>(null);

//   useEffect(()=>{
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r=>r.json())
//       .then((d:InstituteProfileResponse)=>{
//         setProfile(d);
//         const yrs=Object.keys(d.scoresByYear).map(Number).sort((a,b)=>b-a);
//         setActiveYear(yrs[0]??null);
//         setLoading(false);
//       })
//       .catch(()=>setLoading(false));
//   },[hit.institute_code]);

//   if(loading) return <div style={{padding:"80px 32px",textAlign:"center"}}><p style={{fontFamily:"var(--font-mono)",color:"var(--ink-300)",fontSize:"0.8rem"}}>Loading…</p></div>;
//   if(!profile) return <div style={{padding:"80px 32px",textAlign:"center"}}><p style={{fontFamily:"var(--font-mono)",color:"var(--ink-300)"}}>Could not load data.</p></div>;

//   const allYears    =Object.keys(profile.scoresByYear).map(Number).sort((a,b)=>b-a);
//   const row         =activeYear?profile.scoresByYear[activeYear] as Record<string,unknown>:null;
//   const rawSections =profile.rawSections as RawSection[];
//   const imgCols     =Object.keys(row??{}).filter(k=>k.startsWith("img_")&&k.endsWith("_score"));

//   // Filter sections to activeYear's data
//   function secs(keywords:string[]):RawSection[]{
//     return getSections(rawSections,keywords).map(s=>({
//       ...s,
//       metrics:activeYear?s.metrics.filter(m=>m.ranking_year===activeYear||m.ranking_year===0):s.metrics,
//     })).filter(s=>s.metrics.length>0);
//   }

//   const tabs:Record<TabId,React.ReactNode>={
//     scores:    row?<TabScores row={row} imgCols={imgCols}/>:<Empty/>,
//     intake:    <TabIntake    sections={secs(TAB_SECTIONS.intake)}/>,
//     placement: <TabPlacement sections={secs(TAB_SECTIONS.placement)}/>,
//     phd:       <TabPhd       sections={secs(TAB_SECTIONS.phd)}/>,
//     students:  <TabStudents  sections={secs(TAB_SECTIONS.students)}/>,
//     research:  <TabResearch  sections={secs(TAB_SECTIONS.research)} row={row}/>,
//     financial: <TabFinancial sections={secs(TAB_SECTIONS.financial)} row={row}/>,
//     faculty:   <TabFaculty   sections={secs(TAB_SECTIONS.faculty)}/>,
//     facilities:<TabFacilities sections={secs(TAB_SECTIONS.facilities)}/>,
//   };

//   return(
//     <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 20px 64px"}}>

//       {/* Hero */}
//       <div style={{background:"var(--white)",border:"1px solid var(--border)",padding:"24px 28px",marginBottom:20,boxShadow:"var(--shadow-sm)"}}>
//         <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
//           <div style={{flex:1,minWidth:200}}>
//             <span style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",background:"var(--crimson-pale)",border:"1px solid rgba(192,57,43,0.2)",padding:"2px 8px",marginBottom:10,display:"inline-block"}}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"clamp(1.3rem,3vw,1.9rem)",color:"var(--ink-900)",lineHeight:1.2,marginBottom:5}}>
//               {profile.institute_name}
//             </h1>
//             <p style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-300)"}}>{profile.institute_code}</p>
//           </div>
//           {row?.img_total!=null&&(
//             <div style={{textAlign:"right",flexShrink:0}}>
//               <p style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"3.2rem",color:"var(--crimson)",lineHeight:1,marginBottom:3}}>{(row.img_total as number).toFixed(2)}</p>
//               <p style={{fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-300)"}}>NIRF Total Score</p>
//             </div>
//           )}
//         </div>
//         {allYears.length>0&&(
//           <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
//             <span style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-300)",marginRight:4}}>Ranking Year</span>
//             {allYears.map(y=>(
//               <button key={y} onClick={()=>setActiveYear(y)} style={{fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"3px 11px",background:activeYear===y?"var(--crimson)":"var(--white)",color:activeYear===y?"var(--white)":"var(--ink-500)",border:`1px solid ${activeYear===y?"var(--crimson)":"var(--border)"}`,cursor:"pointer",transition:"all 0.15s"}}>{y}</button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs */}
//       <div style={{display:"flex",borderBottom:"2px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
//         {TABS.map(tab=>(
//           <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{fontFamily:"var(--font-body)",fontWeight:activeTab===tab.id?600:400,fontSize:"0.78rem",padding:"9px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid var(--crimson)":"2px solid transparent",marginBottom:"-2px",color:activeTab===tab.id?"var(--crimson)":"var(--ink-400)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
//             <span style={{fontSize:"0.7rem",opacity:0.7}}>{tab.icon}</span>{tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab body */}
//       <div key={`${activeTab}-${activeYear}`} style={{animation:"fadeIn 0.18s ease both"}}>
//         {tabs[activeTab]}
//       </div>
//     </div>
//   );
// }




























// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";

// interface Props { hit: SearchHit; }
// interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
// interface RawSection { section: string; metrics: RawMetric[]; }

// // ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
// // Tabs are dynamically shown only if data exists for the active year.

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",       label: "NIRF Scores",  icon: "★" },
//   { id: "intake",       label: "Intake",        icon: "⊕" },
//   { id: "placement",    label: "Placement",     icon: "↗" },
//   { id: "phd",          label: "PhD",           icon: "⚗" },
//   { id: "students",     label: "Students",      icon: "◎" },
//   { id: "research",     label: "Research",      icon: "◈" },
//   { id: "innovation",   label: "Innovation",    icon: "⚡" },
//   { id: "financial",    label: "Financial",     icon: "₹" },
//   { id: "faculty",      label: "Faculty",       icon: "✦" },
//   { id: "publications", label: "Publications",  icon: "📄" },
//   { id: "facilities",   label: "Facilities",    icon: "⌂" },
//   { id: "accreditation",label: "Accreditation", icon: "✓" },
//   { id: "other",        label: "Other",         icon: "+" },
// ];

// // ─── SECTION → TAB MAPPING (covers ALL years 2016–2025) ──────────────────────
// const SECTION_TAB: Record<string, TabId> = {
//   // INTAKE
//   "Sanctioned (Approved) Intake":           "intake",   // 2019–2025
//   "University Exam Details":                "intake",   // 2017–2018
//   "Student Exam Details":                   "intake",   // 2016
//   // PLACEMENT
//   "Placement & Higher Studies":             "placement", // 2017–2025
//   "Placement and Higher Studies":           "placement", // alt spelling
//   "Graduation Outcome":                     "placement", // 2016
//   // PHD
//   "Ph.D Student Details":                   "phd",
//   // STUDENTS
//   "Total Actual Student Strength (Program(s) Offered by your Institution)": "students", // 2019–2025
//   "Student Details":                        "students",  // 2016–2018
//   "Scholarships":                           "students",  // 2018
//   // RESEARCH
//   "Sponsored Research Details":             "research",
//   "Consultancy Project Details":            "research",
//   "Executive Development Programs":         "research",  // 2018
//   "Executive Development Program/Management Development Programs": "research", // 2021–2025
//   "Education Program Details":              "research",  // 2016
//   "Revenue from Executive Education":       "research",  // 2016
//   "FDP":                                    "research",  // 2024–2025
//   // INNOVATION
//   "Innovations at various stages of Technology Readiness Level": "innovation",
//   "Start up recognized by DPIIT/startup India":   "innovation",
//   "Ventures/startups grown to turnover of 50 lacs": "innovation",
//   "Startups which have got VC investment in previous 3 years": "innovation",
//   "Innovation grant received from govt. organization in previous 3 years": "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR": "innovation",
//   "Pre-incubation:expenditure/income":      "innovation",
//   "Incubation:expenditure/income":          "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies": "innovation",
//   "FDI investment in previous 3 years":     "innovation",
//   "Patents":                                "innovation",
//   "Patents Commercialized & Technology Transferred": "innovation",
//   "Patent Details":                         "innovation",  // 2017–2018
//   "IPR Summary":                            "innovation",  // 2016
//   // FINANCIAL
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":    "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization": "financial", // 2017–2018
//   "Facilities Summaries":                   "financial",  // 2016
//   // FACULTY
//   "Faculty Details":                        "faculty",
//   // PUBLICATIONS
//   "Publication Details":                    "publications",
//   // FACILITIES
//   "PCS Facilities: Facilities of Physically Challenged Students": "facilities",
//   "Facilities for Physically Challenged":   "facilities",  // 2017–2018
//   "Physical Facilties":                     "facilities",  // 2016 (typo in source)
//   "Physical Facilities":                    "facilities",
//   "Sustainability Details":                 "facilities",
//   "Sustainable Living Practices":           "facilities",
//   // ACCREDITATION
//   "Accreditation":                          "accreditation",
//   "OPD Attendance & Bed Occupancy":         "accreditation",
//   // OTHER  (shown grouped in "Other" tab)
//   "Perception Details":                     "other",
//   "Student Events":                         "other",
//   "Student Entrepreneurship":               "other",
//   "New Programs Developed":                 "other",
//   "Programs Revised":                       "other",
//   "Vocational Certificate Courses":         "other",
//   "Multiple Entry/Exit and Indian Knowledge System": "other",
//   "Prior Learning at Different Levels":     "other",
//   "Curriculum Design":                      "other",
// };

// // ─── VALUE HELPERS ────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: string | null | undefined) => BAD.has((v ?? "").trim().toLowerCase());
// const cl = (v: string | null | undefined): string => isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }
// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, "")); if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }
// function fmtAmt(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtSal(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, "")); if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }
// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }
// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
//   return m;
// }

// // ─── STYLES ──────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-400)", padding: "8px 14px", textAlign: "left", borderBottom: "2px solid var(--border)", background: "var(--off-white)", whiteSpace: "nowrap" };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = { padding: "8px 14px", color: "var(--ink-700)", verticalAlign: "middle", fontSize: "0.78rem" };
// const TDM: React.CSSProperties = { ...TD, color: "var(--ink-400)", fontFamily: "var(--font-mono)", fontSize: "0.68rem" };
// const TDR: React.CSSProperties = { ...TD, textAlign: "right", fontFamily: "var(--font-mono)" };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "var(--crimson-pale)"; },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent"; },
//   };
// }

// // ─── PRIMITIVES ───────────────────────────────────────────────────────────────

// function KV({ label, value, accent, big }: { label: string; value?: string | null; accent?: boolean; big?: boolean }) {
//   return (
//     <div style={{ background: accent ? "var(--crimson-pale)" : "var(--off-white)", border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`, padding: "14px 16px" }}>
//       <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.09em", color: accent ? "var(--crimson)" : "var(--ink-500)", marginBottom: 5 }}>{label}</p>
//       <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: big ? "1.9rem" : "1.35rem", color: accent ? "var(--crimson-dark)" : "var(--ink-900)", lineHeight: 1 }}>{value || "—"}</p>
//     </div>
//   );
// }

// function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }) {
//   return (
//     <div style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: 14, overflow: "hidden", padding: noPad ? 0 : "20px 24px" }}>
//       {title && <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1rem", color: "var(--ink-900)", margin: 0, padding: noPad ? "16px 24px 14px" : "0 0 8px", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>{title}</h3>}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--crimson)", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>{children}</p>;
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-300)", padding: "20px 0" }}>{msg}</p>;
// }

// function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
//   const pct = score != null && (total ?? 100) > 0 ? Math.min((score / (total ?? 100)) * 100, 100) : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>{label}</span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>{score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}</span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{ height: "100%", width: `${pct}%`, background: "var(--crimson)", transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
//       </div>
//     </div>
//   );
// }

// // ─── YEAR PIVOT TABLE ─────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string; subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean; isAmt?: boolean; isBold?: boolean;
// }

// function YearPivotTable({ rows, years, col1 = "Metric" }: { rows: PivotRow[]; years: string[]; col1?: string }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent", transition: "background 0.1s" }} {...rh(i)}>
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-300)", marginLeft: 6 }}>{row.subLabel}</span>}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) { if (row.isSal) d = fmtSal(val); else if (row.isAmt) d = fmtAmt(val); else d = fmtN(val); }
//                 return (
//                   <td key={yr} style={{ ...TDR, color: hasVal ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)") : "var(--ink-100)", fontWeight: row.isBold && hasVal ? 700 : 400, background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined }}>
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(metrics: RawMetric[], opts?: { isSal?: boolean; isAmt?: boolean }): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric)) continue;
//     if (!isRealYear(m.year)) continue;
//     const yr = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric, yearVals,
//       isSal: opts?.isSal ?? (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt: opts?.isAmt ?? ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) && !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// // Simple flat table (no year axis)
// function FlatTable({ metrics, col1 = "Metric", col2 = "Value" }: { metrics: RawMetric[]; col1?: string; col2?: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead><tr><th style={TH}>{col1}</th><th style={THR}>{col2}</th></tr></thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent" }} {...rh(i)}>
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Multi-column record table — used for sections where program=record name, metric=field, value=value
// function RecordTable({ metrics, nameCol = "Name" }: { metrics: RawMetric[]; nameCol?: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   // Group by program (record identifier)
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead><tr><th style={{ ...TH, minWidth: 180 }}>{nameCol}</th><th style={TH}>Field</th><th style={THR}>Value</th></tr></thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr key={`${gi}-${i}`} style={{ borderBottom: "1px solid var(--border)", background: (gi + i) % 2 ? "var(--off-white)" : "transparent" }} {...rh(gi + i)}>
//                 {i === 0 ? <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>{prog}</td> : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({ label, children, open: init = true }: { label: string; children: React.ReactNode; open?: boolean }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button onClick={() => setO(x => !x)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--off-white)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.82rem", color: "var(--crimson-dark)", textAlign: "left", borderBottom: o ? "1px solid var(--border)" : "none" }}>
//         <span>{label}</span>
//         <span style={{ fontSize: "0.65rem", color: "var(--ink-400)", transform: o ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
//       </button>
//       {o && <div style={{ padding: "16px 20px", background: "var(--white)" }}>{children}</div>}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--ink-300)", cursor: "pointer", padding: "4px 0" }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "0.73rem", color: "var(--ink-500)", display: "flex", gap: 12 }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--ink-300)", minWidth: 70, flexShrink: 0 }}>{m.year}</span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─── SCORES TAB ──────────────────────────────────────────────────────────────

// function TabScores({ row, imgCols }: { row: Record<string, unknown>; imgCols: string[] }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV label="NIRF Total" value={row.img_total != null ? (row.img_total as number).toFixed(2) : null} accent big />
//         <KV label="Student Strength" value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null} />
//         <KV label="Faculty Ratio" value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null} />
//         <KV label="Perception" value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null} />
//       </div>
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar key={k}
//             label={SCORE_LABELS[k] ?? k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null} />
//         ))}
//       </Card>
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null, t = row[k.replace("_score", "_total")] as number | null;
//                 const p = s != null && (t ?? 100) > 0 ? ((s / (t ?? 100)) * 100).toFixed(1) + "%" : "—";
//                 return (
//                   <tr key={k} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent" }} {...rh(i)}>
//                     <td style={TD}>{SCORE_LABELS[k] ?? k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}</td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>{s?.toFixed(2) ?? "—"}</td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>{t?.toFixed(0) ?? "—"}</td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─── INTAKE TAB ───────────────────────────────────────────────────────────────

// function TabIntake({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return <Card title={sections[0]?.section}><YearPivotTable rows={rows} years={years} /></Card>;
//   }

//   const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP  = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP  = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {grandTotal > 0 && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}
//       {ugP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Undergraduate Programs</SH><YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" /></div>}
//       {pgP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Postgraduate Programs</SH><YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" /></div>}
//       {pgIP.length > 0 && <div style={{ marginBottom: 20 }}><SH>PG-Integrated Programs</SH><YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" /></div>}
//       {otP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Other Programs</SH><YearPivotTable rows={mkRows(otP)} years={years} col1="Program" /></div>}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]} years={years} col1="" />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── PLACEMENT TAB ────────────────────────────────────────────────────────────

// function TabPlacement({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
//             {placed && <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP  = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP  = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows = pm.get(prog)!;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries()).map(([metric, mrows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of mrows) { if (!isRealYear(r.year)) continue; yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value); }
//       return { label: metric, yearVals, isSal: metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median") };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;
//     const latestGradYr = years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ?? years.at(-1) ?? "";
//     const kv = (kw: string) => pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed"), salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr], higher = kv("higher stud") || kv("selected for higher");
//     return (
//       <div>
//         {(placed || salary || higher) && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
//             {placed && <KV label={`Placed (${latestGradYr || "Latest"})`} value={fmtN(placed)} accent />}
//             {salary && <KV label="Median Salary" value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)} />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({ progs, label, open = true }: { progs: string[]; label: string; open?: boolean }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`} open={open}>
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.78rem", color: "var(--crimson-dark)", margin: i === 0 ? "0 0 10px" : "20px 0 10px", paddingBottom: 6, borderBottom: "1px dashed var(--border)" }}>{p}</div>}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true} />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true} />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─── PhD TAB ──────────────────────────────────────────────────────────────────

// function TabPhd({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;
//   const all = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>{m.program}</span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>{isBAD(m.value) ? "—" : fmtN(cl(m.value))}</span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─── STUDENTS TAB ─────────────────────────────────────────────────────────────

// function TabStudents({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   // Handle each sub-section separately
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         // Scholarships section (2018): program × metric × year pivot
//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         // Student Details (2016–2018): has program + real years
//         const hasYears = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         // Total Actual Student Strength (2019–2025): program × metric, no year
//         const pm = groupBy(metrics, r => { const p = cl(r.program); return (!p || p === "-") ? "All Programs" : p; });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead><tr><th style={{ ...TH, minWidth: 180 }}>Program</th><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr key={`${gi}-${i}`} style={{ borderBottom: "1px solid var(--border)", background: (gi + i) % 2 ? "var(--off-white)" : "transparent" }} {...rh(gi + i)}>
//                         {i === 0 ? <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>{prog}</td> : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─── RESEARCH TAB ─────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   // FDP sections have program=year, metric=field (dates, names, etc.) — use RecordTable
//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}><WordsDisclosure metrics={metrics} /></div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({ sections, row }: { sections: RawSection[]; row: Record<string, unknown> | null }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {row && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
//           {row.pdf_sponsored_projects   != null && <KV label="Sponsored Projects (3yr)"  value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")} accent />}
//           {row.pdf_consultancy_projects != null && <KV label="Consultancy Projects (3yr)" value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")} />}
//           {row.pdf_edp_participants     != null && <KV label="EDP Participants (3yr)"     value={Number(row.pdf_edp_participants).toLocaleString("en-IN")} />}
//         </div>
//       )}
//       {sections.map(sec => <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />)}
//     </div>
//   );
// }

// // ─── INNOVATION TAB ───────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         // Sustainability: Yes/No answers
//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "10px 0", borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none" }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>{m.metric}</span>
//                     <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", flexShrink: 0, padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         // IPR Summary (2016): year × metrics
//         if (sec.section.toLowerCase().includes("ipr") || sec.section.toLowerCase().includes("patent")) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length) return <Card key={sec.section} title={sec.section} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//           }
//           return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//         }

//         // Records with program as identifier (startups, innovations, courses)
//         const hasNamedProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3);
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         // Flat table fallback
//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── FINANCIAL TAB ────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries()).map(([prog, rows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of rows) { if (!isRealYear(r.year)) continue; yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value); }
//       return { label: prog, yearVals, isAmt: true };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) { let s = 0, any = false; for (const r of pivotRows) { const n = Number((r.yearVals[yr] || "").replace(/,/g, "")); if (!isNaN(n) && n > 0) { s += n; any = true; } } totalYV[yr] = any ? String(s) : ""; }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]} years={years} col1="Line Item" />
//         <div style={{ padding: "0 16px 4px" }}><WordsDisclosure metrics={metrics} /></div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return <Card title={title} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//   }
//   return <Card title={title} noPad><FlatTable metrics={valid} /></Card>;
// }

// function TabFinancial({ sections, row }: { sections: RawSection[]; row: Record<string, unknown> | null }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {row && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
//           {row.pdf_capital_expenditure     != null && <KV label="Capital Expenditure (3yr Sum)"     value={fmtAmt(String(row.pdf_capital_expenditure))}     accent />}
//           {row.pdf_operational_expenditure != null && <KV label="Operational Expenditure (3yr Sum)" value={fmtAmt(String(row.pdf_operational_expenditure))} />}
//         </div>
//       )}
//       {sections.map(sec => <FinBlock key={sec.section} metrics={sec.metrics} title={sec.section} />)}
//     </div>
//   );
// }

// // ─── FACULTY TAB ──────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(m => m.metric.toLowerCase().includes("number of faculty") || m.metric.toLowerCase().includes("no of regular faculty"))?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad><FlatTable metrics={valid} /></Card>
//     </div>
//   );
// }

// // ─── PUBLICATIONS TAB ─────────────────────────────────────────────────────────
// // 2016: program=database (Scopus/WoS/ICI), year=year-range, metric=Publications/Citations
// // 2017–2018: program=database, year="-", metric=Publications/Citations/Top25%

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   if (hasYears) {
//     // 2016: group by DB, then metric × year pivot
//     const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//     return (
//       <div>
//         {Array.from(pm.entries()).map(([db, rows]) => {
//           const { rows: pivotRows, years } = buildPivotRows(rows);
//           if (!pivotRows.length) return null;
//           return <Card key={db} title={db} noPad><YearPivotTable rows={pivotRows} years={years} /></Card>;
//         })}
//       </div>
//     );
//   }

//   // 2017–2018: program=DB, metric=field, value=value — flat table grouped by DB
//   return (
//     <div>
//       {dbs.map(db => {
//         const dbMetrics = all.filter(m => cl(m.program) === db);
//         return (
//           <Card key={db} title={db} noPad>
//             <FlatTable metrics={dbMetrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─── FACILITIES TAB ───────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"));

//         // Sustainability: Yes/No answers
//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "10px 0", borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none" }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>{m.metric}</span>
//                     <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         // PCS / Physical Facilities: Yes/No answers
//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none" }}>
//                   <div style={{ flex: 1 }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", lineHeight: 1.5 }}>{m.metric}</span>
//                     {hasYear && m.year && m.year !== "-" && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--ink-300)", marginLeft: 8 }}>({m.year})</span>}
//                   </div>
//                   <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", flexShrink: 0, padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─── ACCREDITATION TAB ────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return <Card key={sec.section} title={sec.section} noPad><RecordTable metrics={metrics} nameCol="Body" /></Card>;
//         }
//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── OTHER TAB ────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) return <Card key={sec.section} title={sec.section} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//         }
//         if (hasProgram) {
//           return <Card key={sec.section} title={sec.section} noPad><RecordTable metrics={metrics} /></Card>;
//         }
//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) return <div style={{ padding: "80px 32px", textAlign: "center" }}><p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>Loading…</p></div>;
//   if (!profile) return <div style={{ padding: "80px 32px", textAlign: "center" }}><p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>Could not load data.</p></div>;

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
//   const rawSections = (profile.rawSections as RawSection[]);
//   const imgCols     = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));

//   // Filter sections to active year and group by tab
//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0) : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   // Only show tabs that have data (plus always show scores)
//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));

//   // If active tab has no data, reset to scores
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";

//   function getSecs(tabId: TabId): RawSection[] {
//     return secsByTab.get(tabId) ?? [];
//   }

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores:       row ? <TabScores row={row} imgCols={imgCols} /> : <Empty />,
//     intake:       <TabIntake       sections={getSecs("intake")} />,
//     placement:    <TabPlacement    sections={getSecs("placement")} />,
//     phd:          <TabPhd          sections={getSecs("phd")} />,
//     students:     <TabStudents     sections={getSecs("students")} />,
//     research:     <TabResearch     sections={getSecs("research")} row={row} />,
//     innovation:   <TabInnovation   sections={getSecs("innovation")} />,
//     financial:    <TabFinancial    sections={getSecs("financial")} row={row} />,
//     faculty:      <TabFaculty      sections={getSecs("faculty")} />,
//     publications: <TabPublications sections={getSecs("publications")} />,
//     facilities:   <TabFacilities   sections={getSecs("facilities")} />,
//     accreditation:<TabAccreditation sections={getSecs("accreditation")} />,
//     other:        <TabOther        sections={getSecs("other")} />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* Hero */}
//       <div style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--crimson)", background: "var(--crimson-pale)", border: "1px solid rgba(192,57,43,0.2)", padding: "2px 8px", marginBottom: 10, display: "inline-block" }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(1.3rem,3vw,1.9rem)", color: "var(--ink-900)", lineHeight: 1.2, marginBottom: 5 }}>{profile.institute_name}</h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>{profile.institute_code}</p>
//           </div>
//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "3.2rem", color: "var(--crimson)", lineHeight: 1, marginBottom: 3 }}>{(row.img_total as number).toFixed(2)}</p>
//               <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-300)" }}>NIRF Total Score</p>
//             </div>
//           )}
//         </div>
//         {allYears.length > 0 && (
//           <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-300)", marginRight: 4 }}>Ranking Year</span>
//             {allYears.map(y => (
//               <button key={y} onClick={() => setActiveYear(y)} style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "3px 11px", background: activeYear === y ? "var(--crimson)" : "var(--white)", color: activeYear === y ? "var(--white)" : "var(--ink-500)", border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.15s" }}>{y}</button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs — only show tabs with data for this year */}
//       <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
//         {visibleTabs.map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily: "var(--font-body)", fontWeight: safeTab === tab.id ? 600 : 400, fontSize: "0.78rem", padding: "9px 16px", background: "transparent", border: "none", borderBottom: safeTab === tab.id ? "2px solid var(--crimson)" : "2px solid transparent", marginBottom: "-2px", color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}>
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>{tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab body */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }














































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";
// import {
//   ScoreTrendChart,
//   ParameterRadarChart,
//   IntakeTrendChart,
//   PlacementChart,
//   PhdChart,
//   StudentsChart,
//   ResearchChart,
//   FinancialChart,
//   FacultyChart,
//   PublicationsChart,
// } from "@/app/components/NIRFCharts";

// interface Props { hit: SearchHit; }
// interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
// interface RawSection { section: string; metrics: RawMetric[]; }

// // ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
// // Tabs are dynamically shown only if data exists for the active year.

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",       label: "NIRF Scores",  icon: "★" },
//   { id: "intake",       label: "Intake",        icon: "⊕" },
//   { id: "placement",    label: "Placement",     icon: "↗" },
//   { id: "phd",          label: "PhD",           icon: "⚗" },
//   { id: "students",     label: "Students",      icon: "◎" },
//   { id: "research",     label: "Research",      icon: "◈" },
//   { id: "innovation",   label: "Innovation",    icon: "⚡" },
//   { id: "financial",    label: "Financial",     icon: "₹" },
//   { id: "faculty",      label: "Faculty",       icon: "✦" },
//   { id: "publications", label: "Publications",  icon: "📄" },
//   { id: "facilities",   label: "Facilities",    icon: "⌂" },
//   { id: "accreditation",label: "Accreditation", icon: "✓" },
//   { id: "other",        label: "Other",         icon: "+" },
// ];

// // ─── SECTION → TAB MAPPING (covers ALL years 2016–2025) ──────────────────────
// const SECTION_TAB: Record<string, TabId> = {
//   // INTAKE
//   "Sanctioned (Approved) Intake":           "intake",
//   "University Exam Details":                "intake",
//   "Student Exam Details":                   "intake",
//   // PLACEMENT
//   "Placement & Higher Studies":             "placement",
//   "Placement and Higher Studies":           "placement",
//   "Graduation Outcome":                     "placement",
//   // PHD
//   "Ph.D Student Details":                   "phd",
//   // STUDENTS
//   "Total Actual Student Strength (Program(s) Offered by your Institution)": "students",
//   "Student Details":                        "students",
//   "Scholarships":                           "students",
//   // RESEARCH
//   "Sponsored Research Details":             "research",
//   "Consultancy Project Details":            "research",
//   "Executive Development Programs":         "research",
//   "Executive Development Program/Management Development Programs": "research",
//   "Education Program Details":              "research",
//   "Revenue from Executive Education":       "research",
//   "FDP":                                    "research",
//   // INNOVATION
//   "Innovations at various stages of Technology Readiness Level": "innovation",
//   "Start up recognized by DPIIT/startup India":   "innovation",
//   "Ventures/startups grown to turnover of 50 lacs": "innovation",
//   "Startups which have got VC investment in previous 3 years": "innovation",
//   "Innovation grant received from govt. organization in previous 3 years": "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR": "innovation",
//   "Pre-incubation:expenditure/income":      "innovation",
//   "Incubation:expenditure/income":          "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies": "innovation",
//   "FDI investment in previous 3 years":     "innovation",
//   "Patents":                                "innovation",
//   "Patents Commercialized & Technology Transferred": "innovation",
//   "Patent Details":                         "innovation",
//   "IPR Summary":                            "innovation",
//   // FINANCIAL
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":    "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization": "financial",
//   "Facilities Summaries":                   "financial",
//   // FACULTY
//   "Faculty Details":                        "faculty",
//   // PUBLICATIONS
//   "Publication Details":                    "publications",
//   // FACILITIES
//   "PCS Facilities: Facilities of Physically Challenged Students": "facilities",
//   "Facilities for Physically Challenged":   "facilities",
//   "Physical Facilties":                     "facilities",
//   "Physical Facilities":                    "facilities",
//   "Sustainability Details":                 "facilities",
//   "Sustainable Living Practices":           "facilities",
//   // ACCREDITATION
//   "Accreditation":                          "accreditation",
//   "OPD Attendance & Bed Occupancy":         "accreditation",
//   // OTHER
//   "Perception Details":                     "other",
//   "Student Events":                         "other",
//   "Student Entrepreneurship":               "other",
//   "New Programs Developed":                 "other",
//   "Programs Revised":                       "other",
//   "Vocational Certificate Courses":         "other",
//   "Multiple Entry/Exit and Indian Knowledge System": "other",
//   "Prior Learning at Different Levels":     "other",
//   "Curriculum Design":                      "other",
// };

// // ─── VALUE HELPERS ────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);
// const isBAD = (v: string | null | undefined) => BAD.has((v ?? "").trim().toLowerCase());
// const cl = (v: string | null | undefined): string => isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }
// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, "")); if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }
// function fmtAmt(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }
// function fmtSal(v: string): string {
//   const s = cl(v); if (!s) return "—";
//   const n = Number(s.replace(/,/g, "")); if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }
// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }
// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
//   return m;
// }

// // ─── STYLES ──────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-400)", padding: "8px 14px", textAlign: "left", borderBottom: "2px solid var(--border)", background: "var(--off-white)", whiteSpace: "nowrap" };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = { padding: "8px 14px", color: "var(--ink-700)", verticalAlign: "middle", fontSize: "0.78rem" };
// const TDM: React.CSSProperties = { ...TD, color: "var(--ink-400)", fontFamily: "var(--font-mono)", fontSize: "0.68rem" };
// const TDR: React.CSSProperties = { ...TD, textAlign: "right", fontFamily: "var(--font-mono)" };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "var(--crimson-pale)"; },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent"; },
//   };
// }

// // ─── PRIMITIVES ───────────────────────────────────────────────────────────────

// function KV({ label, value, accent, big }: { label: string; value?: string | null; accent?: boolean; big?: boolean }) {
//   return (
//     <div style={{ background: accent ? "var(--crimson-pale)" : "var(--off-white)", border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`, padding: "14px 16px" }}>
//       <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.09em", color: accent ? "var(--crimson)" : "var(--ink-500)", marginBottom: 5 }}>{label}</p>
//       <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: big ? "1.9rem" : "1.35rem", color: accent ? "var(--crimson-dark)" : "var(--ink-900)", lineHeight: 1 }}>{value || "—"}</p>
//     </div>
//   );
// }

// function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }) {
//   return (
//     <div style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: 14, overflow: "hidden", padding: noPad ? 0 : "20px 24px" }}>
//       {title && <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1rem", color: "var(--ink-900)", margin: 0, padding: noPad ? "16px 24px 14px" : "0 0 8px", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>{title}</h3>}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--crimson)", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>{children}</p>;
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-300)", padding: "20px 0" }}>{msg}</p>;
// }

// function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
//   const pct = score != null && (total ?? 100) > 0 ? Math.min((score / (total ?? 100)) * 100, 100) : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>{label}</span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>{score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}</span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{ height: "100%", width: `${pct}%`, background: "var(--crimson)", transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
//       </div>
//     </div>
//   );
// }

// // ─── YEAR PIVOT TABLE ─────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string; subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean; isAmt?: boolean; isBold?: boolean;
// }

// function YearPivotTable({ rows, years, col1 = "Metric" }: { rows: PivotRow[]; years: string[]; col1?: string }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent", transition: "background 0.1s" }} {...rh(i)}>
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink-300)", marginLeft: 6 }}>{row.subLabel}</span>}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) { if (row.isSal) d = fmtSal(val); else if (row.isAmt) d = fmtAmt(val); else d = fmtN(val); }
//                 return (
//                   <td key={yr} style={{ ...TDR, color: hasVal ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)") : "var(--ink-100)", fontWeight: row.isBold && hasVal ? 700 : 400, background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined }}>
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(metrics: RawMetric[], opts?: { isSal?: boolean; isAmt?: boolean }): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric)) continue;
//     if (!isRealYear(m.year)) continue;
//     const yr = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric, yearVals,
//       isSal: opts?.isSal ?? (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt: opts?.isAmt ?? ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) && !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// function FlatTable({ metrics, col1 = "Metric", col2 = "Value" }: { metrics: RawMetric[]; col1?: string; col2?: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead><tr><th style={TH}>{col1}</th><th style={THR}>{col2}</th></tr></thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent" }} {...rh(i)}>
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RecordTable({ metrics, nameCol = "Name" }: { metrics: RawMetric[]; nameCol?: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead><tr><th style={{ ...TH, minWidth: 180 }}>{nameCol}</th><th style={TH}>Field</th><th style={THR}>Value</th></tr></thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr key={`${gi}-${i}`} style={{ borderBottom: "1px solid var(--border)", background: (gi + i) % 2 ? "var(--off-white)" : "transparent" }} {...rh(gi + i)}>
//                 {i === 0 ? <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>{prog}</td> : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({ label, children, open: init = true }: { label: string; children: React.ReactNode; open?: boolean }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button onClick={() => setO(x => !x)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--off-white)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.82rem", color: "var(--crimson-dark)", textAlign: "left", borderBottom: o ? "1px solid var(--border)" : "none" }}>
//         <span>{label}</span>
//         <span style={{ fontSize: "0.65rem", color: "var(--ink-400)", transform: o ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
//       </button>
//       {o && <div style={{ padding: "16px 20px", background: "var(--white)" }}>{children}</div>}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--ink-300)", cursor: "pointer", padding: "4px 0" }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "0.73rem", color: "var(--ink-500)", display: "flex", gap: 12 }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.63rem", color: "var(--ink-300)", minWidth: 70, flexShrink: 0 }}>{m.year}</span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─── SCORES TAB ──────────────────────────────────────────────────────────────

// function TabScores({
//   row,
//   imgCols,
//   scoresByYear,
//   activeYear,
// }: {
//   row: Record<string, unknown>;
//   imgCols: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   activeYear: number;
// }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV label="NIRF Total" value={row.img_total != null ? (row.img_total as number).toFixed(2) : null} accent big />
//         <KV label="Student Strength" value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null} />
//         <KV label="Faculty Ratio" value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null} />
//         <KV label="Perception" value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null} />
//       </div>

//       {/* ── Charts ── */}
//       <ScoreTrendChart scoresByYear={scoresByYear} />
//       <ParameterRadarChart row={row} imgCols={imgCols} year={activeYear} />

//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar key={k}
//             label={SCORE_LABELS[k] ?? k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null} />
//         ))}
//       </Card>
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null, t = row[k.replace("_score", "_total")] as number | null;
//                 const p = s != null && (t ?? 100) > 0 ? ((s / (t ?? 100)) * 100).toFixed(1) + "%" : "—";
//                 return (
//                   <tr key={k} style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent" }} {...rh(i)}>
//                     <td style={TD}>{SCORE_LABELS[k] ?? k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}</td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>{s?.toFixed(2) ?? "—"}</td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>{t?.toFixed(0) ?? "—"}</td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─── INTAKE TAB ───────────────────────────────────────────────────────────────

// function TabIntake({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return <Card title={sections[0]?.section}><YearPivotTable rows={rows} years={years} /></Card>;
//   }

//   const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP  = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP  = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {/* ── Chart ── */}
//       <IntakeTrendChart metrics={all} />

//       {grandTotal > 0 && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}
//       {ugP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Undergraduate Programs</SH><YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" /></div>}
//       {pgP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Postgraduate Programs</SH><YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" /></div>}
//       {pgIP.length > 0 && <div style={{ marginBottom: 20 }}><SH>PG-Integrated Programs</SH><YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" /></div>}
//       {otP.length > 0 && <div style={{ marginBottom: 20 }}><SH>Other Programs</SH><YearPivotTable rows={mkRows(otP)} years={years} col1="Program" /></div>}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]} years={years} col1="" />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── PLACEMENT TAB ────────────────────────────────────────────────────────────

// function TabPlacement({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
//             {placed && <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm = groupBy(valid, r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP  = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP  = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows = pm.get(prog)!;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries()).map(([metric, mrows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of mrows) { if (!isRealYear(r.year)) continue; yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value); }
//       return { label: metric, yearVals, isSal: metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median") };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;
//     const latestGradYr = years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ?? years.at(-1) ?? "";
//     const kv = (kw: string) => pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed"), salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr], higher = kv("higher stud") || kv("selected for higher");
//     return (
//       <div>
//         {/* ── Chart ── */}
//         <PlacementChart metrics={rows} program={prog} />

//         {(placed || salary || higher) && (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
//             {placed && <KV label={`Placed (${latestGradYr || "Latest"})`} value={fmtN(placed)} accent />}
//             {salary && <KV label="Median Salary" value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)} />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({ progs, label, open = true }: { progs: string[]; label: string; open?: boolean }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`} open={open}>
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.78rem", color: "var(--crimson-dark)", margin: i === 0 ? "0 0 10px" : "20px 0 10px", paddingBottom: 6, borderBottom: "1px dashed var(--border)" }}>{p}</div>}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true} />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true} />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─── PhD TAB ──────────────────────────────────────────────────────────────────

// function TabPhd({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;
//   const all = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {/* ── Chart ── */}
//       <PhdChart metrics={all} />

//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>{m.program}</span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>{isBAD(m.value) ? "—" : fmtN(cl(m.value))}</span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─── STUDENTS TAB ─────────────────────────────────────────────────────────────

// function TabStudents({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const allMetrics = sections.flatMap(s => s.metrics);

//   return (
//     <div>
//       {/* ── Chart ── */}
//       <StudentsChart metrics={allMetrics} />

//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         const hasYears = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         const pm = groupBy(metrics, r => { const p = cl(r.program); return (!p || p === "-") ? "All Programs" : p; });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead><tr><th style={{ ...TH, minWidth: 180 }}>Program</th><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr key={`${gi}-${i}`} style={{ borderBottom: "1px solid var(--border)", background: (gi + i) % 2 ? "var(--off-white)" : "transparent" }} {...rh(gi + i)}>
//                         {i === 0 ? <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>{prog}</td> : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─── RESEARCH TAB ─────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}><WordsDisclosure metrics={metrics} /></div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({ sections, row }: { sections: RawSection[]; row: Record<string, unknown> | null }) {
//   if (!sections.length) return <Empty />;
//   const allMetrics = sections.flatMap(s => s.metrics);
//   return (
//     <div>
//       {/* ── Chart ── */}
//       <ResearchChart metrics={allMetrics} />

//       {row && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
//           {row.pdf_sponsored_projects   != null && <KV label="Sponsored Projects (3yr)"  value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")} accent />}
//           {row.pdf_consultancy_projects != null && <KV label="Consultancy Projects (3yr)" value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")} />}
//           {row.pdf_edp_participants     != null && <KV label="EDP Participants (3yr)"     value={Number(row.pdf_edp_participants).toLocaleString("en-IN")} />}
//         </div>
//       )}
//       {sections.map(sec => <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />)}
//     </div>
//   );
// }

// // ─── INNOVATION TAB ───────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "10px 0", borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none" }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>{m.metric}</span>
//                     <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", flexShrink: 0, padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         if (sec.section.toLowerCase().includes("ipr") || sec.section.toLowerCase().includes("patent")) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length) return <Card key={sec.section} title={sec.section} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//           }
//           return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//         }

//         const hasNamedProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3);
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── FINANCIAL TAB ────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values()) for (const r of rows) if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries()).map(([prog, rows]) => {
//       const yearVals: Record<string, string> = {};
//       for (const r of rows) { if (!isRealYear(r.year)) continue; yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value); }
//       return { label: prog, yearVals, isAmt: true };
//     }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) { let s = 0, any = false; for (const r of pivotRows) { const n = Number((r.yearVals[yr] || "").replace(/,/g, "")); if (!isNaN(n) && n > 0) { s += n; any = true; } } totalYV[yr] = any ? String(s) : ""; }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]} years={years} col1="Line Item" />
//         <div style={{ padding: "0 16px 4px" }}><WordsDisclosure metrics={metrics} /></div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return <Card title={title} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//   }
//   return <Card title={title} noPad><FlatTable metrics={valid} /></Card>;
// }

// function TabFinancial({ sections, row }: { sections: RawSection[]; row: Record<string, unknown> | null }) {
//   if (!sections.length) return <Empty />;
//   const allMetrics = sections.flatMap(s => s.metrics);
//   return (
//     <div>
//       {/* ── Chart ── */}
//       <FinancialChart metrics={allMetrics} />

//       {row && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
//           {row.pdf_capital_expenditure     != null && <KV label="Capital Expenditure (3yr Sum)"     value={fmtAmt(String(row.pdf_capital_expenditure))}     accent />}
//           {row.pdf_operational_expenditure != null && <KV label="Operational Expenditure (3yr Sum)" value={fmtAmt(String(row.pdf_operational_expenditure))} />}
//         </div>
//       )}
//       {sections.map(sec => <FinBlock key={sec.section} metrics={sec.metrics} title={sec.section} />)}
//     </div>
//   );
// }

// // ─── FACULTY TAB ──────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(m => m.metric.toLowerCase().includes("number of faculty") || m.metric.toLowerCase().includes("no of regular faculty"))?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {/* ── Chart ── */}
//       <FacultyChart metrics={valid} />

//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad><FlatTable metrics={valid} /></Card>
//     </div>
//   );
// }

// // ─── PUBLICATIONS TAB ─────────────────────────────────────────────────────────

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections.flatMap(s => s.metrics).filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   return (
//     <div>
//       {/* ── Chart ── */}
//       <PublicationsChart metrics={all} />

//       {hasYears ? (
//         (() => {
//           const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//           return (
//             <div>
//               {Array.from(pm.entries()).map(([db, rows]) => {
//                 const { rows: pivotRows, years } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return <Card key={db} title={db} noPad><YearPivotTable rows={pivotRows} years={years} /></Card>;
//               })}
//             </div>
//           );
//         })()
//       ) : (
//         <div>
//           {dbs.map(db => {
//             const dbMetrics = all.filter(m => cl(m.program) === db);
//             return (
//               <Card key={db} title={db} noPad>
//                 <FlatTable metrics={dbMetrics} />
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── FACILITIES TAB ───────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"));

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "10px 0", borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none" }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>{m.metric}</span>
//                     <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "12px 0", borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none" }}>
//                   <div style={{ flex: 1 }}>
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", lineHeight: 1.5 }}>{m.metric}</span>
//                     {hasYear && m.year && m.year !== "-" && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--ink-300)", marginLeft: 8 }}>({m.year})</span>}
//                   </div>
//                   <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", flexShrink: 0, padding: "3px 10px", color: yes ? "var(--teal)" : "var(--crimson)", background: yes ? "var(--teal-pale)" : "var(--crimson-pale)", border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}` }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─── ACCREDITATION TAB ────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return <Card key={sec.section} title={sec.section} noPad><RecordTable metrics={metrics} nameCol="Body" /></Card>;
//         }
//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── OTHER TAB ────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) return <Card key={sec.section} title={sec.section} noPad><YearPivotTable rows={rows} years={years} /></Card>;
//         }
//         if (hasProgram) {
//           return <Card key={sec.section} title={sec.section} noPad><RecordTable metrics={metrics} /></Card>;
//         }
//         return <Card key={sec.section} title={sec.section} noPad><FlatTable metrics={metrics} /></Card>;
//       })}
//     </div>
//   );
// }

// // ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) return <div style={{ padding: "80px 32px", textAlign: "center" }}><p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>Loading…</p></div>;
//   if (!profile) return <div style={{ padding: "80px 32px", textAlign: "center" }}><p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>Could not load data.</p></div>;

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
//   const rawSections = (profile.rawSections as RawSection[]);
//   const imgCols     = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));

//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0) : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";

//   function getSecs(tabId: TabId): RawSection[] {
//     return secsByTab.get(tabId) ?? [];
//   }

//   const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores:       row ? <TabScores row={row} imgCols={imgCols} scoresByYear={scoresByYear} activeYear={activeYear!} /> : <Empty />,
//     intake:       <TabIntake       sections={getSecs("intake")} />,
//     placement:    <TabPlacement    sections={getSecs("placement")} />,
//     phd:          <TabPhd          sections={getSecs("phd")} />,
//     students:     <TabStudents     sections={getSecs("students")} />,
//     research:     <TabResearch     sections={getSecs("research")} row={row} />,
//     innovation:   <TabInnovation   sections={getSecs("innovation")} />,
//     financial:    <TabFinancial    sections={getSecs("financial")} row={row} />,
//     faculty:      <TabFaculty      sections={getSecs("faculty")} />,
//     publications: <TabPublications sections={getSecs("publications")} />,
//     facilities:   <TabFacilities   sections={getSecs("facilities")} />,
//     accreditation:<TabAccreditation sections={getSecs("accreditation")} />,
//     other:        <TabOther        sections={getSecs("other")} />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* Hero */}
//       <div style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--crimson)", background: "var(--crimson-pale)", border: "1px solid rgba(192,57,43,0.2)", padding: "2px 8px", marginBottom: 10, display: "inline-block" }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(1.3rem,3vw,1.9rem)", color: "var(--ink-900)", lineHeight: 1.2, marginBottom: 5 }}>{profile.institute_name}</h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>{profile.institute_code}</p>
//           </div>
//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "3.2rem", color: "var(--crimson)", lineHeight: 1, marginBottom: 3 }}>{(row.img_total as number).toFixed(2)}</p>
//               <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-300)" }}>NIRF Total Score</p>
//             </div>
//           )}
//         </div>
//         {allYears.length > 0 && (
//           <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//             <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-300)", marginRight: 4 }}>Ranking Year</span>
//             {allYears.map(y => (
//               <button key={y} onClick={() => setActiveYear(y)} style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "3px 11px", background: activeYear === y ? "var(--crimson)" : "var(--white)", color: activeYear === y ? "var(--white)" : "var(--ink-500)", border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.15s" }}>{y}</button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs */}
//       <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
//         {visibleTabs.map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily: "var(--font-body)", fontWeight: safeTab === tab.id ? 600 : 400, fontSize: "0.78rem", padding: "9px 16px", background: "transparent", border: "none", borderBottom: safeTab === tab.id ? "2px solid var(--crimson)" : "2px solid transparent", marginBottom: "-2px", color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}>
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>{tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab body */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }








































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";
// import {
//   ScoresTrendChart,
//   IntakeTrendChart,
//   PlacementTrendChart,
//   FinancialTrendChart,
//   ResearchTrendChart,
// } from "@/app/components/NIRFCharts";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface Props { hit: SearchHit; }

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
// }

// interface RawSection {
//   section: string;
//   metrics: RawMetric[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab definitions
// // ─────────────────────────────────────────────────────────────────────────────

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",        label: "NIRF Scores",   icon: "★" },
//   { id: "intake",        label: "Intake",         icon: "⊕" },
//   { id: "placement",     label: "Placement",      icon: "↗" },
//   { id: "phd",           label: "PhD",            icon: "⚗" },
//   { id: "students",      label: "Students",       icon: "◎" },
//   { id: "research",      label: "Research",       icon: "◈" },
//   { id: "innovation",    label: "Innovation",     icon: "⚡" },
//   { id: "financial",     label: "Financial",      icon: "₹" },
//   { id: "faculty",       label: "Faculty",        icon: "✦" },
//   { id: "publications",  label: "Publications",   icon: "📄" },
//   { id: "facilities",    label: "Facilities",     icon: "⌂" },
//   { id: "accreditation", label: "Accreditation",  icon: "✓" },
//   { id: "other",         label: "Other",          icon: "+" },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // Section → Tab mapping (covers all years 2016–2025)
// // ─────────────────────────────────────────────────────────────────────────────

// const SECTION_TAB: Record<string, TabId> = {
//   // Intake
//   "Sanctioned (Approved) Intake":                                                      "intake",
//   "University Exam Details":                                                            "intake",
//   "Student Exam Details":                                                               "intake",
//   // Placement
//   "Placement & Higher Studies":                                                         "placement",
//   "Placement and Higher Studies":                                                       "placement",
//   "Graduation Outcome":                                                                 "placement",
//   // PhD
//   "Ph.D Student Details":                                                               "phd",
//   // Students
//   "Total Actual Student Strength (Program(s) Offered by your Institution)":            "students",
//   "Student Details":                                                                    "students",
//   "Scholarships":                                                                       "students",
//   // Research
//   "Sponsored Research Details":                                                         "research",
//   "Consultancy Project Details":                                                        "research",
//   "Executive Development Programs":                                                     "research",
//   "Executive Development Program/Management Development Programs":                     "research",
//   "Education Program Details":                                                          "research",
//   "Revenue from Executive Education":                                                   "research",
//   "FDP":                                                                                "research",
//   // Innovation
//   "Innovations at various stages of Technology Readiness Level":                       "innovation",
//   "Start up recognized by DPIIT/startup India":                                        "innovation",
//   "Ventures/startups grown to turnover of 50 lacs":                                   "innovation",
//   "Startups which have got VC investment in previous 3 years":                         "innovation",
//   "Innovation grant received from govt. organization in previous 3 years":             "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR":                          "innovation",
//   "Pre-incubation:expenditure/income":                                                 "innovation",
//   "Incubation:expenditure/income":                                                     "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies":                          "innovation",
//   "FDI investment in previous 3 years":                                                "innovation",
//   "Patents":                                                                            "innovation",
//   "Patents Commercialized & Technology Transferred":                                   "innovation",
//   "Patent Details":                                                                     "innovation",
//   "IPR Summary":                                                                        "innovation",
//   // Financial
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":     "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization":                                           "financial",
//   "Facilities Summaries":                                                               "financial",
//   // Faculty
//   "Faculty Details":                                                                    "faculty",
//   // Publications
//   "Publication Details":                                                                "publications",
//   // Facilities
//   "PCS Facilities: Facilities of Physically Challenged Students":                      "facilities",
//   "Facilities for Physically Challenged":                                              "facilities",
//   "Physical Facilties":                                                                "facilities",
//   "Physical Facilities":                                                               "facilities",
//   "Sustainability Details":                                                            "facilities",
//   "Sustainable Living Practices":                                                      "facilities",
//   // Accreditation
//   "Accreditation":                                                                     "accreditation",
//   "OPD Attendance & Bed Occupancy":                                                    "accreditation",
//   // Other
//   "Perception Details":                                                                "other",
//   "Student Events":                                                                    "other",
//   "Student Entrepreneurship":                                                          "other",
//   "New Programs Developed":                                                            "other",
//   "Programs Revised":                                                                  "other",
//   "Vocational Certificate Courses":                                                    "other",
//   "Multiple Entry/Exit and Indian Knowledge System":                                   "other",
//   "Prior Learning at Different Levels":                                                "other",
//   "Curriculum Design":                                                                 "other",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Value helpers
// // ─────────────────────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);

// const isBAD = (v: string | null | undefined) =>
//   BAD.has((v ?? "").trim().toLowerCase());

// const cl = (v: string | null | undefined): string =>
//   isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }

// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }

// function fmtAmt(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// function fmtSal(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }

// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }

// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) {
//     const k = fn(x);
//     if (!m.has(k)) m.set(k, []);
//     m.get(k)!.push(x);
//   }
//   return m;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared styles
// // ─────────────────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = {
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.6rem",
//   textTransform: "uppercase",
//   letterSpacing: "0.08em",
//   color: "var(--ink-400)",
//   padding: "8px 14px",
//   textAlign: "left",
//   borderBottom: "2px solid var(--border)",
//   background: "var(--off-white)",
//   whiteSpace: "nowrap",
// };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = {
//   padding: "8px 14px",
//   color: "var(--ink-700)",
//   verticalAlign: "middle",
//   fontSize: "0.78rem",
// };
// const TDM: React.CSSProperties = {
//   ...TD,
//   color: "var(--ink-400)",
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.68rem",
// };
// const TDR: React.CSSProperties = {
//   ...TD,
//   textAlign: "right",
//   fontFamily: "var(--font-mono)",
// };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = "var(--crimson-pale)";
//     },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent";
//     },
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // UI Primitives
// // ─────────────────────────────────────────────────────────────────────────────

// function KV({
//   label, value, accent, big,
// }: {
//   label: string; value?: string | null; accent?: boolean; big?: boolean;
// }) {
//   return (
//     <div style={{
//       background: accent ? "var(--crimson-pale)" : "var(--off-white)",
//       border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
//       padding: "14px 16px",
//     }}>
//       <p style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.6rem",
//         textTransform: "uppercase",
//         letterSpacing: "0.09em",
//         color: accent ? "var(--crimson)" : "var(--ink-500)",
//         marginBottom: 5,
//       }}>
//         {label}
//       </p>
//       <p style={{
//         fontFamily: "var(--font-display)",
//         fontStyle: "italic",
//         fontSize: big ? "1.9rem" : "1.35rem",
//         color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
//         lineHeight: 1,
//       }}>
//         {value || "—"}
//       </p>
//     </div>
//   );
// }

// function Card({
//   title, children, noPad,
// }: {
//   title?: string; children: React.ReactNode; noPad?: boolean;
// }) {
//   return (
//     <div style={{
//       background: "var(--white)",
//       border: "1px solid var(--border)",
//       boxShadow: "var(--shadow-sm)",
//       marginBottom: 14,
//       overflow: "hidden",
//       padding: noPad ? 0 : "20px 24px",
//     }}>
//       {title && (
//         <h3 style={{
//           fontFamily: "var(--font-display)",
//           fontStyle: "italic",
//           fontSize: "1rem",
//           color: "var(--ink-900)",
//           margin: 0,
//           padding: noPad ? "16px 24px 14px" : "0 0 8px",
//           borderBottom: "1px solid var(--border)",
//           marginBottom: 14,
//         }}>
//           {title}
//         </h3>
//       )}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.62rem",
//       textTransform: "uppercase",
//       letterSpacing: "0.1em",
//       color: "var(--crimson)",
//       marginBottom: 10,
//       paddingBottom: 6,
//       borderBottom: "1px solid var(--border)",
//     }}>
//       {children}
//     </p>
//   );
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.75rem",
//       color: "var(--ink-300)",
//       padding: "20px 0",
//     }}>
//       {msg}
//     </p>
//   );
// }

// function ScoreBar({
//   label, score, total,
// }: {
//   label: string; score: number | null; total: number | null;
// }) {
//   const pct =
//     score != null && (total ?? 100) > 0
//       ? Math.min((score / (total ?? 100)) * 100, 100)
//       : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//           {label}
//         </span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
//           {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
//         </span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{
//           height: "100%",
//           width: `${pct}%`,
//           background: "var(--crimson)",
//           transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
//         }} />
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Year Pivot Table
// // ─────────────────────────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string;
//   subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({
//   rows, years, col1 = "Metric",
// }: {
//   rows: PivotRow[]; years: string[]; col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//                 transition: "background 0.1s",
//               }}
//               {...rh(i)}
//             >
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && (
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.65rem",
//                     color: "var(--ink-300)",
//                     marginLeft: 6,
//                   }}>
//                     {row.subLabel}
//                   </span>
//                 )}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) {
//                   if (row.isSal)      d = fmtSal(val);
//                   else if (row.isAmt) d = fmtAmt(val);
//                   else                d = fmtN(val);
//                 }
//                 return (
//                   <td
//                     key={yr}
//                     style={{
//                       ...TDR,
//                       color: hasVal
//                         ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)")
//                         : "var(--ink-100)",
//                       fontWeight: row.isBold && hasVal ? 700 : 400,
//                       background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
//                     }}
//                   >
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(
//   metrics: RawMetric[],
//   opts?: { isSal?: boolean; isAmt?: boolean },
// ): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric) || !isRealYear(m.year)) continue;
//     const yr  = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) =>
//     baseYear(a).localeCompare(baseYear(b)),
//   );
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric,
//       yearVals,
//       isSal:
//         opts?.isSal ??
//         (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt:
//         opts?.isAmt ??
//         ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) &&
//           !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// function FlatTable({
//   metrics, col1 = "Metric", col2 = "Value",
// }: {
//   metrics: RawMetric[]; col1?: string; col2?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={TH}>{col1}</th>
//             <th style={THR}>{col2}</th>
//           </tr>
//         </thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//               }}
//               {...rh(i)}
//             >
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RecordTable({
//   metrics, nameCol = "Name",
// }: {
//   metrics: RawMetric[]; nameCol?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 180 }}>{nameCol}</th>
//             <th style={TH}>Field</th>
//             <th style={THR}>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr
//                 key={`${gi}-${i}`}
//                 style={{
//                   borderBottom: "1px solid var(--border)",
//                   background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                 }}
//                 {...rh(gi + i)}
//               >
//                 {i === 0 ? (
//                   <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                     {prog}
//                   </td>
//                 ) : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             )),
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({
//   label, children, open: init = true,
// }: {
//   label: string; children: React.ReactNode; open?: boolean;
// }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button
//         onClick={() => setO(x => !x)}
//         style={{
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 16px",
//           background: "var(--off-white)",
//           border: "none",
//           cursor: "pointer",
//           fontFamily: "var(--font-body)",
//           fontWeight: 600,
//           fontSize: "0.82rem",
//           color: "var(--crimson-dark)",
//           textAlign: "left",
//           borderBottom: o ? "1px solid var(--border)" : "none",
//         }}
//       >
//         <span>{label}</span>
//         <span style={{
//           fontSize: "0.65rem",
//           color: "var(--ink-400)",
//           transform: o ? "rotate(90deg)" : "none",
//           transition: "transform 0.2s",
//         }}>
//           ▶
//         </span>
//       </button>
//       {o && (
//         <div style={{ padding: "16px 20px", background: "var(--white)" }}>
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.63rem",
//         color: "var(--ink-300)",
//         cursor: "pointer",
//         padding: "4px 0",
//       }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div
//             key={i}
//             style={{
//               padding: "4px 0",
//               borderBottom: "1px solid var(--border)",
//               fontSize: "0.73rem",
//               color: "var(--ink-500)",
//               display: "flex",
//               gap: 12,
//             }}
//           >
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.63rem",
//               color: "var(--ink-300)",
//               minWidth: 70,
//               flexShrink: 0,
//             }}>
//               {m.year}
//             </span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Scores
// // ─────────────────────────────────────────────────────────────────────────────

// function TabScores({
//   row, imgCols, scoresByYear, activeYear,
// }: {
//   row: Record<string, unknown>;
//   imgCols: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   activeYear: number;
// }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

//       {/* KV summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV
//           label="NIRF Total"
//           value={row.img_total != null ? (row.img_total as number).toFixed(2) : null}
//           accent big
//         />
//         <KV
//           label="Student Strength"
//           value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Faculty Ratio"
//           value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Perception"
//           value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null}
//         />
//       </div>

//       {/* Trend chart — one line per parameter over all ranking years */}
//       <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />

//       {/* Parameter progress bars */}
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar
//             key={k}
//             label={
//               SCORE_LABELS[k] ??
//               k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()
//             }
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null}
//           />
//         ))}
//       </Card>

//       {/* Score detail table */}
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th style={TH}>Parameter</th>
//                 <th style={THR}>Score</th>
//                 <th style={THR}>Max</th>
//                 <th style={THR}>%</th>
//               </tr>
//             </thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null;
//                 const t = row[k.replace("_score", "_total")] as number | null;
//                 const p =
//                   s != null && (t ?? 100) > 0
//                     ? ((s / (t ?? 100)) * 100).toFixed(1) + "%"
//                     : "—";
//                 return (
//                   <tr
//                     key={k}
//                     style={{
//                       borderBottom: "1px solid var(--border)",
//                       background: i % 2 ? "var(--off-white)" : "transparent",
//                     }}
//                     {...rh(i)}
//                   >
//                     <td style={TD}>
//                       {SCORE_LABELS[k] ??
//                         k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>
//                       {s?.toFixed(2) ?? "—"}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>
//                       {t?.toFixed(0) ?? "—"}
//                     </td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Intake
// // ─────────────────────────────────────────────────────────────────────────────

// function TabIntake({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const allMetrics = allSections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return (
//       <Card title={sections[0]?.section}>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }

//   const pm   = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(
//     p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"),
//   );
//   const pgP = allP.filter(
//     p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
//   );
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values())
//     for (const r of rows)
//       if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr   = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {/* Trend chart — one line per program over academic years */}
//       <IntakeTrendChart metrics={allMetrics} />

//       {grandTotal > 0 && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
//           gap: 10,
//           marginBottom: 20,
//         }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}

//       {ugP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Undergraduate Programs</SH>
//           <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Postgraduate Programs</SH>
//           <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgIP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>PG-Integrated Programs</SH>
//           <YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" />
//         </div>
//       )}
//       {otP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Other Programs</SH>
//           <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
//         </div>
//       )}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable
//             rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]}
//             years={years}
//             col1=""
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Placement
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPlacement({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const allValid = allSections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric) && isRealYear(m.year) && !isBAD(m.program));
//   const allPm = groupBy(allValid, r => cl(r.program));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed   = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary   = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
//             gap: 10,
//             marginBottom: 16,
//           }}>
//             {placed && <KV label={`Placed (${latestYr})`}     value={fmtN(placed)}   accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm    = groupBy(valid, r => cl(r.program));
//   const allP  = Array.from(pm.keys());
//   const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows    = pm.get(prog)!;
//     const allRows = allPm.get(prog) ?? rows;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm    = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries())
//       .map(([metric, mrows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of mrows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return {
//           label: metric,
//           yearVals,
//           isSal:
//             metric.toLowerCase().includes("salary") ||
//             metric.toLowerCase().includes("median"),
//         };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));

//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

//     const latestGradYr =
//       years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ??
//       years.at(-1) ?? "";
//     const kv     = (kw: string) =>
//       pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed");
//     const salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr];
//     const higher = kv("higher stud") || kv("selected for higher");

//     return (
//       <div>
//         {/* Trend chart — placed / salary / higher studies over graduation years */}
//         <PlacementTrendChart metrics={allRows} program={prog} />

//         {(placed || salary || higher) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
//             gap: 8,
//             marginBottom: 14,
//           }}>
//             {placed && (
//               <KV
//                 label={`Placed (${latestGradYr || "Latest"})`}
//                 value={fmtN(placed)}
//                 accent
//               />
//             )}
//             {salary && <KV label="Median Salary"  value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)}   />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({
//     progs, label, open = true,
//   }: {
//     progs: string[]; label: string; open?: boolean;
//   }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup
//         label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`}
//         open={open}
//       >
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && (
//               <div style={{
//                 fontFamily: "var(--font-body)",
//                 fontWeight: 600,
//                 fontSize: "0.78rem",
//                 color: "var(--crimson-dark)",
//                 margin: i === 0 ? "0 0 10px" : "20px 0 10px",
//                 paddingBottom: 6,
//                 borderBottom: "1px dashed var(--border)",
//               }}>
//                 {p}
//               </div>
//             )}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true}  />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true}  />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: PhD
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPhd({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;

//   const all       = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP       = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP       = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 padding: "10px 16px",
//                 borderBottom: "1px solid var(--border)",
//               }}
//             >
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//                 {m.program}
//               </span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>
//                 {isBAD(m.value) ? "—" : fmtN(cl(m.value))}
//               </span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Students
// // ─────────────────────────────────────────────────────────────────────────────

// function TabStudents({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         const hasYears    = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values())
//             for (const r of rows)
//               if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         const pm = groupBy(metrics, r => {
//           const p = cl(r.program);
//           return !p || p === "-" ? "All Programs" : p;
//         });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr>
//                     <th style={{ ...TH, minWidth: 180 }}>Program</th>
//                     <th style={TH}>Metric</th>
//                     <th style={THR}>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr
//                         key={`${gi}-${i}`}
//                         style={{
//                           borderBottom: "1px solid var(--border)",
//                           background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                         }}
//                         {...rh(gi + i)}
//                       >
//                         {i === 0 ? (
//                           <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                             {prog}
//                           </td>
//                         ) : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     )),
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Research
// // ─────────────────────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
//     <div>
//       {/* Trend chart per section — projects / agencies / amount over years */}
//       {sections.map(sec => (
//         <ResearchTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_sponsored_projects != null && (
//             <KV
//               label="Sponsored Projects (3yr)"
//               value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}
//               accent
//             />
//           )}
//           {row.pdf_consultancy_projects != null && (
//             <KV
//               label="Consultancy Projects (3yr)"
//               value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")}
//             />
//           )}
//           {row.pdf_edp_participants != null && (
//             <KV
//               label="EDP Participants (3yr)"
//               value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Innovation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       flexShrink: 0,
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         if (
//           sec.section.toLowerCase().includes("ipr") ||
//           sec.section.toLowerCase().includes("patent")
//         ) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length)
//               return (
//                 <Card key={sec.section} title={sec.section} noPad>
//                   <YearPivotTable rows={rows} years={years} />
//                 </Card>
//               );
//           }
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <FlatTable metrics={metrics} />
//             </Card>
//           );
//         }

//         const hasNamedProgram = metrics.some(
//           m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
//         );
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Financial
// // ─────────────────────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid    = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values())
//       for (const r of rows)
//         if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries())
//       .map(([prog, rows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of rows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return { label: prog, yearVals, isAmt: true };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) {
//       let s = 0, any = false;
//       for (const r of pivotRows) {
//         const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
//         if (!isNaN(n) && n > 0) { s += n; any = true; }
//       }
//       totalYV[yr] = any ? String(s) : "";
//     }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable
//           rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]}
//           years={years}
//           col1="Line Item"
//         />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabFinancial({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
  
//     <div>
//       {/* Trend chart per section — one line per line item over years */}
//       {sections.map(sec => (
//         <FinancialTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_capital_expenditure != null && (
//             <KV
//               label="Capital Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_capital_expenditure))}
//               accent
//             />
//           )}
//           {row.pdf_operational_expenditure != null && (
//             <KV
//               label="Operational Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_operational_expenditure))}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <FinBlock key={`table-${sec.section}`} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Faculty
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(
//     m =>
//       m.metric.toLowerCase().includes("number of faculty") ||
//       m.metric.toLowerCase().includes("no of regular faculty"),
//   )?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad>
//         <FlatTable metrics={valid} />
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Publications
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs      = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   if (hasYears) {
//     const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//     return (
//       <div>
//         {Array.from(pm.entries()).map(([db, rows]) => {
//           const { rows: pivotRows, years } = buildPivotRows(rows);
//           if (!pivotRows.length) return null;
//           return (
//             <Card key={db} title={db} noPad>
//               <YearPivotTable rows={pivotRows} years={years} />
//             </Card>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div>
//       {dbs.map(db => (
//         <Card key={db} title={db} noPad>
//           <FlatTable metrics={all.filter(m => cl(m.program) === db)} />
//         </Card>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Facilities
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid   = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(
//           m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
//         );

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div
//                   key={i}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                     gap: 16,
//                     padding: "12px 0",
//                     borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                   }}
//                 >
//                   <div style={{ flex: 1 }}>
//                     <span style={{
//                       fontFamily: "var(--font-body)",
//                       fontSize: "0.78rem",
//                       color: "var(--ink-700)",
//                       lineHeight: 1.5,
//                     }}>
//                       {m.metric}
//                     </span>
//                     {hasYear && m.year && m.year !== "-" && (
//                       <span style={{
//                         fontFamily: "var(--font-mono)",
//                         fontSize: "0.62rem",
//                         color: "var(--ink-300)",
//                         marginLeft: 8,
//                       }}>
//                         ({m.year})
//                       </span>
//                     )}
//                   </div>
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.7rem",
//                     flexShrink: 0,
//                     padding: "3px 10px",
//                     color: yes ? "var(--teal)" : "var(--crimson)",
//                     background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                     border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                   }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Accreditation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Body" />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Other
// // ─────────────────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears   = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) {
//             return (
//               <Card key={sec.section} title={sec.section} noPad>
//                 <YearPivotTable rows={rows} years={years} />
//               </Card>
//             );
//           }
//         }
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main component
// // ─────────────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>
//           Loading…
//         </p>
//       </div>
//     );
//   }
//   if (!profile) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
//           Could not load data.
//         </p>
//       </div>
//     );
//   }

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear
//     ? (profile.scoresByYear[activeYear] as Record<string, unknown>)
//     : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols     = Object.keys(row ?? {}).filter(
//     k => k.startsWith("img_") && k.endsWith("_score"),
//   );

//   // secsByTab — filtered to active year (for tables)
//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear
//         ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0)
//         : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   // allSecsByTab — ALL ranking years unfiltered (for trend charts)
//   const allSecsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     if (!s.metrics.length) continue;
//     if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
//     allSecsByTab.get(tabId)!.push(s);
//   }

//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";
//   const getSecs    = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
//   const getAllSecs  = (tabId: TabId): RawSection[] => allSecsByTab.get(tabId) ?? [];
//   const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores: row ? (
//       <TabScores
//         row={row}
//         imgCols={imgCols}
//         scoresByYear={scoresByYear}
//         activeYear={activeYear!}
//       />
//     ) : (
//       <Empty />
//     ),
//     intake:        <TabIntake        sections={getSecs("intake")}        allSections={getAllSecs("intake")}        />,
//     placement:     <TabPlacement     sections={getSecs("placement")}     allSections={getAllSecs("placement")}     />,
//     phd:           <TabPhd           sections={getSecs("phd")}                                                    />,
//     students:      <TabStudents      sections={getSecs("students")}                                               />,
//     research:      <TabResearch      sections={getSecs("research")}      allSections={getAllSecs("research")}      row={row} />,
//     innovation:    <TabInnovation    sections={getSecs("innovation")}                                             />,
//     financial:     <TabFinancial     sections={getSecs("financial")}     allSections={getAllSecs("financial")}     row={row} />,
//     faculty:       <TabFaculty       sections={getSecs("faculty")}                                                />,
//     publications:  <TabPublications  sections={getSecs("publications")}                                          />,
//     facilities:    <TabFacilities    sections={getSecs("facilities")}                                            />,
//     accreditation: <TabAccreditation sections={getSecs("accreditation")}                                         />,
//     other:         <TabOther         sections={getSecs("other")}                                                  />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* ── Hero ── */}
//       <div style={{
//         background: "var(--white)",
//         border: "1px solid var(--border)",
//         padding: "24px 28px",
//         marginBottom: 20,
//         boxShadow: "var(--shadow-sm)",
//       }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.1em",
//               color: "var(--crimson)",
//               background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.2)",
//               padding: "2px 8px",
//               marginBottom: 10,
//               display: "inline-block",
//             }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{
//               fontFamily: "var(--font-display)",
//               fontStyle: "italic",
//               fontSize: "clamp(1.3rem,3vw,1.9rem)",
//               color: "var(--ink-900)",
//               lineHeight: 1.2,
//               marginBottom: 5,
//             }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
//               {profile.institute_code}
//             </p>
//           </div>

//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-display)",
//                 fontStyle: "italic",
//                 fontSize: "3.2rem",
//                 color: "var(--crimson)",
//                 lineHeight: 1,
//                 marginBottom: 3,
//               }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.6rem",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.1em",
//                 color: "var(--ink-300)",
//               }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>

//         {allYears.length > 0 && (
//           <div style={{
//             marginTop: 18,
//             paddingTop: 14,
//             borderTop: "1px solid var(--border)",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             flexWrap: "wrap",
//           }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.08em",
//               color: "var(--ink-300)",
//               marginRight: 4,
//             }}>
//               Ranking Year
//             </span>
//             {allYears.map(y => (
//               <button
//                 key={y}
//                 onClick={() => setActiveYear(y)}
//                 style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize: "0.72rem",
//                   padding: "3px 11px",
//                   background: activeYear === y ? "var(--crimson)" : "var(--white)",
//                   color: activeYear === y ? "var(--white)" : "var(--ink-500)",
//                   border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
//                   cursor: "pointer",
//                   transition: "all 0.15s",
//                 }}
//               >
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Tab strip ── */}
//       <div style={{
//         display: "flex",
//         borderBottom: "2px solid var(--border)",
//         marginBottom: 20,
//         overflowX: "auto",
//       }}>
//         {visibleTabs.map(tab => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             style={{
//               fontFamily: "var(--font-body)",
//               fontWeight: safeTab === tab.id ? 600 : 400,
//               fontSize: "0.78rem",
//               padding: "9px 16px",
//               background: "transparent",
//               border: "none",
//               borderBottom: safeTab === tab.id
//                 ? "2px solid var(--crimson)"
//                 : "2px solid transparent",
//               marginBottom: "-2px",
//               color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
//               cursor: "pointer",
//               whiteSpace: "nowrap",
//               transition: "all 0.15s",
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//             }}
//           >
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Tab body ── */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";
// import {
//   ScoresTrendChart,
//   IntakeTrendChart,
//   PlacementTrendChart,
//   FinancialTrendChart,
//   ResearchTrendChart,
//   PhdTrendChart,
//   StudentsTrendChart,
// } from "@/app/components/NIRFCharts";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface Props { hit: SearchHit; }

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
// }

// interface RawSection {
//   section: string;
//   metrics: RawMetric[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab definitions
// // ─────────────────────────────────────────────────────────────────────────────

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",        label: "NIRF Scores",   icon: "★" },
//   { id: "intake",        label: "Intake",         icon: "⊕" },
//   { id: "placement",     label: "Placement",      icon: "↗" },
//   { id: "phd",           label: "PhD",            icon: "⚗" },
//   { id: "students",      label: "Students",       icon: "◎" },
//   { id: "research",      label: "Research",       icon: "◈" },
//   { id: "innovation",    label: "Innovation",     icon: "⚡" },
//   { id: "financial",     label: "Financial",      icon: "₹" },
//   { id: "faculty",       label: "Faculty",        icon: "✦" },
//   { id: "publications",  label: "Publications",   icon: "📄" },
//   { id: "facilities",    label: "Facilities",     icon: "⌂" },
//   { id: "accreditation", label: "Accreditation",  icon: "✓" },
//   { id: "other",         label: "Other",          icon: "+" },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // Section → Tab mapping (covers all years 2016–2025)
// // ─────────────────────────────────────────────────────────────────────────────

// const SECTION_TAB: Record<string, TabId> = {
//   // Intake
//   "Sanctioned (Approved) Intake":                                                      "intake",
//   "University Exam Details":                                                            "intake",
//   "Student Exam Details":                                                               "intake",
//   // Placement
//   "Placement & Higher Studies":                                                         "placement",
//   "Placement and Higher Studies":                                                       "placement",
//   "Graduation Outcome":                                                                 "placement",
//   // PhD
//   "Ph.D Student Details":                                                               "phd",
//   // Students
//   "Total Actual Student Strength (Program(s) Offered by your Institution)":            "students",
//   "Student Details":                                                                    "students",
//   "Scholarships":                                                                       "students",
//   // Research
//   "Sponsored Research Details":                                                         "research",
//   "Consultancy Project Details":                                                        "research",
//   "Executive Development Programs":                                                     "research",
//   "Executive Development Program/Management Development Programs":                     "research",
//   "Education Program Details":                                                          "research",
//   "Revenue from Executive Education":                                                   "research",
//   "FDP":                                                                                "research",
//   // Innovation
//   "Innovations at various stages of Technology Readiness Level":                       "innovation",
//   "Start up recognized by DPIIT/startup India":                                        "innovation",
//   "Ventures/startups grown to turnover of 50 lacs":                                   "innovation",
//   "Startups which have got VC investment in previous 3 years":                         "innovation",
//   "Innovation grant received from govt. organization in previous 3 years":             "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR":                          "innovation",
//   "Pre-incubation:expenditure/income":                                                 "innovation",
//   "Incubation:expenditure/income":                                                     "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies":                          "innovation",
//   "FDI investment in previous 3 years":                                                "innovation",
//   "Patents":                                                                            "innovation",
//   "Patents Commercialized & Technology Transferred":                                   "innovation",
//   "Patent Details":                                                                     "innovation",
//   "IPR Summary":                                                                        "innovation",
//   // Financial
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":     "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization":                                           "financial",
//   "Facilities Summaries":                                                               "financial",
//   // Faculty
//   "Faculty Details":                                                                    "faculty",
//   // Publications
//   "Publication Details":                                                                "publications",
//   // Facilities
//   "PCS Facilities: Facilities of Physically Challenged Students":                      "facilities",
//   "Facilities for Physically Challenged":                                              "facilities",
//   "Physical Facilties":                                                                "facilities",
//   "Physical Facilities":                                                               "facilities",
//   "Sustainability Details":                                                            "facilities",
//   "Sustainable Living Practices":                                                      "facilities",
//   // Accreditation
//   "Accreditation":                                                                     "accreditation",
//   "OPD Attendance & Bed Occupancy":                                                    "accreditation",
//   // Other
//   "Perception Details":                                                                "other",
//   "Student Events":                                                                    "other",
//   "Student Entrepreneurship":                                                          "other",
//   "New Programs Developed":                                                            "other",
//   "Programs Revised":                                                                  "other",
//   "Vocational Certificate Courses":                                                    "other",
//   "Multiple Entry/Exit and Indian Knowledge System":                                   "other",
//   "Prior Learning at Different Levels":                                                "other",
//   "Curriculum Design":                                                                 "other",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Value helpers
// // ─────────────────────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);

// const isBAD = (v: string | null | undefined) =>
//   BAD.has((v ?? "").trim().toLowerCase());

// const cl = (v: string | null | undefined): string =>
//   isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }

// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }

// function fmtAmt(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// function fmtSal(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }

// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }

// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) {
//     const k = fn(x);
//     if (!m.has(k)) m.set(k, []);
//     m.get(k)!.push(x);
//   }
//   return m;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared styles
// // ─────────────────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = {
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.6rem",
//   textTransform: "uppercase",
//   letterSpacing: "0.08em",
//   color: "var(--ink-400)",
//   padding: "8px 14px",
//   textAlign: "left",
//   borderBottom: "2px solid var(--border)",
//   background: "var(--off-white)",
//   whiteSpace: "nowrap",
// };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = {
//   padding: "8px 14px",
//   color: "var(--ink-700)",
//   verticalAlign: "middle",
//   fontSize: "0.78rem",
// };
// const TDM: React.CSSProperties = {
//   ...TD,
//   color: "var(--ink-400)",
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.68rem",
// };
// const TDR: React.CSSProperties = {
//   ...TD,
//   textAlign: "right",
//   fontFamily: "var(--font-mono)",
// };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = "var(--crimson-pale)";
//     },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent";
//     },
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // UI Primitives
// // ─────────────────────────────────────────────────────────────────────────────

// function KV({
//   label, value, accent, big,
// }: {
//   label: string; value?: string | null; accent?: boolean; big?: boolean;
// }) {
//   return (
//     <div style={{
//       background: accent ? "var(--crimson-pale)" : "var(--off-white)",
//       border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
//       padding: "14px 16px",
//     }}>
//       <p style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.6rem",
//         textTransform: "uppercase",
//         letterSpacing: "0.09em",
//         color: accent ? "var(--crimson)" : "var(--ink-500)",
//         marginBottom: 5,
//       }}>
//         {label}
//       </p>
//       <p style={{
//         fontFamily: "var(--font-display)",
//         fontStyle: "italic",
//         fontSize: big ? "1.9rem" : "1.35rem",
//         color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
//         lineHeight: 1,
//       }}>
//         {value || "—"}
//       </p>
//     </div>
//   );
// }

// function Card({
//   title, children, noPad,
// }: {
//   title?: string; children: React.ReactNode; noPad?: boolean;
// }) {
//   return (
//     <div style={{
//       background: "var(--white)",
//       border: "1px solid var(--border)",
//       boxShadow: "var(--shadow-sm)",
//       marginBottom: 14,
//       overflow: "hidden",
//       padding: noPad ? 0 : "20px 24px",
//     }}>
//       {title && (
//         <h3 style={{
//           fontFamily: "var(--font-display)",
//           fontStyle: "italic",
//           fontSize: "1rem",
//           color: "var(--ink-900)",
//           margin: 0,
//           padding: noPad ? "16px 24px 14px" : "0 0 8px",
//           borderBottom: "1px solid var(--border)",
//           marginBottom: 14,
//         }}>
//           {title}
//         </h3>
//       )}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.62rem",
//       textTransform: "uppercase",
//       letterSpacing: "0.1em",
//       color: "var(--crimson)",
//       marginBottom: 10,
//       paddingBottom: 6,
//       borderBottom: "1px solid var(--border)",
//     }}>
//       {children}
//     </p>
//   );
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.75rem",
//       color: "var(--ink-300)",
//       padding: "20px 0",
//     }}>
//       {msg}
//     </p>
//   );
// }

// function ScoreBar({
//   label, score, total,
// }: {
//   label: string; score: number | null; total: number | null;
// }) {
//   const pct =
//     score != null && (total ?? 100) > 0
//       ? Math.min((score / (total ?? 100)) * 100, 100)
//       : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//           {label}
//         </span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
//           {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
//         </span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{
//           height: "100%",
//           width: `${pct}%`,
//           background: "var(--crimson)",
//           transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
//         }} />
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Year Pivot Table
// // ─────────────────────────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string;
//   subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({
//   rows, years, col1 = "Metric",
// }: {
//   rows: PivotRow[]; years: string[]; col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//                 transition: "background 0.1s",
//               }}
//               {...rh(i)}
//             >
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && (
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.65rem",
//                     color: "var(--ink-300)",
//                     marginLeft: 6,
//                   }}>
//                     {row.subLabel}
//                   </span>
//                 )}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) {
//                   if (row.isSal)      d = fmtSal(val);
//                   else if (row.isAmt) d = fmtAmt(val);
//                   else                d = fmtN(val);
//                 }
//                 return (
//                   <td
//                     key={yr}
//                     style={{
//                       ...TDR,
//                       color: hasVal
//                         ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)")
//                         : "var(--ink-100)",
//                       fontWeight: row.isBold && hasVal ? 700 : 400,
//                       background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
//                     }}
//                   >
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(
//   metrics: RawMetric[],
//   opts?: { isSal?: boolean; isAmt?: boolean },
// ): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric) || !isRealYear(m.year)) continue;
//     const yr  = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) =>
//     baseYear(a).localeCompare(baseYear(b)),
//   );
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric,
//       yearVals,
//       isSal:
//         opts?.isSal ??
//         (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt:
//         opts?.isAmt ??
//         ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) &&
//           !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// function FlatTable({
//   metrics, col1 = "Metric", col2 = "Value",
// }: {
//   metrics: RawMetric[]; col1?: string; col2?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={TH}>{col1}</th>
//             <th style={THR}>{col2}</th>
//           </tr>
//         </thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//               }}
//               {...rh(i)}
//             >
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RecordTable({
//   metrics, nameCol = "Name",
// }: {
//   metrics: RawMetric[]; nameCol?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 180 }}>{nameCol}</th>
//             <th style={TH}>Field</th>
//             <th style={THR}>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr
//                 key={`${gi}-${i}`}
//                 style={{
//                   borderBottom: "1px solid var(--border)",
//                   background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                 }}
//                 {...rh(gi + i)}
//               >
//                 {i === 0 ? (
//                   <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                     {prog}
//                   </td>
//                 ) : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             )),
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({
//   label, children, open: init = true,
// }: {
//   label: string; children: React.ReactNode; open?: boolean;
// }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button
//         onClick={() => setO(x => !x)}
//         style={{
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 16px",
//           background: "var(--off-white)",
//           border: "none",
//           cursor: "pointer",
//           fontFamily: "var(--font-body)",
//           fontWeight: 600,
//           fontSize: "0.82rem",
//           color: "var(--crimson-dark)",
//           textAlign: "left",
//           borderBottom: o ? "1px solid var(--border)" : "none",
//         }}
//       >
//         <span>{label}</span>
//         <span style={{
//           fontSize: "0.65rem",
//           color: "var(--ink-400)",
//           transform: o ? "rotate(90deg)" : "none",
//           transition: "transform 0.2s",
//         }}>
//           ▶
//         </span>
//       </button>
//       {o && (
//         <div style={{ padding: "16px 20px", background: "var(--white)" }}>
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.63rem",
//         color: "var(--ink-300)",
//         cursor: "pointer",
//         padding: "4px 0",
//       }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div
//             key={i}
//             style={{
//               padding: "4px 0",
//               borderBottom: "1px solid var(--border)",
//               fontSize: "0.73rem",
//               color: "var(--ink-500)",
//               display: "flex",
//               gap: 12,
//             }}
//           >
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.63rem",
//               color: "var(--ink-300)",
//               minWidth: 70,
//               flexShrink: 0,
//             }}>
//               {m.year}
//             </span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Scores
// // ─────────────────────────────────────────────────────────────────────────────

// function TabScores({
//   row, imgCols, scoresByYear, activeYear,
// }: {
//   row: Record<string, unknown>;
//   imgCols: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   activeYear: number;
// }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

//       {/* KV summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV
//           label="NIRF Total"
//           value={row.img_total != null ? (row.img_total as number).toFixed(2) : null}
//           accent big
//         />
//         <KV
//           label="Student Strength"
//           value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Faculty Ratio"
//           value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Perception"
//           value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null}
//         />
//       </div>

//       {/* Trend chart — one line per parameter over all ranking years */}
//       <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />

//       {/* Parameter progress bars */}
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar
//             key={k}
//             label={
//               SCORE_LABELS[k] ??
//               k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()
//             }
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null}
//           />
//         ))}
//       </Card>

//       {/* Score detail table */}
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th style={TH}>Parameter</th>
//                 <th style={THR}>Score</th>
//                 <th style={THR}>Max</th>
//                 <th style={THR}>%</th>
//               </tr>
//             </thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null;
//                 const t = row[k.replace("_score", "_total")] as number | null;
//                 const p =
//                   s != null && (t ?? 100) > 0
//                     ? ((s / (t ?? 100)) * 100).toFixed(1) + "%"
//                     : "—";
//                 return (
//                   <tr
//                     key={k}
//                     style={{
//                       borderBottom: "1px solid var(--border)",
//                       background: i % 2 ? "var(--off-white)" : "transparent",
//                     }}
//                     {...rh(i)}
//                   >
//                     <td style={TD}>
//                       {SCORE_LABELS[k] ??
//                         k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>
//                       {s?.toFixed(2) ?? "—"}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>
//                       {t?.toFixed(0) ?? "—"}
//                     </td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Intake
// // ─────────────────────────────────────────────────────────────────────────────

// function TabIntake({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const allMetrics = allSections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return (
//       <Card title={sections[0]?.section}>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }

//   const pm   = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(
//     p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"),
//   );
//   const pgP = allP.filter(
//     p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
//   );
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values())
//     for (const r of rows)
//       if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr   = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {/* Trend chart — one line per program over academic years */}
//       <IntakeTrendChart metrics={allMetrics} />

//       {grandTotal > 0 && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
//           gap: 10,
//           marginBottom: 20,
//         }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}

//       {ugP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Undergraduate Programs</SH>
//           <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Postgraduate Programs</SH>
//           <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgIP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>PG-Integrated Programs</SH>
//           <YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" />
//         </div>
//       )}
//       {otP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Other Programs</SH>
//           <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
//         </div>
//       )}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable
//             rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]}
//             years={years}
//             col1=""
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Placement
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPlacement({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const allValid = allSections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric) && isRealYear(m.year) && !isBAD(m.program));
//   const allPm = groupBy(allValid, r => cl(r.program));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed   = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary   = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
//             gap: 10,
//             marginBottom: 16,
//           }}>
//             {placed && <KV label={`Placed (${latestYr})`}     value={fmtN(placed)}   accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm    = groupBy(valid, r => cl(r.program));
//   const allP  = Array.from(pm.keys());
//   const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows    = pm.get(prog)!;
//     const allRows = allPm.get(prog) ?? rows;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm    = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries())
//       .map(([metric, mrows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of mrows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return {
//           label: metric,
//           yearVals,
//           isSal:
//             metric.toLowerCase().includes("salary") ||
//             metric.toLowerCase().includes("median"),
//         };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));

//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

//     const latestGradYr =
//       years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ??
//       years.at(-1) ?? "";
//     const kv     = (kw: string) =>
//       pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed");
//     const salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr];
//     const higher = kv("higher stud") || kv("selected for higher");

//     return (
//       <div>
//         {/* Trend chart — placed / salary / higher studies over graduation years */}
//         <PlacementTrendChart metrics={allRows} program={prog} />

//         {(placed || salary || higher) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
//             gap: 8,
//             marginBottom: 14,
//           }}>
//             {placed && (
//               <KV
//                 label={`Placed (${latestGradYr || "Latest"})`}
//                 value={fmtN(placed)}
//                 accent
//               />
//             )}
//             {salary && <KV label="Median Salary"  value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)}   />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({
//     progs, label, open = true,
//   }: {
//     progs: string[]; label: string; open?: boolean;
//   }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup
//         label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`}
//         open={open}
//       >
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && (
//               <div style={{
//                 fontFamily: "var(--font-body)",
//                 fontWeight: 600,
//                 fontSize: "0.78rem",
//                 color: "var(--crimson-dark)",
//                 margin: i === 0 ? "0 0 10px" : "20px 0 10px",
//                 paddingBottom: 6,
//                 borderBottom: "1px dashed var(--border)",
//               }}>
//                 {p}
//               </div>
//             )}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true}  />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true}  />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: PhD
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPhd({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;

//   const all       = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP       = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP       = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

//   // All graduated metrics across every ranking year — for the trend chart
//   const allGraduated = allSections
//     .flatMap(s => s.metrics)
//     .filter(m =>
//       isRealYear(m.year) &&
//       !isBAD(m.value) &&
//       !m.program?.toLowerCase().includes("pursuing"),
//     );

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

//       {/* Trend chart — Full Time + Part Time graduated over all academic years */}
//       <PhdTrendChart metrics={allGraduated} />

//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 padding: "10px 16px",
//                 borderBottom: "1px solid var(--border)",
//               }}
//             >
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//                 {m.program}
//               </span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>
//                 {isBAD(m.value) ? "—" : fmtN(cl(m.value))}
//               </span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Students
// // ─────────────────────────────────────────────────────────────────────────────

// function TabStudents({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty />;

//   // All metrics across every ranking year — used for the trend chart only
//   const allMetrics = allSections.flatMap(s => s.metrics);

//   return (
//     <div>
//       {/* Trend charts — composition and diversity across ranking years */}
//       <StudentsTrendChart metrics={allMetrics as any} />

//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         const hasYears    = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values())
//             for (const r of rows)
//               if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         const pm = groupBy(metrics, r => {
//           const p = cl(r.program);
//           return !p || p === "-" ? "All Programs" : p;
//         });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr>
//                     <th style={{ ...TH, minWidth: 180 }}>Program</th>
//                     <th style={TH}>Metric</th>
//                     <th style={THR}>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr
//                         key={`${gi}-${i}`}
//                         style={{
//                           borderBottom: "1px solid var(--border)",
//                           background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                         }}
//                         {...rh(gi + i)}
//                       >
//                         {i === 0 ? (
//                           <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                             {prog}
//                           </td>
//                         ) : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     )),
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Research
// // ─────────────────────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
//     <div>
//       {/* Trend chart per section — projects / agencies / amount over years */}
//       {sections.map(sec => (
//         <ResearchTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_sponsored_projects != null && (
//             <KV
//               label="Sponsored Projects (3yr)"
//               value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}
//               accent
//             />
//           )}
//           {row.pdf_consultancy_projects != null && (
//             <KV
//               label="Consultancy Projects (3yr)"
//               value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")}
//             />
//           )}
//           {row.pdf_edp_participants != null && (
//             <KV
//               label="EDP Participants (3yr)"
//               value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Innovation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       flexShrink: 0,
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         if (
//           sec.section.toLowerCase().includes("ipr") ||
//           sec.section.toLowerCase().includes("patent")
//         ) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length)
//               return (
//                 <Card key={sec.section} title={sec.section} noPad>
//                   <YearPivotTable rows={rows} years={years} />
//                 </Card>
//               );
//           }
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <FlatTable metrics={metrics} />
//             </Card>
//           );
//         }

//         const hasNamedProgram = metrics.some(
//           m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
//         );
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Financial
// // ─────────────────────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid    = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values())
//       for (const r of rows)
//         if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries())
//       .map(([prog, rows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of rows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return { label: prog, yearVals, isAmt: true };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) {
//       let s = 0, any = false;
//       for (const r of pivotRows) {
//         const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
//         if (!isNaN(n) && n > 0) { s += n; any = true; }
//       }
//       totalYV[yr] = any ? String(s) : "";
//     }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable
//           rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]}
//           years={years}
//           col1="Line Item"
//         />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabFinancial({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
  
//     <div>
//       {/* Trend chart per section — one line per line item over years */}
//       {sections.map(sec => (
//         <FinancialTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_capital_expenditure != null && (
//             <KV
//               label="Capital Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_capital_expenditure))}
//               accent
//             />
//           )}
//           {row.pdf_operational_expenditure != null && (
//             <KV
//               label="Operational Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_operational_expenditure))}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <FinBlock key={`table-${sec.section}`} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Faculty
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(
//     m =>
//       m.metric.toLowerCase().includes("number of faculty") ||
//       m.metric.toLowerCase().includes("no of regular faculty"),
//   )?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad>
//         <FlatTable metrics={valid} />
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Publications
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs      = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   if (hasYears) {
//     const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//     return (
//       <div>
//         {Array.from(pm.entries()).map(([db, rows]) => {
//           const { rows: pivotRows, years } = buildPivotRows(rows);
//           if (!pivotRows.length) return null;
//           return (
//             <Card key={db} title={db} noPad>
//               <YearPivotTable rows={pivotRows} years={years} />
//             </Card>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div>
//       {dbs.map(db => (
//         <Card key={db} title={db} noPad>
//           <FlatTable metrics={all.filter(m => cl(m.program) === db)} />
//         </Card>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Facilities
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid   = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(
//           m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
//         );

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div
//                   key={i}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                     gap: 16,
//                     padding: "12px 0",
//                     borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                   }}
//                 >
//                   <div style={{ flex: 1 }}>
//                     <span style={{
//                       fontFamily: "var(--font-body)",
//                       fontSize: "0.78rem",
//                       color: "var(--ink-700)",
//                       lineHeight: 1.5,
//                     }}>
//                       {m.metric}
//                     </span>
//                     {hasYear && m.year && m.year !== "-" && (
//                       <span style={{
//                         fontFamily: "var(--font-mono)",
//                         fontSize: "0.62rem",
//                         color: "var(--ink-300)",
//                         marginLeft: 8,
//                       }}>
//                         ({m.year})
//                       </span>
//                     )}
//                   </div>
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.7rem",
//                     flexShrink: 0,
//                     padding: "3px 10px",
//                     color: yes ? "var(--teal)" : "var(--crimson)",
//                     background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                     border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                   }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Accreditation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Body" />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Other
// // ─────────────────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears   = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) {
//             return (
//               <Card key={sec.section} title={sec.section} noPad>
//                 <YearPivotTable rows={rows} years={years} />
//               </Card>
//             );
//           }
//         }
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main component
// // ─────────────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>
//           Loading…
//         </p>
//       </div>
//     );
//   }
//   if (!profile) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
//           Could not load data.
//         </p>
//       </div>
//     );
//   }

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear
//     ? (profile.scoresByYear[activeYear] as Record<string, unknown>)
//     : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols     = Object.keys(row ?? {}).filter(
//     k => k.startsWith("img_") && k.endsWith("_score"),
//   );

//   // secsByTab — filtered to active year (for tables)
//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear
//         ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0)
//         : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   // allSecsByTab — ALL ranking years unfiltered (for trend charts)
//   const allSecsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     if (!s.metrics.length) continue;
//     if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
//     allSecsByTab.get(tabId)!.push(s);
//   }

//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";
//   const getSecs    = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
//   const getAllSecs  = (tabId: TabId): RawSection[] => allSecsByTab.get(tabId) ?? [];
//   const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores: row ? (
//       <TabScores
//         row={row}
//         imgCols={imgCols}
//         scoresByYear={scoresByYear}
//         activeYear={activeYear!}
//       />
//     ) : (
//       <Empty />
//     ),
//     intake:        <TabIntake        sections={getSecs("intake")}        allSections={getAllSecs("intake")}        />,
//     placement:     <TabPlacement     sections={getSecs("placement")}     allSections={getAllSecs("placement")}     />,
//     phd:           <TabPhd           sections={getSecs("phd")}           allSections={getAllSecs("phd")}           />,
//     students:      <TabStudents      sections={getSecs("students")}      allSections={getAllSecs("students")}      />,
//     research:      <TabResearch      sections={getSecs("research")}      allSections={getAllSecs("research")}      row={row} />,
//     innovation:    <TabInnovation    sections={getSecs("innovation")}                                             />,
//     financial:     <TabFinancial     sections={getSecs("financial")}     allSections={getAllSecs("financial")}     row={row} />,
//     faculty:       <TabFaculty       sections={getSecs("faculty")}                                                />,
//     publications:  <TabPublications  sections={getSecs("publications")}                                          />,
//     facilities:    <TabFacilities    sections={getSecs("facilities")}                                            />,
//     accreditation: <TabAccreditation sections={getSecs("accreditation")}                                         />,
//     other:         <TabOther         sections={getSecs("other")}                                                  />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* ── Hero ── */}
//       <div style={{
//         background: "var(--white)",
//         border: "1px solid var(--border)",
//         padding: "24px 28px",
//         marginBottom: 20,
//         boxShadow: "var(--shadow-sm)",
//       }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.1em",
//               color: "var(--crimson)",
//               background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.2)",
//               padding: "2px 8px",
//               marginBottom: 10,
//               display: "inline-block",
//             }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{
//               fontFamily: "var(--font-display)",
//               fontStyle: "italic",
//               fontSize: "clamp(1.3rem,3vw,1.9rem)",
//               color: "var(--ink-900)",
//               lineHeight: 1.2,
//               marginBottom: 5,
//             }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
//               {profile.institute_code}
//             </p>
//           </div>

//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-display)",
//                 fontStyle: "italic",
//                 fontSize: "3.2rem",
//                 color: "var(--crimson)",
//                 lineHeight: 1,
//                 marginBottom: 3,
//               }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.6rem",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.1em",
//                 color: "var(--ink-300)",
//               }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>

//         {allYears.length > 0 && (
//           <div style={{
//             marginTop: 18,
//             paddingTop: 14,
//             borderTop: "1px solid var(--border)",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             flexWrap: "wrap",
//           }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.08em",
//               color: "var(--ink-300)",
//               marginRight: 4,
//             }}>
//               Ranking Year
//             </span>
//             {allYears.map(y => (
//               <button
//                 key={y}
//                 onClick={() => setActiveYear(y)}
//                 style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize: "0.72rem",
//                   padding: "3px 11px",
//                   background: activeYear === y ? "var(--crimson)" : "var(--white)",
//                   color: activeYear === y ? "var(--white)" : "var(--ink-500)",
//                   border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
//                   cursor: "pointer",
//                   transition: "all 0.15s",
//                 }}
//               >
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Tab strip ── */}
//       <div style={{
//         display: "flex",
//         borderBottom: "2px solid var(--border)",
//         marginBottom: 20,
//         overflowX: "auto",
//       }}>
//         {visibleTabs.map(tab => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             style={{
//               fontFamily: "var(--font-body)",
//               fontWeight: safeTab === tab.id ? 600 : 400,
//               fontSize: "0.78rem",
//               padding: "9px 16px",
//               background: "transparent",
//               border: "none",
//               borderBottom: safeTab === tab.id
//                 ? "2px solid var(--crimson)"
//                 : "2px solid transparent",
//               marginBottom: "-2px",
//               color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
//               cursor: "pointer",
//               whiteSpace: "nowrap",
//               transition: "all 0.15s",
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//             }}
//           >
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Tab body ── */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }














































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";
// import {
//   ScoresTrendChart,
//   IntakeTrendChart,
//   PlacementTrendChart,
//   FinancialTrendChart,
//   ResearchTrendChart,
//   PhdTrendChart,
//   StudentsTrendChart,
// } from "@/app/components/NIRFCharts";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface Props { hit: SearchHit; }

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
// }

// interface RawSection {
//   section: string;
//   metrics: RawMetric[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab definitions
// // ─────────────────────────────────────────────────────────────────────────────

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",        label: "NIRF Scores",   icon: "★" },
//   { id: "intake",        label: "Intake",         icon: "⊕" },
//   { id: "placement",     label: "Placement",      icon: "↗" },
//   { id: "phd",           label: "PhD",            icon: "⚗" },
//   { id: "students",      label: "Students",       icon: "◎" },
//   { id: "research",      label: "Research",       icon: "◈" },
//   { id: "innovation",    label: "Innovation",     icon: "⚡" },
//   { id: "financial",     label: "Financial",      icon: "₹" },
//   { id: "faculty",       label: "Faculty",        icon: "✦" },
//   { id: "publications",  label: "Publications",   icon: "📄" },
//   { id: "facilities",    label: "Facilities",     icon: "⌂" },
//   { id: "accreditation", label: "Accreditation",  icon: "✓" },
//   { id: "other",         label: "Other",          icon: "+" },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // Section → Tab mapping (covers all years 2016–2025)
// // ─────────────────────────────────────────────────────────────────────────────

// const SECTION_TAB: Record<string, TabId> = {
//   // Intake
//   "Sanctioned (Approved) Intake":                                                      "intake",
//   "University Exam Details":                                                            "intake",
//   "Student Exam Details":                                                               "intake",
//   // Placement
//   "Placement & Higher Studies":                                                         "placement",
//   "Placement and Higher Studies":                                                       "placement",
//   "Graduation Outcome":                                                                 "placement",
//   // PhD
//   "Ph.D Student Details":                                                               "phd",
//   // Students
//   "Total Actual Student Strength (Program(s) Offered by your Institution)":            "students",
//   "Student Details":                                                                    "students",
//   "Scholarships":                                                                       "students",
//   // Research
//   "Sponsored Research Details":                                                         "research",
//   "Consultancy Project Details":                                                        "research",
//   "Executive Development Programs":                                                     "research",
//   "Executive Development Program/Management Development Programs":                     "research",
//   "Education Program Details":                                                          "research",
//   "Revenue from Executive Education":                                                   "research",
//   "FDP":                                                                                "research",
//   // Innovation
//   "Innovations at various stages of Technology Readiness Level":                       "innovation",
//   "Start up recognized by DPIIT/startup India":                                        "innovation",
//   "Ventures/startups grown to turnover of 50 lacs":                                   "innovation",
//   "Startups which have got VC investment in previous 3 years":                         "innovation",
//   "Innovation grant received from govt. organization in previous 3 years":             "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR":                          "innovation",
//   "Pre-incubation:expenditure/income":                                                 "innovation",
//   "Incubation:expenditure/income":                                                     "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies":                          "innovation",
//   "FDI investment in previous 3 years":                                                "innovation",
//   "Patents":                                                                            "innovation",
//   "Patents Commercialized & Technology Transferred":                                   "innovation",
//   "Patent Details":                                                                     "innovation",
//   "IPR Summary":                                                                        "innovation",
//   // Financial
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":     "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization":                                           "financial",
//   "Facilities Summaries":                                                               "financial",
//   // Faculty
//   "Faculty Details":                                                                    "faculty",
//   // Publications
//   "Publication Details":                                                                "publications",
//   // Facilities
//   "PCS Facilities: Facilities of Physically Challenged Students":                      "facilities",
//   "Facilities for Physically Challenged":                                              "facilities",
//   "Physical Facilties":                                                                "facilities",
//   "Physical Facilities":                                                               "facilities",
//   "Sustainability Details":                                                            "facilities",
//   "Sustainable Living Practices":                                                      "facilities",
//   // Accreditation
//   "Accreditation":                                                                     "accreditation",
//   "OPD Attendance & Bed Occupancy":                                                    "accreditation",
//   // Other
//   "Perception Details":                                                                "other",
//   "Student Events":                                                                    "other",
//   "Student Entrepreneurship":                                                          "other",
//   "New Programs Developed":                                                            "other",
//   "Programs Revised":                                                                  "other",
//   "Vocational Certificate Courses":                                                    "other",
//   "Multiple Entry/Exit and Indian Knowledge System":                                   "other",
//   "Prior Learning at Different Levels":                                                "other",
//   "Curriculum Design":                                                                 "other",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Value helpers
// // ─────────────────────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);

// const isBAD = (v: string | null | undefined) =>
//   BAD.has((v ?? "").trim().toLowerCase());

// const cl = (v: string | null | undefined): string =>
//   isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }

// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }

// function fmtAmt(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// function fmtSal(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }

// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }

// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) {
//     const k = fn(x);
//     if (!m.has(k)) m.set(k, []);
//     m.get(k)!.push(x);
//   }
//   return m;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared styles
// // ─────────────────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = {
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.6rem",
//   textTransform: "uppercase",
//   letterSpacing: "0.08em",
//   color: "var(--ink-400)",
//   padding: "8px 14px",
//   textAlign: "left",
//   borderBottom: "2px solid var(--border)",
//   background: "var(--off-white)",
//   whiteSpace: "nowrap",
// };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = {
//   padding: "8px 14px",
//   color: "var(--ink-700)",
//   verticalAlign: "middle",
//   fontSize: "0.78rem",
// };
// const TDM: React.CSSProperties = {
//   ...TD,
//   color: "var(--ink-400)",
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.68rem",
// };
// const TDR: React.CSSProperties = {
//   ...TD,
//   textAlign: "right",
//   fontFamily: "var(--font-mono)",
// };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = "var(--crimson-pale)";
//     },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent";
//     },
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // UI Primitives
// // ─────────────────────────────────────────────────────────────────────────────

// function KV({
//   label, value, accent, big,
// }: {
//   label: string; value?: string | null; accent?: boolean; big?: boolean;
// }) {
//   return (
//     <div style={{
//       background: accent ? "var(--crimson-pale)" : "var(--off-white)",
//       border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
//       padding: "14px 16px",
//     }}>
//       <p style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.6rem",
//         textTransform: "uppercase",
//         letterSpacing: "0.09em",
//         color: accent ? "var(--crimson)" : "var(--ink-500)",
//         marginBottom: 5,
//       }}>
//         {label}
//       </p>
//       <p style={{
//         fontFamily: "var(--font-display)",
//         fontStyle: "italic",
//         fontSize: big ? "1.9rem" : "1.35rem",
//         color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
//         lineHeight: 1,
//       }}>
//         {value || "—"}
//       </p>
//     </div>
//   );
// }

// function Card({
//   title, children, noPad,
// }: {
//   title?: string; children: React.ReactNode; noPad?: boolean;
// }) {
//   return (
//     <div style={{
//       background: "var(--white)",
//       border: "1px solid var(--border)",
//       boxShadow: "var(--shadow-sm)",
//       marginBottom: 14,
//       overflow: "hidden",
//       padding: noPad ? 0 : "20px 24px",
//     }}>
//       {title && (
//         <h3 style={{
//           fontFamily: "var(--font-display)",
//           fontStyle: "italic",
//           fontSize: "1rem",
//           color: "var(--ink-900)",
//           margin: 0,
//           padding: noPad ? "16px 24px 14px" : "0 0 8px",
//           borderBottom: "1px solid var(--border)",
//           marginBottom: 14,
//         }}>
//           {title}
//         </h3>
//       )}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.62rem",
//       textTransform: "uppercase",
//       letterSpacing: "0.1em",
//       color: "var(--crimson)",
//       marginBottom: 10,
//       paddingBottom: 6,
//       borderBottom: "1px solid var(--border)",
//     }}>
//       {children}
//     </p>
//   );
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.75rem",
//       color: "var(--ink-300)",
//       padding: "20px 0",
//     }}>
//       {msg}
//     </p>
//   );
// }

// function ScoreBar({
//   label, score, total,
// }: {
//   label: string; score: number | null; total: number | null;
// }) {
//   const pct =
//     score != null && (total ?? 100) > 0
//       ? Math.min((score / (total ?? 100)) * 100, 100)
//       : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//           {label}
//         </span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
//           {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
//         </span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{
//           height: "100%",
//           width: `${pct}%`,
//           background: "var(--crimson)",
//           transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
//         }} />
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Year Pivot Table
// // ─────────────────────────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string;
//   subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({
//   rows, years, col1 = "Metric",
// }: {
//   rows: PivotRow[]; years: string[]; col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//                 transition: "background 0.1s",
//               }}
//               {...rh(i)}
//             >
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && (
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.65rem",
//                     color: "var(--ink-300)",
//                     marginLeft: 6,
//                   }}>
//                     {row.subLabel}
//                   </span>
//                 )}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) {
//                   if (row.isSal)      d = fmtSal(val);
//                   else if (row.isAmt) d = fmtAmt(val);
//                   else                d = fmtN(val);
//                 }
//                 return (
//                   <td
//                     key={yr}
//                     style={{
//                       ...TDR,
//                       color: hasVal
//                         ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)")
//                         : "var(--ink-100)",
//                       fontWeight: row.isBold && hasVal ? 700 : 400,
//                       background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
//                     }}
//                   >
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(
//   metrics: RawMetric[],
//   opts?: { isSal?: boolean; isAmt?: boolean },
// ): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric) || !isRealYear(m.year)) continue;
//     const yr  = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) =>
//     baseYear(a).localeCompare(baseYear(b)),
//   );
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric,
//       yearVals,
//       isSal:
//         opts?.isSal ??
//         (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt:
//         opts?.isAmt ??
//         ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) &&
//           !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// function FlatTable({
//   metrics, col1 = "Metric", col2 = "Value",
// }: {
//   metrics: RawMetric[]; col1?: string; col2?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={TH}>{col1}</th>
//             <th style={THR}>{col2}</th>
//           </tr>
//         </thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//               }}
//               {...rh(i)}
//             >
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RecordTable({
//   metrics, nameCol = "Name",
// }: {
//   metrics: RawMetric[]; nameCol?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 180 }}>{nameCol}</th>
//             <th style={TH}>Field</th>
//             <th style={THR}>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr
//                 key={`${gi}-${i}`}
//                 style={{
//                   borderBottom: "1px solid var(--border)",
//                   background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                 }}
//                 {...rh(gi + i)}
//               >
//                 {i === 0 ? (
//                   <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                     {prog}
//                   </td>
//                 ) : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             )),
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({
//   label, children, open: init = true,
// }: {
//   label: string; children: React.ReactNode; open?: boolean;
// }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button
//         onClick={() => setO(x => !x)}
//         style={{
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 16px",
//           background: "var(--off-white)",
//           border: "none",
//           cursor: "pointer",
//           fontFamily: "var(--font-body)",
//           fontWeight: 600,
//           fontSize: "0.82rem",
//           color: "var(--crimson-dark)",
//           textAlign: "left",
//           borderBottom: o ? "1px solid var(--border)" : "none",
//         }}
//       >
//         <span>{label}</span>
//         <span style={{
//           fontSize: "0.65rem",
//           color: "var(--ink-400)",
//           transform: o ? "rotate(90deg)" : "none",
//           transition: "transform 0.2s",
//         }}>
//           ▶
//         </span>
//       </button>
//       {o && (
//         <div style={{ padding: "16px 20px", background: "var(--white)" }}>
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.63rem",
//         color: "var(--ink-300)",
//         cursor: "pointer",
//         padding: "4px 0",
//       }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div
//             key={i}
//             style={{
//               padding: "4px 0",
//               borderBottom: "1px solid var(--border)",
//               fontSize: "0.73rem",
//               color: "var(--ink-500)",
//               display: "flex",
//               gap: 12,
//             }}
//           >
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.63rem",
//               color: "var(--ink-300)",
//               minWidth: 70,
//               flexShrink: 0,
//             }}>
//               {m.year}
//             </span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Scores
// // ─────────────────────────────────────────────────────────────────────────────

// function TabScores({
//   row, imgCols, scoresByYear, activeYear,
// }: {
//   row: Record<string, unknown>;
//   imgCols: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   activeYear: number;
// }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

//       {/* KV summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV
//           label="NIRF Total"
//           value={row.img_total != null ? (row.img_total as number).toFixed(2) : null}
//           accent big
//         />
//         <KV
//           label="Student Strength"
//           value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Faculty Ratio"
//           value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Perception"
//           value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null}
//         />
//       </div>

//       {/* Trend chart — one line per parameter over all ranking years */}
//       <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />

//       {/* Parameter progress bars */}
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar
//             key={k}
//             label={
//               SCORE_LABELS[k] ??
//               k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()
//             }
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null}
//           />
//         ))}
//       </Card>

//       {/* Score detail table */}
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th style={TH}>Parameter</th>
//                 <th style={THR}>Score</th>
//                 <th style={THR}>Max</th>
//                 <th style={THR}>%</th>
//               </tr>
//             </thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null;
//                 const t = row[k.replace("_score", "_total")] as number | null;
//                 const p =
//                   s != null && (t ?? 100) > 0
//                     ? ((s / (t ?? 100)) * 100).toFixed(1) + "%"
//                     : "—";
//                 return (
//                   <tr
//                     key={k}
//                     style={{
//                       borderBottom: "1px solid var(--border)",
//                       background: i % 2 ? "var(--off-white)" : "transparent",
//                     }}
//                     {...rh(i)}
//                   >
//                     <td style={TD}>
//                       {SCORE_LABELS[k] ??
//                         k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>
//                       {s?.toFixed(2) ?? "—"}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>
//                       {t?.toFixed(0) ?? "—"}
//                     </td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Intake
// // ─────────────────────────────────────────────────────────────────────────────

// function TabIntake({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const allMetrics = allSections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return (
//       <Card title={sections[0]?.section}>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }

//   const pm   = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(
//     p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"),
//   );
//   const pgP = allP.filter(
//     p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
//   );
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values())
//     for (const r of rows)
//       if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr   = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {/* Trend chart — one line per program over academic years */}
//       <IntakeTrendChart metrics={allMetrics} />

//       {grandTotal > 0 && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
//           gap: 10,
//           marginBottom: 20,
//         }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}

//       {ugP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Undergraduate Programs</SH>
//           <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Postgraduate Programs</SH>
//           <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgIP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>PG-Integrated Programs</SH>
//           <YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" />
//         </div>
//       )}
//       {otP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Other Programs</SH>
//           <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
//         </div>
//       )}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable
//             rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]}
//             years={years}
//             col1=""
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Placement
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPlacement({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const allValid = allSections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric) && isRealYear(m.year) && !isBAD(m.program));
//   const allPm = groupBy(allValid, r => cl(r.program));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed   = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary   = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
//             gap: 10,
//             marginBottom: 16,
//           }}>
//             {placed && <KV label={`Placed (${latestYr})`}     value={fmtN(placed)}   accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm    = groupBy(valid, r => cl(r.program));
//   const allP  = Array.from(pm.keys());
//   const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   function PBlock({ prog }: { prog: string }) {
//     const rows    = pm.get(prog)!;
//     const allRows = allPm.get(prog) ?? rows;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm    = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries())
//       .map(([metric, mrows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of mrows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return {
//           label: metric,
//           yearVals,
//           isSal:
//             metric.toLowerCase().includes("salary") ||
//             metric.toLowerCase().includes("median"),
//         };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));

//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

//     const latestGradYr =
//       years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ??
//       years.at(-1) ?? "";
//     const kv     = (kw: string) =>
//       pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed");
//     const salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr];
//     const higher = kv("higher stud") || kv("selected for higher");

//     return (
//       <div>
//         {/* Trend chart — placed / salary / higher studies over graduation years */}
//         <PlacementTrendChart metrics={allRows} program={prog} />

//         {(placed || salary || higher) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
//             gap: 8,
//             marginBottom: 14,
//           }}>
//             {placed && (
//               <KV
//                 label={`Placed (${latestGradYr || "Latest"})`}
//                 value={fmtN(placed)}
//                 accent
//               />
//             )}
//             {salary && <KV label="Median Salary"  value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)}   />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({
//     progs, label, open = true,
//   }: {
//     progs: string[]; label: string; open?: boolean;
//   }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup
//         label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`}
//         open={open}
//       >
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && (
//               <div style={{
//                 fontFamily: "var(--font-body)",
//                 fontWeight: 600,
//                 fontSize: "0.78rem",
//                 color: "var(--crimson-dark)",
//                 margin: i === 0 ? "0 0 10px" : "20px 0 10px",
//                 paddingBottom: 6,
//                 borderBottom: "1px dashed var(--border)",
//               }}>
//                 {p}
//               </div>
//             )}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       <RG progs={ugP}  label="Undergraduate Programs" open={true}  />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true}  />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: PhD
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPhd({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;

//   const all       = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP       = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP       = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

//   // All graduated metrics across every ranking year — for the trend chart
//   const allGraduated = allSections
//     .flatMap(s => s.metrics)
//     .filter(m =>
//       isRealYear(m.year) &&
//       !isBAD(m.value) &&
//       !m.program?.toLowerCase().includes("pursuing"),
//     );

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

//       {/* Trend chart — Full Time + Part Time graduated over all academic years */}
//       <PhdTrendChart metrics={allGraduated} />

//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 padding: "10px 16px",
//                 borderBottom: "1px solid var(--border)",
//               }}
//             >
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//                 {m.program}
//               </span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>
//                 {isBAD(m.value) ? "—" : fmtN(cl(m.value))}
//               </span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Students
// // ─────────────────────────────────────────────────────────────────────────────

// function TabStudents({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty />;

//   // All metrics across every ranking year — student strength sections only (excludes Scholarships)
//   const allMetrics = allSections
//     .filter(s => s.section.toLowerCase().includes("student strength") || s.section.toLowerCase().includes("student details"))
//     .flatMap(s => s.metrics);

//   return (
//     <div>
//       {/* Trend charts — composition and diversity across ranking years */}
//       <StudentsTrendChart metrics={allMetrics as any} />

//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         const hasYears    = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values())
//             for (const r of rows)
//               if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         const pm = groupBy(metrics, r => {
//           const p = cl(r.program);
//           return !p || p === "-" ? "All Programs" : p;
//         });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr>
//                     <th style={{ ...TH, minWidth: 180 }}>Program</th>
//                     <th style={TH}>Metric</th>
//                     <th style={THR}>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr
//                         key={`${gi}-${i}`}
//                         style={{
//                           borderBottom: "1px solid var(--border)",
//                           background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                         }}
//                         {...rh(gi + i)}
//                       >
//                         {i === 0 ? (
//                           <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                             {prog}
//                           </td>
//                         ) : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     )),
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Research
// // ─────────────────────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
//     <div>
//       {/* Trend chart per section — projects / agencies / amount over years */}
//       {sections.map(sec => (
//         <ResearchTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_sponsored_projects != null && (
//             <KV
//               label="Sponsored Projects (3yr)"
//               value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}
//               accent
//             />
//           )}
//           {row.pdf_consultancy_projects != null && (
//             <KV
//               label="Consultancy Projects (3yr)"
//               value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")}
//             />
//           )}
//           {row.pdf_edp_participants != null && (
//             <KV
//               label="EDP Participants (3yr)"
//               value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Innovation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       flexShrink: 0,
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         if (
//           sec.section.toLowerCase().includes("ipr") ||
//           sec.section.toLowerCase().includes("patent")
//         ) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length)
//               return (
//                 <Card key={sec.section} title={sec.section} noPad>
//                   <YearPivotTable rows={rows} years={years} />
//                 </Card>
//               );
//           }
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <FlatTable metrics={metrics} />
//             </Card>
//           );
//         }

//         const hasNamedProgram = metrics.some(
//           m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
//         );
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Financial
// // ─────────────────────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid    = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values())
//       for (const r of rows)
//         if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries())
//       .map(([prog, rows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of rows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return { label: prog, yearVals, isAmt: true };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) {
//       let s = 0, any = false;
//       for (const r of pivotRows) {
//         const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
//         if (!isNaN(n) && n > 0) { s += n; any = true; }
//       }
//       totalYV[yr] = any ? String(s) : "";
//     }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable
//           rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]}
//           years={years}
//           col1="Line Item"
//         />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabFinancial({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (

//     <div>
//       {/* Trend chart per section — one line per line item over years */}
//       {sections.map(sec => (
//         <FinancialTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_capital_expenditure != null && (
//             <KV
//               label="Capital Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_capital_expenditure))}
//               accent
//             />
//           )}
//           {row.pdf_operational_expenditure != null && (
//             <KV
//               label="Operational Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_operational_expenditure))}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <FinBlock key={`table-${sec.section}`} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Faculty
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(
//     m =>
//       m.metric.toLowerCase().includes("number of faculty") ||
//       m.metric.toLowerCase().includes("no of regular faculty"),
//   )?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad>
//         <FlatTable metrics={valid} />
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Publications
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs      = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   if (hasYears) {
//     const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//     return (
//       <div>
//         {Array.from(pm.entries()).map(([db, rows]) => {
//           const { rows: pivotRows, years } = buildPivotRows(rows);
//           if (!pivotRows.length) return null;
//           return (
//             <Card key={db} title={db} noPad>
//               <YearPivotTable rows={pivotRows} years={years} />
//             </Card>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div>
//       {dbs.map(db => (
//         <Card key={db} title={db} noPad>
//           <FlatTable metrics={all.filter(m => cl(m.program) === db)} />
//         </Card>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Facilities
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid   = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(
//           m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
//         );

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div
//                   key={i}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                     gap: 16,
//                     padding: "12px 0",
//                     borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                   }}
//                 >
//                   <div style={{ flex: 1 }}>
//                     <span style={{
//                       fontFamily: "var(--font-body)",
//                       fontSize: "0.78rem",
//                       color: "var(--ink-700)",
//                       lineHeight: 1.5,
//                     }}>
//                       {m.metric}
//                     </span>
//                     {hasYear && m.year && m.year !== "-" && (
//                       <span style={{
//                         fontFamily: "var(--font-mono)",
//                         fontSize: "0.62rem",
//                         color: "var(--ink-300)",
//                         marginLeft: 8,
//                       }}>
//                         ({m.year})
//                       </span>
//                     )}
//                   </div>
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.7rem",
//                     flexShrink: 0,
//                     padding: "3px 10px",
//                     color: yes ? "var(--teal)" : "var(--crimson)",
//                     background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                     border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                   }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Accreditation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Body" />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Other
// // ─────────────────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears   = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) {
//             return (
//               <Card key={sec.section} title={sec.section} noPad>
//                 <YearPivotTable rows={rows} years={years} />
//               </Card>
//             );
//           }
//         }
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main component
// // ─────────────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>
//           Loading…
//         </p>
//       </div>
//     );
//   }
//   if (!profile) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
//           Could not load data.
//         </p>
//       </div>
//     );
//   }

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear
//     ? (profile.scoresByYear[activeYear] as Record<string, unknown>)
//     : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols     = Object.keys(row ?? {}).filter(
//     k => k.startsWith("img_") && k.endsWith("_score"),
//   );

//   // secsByTab — filtered to active year (for tables)
//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear
//         ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0)
//         : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   // allSecsByTab — ALL ranking years unfiltered (for trend charts)
//   const allSecsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     if (!s.metrics.length) continue;
//     if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
//     allSecsByTab.get(tabId)!.push(s);
//   }

//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";
//   const getSecs    = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
//   const getAllSecs  = (tabId: TabId): RawSection[] => allSecsByTab.get(tabId) ?? [];
//   const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores: row ? (
//       <TabScores
//         row={row}
//         imgCols={imgCols}
//         scoresByYear={scoresByYear}
//         activeYear={activeYear!}
//       />
//     ) : (
//       <Empty />
//     ),
//     intake:        <TabIntake        sections={getSecs("intake")}        allSections={getAllSecs("intake")}        />,
//     placement:     <TabPlacement     sections={getSecs("placement")}     allSections={getAllSecs("placement")}     />,
//     phd:           <TabPhd           sections={getSecs("phd")}           allSections={getAllSecs("phd")}           />,
//     students:      <TabStudents      sections={getSecs("students")}      allSections={getAllSecs("students")}      />,
//     research:      <TabResearch      sections={getSecs("research")}      allSections={getAllSecs("research")}      row={row} />,
//     innovation:    <TabInnovation    sections={getSecs("innovation")}                                             />,
//     financial:     <TabFinancial     sections={getSecs("financial")}     allSections={getAllSecs("financial")}     row={row} />,
//     faculty:       <TabFaculty       sections={getSecs("faculty")}                                                />,
//     publications:  <TabPublications  sections={getSecs("publications")}                                          />,
//     facilities:    <TabFacilities    sections={getSecs("facilities")}                                            />,
//     accreditation: <TabAccreditation sections={getSecs("accreditation")}                                         />,
//     other:         <TabOther         sections={getSecs("other")}                                                  />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* ── Hero ── */}
//       <div style={{
//         background: "var(--white)",
//         border: "1px solid var(--border)",
//         padding: "24px 28px",
//         marginBottom: 20,
//         boxShadow: "var(--shadow-sm)",
//       }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.1em",
//               color: "var(--crimson)",
//               background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.2)",
//               padding: "2px 8px",
//               marginBottom: 10,
//               display: "inline-block",
//             }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{
//               fontFamily: "var(--font-display)",
//               fontStyle: "italic",
//               fontSize: "clamp(1.3rem,3vw,1.9rem)",
//               color: "var(--ink-900)",
//               lineHeight: 1.2,
//               marginBottom: 5,
//             }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
//               {profile.institute_code}
//             </p>
//           </div>

//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-display)",
//                 fontStyle: "italic",
//                 fontSize: "3.2rem",
//                 color: "var(--crimson)",
//                 lineHeight: 1,
//                 marginBottom: 3,
//               }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.6rem",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.1em",
//                 color: "var(--ink-300)",
//               }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>

//         {allYears.length > 0 && (
//           <div style={{
//             marginTop: 18,
//             paddingTop: 14,
//             borderTop: "1px solid var(--border)",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             flexWrap: "wrap",
//           }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.08em",
//               color: "var(--ink-300)",
//               marginRight: 4,
//             }}>
//               Ranking Year
//             </span>
//             {allYears.map(y => (
//               <button
//                 key={y}
//                 onClick={() => setActiveYear(y)}
//                 style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize: "0.72rem",
//                   padding: "3px 11px",
//                   background: activeYear === y ? "var(--crimson)" : "var(--white)",
//                   color: activeYear === y ? "var(--white)" : "var(--ink-500)",
//                   border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
//                   cursor: "pointer",
//                   transition: "all 0.15s",
//                 }}
//               >
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Tab strip ── */}
//       <div style={{
//         display: "flex",
//         borderBottom: "2px solid var(--border)",
//         marginBottom: 20,
//         overflowX: "auto",
//       }}>
//         {visibleTabs.map(tab => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             style={{
//               fontFamily: "var(--font-body)",
//               fontWeight: safeTab === tab.id ? 600 : 400,
//               fontSize: "0.78rem",
//               padding: "9px 16px",
//               background: "transparent",
//               border: "none",
//               borderBottom: safeTab === tab.id
//                 ? "2px solid var(--crimson)"
//                 : "2px solid transparent",
//               marginBottom: "-2px",
//               color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
//               cursor: "pointer",
//               whiteSpace: "nowrap",
//               transition: "all 0.15s",
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//             }}
//           >
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Tab body ── */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }

































































// "use client";
// import React, { useEffect, useState } from "react";
// import type { SearchHit } from "@/app/page";
// import type { InstituteProfileResponse } from "@/types/nirf";
// import { SCORE_LABELS } from "@/types/nirf";
// import {
//   ScoresTrendChart,
//   IntakeTrendChart,
//   PlacementTrendChart,
//   FinancialTrendChart,
//   ResearchTrendChart,
//   PhdTrendChart,
//   StudentsTrendChart,
// } from "@/app/components/NIRFCharts";

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface Props { hit: SearchHit; }

// interface RawMetric {
//   metric: string;
//   year: string;
//   value: string;
//   ranking_year: number;
//   program: string;
// }

// interface RawSection {
//   section: string;
//   metrics: RawMetric[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab definitions
// // ─────────────────────────────────────────────────────────────────────────────

// type TabId =
//   | "scores"
//   | "intake"
//   | "placement"
//   | "phd"
//   | "students"
//   | "research"
//   | "innovation"
//   | "financial"
//   | "faculty"
//   | "publications"
//   | "facilities"
//   | "accreditation"
//   | "other";

// const ALL_TABS: { id: TabId; label: string; icon: string }[] = [
//   { id: "scores",        label: "NIRF Scores",   icon: "★" },
//   { id: "intake",        label: "Intake",         icon: "⊕" },
//   { id: "placement",     label: "Placement",      icon: "↗" },
//   { id: "phd",           label: "PhD",            icon: "⚗" },
//   { id: "students",      label: "Students",       icon: "◎" },
//   { id: "research",      label: "Research",       icon: "◈" },
//   { id: "innovation",    label: "Innovation",     icon: "⚡" },
//   { id: "financial",     label: "Financial",      icon: "₹" },
//   { id: "faculty",       label: "Faculty",        icon: "✦" },
//   { id: "publications",  label: "Publications",   icon: "📄" },
//   { id: "facilities",    label: "Facilities",     icon: "⌂" },
//   { id: "accreditation", label: "Accreditation",  icon: "✓" },
//   { id: "other",         label: "Other",          icon: "+" },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // Section → Tab mapping (covers all years 2016–2025)
// // ─────────────────────────────────────────────────────────────────────────────

// const SECTION_TAB: Record<string, TabId> = {
//   // Intake
//   "Sanctioned (Approved) Intake":                                                      "intake",
//   "University Exam Details":                                                            "intake",
//   "Student Exam Details":                                                               "intake",
//   // Placement
//   "Placement & Higher Studies":                                                         "placement",
//   "Placement and Higher Studies":                                                       "placement",
//   "Graduation Outcome":                                                                 "placement",
//   // PhD
//   "Ph.D Student Details":                                                               "phd",
//   // Students
//   "Total Actual Student Strength (Program(s) Offered by your Institution)":            "students",
//   "Student Details":                                                                    "students",
//   "Scholarships":                                                                       "students",
//   // Research
//   "Sponsored Research Details":                                                         "research",
//   "Consultancy Project Details":                                                        "research",
//   "Executive Development Programs":                                                     "research",
//   "Executive Development Program/Management Development Programs":                     "research",
//   "Education Program Details":                                                          "research",
//   "Revenue from Executive Education":                                                   "research",
//   "FDP":                                                                                "research",
//   // Innovation
//   "Innovations at various stages of Technology Readiness Level":                       "innovation",
//   "Start up recognized by DPIIT/startup India":                                        "innovation",
//   "Ventures/startups grown to turnover of 50 lacs":                                   "innovation",
//   "Startups which have got VC investment in previous 3 years":                         "innovation",
//   "Innovation grant received from govt. organization in previous 3 years":             "innovation",
//   "Academic Courses in Innovation, Entrepreneurship and IPR":                          "innovation",
//   "Pre-incubation:expenditure/income":                                                 "innovation",
//   "Incubation:expenditure/income":                                                     "innovation",
//   "Alumni that are Founders of Forbes/Fortune 500 companies":                          "innovation",
//   "FDI investment in previous 3 years":                                                "innovation",
//   "Patents":                                                                            "innovation",
//   "Patents Commercialized & Technology Transferred":                                   "innovation",
//   "Patent Details":                                                                     "innovation",
//   "IPR Summary":                                                                        "innovation",
//   // Financial
//   "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":     "financial",
//   "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
//   "Financial Resources and its Utilization":                                           "financial",
//   "Facilities Summaries":                                                               "financial",
//   // Faculty
//   "Faculty Details":                                                                    "faculty",
//   // Publications
//   "Publication Details":                                                                "publications",
//   // Facilities
//   "PCS Facilities: Facilities of Physically Challenged Students":                      "facilities",
//   "Facilities for Physically Challenged":                                              "facilities",
//   "Physical Facilties":                                                                "facilities",
//   "Physical Facilities":                                                               "facilities",
//   "Sustainability Details":                                                            "facilities",
//   "Sustainable Living Practices":                                                      "facilities",
//   // Accreditation
//   "Accreditation":                                                                     "accreditation",
//   "OPD Attendance & Bed Occupancy":                                                    "accreditation",
//   // Other
//   "Perception Details":                                                                "other",
//   "Student Events":                                                                    "other",
//   "Student Entrepreneurship":                                                          "other",
//   "New Programs Developed":                                                            "other",
//   "Programs Revised":                                                                  "other",
//   "Vocational Certificate Courses":                                                    "other",
//   "Multiple Entry/Exit and Indian Knowledge System":                                   "other",
//   "Prior Learning at Different Levels":                                                "other",
//   "Curriculum Design":                                                                 "other",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Value helpers
// // ─────────────────────────────────────────────────────────────────────────────

// const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);

// const isBAD = (v: string | null | undefined) =>
//   BAD.has((v ?? "").trim().toLowerCase());

// const cl = (v: string | null | undefined): string =>
//   isBAD(v) ? "" : (v ?? "").trim();

// function isRealYear(y: string | null | undefined): boolean {
//   const v = (y ?? "").trim();
//   return !BAD.has(v.toLowerCase()) && /^\d{4}(-\d{2})?/.test(v);
// }

// function baseYear(y: string): string {
//   return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
// }

// function fmtN(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return n.toLocaleString("en-IN");
// }

// function fmtAmt(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
//   if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
//   return `₹${n.toLocaleString("en-IN")}`;
// }

// function fmtSal(v: string): string {
//   const s = cl(v);
//   if (!s) return "—";
//   const n = Number(s.replace(/,/g, ""));
//   if (isNaN(n)) return s;
//   return `₹${(n / 100_000).toFixed(1)}L`;
// }

// function fmtV(v: string, metric: string): string {
//   if (isBAD(v)) return "—";
//   const m = metric.toLowerCase();
//   if (m.includes("salary") || m.includes("median")) return fmtSal(v);
//   if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
//   return fmtN(v);
// }

// const isWords = (m: string) => m.toLowerCase().includes("in words");

// function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
//   const m = new Map<string, T[]>();
//   for (const x of arr) {
//     const k = fn(x);
//     if (!m.has(k)) m.set(k, []);
//     m.get(k)!.push(x);
//   }
//   return m;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared styles
// // ─────────────────────────────────────────────────────────────────────────────

// const TH: React.CSSProperties = {
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.6rem",
//   textTransform: "uppercase",
//   letterSpacing: "0.08em",
//   color: "var(--ink-400)",
//   padding: "8px 14px",
//   textAlign: "left",
//   borderBottom: "2px solid var(--border)",
//   background: "var(--off-white)",
//   whiteSpace: "nowrap",
// };
// const THR: React.CSSProperties = { ...TH, textAlign: "right" };
// const TD: React.CSSProperties = {
//   padding: "8px 14px",
//   color: "var(--ink-700)",
//   verticalAlign: "middle",
//   fontSize: "0.78rem",
// };
// const TDM: React.CSSProperties = {
//   ...TD,
//   color: "var(--ink-400)",
//   fontFamily: "var(--font-mono)",
//   fontSize: "0.68rem",
// };
// const TDR: React.CSSProperties = {
//   ...TD,
//   textAlign: "right",
//   fontFamily: "var(--font-mono)",
// };

// function rh(i: number) {
//   return {
//     onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = "var(--crimson-pale)";
//     },
//     onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
//       e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent";
//     },
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // UI Primitives
// // ─────────────────────────────────────────────────────────────────────────────

// function KV({
//   label, value, accent, big,
// }: {
//   label: string; value?: string | null; accent?: boolean; big?: boolean;
// }) {
//   return (
//     <div style={{
//       background: accent ? "var(--crimson-pale)" : "var(--off-white)",
//       border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
//       padding: "14px 16px",
//     }}>
//       <p style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.6rem",
//         textTransform: "uppercase",
//         letterSpacing: "0.09em",
//         color: accent ? "var(--crimson)" : "var(--ink-500)",
//         marginBottom: 5,
//       }}>
//         {label}
//       </p>
//       <p style={{
//         fontFamily: "var(--font-display)",
//         fontStyle: "italic",
//         fontSize: big ? "1.9rem" : "1.35rem",
//         color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
//         lineHeight: 1,
//       }}>
//         {value || "—"}
//       </p>
//     </div>
//   );
// }

// function Card({
//   title, children, noPad,
// }: {
//   title?: string; children: React.ReactNode; noPad?: boolean;
// }) {
//   return (
//     <div style={{
//       background: "var(--white)",
//       border: "1px solid var(--border)",
//       boxShadow: "var(--shadow-sm)",
//       marginBottom: 14,
//       overflow: "hidden",
//       padding: noPad ? 0 : "20px 24px",
//     }}>
//       {title && (
//         <h3 style={{
//           fontFamily: "var(--font-display)",
//           fontStyle: "italic",
//           fontSize: "1rem",
//           color: "var(--ink-900)",
//           margin: 0,
//           padding: noPad ? "16px 24px 14px" : "0 0 8px",
//           borderBottom: "1px solid var(--border)",
//           marginBottom: 14,
//         }}>
//           {title}
//         </h3>
//       )}
//       {children}
//     </div>
//   );
// }

// function SH({ children }: { children: React.ReactNode }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.62rem",
//       textTransform: "uppercase",
//       letterSpacing: "0.1em",
//       color: "var(--crimson)",
//       marginBottom: 10,
//       paddingBottom: 6,
//       borderBottom: "1px solid var(--border)",
//     }}>
//       {children}
//     </p>
//   );
// }

// function Empty({ msg = "No data available." }: { msg?: string }) {
//   return (
//     <p style={{
//       fontFamily: "var(--font-mono)",
//       fontSize: "0.75rem",
//       color: "var(--ink-300)",
//       padding: "20px 0",
//     }}>
//       {msg}
//     </p>
//   );
// }

// function ScoreBar({
//   label, score, total,
// }: {
//   label: string; score: number | null; total: number | null;
// }) {
//   const pct =
//     score != null && (total ?? 100) > 0
//       ? Math.min((score / (total ?? 100)) * 100, 100)
//       : 0;
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
//         <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//           {label}
//         </span>
//         <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
//           {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
//         </span>
//       </div>
//       <div style={{ height: 5, background: "var(--border)" }}>
//         <div style={{
//           height: "100%",
//           width: `${pct}%`,
//           background: "var(--crimson)",
//           transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
//         }} />
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Year Pivot Table
// // ─────────────────────────────────────────────────────────────────────────────

// interface PivotRow {
//   label: string;
//   subLabel?: string;
//   yearVals: Record<string, string>;
//   isSal?: boolean;
//   isAmt?: boolean;
//   isBold?: boolean;
// }

// function YearPivotTable({
//   rows, years, col1 = "Metric",
// }: {
//   rows: PivotRow[]; years: string[]; col1?: string;
// }) {
//   if (!rows.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
//             {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//                 transition: "background 0.1s",
//               }}
//               {...rh(i)}
//             >
//               <td style={row.isBold ? { ...TD, fontWeight: 700 } : TD}>
//                 {row.label}
//                 {row.subLabel && (
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.65rem",
//                     color: "var(--ink-300)",
//                     marginLeft: 6,
//                   }}>
//                     {row.subLabel}
//                   </span>
//                 )}
//               </td>
//               {years.map(yr => {
//                 const val = row.yearVals[yr];
//                 const hasVal = val && val !== "";
//                 let d = "—";
//                 if (hasVal) {
//                   if (row.isSal)      d = fmtSal(val);
//                   else if (row.isAmt) d = fmtAmt(val);
//                   else                d = fmtN(val);
//                 }
//                 return (
//                   <td
//                     key={yr}
//                     style={{
//                       ...TDR,
//                       color: hasVal
//                         ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)")
//                         : "var(--ink-100)",
//                       fontWeight: row.isBold && hasVal ? 700 : 400,
//                       background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
//                     }}
//                   >
//                     {d}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function buildPivotRows(
//   metrics: RawMetric[],
//   opts?: { isSal?: boolean; isAmt?: boolean },
// ): { rows: PivotRow[]; years: string[] } {
//   const yearSet = new Set<string>();
//   const metricMap = new Map<string, Record<string, string>>();
//   for (const m of metrics) {
//     if (isBAD(m.value) || isWords(m.metric) || !isRealYear(m.year)) continue;
//     const yr  = m.year.trim();
//     const key = cl(m.metric) || m.metric;
//     if (!metricMap.has(key)) metricMap.set(key, {});
//     yearSet.add(yr);
//     metricMap.get(key)![yr] = cl(m.value);
//   }
//   const years = Array.from(yearSet).sort((a, b) =>
//     baseYear(a).localeCompare(baseYear(b)),
//   );
//   const rows: PivotRow[] = Array.from(metricMap.entries())
//     .filter(([, yv]) => Object.keys(yv).length > 0)
//     .map(([metric, yearVals]) => ({
//       label: metric,
//       yearVals,
//       isSal:
//         opts?.isSal ??
//         (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
//       isAmt:
//         opts?.isAmt ??
//         ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) &&
//           !metric.toLowerCase().includes("words")),
//     }));
//   return { rows, years };
// }

// function FlatTable({
//   metrics, col1 = "Metric", col2 = "Value",
// }: {
//   metrics: RawMetric[]; col1?: string; col2?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
//   if (!valid.length) return <Empty />;
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={TH}>{col1}</th>
//             <th style={THR}>{col2}</th>
//           </tr>
//         </thead>
//         <tbody>
//           {valid.map((r, i) => (
//             <tr
//               key={i}
//               style={{
//                 borderBottom: "1px solid var(--border)",
//                 background: i % 2 ? "var(--off-white)" : "transparent",
//               }}
//               {...rh(i)}
//             >
//               <td style={TD}>{r.metric}</td>
//               <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RecordTable({
//   metrics, nameCol = "Name",
// }: {
//   metrics: RawMetric[]; nameCol?: string;
// }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const pm = groupBy(valid, r => cl(r.program) || "—");
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr>
//             <th style={{ ...TH, minWidth: 180 }}>{nameCol}</th>
//             <th style={TH}>Field</th>
//             <th style={THR}>Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//             rows.map((r, i) => (
//               <tr
//                 key={`${gi}-${i}`}
//                 style={{
//                   borderBottom: "1px solid var(--border)",
//                   background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                 }}
//                 {...rh(gi + i)}
//               >
//                 {i === 0 ? (
//                   <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                     {prog}
//                   </td>
//                 ) : null}
//                 <td style={TD}>{r.metric}</td>
//                 <td style={TDR}>{r.value}</td>
//               </tr>
//             )),
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function PGroup({
//   label, children, open: init = true,
// }: {
//   label: string; children: React.ReactNode; open?: boolean;
// }) {
//   const [o, setO] = useState(init);
//   return (
//     <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
//       <button
//         onClick={() => setO(x => !x)}
//         style={{
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 16px",
//           background: "var(--off-white)",
//           border: "none",
//           cursor: "pointer",
//           fontFamily: "var(--font-body)",
//           fontWeight: 600,
//           fontSize: "0.82rem",
//           color: "var(--crimson-dark)",
//           textAlign: "left",
//           borderBottom: o ? "1px solid var(--border)" : "none",
//         }}
//       >
//         <span>{label}</span>
//         <span style={{
//           fontSize: "0.65rem",
//           color: "var(--ink-400)",
//           transform: o ? "rotate(90deg)" : "none",
//           transition: "transform 0.2s",
//         }}>
//           ▶
//         </span>
//       </button>
//       {o && (
//         <div style={{ padding: "16px 20px", background: "var(--white)" }}>
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// function WordsDisclosure({ metrics }: { metrics: RawMetric[] }) {
//   const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
//   if (!words.length) return null;
//   return (
//     <details style={{ marginTop: 10, padding: "0 0 8px" }}>
//       <summary style={{
//         fontFamily: "var(--font-mono)",
//         fontSize: "0.63rem",
//         color: "var(--ink-300)",
//         cursor: "pointer",
//         padding: "4px 0",
//       }}>
//         Show amounts in words ({words.length})
//       </summary>
//       <div style={{ marginTop: 6 }}>
//         {words.map((m, i) => (
//           <div
//             key={i}
//             style={{
//               padding: "4px 0",
//               borderBottom: "1px solid var(--border)",
//               fontSize: "0.73rem",
//               color: "var(--ink-500)",
//               display: "flex",
//               gap: 12,
//             }}
//           >
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.63rem",
//               color: "var(--ink-300)",
//               minWidth: 70,
//               flexShrink: 0,
//             }}>
//               {m.year}
//             </span>
//             <span>{m.value}</span>
//           </div>
//         ))}
//       </div>
//     </details>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Scores
// // ─────────────────────────────────────────────────────────────────────────────

// function TabScores({
//   row, imgCols, scoresByYear, activeYear,
// }: {
//   row: Record<string, unknown>;
//   imgCols: string[];
//   scoresByYear: Record<number, Record<string, unknown>>;
//   activeYear: number;
// }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

//       {/* KV summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//         <KV
//           label="NIRF Total"
//           value={row.img_total != null ? (row.img_total as number).toFixed(2) : null}
//           accent big
//         />
//         <KV
//           label="Student Strength"
//           value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Faculty Ratio"
//           value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null}
//         />
//         <KV
//           label="Perception"
//           value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null}
//         />
//       </div>

//       {/* Trend chart — one line per parameter over all ranking years */}
//       <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />

//       {/* Parameter progress bars */}
//       <Card title="Parameter Breakdown">
//         {imgCols.map(k => (
//           <ScoreBar
//             key={k}
//             label={
//               SCORE_LABELS[k] ??
//               k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()
//             }
//             score={row[k] as number | null}
//             total={row[k.replace("_score", "_total")] as number | null}
//           />
//         ))}
//       </Card>

//       {/* Score detail table */}
//       <Card title="Score Details" noPad>
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 <th style={TH}>Parameter</th>
//                 <th style={THR}>Score</th>
//                 <th style={THR}>Max</th>
//                 <th style={THR}>%</th>
//               </tr>
//             </thead>
//             <tbody>
//               {imgCols.map((k, i) => {
//                 const s = row[k] as number | null;
//                 const t = row[k.replace("_score", "_total")] as number | null;
//                 const p =
//                   s != null && (t ?? 100) > 0
//                     ? ((s / (t ?? 100)) * 100).toFixed(1) + "%"
//                     : "—";
//                 return (
//                   <tr
//                     key={k}
//                     style={{
//                       borderBottom: "1px solid var(--border)",
//                       background: i % 2 ? "var(--off-white)" : "transparent",
//                     }}
//                     {...rh(i)}
//                   >
//                     <td style={TD}>
//                       {SCORE_LABELS[k] ??
//                         k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>
//                       {s?.toFixed(2) ?? "—"}
//                     </td>
//                     <td style={{ ...TDR, color: "var(--ink-400)" }}>
//                       {t?.toFixed(0) ?? "—"}
//                     </td>
//                     <td style={TDR}>{p}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Intake
// // ─────────────────────────────────────────────────────────────────────────────

// function TabIntake({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   if (!all.length) return <Empty />;

//   const allMetrics = allSections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     return (
//       <Card title={sections[0]?.section}>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }

//   const pm   = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//   const allP = Array.from(pm.keys());
//   const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
//   const pgIP = allP.filter(
//     p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"),
//   );
//   const pgP = allP.filter(
//     p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
//   );
//   const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   const yearSet = new Set<string>();
//   for (const rows of pm.values())
//     for (const r of rows)
//       if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//   const years = Array.from(yearSet).sort();

//   function mkRows(progs: string[]): PivotRow[] {
//     return progs.map(p => {
//       const yearVals: Record<string, string> = {};
//       for (const r of pm.get(p)!) {
//         if (!isRealYear(r.year)) continue;
//         yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//       }
//       return { label: p, yearVals };
//     });
//   }

//   const totalYV: Record<string, string> = {};
//   for (const yr of years) {
//     let sum = 0, any = false;
//     for (const rows of pm.values()) {
//       const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
//       if (!r) continue;
//       const n = Number((cl(r.value) || "").replace(/,/g, ""));
//       if (!isNaN(n) && n > 0) { sum += n; any = true; }
//     }
//     totalYV[yr] = any ? String(sum) : "";
//   }
//   const latestYr   = years.at(-1);
//   const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

//   return (
//     <div>
//       {/* Trend chart — one line per program over academic years */}
//       <IntakeTrendChart metrics={allMetrics} />

//       {grandTotal > 0 && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
//           gap: 10,
//           marginBottom: 20,
//         }}>
//           <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
//           {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
//           {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
//         </div>
//       )}

//       {ugP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Undergraduate Programs</SH>
//           <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Postgraduate Programs</SH>
//           <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
//         </div>
//       )}
//       {pgIP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>PG-Integrated Programs</SH>
//           <YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" />
//         </div>
//       )}
//       {otP.length > 0 && (
//         <div style={{ marginBottom: 20 }}>
//           <SH>Other Programs</SH>
//           <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
//         </div>
//       )}
//       {years.length > 0 && allP.length > 1 && (
//         <div style={{ borderTop: "2px solid var(--border)" }}>
//           <YearPivotTable
//             rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]}
//             years={years}
//             col1=""
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Placement
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPlacement({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
//   if (!sections.length) return <Empty />;

//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.metric) && !isWords(m.metric));
//   if (!all.length) return <Empty />;

//   const allValid = allSections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric) && isRealYear(m.year) && !isBAD(m.program));
//   const allPm = groupBy(allValid, r => cl(r.program));
//   const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (!hasPrograms) {
//     const { rows, years } = buildPivotRows(all);
//     if (!rows.length) return <Empty />;
//     const latestYr = years.at(-1) ?? "";
//     const placed   = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
//     const salary   = rows.find(r => r.isSal)?.yearVals[latestYr];
//     return (
//       <div>
//         {(placed || salary) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
//             gap: 10,
//             marginBottom: 16,
//           }}>
//             {placed && <KV label={`Placed (${latestYr})`}     value={fmtN(placed)}   accent />}
//             {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
//           </div>
//         )}
//         <Card title={sections[0]?.section} noPad>
//           <YearPivotTable rows={rows} years={years} />
//         </Card>
//       </div>
//     );
//   }

//   const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
//   const pm    = groupBy(valid, r => cl(r.program));
//   const allP  = Array.from(pm.keys());
//   const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
//   const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
//   const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
//   const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

//   // Ordered program list for the selector: UG first, then PG, then integrated, then other
//   const orderedProgs = [...ugP, ...pgP, ...pgIP, ...otP];

//   function PBlock({ prog }: { prog: string }) {
//     const rows    = pm.get(prog)!;
//     const yearSet = new Set<string>();
//     for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
//     const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
//     const mm    = groupBy(rows, r => cl(r.metric));
//     const pivotRows: PivotRow[] = Array.from(mm.entries())
//       .map(([metric, mrows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of mrows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[r.year.trim()] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return {
//           label: metric,
//           yearVals,
//           isSal:
//             metric.toLowerCase().includes("salary") ||
//             metric.toLowerCase().includes("median"),
//         };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));

//     if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

//     const latestGradYr =
//       years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ??
//       years.at(-1) ?? "";
//     const kv     = (kw: string) =>
//       pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
//     const placed = kv("students placed");
//     const salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr];
//     const higher = kv("higher stud") || kv("selected for higher");

//     return (
//       <div>
//         {(placed || salary || higher) && (
//           <div style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
//             gap: 8,
//             marginBottom: 14,
//           }}>
//             {placed && (
//               <KV
//                 label={`Placed (${latestGradYr || "Latest"})`}
//                 value={fmtN(placed)}
//                 accent
//               />
//             )}
//             {salary && <KV label="Median Salary"  value={fmtSal(salary)} />}
//             {higher && <KV label="Higher Studies" value={fmtN(higher)}   />}
//           </div>
//         )}
//         <YearPivotTable rows={pivotRows} years={years} />
//       </div>
//     );
//   }

//   function RG({
//     progs, label, open = true,
//   }: {
//     progs: string[]; label: string; open?: boolean;
//   }) {
//     if (!progs.length) return null;
//     return (
//       <PGroup
//         label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`}
//         open={open}
//       >
//         {progs.map((p, i) => (
//           <div key={p}>
//             {progs.length > 1 && (
//               <div style={{
//                 fontFamily: "var(--font-body)",
//                 fontWeight: 600,
//                 fontSize: "0.78rem",
//                 color: "var(--crimson-dark)",
//                 margin: i === 0 ? "0 0 10px" : "20px 0 10px",
//                 paddingBottom: 6,
//                 borderBottom: "1px dashed var(--border)",
//               }}>
//                 {p}
//               </div>
//             )}
//             <PBlock prog={p} />
//           </div>
//         ))}
//       </PGroup>
//     );
//   }

//   return (
//     <div>
//       {/* Single chart at top — program selector switches between UG / PG / etc. */}
//       <PlacementTrendChart allMetrics={allValid} programs={orderedProgs} />

//       {/* Detailed pivot tables per program group below */}
//       <RG progs={ugP}  label="Undergraduate Programs" open={true}  />
//       <RG progs={pgP}  label="Postgraduate Programs"  open={true}  />
//       <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
//       <RG progs={otP}  label="Other Programs"         open={false} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: PhD
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPhd({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;

//   const all       = sections.flatMap(s => s.metrics);
//   const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
//   const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
//   const ftP       = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
//   const ptP       = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
//   const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

//   // All graduated metrics across every ranking year — for the trend chart
//   const allGraduated = allSections
//     .flatMap(s => s.metrics)
//     .filter(m =>
//       isRealYear(m.year) &&
//       !isBAD(m.value) &&
//       !m.program?.toLowerCase().includes("pursuing"),
//     );

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

//       {/* Trend chart — Full Time + Part Time graduated over all academic years */}
//       <PhdTrendChart metrics={allGraduated} />

//       {(ftP || ptP) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
//           {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
//           {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
//         </div>
//       )}
//       {pursuing.length > 0 && (
//         <Card title="Currently Enrolled" noPad>
//           {pursuing.map((m, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 padding: "10px 16px",
//                 borderBottom: "1px solid var(--border)",
//               }}
//             >
//               <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
//                 {m.program}
//               </span>
//               <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>
//                 {isBAD(m.value) ? "—" : fmtN(cl(m.value))}
//               </span>
//             </div>
//           ))}
//         </Card>
//       )}
//       {gradRows.length > 0 && gradYears.length > 0 && (
//         <Card title="Graduated — by Academic Year" noPad>
//           <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
//         </Card>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Students
// // ─────────────────────────────────────────────────────────────────────────────

// function TabStudents({
//   sections, allSections,
// }: {
//   sections: RawSection[];
//   allSections: RawSection[];
// }) {
//   if (!sections.length) return <Empty />;

//   // All metrics across every ranking year — student strength sections only (excludes Scholarships)
//   const allMetrics = allSections
//     .filter(s => s.section.toLowerCase().includes("student strength") || s.section.toLowerCase().includes("student details"))
//     .flatMap(s => s.metrics);

//   return (
//     <div>
//       {/* Trend charts — composition and diversity across ranking years */}
//       <StudentsTrendChart metrics={allMetrics as any} />

//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("scholarship")) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (!rows.length) return null;
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <YearPivotTable rows={rows} years={years} />
//             </Card>
//           );
//         }

//         const hasYears    = metrics.some(m => isRealYear(m.year));
//         const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears && hasPrograms) {
//           const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
//           const yearSet = new Set<string>();
//           for (const rows of pm.values())
//             for (const r of rows)
//               if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//           const years = Array.from(yearSet).sort();
//           return (
//             <div key={sec.section}>
//               {Array.from(pm.entries()).map(([prog, rows]) => {
//                 const { rows: pivotRows } = buildPivotRows(rows);
//                 if (!pivotRows.length) return null;
//                 return (
//                   <Card key={prog} title={prog} noPad>
//                     <YearPivotTable rows={pivotRows} years={years} />
//                   </Card>
//                 );
//               })}
//             </div>
//           );
//         }

//         const pm = groupBy(metrics, r => {
//           const p = cl(r.program);
//           return !p || p === "-" ? "All Programs" : p;
//         });
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr>
//                     <th style={{ ...TH, minWidth: 180 }}>Program</th>
//                     <th style={TH}>Metric</th>
//                     <th style={THR}>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
//                     rows.map((r, i) => (
//                       <tr
//                         key={`${gi}-${i}`}
//                         style={{
//                           borderBottom: "1px solid var(--border)",
//                           background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
//                         }}
//                         {...rh(gi + i)}
//                       >
//                         {i === 0 ? (
//                           <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
//                             {prog}
//                           </td>
//                         ) : null}
//                         <td style={TD}>{r.metric}</td>
//                         <td style={TDR}>{fmtV(r.value, r.metric)}</td>
//                       </tr>
//                     )),
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Research
// // ─────────────────────────────────────────────────────────────────────────────

// function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
//   if (!valid.length) return null;

//   if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
//     return (
//       <Card title={title} noPad>
//         <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
//       </Card>
//     );
//   }

//   const hasYears = valid.some(m => isRealYear(m.year));
//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabResearch({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
//     <div>
//       {/* Trend chart per section — projects / agencies / amount over years */}
//       {sections.map(sec => (
//         <ResearchTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_sponsored_projects != null && (
//             <KV
//               label="Sponsored Projects (3yr)"
//               value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}
//               accent
//             />
//           )}
//           {row.pdf_consultancy_projects != null && (
//             <KV
//               label="Consultancy Projects (3yr)"
//               value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")}
//             />
//           )}
//           {row.pdf_edp_participants != null && (
//             <KV
//               label="EDP Participants (3yr)"
//               value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <ResBlock key={sec.section} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Innovation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabInnovation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics = sec.metrics.filter(m => !isBAD(m.value));
//         if (!metrics.length) return null;

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       flexShrink: 0,
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         if (
//           sec.section.toLowerCase().includes("ipr") ||
//           sec.section.toLowerCase().includes("patent")
//         ) {
//           const hasYears = metrics.some(m => isRealYear(m.year));
//           if (hasYears) {
//             const { rows, years } = buildPivotRows(metrics);
//             if (rows.length)
//               return (
//                 <Card key={sec.section} title={sec.section} noPad>
//                   <YearPivotTable rows={rows} years={years} />
//                 </Card>
//               );
//           }
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <FlatTable metrics={metrics} />
//             </Card>
//           );
//         }

//         const hasNamedProgram = metrics.some(
//           m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
//         );
//         if (hasNamedProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Name / Year" />
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Financial
// // ─────────────────────────────────────────────────────────────────────────────

// function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
//   const valid    = metrics.filter(m => !isWords(m.metric));
//   if (!valid.length) return null;
//   const hasYears = valid.some(m => isRealYear(m.year));
//   const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//   if (hasYears && hasProg) {
//     const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
//     const yearSet = new Set<string>();
//     for (const rows of pm.values())
//       for (const r of rows)
//         if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
//     const years = Array.from(yearSet).sort();
//     if (!years.length) return null;
//     const pivotRows: PivotRow[] = Array.from(pm.entries())
//       .map(([prog, rows]) => {
//         const yearVals: Record<string, string> = {};
//         for (const r of rows) {
//           if (!isRealYear(r.year)) continue;
//           yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
//         }
//         return { label: prog, yearVals, isAmt: true };
//       })
//       .filter(r => Object.values(r.yearVals).some(v => v !== ""));
//     const totalYV: Record<string, string> = {};
//     for (const yr of years) {
//       let s = 0, any = false;
//       for (const r of pivotRows) {
//         const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
//         if (!isNaN(n) && n > 0) { s += n; any = true; }
//       }
//       totalYV[yr] = any ? String(s) : "";
//     }
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable
//           rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]}
//           years={years}
//           col1="Line Item"
//         />
//         <div style={{ padding: "0 16px 4px" }}>
//           <WordsDisclosure metrics={metrics} />
//         </div>
//       </Card>
//     );
//   }

//   if (hasYears) {
//     const { rows, years } = buildPivotRows(valid);
//     if (!rows.length) return null;
//     return (
//       <Card title={title} noPad>
//         <YearPivotTable rows={rows} years={years} />
//       </Card>
//     );
//   }
//   return (
//     <Card title={title} noPad>
//       <FlatTable metrics={valid} />
//     </Card>
//   );
// }

// function TabFinancial({
//   sections, allSections, row,
// }: {
//   sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
// }) {
//   if (!sections.length) return <Empty />;
//   const allSecMap = new Map(allSections.map(s => [s.section, s]));
//   return (
  
//     <div>
//       {/* Trend chart per section — one line per line item over years */}
//       {sections.map(sec => (
//         <FinancialTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
//       ))}

//       {row && (
//         <div style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
//           gap: 10,
//           marginBottom: 16,
//         }}>
//           {row.pdf_capital_expenditure != null && (
//             <KV
//               label="Capital Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_capital_expenditure))}
//               accent
//             />
//           )}
//           {row.pdf_operational_expenditure != null && (
//             <KV
//               label="Operational Expenditure (3yr Sum)"
//               value={fmtAmt(String(row.pdf_operational_expenditure))}
//             />
//           )}
//         </div>
//       )}
//       {sections.map(sec => (
//         <FinBlock key={`table-${sec.section}`} metrics={sec.metrics} title={sec.section} />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Faculty
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFaculty({ sections }: { sections: RawSection[] }) {
//   const valid = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!valid.length) return <Empty />;
//   const count = valid.find(
//     m =>
//       m.metric.toLowerCase().includes("number of faculty") ||
//       m.metric.toLowerCase().includes("no of regular faculty"),
//   )?.value;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       {count && !isBAD(count) && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//           <KV label="Faculty Members" value={fmtN(cl(count))} accent />
//         </div>
//       )}
//       <Card title="Faculty Details" noPad>
//         <FlatTable metrics={valid} />
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Publications
// // ─────────────────────────────────────────────────────────────────────────────

// function TabPublications({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   const all = sections
//     .flatMap(s => s.metrics)
//     .filter(m => !isBAD(m.value) && !isBAD(m.metric));
//   if (!all.length) return <Empty />;

//   const hasYears = all.some(m => isRealYear(m.year));
//   const dbs      = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

//   if (hasYears) {
//     const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
//     return (
//       <div>
//         {Array.from(pm.entries()).map(([db, rows]) => {
//           const { rows: pivotRows, years } = buildPivotRows(rows);
//           if (!pivotRows.length) return null;
//           return (
//             <Card key={db} title={db} noPad>
//               <YearPivotTable rows={pivotRows} years={years} />
//             </Card>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div>
//       {dbs.map(db => (
//         <Card key={db} title={db} noPad>
//           <FlatTable metrics={all.filter(m => cl(m.program) === db)} />
//         </Card>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Facilities
// // ─────────────────────────────────────────────────────────────────────────────

// function TabFacilities({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const valid   = sec.metrics.filter(m => !isBAD(m.metric));
//         if (!valid.length) return null;
//         const hasYear = valid.some(
//           m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
//         );

//         if (sec.section.toLowerCase().includes("sustainab")) {
//           return (
//             <Card key={sec.section} title={sec.section}>
//               {valid.filter(m => !isBAD(m.value)).map((m, i) => {
//                 const yes = m.value.toLowerCase().startsWith("yes");
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "flex-start",
//                       gap: 16,
//                       padding: "10px 0",
//                       borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                     }}
//                   >
//                     <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
//                       {m.metric}
//                     </span>
//                     <span style={{
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.7rem",
//                       padding: "3px 10px",
//                       color: yes ? "var(--teal)" : "var(--crimson)",
//                       background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                       border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                     }}>
//                       {m.value}
//                     </span>
//                   </div>
//                 );
//               })}
//             </Card>
//           );
//         }

//         return (
//           <Card key={sec.section} title={sec.section}>
//             {valid.map((m, i) => {
//               const yes = m.value.toLowerCase().startsWith("yes");
//               return (
//                 <div
//                   key={i}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                     gap: 16,
//                     padding: "12px 0",
//                     borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
//                   }}
//                 >
//                   <div style={{ flex: 1 }}>
//                     <span style={{
//                       fontFamily: "var(--font-body)",
//                       fontSize: "0.78rem",
//                       color: "var(--ink-700)",
//                       lineHeight: 1.5,
//                     }}>
//                       {m.metric}
//                     </span>
//                     {hasYear && m.year && m.year !== "-" && (
//                       <span style={{
//                         fontFamily: "var(--font-mono)",
//                         fontSize: "0.62rem",
//                         color: "var(--ink-300)",
//                         marginLeft: 8,
//                       }}>
//                         ({m.year})
//                       </span>
//                     )}
//                   </div>
//                   <span style={{
//                     fontFamily: "var(--font-mono)",
//                     fontSize: "0.7rem",
//                     flexShrink: 0,
//                     padding: "3px 10px",
//                     color: yes ? "var(--teal)" : "var(--crimson)",
//                     background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
//                     border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
//                   }}>
//                     {m.value}
//                   </span>
//                 </div>
//               );
//             })}
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Accreditation
// // ─────────────────────────────────────────────────────────────────────────────

// function TabAccreditation({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} nameCol="Body" />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab: Other
// // ─────────────────────────────────────────────────────────────────────────────

// function TabOther({ sections }: { sections: RawSection[] }) {
//   if (!sections.length) return <Empty />;
//   return (
//     <div>
//       {sections.map(sec => {
//         const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
//         if (!metrics.length) return null;
//         const hasYears   = metrics.some(m => isRealYear(m.year));
//         const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

//         if (hasYears) {
//           const { rows, years } = buildPivotRows(metrics);
//           if (rows.length) {
//             return (
//               <Card key={sec.section} title={sec.section} noPad>
//                 <YearPivotTable rows={rows} years={years} />
//               </Card>
//             );
//           }
//         }
//         if (hasProgram) {
//           return (
//             <Card key={sec.section} title={sec.section} noPad>
//               <RecordTable metrics={metrics} />
//             </Card>
//           );
//         }
//         return (
//           <Card key={sec.section} title={sec.section} noPad>
//             <FlatTable metrics={metrics} />
//           </Card>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main component
// // ─────────────────────────────────────────────────────────────────────────────

// export default function InstituteDetail({ hit }: Props) {
//   const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [activeTab,  setActiveTab]  = useState<TabId>("scores");
//   const [activeYear, setActiveYear] = useState<number | null>(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
//       .then(r => r.json())
//       .then((d: InstituteProfileResponse) => {
//         setProfile(d);
//         const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
//         setActiveYear(yrs[0] ?? null);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [hit.institute_code]);

//   if (loading) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>
//           Loading…
//         </p>
//       </div>
//     );
//   }
//   if (!profile) {
//     return (
//       <div style={{ padding: "80px 32px", textAlign: "center" }}>
//         <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
//           Could not load data.
//         </p>
//       </div>
//     );
//   }

//   const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
//   const row         = activeYear
//     ? (profile.scoresByYear[activeYear] as Record<string, unknown>)
//     : null;
//   const rawSections = profile.rawSections as RawSection[];
//   const imgCols     = Object.keys(row ?? {}).filter(
//     k => k.startsWith("img_") && k.endsWith("_score"),
//   );

//   // secsByTab — filtered to active year (for tables)
//   const secsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     const filtered: RawSection = {
//       ...s,
//       metrics: activeYear
//         ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0)
//         : s.metrics,
//     };
//     if (!filtered.metrics.length) continue;
//     if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
//     secsByTab.get(tabId)!.push(filtered);
//   }

//   // allSecsByTab — ALL ranking years unfiltered (for trend charts)
//   const allSecsByTab = new Map<TabId, RawSection[]>();
//   for (const s of rawSections) {
//     const tabId = SECTION_TAB[s.section];
//     if (!tabId) continue;
//     if (!s.metrics.length) continue;
//     if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
//     allSecsByTab.get(tabId)!.push(s);
//   }

//   const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
//   const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";
//   const getSecs    = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
//   const getAllSecs  = (tabId: TabId): RawSection[] => allSecsByTab.get(tabId) ?? [];
//   const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

//   const tabContent: Record<TabId, React.ReactNode> = {
//     scores: row ? (
//       <TabScores
//         row={row}
//         imgCols={imgCols}
//         scoresByYear={scoresByYear}
//         activeYear={activeYear!}
//       />
//     ) : (
//       <Empty />
//     ),
//     intake:        <TabIntake        sections={getSecs("intake")}        allSections={getAllSecs("intake")}        />,
//     placement:     <TabPlacement     sections={getSecs("placement")}     allSections={getAllSecs("placement")}     />,
//     phd:           <TabPhd           sections={getSecs("phd")}           allSections={getAllSecs("phd")}           />,
//     students:      <TabStudents      sections={getSecs("students")}      allSections={getAllSecs("students")}      />,
//     research:      <TabResearch      sections={getSecs("research")}      allSections={getAllSecs("research")}      row={row} />,
//     innovation:    <TabInnovation    sections={getSecs("innovation")}                                             />,
//     financial:     <TabFinancial     sections={getSecs("financial")}     allSections={getAllSecs("financial")}     row={row} />,
//     faculty:       <TabFaculty       sections={getSecs("faculty")}                                                />,
//     publications:  <TabPublications  sections={getSecs("publications")}                                          />,
//     facilities:    <TabFacilities    sections={getSecs("facilities")}                                            />,
//     accreditation: <TabAccreditation sections={getSecs("accreditation")}                                         />,
//     other:         <TabOther         sections={getSecs("other")}                                                  />,
//   };

//   return (
//     <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

//       {/* ── Hero ── */}
//       <div style={{
//         background: "var(--white)",
//         border: "1px solid var(--border)",
//         padding: "24px 28px",
//         marginBottom: 20,
//         boxShadow: "var(--shadow-sm)",
//       }}>
//         <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
//           <div style={{ flex: 1, minWidth: 200 }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.1em",
//               color: "var(--crimson)",
//               background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.2)",
//               padding: "2px 8px",
//               marginBottom: 10,
//               display: "inline-block",
//             }}>
//               {profile.categories.join(" · ")}
//             </span>
//             <h1 style={{
//               fontFamily: "var(--font-display)",
//               fontStyle: "italic",
//               fontSize: "clamp(1.3rem,3vw,1.9rem)",
//               color: "var(--ink-900)",
//               lineHeight: 1.2,
//               marginBottom: 5,
//             }}>
//               {profile.institute_name}
//             </h1>
//             <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
//               {profile.institute_code}
//             </p>
//           </div>

//           {row?.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-display)",
//                 fontStyle: "italic",
//                 fontSize: "3.2rem",
//                 color: "var(--crimson)",
//                 lineHeight: 1,
//                 marginBottom: 3,
//               }}>
//                 {(row.img_total as number).toFixed(2)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.6rem",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.1em",
//                 color: "var(--ink-300)",
//               }}>
//                 NIRF Total Score
//               </p>
//             </div>
//           )}
//         </div>

//         {allYears.length > 0 && (
//           <div style={{
//             marginTop: 18,
//             paddingTop: 14,
//             borderTop: "1px solid var(--border)",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             flexWrap: "wrap",
//           }}>
//             <span style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.62rem",
//               textTransform: "uppercase",
//               letterSpacing: "0.08em",
//               color: "var(--ink-300)",
//               marginRight: 4,
//             }}>
//               Ranking Year
//             </span>
//             {allYears.map(y => (
//               <button
//                 key={y}
//                 onClick={() => setActiveYear(y)}
//                 style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize: "0.72rem",
//                   padding: "3px 11px",
//                   background: activeYear === y ? "var(--crimson)" : "var(--white)",
//                   color: activeYear === y ? "var(--white)" : "var(--ink-500)",
//                   border: `1px solid ${activeYear === y ? "var(--crimson)" : "var(--border)"}`,
//                   cursor: "pointer",
//                   transition: "all 0.15s",
//                 }}
//               >
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Tab strip ── */}
//       <div style={{
//         display: "flex",
//         borderBottom: "2px solid var(--border)",
//         marginBottom: 20,
//         overflowX: "auto",
//       }}>
//         {visibleTabs.map(tab => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             style={{
//               fontFamily: "var(--font-body)",
//               fontWeight: safeTab === tab.id ? 600 : 400,
//               fontSize: "0.78rem",
//               padding: "9px 16px",
//               background: "transparent",
//               border: "none",
//               borderBottom: safeTab === tab.id
//                 ? "2px solid var(--crimson)"
//                 : "2px solid transparent",
//               marginBottom: "-2px",
//               color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
//               cursor: "pointer",
//               whiteSpace: "nowrap",
//               transition: "all 0.15s",
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//             }}
//           >
//             <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tab.icon}</span>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* ── Tab body ── */}
//       <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
//         {tabContent[safeTab]}
//       </div>
//     </div>
//   );
// }























































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

interface Props { hit: SearchHit; }

interface RawMetric {
  metric: string;
  year: string;
  value: string;
  ranking_year: number;
  program: string;
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
  { id: "scores",        label: "NIRF Scores",   icon: "★" },
  { id: "intake",        label: "Intake",         icon: "⊕" },
  { id: "placement",     label: "Placement",      icon: "↗" },
  { id: "phd",           label: "PhD",            icon: "⚗" },
  { id: "students",      label: "Students",       icon: "◎" },
  { id: "research",      label: "Research",       icon: "◈" },
  { id: "innovation",    label: "Innovation",     icon: "⚡" },
  { id: "financial",     label: "Financial",      icon: "₹" },
  { id: "faculty",       label: "Faculty",        icon: "✦" },
  { id: "publications",  label: "Publications",   icon: "📄" },
  { id: "facilities",    label: "Facilities",     icon: "⌂" },
  { id: "accreditation", label: "Accreditation",  icon: "✓" },
  { id: "other",         label: "Other",          icon: "+" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section → Tab mapping (covers all years 2016–2025)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TAB: Record<string, TabId> = {
  // Intake — 2016/17/18 variants
  "Sanctioned (Approved) Intake":                                                      "intake",
  "University Exam Details":                                                            "intake",
  "Student Exam Details":                                                               "intake",
  "Exam Details":                                                                       "intake",
  // Students — 2016/17/18 Scholarships
  "Scholarships":                                                                       "students",
  "Scholarship Details":                                                                "students",
  "Placement & Higher Studies":                                                         "placement",
  "Placement and Higher Studies":                                                       "placement",
  "Graduation Outcome":                                                                 "placement",
  // PhD
  "Ph.D Student Details":                                                               "phd",
  // Students
  "Total Actual Student Strength (Program(s) Offered by your Institution)":            "students",
  "Student Details":                                                                    "students",
  // Research
  "Sponsored Research Details":                                                         "research",
  "Consultancy Project Details":                                                        "research",
  "Executive Development Programs":                                                     "research",
  "Executive Development Program/Management Development Programs":                     "research",
  "Education Program Details":                                                          "research",
  "Revenue from Executive Education":                                                   "research",
  "FDP":                                                                                "research",
  // Innovation
  "Innovations at various stages of Technology Readiness Level":                       "innovation",
  "Start up recognized by DPIIT/startup India":                                        "innovation",
  "Ventures/startups grown to turnover of 50 lacs":                                   "innovation",
  "Startups which have got VC investment in previous 3 years":                         "innovation",
  "Innovation grant received from govt. organization in previous 3 years":             "innovation",
  "Academic Courses in Innovation, Entrepreneurship and IPR":                          "innovation",
  "Pre-incubation:expenditure/income":                                                 "innovation",
  "Incubation:expenditure/income":                                                     "innovation",
  "Alumni that are Founders of Forbes/Fortune 500 companies":                          "innovation",
  "FDI investment in previous 3 years":                                                "innovation",
  "Patents":                                                                            "innovation",
  "Patents Commercialized & Technology Transferred":                                   "innovation",
  "Patent Details":                                                                     "innovation",
  "IPR Summary":                                                                        "innovation",
  // Financial
  "Financial Resources: Utilised Amount for the Capital expenditure for previous 3 years":     "financial",
  "Financial Resources: Utilised Amount for the Operational expenditure for previous 3 years": "financial",
  "Financial Resources and its Utilization":                                           "financial",
  "Facilities Summaries":                                                               "financial",
  // Faculty
  "Faculty Details":                                                                    "faculty",
  // Publications
  "Publication Details":                                                                "publications",
  // Facilities
  "PCS Facilities: Facilities of Physically Challenged Students":                      "facilities",
  "Facilities for Physically Challenged":                                              "facilities",
  "Physical Facilties":                                                                "facilities",
  "Physical Facilities":                                                               "facilities",
  "Sustainability Details":                                                            "facilities",
  "Sustainable Living Practices":                                                      "facilities",
  // Accreditation
  "Accreditation":                                                                     "accreditation",
  "OPD Attendance & Bed Occupancy":                                                    "accreditation",
  // Other
  "Perception Details":                                                                "other",
  "Student Events":                                                                    "other",
  "Student Entrepreneurship":                                                          "other",
  "New Programs Developed":                                                            "other",
  "Programs Revised":                                                                  "other",
  "Vocational Certificate Courses":                                                    "other",
  "Multiple Entry/Exit and Indian Knowledge System":                                   "other",
  "Prior Learning at Different Levels":                                                "other",
  "Curriculum Design":                                                                 "other",
};

// ─────────────────────────────────────────────────────────────────────────────
// Value helpers
// ─────────────────────────────────────────────────────────────────────────────

const BAD = new Set(["", "nan", "<na>", "-", "n/a", "na", "null", "undefined", "none"]);

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
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
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
  if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtAmt(v);
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
      e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent";
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

function KV({
  label, value, accent, big,
}: {
  label: string; value?: string | null; accent?: boolean; big?: boolean;
}) {
  return (
    <div style={{
      background: accent ? "var(--crimson-pale)" : "var(--off-white)",
      border: `1px solid ${accent ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
      padding: "14px 16px",
    }}>
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: accent ? "var(--crimson)" : "var(--ink-500)",
        marginBottom: 5,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: big ? "1.9rem" : "1.35rem",
        color: accent ? "var(--crimson-dark)" : "var(--ink-900)",
        lineHeight: 1,
      }}>
        {value || "—"}
      </p>
    </div>
  );
}

function Card({
  title, children, noPad, style: extraStyle,
}: {
  title?: string; children: React.ReactNode; noPad?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      marginBottom: 14,
      overflow: "hidden",
      padding: noPad ? 0 : "20px 24px",
      ...extraStyle,
    }}>
      {title && (
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "1rem",
          color: "var(--ink-900)",
          margin: 0,
          padding: noPad ? "16px 24px 14px" : "0 0 8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 14,
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.62rem",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "var(--crimson)",
      marginBottom: 10,
      paddingBottom: 6,
      borderBottom: "1px solid var(--border)",
    }}>
      {children}
    </p>
  );
}

function Empty({ msg = "No data available." }: { msg?: string }) {
  return (
    <p style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.75rem",
      color: "var(--ink-300)",
      padding: "20px 0",
    }}>
      {msg}
    </p>
  );
}

function ScoreBar({
  label, score, total,
}: {
  label: string; score: number | null; total: number | null;
}) {
  const pct =
    score != null && (total ?? 100) > 0
      ? Math.min((score / (total ?? 100)) * 100, 100)
      : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-400)" }}>
          {score?.toFixed(2) ?? "—"} / {total?.toFixed(0) ?? "—"}
        </span>
      </div>
      <div style={{ height: 5, background: "var(--border)" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "var(--crimson)",
          transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
        }} />
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
  rows, years, col1 = "Metric",
}: {
  rows: PivotRow[]; years: string[]; col1?: string;
}) {
  if (!rows.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH, minWidth: 200 }}>{col1}</th>
            {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
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
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    color: "var(--ink-300)",
                    marginLeft: 6,
                  }}>
                    {row.subLabel}
                  </span>
                )}
              </td>
              {years.map(yr => {
                const val = row.yearVals[yr];
                const hasVal = val && val !== "";
                let d = "—";
                if (hasVal) {
                  if (row.isSal)      d = fmtSal(val);
                  else if (row.isAmt) d = fmtAmt(val);
                  else                d = fmtN(val);
                }
                return (
                  <td
                    key={yr}
                    style={{
                      ...TDR,
                      color: hasVal
                        ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)")
                        : "var(--ink-100)",
                      fontWeight: row.isBold && hasVal ? 700 : 400,
                      background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
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
    const yr  = m.year.trim();
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
        (metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median")),
      isAmt:
        opts?.isAmt ??
        ((metric.toLowerCase().includes("amount") || metric.toLowerCase().includes("expenditure")) &&
          !metric.toLowerCase().includes("words")),
    }));
  return { rows, years };
}

function FlatTable({
  metrics, col1 = "Metric", col2 = "Value",
}: {
  metrics: RawMetric[]; col1?: string; col2?: string;
}) {
  const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric) && !isWords(m.metric));
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
  metrics, nameCol = "Name",
}: {
  metrics: RawMetric[]; nameCol?: string;
}) {
  const valid = metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
  if (!valid.length) return <Empty />;
  const pm = groupBy(valid, r => cl(r.program) || "—");
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
                  <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
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
  label, children, open: init = true,
}: {
  label: string; children: React.ReactNode; open?: boolean;
}) {
  const [o, setO] = useState(init);
  return (
    <div style={{ marginBottom: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
      <button
        onClick={() => setO(x => !x)}
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
        <span style={{
          fontSize: "0.65rem",
          color: "var(--ink-400)",
          transform: o ? "rotate(90deg)" : "none",
          transition: "transform 0.2s",
        }}>
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
  const words = metrics.filter(m => isWords(m.metric) && !isBAD(m.value));
  if (!words.length) return null;
  return (
    <details style={{ marginTop: 10, padding: "0 0 8px" }}>
      <summary style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.63rem",
        color: "var(--ink-300)",
        cursor: "pointer",
        padding: "4px 0",
      }}>
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
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.63rem",
              color: "var(--ink-300)",
              minWidth: 70,
              flexShrink: 0,
            }}>
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
  row, imgCols, scoresByYear, activeYear,
}: {
  row: Record<string, unknown>;
  imgCols: string[];
  scoresByYear: Record<number, Record<string, unknown>>;
  activeYear: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* KV summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
        <KV
          label="NIRF Total"
          value={row.img_total != null ? (row.img_total as number).toFixed(2) : null}
          accent big
        />
        <KV
          label="Student Strength"
          value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null}
        />
        <KV
          label="Faculty Ratio"
          value={row.img_fsr_score != null ? (row.img_fsr_score as number).toFixed(2) : null}
        />
        <KV
          label="Perception"
          value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null}
        />
      </div>

      {/* Trend chart — one line per parameter over all ranking years */}
      <ScoresTrendChart scoresByYear={scoresByYear} imgCols={imgCols} />

      {/* Parameter progress bars */}
      <Card title="Parameter Breakdown">
        {imgCols.map(k => (
          <ScoreBar
            key={k}
            label={
              SCORE_LABELS[k] ??
              k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()
            }
            score={row[k] as number | null}
            total={row[k.replace("_score", "_total")] as number | null}
          />
        ))}
      </Card>

      {/* Score detail table */}
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
                        k.replace("img_", "").replace("_score", "").replace(/_/g, " ").toUpperCase()}
                    </td>
                    <td style={{ ...TDR, color: "var(--crimson)", fontWeight: 600 }}>
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

function TabIntake({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
  if (!sections.length) return <Empty />;

  const allMetrics = allSections.flatMap(s => s.metrics).filter(m => isRealYear(m.year));

  // Separate "Sanctioned Intake" section(s) from other sections (University Exam Details, etc.)
  const intakeSecs = sections.filter(s =>
    s.section.toLowerCase().includes("sanctioned") ||
    s.section.toLowerCase().includes("approved intake")
  );
  const otherSecs = sections.filter(s => !intakeSecs.includes(s));

  const all = intakeSecs.flatMap(s => s.metrics).filter(m => isRealYear(m.year));
  const hasIntake = all.length > 0;
  const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

  // If there's no sanctioned intake at all, fall through to render all sections generically
  if (!hasIntake && !otherSecs.length) return <Empty />;

  // Build intake pivot
  const pm   = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
  const allP = Array.from(pm.keys());
  const ugP  = allP.filter(p => p.toUpperCase().startsWith("UG"));
  const pgIP = allP.filter(
    p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"),
  );
  const pgP = allP.filter(
    p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p),
  );
  const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

  const yearSet = new Set<string>();
  for (const rows of pm.values())
    for (const r of rows)
      if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
  const years = Array.from(yearSet).sort();

  function mkRows(progs: string[]): PivotRow[] {
    return progs.map(p => {
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
    let sum = 0, any = false;
    for (const rows of pm.values()) {
      const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
      if (!r) continue;
      const n = Number((cl(r.value) || "").replace(/,/g, ""));
      if (!isNaN(n) && n > 0) { sum += n; any = true; }
    }
    totalYV[yr] = any ? String(sum) : "";
  }
  const latestYr   = years.at(-1);
  const grandTotal = latestYr && totalYV[latestYr] ? Number(totalYV[latestYr]) : 0;

  return (
    <div>
      {/* Trend chart */}
      <IntakeTrendChart metrics={allMetrics} />

      {/* ── Sanctioned Intake pivot ── */}
      {hasIntake && (
        <>
          {grandTotal > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
              gap: 10,
              marginBottom: 20,
            }}>
              <KV label={`Total Intake (${latestYr})`} value={fmtN(String(grandTotal))} accent />
              {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
              {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
            </div>
          )}

          {hasPrograms ? (
            <>
              {ugP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Undergraduate Programs</SH>
                  <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
                </div>
              )}
              {pgP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Postgraduate Programs</SH>
                  <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
                </div>
              )}
              {pgIP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>PG-Integrated Programs</SH>
                  <YearPivotTable rows={mkRows(pgIP)} years={years} col1="Program" />
                </div>
              )}
              {otP.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SH>Other Programs</SH>
                  <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
                </div>
              )}
              {years.length > 0 && allP.length > 1 && (
                <div style={{ borderTop: "2px solid var(--border)" }}>
                  <YearPivotTable
                    rows={[{ label: "Grand Total", yearVals: totalYV, isBold: true }]}
                    years={years}
                    col1=""
                  />
                </div>
              )}
            </>
          ) : (
            /* No programs — show flat metric pivot (University year format) */
            (() => {
              const { rows: flatRows, years: flatYears } = buildPivotRows(all);
              return <YearPivotTable rows={flatRows} years={flatYears} />;
            })()
          )}
        </>
      )}

      {/* ── Other intake-tab sections (University Exam Details, Student Exam Details, etc.) ── */}
      {/* Trend chart — uses ALL intake allSections; chart filters internally by metric matching */}
      {allSections.length > 0 && (
        <UniversityExamTrendChart metrics={allSections.flatMap(s => s.metrics) as any} />
      )}

      {otherSecs.map(sec => {
        const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
        if (!metrics.length) return null;

        const secHasYears    = metrics.some(m => isRealYear(m.year));
        const secHasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

        if (secHasPrograms) {
          // Group by program, pivot by year within each
          const secPm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
          const secYearSet = new Set<string>();
          for (const rows of secPm.values())
            for (const r of rows)
              if (isRealYear(r.year)) secYearSet.add(baseYear(r.year));
          const secYears = Array.from(secYearSet).sort();

          return (
            <Card key={sec.section} title={sec.section} noPad style={{ marginTop: 20 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, minWidth: 180 }}>Program</th>
                      <th style={TH}>Metric</th>
                      {secYears.map(yr => <th key={yr} style={THR}>{yr}</th>)}
                      {!secHasYears && <th style={THR}>Value</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(secPm.entries()).flatMap(([prog, rows], gi) => {
                      const mm = groupBy(rows, r => cl(r.metric));
                      return Array.from(mm.entries()).map(([metric, mrows], mi) => {
                        const yearVals: Record<string, string> = {};
                        for (const r of mrows)
                          if (isRealYear(r.year)) yearVals[baseYear(r.year)] = isBAD(r.value) ? "" : cl(r.value);
                        const flatVal = mrows[0]?.value ?? "";
                        return (
                          <tr
                            key={`${gi}-${mi}`}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              background: (gi + mi) % 2 ? "var(--off-white)" : "transparent",
                            }}
                            {...rh(gi + mi)}
                          >
                            {mi === 0 ? (
                              <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={mm.size}>{prog}</td>
                            ) : null}
                            <td style={TD}>{metric}</td>
                            {secHasYears
                              ? secYears.map(yr => (
                                <td key={yr} style={TDR}>
                                  {yearVals[yr] ? fmtV(yearVals[yr], metric) : <span style={{ color: "var(--ink-100)" }}>—</span>}
                                </td>
                              ))
                              : <td style={TDR}>{isBAD(flatVal) ? "—" : fmtV(flatVal, metric)}</td>
                            }
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        // No programs — show simple metric pivot
        const { rows: secRows, years: secYears } = buildPivotRows(metrics);
        if (secRows.length && secYears.length) {
          return (
            <Card key={sec.section} title={sec.section} noPad style={{ marginTop: 20 }}>
              <YearPivotTable rows={secRows} years={secYears} />
            </Card>
          );
        }

        // Flat list fallback
        return (
          <Card key={sec.section} title={sec.section} noPad style={{ marginTop: 20 }}>
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
                    <tr key={i}
                      style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--off-white)" : "transparent" }}
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

function TabPlacement({ sections, allSections }: { sections: RawSection[]; allSections: RawSection[] }) {
  if (!sections.length) return <Empty />;

  const all = sections
    .flatMap(s => s.metrics)
    .filter(m => !isBAD(m.metric) && !isWords(m.metric));
  if (!all.length) return <Empty />;

  const allValid = allSections.flatMap(s => s.metrics).filter(m => !isBAD(m.metric) && !isWords(m.metric) && isRealYear(m.year) && !isBAD(m.program));
  const allPm = groupBy(allValid, r => cl(r.program));
  const hasPrograms = all.some(m => !isBAD(m.program) && cl(m.program) !== "-");

  if (!hasPrograms) {
    const { rows, years } = buildPivotRows(all);
    if (!rows.length) return <Empty />;
    const latestYr = years.at(-1) ?? "";
    const placed   = rows.find(r => r.label.toLowerCase().includes("placed"))?.yearVals[latestYr];
    const salary   = rows.find(r => r.isSal)?.yearVals[latestYr];
    return (
      <div>
        {(placed || salary) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
            gap: 10,
            marginBottom: 16,
          }}>
            {placed && <KV label={`Placed (${latestYr})`}     value={fmtN(placed)}   accent />}
            {salary && <KV label={`Avg Salary (${latestYr})`} value={fmtAmt(salary)} />}
          </div>
        )}
        <Card title={sections[0]?.section} noPad>
          <YearPivotTable rows={rows} years={years} />
        </Card>
      </div>
    );
  }

  const valid = all.filter(m => isRealYear(m.year) && !isBAD(m.program));
  const pm    = groupBy(valid, r => cl(r.program));
  const allP  = Array.from(pm.keys());
  const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
  const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
  const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
  const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

  // Ordered program list for the selector: UG first, then PG, then integrated, then other
  const orderedProgs = [...ugP, ...pgP, ...pgIP, ...otP];

  function PBlock({ prog }: { prog: string }) {
    const rows    = pm.get(prog)!;
    const yearSet = new Set<string>();
    for (const r of rows) if (isRealYear(r.year)) yearSet.add(r.year.trim());
    const years = Array.from(yearSet).sort((a, b) => baseYear(a).localeCompare(baseYear(b)));
    const mm    = groupBy(rows, r => cl(r.metric));
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
      .filter(r => Object.values(r.yearVals).some(v => v !== ""));

    if (!pivotRows.length || !years.length) return <Empty msg="No data." />;

    const latestGradYr =
      years.filter(y => y.toLowerCase().includes("graduation")).sort().at(-1) ??
      years.at(-1) ?? "";
    const kv     = (kw: string) =>
      pivotRows.find(r => r.label.toLowerCase().includes(kw))?.yearVals[latestGradYr];
    const placed = kv("students placed");
    const salary = pivotRows.find(r => r.isSal)?.yearVals[latestGradYr];
    const higher = kv("higher stud") || kv("selected for higher");

    return (
      <div>
        {(placed || salary || higher) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
            gap: 8,
            marginBottom: 14,
          }}>
            {placed && (
              <KV
                label={`Placed (${latestGradYr || "Latest"})`}
                value={fmtN(placed)}
                accent
              />
            )}
            {salary && <KV label="Median Salary"  value={fmtSal(salary)} />}
            {higher && <KV label="Higher Studies" value={fmtN(higher)}   />}
          </div>
        )}
        <YearPivotTable rows={pivotRows} years={years} />
      </div>
    );
  }

  function RG({
    progs, label, open = true,
  }: {
    progs: string[]; label: string; open?: boolean;
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
              <div style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: "var(--crimson-dark)",
                margin: i === 0 ? "0 0 10px" : "20px 0 10px",
                paddingBottom: 6,
                borderBottom: "1px dashed var(--border)",
              }}>
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
      {/* Single chart at top — program selector switches between UG / PG / etc. */}
      <PlacementTrendChart allMetrics={allValid} programs={orderedProgs} />

      {/* Detailed pivot tables per program group below */}
      <RG progs={ugP}  label="Undergraduate Programs" open={true}  />
      <RG progs={pgP}  label="Postgraduate Programs"  open={true}  />
      <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
      <RG progs={otP}  label="Other Programs"         open={false} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: PhD
// ─────────────────────────────────────────────────────────────────────────────

function TabPhd({
  sections, allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length) return <Empty msg="PhD data not available for this ranking year." />;

  const all       = sections.flatMap(s => s.metrics);
  const pursuing  = all.filter(m => m.program?.toLowerCase().includes("pursuing"));
  const graduated = all.filter(m => isRealYear(m.year) && !isBAD(m.value));
  const ftP       = pursuing.find(m => m.metric.toLowerCase().includes("full time"))?.value;
  const ptP       = pursuing.find(m => m.metric.toLowerCase().includes("part time"))?.value;
  const { rows: gradRows, years: gradYears } = buildPivotRows(graduated);

  // All graduated metrics across every ranking year — for the trend chart
  const allGraduated = allSections
    .flatMap(s => s.metrics)
    .filter(m =>
      isRealYear(m.year) &&
      !isBAD(m.value) &&
      !m.program?.toLowerCase().includes("pursuing"),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Trend chart — Full Time + Part Time graduated over all academic years */}
      <PhdTrendChart metrics={allGraduated} />

      {(ftP || ptP) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
          {ftP && !isBAD(ftP) && <KV label="Full Time Students" value={fmtN(cl(ftP))} accent />}
          {ptP && !isBAD(ptP) && <KV label="Part Time Students" value={fmtN(cl(ptP))} />}
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
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)" }}>
                {m.program}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-700)", fontWeight: 600 }}>
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
  sections, allSections,
}: {
  sections: RawSection[];
  allSections: RawSection[];
}) {
  if (!sections.length) return <Empty />;

  // All metrics across every ranking year — student strength sections only (excludes Scholarships)
  const allMetrics = allSections
    .filter(s => s.section.toLowerCase().includes("student strength") || s.section.toLowerCase().includes("student details"))
    .flatMap(s => s.metrics);

  return (
    <div>
      {/* Trend charts — composition and diversity across ranking years */}
      <StudentsTrendChart metrics={allMetrics as any} />

      {sections.map(sec => {
        const metrics = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
        if (!metrics.length) return null;

        if (sec.section.toLowerCase().includes("scholarship")) {
          // Scholarships layout:
          // Rows    = Academic Year + Program
          // Columns = scholarship metric types (Institution, Private, Govt, Not Receiving)
          // Data has: year="2016-17", program="UG [4 Years]", metric="No. of students...", value=N

          const valid = metrics.filter(m => isRealYear(m.year) && !isBAD(m.program));
          if (!valid.length) return null;

          // Get unique years and programs (in insertion order)
          const yearSet = new Set<string>();
          const progSet = new Set<string>();
          for (const m of valid) {
            yearSet.add(baseYear(m.year));
            progSet.add(cl(m.program));
          }
          const years = Array.from(yearSet).sort();
          const progs = Array.from(progSet);

          // Collect unique metric labels — shorten for column headers
          const metricSet = new Set<string>();
          for (const m of valid) metricSet.add(m.metric);
          const metricLabels = Array.from(metricSet);

          // Short labels for column headers (Institution Funds, Private Bodies, Govt, Not Receiving)
          function shortMetric(m: string): string {
            const ml = m.toLowerCase();
            if (ml.includes("institution")) return "Institution Funds";
            if (ml.includes("private"))     return "Private Bodies";
            if (ml.includes("state") || ml.includes("government") || ml.includes("central")) return "State/Central Govt";
            if (ml.includes("not receiving")) return "Not Receiving";
            return m.replace(/No\. of students (receiving|who are)( full tuition fee)? /i, "").trim();
          }

          // Build map: year → program → metric → value
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
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Academic Year</th>
                      <th style={TH}>Program</th>
                      {metricLabels.map(m => (
                        <th key={m} style={{ ...THR, maxWidth: 130, whiteSpace: "normal", lineHeight: 1.3 }}>
                          {shortMetric(m)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {years.flatMap(yr =>
                      progs
                        .filter(pg => data[yr]?.[pg])
                        .map((pg, pi) => {
                          const rowIdx = years.indexOf(yr) * progs.length + pi;
                          return (
                            <tr
                              key={`${yr}-${pg}`}
                              style={{
                                borderBottom: "1px solid var(--border)",
                                background: rowIdx % 2 ? "var(--off-white)" : "transparent",
                                transition: "background 0.1s",
                              }}
                              {...rh(rowIdx)}
                            >
                              {pi === 0 ? (
                                <td
                                  style={{ ...TDM, verticalAlign: "top" }}
                                  rowSpan={progs.filter(p => data[yr]?.[p]).length}
                                >
                                  {yr}
                                </td>
                              ) : null}
                              <td style={TD}>{pg}</td>
                              {metricLabels.map(m => {
                                const val = data[yr]?.[pg]?.[m] ?? "";
                                return (
                                  <td key={m} style={TDR}>
                                    {val ? fmtN(val) : <span style={{ color: "var(--ink-100)" }}>—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        const hasYears    = metrics.some(m => isRealYear(m.year));
        const hasPrograms = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

        if (hasYears && hasPrograms) {
          const pm = groupBy(metrics.filter(m => !isBAD(m.program)), r => cl(r.program));
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

        const pm = groupBy(metrics, r => {
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
                          background: (gi + i) % 2 ? "var(--off-white)" : "transparent",
                        }}
                        {...rh(gi + i)}
                      >
                        {i === 0 ? (
                          <td style={{ ...TDM, verticalAlign: "top" }} rowSpan={rows.length}>
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
  const valid = metrics.filter(m => !isBAD(m.value) && !isWords(m.metric));
  if (!valid.length) return null;

  if (title.toLowerCase().includes("fdp") || title.toLowerCase().includes("faculty development")) {
    return (
      <Card title={title} noPad>
        <RecordTable metrics={metrics.filter(m => !isBAD(m.value))} nameCol="Academic Year" />
      </Card>
    );
  }

  const hasYears = valid.some(m => isRealYear(m.year));
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
  sections, allSections, row,
}: {
  sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
}) {
  if (!sections.length) return <Empty />;
  const allSecMap = new Map(allSections.map(s => [s.section, s]));
  return (
    <div>
      {/* Trend chart per section — projects / agencies / amount over years */}
      {sections.map(sec => (
        <ResearchTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
      ))}

      {row && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
          gap: 10,
          marginBottom: 16,
        }}>
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
              value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")}
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
      {sections.map(sec => (
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
      {sections.map(sec => {
        const metrics = sec.metrics.filter(m => !isBAD(m.value));
        if (!metrics.length) return null;

        if (sec.section.toLowerCase().includes("sustainab")) {
          return (
            <Card key={sec.section} title={sec.section}>
              {metrics.filter(m => !isBAD(m.metric)).map((m, i) => {
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
                      borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
                      {m.metric}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      flexShrink: 0,
                      padding: "3px 10px",
                      color: yes ? "var(--teal)" : "var(--crimson)",
                      background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
                      border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                    }}>
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
          const hasYears = metrics.some(m => isRealYear(m.year));
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
          m => !isBAD(m.program) && cl(m.program) !== "-" && m.program.length > 3,
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
  const valid    = metrics.filter(m => !isWords(m.metric));
  if (!valid.length) return null;
  const hasYears = valid.some(m => isRealYear(m.year));
  const hasProg  = valid.some(m => !isBAD(m.program) && cl(m.program) !== "-");

  if (hasYears && hasProg) {
    const pm = groupBy(valid.filter(m => isRealYear(m.year)), r => cl(r.program) || "General");
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
      .filter(r => Object.values(r.yearVals).some(v => v !== ""));
    const totalYV: Record<string, string> = {};
    for (const yr of years) {
      let s = 0, any = false;
      for (const r of pivotRows) {
        const n = Number((r.yearVals[yr] || "").replace(/,/g, ""));
        if (!isNaN(n) && n > 0) { s += n; any = true; }
      }
      totalYV[yr] = any ? String(s) : "";
    }
    return (
      <Card title={title} noPad>
        <YearPivotTable
          rows={[...pivotRows, { label: "Total", yearVals: totalYV, isAmt: true, isBold: true }]}
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
  sections, allSections, row,
}: {
  sections: RawSection[]; allSections: RawSection[]; row: Record<string, unknown> | null;
}) {
  if (!sections.length) return <Empty />;
  const allSecMap = new Map(allSections.map(s => [s.section, s]));
  return (
  
    <div>
      {/* Trend chart per section — one line per line item over years */}
      {sections.map(sec => (
        <FinancialTrendChart key={sec.section} metrics={allSecMap.get(sec.section)?.metrics ?? sec.metrics} title={sec.section} />
      ))}

      {row && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 10,
          marginBottom: 16,
        }}>
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
      {sections.map(sec => (
        <FinBlock key={`table-${sec.section}`} metrics={sec.metrics} title={sec.section} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Faculty
// ─────────────────────────────────────────────────────────────────────────────

function TabFaculty({ sections }: { sections: RawSection[] }) {
  const valid = sections
    .flatMap(s => s.metrics)
    .filter(m => !isBAD(m.value) && !isBAD(m.metric));
  if (!valid.length) return <Empty />;
  const count = valid.find(
    m =>
      m.metric.toLowerCase().includes("number of faculty") ||
      m.metric.toLowerCase().includes("no of regular faculty"),
  )?.value;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {count && !isBAD(count) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
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
    .flatMap(s => s.metrics)
    .filter(m => !isBAD(m.value) && !isBAD(m.metric));
  if (!all.length) return <Empty />;

  const hasYears = all.some(m => isRealYear(m.year));
  const dbs      = [...new Set(all.map(m => cl(m.program)).filter(Boolean))];

  if (hasYears) {
    const pm = groupBy(all.filter(m => !isBAD(m.program)), r => cl(r.program));
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
      {dbs.map(db => (
        <Card key={db} title={db} noPad>
          <FlatTable metrics={all.filter(m => cl(m.program) === db)} />
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
      {sections.map(sec => {
        const valid   = sec.metrics.filter(m => !isBAD(m.metric));
        if (!valid.length) return null;
        const hasYear = valid.some(
          m => isRealYear(m.year) || (!isBAD(m.year) && m.year !== "-"),
        );

        if (sec.section.toLowerCase().includes("sustainab")) {
          return (
            <Card key={sec.section} title={sec.section}>
              {valid.filter(m => !isBAD(m.value)).map((m, i) => {
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
                      borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink-700)", flex: 1 }}>
                      {m.metric}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      padding: "3px 10px",
                      color: yes ? "var(--teal)" : "var(--crimson)",
                      background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
                      border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                    }}>
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
                    borderBottom: i < valid.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "var(--ink-700)",
                      lineHeight: 1.5,
                    }}>
                      {m.metric}
                    </span>
                    {hasYear && m.year && m.year !== "-" && (
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        color: "var(--ink-300)",
                        marginLeft: 8,
                      }}>
                        ({m.year})
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    flexShrink: 0,
                    padding: "3px 10px",
                    color: yes ? "var(--teal)" : "var(--crimson)",
                    background: yes ? "var(--teal-pale)" : "var(--crimson-pale)",
                    border: `1px solid ${yes ? "rgba(26,122,110,0.2)" : "rgba(192,57,43,0.2)"}`,
                  }}>
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
      {sections.map(sec => {
        const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
        if (!metrics.length) return null;
        const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");
        if (hasProgram) {
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <RecordTable metrics={metrics} nameCol="Body" />
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
// Tab: Other
// ─────────────────────────────────────────────────────────────────────────────

function TabOther({ sections }: { sections: RawSection[] }) {
  if (!sections.length) return <Empty />;
  return (
    <div>
      {sections.map(sec => {
        const metrics    = sec.metrics.filter(m => !isBAD(m.value) && !isBAD(m.metric));
        if (!metrics.length) return null;
        const hasYears   = metrics.some(m => isRealYear(m.year));
        const hasProgram = metrics.some(m => !isBAD(m.program) && cl(m.program) !== "-");

        if (hasYears) {
          const { rows, years } = buildPivotRows(metrics);
          if (rows.length) {
            return (
              <Card key={sec.section} title={sec.section} noPad>
                <YearPivotTable rows={rows} years={years} />
              </Card>
            );
          }
        }
        if (hasProgram) {
          return (
            <Card key={sec.section} title={sec.section} noPad>
              <RecordTable metrics={metrics} />
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
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function InstituteDetail({ hit }: Props) {
  const [profile,    setProfile]    = useState<InstituteProfileResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<TabId>("scores");
  const [activeYear, setActiveYear] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
      .then(r => r.json())
      .then((d: InstituteProfileResponse) => {
        setProfile(d);
        const yrs = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
        setActiveYear(yrs[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hit.institute_code]);

  if (loading) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontSize: "0.8rem" }}>
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

  const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
  const row         = activeYear
    ? (profile.scoresByYear[activeYear] as Record<string, unknown>)
    : null;
  const rawSections = profile.rawSections as RawSection[];
  const imgCols     = Object.keys(row ?? {}).filter(
    k => k.startsWith("img_") && k.endsWith("_score"),
  );

  // secsByTab — filtered to active year (for tables)
  const secsByTab = new Map<TabId, RawSection[]>();
  for (const s of rawSections) {
    const tabId = SECTION_TAB[s.section];
    if (!tabId) continue;
    const filtered: RawSection = {
      ...s,
      metrics: activeYear
        ? s.metrics.filter(m => m.ranking_year === activeYear || m.ranking_year === 0)
        : s.metrics,
    };
    if (!filtered.metrics.length) continue;
    if (!secsByTab.has(tabId)) secsByTab.set(tabId, []);
    secsByTab.get(tabId)!.push(filtered);
  }

  // allSecsByTab — ALL ranking years unfiltered (for trend charts)
  const allSecsByTab = new Map<TabId, RawSection[]>();
  for (const s of rawSections) {
    const tabId = SECTION_TAB[s.section];
    if (!tabId) continue;
    if (!s.metrics.length) continue;
    if (!allSecsByTab.has(tabId)) allSecsByTab.set(tabId, []);
    allSecsByTab.get(tabId)!.push(s);
  }

  const visibleTabs = ALL_TABS.filter(t => t.id === "scores" || secsByTab.has(t.id));
  const safeTab: TabId = visibleTabs.find(t => t.id === activeTab) ? activeTab : "scores";
  const getSecs    = (tabId: TabId): RawSection[] => secsByTab.get(tabId) ?? [];
  const getAllSecs  = (tabId: TabId): RawSection[] => allSecsByTab.get(tabId) ?? [];
  const scoresByYear = profile.scoresByYear as Record<number, Record<string, unknown>>;

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
    intake:        <TabIntake        sections={getSecs("intake")}        allSections={getAllSecs("intake")}        />,
    placement:     <TabPlacement     sections={getSecs("placement")}     allSections={getAllSecs("placement")}     />,
    phd:           <TabPhd           sections={getSecs("phd")}           allSections={getAllSecs("phd")}           />,
    students:      <TabStudents      sections={getSecs("students")}      allSections={getAllSecs("students")}      />,
    research:      <TabResearch      sections={getSecs("research")}      allSections={getAllSecs("research")}      row={row} />,
    innovation:    <TabInnovation    sections={getSecs("innovation")}                                             />,
    financial:     <TabFinancial     sections={getSecs("financial")}     allSections={getAllSecs("financial")}     row={row} />,
    faculty:       <TabFaculty       sections={getSecs("faculty")}                                                />,
    publications:  <TabPublications  sections={getSecs("publications")}                                          />,
    facilities:    <TabFacilities    sections={getSecs("facilities")}                                            />,
    accreditation: <TabAccreditation sections={getSecs("accreditation")}                                         />,
    other:         <TabOther         sections={getSecs("other")}                                                  />,
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 64px" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        padding: "24px 28px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--crimson)",
              background: "var(--crimson-pale)",
              border: "1px solid rgba(192,57,43,0.2)",
              padding: "2px 8px",
              marginBottom: 10,
              display: "inline-block",
            }}>
              {profile.categories.join(" · ")}
            </span>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(1.3rem,3vw,1.9rem)",
              color: "var(--ink-900)",
              lineHeight: 1.2,
              marginBottom: 5,
            }}>
              {profile.institute_name}
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-300)" }}>
              {profile.institute_code}
            </p>
          </div>

          {row?.img_total != null && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "3.2rem",
                color: "var(--crimson)",
                lineHeight: 1,
                marginBottom: 3,
              }}>
                {(row.img_total as number).toFixed(2)}
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ink-300)",
              }}>
                NIRF Total Score
              </p>
            </div>
          )}
        </div>

        {allYears.length > 0 && (
          <div style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-300)",
              marginRight: 4,
            }}>
              Ranking Year
            </span>
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  padding: "3px 11px",
                  background: activeYear === y ? "var(--crimson)" : "var(--white)",
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
      </div>

      {/* ── Tab strip ── */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid var(--border)",
        marginBottom: 20,
        overflowX: "auto",
      }}>
        {visibleTabs.map(tab => (
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
              borderBottom: safeTab === tab.id
                ? "2px solid var(--crimson)"
                : "2px solid transparent",
              marginBottom: "-2px",
              color: safeTab === tab.id ? "var(--crimson)" : "var(--ink-400)",
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
      <div key={`${safeTab}-${activeYear}`} style={{ animation: "fadeIn 0.18s ease both" }}>
        {tabContent[safeTab]}
      </div>
    </div>
  );
}