// "use client";
// import type { SearchHit } from "@/app/page";

// interface Props {
//   hits:     SearchHit[];
//   onSelect: (hit: SearchHit) => void;
// }

// const CATEGORY_COLORS: Record<string, string> = {
//   "Overall":     "#c0392b",
//   "University":  "#1a7a6e",
//   "Engineering": "#1d6fa8",
//   "Management":  "#7d4fa8",
//   "Medical":     "#b55a1a",
//   "College":     "#2e7d52",
//   "Pharmacy":    "#6b5a1a",
//   "Law":         "#4a5568",
//   "Architecture":"#8b4513",
//   "Research":    "#1a5a7a",
// };

// function categoryColor(cat: string) {
//   return CATEGORY_COLORS[cat] ?? "#6b6860";
// }

// export default function SearchResults({ hits, onSelect }: Props) {
//   return (
//     <div>
//       {hits.map((hit, i) => (
//         <button
//           key={hit.institute_code}
//           onClick={() => onSelect(hit)}
//           style={{
//             width:       "100%",
//             display:     "flex",
//             alignItems:  "center",
//             gap:         14,
//             padding:     "14px 20px",
//             background:  "transparent",
//             border:      "none",
//             borderBottom: i < hits.length - 1 ? "1px solid var(--border)" : "none",
//             cursor:      "pointer",
//             textAlign:   "left",
//             transition:  "background 0.1s",
//             animation:   `fadeUp 0.2s var(--ease-out) ${i * 30}ms both`,
//           }}
//           onMouseEnter={(e) => (e.currentTarget.style.background = "var(--off-white)")}
//           onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
//         >
//           {/* Category dot */}
//           <div style={{
//             width:       8,
//             height:      8,
//             borderRadius:"50%",
//             background:  categoryColor(hit.category),
//             flexShrink:  0,
//             marginTop:   2,
//           }} />

//           {/* Name + code */}
//           <div style={{ flex: 1, minWidth: 0 }}>
//             <p style={{
//               fontFamily:   "var(--font-body)",
//               fontWeight:   600,
//               fontSize:     "0.88rem",
//               color:        "var(--ink-900)",
//               marginBottom: 2,
//               whiteSpace:   "nowrap",
//               overflow:     "hidden",
//               textOverflow: "ellipsis",
//             }}>
//               {hit.institute_name}
//             </p>
//             <p style={{
//               fontFamily: "var(--font-mono)",
//               fontSize:   "0.68rem",
//               color:      "var(--ink-300)",
//             }}>
//               {hit.institute_code}
//               <span style={{
//                 marginLeft:  8,
//                 paddingLeft: 8,
//                 borderLeft:  "1px solid var(--border)",
//                 color:       categoryColor(hit.category),
//               }}>
//                 {hit.category}
//               </span>
//             </p>
//           </div>

//           {/* Score */}
//           {hit.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize:   "1rem",
//                 fontWeight: 500,
//                 color:      "var(--ink-900)",
//                 lineHeight: 1,
//               }}>
//                 {hit.img_total.toFixed(1)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize:   "0.6rem",
//                 color:      "var(--ink-300)",
//                 marginTop:  2,
//               }}>
//                 NIRF Score
//               </p>
//             </div>
//           )}

//           {/* Arrow */}
//           <span style={{ color: "var(--ink-100)", fontSize: "0.9rem", flexShrink: 0 }}>→</span>
//         </button>
//       ))}
//     </div>
//   );
// }



















// "use client";
// import type { SearchHit } from "@/app/page";

// interface Props {
//   hits:     SearchHit[];
//   onSelect: (hit: SearchHit) => void;
// }

// const CATEGORY_COLORS: Record<string, string> = {
//   "Overall":                   "#c0392b",
//   "University":                "#1a7a6e",
//   "Engineering":               "#1d6fa8",
//   "Management":                "#7d4fa8",
//   "Medical":                   "#b55a1a",
//   "College":                   "#2e7d52",
//   "Pharmacy":                  "#6b5a1a",
//   "Law":                       "#4a5568",
//   "Architecture":              "#8b4513",
//   "Research":                  "#1a5a7a",
//   "State Public University":   "#c0392b",
// };

// function categoryColor(cat: string) {
//   return CATEGORY_COLORS[cat] ?? "#6b6860";
// }

