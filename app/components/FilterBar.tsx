"use client";
/**
 * components/FilterBar.tsx
 *
 * Sticky top filter bar with year, category, and free-text search.
 * Calls onFilterChange whenever any filter updates.
 */

import { useEffect, useState } from "react";
import type { FiltersResponse } from "@/types/nirf";

export interface Filters {
  year:     number | null;
  category: string;
  q:        string;
}

interface Props {
  onFilterChange: (f: Filters) => void;
}

export default function FilterBar({ onFilterChange }: Props) {
  const [options, setOptions]   = useState<FiltersResponse | null>(null);
  const [year, setYear]         = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [q, setQ]               = useState("");

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then((data: FiltersResponse) => {
        setOptions(data);
        // Default to most recent year
        if (data.years.length > 0) {
          setYear(data.years[0]);
        }
      });
  }, []);

  useEffect(() => {
    onFilterChange({ year, category, q });
  }, [year, category, q]);

  const selectStyle: React.CSSProperties = {
    fontFamily:      "var(--font-mono)",
    fontSize:        "0.75rem",
    background:      "var(--navy-800)",
    color:           "var(--slate-300)",
    border:          "1px solid var(--navy-600)",
    padding:         "6px 10px",
    cursor:          "pointer",
    outline:         "none",
    appearance:      "none" as const,
    WebkitAppearance:"none" as const,
    minWidth:        "140px",
    letterSpacing:   "0.03em",
  };

  return (
    <div style={{
      position:       "sticky",
      top:            0,
      zIndex:         50,
      background:     "var(--navy-900)",
      borderBottom:   "1px solid var(--navy-700)",
      padding:        "12px 24px",
      display:        "flex",
      alignItems:     "center",
      gap:            "12px",
      flexWrap:       "wrap",
    }}>
      {/* Logo / title */}
      <span style={{
        fontFamily:   "var(--font-display)",
        fontWeight:   800,
        fontSize:     "1rem",
        color:        "var(--amber)",
        letterSpacing:"0.02em",
        marginRight:  "12px",
        flexShrink:   0,
      }}>
        NIRF<span style={{ color: "var(--slate-400)", fontWeight: 400 }}>·analytics</span>
      </span>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: "var(--navy-600)", flexShrink: 0 }} />

      {/* Year picker */}
      <div style={{ position: "relative" }}>
        <label style={{ fontSize: "0.65rem", color: "var(--slate-400)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
          Year
        </label>
        <select
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
          style={selectStyle}
        >
          <option value="">All years</option>
          {options?.years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Category picker */}
      <div style={{ position: "relative" }}>
        <label style={{ fontSize: "0.65rem", color: "var(--slate-400)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={selectStyle}
        >
          <option value="">All categories</option>
          {options?.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Free-text search */}
      <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
        <label style={{ fontSize: "0.65rem", color: "var(--slate-400)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Institute name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            ...selectStyle,
            width:       "100%",
            minWidth:    0,
            background:  "var(--navy-800)",
          }}
        />
      </div>

      {/* Export button */}
      <div style={{ marginLeft: "auto" }}>
        <label style={{ fontSize: "0.65rem", color: "transparent", display: "block", marginBottom: 2 }}>·</label>
        <a
          href={`/api/export-csv${year ? `?year=${year}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:         "var(--amber)",
            border:        "1px solid var(--amber-dim)",
            padding:       "6px 14px",
            textDecoration:"none",
            display:       "inline-block",
            transition:    "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--amber-glow)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ↓ Export CSV
        </a>
      </div>
    </div>
  );
}