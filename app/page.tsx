// import DownloaderForm from "./components/downloader-form";

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-2xl mx-auto">

//         <DownloaderForm />
//       </div>
//     </main>
//   );
// }

// "use client";
// import { useState, useCallback, useRef } from "react";
// import SearchBar       from "@/app/components/SearchBar";
// import SearchResults   from "@/app/components/SearchResults";
// import InstituteDetail from "@/app/components/InstituteDetail";

// export interface SearchHit {
//   institute_code: string;
//   institute_name: string;
//   category:       string;
//   best_year:      number;
//   img_total:      number | null;
// }

// export default function HomePage() {
//   const [hits, setHits]           = useState<SearchHit[]>([]);
//   const [loading, setLoading]     = useState(false);
//   const [selected, setSelected]   = useState<SearchHit | null>(null);
//   const [query, setQuery]         = useState("");
//   const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const handleQueryChange = useCallback((q: string) => {
//     setQuery(q);
//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     if (q.trim().length < 2) {
//       setHits([]);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     debounceRef.current = setTimeout(async () => {
//       try {
//         const res  = await fetch(`/api/institute-search?q=${encodeURIComponent(q)}&limit=8`);
//         const data = await res.json();
//         setHits(Array.isArray(data) ? data : []);
//       } catch {
//         setHits([]);
//       } finally {
//         setLoading(false);
//       }
//     }, 220);
//   }, []);

//   const handleSelect = useCallback((hit: SearchHit) => {
//     setSelected(hit);
//     setHits([]);
//     setQuery("");
//   }, []);

//   const handleBack = useCallback(() => {
//     setSelected(null);
//   }, []);

//   const showResults = query.length >= 2;
//   const showEmpty   = showResults && !loading && hits.length === 0;

//   return (
//     <div style={{
//       minHeight:   "100vh",
//       background:  "var(--paper)",
//       display:     "flex",
//       flexDirection: "column",
//     }}>
//       {/* ── Header ── */}
//       <header style={{
//         borderBottom: "1px solid var(--border)",
//         background:   "var(--white)",
//         padding:      "0 32px",
//         height:       52,
//         display:      "flex",
//         alignItems:   "center",
//         gap:          12,
//       }}>
//         <button
//           onClick={handleBack}
//           style={{
//             fontFamily:  "var(--font-display)",
//             fontStyle:   "italic",
//             fontSize:    "1.1rem",
//             color:       "var(--crimson)",
//             background:  "none",
//             border:      "none",
//             cursor:      "pointer",
//             letterSpacing: "0.01em",
//             padding:     0,
//           }}
//         >
//           NIRF
//         </button>
//         <span style={{ color: "var(--border-dark)", fontSize: "1.1rem" }}>·</span>
//         <span style={{
//           fontFamily:  "var(--font-body)",
//           fontSize:    "0.78rem",
//           color:       "var(--ink-500)",
//           letterSpacing: "0.04em",
//           textTransform: "uppercase",
//           fontWeight:  500,
//         }}>
//           Institute Explorer
//         </span>

//         {selected && (
//           <button
//             onClick={handleBack}
//             style={{
//               marginLeft:  "auto",
//               fontFamily:  "var(--font-body)",
//               fontSize:    "0.75rem",
//               color:       "var(--ink-500)",
//               background:  "none",
//               border:      "1px solid var(--border)",
//               padding:     "4px 12px",
//               cursor:      "pointer",
//               letterSpacing: "0.02em",
//             }}
//           >
//             ← New Search
//           </button>
//         )}
//       </header>

//       {/* ── Main ── */}
//       {!selected ? (
//         /* Search view */
//         <main style={{
//           flex:          1,
//           display:       "flex",
//           flexDirection: "column",
//           alignItems:    "center",
//           paddingTop:    "clamp(48px, 10vh, 120px)",
//           padding:       "clamp(48px, 10vh, 120px) 24px 48px",
//         }}>
//           {/* Hero title */}
//           <div style={{
//             textAlign:   "center",
//             marginBottom: 36,
//             animation:   "fadeUp 0.5s var(--ease-out) both",
//           }}>
//             <h1 style={{
//               fontFamily:   "var(--font-display)",
//               fontStyle:    "italic",
//               fontSize:     "clamp(2rem, 5vw, 3.2rem)",
//               color:        "var(--ink-900)",
//               lineHeight:   1.1,
//               marginBottom: 10,
//             }}>
//               National Institutional<br />Ranking Framework
//             </h1>
//             <p style={{
//               fontFamily:  "var(--font-body)",
//               fontSize:    "0.9rem",
//               color:       "var(--ink-500)",
//               letterSpacing: "0.02em",
//             }}>
//               Search any institute by name or code to explore its full ranking history
//             </p>
//           </div>