// export default function SearchResults({ hits, onSelect }: Props) {
//   // Deduplicate by institute_code on the frontend too — belt and suspenders
//   const seen  = new Set<string>();
//   const deduped = hits.filter(h => {
//     if (seen.has(h.institute_code)) return false;
//     seen.add(h.institute_code);
//     return true;
//   });

//   return (
//     <div>
//       {deduped.map((hit, i) => (
//         <button
//           key={`${hit.institute_code}-${i}`}
//           onClick={() => onSelect(hit)}
//           style={{
//             width:        "100%",
//             display:      "flex",
//             alignItems:   "center",
//             gap:          14,
//             padding:      "14px 20px",
//             background:   "transparent",
//             border:       "none",
//             borderBottom: i < deduped.length - 1 ? "1px solid var(--border)" : "none",
//             cursor:       "pointer",
//             textAlign:    "left",
//             transition:   "background 0.1s",
//             animation:    `fadeUp 0.2s var(--ease-out) ${i * 30}ms both`,
//           }}
//           onMouseEnter={(e) => (e.currentTarget.style.background = "var(--off-white)")}
//           onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
//         >
//           {/* Category dot */}
//           <div style={{
//             width:       8,
//             height:      8,
//             borderRadius:"50%",
//             background:  categoryColor(hit.category),
//             flexShrink:  0,
//             marginTop:   2,
//           }} />

//           {/* Name + code */}
//           <div style={{ flex: 1, minWidth: 0 }}>
//             <p style={{
//               fontFamily:   "var(--font-body)",
//               fontWeight:   600,
//               fontSize:     "0.88rem",
//               color:        "var(--ink-900)",
//               marginBottom: 2,
//               whiteSpace:   "nowrap",
//               overflow:     "hidden",
//               textOverflow: "ellipsis",
//             }}>
//               {hit.institute_name}
//             </p>
//             <p style={{
//               fontFamily: "var(--font-mono)",
//               fontSize:   "0.68rem",
//               color:      "var(--ink-300)",
//             }}>
//               {hit.institute_code}
//               <span style={{
//                 marginLeft:  8,
//                 paddingLeft: 8,
//                 borderLeft:  "1px solid var(--border)",
//                 color:       categoryColor(hit.category),
//               }}>
//                 {hit.category}
//               </span>
//             </p>
//           </div>

//           {/* Score */}
//           {hit.img_total != null && (
//             <div style={{ textAlign: "right", flexShrink: 0 }}>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize:   "1rem",
//                 fontWeight: 500,
//                 color:      "var(--ink-900)",
//                 lineHeight: 1,
//               }}>
//                 {hit.img_total.toFixed(1)}
//               </p>
//               <p style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize:   "0.6rem",
//                 color:      "var(--ink-300)",
//                 marginTop:  2,
//               }}>
//                 NIRF Score
//               </p>
//             </div>
//           )}

//           <span style={{ color: "var(--ink-100)", fontSize: "0.9rem", flexShrink: 0 }}>→</span>
//         </button>
//       ))}
//     </div>
//   );
// }




























// "use client";
// import type { SearchHit } from "@/app/page";

// interface Props {
//   hits:          SearchHit[];
//   onSelect:      (hit: SearchHit) => void;
//   compareMode?:  boolean;
//   selectedCodes?: string[];
// }

// const CATEGORY_COLORS: Record<string, string> = {
//   "Overall":                   "#c0392b",
//   "University":                "#1a7a6e",
//   "Engineering":               "#1d6fa8",
//   "Management":                "#7d4fa8",
//   "Medical":                   "#b55a1a",
//   "College":                   "#2e7d52",
//   "Pharmacy":                  "#6b5a1a",
//   "Law":                       "#4a5568",
//   "Architecture":              "#8b4513",
//   "Research":                  "#1a5a7a",
//   "State Public University":   "#c0392b",
// };

// function categoryColor(cat: string) {
//   return CATEGORY_COLORS[cat] ?? "#6b6860";
// }

// export default function SearchResults({ hits, onSelect, compareMode, selectedCodes = [] }: Props) {
//   const seen    = new Set<string>();
//   const deduped = hits.filter(h => {
//     if (seen.has(h.institute_code)) return false;
//     seen.add(h.institute_code);
//     return true;
//   });

