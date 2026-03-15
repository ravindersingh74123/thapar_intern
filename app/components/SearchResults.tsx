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



















"use client";
import type { SearchHit } from "@/app/page";

interface Props {
  hits:     SearchHit[];
  onSelect: (hit: SearchHit) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Overall":                   "#c0392b",
  "University":                "#1a7a6e",
  "Engineering":               "#1d6fa8",
  "Management":                "#7d4fa8",
  "Medical":                   "#b55a1a",
  "College":                   "#2e7d52",
  "Pharmacy":                  "#6b5a1a",
  "Law":                       "#4a5568",
  "Architecture":              "#8b4513",
  "Research":                  "#1a5a7a",
  "State Public University":   "#c0392b",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#6b6860";
}

export default function SearchResults({ hits, onSelect }: Props) {
  // Deduplicate by institute_code on the frontend too — belt and suspenders
  const seen  = new Set<string>();
  const deduped = hits.filter(h => {
    if (seen.has(h.institute_code)) return false;
    seen.add(h.institute_code);
    return true;
  });

  return (
    <div>
      {deduped.map((hit, i) => (
        <button
          key={`${hit.institute_code}-${i}`}
          onClick={() => onSelect(hit)}
          style={{
            width:        "100%",
            display:      "flex",
            alignItems:   "center",
            gap:          14,
            padding:      "14px 20px",
            background:   "transparent",
            border:       "none",
            borderBottom: i < deduped.length - 1 ? "1px solid var(--border)" : "none",
            cursor:       "pointer",
            textAlign:    "left",
            transition:   "background 0.1s",
            animation:    `fadeUp 0.2s var(--ease-out) ${i * 30}ms both`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--off-white)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {/* Category dot */}
          <div style={{
            width:       8,
            height:      8,
            borderRadius:"50%",
            background:  categoryColor(hit.category),
            flexShrink:  0,
            marginTop:   2,
          }} />

          {/* Name + code */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily:   "var(--font-body)",
              fontWeight:   600,
              fontSize:     "0.88rem",
              color:        "var(--ink-900)",
              marginBottom: 2,
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}>
              {hit.institute_name}
            </p>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "0.68rem",
              color:      "var(--ink-300)",
            }}>
              {hit.institute_code}
              <span style={{
                marginLeft:  8,
                paddingLeft: 8,
                borderLeft:  "1px solid var(--border)",
                color:       categoryColor(hit.category),
              }}>
                {hit.category}
              </span>
            </p>
          </div>

          {/* Score */}
          {hit.img_total != null && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "1rem",
                fontWeight: 500,
                color:      "var(--ink-900)",
                lineHeight: 1,
              }}>
                {hit.img_total.toFixed(1)}
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.6rem",
                color:      "var(--ink-300)",
                marginTop:  2,
              }}>
                NIRF Score
              </p>
            </div>
          )}

          <span style={{ color: "var(--ink-100)", fontSize: "0.9rem", flexShrink: 0 }}>→</span>
        </button>
      ))}
    </div>
  );
}