//           {/* Search + results */}
//           <div style={{
//             width:    "100%",
//             maxWidth: 620,
//             position: "relative",
//             animation: "fadeUp 0.5s var(--ease-out) 80ms both",
//           }}>
//             <SearchBar
//               value={query}
//               onChange={handleQueryChange}
//               loading={loading}
//             />

//             {showResults && (
//               <div style={{
//                 position:  "absolute",
//                 top:       "calc(100% + 6px)",
//                 left:      0,
//                 right:     0,
//                 zIndex:    50,
//                 background: "var(--white)",
//                 border:    "1px solid var(--border)",
//                 boxShadow: "var(--shadow-lg)",
//                 animation: "scaleIn 0.15s var(--ease-out) both",
//               }}>
//                 {showEmpty ? (
//                   <div style={{
//                     padding:    "20px 24px",
//                     fontFamily: "var(--font-mono)",
//                     fontSize:   "0.75rem",
//                     color:      "var(--ink-300)",
//                     textAlign:  "center",
//                   }}>
//                     No institutes found for "{query}"
//                   </div>
//                 ) : (
//                   <SearchResults hits={hits} onSelect={handleSelect} />
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Hint text */}
//           {!showResults && (
//             <p style={{
//               marginTop:   24,
//               fontFamily:  "var(--font-mono)",
//               fontSize:    "0.72rem",
//               color:       "var(--ink-300)",
//               animation:   "fadeIn 0.5s var(--ease-out) 200ms both",
//             }}>
//               Try "IIT Delhi", "IR-O-U-0456", or "TIET"
//             </p>
//           )}
//         </main>
//       ) : (
//         /* Detail view */
//         <main style={{
//           flex:      1,
//           animation: "fadeUp 0.4s var(--ease-out) both",
//         }}>
//           <InstituteDetail hit={selected} />
//         </main>
//       )}
//     </div>
//   );
// }

// "use client";
// import { useState, useCallback, useRef } from "react";
// import SearchBar       from "@/app/components/SearchBar";
// import SearchResults   from "@/app/components/SearchResults";
// import InstituteDetail from "@/app/components/InstituteDetail";
// import CompareView     from "@/app/components/CompareView";
// import CompareTray     from "@/app/components/CompareTray";

// export interface SearchHit {
//   institute_code: string;
//   institute_name: string;
//   category:       string;
//   best_year:      number;
//   img_total:      number | null;
// }

