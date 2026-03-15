"use client";
/**
 * components/DataTable.tsx
 *
 * Paginated, sortable institute table backed by /api/search.
 * Uses TanStack Table for column management.
 * Clicking a row fires onSelectInstitute.
 */

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { InstituteScore, SearchResponse } from "@/types/nirf";
import { SCORE_LABELS } from "@/types/nirf";

interface Props {
  year:               number | null;
  category:           string;
  q:                  string;
  onSelectInstitute?: (code: string, name: string) => void;
}

const col = createColumnHelper<InstituteScore>();

const COLUMNS = [
  col.accessor("ranking_year", {
    header: "Year",
    size: 60,
    cell: (c) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--amber)" }}>
        {c.getValue()}
      </span>
    ),
  }),
  col.accessor("category", {
    header: "Category",
    size: 110,
    cell: (c) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--slate-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {c.getValue()}
      </span>
    ),
  }),
  col.accessor("institute_name", {
    header: "Institute",
    size: 280,
    cell: (c) => (
      <span style={{ color: "var(--white)", fontSize: "0.78rem" }}>
        {c.getValue() as string}
      </span>
    ),
  }),
  col.accessor("institute_code", {
    header: "Code",
    size: 130,
    cell: (c) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--slate-400)" }}>
        {c.getValue() as string}
      </span>
    ),
  }),
  col.accessor("img_total", {
    header: "Total Score",
    size: 100,
    cell: (c) => {
      const v = c.getValue() as number | null;
      return v != null ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--amber)", fontWeight: 600 }}>
          {v.toFixed(2)}
        </span>
      ) : <span style={{ color: "var(--navy-600)" }}>—</span>;
    },
  }),
  col.accessor("img_ss_score", {
    header: SCORE_LABELS["img_ss_score"],
    size: 100,
    cell: (c) => numCell(c.getValue() as number | null),
  }),
  col.accessor("img_fsr_score", {
    header: SCORE_LABELS["img_fsr_score"],
    size: 110,
    cell: (c) => numCell(c.getValue() as number | null),
  }),
  col.accessor("pdf_placement_placed", {
    header: "Placed",
    size: 80,
    cell: (c) => numCell(c.getValue() as number | null, 0),
  }),
  col.accessor("pdf_median_salary", {
    header: "Median Salary",
    size: 110,
    cell: (c) => {
      const v = c.getValue() as number | null;
      return v != null ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--teal)" }}>
          ₹{(v / 100000).toFixed(1)}L
        </span>
      ) : <span style={{ color: "var(--navy-600)" }}>—</span>;
    },
  }),
];

function numCell(v: number | null, dp = 2) {
  return v != null ? (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--slate-300)" }}>
      {v.toFixed(dp)}
    </span>
  ) : <span style={{ color: "var(--navy-600)" }}>—</span>;
}

const PAGE_SIZE = 25;

export default function DataTable({ year, category, q, onSelectInstitute }: Props) {
  const [response, setResponse]   = useState<SearchResponse | null>(null);
  const [page, setPage]           = useState(1);
  const [sorting, setSorting]     = useState<SortingState>([
    { id: "img_total", desc: true },
  ]);
  const [loading, setLoading]     = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(PAGE_SIZE),
      sortBy:   sorting[0]?.id ?? "img_total",
      sortDir:  sorting[0]?.desc === false ? "asc" : "desc",
    });
    if (year)     params.set("year",     String(year));
    if (category) params.set("category", category);
    if (q)        params.set("q",        q);

    fetch(`/api/search?${params}`)
      .then((r) => r.json())
      .then((d: SearchResponse) => { setResponse(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, category, q, page, sorting]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [year, category, q]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const table = useReactTable({
    data:              response?.rows ?? [],
    columns:           COLUMNS,
    state:             { sorting },
    onSortingChange:   setSorting,
    manualSorting:     true,
    manualPagination:  true,
    getCoreRowModel:   getCoreRowModel(),
  });

  const thStyle: React.CSSProperties = {
    fontFamily:    "var(--font-mono)",
    fontSize:      "0.65rem",
    color:         "var(--slate-400)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding:       "8px 12px",
    textAlign:     "left",
    borderBottom:  "1px solid var(--navy-700)",
    whiteSpace:    "nowrap",
    cursor:        "pointer",
    userSelect:    "none",
    background:    "var(--navy-900)",
    position:      "sticky",
    top:           0,
  };

  const tdStyle: React.CSSProperties = {
    padding:      "9px 12px",
    borderBottom: "1px solid var(--navy-800)",
    verticalAlign:"middle",
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Table header row */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        justifyContent:"space-between",
        padding:       "16px 24px 12px",
      }}>
        <h2 style={{
          fontFamily:  "var(--font-display)",
          fontWeight:  700,
          fontSize:    "1rem",
          color:       "var(--white)",
        }}>
          All Institutes
        </h2>
        {response && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)" }}>
            {response.total.toLocaleString()} records
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width:          "100%",
          borderCollapse: "collapse",
          fontSize:       "0.8rem",
        }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{ ...thStyle, width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === "asc"  && " ↑"}
                      {sorted === "desc" && " ↓"}
                      {!sorted && " ·"}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ ...tdStyle, color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", textAlign: "center", padding: "32px" }}>
                  Loading…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ ...tdStyle, color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", textAlign: "center", padding: "32px" }}>
                  No results.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectInstitute?.(
                    row.original.institute_code,
                    row.original.institute_name
                  )}
                  style={{
                    cursor:     onSelectInstitute ? "pointer" : "default",
                    animation:  `fadeUp 0.3s var(--ease-out) ${i * 15}ms both`,
                    background: "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--navy-800)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={tdStyle}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {response && response.totalPages > 1 && (
        <div style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          gap:           8,
          padding:       "16px 24px 0",
        }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageBtnStyle(page === 1)}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)" }}>
            {page} / {response.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(response.totalPages, p + 1))}
            disabled={page === response.totalPages}
            style={pageBtnStyle(page === response.totalPages)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    fontFamily:    "var(--font-mono)",
    fontSize:      "0.7rem",
    letterSpacing: "0.06em",
    background:    "transparent",
    color:         disabled ? "var(--navy-600)" : "var(--amber)",
    border:        `1px solid ${disabled ? "var(--navy-700)" : "var(--amber-dim)"}`,
    padding:       "5px 12px",
    cursor:        disabled ? "not-allowed" : "pointer",
  };
}