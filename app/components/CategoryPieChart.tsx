"use client";
/**
 * components/CategoryPieChart.tsx
 *
 * Donut chart — institute count per category for a given year.
 * Uses Recharts PieChart.
 */

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { CategoryDistribution } from "@/types/nirf";

interface Props {
  year: number | null;
}

const COLORS = [
  "#f5a623", "#2dd4bf", "#a78bfa", "#f87171",
  "#34d399", "#60a5fa", "#fb923c",
];

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: CategoryDistribution }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--navy-800)",
      border:     "1px solid var(--navy-600)",
      padding:    "10px 14px",
      fontFamily: "var(--font-mono)",
      fontSize:   "0.72rem",
    }}>
      <p style={{ color: "var(--amber)", fontWeight: 600, marginBottom: 4 }}>{d.category}</p>
      <p style={{ color: "var(--slate-300)" }}>
        {d.institute_count} institutes
      </p>
      {d.avg_total != null && (
        <p style={{ color: "var(--teal)", marginTop: 2 }}>
          Avg score: {d.avg_total.toFixed(2)}
        </p>
      )}
    </div>
  );
}

export default function CategoryPieChart({ year }: Props) {
  const [data, setData]       = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) { setData([]); return; }
    setLoading(true);
    fetch(`/api/category-distribution?year=${year}`)
      .then((r) => r.json())
      .then((d: CategoryDistribution[]) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year]);

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <h2 style={{
          fontFamily:   "var(--font-display)",
          fontWeight:   700,
          fontSize:     "1rem",
          color:        "var(--white)",
        }}>
          By Category
        </h2>
        {year && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)" }}>
            {year}
          </span>
        )}
      </div>

      {!year && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Select a year.
        </p>
      )}

      {loading && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Loading…
        </p>
      )}

      {!loading && data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="institute_count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend — custom below chart */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {data.map((d, i) => (
              <div key={d.category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)", flex: 1 }}>
                  {d.category}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-300)" }}>
                  {d.institute_count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}