//   return (
//     <div>
//       {deduped.map((hit, i) => {
//         const isAlreadyAdded = selectedCodes.includes(hit.institute_code);
//         return (
//           <button
//             key={`${hit.institute_code}-${i}`}
//             onClick={() => !isAlreadyAdded && onSelect(hit)}
//             style={{
//               width:        "100%",
//               display:      "flex",
//               alignItems:   "center",
//               gap:          14,
//               padding:      "14px 20px",
//               background:   isAlreadyAdded ? "var(--off-white)" : "transparent",
//               border:       "none",
//               borderBottom: i < deduped.length - 1 ? "1px solid var(--border)" : "none",
//               cursor:       isAlreadyAdded ? "default" : "pointer",
//               textAlign:    "left",
//               transition:   "background 0.1s",
//               opacity:      isAlreadyAdded ? 0.6 : 1,
//               animation:    `fadeUp 0.2s var(--ease-out) ${i * 30}ms both`,
//             }}
//             onMouseEnter={(e) => {
//               if (!isAlreadyAdded) e.currentTarget.style.background = "var(--off-white)";
//             }}
//             onMouseLeave={(e) => {
//               if (!isAlreadyAdded) e.currentTarget.style.background = "transparent";
//             }}
//           >
//             {/* Category dot */}
//             <div style={{
//               width:       8,
//               height:      8,
//               borderRadius:"50%",
//               background:  categoryColor(hit.category),
//               flexShrink:  0,
//               marginTop:   2,
//             }} />