// export default function HomePage() {
//   const [hits, setHits]               = useState<SearchHit[]>([]);
//   const [loading, setLoading]         = useState(false);
//   const [selected, setSelected]       = useState<SearchHit | null>(null);
//   const [query, setQuery]             = useState("");
//   const [compareMode, setCompareMode] = useState(false);
//   const [comparePicks, setComparePicks] = useState<SearchHit[]>([]);
//   const [showCompare, setShowCompare] = useState(false);
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const handleQueryChange = useCallback((q: string) => {
//     setQuery(q);
//     if (debounceRef.current) clearTimeout(debounceRef.current);
//     if (q.trim().length < 2) { setHits([]); setLoading(false); return; }
//     setLoading(true);
//     debounceRef.current = setTimeout(async () => {
//       try {
//         const res  = await fetch(`/api/institute-search?q=${encodeURIComponent(q)}&limit=8`);
//         const data = await res.json();
//         setHits(Array.isArray(data) ? data : []);
//       } catch { setHits([]); }
//       finally  { setLoading(false); }
//     }, 220);
//   }, []);

//   const handleSelect = useCallback((hit: SearchHit) => {
//     if (compareMode) {
//       // Add to compare picks (max 4, no duplicates)
//       setComparePicks(prev => {
//         if (prev.find(p => p.institute_code === hit.institute_code)) return prev;
//         if (prev.length >= 4) return prev;
//         return [...prev, hit];
//       });
//       setHits([]);
//       setQuery("");
//       return;
//     }
//     setSelected(hit);
//     setHits([]);
//     setQuery("");
//   }, [compareMode]);

//   const handleBack = useCallback(() => {
//     setSelected(null);
//     setShowCompare(false);
//   }, []);

//   const handleRemovePick = useCallback((code: string) => {
//     setComparePicks(prev => prev.filter(p => p.institute_code !== code));
//   }, []);

//   const handleClearCompare = useCallback(() => {
//     setComparePicks([]);
//     setShowCompare(false);
//   }, []);

//   const handleToggleCompareMode = useCallback(() => {
//     setCompareMode(prev => {
//       if (prev) {
//         // Exiting compare mode — clear everything
//         setComparePicks([]);
//         setShowCompare(false);
//       }
//       return !prev;
//     });
//   }, []);

//   const handleLaunchCompare = useCallback(() => {
//     if (comparePicks.length >= 2) setShowCompare(true);
//   }, [comparePicks]);

//   const showResults = query.length >= 2;
//   const showEmpty   = showResults && !loading && hits.length === 0;

//   // ── Header button label ───────────────────────────────────────────────────
//   const compareBtnLabel = compareMode
//     ? comparePicks.length > 0 ? `Exit Compare (${comparePicks.length})` : "Exit Compare"
//     : "⇄ Compare";

//   return (
//     <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>

//       {/* ── Header ── */}
//       <header style={{
//         borderBottom: "1px solid var(--border)",
//         background:   compareMode ? "var(--crimson-pale)" : "var(--white)",
//         padding:      "0 32px",
//         height:       52,
//         display:      "flex",
//         alignItems:   "center",
//         gap:          12,
//         transition:   "background 0.2s",
//       }}>
//         <button
//           onClick={handleBack}
//           style={{
//             fontFamily:  "var(--font-display)",
//             fontStyle:   "italic",
//             fontSize:    "1.1rem",
//             color:       "var(--crimson)",
//             background:  "none",
//             border:      "none",
//             cursor:      "pointer",
//             padding:     0,
//           }}
//         >
//           NIRF
//         </button>
//         <span style={{ color: "var(--border-dark)", fontSize: "1.1rem" }}>·</span>
//         <span style={{
//           fontFamily:    "var(--font-body)",
//           fontSize:      "0.78rem",
//           color:         "var(--ink-500)",
//           letterSpacing: "0.04em",
//           textTransform: "uppercase",
//           fontWeight:    500,
//         }}>
//           Institute Explorer
//         </span>

//         {/* Compare mode banner */}
//         {compareMode && (
//           <span style={{
//             fontFamily:    "var(--font-mono)",
//             fontSize:      "0.65rem",
//             letterSpacing: "0.08em",
//             color:         "var(--crimson)",
//             background:    "var(--crimson-pale)",
//             border:        "1px solid rgba(192,57,43,0.25)",
//             padding:       "2px 10px",
//             textTransform: "uppercase",
//             animation:     "fadeIn 0.2s ease both",
//           }}>
//             Compare Mode — search and add institutes
//           </span>
//         )}

//         {/* Right-side actions */}
//         <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
//           {/* Back to search */}
//           {(selected || showCompare) && (
//             <button
//               onClick={handleBack}
//               style={{
//                 fontFamily:  "var(--font-body)",
//                 fontSize:    "0.75rem",
//                 color:       "var(--ink-500)",
//                 background:  "none",
//                 border:      "1px solid var(--border)",
//                 padding:     "4px 12px",
//                 cursor:      "pointer",
//               }}
//             >
//               ← New Search
//             </button>
//           )}

//           {/* Compare toggle — visible unless in detail view */}
//           {!selected && !showCompare && (
//             <button
//               onClick={handleToggleCompareMode}
//               style={{
//                 fontFamily:    "var(--font-mono)",
//                 fontSize:      "0.7rem",
//                 letterSpacing: "0.06em",
//                 textTransform: "uppercase",
//                 background:    compareMode ? "var(--crimson)" : "transparent",
//                 color:         compareMode ? "#fff" : "var(--crimson)",
//                 border:        "1px solid var(--crimson)",
//                 padding:       "5px 14px",
//                 cursor:        "pointer",
//                 transition:    "all 0.15s",
//                 fontWeight:    compareMode ? 600 : 400,
//               }}
//             >
//               {compareBtnLabel}
//             </button>
//           )}

//           {/* "Compare" button in InstituteDetail — add to tray */}
//           {selected && !compareMode && (
//             <button
//               onClick={() => {
//                 setCompareMode(true);
//                 setComparePicks([selected]);
//                 setSelected(null);
//               }}
//               style={{
//                 fontFamily:    "var(--font-mono)",
//                 fontSize:      "0.7rem",
//                 letterSpacing: "0.06em",
//                 textTransform: "uppercase",
//                 background:    "transparent",
//                 color:         "var(--crimson)",
//                 border:        "1px solid var(--crimson)",
//                 padding:       "5px 14px",
//                 cursor:        "pointer",
//               }}
//             >
//               ⇄ Compare This
//             </button>
//           )}
//         </div>
//       </header>

//       {/* ── Main ── */}
//       {showCompare ? (
//         /* ── Comparison view ── */
//         <main style={{ flex: 1, animation: "fadeUp 0.35s var(--ease-out) both" }}>
//           <CompareView
//             institutes={comparePicks}
//             onRemove={(code) => {
//               handleRemovePick(code);
//               if (comparePicks.length <= 2) {
//                 setShowCompare(false);
//               }
//             }}
//             onClose={() => setShowCompare(false)}
//           />
//         </main>
//       ) : selected ? (
//         /* ── Institute detail view ── */
//         <main style={{ flex: 1, animation: "fadeUp 0.4s var(--ease-out) both" }}>
//           <InstituteDetail hit={selected} />
//         </main>
//       ) : (
//         /* ── Search / home view ── */
//         <main style={{
//           flex:          1,
//           display:       "flex",
//           flexDirection: "column",
//           alignItems:    "center",
//           padding:       "clamp(48px, 10vh, 120px) 24px 48px",
//         }}>
//           {/* Hero title */}
//           {!compareMode && (
//             <div style={{
//               textAlign:    "center",
//               marginBottom: 36,
//               animation:    "fadeUp 0.5s var(--ease-out) both",
//             }}>
//               <h1 style={{
//                 fontFamily:   "var(--font-display)",
//                 fontStyle:    "italic",
//                 fontSize:     "clamp(2rem, 5vw, 3.2rem)",
//                 color:        "var(--ink-900)",
//                 lineHeight:   1.1,
//                 marginBottom: 10,
//               }}>
//                 National Institutional<br />Ranking Framework
//               </h1>
//               <p style={{
//                 fontFamily:  "var(--font-body)",
//                 fontSize:    "0.9rem",
//                 color:       "var(--ink-500)",
//                 letterSpacing: "0.02em",
//               }}>
//                 Search any institute by name or code to explore its full ranking history
//               </p>
//             </div>
//           )}

//           {compareMode && (
//             <div style={{
//               textAlign:    "center",
//               marginBottom: 28,
//               animation:    "fadeUp 0.4s var(--ease-out) both",
//             }}>
//               <h2 style={{
//                 fontFamily:   "var(--font-display)",
//                 fontStyle:    "italic",
//                 fontSize:     "clamp(1.4rem, 3vw, 2rem)",
//                 color:        "var(--crimson)",
//                 marginBottom: 6,
//               }}>
//                 Add institutes to compare
//               </h2>
//               <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--ink-500)" }}>
//                 Search and click to add. Up to 4 institutes. Then hit Compare.
//               </p>
//             </div>
//           )}

//           {/* Search box */}
//           <div style={{
//             width:     "100%",
//             maxWidth:  620,
//             position:  "relative",
//             animation: "fadeUp 0.5s var(--ease-out) 80ms both",
//           }}>
//             <SearchBar
//               value={query}
//               onChange={handleQueryChange}
//               loading={loading}
//             />

//             {showResults && (
//               <div style={{
//                 position:  "absolute",
//                 top:       "calc(100% + 6px)",
//                 left:      0,
//                 right:     0,
//                 zIndex:    50,
//                 background: "var(--white)",
//                 border:    "1px solid var(--border)",
//                 boxShadow: "var(--shadow-lg)",
//                 animation: "scaleIn 0.15s var(--ease-out) both",
//               }}>
//                 {/* Compare mode — show "Add" affordance on each hit */}
//                 {compareMode && (
//                   <div style={{
//                     padding:    "6px 16px",
//                     background: "var(--crimson-pale)",
//                     borderBottom: "1px solid rgba(192,57,43,0.15)",
//                     fontFamily: "var(--font-mono)",
//                     fontSize:   "0.62rem",
//                     color:      "var(--crimson)",
//                   }}>
//                     Click an institute to add it to comparison
//                     {comparePicks.length >= 4 && " · Maximum 4 reached"}
//                   </div>
//                 )}

//                 {showEmpty ? (
//                   <div style={{
//                     padding:    "20px 24px",
//                     fontFamily: "var(--font-mono)",
//                     fontSize:   "0.75rem",
//                     color:      "var(--ink-300)",
//                     textAlign:  "center",
//                   }}>
//                     No institutes found for "{query}"
//                   </div>
//                 ) : (
//                   <SearchResults
//                     hits={hits.filter(h =>
//                       compareMode
//                         ? !comparePicks.find(p => p.institute_code === h.institute_code)
//                         : true
//                     )}
//                     onSelect={handleSelect}
//                     compareMode={compareMode}
//                     selectedCodes={comparePicks.map(p => p.institute_code)}
//                   />
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Hint */}
//           {!showResults && !compareMode && (
//             <p style={{
//               marginTop:  24,
//               fontFamily: "var(--font-mono)",
//               fontSize:   "0.72rem",
//               color:      "var(--ink-300)",
//               animation:  "fadeIn 0.5s var(--ease-out) 200ms both",
//             }}>
//               Try "IIT Delhi", "IR-O-U-0456", or "TIET"
//             </p>
//           )}

//           {/* Compare mode hint */}
//           {!showResults && compareMode && comparePicks.length === 0 && (
//             <p style={{
//               marginTop:  16,
//               fontFamily: "var(--font-mono)",
//               fontSize:   "0.72rem",
//               color:      "var(--ink-300)",
//             }}>
//               Search above to find institutes to compare
//             </p>
//           )}
//         </main>
//       )}

//       {/* ── Compare Tray (floating bottom bar) ── */}
//       {compareMode && !showCompare && (
//         <CompareTray
//           selected={comparePicks}
//           onRemove={handleRemovePick}
//           onCompare={handleLaunchCompare}
//           onClear={handleClearCompare}
//         />
//       )}
//     </div>
//   );
// }





















































//working final







// "use client";
// import { useState, useCallback, useRef } from "react";
// import SearchBar from "@/app/components/SearchBar";
// import SearchResults from "@/app/components/SearchResults";
// import type { SearchGroup } from "@/app/components/SearchResults";
// import InstituteDetail from "@/app/components/InstituteDetail";
// import CompareView from "@/app/components/CompareView";
// import CompareTray from "@/app/components/CompareTray";
// import RankingView from "@/app/components/RankingView";

// // REPLACE WITH:
// export interface SearchHit {
//   institute_code: string;
//   institute_name: string;
//   category: string;
//   best_year: number;
//   img_total: number | null;
//   allCodes?: string[]; // all codes for this institute across categories
// }

// export default function HomePage() {
//   const [groups, setGroups] = useState<SearchGroup[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [selected, setSelected] = useState<SearchHit | null>(null);
//   const [query, setQuery] = useState("");
//   const [compareMode, setCompareMode] = useState(false);
//   const [comparePicks, setComparePicks] = useState<SearchHit[]>([]);
//   const [showCompare, setShowCompare] = useState(false);
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const [showRanking, setShowRanking] = useState(false);

//   const handleQueryChange = useCallback((q: string) => {
//     setQuery(q);
//     if (debounceRef.current) clearTimeout(debounceRef.current);
//     if (q.trim().length < 2) {
//       setGroups([]);
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     debounceRef.current = setTimeout(async () => {
//       try {
//         const res = await fetch(
//           `/api/institute-search?q=${encodeURIComponent(q)}&limit=8`,
//         );
//         const data = await res.json();
//         setGroups(Array.isArray(data) ? data : []);
//       } catch {
//         setGroups([]);
//       } finally {
//         setLoading(false);
//       }
//     }, 220);
//   }, []);

//   // REPLACE WITH:
//   const handleSelect = useCallback(
//     (hit: SearchHit) => {
//       if (compareMode) {
//         setComparePicks((prev) => {
//           if (prev.find((p) => p.institute_code === hit.institute_code))
//             return prev;
//           if (prev.length >= 4) return prev;
//           return [...prev, hit];
//         });
//         setGroups([]);
//         setQuery("");
//         return;
//       }
//       // Find all codes for this institute name from the current search groups
//       const group = groups.find((g) => g.institute_name === hit.institute_name);
//       const allCodes = group
//         ? group.entries.map((e) => e.institute_code)
//         : [hit.institute_code];
//       setSelected({ ...hit, allCodes } as SearchHit & { allCodes: string[] });
//       setGroups([]);
//       setQuery("");
//     },
//     [compareMode, groups],
//   );

//   const handleBack = useCallback(() => {
//     setSelected(null);
//     setShowCompare(false);
//   }, []);

//   const handleRemovePick = useCallback((code: string) => {
//     setComparePicks((prev) => prev.filter((p) => p.institute_code !== code));
//   }, []);

//   const handleClearCompare = useCallback(() => {
//     setComparePicks([]);
//     setShowCompare(false);
//   }, []);

//   const handleToggleCompareMode = useCallback(() => {
//     setCompareMode((prev) => {
//       if (prev) {
//         setComparePicks([]);
//         setShowCompare(false);
//       }
//       return !prev;
//     });
//   }, []);

//   const handleLaunchCompare = useCallback(() => {
//     if (comparePicks.length >= 2) setShowCompare(true);
//   }, [comparePicks]);

//   const showResults = query.length >= 2;
//   const showEmpty = showResults && !loading && groups.length === 0;

//   const compareBtnLabel = compareMode
//     ? comparePicks.length > 0
//       ? `Exit Compare (${comparePicks.length})`
//       : "Exit Compare"
//     : "⇄ Compare";

//   // All codes already in compare tray (to mark chips as Added)
//   const selectedCodes = comparePicks.map((p) => p.institute_code);

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "var(--paper)",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {/* ── Header ── */}
//       <header
//         style={{
//           borderBottom: "1px solid var(--border)",
//           background: compareMode ? "var(--crimson-pale)" : "var(--white)",
//           padding: "0 32px",
//           height: 52,
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           transition: "background 0.2s",
//         }}
//       >
//         <button
//           onClick={handleBack}
//           style={{
//             fontFamily: "var(--font-display)",
//             fontStyle: "italic",
//             fontSize: "1.1rem",
//             color: "var(--crimson)",
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             padding: 0,
//           }}
//         >
//           NIRF
//         </button>
//         <span style={{ color: "var(--border-dark)", fontSize: "1.1rem" }}>
//           ·
//         </span>
//         <span
//           style={{
//             fontFamily: "var(--font-body)",
//             fontSize: "0.78rem",
//             color: "var(--ink-500)",
//             letterSpacing: "0.04em",
//             textTransform: "uppercase",
//             fontWeight: 500,
//           }}
//         >
//           Institute Explorer
//         </span>

//         {compareMode && (
//           <span
//             style={{
//               fontFamily: "var(--font-mono)",
//               fontSize: "0.65rem",
//               letterSpacing: "0.08em",
//               color: "var(--crimson)",
//               background: "var(--crimson-pale)",
//               border: "1px solid rgba(192,57,43,0.25)",
//               padding: "2px 10px",
//               textTransform: "uppercase",
//               animation: "fadeIn 0.2s ease both",
//             }}
//           >
//             Compare Mode — click a category chip to add
//           </span>
//         )}

//         <div
//           style={{
//             marginLeft: "auto",
//             display: "flex",
//             gap: 8,
//             alignItems: "center",
//           }}
//         >
//           {(selected || showCompare) && (
//             <button
//               onClick={handleBack}
//               style={{
//                 fontFamily: "var(--font-body)",
//                 fontSize: "0.75rem",
//                 color: "var(--ink-500)",
//                 background: "none",
//                 border: "1px solid var(--border)",
//                 padding: "4px 12px",
//                 cursor: "pointer",
//               }}
//             >
//               ← New Search
//             </button>
//           )}
//           {!selected && !showCompare && (
//             <button
//               onClick={handleToggleCompareMode}
//               style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.7rem",
//                 letterSpacing: "0.06em",
//                 textTransform: "uppercase",
//                 background: compareMode ? "var(--crimson)" : "transparent",
//                 color: compareMode ? "#fff" : "var(--crimson)",
//                 border: "1px solid var(--crimson)",
//                 padding: "5px 14px",
//                 cursor: "pointer",
//                 transition: "all 0.15s",
//                 fontWeight: compareMode ? 600 : 400,
//               }}
//             >
//               {compareBtnLabel}
//             </button>
//           )}
//           {selected && !compareMode && (
//             <button
//               onClick={() => {
//                 setCompareMode(true);
//                 setComparePicks([selected]);
//                 setSelected(null);
//               }}
//               style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.7rem",
//                 letterSpacing: "0.06em",
//                 textTransform: "uppercase",
//                 background: "transparent",
//                 color: "var(--crimson)",
//                 border: "1px solid var(--crimson)",
//                 padding: "5px 14px",
//                 cursor: "pointer",
//               }}
//             >
//               ⇄ Compare This
//             </button>
//           )}
//         </div>
//         <button
//           onClick={() => {
//             setShowRanking((r) => !r);
//             setSelected(null);
//             setShowCompare(false);
//           }}
//           style={{
//             fontFamily: "var(--font-mono)",
//             fontSize: "0.7rem",
//             letterSpacing: "0.06em",
//             textTransform: "uppercase",
//             background: showRanking ? "var(--crimson)" : "transparent",
//             color: showRanking ? "#fff" : "var(--crimson)",
//             border: "1px solid var(--crimson)",
//             padding: "5px 14px",
//             cursor: "pointer",
//             transition: "all 0.15s",
//           }}
//         >
//           ≡ Ranking
//         </button>
//       </header>

//       {/* ── Main ── */}
//       {showCompare ? (
//         <main
//           style={{ flex: 1, animation: "fadeUp 0.35s var(--ease-out) both" }}
//         >
//           <CompareView
//             institutes={comparePicks}
//             onRemove={(code) => {
//               handleRemovePick(code);
//               if (comparePicks.length <= 2) setShowCompare(false);
//             }}
//             onClose={() => setShowCompare(false)}
//           />
//         </main>
//       ) : showRanking ? (
//         <main
//           style={{ flex: 1, animation: "fadeUp 0.35s var(--ease-out) both" }}
//         >
//           <RankingView
//             onSelectInstitute={(hit) => {
//               setShowRanking(false);
//               setSelected(hit);
//             }}
//           />
//         </main>
//       ) : selected ? (
//         <main
//           style={{ flex: 1, animation: "fadeUp 0.4s var(--ease-out) both" }}
//         >
//           {/* Pass initial category from the chip the user clicked */}
//           <InstituteDetail hit={selected} initialCategory={selected.category} />
//         </main>
//       ) : (
//         <main
//           style={{
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             padding: "clamp(48px, 10vh, 120px) 24px 48px",
//           }}
//         >
//           {!compareMode && (
//             <div
//               style={{
//                 textAlign: "center",
//                 marginBottom: 36,
//                 animation: "fadeUp 0.5s var(--ease-out) both",
//               }}
//             >
//               <h1
//                 style={{
//                   fontFamily: "var(--font-display)",
//                   fontStyle: "italic",
//                   fontSize: "clamp(2rem, 5vw, 3.2rem)",
//                   color: "var(--ink-900)",
//                   lineHeight: 1.1,
//                   marginBottom: 10,
//                 }}
//               >
//                 National Institutional
//                 <br />
//                 Ranking Framework
//               </h1>
//               <p
//                 style={{
//                   fontFamily: "var(--font-body)",
//                   fontSize: "0.9rem",
//                   color: "var(--ink-500)",
//                   letterSpacing: "0.02em",
//                 }}
//               >
//                 Search any institute by name or code — then pick a category to
//                 explore
//               </p>
//             </div>
//           )}

//           {compareMode && (
//             <div
//               style={{
//                 textAlign: "center",
//                 marginBottom: 28,
//                 animation: "fadeUp 0.4s var(--ease-out) both",
//               }}
//             >
//               <h2
//                 style={{
//                   fontFamily: "var(--font-display)",
//                   fontStyle: "italic",
//                   fontSize: "clamp(1.4rem, 3vw, 2rem)",
//                   color: "var(--crimson)",
//                   marginBottom: 6,
//                 }}
//               >
//                 Add institutes to compare
//               </h2>
//               <p
//                 style={{
//                   fontFamily: "var(--font-body)",
//                   fontSize: "0.85rem",
//                   color: "var(--ink-500)",
//                 }}
//               >
//                 Search and click a category chip to add. Up to 4. Then hit
//                 Compare.
//               </p>
//             </div>
//           )}

//           {/* Search box */}
//           <div
//             style={{
//               width: "100%",
//               maxWidth: 640,
//               position: "relative",
//               animation: "fadeUp 0.5s var(--ease-out) 80ms both",
//             }}
//           >
//             <SearchBar
//               value={query}
//               onChange={handleQueryChange}
//               loading={loading}
//             />

//             {showResults && (
//               <div
//                 style={{
//                   position: "absolute",
//                   top: "calc(100% + 6px)",
//                   left: 0,
//                   right: 0,
//                   zIndex: 50,
//                   background: "var(--white)",
//                   border: "1px solid var(--border)",
//                   boxShadow: "var(--shadow-lg)",
//                   animation: "scaleIn 0.15s var(--ease-out) both",
//                 }}
//               >
//                 {compareMode && (
//                   <div
//                     style={{
//                       padding: "6px 16px",
//                       background: "var(--crimson-pale)",
//                       borderBottom: "1px solid rgba(192,57,43,0.15)",
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.62rem",
//                       color: "var(--crimson)",
//                     }}
//                   >
//                     Click a category chip to add it to the comparison
//                     {comparePicks.length >= 4 && " · Maximum 4 reached"}
//                   </div>
//                 )}
//                 {showEmpty ? (
//                   <div
//                     style={{
//                       padding: "20px 24px",
//                       fontFamily: "var(--font-mono)",
//                       fontSize: "0.75rem",
//                       color: "var(--ink-300)",
//                       textAlign: "center",
//                     }}
//                   >
//                     No institutes found for "{query}"
//                   </div>
//                 ) : (
//                   <SearchResults
//                     groups={groups}
//                     onSelect={handleSelect}
//                     compareMode={compareMode}
//                     selectedCodes={selectedCodes}
//                   />
//                 )}
//               </div>
//             )}
//           </div>

//           {!showResults && !compareMode && (
//             <p
//               style={{
//                 marginTop: 24,
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.72rem",
//                 color: "var(--ink-300)",
//                 animation: "fadeIn 0.5s var(--ease-out) 200ms both",
//               }}
//             >
//               Try "IIT Delhi", "Indian Institute of Science", or "IR-O-U-0456"
//             </p>
//           )}
//           {!showResults && compareMode && comparePicks.length === 0 && (
//             <p
//               style={{
//                 marginTop: 16,
//                 fontFamily: "var(--font-mono)",
//                 fontSize: "0.72rem",
//                 color: "var(--ink-300)",
//               }}
//             >
//               Search above and click a category chip to add an institute
//             </p>
//           )}
//         </main>
//       )}

//       {/* ── Compare Tray ── */}
//       {compareMode && !showCompare && (
//         <CompareTray
//           selected={comparePicks}
//           onRemove={handleRemovePick}
//           onCompare={handleLaunchCompare}
//           onClear={handleClearCompare}
//         />
//       )}
//     </div>
//   );
// }































// import Link from "next/link";

// export interface SearchHit {
//   institute_code: string;
//   institute_name: string;
//   category: string;
//   best_year: number;
//   img_total: number | null;
//   allCodes?: string[]; // all codes for this institute across categories
// }

// export default function HomePage() {
//   return (
//     <main
//       style={{
//         minHeight: "100vh",
//         background: "var(--paper)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: "24px",
//       }}
//     >
//       <div
//         style={{
//           textAlign: "center",
//           maxWidth: 720,
//           width: "100%",
//         }}
//       >
//         {/* Heading */}
//         <h1
//           style={{
//             fontFamily: "var(--font-display)",
//             fontStyle: "italic",
//             fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
//             color: "var(--ink-900)",
//             lineHeight: 1.1,
//             marginBottom: 16,
//           }}
//         >
//           National Institutional
//           <br />
//           Ranking Framework
//         </h1>

//         {/* Subtitle */}
//         <p
//           style={{
//             fontFamily: "var(--font-body)",
//             fontSize: "1rem",
//             color: "var(--ink-500)",
//             marginBottom: 32,
//           }}
//         >
//           Explore institutes, compare them, and analyze rankings — all in one place.
//         </p>

//         {/* Navigation Buttons */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             gap: 12,
//             flexWrap: "wrap",
//           }}
//         >
//           <Link
//             href="/search"
//             style={{
//               textDecoration: "none",
//               border: "1px solid var(--crimson)",
//               padding: "10px 18px",
//               fontSize: "0.9rem",
//               color: "var(--crimson)",
//               transition: "all 0.15s",
//             }}
//           >
//             🔍 Search Institutes
//           </Link>

//           <Link
//             href="/ranking"
//             style={{
//               textDecoration: "none",
//               border: "1px solid var(--border)",
//               padding: "10px 18px",
//               fontSize: "0.9rem",
//               color: "var(--ink-700)",
//             }}
//           >
//             📊 View Rankings
//           </Link>
//         </div>

//         {/* Hint */}
//         <p
//           style={{
//             marginTop: 28,
//             fontFamily: "var(--font-mono)",
//             fontSize: "0.75rem",
//             color: "var(--ink-300)",
//           }}
//         >
//           Try exploring IITs, IISc, or search by institute code
//         </p>
//       </div>
//     </main>
//   );
// }






































// app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "./api/lib/auth";
import TopBar from "./components/TopBar";

export interface SearchHit {
  institute_code: string;
  institute_name: string;
  category:       string;
  best_year:      number;
  img_total:      number | null;
  allCodes?:      string[];
}

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <TopBar user={{ name: session.name, email: session.email }} />

      <main style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 720, width: "100%" }}>

          <h1 style={{
            fontFamily:   "var(--font-display)",
            fontStyle:    "italic",
            fontSize:     "clamp(2.2rem, 5vw, 3.5rem)",
            color:        "var(--ink-900)",
            lineHeight:   1.1,
            marginBottom: 16,
          }}>
            National Institutional<br />Ranking Framework
          </h1>

          <p style={{
            fontFamily:   "var(--font-body)",
            fontSize:     "1rem",
            color:        "var(--ink-500)",
            marginBottom: 32,
          }}>
            Explore institutes, compare them, and analyze rankings — all in one place.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <NavCard
              href="/search"
              icon="🔍"
              title="Search Institutes"
              desc="Find any institute by name or code and explore its full ranking history"
              accent="#2aacb8"
            />
            <NavCard
              href="/ranking"
              icon="📊"
              title="View Rankings"
              desc="Browse the official NIRF rankings table with parameter breakdown"
              accent="#1a6b73"
            />
          </div>

          <p style={{
            marginTop:  32,
            fontFamily: "var(--font-mono)",
            fontSize:   "0.72rem",
            color:      "var(--ink-300)",
          }}>
            Try exploring IITs, IISc, or search by institute code
          </p>
        </div>
      </main>
    </div>
  );
}

function NavCard({
  href, icon, title, desc, accent,
}: {
  href:   string;
  icon:   string;
  title:  string;
  desc:   string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "flex-start",
        gap:            8,
        padding:        "20px 24px",
        border:         `1px solid ${accent}40`,
        background:     "var(--white)",
        boxShadow:      "var(--shadow-sm)",
        width:          240,
        transition:     "box-shadow 0.15s, border-color 0.15s, transform 0.15s",
        textAlign:      "left",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow   = `0 4px 16px ${accent}28`;
        el.style.borderColor = `${accent}90`;
        el.style.transform   = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow   = "var(--shadow-sm)";
        el.style.borderColor = `${accent}40`;
        el.style.transform   = "none";
      }}
    >
      <span style={{ fontSize: "1.4rem" }}>{icon}</span>
      <p style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize:   "0.95rem",
        color:      accent,
        margin:     0,
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize:   "0.78rem",
        color:      "var(--ink-500)",
        margin:     0,
        lineHeight: 1.5,
      }}>
        {desc}
      </p>
    </Link>
  );
}