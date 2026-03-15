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






































"use client";
import React, { useEffect, useState } from "react";
import type { SearchHit } from "@/app/page";
import type { InstituteProfileResponse } from "@/types/nirf";
import { SCORE_LABELS } from "@/types/nirf";

interface Props { hit: SearchHit; }
interface RawMetric { metric: string; year: string; value: string; ranking_year: number; program: string; }
interface RawSection { section: string; metrics: RawMetric[]; }
type TabId = "scores"|"intake"|"placement"|"phd"|"students"|"research"|"financial"|"faculty"|"facilities";

const TABS: {id:TabId;label:string;icon:string}[] = [
  {id:"scores",    label:"NIRF Scores",  icon:"★"},
  {id:"intake",    label:"Intake",       icon:"⊕"},
  {id:"placement", label:"Placement",    icon:"↗"},
  {id:"phd",       label:"PhD",          icon:"⚗"},
  {id:"students",  label:"Students",     icon:"◎"},
  {id:"research",  label:"Research",     icon:"◈"},
  {id:"financial", label:"Financial",    icon:"₹"},
  {id:"faculty",   label:"Faculty",      icon:"✦"},
  {id:"facilities",label:"Facilities",   icon:"⌂"},
];

// ─── Year helpers ─────────────────────────────────────────────────────────────

const BAD_YEAR = new Set(["", "nan", "<na>", "null", "undefined", "none"]);

// A year is "real" if it looks like YYYY-YY (with or without a suffix like "Graduation Year")
function isRealYear(y: string | null | undefined): boolean {
  const v = (y ?? "").trim();
  return !BAD_YEAR.has(v.toLowerCase()) && /^\d{4}-\d{2}/.test(v);
}

// Strip suffix: "2023-24 (Graduation Year)" → "2023-24"
function baseYear(y: string): string {
  return y.trim().match(/^(\d{4}-\d{2})/)?.[1] ?? y.trim();
}

// ─── Value helpers ────────────────────────────────────────────────────────────

const BAD_VAL = new Set(["nan", "<na>", "null", "undefined", "n/a", "na", ""]);
const isBAD = (v: string | null | undefined) => BAD_VAL.has((v ?? "").trim().toLowerCase());
const cl = (v: string | null | undefined): string => isBAD(v) ? "" : (v ?? "").trim();

// A value is genuinely empty (dash or bad) — show as "—" in table
function isEmpty(v: string | null | undefined): boolean {
  const s = (v ?? "").trim();
  return s === "" || s === "-" || isBAD(s);
}

function fmtN(v: string): string {
  const n = Number(v.replace(/,/g, ""));
  return isNaN(n) ? v : n.toLocaleString("en-IN");
}
function fmtSal(v: string): string {
  const n = Number(v.replace(/,/g, ""));
  return isNaN(n) ? v : `₹${(n / 100_000).toFixed(1)}L`;
}
function fmtCr(v: string): string {
  const n = Number(v.replace(/,/g, ""));
  if (isNaN(n)) return v;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtV(v: string, metric: string): string {
  if (!v) return "—";
  const m = metric.toLowerCase();
  if (m.includes("salary") || m.includes("median")) return fmtSal(v);
  if ((m.includes("amount") || m.includes("expenditure")) && !m.includes("words")) return fmtCr(v);
  return fmtN(v);
}

function groupBy<T>(arr: T[], fn: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of arr) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
  return m;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TH: React.CSSProperties = { fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-400)",padding:"8px 14px",textAlign:"left",borderBottom:"2px solid var(--border)",background:"var(--off-white)",whiteSpace:"nowrap" };
const THR: React.CSSProperties = { ...TH, textAlign:"right" };
const TD: React.CSSProperties = { padding:"8px 14px",color:"var(--ink-700)",verticalAlign:"middle",fontSize:"0.78rem" };
const TDM: React.CSSProperties = { ...TD, color:"var(--ink-400)",fontFamily:"var(--font-mono)",fontSize:"0.68rem" };
const TDR: React.CSSProperties = { ...TD, textAlign:"right",fontFamily:"var(--font-mono)" };

function rh(i: number) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "var(--crimson-pale)"; },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = i % 2 ? "var(--off-white)" : "transparent"; },
  };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function KV({ label, value, accent, big }: { label: string; value?: string | null; accent?: boolean; big?: boolean }) {
  return (
    <div style={{ background:accent?"var(--crimson-pale)":"var(--off-white)",border:`1px solid ${accent?"rgba(192,57,43,0.18)":"var(--border)"}`,padding:"14px 16px" }}>
      <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.09em",color:accent?"var(--crimson)":"var(--ink-500)",marginBottom:5 }}>{label}</p>
      <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:big?"1.9rem":"1.35rem",color:accent?"var(--crimson-dark)":"var(--ink-900)",lineHeight:1 }}>{value || "—"}</p>
    </div>
  );
}

