"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import SearchBar from "@/app/components/SearchBar";
import SearchResults from "@/app/components/SearchResults";
import CompareView from "@/app/components/CompareView";
import CompareTray from "@/app/components/CompareTray";

import type { SearchGroup } from "@/app/components/SearchResults";

export interface SearchHit {
  institute_code: string;
  institute_name: string;
  category: string;
  best_year: number;
  img_total: number | null;
}

export default function ComparePage() {
  const router = useRouter();

  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const [comparePicks, setComparePicks] = useState<SearchHit[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔍 SEARCH
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/institute-search?q=${encodeURIComponent(q)}&limit=8`
        );
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  }, []);

  // ➕ ADD TO COMPARE
  const handleSelect = useCallback((hit: SearchHit) => {
    setComparePicks((prev) => {
      if (prev.find((p) => p.institute_code === hit.institute_code))
        return prev;
      if (prev.length >= 4) return prev;
      return [...prev, hit];
    });

    setGroups([]);
    setQuery("");
  }, []);

  const handleRemovePick = (code: string) => {
    setComparePicks((prev) =>
      prev.filter((p) => p.institute_code !== code)
    );
  };

  const handleLaunchCompare = () => {
    if (comparePicks.length >= 2) setShowCompare(true);
  };

  const handleClearCompare = () => {
    setComparePicks([]);
    setShowCompare(false);
  };

  const selectedCodes = comparePicks.map((p) => p.institute_code);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      

      {/* ── MAIN ── */}
      {showCompare ? (
        <main style={{ flex: 1 }}>
          <CompareView
            institutes={comparePicks}
            onRemove={(code) => {
              handleRemovePick(code);
              if (comparePicks.length <= 2) setShowCompare(false);
            }}
            onClose={() => setShowCompare(false)}
          />
        </main>
      ) : (
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "80px 24px",
          }}
        >
          <h1>Compare Institutes</h1>
          <p>Select up to 4 institutes</p>

          <div style={{ width: "100%", maxWidth: 640 }}>
            <SearchBar
              value={query}
              onChange={handleQueryChange}
              loading={loading}
            />

            {query.length >= 2 && (
              <SearchResults
                groups={groups}
                onSelect={handleSelect}
                compareMode={true}
                selectedCodes={selectedCodes}
              />
            )}
          </div>
        </main>
      )}

      {/* ── TRAY ── */}
      {!showCompare && (
        <CompareTray
          selected={comparePicks}
          onRemove={handleRemovePick}
          onCompare={handleLaunchCompare}
          onClear={handleClearCompare}
        />
      )}
    </div>
  );
}