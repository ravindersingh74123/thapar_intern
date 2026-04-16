"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import SearchBar from "@/app/components/SearchBar";
import SearchResults from "@/app/components/SearchResults";
import type { SearchGroup } from "@/app/components/SearchResults";
import InstituteDetail from "@/app/components/InstituteDetail";
import CompareView from "@/app/components/CompareView";
import CompareTray from "@/app/components/CompareTray";

export interface SearchHit {
  institute_code: string;
  institute_name: string;
  category: string;
  best_year: number;
  img_total: number | null;
  allCodes?: string[];
}

export default function SearchPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [query, setQuery] = useState("");

  const [compareMode, setCompareMode] = useState(false);
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

  // 🎯 SELECT
  const handleSelect = useCallback(
    (hit: SearchHit) => {
      if (compareMode) {
        setComparePicks((prev) => {
          if (prev.find((p) => p.institute_code === hit.institute_code))
            return prev;
          if (prev.length >= 4) return prev;
          return [...prev, hit];
        });

        setGroups([]);
        setQuery("");
        return;
      }

      const group = groups.find(
        (g) => g.institute_name === hit.institute_name
      );

      const allCodes = group
        ? group.entries.map((e) => e.institute_code)
        : [hit.institute_code];

      setSelected({ ...hit, allCodes });
      setGroups([]);
      setQuery("");
    },
    [compareMode, groups]
  );

  const handleBack = useCallback(() => {
    setSelected(null);
    setShowCompare(false);
  }, []);

  const handleRemovePick = useCallback((code: string) => {
    setComparePicks((prev) =>
      prev.filter((p) => p.institute_code !== code)
    );
  }, []);

  const handleClearCompare = useCallback(() => {
    setComparePicks([]);
    setShowCompare(false);
  }, []);

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        setComparePicks([]);
        setShowCompare(false);
      }
      return !prev;
    });
  }, []);

  const handleLaunchCompare = useCallback(() => {
    if (comparePicks.length >= 2) setShowCompare(true);
  }, [comparePicks]);

  const showResults = query.length >= 2;
  const showEmpty = showResults && !loading && groups.length === 0;

  const compareBtnLabel = compareMode
    ? comparePicks.length > 0
      ? `Exit Compare (${comparePicks.length})`
      : "Exit Compare"
    : "⇄ Compare";

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
      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: compareMode ? "var(--crimson-pale)" : "var(--white)",
          padding: "0 32px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            fontSize: "1.1rem",
            color: "var(--crimson)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          NIRF
        </button>

        <span style={{ color: "var(--border-dark)" }}>·</span>

        <span style={{ fontSize: "0.78rem", color: "var(--ink-500)" }}>
          Institute Explorer
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {(selected || showCompare) && (
            <button onClick={handleBack}>← New Search</button>
          )}

          {!selected && !showCompare && (
            <button onClick={handleToggleCompareMode}>
              {compareBtnLabel}
            </button>
          )}

          <button onClick={() => router.push("/ranking")}>
            ≡ Ranking
          </button>
        </div>
      </header>

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
      ) : selected ? (
        <main style={{ flex: 1 }}>
          <InstituteDetail
            hit={selected}
            initialCategory={selected.category}
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
          {!compareMode && (
            <>
              <h1>Search Institutes</h1>
              <p>Type name or code</p>
            </>
          )}

          {/* SEARCH */}
          <div style={{ width: "100%", maxWidth: 640 }}>
            <SearchBar
              value={query}
              onChange={handleQueryChange}
              loading={loading}
            />

            {showResults && (
              <div>
                {showEmpty ? (
                  <p>No results for "{query}"</p>
                ) : (
                  <SearchResults
                    groups={groups}
                    onSelect={handleSelect}
                    compareMode={compareMode}
                    selectedCodes={selectedCodes}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── COMPARE TRAY ── */}
      {compareMode && !showCompare && (
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