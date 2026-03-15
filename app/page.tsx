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







"use client";
import { useState, useCallback, useRef } from "react";
import SearchBar       from "@/app/components/SearchBar";
import SearchResults   from "@/app/components/SearchResults";
import InstituteDetail from "@/app/components/InstituteDetail";

export interface SearchHit {
  institute_code: string;
  institute_name: string;
  category:       string;
  best_year:      number;
  img_total:      number | null;
}

export default function HomePage() {
  const [hits, setHits]           = useState<SearchHit[]>([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<SearchHit | null>(null);
  const [query, setQuery]         = useState("");
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/institute-search?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setHits(Array.isArray(data) ? data : []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  }, []);

  const handleSelect = useCallback((hit: SearchHit) => {
    setSelected(hit);
    setHits([]);
    setQuery("");
  }, []);

  const handleBack = useCallback(() => {
    setSelected(null);
  }, []);

  const showResults = query.length >= 2;
  const showEmpty   = showResults && !loading && hits.length === 0;

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "var(--paper)",
      display:     "flex",
      flexDirection: "column",
    }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background:   "var(--white)",
        padding:      "0 32px",
        height:       52,
        display:      "flex",
        alignItems:   "center",
        gap:          12,
      }}>
        <button
          onClick={handleBack}
          style={{
            fontFamily:  "var(--font-display)",
            fontStyle:   "italic",
            fontSize:    "1.1rem",
            color:       "var(--crimson)",
            background:  "none",
            border:      "none",
            cursor:      "pointer",
            letterSpacing: "0.01em",
            padding:     0,
          }}
        >
          NIRF
        </button>
        <span style={{ color: "var(--border-dark)", fontSize: "1.1rem" }}>·</span>
        <span style={{
          fontFamily:  "var(--font-body)",
          fontSize:    "0.78rem",
          color:       "var(--ink-500)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontWeight:  500,
        }}>
          Institute Explorer
        </span>

        {selected && (
          <button
            onClick={handleBack}
            style={{
              marginLeft:  "auto",
              fontFamily:  "var(--font-body)",
              fontSize:    "0.75rem",
              color:       "var(--ink-500)",
              background:  "none",
              border:      "1px solid var(--border)",
              padding:     "4px 12px",
              cursor:      "pointer",
              letterSpacing: "0.02em",
            }}
          >
            ← New Search
          </button>
        )}
      </header>

      {/* ── Main ── */}
      {!selected ? (
        /* Search view */
        <main style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          paddingTop:    "clamp(48px, 10vh, 120px)",
          padding:       "clamp(48px, 10vh, 120px) 24px 48px",
        }}>
          {/* Hero title */}
          <div style={{
            textAlign:   "center",
            marginBottom: 36,
            animation:   "fadeUp 0.5s var(--ease-out) both",
          }}>
            <h1 style={{
              fontFamily:   "var(--font-display)",
              fontStyle:    "italic",
              fontSize:     "clamp(2rem, 5vw, 3.2rem)",
              color:        "var(--ink-900)",
              lineHeight:   1.1,
              marginBottom: 10,
            }}>
              National Institutional<br />Ranking Framework
            </h1>
            <p style={{
              fontFamily:  "var(--font-body)",
              fontSize:    "0.9rem",
              color:       "var(--ink-500)",
              letterSpacing: "0.02em",
            }}>
              Search any institute by name or code to explore its full ranking history
            </p>
          </div>

          {/* Search + results */}
          <div style={{
            width:    "100%",
            maxWidth: 620,
            position: "relative",
            animation: "fadeUp 0.5s var(--ease-out) 80ms both",
          }}>
            <SearchBar
              value={query}
              onChange={handleQueryChange}
              loading={loading}
            />

            {showResults && (
              <div style={{
                position:  "absolute",
                top:       "calc(100% + 6px)",
                left:      0,
                right:     0,
                zIndex:    50,
                background: "var(--white)",
                border:    "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                animation: "scaleIn 0.15s var(--ease-out) both",
              }}>
                {showEmpty ? (
                  <div style={{
                    padding:    "20px 24px",
                    fontFamily: "var(--font-mono)",
                    fontSize:   "0.75rem",
                    color:      "var(--ink-300)",
                    textAlign:  "center",
                  }}>
                    No institutes found for "{query}"
                  </div>
                ) : (
                  <SearchResults hits={hits} onSelect={handleSelect} />
                )}
              </div>
            )}
          </div>

          {/* Hint text */}
          {!showResults && (
            <p style={{
              marginTop:   24,
              fontFamily:  "var(--font-mono)",
              fontSize:    "0.72rem",
              color:       "var(--ink-300)",
              animation:   "fadeIn 0.5s var(--ease-out) 200ms both",
            }}>
              Try "IIT Delhi", "IR-O-U-0456", or "TIET"
            </p>
          )}
        </main>
      ) : (
        /* Detail view */
        <main style={{
          flex:      1,
          animation: "fadeUp 0.4s var(--ease-out) both",
        }}>
          <InstituteDetail hit={selected} />
        </main>
      )}
    </div>
  );
}