//             {/* Name + code */}
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <p style={{
//                 fontFamily:   "var(--font-body)",
//                 fontWeight:   600,
//                 fontSize:     "0.88rem",
//                 color:        "var(--ink-900)",
//                 marginBottom: 2,
//                 whiteSpace:   "nowrap",
//                 overflow:     "hidden",
//                 textOverflow: "ellipsis",
//               }}>
//                 {hit.institute_name}
//               </p>
//               <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--ink-300)" }}>
//                 {hit.institute_code}
//                 <span style={{
//                   marginLeft:  8,
//                   paddingLeft: 8,
//                   borderLeft:  "1px solid var(--border)",
//                   color:       categoryColor(hit.category),
//                 }}>
//                   {hit.category}
//                 </span>
//               </p>
//             </div>

//             {/* Score */}
//             {hit.img_total != null && (
//               <div style={{ textAlign: "right", flexShrink: 0 }}>
//                 <p style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize:   "1rem",
//                   fontWeight: 500,
//                   color:      "var(--ink-900)",
//                   lineHeight: 1,
//                 }}>
//                   {hit.img_total.toFixed(1)}
//                 </p>
//                 <p style={{
//                   fontFamily: "var(--font-mono)",
//                   fontSize:   "0.6rem",
//                   color:      "var(--ink-300)",
//                   marginTop:  2,
//                 }}>
//                   NIRF Score
//                 </p>
//               </div>
//             )}

//             {/* Arrow / Add indicator */}
//             {compareMode ? (
//               <span style={{
//                 fontFamily: "var(--font-mono)",
//                 fontSize:   "0.65rem",
//                 color:      isAlreadyAdded ? "var(--ink-300)" : "var(--crimson)",
//                 border:     `1px solid ${isAlreadyAdded ? "var(--border)" : "var(--crimson)"}`,
//                 padding:    "3px 8px",
//                 flexShrink: 0,
//               }}>
//                 {isAlreadyAdded ? "Added" : "+ Add"}
//               </span>
//             ) : (
//               <span style={{ color: "var(--ink-100)", fontSize: "0.9rem", flexShrink: 0 }}>→</span>
//             )}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

























"use client";
/**
 * SearchResults.tsx (v2)
 * Shows one row per institute name.
 * Each row has clickable category chips — clicking a chip opens
 * that specific code+category in InstituteDetail.
 * In compare mode, each chip has its own "+ Add" button.
 */
import type { SearchHit } from "@/app/page";

// The grouped shape returned by the new /api/institute-search
export interface SearchGroup {
  institute_name: string;
  best_score:     number | null;
  entries: {
    institute_code: string;
    category:       string;
    best_year:      number;
    img_total:      number | null;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Overall":                 "#c0392b",
  "University":              "#1a7a6e",
  "Engineering":             "#1d6fa8",
  "Management":              "#7d4fa8",
  "Medical":                 "#b55a1a",
  "College":                 "#2e7d52",
  "Pharmacy":                "#6b5a1a",
  "Law":                     "#4a5568",
  "Architecture":            "#8b4513",
  "Research":                "#1a5a7a",
  "State Public University": "#c0392b",
};
const catColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#6b6860";

interface Props {
  groups:        SearchGroup[];
  onSelect:      (hit: SearchHit) => void;
  compareMode?:  boolean;
  selectedCodes?: string[];
}

export default function SearchResults({
  groups, onSelect, compareMode, selectedCodes = [],
}: Props) {
  if (!groups.length) return null;

  return (
    <div>
      {groups.map((group, gi) => (
        <div
          key={group.institute_name}
          style={{
            borderBottom: gi < groups.length - 1 ? "1px solid var(--border)" : "none",
            padding: "12px 20px",
            animation: `fadeUp 0.2s var(--ease-out) ${gi * 25}ms both`,
          }}
        >
          {/* Institute name row */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: "var(--ink-900)",
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
              marginRight: 12,
            }}>
              {group.institute_name}
            </p>
            {group.best_score != null && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 500, color: "var(--ink-900)", lineHeight: 1 }}>
                  {group.best_score.toFixed(1)}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--ink-300)", marginTop: 1 }}>
                  best score
                </p>
              </div>
            )}
          </div>

          {/* Category chips row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {group.entries.map((entry) => {
              const col       = catColor(entry.category);
              const isAdded   = selectedCodes.includes(entry.institute_code);
              const hit: SearchHit = {
                institute_code: entry.institute_code,
                institute_name: group.institute_name,
                category:       entry.category,
                best_year:      entry.best_year,
                img_total:      entry.img_total,
              };

              return (
                <button
                  key={entry.institute_code}
                  onClick={() => !isAdded && onSelect(hit)}
                  disabled={isAdded}
                  title={`${entry.institute_code} · Best year: ${entry.best_year}`}
                  style={{
                    display:     "inline-flex",
                    alignItems:  "center",
                    gap:         5,
                    padding:     compareMode ? "4px 8px 4px 10px" : "4px 10px",
                    border:      `1px solid ${isAdded ? "var(--border)" : col}`,
                    background:  isAdded ? "var(--off-white)" : `${col}12`,
                    cursor:      isAdded ? "default" : "pointer",
                    opacity:     isAdded ? 0.55 : 1,
                    transition:  "all 0.12s",
                    borderRadius: 2,
                  }}
                  onMouseEnter={e => {
                    if (!isAdded) (e.currentTarget as HTMLButtonElement).style.background = `${col}28`;
                  }}
                  onMouseLeave={e => {
                    if (!isAdded) (e.currentTarget as HTMLButtonElement).style.background = `${col}12`;
                  }}
                >
                  {/* Colour dot */}
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: isAdded ? "var(--ink-300)" : col, flexShrink: 0 }} />

                  {/* Category + code */}
                  <div style={{ textAlign: "left" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: isAdded ? "var(--ink-400)" : col,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      lineHeight: 1.2,
                    }}>
                      {entry.category}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.58rem",
                      color: "var(--ink-300)",
                      display: "block",
                      lineHeight: 1.2,
                    }}>
                      {entry.institute_code}
                      {entry.img_total != null && (
                        <span style={{ marginLeft: 4, color: "var(--ink-400)" }}>· {entry.img_total.toFixed(1)}</span>
                      )}
                    </span>
                  </div>

                  {/* Compare mode: Add / Added indicator */}
                  {compareMode && (
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      marginLeft: 4,
                      padding: "1px 6px",
                      border: `1px solid ${isAdded ? "var(--border)" : col}`,
                      color: isAdded ? "var(--ink-300)" : col,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}>
                      {isAdded ? "Added" : "+ Add"}
                    </span>
                  )}

                  {/* Normal mode: arrow */}
                  {!compareMode && (
                    <span style={{ color: isAdded ? "var(--ink-200)" : col, fontSize: "0.7rem", marginLeft: 2 }}>→</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}