function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div style={{ background:"var(--white)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",marginBottom:14,overflow:"hidden",padding:noPad?0:"20px 24px" }}>
      {title && <h3 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"1rem",color:"var(--ink-900)",margin:0,padding:noPad?"16px 24px 14px":"0 0 8px",borderBottom:"1px solid var(--border)",marginBottom:14 }}>{title}</h3>}
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)" }}>{children}</p>;
}

function Empty({ msg = "No data available." }: { msg?: string }) {
  return <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.75rem",color:"var(--ink-300)",padding:"20px 0" }}>{msg}</p>;
}

function ScoreBar({ label, score, total }: { label: string; score: number | null; total: number | null }) {
  const pct = score != null && (total ?? 100) > 0 ? Math.min((score / (total ?? 100)) * 100, 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
        <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)" }}>{label}</span>
        <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-400)" }}>{score?.toFixed(2)??"—"} / {total?.toFixed(0)??"—"}</span>
      </div>
      <div style={{ height:5,background:"var(--border)" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:"var(--crimson)",transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}

// ─── YearPivotTable ───────────────────────────────────────────────────────────
// Universal pivot table: rows = metrics/programs, columns = sorted academic years.
// yearVals maps baseYear → value string (may be "" meaning no data → show "—").

interface PivotRow {
  label: string;
  subLabel?: string;
  // Map of baseYear → display value. Key exists if year was present in data (even if value is "—").
  yearVals: Record<string, string>;
  isSal?: boolean;
  isAmt?: boolean;
  isBold?: boolean;
}

function YearPivotTable({ rows, years, col1 = "Metric" }: {
  rows: PivotRow[];
  years: string[];   // sorted ascending base years e.g. ["2020-21","2021-22","2022-23","2023-24"]
  col1?: string;
}) {
  if (!rows.length) return <Empty />;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%",borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH, minWidth:220 }}>{col1}</th>
            {years.map(yr => <th key={yr} style={THR}>{yr}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.label}${i}`} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent",transition:"background 0.1s" }} {...rh(i)}>
              <td style={row.isBold ? { ...TD, fontWeight:700 } : TD}>
                {row.label}
                {row.subLabel && <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.65rem",color:"var(--ink-300)",marginLeft:6 }}>{row.subLabel}</span>}
              </td>
              {years.map(yr => {
                const val = row.yearVals[yr];
                // val === undefined → year not in data at all (shouldn't happen if years is built correctly)
                // val === "" → year exists but value is "-" or empty → show "—" in muted style
                // val has content → format and show
                const hasVal = val && val !== "";
                let d = "—";
                if (hasVal) {
                  if (row.isSal) d = fmtSal(val);
                  else if (row.isAmt) d = fmtCr(val);
                  else d = fmtN(val);
                }
                return (
                  <td key={yr} style={{
                    ...TDR,
                    color: hasVal ? (row.isBold ? "var(--crimson-dark)" : "var(--ink-700)") : "var(--ink-100)",
                    fontWeight: row.isBold && hasVal ? 700 : 400,
                    background: row.isBold && hasVal ? "var(--crimson-pale)" : undefined,
                  }}>
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

// ─── Collapsible program group ────────────────────────────────────────────────

function PGroup({ label, children, open: init = true }: { label: string; children: React.ReactNode; open?: boolean }) {
  const [o, setO] = useState(init);
  return (
    <div style={{ marginBottom:14,border:"1px solid var(--border)",overflow:"hidden" }}>
      <button onClick={() => setO(x => !x)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"var(--off-white)",border:"none",cursor:"pointer",fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.82rem",color:"var(--crimson-dark)",textAlign:"left",borderBottom:o?"1px solid var(--border)":"none" }}>
        <span>{label}</span>
        <span style={{ fontSize:"0.65rem",color:"var(--ink-400)",transform:o?"rotate(90deg)":"none",transition:"transform 0.2s" }}>▶</span>
      </button>
      {o && <div style={{ padding:"16px 20px",background:"var(--white)" }}>{children}</div>}
    </div>
  );
}

// ─── SCORES ───────────────────────────────────────────────────────────────────

function TabScores({ row, imgCols }: { row: Record<string, unknown>; imgCols: string[] }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
        <KV label="NIRF Total"       value={row.img_total    != null ? (row.img_total    as number).toFixed(2) : null} accent big />
        <KV label="Student Strength" value={row.img_ss_score != null ? (row.img_ss_score as number).toFixed(2) : null} />
        <KV label="Faculty Ratio"    value={row.img_fsr_score!= null ? (row.img_fsr_score as number).toFixed(2): null} />
        <KV label="Perception"       value={row.img_pr_score != null ? (row.img_pr_score as number).toFixed(2) : null} />
      </div>
      <Card title="Parameter Breakdown">
        {imgCols.map(k => (
          <ScoreBar key={k}
            label={SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}
            score={row[k] as number|null}
            total={row[k.replace("_score","_total")] as number|null}
          />
        ))}
      </Card>
      <Card title="Score Details" noPad>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr><th style={TH}>Parameter</th><th style={THR}>Score</th><th style={THR}>Max</th><th style={THR}>%</th></tr></thead>
            <tbody>
              {imgCols.map((k, i) => {
                const s = row[k] as number|null, t = row[k.replace("_score","_total")] as number|null;
                const p = s != null && (t ?? 100) > 0 ? ((s / (t ?? 100)) * 100).toFixed(1) + "%" : "—";
                return (
                  <tr key={k} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
                    <td style={TD}>{SCORE_LABELS[k] ?? k.replace("img_","").replace("_score","").replace(/_/g," ").toUpperCase()}</td>
                    <td style={{ ...TDR, color:"var(--crimson)",fontWeight:600 }}>{s?.toFixed(2)??"—"}</td>
                    <td style={{ ...TDR, color:"var(--ink-400)" }}>{t?.toFixed(0)??"—"}</td>
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

// ─── INTAKE ───────────────────────────────────────────────────────────────────
// Fix: ALL year rows for a program define the columns (including "-" value rows).
// The year column is always present in the data (e.g. "2019-20", "2020-21"...).
// Rows with "-" value show "—" in the cell, NOT hidden.

function TabIntake({ metrics }: { metrics: RawMetric[] }) {
  // Only keep rows that have a real year label (filter junk like <NA>)
  const valid = metrics.filter(r => !isBAD(r.program) && isRealYear(r.year));
  if (!valid.length) return <Empty msg="No intake data." />;

  // Group by program
  const pm = groupBy(valid, r => cl(r.program));
  const allP = Array.from(pm.keys());
  const ugP = allP.filter(p => p.toUpperCase().startsWith("UG"));
  const pgP = allP.filter(p => p.toUpperCase().startsWith("PG") || p.toUpperCase().startsWith("PG-"));
  const otP = allP.filter(p => !ugP.includes(p) && !pgP.includes(p));

  // Collect ALL real years across all programs (even those with "-" values)
  const yearSet = new Set<string>();
  for (const rows of pm.values()) {
    for (const r of rows) {
      if (isRealYear(r.year)) yearSet.add(baseYear(r.year));
    }
  }
  const years = Array.from(yearSet).sort();

  function mkRows(progs: string[]): PivotRow[] {
    return progs.map(p => {
      const yearVals: Record<string, string> = {};
      for (const r of pm.get(p)!) {
        if (!isRealYear(r.year)) continue;
        const yr = baseYear(r.year);
        // If value is "-" or bad → store "" (will show as "—" in cell)
        yearVals[yr] = isEmpty(r.value) ? "" : cl(r.value);
      }
      return { label: p, yearVals };
    });
  }

  // Grand total: only sum real numeric values per year
  const totalYearVals: Record<string, string> = {};
  for (const yr of years) {
    let sum = 0, hasAny = false;
    for (const rows of pm.values()) {
      const r = rows.find(x => isRealYear(x.year) && baseYear(x.year) === yr);
      if (!r) continue;
      const n = Number((cl(r.value) || "").replace(/,/g, ""));
      if (!isNaN(n) && n > 0) { sum += n; hasAny = true; }
    }
    totalYearVals[yr] = hasAny ? String(sum) : "";
  }

  const latestYear = years.at(-1);
  const grandTotal = latestYear && totalYearVals[latestYear] ? Number(totalYearVals[latestYear]) : 0;

  return (
    <div>
      {grandTotal > 0 && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20 }}>
          <KV label={`Grand Total (${latestYear})`} value={fmtN(String(grandTotal))} accent />
          {ugP.length > 0 && <KV label="UG Programs" value={String(ugP.length)} />}
          {pgP.length > 0 && <KV label="PG Programs" value={String(pgP.length)} />}
        </div>
      )}

      {ugP.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <SH>Undergraduate Programs</SH>
          <YearPivotTable rows={mkRows(ugP)} years={years} col1="Program" />
        </div>
      )}
      {pgP.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <SH>Postgraduate Programs</SH>
          <YearPivotTable rows={mkRows(pgP)} years={years} col1="Program" />
        </div>
      )}
      {otP.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <SH>Other Programs</SH>
          <YearPivotTable rows={mkRows(otP)} years={years} col1="Program" />
        </div>
      )}

      {years.length > 0 && allP.length > 1 && (
        <div style={{ overflowX:"auto",borderTop:"2px solid var(--border)" }}>
          <YearPivotTable
            rows={[{ label:"Grand Total", yearVals: totalYearVals, isBold: true }]}
            years={years}
            col1=""
          />
        </div>
      )}
    </div>
  );
}

// ─── PLACEMENT ────────────────────────────────────────────────────────────────

function TabPlacement({ metrics }: { metrics: RawMetric[] }) {
  const valid = metrics.filter(r =>
    !isBAD(r.program) && !isBAD(r.metric) &&
    !r.metric.toLowerCase().includes("in words") &&
    isRealYear(r.year)
  );
  if (!valid.length) return <Empty />;

  const pm = groupBy(valid, r => cl(r.program));
  const allP = Array.from(pm.keys());
  const ugP   = allP.filter(p => p.toUpperCase().startsWith("UG") && !p.toUpperCase().includes("PG-INT"));
  const pgIP  = allP.filter(p => p.toUpperCase().startsWith("PG-INT") || p.toLowerCase().includes("integrated"));
  const pgP   = allP.filter(p => p.toUpperCase().startsWith("PG") && !pgIP.includes(p) && !ugP.includes(p));
  const otP   = allP.filter(p => !ugP.includes(p) && !pgP.includes(p) && !pgIP.includes(p));

  function PBlock({ prog }: { prog: string }) {
    const rows = pm.get(prog)!;

    // Collect all real years for this program
    const yearSet = new Set<string>();
    for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
    const years = Array.from(yearSet).sort();

    // Build pivot rows grouped by metric
    const mm = groupBy(rows, r => cl(r.metric));
    const pivotRows: PivotRow[] = Array.from(mm.entries()).map(([metric, mrows]) => {
      const yearVals: Record<string, string> = {};
      for (const r of mrows) {
        if (!isRealYear(r.year)) continue;
        const yr = baseYear(r.year);
        yearVals[yr] = isEmpty(r.value) ? "" : cl(r.value);
      }
      return {
        label: metric,
        yearVals,
        isSal: metric.toLowerCase().includes("salary") || metric.toLowerCase().includes("median"),
      };
    }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

    if (!pivotRows.length || !years.length) return <Empty msg="No data for this program." />;

    // Summary KVs using latest year
    const latestYr = years.at(-1) ?? "";
    const findVal = (kw: string) => {
      const r = pivotRows.find(r => r.label.toLowerCase().includes(kw));
      return r?.yearVals[latestYr] || undefined;
    };
    const placed = findVal("students placed");
    const salary = pivotRows.find(r => r.isSal)?.yearVals[latestYr];
    const higher = findVal("higher studies") ?? findVal("selected for higher");

    return (
      <div>
        {(placed || salary || higher) && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:14 }}>
            {placed && <KV label={`Placed (${latestYr})`} value={fmtN(placed)} accent />}
            {salary && <KV label={`Median Salary (${latestYr})`} value={fmtSal(salary)} />}
            {higher && <KV label={`Higher Studies (${latestYr})`} value={fmtN(higher)} />}
          </div>
        )}
        <YearPivotTable rows={pivotRows} years={years} />
      </div>
    );
  }

  function RG({ progs, label, open = true }: { progs: string[]; label: string; open?: boolean }) {
    if (!progs.length) return null;
    return (
      <PGroup label={`${label} (${progs.length} program${progs.length > 1 ? "s" : ""})`} open={open}>
        {progs.map((p, i) => (
          <div key={p}>
            {progs.length > 1 && (
              <div style={{ fontFamily:"var(--font-body)",fontWeight:600,fontSize:"0.78rem",color:"var(--crimson-dark)",margin:i===0?"0 0 10px":"20px 0 10px",paddingBottom:6,borderBottom:"1px dashed var(--border)" }}>
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
      <RG progs={ugP}  label="Undergraduate Programs" open={true} />
      <RG progs={pgP}  label="Postgraduate Programs"  open={true} />
      <RG progs={pgIP} label="PG-Integrated Programs" open={false} />
      <RG progs={otP}  label="Other Programs"         open={false} />
    </div>
  );
}

// ─── PhD ──────────────────────────────────────────────────────────────────────
// Fix 1: "Pursuing" section shows the program label which contains the cutoff
//         year e.g. "Ph.D (Student pursuing doctoral program till 2023-24)"
// Fix 2: Year column for pursuing is "-" (no year axis) — show as single value table.
// Fix 3: Graduated section uses real year values from the year column.

function TabPhd({ metrics }: { metrics: RawMetric[] }) {
  if (!metrics.length) return <Empty />;

  // Pursuing: program contains "pursuing", year is "-"
  const pursuing  = metrics.filter(r => r.program.toLowerCase().includes("pursuing"));
  // Graduated: program contains "graduated", year is real
  const graduated = metrics.filter(r => r.program.toLowerCase().includes("graduated") && isRealYear(r.year));

  // For pursuing: group by program (captures the cutoff label), then show metrics
  const pursuingByProg = groupBy(pursuing, r => cl(r.program));

  // KV summary from pursuing
  const ftVal = pursuing.find(r => r.metric.toLowerCase().includes("full time"))?.value;
  const ptVal = pursuing.find(r => r.metric.toLowerCase().includes("part time"))?.value;

  // Graduated pivot
  const yearSet = new Set<string>();
  for (const r of graduated) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
  const gradYears = Array.from(yearSet).sort();

  const gradMM = groupBy(graduated, r => cl(r.metric));
  const gradRows: PivotRow[] = Array.from(gradMM.entries()).map(([metric, mrows]) => {
    const yearVals: Record<string, string> = {};
    for (const r of mrows) {
      if (!isRealYear(r.year)) continue;
      yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
    }
    return { label: metric, yearVals };
  }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

      {/* Summary KVs */}
      {(ftVal || ptVal) && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
          {ftVal && !isEmpty(ftVal) && <KV label="Full Time Students" value={fmtN(cl(ftVal))} accent />}
          {ptVal && !isEmpty(ptVal) && <KV label="Part Time Students" value={fmtN(cl(ptVal))} />}
        </div>
      )}

      {/* Currently Enrolled — one card per pursuing program (shows cutoff year in title) */}
      {Array.from(pursuingByProg.entries()).map(([prog, rows]) => (
        <Card key={prog} title="Currently Enrolled" noPad>
          {/* Show program label as subtitle — it contains "till 2023-24" */}
          <div style={{ padding:"10px 16px 0",fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"var(--ink-400)",fontStyle:"italic" }}>
            {prog}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Category</th>
                  <th style={THR}>Total Students</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => !isBAD(r.metric)).map((r, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
                    <td style={TD}>{r.metric}</td>
                    <td style={{ ...TDR, fontWeight:600, color:"var(--ink-700)" }}>
                      {isEmpty(r.value) ? "—" : fmtN(cl(r.value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Graduated — Previous 3 Years */}
      {gradRows.length > 0 && gradYears.length > 0 && (
        <Card title="Graduated — Previous 3 Years" noPad>
          <YearPivotTable rows={gradRows} years={gradYears} col1="Category" />
        </Card>
      )}
    </div>
  );
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

function TabStudents({ metrics }: { metrics: RawMetric[] }) {
  const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
  if (!valid.length) return <Empty />;
  const pm = groupBy(valid, r => cl(r.program) || "All Programs");
  return (
    <Card title="Total Student Strength" noPad>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{ ...TH,minWidth:180 }}>Program</th>
              <th style={TH}>Metric</th>
              <th style={THR}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(pm.entries()).flatMap(([prog, rows], gi) =>
              rows.map((r, i) => (
                <tr key={`${prog}${i}`} style={{ borderBottom:"1px solid var(--border)",background:(gi+i)%2?"var(--off-white)":"transparent" }} {...rh(gi+i)}>
                  {i === 0 ? <td style={{ ...TDM,verticalAlign:"top" }} rowSpan={rows.length}>{prog}</td> : null}
                  <td style={TD}>{r.metric}</td>
                  <td style={TDR}>{fmtN(cl(r.value))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── RESEARCH ────────────────────────────────────────────────────────────────

function ResBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
  const valid = metrics.filter(r =>
    !isBAD(r.value) && r.value !== "nan" &&
    !r.metric.toLowerCase().includes("in words") &&
    !isBAD(r.metric) && isRealYear(r.year)
  );
  if (!valid.length) return null;

  const pm = groupBy(valid, r => cl(r.program) || "All Programs");
  const multi = pm.size > 1;

  const yearSet = new Set<string>();
  for (const rows of pm.values()) {
    for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
  }
  const years = Array.from(yearSet).sort();
  if (!years.length) return null;

  const rows: PivotRow[] = Array.from(pm.entries()).flatMap(([prog, prows]) => {
    const mm = groupBy(prows, r => cl(r.metric));
    return Array.from(mm.entries()).map(([metric, mrows]) => {
      const yearVals: Record<string, string> = {};
      for (const r of mrows) {
        if (!isRealYear(r.year)) continue;
        yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
      }
      return {
        label: multi ? prog : metric,
        subLabel: multi ? metric : undefined,
        yearVals,
        isAmt: metric.toLowerCase().includes("amount"),
      };
    }).filter(r => Object.values(r.yearVals).some(v => v !== ""));
  });

  if (!rows.length) return null;

  return (
    <Card title={title} noPad>
      <YearPivotTable rows={rows} years={years} />
    </Card>
  );
}

function TabResearch({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
  const get = (kw: string) => sections
    .filter(s => s.section.toLowerCase().includes(kw))
    .flatMap(s => s.metrics)
    .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

  const sr = get("sponsored research"), co = get("consultancy"), edp = get("executive development");
  if (!sr.length && !co.length && !edp.length) return <Empty />;

  return (
    <div>
      {row && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:16 }}>
          {row.pdf_sponsored_projects  != null && <KV label="Sponsored Projects (3yr)"  value={Number(row.pdf_sponsored_projects).toLocaleString("en-IN")}  accent />}
          {row.pdf_consultancy_projects!= null && <KV label="Consultancy Projects (3yr)" value={Number(row.pdf_consultancy_projects).toLocaleString("en-IN")} />}
          {row.pdf_edp_participants    != null && <KV label="EDP Participants (3yr)"     value={Number(row.pdf_edp_participants).toLocaleString("en-IN")}     />}
        </div>
      )}
      {sr.length  > 0 && <ResBlock metrics={sr}  title="Sponsored Research Details" />}
      {co.length  > 0 && <ResBlock metrics={co}  title="Consultancy Project Details" />}
      {edp.length > 0 && <ResBlock metrics={edp} title="Executive Development Programs" />}
    </div>
  );
}

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

function FinBlock({ metrics, title }: { metrics: RawMetric[]; title: string }) {
  const nums = metrics.filter(r =>
    !r.metric.toLowerCase().includes("in words") && isRealYear(r.year)
  );
  if (!nums.length) return null;

  const pm = groupBy(nums, r => cl(r.program) || "General");

  const yearSet = new Set<string>();
  for (const rows of pm.values()) {
    for (const r of rows) { if (isRealYear(r.year)) yearSet.add(baseYear(r.year)); }
  }
  const years = Array.from(yearSet).sort();
  if (!years.length) return null;

  const rows: PivotRow[] = Array.from(pm.entries()).map(([prog, prows]) => {
    const yearVals: Record<string, string> = {};
    for (const r of prows) {
      if (!isRealYear(r.year)) continue;
      yearVals[baseYear(r.year)] = isEmpty(r.value) ? "" : cl(r.value);
    }
    return { label: prog, yearVals, isAmt: true };
  }).filter(r => Object.values(r.yearVals).some(v => v !== ""));

  // Total row
  const totalYearVals: Record<string, string> = {};
  for (const yr of years) {
    let s = 0, hasAny = false;
    for (const r of rows) {
      const n = Number((r.yearVals[yr] ?? "").replace(/,/g, ""));
      if (!isNaN(n) && n > 0) { s += n; hasAny = true; }
    }
    totalYearVals[yr] = hasAny ? String(s) : "";
  }

  return (
    <Card title={title} noPad>
      <YearPivotTable
        rows={[...rows, { label:"Total", yearVals:totalYearVals, isAmt:true, isBold:true }]}
        years={years}
        col1="Line Item"
      />
    </Card>
  );
}

function TabFinancial({ sections, ry, row }: { sections: RawSection[]; ry: number; row: Record<string, unknown> | null }) {
  const get = (kw: string) => sections
    .filter(s => s.section.toLowerCase().includes(kw))
    .flatMap(s => s.metrics)
    .filter(m => !ry || m.ranking_year === ry || m.ranking_year === 0);

  const cap = get("capital expenditure"), ops = get("operational expenditure");
  if (!cap.length && !ops.length) return <Empty />;

  return (
    <div>
      {row && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:16 }}>
          {row.pdf_capital_expenditure     != null && <KV label="Capital Expenditure (3yr Sum)"     value={fmtCr(String(row.pdf_capital_expenditure))}     accent />}
          {row.pdf_operational_expenditure != null && <KV label="Operational Expenditure (3yr Sum)" value={fmtCr(String(row.pdf_operational_expenditure))} />}
        </div>
      )}
      {cap.length > 0 && <FinBlock metrics={cap} title="Capital Expenditure" />}
      {ops.length > 0 && <FinBlock metrics={ops} title="Operational Expenditure" />}
    </div>
  );
}

// ─── FACULTY ──────────────────────────────────────────────────────────────────

function TabFaculty({ metrics }: { metrics: RawMetric[] }) {
  const valid = metrics.filter(r => !isBAD(r.value) && !isBAD(r.metric));
  if (!valid.length) return <Empty />;
  return (
    <Card title="Faculty Details" noPad>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr><th style={TH}>Metric</th><th style={THR}>Value</th></tr></thead>
          <tbody>
            {valid.map((r, i) => (
              <tr key={i} style={{ borderBottom:"1px solid var(--border)",background:i%2?"var(--off-white)":"transparent" }} {...rh(i)}>
                <td style={TD}>{r.metric}</td>
                <td style={TDR}>{fmtN(cl(r.value))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── FACILITIES ───────────────────────────────────────────────────────────────

function TabFacilities({ metrics }: { metrics: RawMetric[] }) {
  const valid = metrics.filter(r => !isBAD(r.metric));
  if (!valid.length) return <Empty />;
  return (
    <Card title="PCS Facilities — Physically Challenged Students">
      {valid.map((r, i) => {
        const yes = r.value.toLowerCase().startsWith("yes");
        return (
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,padding:"12px 0",borderBottom:i<valid.length-1?"1px solid var(--border)":"none" }}>
            <span style={{ fontFamily:"var(--font-body)",fontSize:"0.78rem",color:"var(--ink-700)",flex:1,lineHeight:1.5 }}>{r.metric}</span>
            <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",flexShrink:0,padding:"3px 10px",color:yes?"var(--teal)":"var(--crimson)",background:yes?"var(--teal-pale)":"var(--crimson-pale)",border:`1px solid ${yes?"rgba(26,122,110,0.2)":"rgba(192,57,43,0.2)"}` }}>
              {r.value}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

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
        const ys = Object.keys(d.scoresByYear).map(Number).sort((a, b) => b - a);
        setActiveYear(ys[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hit.institute_code]);

  if (loading) return (
    <div style={{ padding:"80px 32px",textAlign:"center" }}>
      <p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)",fontSize:"0.8rem" }}>Loading…</p>
    </div>
  );
  if (!profile) return (
    <div style={{ padding:"80px 32px",textAlign:"center" }}>
      <p style={{ fontFamily:"var(--font-mono)",color:"var(--ink-300)" }}>Could not load data.</p>
    </div>
  );

  const allYears    = Object.keys(profile.scoresByYear).map(Number).sort((a, b) => b - a);
  const row         = activeYear ? profile.scoresByYear[activeYear] as Record<string, unknown> : null;
  const rawSections = profile.rawSections as RawSection[];
  const imgCols     = Object.keys(row ?? {}).filter(k => k.startsWith("img_") && k.endsWith("_score"));
  const ry          = activeYear ?? new Date().getFullYear();

  function sm(kw: string): RawMetric[] {
    return rawSections
      .filter(s => s.section.toLowerCase().includes(kw.toLowerCase()))
      .flatMap(s => s.metrics)
      .filter(m => !activeYear || m.ranking_year === activeYear || m.ranking_year === 0);
  }

  const tabs: Record<TabId, React.ReactNode> = {
    scores:    row ? <TabScores row={row} imgCols={imgCols} /> : <Empty />,
    intake:    <TabIntake    metrics={sm("sanctioned")} />,
    placement: <TabPlacement metrics={sm("placement")} />,
    phd:       <TabPhd       metrics={sm("ph.d")} />,
    students:  <TabStudents  metrics={[...sm("total actual"), ...sm("student strength")]} />,
    research:  <TabResearch  sections={rawSections} ry={ry} row={row} />,
    financial: <TabFinancial sections={rawSections} ry={ry} row={row} />,
    faculty:   <TabFaculty   metrics={sm("faculty")} />,
    facilities:<TabFacilities metrics={[...sm("pcs"), ...sm("physically challenged")]} />,
  };

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",padding:"28px 20px 64px" }}>

      {/* Hero */}
      <div style={{ background:"var(--white)",border:"1px solid var(--border)",padding:"24px 28px",marginBottom:20,boxShadow:"var(--shadow-sm)" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap" }}>
          <div style={{ flex:1,minWidth:200 }}>
            <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--crimson)",background:"var(--crimson-pale)",border:"1px solid rgba(192,57,43,0.2)",padding:"2px 8px",marginBottom:10,display:"inline-block" }}>
              {profile.categories.join(" · ")}
            </span>
            <h1 style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"clamp(1.3rem,3vw,1.9rem)",color:"var(--ink-900)",lineHeight:1.2,marginBottom:5 }}>
              {profile.institute_name}
            </h1>
            <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.7rem",color:"var(--ink-300)" }}>{profile.institute_code}</p>
          </div>
          {row?.img_total != null && (
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <p style={{ fontFamily:"var(--font-display)",fontStyle:"italic",fontSize:"3.2rem",color:"var(--crimson)",lineHeight:1,marginBottom:3 }}>
                {(row.img_total as number).toFixed(2)}
              </p>
              <p style={{ fontFamily:"var(--font-mono)",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--ink-300)" }}>
                NIRF Total Score
              </p>
            </div>
          )}
        </div>
        {allYears.length > 0 && (
          <div style={{ marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--ink-300)",marginRight:4 }}>
              Ranking Year
            </span>
            {allYears.map(y => (
              <button key={y} onClick={() => setActiveYear(y)} style={{ fontFamily:"var(--font-mono)",fontSize:"0.72rem",padding:"3px 11px",background:activeYear===y?"var(--crimson)":"var(--white)",color:activeYear===y?"var(--white)":"var(--ink-500)",border:`1px solid ${activeYear===y?"var(--crimson)":"var(--border)"}`,cursor:"pointer",transition:"all 0.15s" }}>
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"2px solid var(--border)",marginBottom:20,overflowX:"auto" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily:"var(--font-body)",fontWeight:activeTab===tab.id?600:400,fontSize:"0.78rem",padding:"9px 16px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid var(--crimson)":"2px solid transparent",marginBottom:"-2px",color:activeTab===tab.id?"var(--crimson)":"var(--ink-400)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5 }}>
            <span style={{ fontSize:"0.7rem",opacity:0.7 }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div key={`${activeTab}-${activeYear}`} style={{ animation:"fadeIn 0.18s ease both" }}>
        {tabs[activeTab]}
      </div>
    </div>
  );
}