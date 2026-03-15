"use client";
/**
 * components/TrendChart.tsx
 *
 * Multi-line year-over-year trend chart for selected institutes.
 * Uses Recharts LineChart.
 */

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { TrendsResponse } from "@/types/nirf";

interface Props {
  codes:     string[];   // institute_code array — up to 5 for readability
  category:  string;
  scoreCol?: string;
  height?:   number;
}

// Colour palette for up to 8 lines
const LINE_COLORS = [
  "#f5a623", "#2dd4bf", "#a78bfa", "#f87171",
  "#34d399", "#60a5fa", "#fb923c", "#e879f9",
];

// Recharts custom tooltip
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--navy-800)",
      border:     "1px solid var(--navy-600)",
      padding:    "10px 14px",
      fontFamily: "var(--font-mono)",
      fontSize:   "0.72rem",
    }}>
      <p style={{ color: "var(--amber)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name.length > 28 ? p.name.slice(0, 26) + "…" : p.name}
          <span style={{ color: "var(--white)", marginLeft: 8, fontWeight: 600 }}>
            {p.value?.toFixed(2)}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({
  codes,
  category,
  scoreCol = "img_total",
  height = 280,
}: Props) {
  const [data, setData]       = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codes.length || !category) { setData(null); return; }
    setLoading(true);

    const params = new URLSearchParams({
      codes:    codes.join(","),
      category,
      scoreCol,
    });

    fetch(`/api/trends?${params}`)
      .then((r) => r.json())
      .then((d: TrendsResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [codes.join(","), category, scoreCol]);

  // Build flat data for Recharts: [{year: 2016, "IIT Delhi": 88.5, ...}, ...]
  const chartData = data?.years.map((year) => {
    const point: Record<string, number | string> = { year };
    data.series.forEach((s) => {
      const found = s.data.find((d) => d.year === year);
      if (found?.value != null) {
        point[s.institute_name] = found.value;
      }
    });
    return point;
  }) ?? [];

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <h2 style={{
          fontFamily:   "var(--font-display)",
          fontWeight:   700,
          fontSize:     "1rem",
          color:        "var(--white)",
        }}>
          Year-on-Year Trend
        </h2>
        {category && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--slate-400)" }}>
            {category}
          </span>
        )}
      </div>

      {!codes.length && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Click institutes in the rankings to compare trends.
        </p>
      )}

      {loading && (
        <p style={{ color: "var(--slate-400)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          Loading…
        </p>
      )}

      {!loading && data && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="var(--navy-700)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--slate-400)" }}
              axisLine={{ stroke: "var(--navy-600)" }}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--slate-400)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily:  "var(--font-mono)",
                fontSize:    "0.65rem",
                color:       "var(--slate-400)",
                paddingTop:  "12px",
              }}
            />
            {data.series.map((s, i) => (
              <Line
                key={s.institute_code}
                type="monotone"
                dataKey={s.institute_name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={i === 0 ? 2.5 : 1.5}
                dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}