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

























"use client";
import React, { useEffect, useState } from "react";
import type { SearchHit } from "@/app/page";
import type { InstituteProfileResponse } from "@/types/nirf";
import { SCORE_LABELS } from "@/types/nirf";

interface Props { hit: SearchHit; }
interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
interface RawSection { section: string; metrics: RawMetric[]; }
type TabId = "scores"|"intake"|"students"|"placement"|"phd"|"research"|"financial"|"faculty"|"facilities";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "scores",     label: "NIRF Scores",  icon: "★" },
  { id: "intake",     label: "Intake",       icon: "⊕" },
  { id: "students",   label: "Students",     icon: "◎" },
  { id: "placement",  label: "Placement",    icon: "↗" },
  { id: "phd",        label: "PhD",          icon: "⚗" },
  { id: "research",   label: "Research",     icon: "◈" },
  { id: "financial",  label: "Financial",    icon: "₹" },
  { id: "faculty",    label: "Faculty",      icon: "✦" },
  { id: "facilities", label: "Facilities",   icon: "⌂" },
];

const TAB_SECTIONS: Record<TabId, string[]> = {
  scores: [], intake: ["Sanctioned"], students: ["Student Strength","Total Actual"],
  placement: ["Placement"], phd: ["Ph.D"],
  research: ["Sponsored","Consultancy","Executive Development"],
  financial: ["Capital expenditure","Operational expenditure"],
  faculty: ["Faculty"], facilities: ["PCS","Physically Challenged"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const BAD = new Set(["nan","<na>","null","-","n/a","na","undefined",""]);
const isBAD = (v: string|null|undefined) => BAD.has((v??"").toString().toLowerCase().trim());
const clean = (v: string|null|undefined): string => (v==null||isBAD(v)) ? "—" : v.trim();
const cleanYear = (y: string|null|undefined): string => { const c=clean(y); return c==="—"?"":c; };

function fmtNum(v: string|null|undefined): string {
  const s=clean(v); if(s==="—") return "—";
  const n=Number(s.replace(/,/g,"")); if(isNaN(n)) return s;
  return n.toLocaleString("en-IN");
}
function fmtAmt(v: string|null|undefined): string {
  const s=clean(v); if(s==="—") return "—";
  const n=Number(s.replace(/,/g,"")); if(isNaN(n)) return s;
  if(n>=1_00_00_000) return `₹${(n/1_00_00_000).toFixed(2)} Cr`;
  if(n>=1_00_000)    return `₹${(n/1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtSalary(v: string|null|undefined): string {
  const s=clean(v); if(s==="—") return "—";
  const n=Number(s.replace(/,/g,"")); if(isNaN(n)) return s;
  return `₹${(n/100_000).toFixed(1)}L`;
}
function fmtVal(v: string, metric: string): string {
  if(isBAD(v)) return "—";
  const m=metric.toLowerCase();
  if(m.includes("salary")) return fmtSalary(v);
  if(m.includes("amount")&&!m.includes("in words")) return fmtAmt(v);
  return fmtNum(v);
}
const isWords = (metric: string) => metric.toLowerCase().includes("in words");

// ── Style tokens ──────────────────────────────────────────────────────────────
const TH:   React.CSSProperties = { fontFamily:"var(--font-mono)", fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-400)", padding:"8px 14px", textAlign:"left", borderBottom:"2px solid var(--border)", background:"var(--off-white)", whiteSpace:"nowrap" };
const TH_R: React.CSSProperties = { ...TH, textAlign:"right" };
const TD:   React.CSSProperties = { padding:"8px 14px", color:"var(--ink-700)", verticalAlign:"middle", fontSize:"0.78rem" };
const TD_M: React.CSSProperties = { ...TD, color:"var(--ink-300)", fontFamily:"var(--font-mono)", fontSize:"0.68rem", whiteSpace:"nowrap" };
const TD_R: React.CSSProperties = { ...TD, textAlign:"right", fontFamily:"var(--font-mono)" };

function rh(i: number) {
  return {
    onMouseEnter:(e:React.MouseEvent<HTMLTableRowElement>)=>{e.currentTarget.style.background="var(--crimson-pale)";},
    onMouseLeave:(e:React.MouseEvent<HTMLTableRowElement>)=>{e.currentTarget.style.background=i%2===0?"transparent":"var(--off-white)";},
  };
}

// ── Primitives ────────────────────────────────────────────────────────────────
function KV({label,value,accent,big}:{label:string;value?:string|null;accent?:boolean;big?:boolean}) {
  return (
    <div style={{background:accent?"var(--crimson-pale)":"var(--off-white)",border:`1px solid ${accent?"rgba(192,57,43,0.18)":"var(--border)"}`,padding:"14px 16px"}}>
      <p style={{fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.09em",color:accent?"var(--crimson)":"var(--ink-500)",marginBottom:5}}>{label}</p>
      <p style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:big?"1.9rem":"1.35rem",color:accent?"var(--crimson-dark)":"var(--ink-900)",lineHeight:1}}>{value||"—"}</p>
    </div>
  );
}
function Card({title,children}:{title?:string;children:React.ReactNode}) {
  return (
    <div style={{background:"var(--white)",border:"1px solid var(--border)",padding:"20px 24px",boxShadow:"var(--shadow-sm)",marginBottom:14}}>
      {title&&<h3 style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"1rem",color:"var(--ink-900)",marginBottom:14,paddingBottom:8,borderBottom:"1px solid var(--border)"}}>{title}</h3>}
      {children}
    </div>
  );
}
function SLabel({children}:{children:React.ReactNode}) {
  return <p style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-400)",marginBottom:8,marginTop:4}}>{children}</p>;
}
function ScoreBar({label,score,total}:{label:string;score:number|null;total:number|null}) {
  const pct=score!=null&&(total??100)>0?Math.min((score/(total??100))*100,100):0;
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)"}}>{label}</span>
        <span style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-400)"}}>{score?.toFixed(2)??"—"} / {total?.toFixed(0)??"—"}</span>
      </div>
      <div style={{height:5,background:"var(--border)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"var(--crimson)",transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)"}}/>
      </div>
    </div>
  );
}
function Empty({msg="No data available."}:{msg?:string}) {
  return <p style={{fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-300)",padding:"20px 0"}}>{msg}</p>;
}

// ── GroupedTable ──────────────────────────────────────────────────────────────
// Groups rows by program. Shows year column only if real years exist.
function GroupedTable({rows,hideWords=true}:{rows:RawMetric[];hideWords?:boolean}) {
  const data = hideWords ? rows.filter(r=>!isWords(r.metric)) : rows;
  if(!data.length) return <Empty msg="No data."/>;

  const groupMap = new Map<string,RawMetric[]>();
  for(const r of data) {
    const prog = isBAD(r.program)?"—":r.program.trim();
    if(!groupMap.has(prog)) groupMap.set(prog,[]);
    groupMap.get(prog)!.push(r);
  }
  const multiGroup = groupMap.size>1;
  const hasYear    = data.some(r=>cleanYear(r.year)!=="");

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
        <thead>
          <tr>
            {hasYear&&<th style={TH}>Year</th>}
            <th style={TH}>Metric</th>
            <th style={TH_R}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groupMap.entries()).map(([prog,items],gi)=>(
            <React.Fragment key={gi}>
              {multiGroup&&(
                <tr>
                  <td colSpan={hasYear?3:2} style={{background:"var(--off-white)",borderTop:gi>0?"2px solid var(--border)":undefined,borderBottom:"1px solid var(--border)",padding:"6px 14px",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.75rem",color:"var(--crimson)"}}>
                    {prog}
                  </td>
                </tr>
              )}
              {items.map((m,i)=>(
                <tr key={i} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"transparent":"var(--off-white)",transition:"background 0.1s"}} {...rh(i)}>
                  {hasYear&&<td style={TD_M}>{cleanYear(m.year)||"—"}</td>}
                  <td style={TD}>{m.metric}</td>
                  <td style={{...TD_R,color:isBAD(m.value)?"var(--ink-100)":"var(--ink-700)"}}>{fmtVal(m.value,m.metric)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── IntakePivotTable ──────────────────────────────────────────────────────────
// Intake: programs as rows, years as columns. Year IS available in intake data.
function IntakePivotTable({rows}:{rows:RawMetric[]}) {
  const data      = rows.filter(r=>!isWords(r.metric));
  const programs  = [...new Set(data.map(r=>r.program?.trim()).filter(Boolean))].sort();
  const acadYears = [...new Set(data.map(r=>cleanYear(r.year)).filter(Boolean))].sort();

  if(!programs.length||!acadYears.length) return <GroupedTable rows={rows}/>;

  const pivot: Record<string,Record<string,string>> = {};
  for(const r of data) {
    const prog=r.program?.trim()||""; const yr=cleanYear(r.year);
    if(!prog) continue;
    if(!pivot[prog]) pivot[prog]={};
    if(yr) pivot[prog][yr]=r.value;
  }
  const rowTotals: Record<string,number> = {};
  for(const prog of programs) {
    rowTotals[prog]=acadYears.reduce((sum,yr)=>{const n=Number((pivot[prog]?.[yr]??"").replace(/,/g,""));return isNaN(n)?sum:sum+n;},0);
  }
  const grand=Object.values(rowTotals).reduce((a,b)=>a+b,0);
  const showTotal=acadYears.length>1;

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
        <thead>
          <tr>
            <th style={{...TH,minWidth:180}}>Program</th>
            {acadYears.map(yr=><th key={yr} style={TH_R}>{yr}</th>)}
            {showTotal&&<th style={{...TH_R,color:"var(--crimson)",borderLeft:"1px solid var(--border)"}}>Total</th>}
          </tr>
        </thead>
        <tbody>
          {programs.map((prog,pi)=>(
            <tr key={prog} style={{borderBottom:"1px solid var(--border)",background:pi%2===0?"transparent":"var(--off-white)",transition:"background 0.1s"}} {...rh(pi)}>
              <td style={{...TD,fontWeight:500}}>{prog}</td>
              {acadYears.map(yr=>{const raw=pivot[prog]?.[yr];return(<td key={yr} style={TD_R}>{raw&&!isBAD(raw)?fmtNum(raw):<span style={{color:"var(--ink-100)"}}>—</span>}</td>);})}
              {showTotal&&<td style={{...TD_R,fontWeight:600,color:"var(--crimson-dark)",borderLeft:"1px solid var(--border)",background:"var(--crimson-pale)"}}>{rowTotals[prog]>0?rowTotals[prog].toLocaleString("en-IN"):"—"}</td>}
            </tr>
          ))}
          {programs.length>1&&showTotal&&(
            <tr style={{borderTop:"2px solid var(--border)",background:"var(--off-white)"}}>
              <td style={{...TD,fontWeight:700}}>Grand Total</td>
              {acadYears.map(yr=>{const col=programs.reduce((s,p)=>{const n=Number((pivot[p]?.[yr]??"").replace(/,/g,""));return isNaN(n)?s:s+n;},0);return<td key={yr} style={{...TD_R,fontWeight:600}}>{col>0?col.toLocaleString("en-IN"):"—"}</td>;})}
              <td style={{...TD_R,fontWeight:700,color:"var(--crimson-dark)",borderLeft:"1px solid var(--border)",background:"var(--crimson-pale)"}}>{grand.toLocaleString("en-IN")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── MultiYearTable ────────────────────────────────────────────────────────────
// For sections where year is <NA>. NIRF always stores 3 years of data per metric.
// Groups by program, shows metric with 3 value columns (Year-2, Year-1, Latest).
function MultiYearTable({rows,hideWords=true}:{rows:RawMetric[];hideWords?:boolean}) {
  const data = hideWords ? rows.filter(r=>!isWords(r.metric)) : rows;
  if(!data.length) return <Empty msg="No data."/>;

  // If real years exist, fall back to grouped table
  if(data.some(r=>cleanYear(r.year)!=="")) return <GroupedTable rows={rows} hideWords={hideWords}/>;

  const groupMap = new Map<string,RawMetric[]>();
  for(const r of data){const prog=isBAD(r.program)?"—":r.program.trim();if(!groupMap.has(prog))groupMap.set(prog,[]);groupMap.get(prog)!.push(r);}
  const multiGroup=groupMap.size>1;

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
        <thead>
          <tr>
            <th style={TH}>Metric</th>
            <th style={TH_R}>Year −2</th>
            <th style={TH_R}>Year −1</th>
            <th style={TH_R}>Latest Year</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groupMap.entries()).map(([prog,items],gi)=>{
            const metricMap=new Map<string,string[]>();
            for(const r of items){if(!metricMap.has(r.metric))metricMap.set(r.metric,[]);if(!isBAD(r.value))metricMap.get(r.metric)!.push(r.value);}
            return (
              <React.Fragment key={gi}>
                {multiGroup&&(
                  <tr>
                    <td colSpan={4} style={{background:"var(--off-white)",borderTop:gi>0?"2px solid var(--border)":undefined,borderBottom:"1px solid var(--border)",padding:"6px 14px",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.75rem",color:"var(--crimson)"}}>{prog}</td>
                  </tr>
                )}
                {Array.from(metricMap.entries()).map(([metric,values],mi)=>(
                  <tr key={mi} style={{borderBottom:"1px solid var(--border)",background:mi%2===0?"transparent":"var(--off-white)",transition:"background 0.1s"}} {...rh(mi)}>
                    <td style={TD}>{metric}</td>
                    {[0,1,2].map(idx=>(
                      <td key={idx} style={TD_R}>
                        {values[idx]!=null?<span style={{color:"var(--ink-700)"}}>{fmtVal(values[idx],metric)}</span>:<span style={{color:"var(--ink-100)"}}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <p style={{fontFamily:"var(--font-mono)",fontSize:"0.6rem",color:"var(--ink-300)",marginTop:8,paddingTop:6,borderTop:"1px solid var(--border)"}}>
        ※ NIRF reports 3 consecutive years of data. Specific year labels are not provided in the source.
      </p>
    </div>
  );
}

// ── WordsDisclosure ───────────────────────────────────────────────────────────
function WordsDisclosure({metrics}:{metrics:RawMetric[]}) {
  const words=metrics.filter(m=>isWords(m.metric));
  if(!words.length) return null;
  const groupMap=new Map<string,string[]>();
  for(const m of words){const prog=isBAD(m.program)?"General":m.program.trim();if(!groupMap.has(prog))groupMap.set(prog,[]);if(!isBAD(m.value))groupMap.get(prog)!.push(m.value);}
  return (
    <details style={{marginTop:10}}>
      <summary style={{fontFamily:"var(--font-mono)",fontSize:"0.63rem",color:"var(--ink-300)",cursor:"pointer",padding:"4px 0"}}>Show amounts in words ({words.length})</summary>
      <div style={{marginTop:6}}>
        {Array.from(groupMap.entries()).map(([prog,vals])=>(
          <div key={prog} style={{marginBottom:8}}>
            {groupMap.size>1&&<p style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",color:"var(--crimson)",marginBottom:4}}>{prog}</p>}
            {vals.map((v,i)=><div key={i} style={{padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:"0.73rem",color:"var(--ink-500)"}}>{v}</div>)}
          </div>
        ))}
      </div>
    </details>
  );
}

function getSections(rawSections:RawSection[],keywords:string[]):RawSection[] {
  return rawSections.filter(s=>keywords.some(kw=>s.section.toLowerCase().includes(kw.toLowerCase()))).filter(s=>s.metrics.length>0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstituteDetail({hit}:Props) {
  const [profile,   setProfile]   = useState<InstituteProfileResponse|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("scores");
  const [activeYear,setActiveYear]= useState<number|null>(null);

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/institute/${encodeURIComponent(hit.institute_code)}`)
      .then(r=>r.json())
      .then((d:InstituteProfileResponse)=>{
        setProfile(d);
        const yrs=Object.keys(d.scoresByYear).map(Number).sort((a,b)=>b-a);
        setActiveYear(yrs[0]??null);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[hit.institute_code]);

  if(loading) return <div style={{padding:"80px 32px",textAlign:"center"}}><p style={{fontFamily:"var(--font-mono)",color:"var(--ink-300)",fontSize:"0.8rem"}}>Loading…</p></div>;
  if(!profile) return <div style={{padding:"80px 32px",textAlign:"center"}}><p style={{fontFamily:"var(--font-mono)",color:"var(--ink-300)"}}>Could not load data.</p></div>;

  const years      = Object.keys(profile.scoresByYear).map(Number).sort((a,b)=>b-a);
  const row        = activeYear ? profile.scoresByYear[activeYear] as Record<string,unknown> : null;
  const rawSections= profile.rawSections as RawSection[];
  const imgCols    = Object.keys(row??{}).filter(k=>k.startsWith("img_")&&k.endsWith("_score"));
  const secs       = (kw:string[])=>getSections(rawSections,kw);

  function renderScores() {
    if(!row) return <Empty/>;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
          <KV label="NIRF Total"       value={row.img_total    !=null?(row.img_total    as number).toFixed(2):null} accent big/>
          <KV label="Student Strength" value={row.img_ss_score  !=null?(row.img_ss_score  as number).toFixed(2):null}/>
          <KV label="Faculty Ratio"    value={row.img_fsr_score !=null?(row.img_fsr_score as number).toFixed(2):null}/>
          <KV label="Perception"       value={row.img_pr_score  !=null?(row.img_pr_score  as number).toFixed(2):null}/>
        </div>
        <Card title="Parameter Breakdown">
          {imgCols.map(key=>(
            <ScoreBar key={key} label={SCORE_LABELS[key]??key.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()} score={row[key] as number|null} total={row[key.replace("_score","_total")] as number|null}/>
          ))}
        </Card>
        <Card title="Score Details">
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><th style={TH}>Parameter</th><th style={TH_R}>Score</th><th style={TH_R}>Max</th><th style={TH_R}>%</th></tr></thead>
              <tbody>
                {imgCols.map((key,i)=>{
                  const score=row[key] as number|null;const total=row[key.replace("_score","_total")] as number|null;
                  const pct=score!=null&&(total??100)>0?((score/(total??100))*100).toFixed(1)+"%":"—";
                  return(
                    <tr key={key} style={{borderBottom:"1px solid var(--border)",background:i%2===0?"transparent":"var(--off-white)",transition:"background 0.1s"}} {...rh(i)}>
                      <td style={TD}>{SCORE_LABELS[key]??key.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}</td>
                      <td style={{...TD_R,color:"var(--crimson)",fontWeight:600}}>{score?.toFixed(2)??"—"}</td>
                      <td style={{...TD_R,color:"var(--ink-400)"}}>{total?.toFixed(0)??"—"}</td>
                      <td style={TD_R}>{pct}</td>
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

  function renderIntake() {
    const sections=secs(TAB_SECTIONS.intake);
    if(!sections.length) return <Empty/>;
    const allRows=sections.flatMap(s=>s.metrics).filter(m=>!isWords(m.metric)&&!isBAD(m.value));
    const uniqueProgs=new Set(allRows.map(m=>m.program?.trim()).filter(Boolean));
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {row?.pdf_total_intake!=null&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
            <KV label="Total Intake" value={Number(row.pdf_total_intake).toLocaleString("en-IN")} accent/>
            <KV label="Programs" value={String(uniqueProgs.size)}/>
          </div>
        )}
        {sections.map(sec=>(
          <Card key={sec.section} title={sec.section}>
            <IntakePivotTable rows={sec.metrics}/>
          </Card>
        ))}
      </div>
    );
  }

  function renderStudents() {
    const sections=secs(TAB_SECTIONS.students);
    if(!sections.length) return <Empty/>;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {sections.map(sec=><Card key={sec.section} title="Student Strength"><GroupedTable rows={sec.metrics}/></Card>)}
      </div>
    );
  }

  function renderPlacement() {
    const sections=secs(TAB_SECTIONS.placement);
    if(!sections.length) return <Empty/>;
    const all=sections.flatMap(s=>s.metrics);
    const placed=all.find(m=>m.metric.toLowerCase().includes("students placed"))?.value;
    const salary=all.find(m=>m.metric.toLowerCase().includes("median salary"))?.value;
    const higher=all.find(m=>m.metric.toLowerCase().includes("higher studies")||m.metric.toLowerCase().includes("selected for higher"))?.value;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          <KV label="Students Placed" value={placed&&!isBAD(placed)?fmtNum(placed):null} accent/>
          <KV label="Median Salary"   value={salary&&!isBAD(salary)?fmtSalary(salary):null}/>
          <KV label="Higher Studies"  value={higher&&!isBAD(higher)?fmtNum(higher):null}/>
        </div>
        {sections.map(sec=><Card key={sec.section} title={sec.section}><GroupedTable rows={sec.metrics}/></Card>)}
      </div>
    );
  }

  function renderPhd() {
    const sections=secs(TAB_SECTIONS.phd);
    if(!sections.length) return <Empty/>;
    const all=sections.flatMap(s=>s.metrics);
    const ftTotal=all.find(m=>m.metric.toLowerCase().includes("full time students"))?.value;
    const ptTotal=all.find(m=>m.metric.toLowerCase().includes("part time students"))?.value;
    const ftGrad =all.find(m=>m.metric.toLowerCase().includes("full time graduated"))?.value;
    const ptGrad =all.find(m=>m.metric.toLowerCase().includes("part time graduated"))?.value;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          <KV label="FT Students"  value={ftTotal&&!isBAD(ftTotal)?fmtNum(ftTotal):null} accent/>
          <KV label="PT Students"  value={ptTotal&&!isBAD(ptTotal)?fmtNum(ptTotal):null}/>
          <KV label="FT Graduated" value={ftGrad &&!isBAD(ftGrad) ?fmtNum(ftGrad) :null}/>
          <KV label="PT Graduated" value={ptGrad &&!isBAD(ptGrad) ?fmtNum(ptGrad) :null}/>
        </div>
        {sections.map(sec=>{
          const pursuing =sec.metrics.filter(m=>m.program?.toLowerCase().includes("pursuing"));
          const graduated=sec.metrics.filter(m=>!m.program?.toLowerCase().includes("pursuing"));
          return (
            <Card key={sec.section} title={sec.section}>
              {pursuing.length>0&&(<><SLabel>Currently Enrolled</SLabel><GroupedTable rows={pursuing}/>{graduated.length>0&&<div style={{marginTop:16}}/>}</>)}
              {graduated.length>0&&(<><SLabel>Graduated (Previous 3 Years)</SLabel><MultiYearTable rows={graduated}/></>)}
            </Card>
          );
        })}
      </div>
    );
  }

  function renderResearch() {
    const sections=secs(TAB_SECTIONS.research);
    if(!sections.length) return <Empty/>;
    const all=sections.flatMap(s=>s.metrics).filter(m=>!isWords(m.metric));
    const sp =all.find(m=>m.metric.includes("Sponsored Projects"))?.value;
    const cp =all.find(m=>m.metric.includes("Consultancy Projects"))?.value;
    const edp=all.find(m=>m.metric.includes("Executive Development Programs")||m.metric.includes("Management Development"))?.value;
    const pax=all.find(m=>m.metric.includes("Participants"))?.value;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          <KV label="Sponsored Projects"   value={sp &&!isBAD(sp) ?fmtNum(sp) :null} accent/>
          <KV label="Consultancy Projects" value={cp &&!isBAD(cp) ?fmtNum(cp) :null}/>
          <KV label="EDP Programs"         value={edp&&!isBAD(edp)?fmtNum(edp):null}/>
          <KV label="EDP Participants"     value={pax&&!isBAD(pax)?fmtNum(pax):null}/>
        </div>
        {sections.map(sec=>(
          <Card key={sec.section} title={sec.section}>
            <MultiYearTable rows={sec.metrics} hideWords/>
            <WordsDisclosure metrics={sec.metrics}/>
          </Card>
        ))}
      </div>
    );
  }

  function renderFinancial() {
    const sections=secs(TAB_SECTIONS.financial);
    if(!sections.length) return <Empty/>;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {row&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            <KV label="Capital Expenditure (3yr Total)"     value={row.pdf_capital_expenditure    !=null?fmtAmt(String(row.pdf_capital_expenditure))    :null} accent/>
            <KV label="Operational Expenditure (3yr Total)" value={row.pdf_operational_expenditure!=null?fmtAmt(String(row.pdf_operational_expenditure)):null}/>
          </div>
        )}
        {sections.map(sec=>(
          <Card key={sec.section} title={sec.section}>
            <MultiYearTable rows={sec.metrics} hideWords/>
            <WordsDisclosure metrics={sec.metrics}/>
          </Card>
        ))}
      </div>
    );
  }

  function renderFaculty() {
    const sections=secs(TAB_SECTIONS.faculty);
    const count=sections.flatMap(s=>s.metrics).find(m=>m.metric.toLowerCase().includes("number of faculty"))?.value;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {count&&!isBAD(count)&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}><KV label="Faculty Members" value={fmtNum(count)} accent/></div>)}
        {sections.length>0?sections.map(sec=><Card key={sec.section} title="Faculty Details"><GroupedTable rows={sec.metrics}/></Card>):<Empty/>}
      </div>
    );
  }

  function renderFacilities() {
    const sections=secs(TAB_SECTIONS.facilities);
    if(!sections.length) return <Empty/>;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {sections.map(sec=>(
          <Card key={sec.section} title="PCS Facilities — Physically Challenged Students">
            {sec.metrics.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"12px 0",borderBottom:i<sec.metrics.length-1?"1px solid var(--border)":"none"}}>
                <span style={{fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)",flex:1,lineHeight:1.5}}>{m.metric}</span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",flexShrink:0,padding:"3px 10px",color:m.value.toLowerCase().startsWith("yes")?"var(--teal)":"var(--crimson)",background:m.value.toLowerCase().startsWith("yes")?"var(--teal-pale)":"var(--crimson-pale)",border:`1px solid ${m.value.toLowerCase().startsWith("yes")?"rgba(26,122,110,0.2)":"rgba(192,57,43,0.2)"}`}}>{m.value}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }

  const tabRender: Record<TabId,()=>React.ReactNode> = {
    scores:renderScores,intake:renderIntake,students:renderStudents,
    placement:renderPlacement,phd:renderPhd,research:renderResearch,
    financial:renderFinancial,faculty:renderFaculty,facilities:renderFacilities,
  };

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 20px 64px"}}>
      {/* Hero */}
      <div style={{background:"var(--white)",border:"1px solid var(--border)",padding:"24px 28px",marginBottom:20,boxShadow:"var(--shadow-sm)"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <span style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",background:"var(--crimson-pale)",border:"1px solid rgba(192,57,43,0.2)",padding:"2px 8px",marginBottom:10,display:"inline-block"}}>
              {profile.categories.join(" · ")}
            </span>
            <h1 style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"clamp(1.3rem,3vw,1.9rem)",color:"var(--ink-900)",lineHeight:1.2,marginBottom:5}}>{profile.institute_name}</h1>
            <p style={{fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-300)"}}>{profile.institute_code}</p>
          </div>
          {row?.img_total!=null&&(
            <div style={{textAlign:"right",flexShrink:0}}>
              <p style={{fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"3.2rem",color:"var(--crimson)",lineHeight:1,marginBottom:3}}>{(row.img_total as number).toFixed(2)}</p>
              <p style={{fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-300)"}}>NIRF Total Score</p>
            </div>
          )}
        </div>
        {years.length>0&&(
          <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-300)",marginRight:4}}>Ranking Year</span>
            {years.map(y=>(
              <button key={y} onClick={()=>setActiveYear(y)} style={{fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"3px 11px",background:activeYear===y?"var(--crimson)":"var(--white)",color:activeYear===y?"var(--white)":"var(--ink-500)",border:`1px solid ${activeYear===y?"var(--crimson)":"var(--border)"}`,cursor:"pointer",transition:"all 0.15s"}}>{y}</button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"2px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{fontFamily:"var(--font-body)",fontWeight:activeTab===tab.id?600:400,fontSize:"0.78rem",padding:"9px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid var(--crimson)":"2px solid transparent",marginBottom:"-2px",color:activeTab===tab.id?"var(--crimson)":"var(--ink-400)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:"0.7rem",opacity:0.7}}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div key={`${activeTab}-${activeYear}`} style={{animation:"fadeIn 0.18s ease both"}}>
        {tabRender[activeTab]()}
      </div>
    </div>
  );
}