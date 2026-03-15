"use client";
/**
 * IntakeTable.tsx
 * Renders Sanctioned (Approved) Intake data in a pivot table:
 *   Rows    = Program type  (UG 4yr, PG 2yr, PhD, ...)
 *   Columns = Academic year (2016-17, 2017-18, ...)
 *   Cell    = Intake number
 */

interface RawMetric {
  metric:       string;
  year:         string;
  value:        string;
  ranking_year: number;
  program:      string;
}

interface Props {
  metrics:     RawMetric[];
  activeYear:  number | null;
}

// Clean up year display — "2021-22" stays, "<NA>" / "nan" / "-" → null
function cleanYear(y: string): string | null {
  if (!y || y === "<NA>" || y === "nan" || y === "-" || y === "null" || y === "undefined") return null;
  return y.trim();
}

// Clean up value — nan / null / "-" → null, otherwise parse number
function cleanValue(v: string): number | null {
  if (!v || v === "nan" || v === "<NA>" || v === "-" || v === "null") return null;
  const n = Number(v.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

// Shorten long program names
function shortProgram(p: string): string {
  return p
    .replace("Program(s)", "Prog")
    .replace("program(s)", "Prog")
    .replace(/\[(\d+) Years? Prog\]/, "[$1 Yr]")
    .replace(/\[(\d+) Year Prog\]/, "[$1 Yr]")
    .trim();
}

export default function IntakeTable({ metrics, activeYear }: Props) {
  if (!metrics.length) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-300)", padding: "16px 0" }}>
        No intake data available.
      </p>
    );
  }

  // Filter to active year's ranking data if set
  const rows = activeYear
    ? metrics.filter(m => m.ranking_year === activeYear)
    : metrics;

  // Get unique programs and academic years (sorted)
  const programs = [...new Set(rows.map(r => r.program).filter(Boolean))].sort();
  const acadYears = [...new Set(
    rows.map(r => cleanYear(r.year)).filter((y): y is string => y !== null)
  )].sort();

  // If no academic years at all, fall back to simple list
  const hasYears = acadYears.length > 0;

  // Build pivot: program → acadYear → value
  const pivot: Record<string, Record<string, number | null>> = {};
  for (const row of rows) {
    const prog = row.program || "—";
    const yr   = cleanYear(row.year);
    const val  = cleanValue(row.value);
    if (!pivot[prog]) pivot[prog] = {};
    if (yr) {
      pivot[prog][yr] = val;
    } else {
      // No year — store under a blank key for "Total / Single value"
      pivot[prog]["__nototal__"] = val;
    }
  }

  // Total intake per program (sum across years)
  function programTotal(prog: string): number | null {
    const vals = Object.values(pivot[prog] || {}).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }

  // Grand total
  const grandTotal = programs.reduce((sum, prog) => {
    const t = programTotal(prog);
    return t !== null ? sum + t : sum;
  }, 0);

  const cellStyle: React.CSSProperties = {
    fontFamily:  "var(--font-mono)",
    fontSize:    "0.75rem",
    textAlign:   "right",
    padding:     "9px 14px",
    borderBottom:"1px solid var(--border)",
    color:       "var(--ink-700)",
  };

  const headerStyle: React.CSSProperties = {
    fontFamily:    "var(--font-mono)",
    fontSize:      "0.6rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    color:         "var(--ink-400)",
    padding:       "8px 14px",
    textAlign:     "right" as const,
    borderBottom:  "2px solid var(--border)",
    whiteSpace:    "nowrap" as const,
    background:    "var(--off-white)",
  };

  const programHeaderStyle: React.CSSProperties = {
    ...headerStyle,
    textAlign: "left" as const,
  };

  const programCellStyle: React.CSSProperties = {
    ...cellStyle,
    textAlign:   "left",
    fontFamily:  "var(--font-body)",
    fontSize:    "0.78rem",
    color:       "var(--ink-700)",
    fontWeight:  500,
  };

  return (
    <div>
      {/* Summary KV cards */}
      {grandTotal > 0 && (
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap:                 10,
          marginBottom:        16,
        }}>
          <div style={{
            background: "var(--crimson-pale)",
            border:     "1px solid rgba(192,57,43,0.18)",
            padding:    "14px 16px",
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--crimson)", marginBottom: 5 }}>
              Total Intake
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.9rem", color: "var(--crimson-dark)", lineHeight: 1 }}>
              {grandTotal.toLocaleString("en-IN")}
            </p>
          </div>

          {programs.length > 1 && programs.slice(0, 3).map(prog => {
            const t = programTotal(prog);
            if (!t) return null;
            return (
              <div key={prog} style={{
                background: "var(--off-white)",
                border:     "1px solid var(--border)",
                padding:    "14px 16px",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--ink-400)", marginBottom: 5 }}>
                  {shortProgram(prog)}
                </p>
                <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.35rem", color: "var(--ink-900)", lineHeight: 1 }}>
                  {t.toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pivot table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border)", background: "var(--white)" }}>
        {hasYears ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th style={{ ...programHeaderStyle, minWidth: 180 }}>Program</th>
                {acadYears.map(yr => (
                  <th key={yr} style={headerStyle}>{yr}</th>
                ))}
                <th style={{ ...headerStyle, color: "var(--crimson)", borderLeft: "1px solid var(--border)" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog, pi) => {
                const total = programTotal(prog);
                return (
                  <tr
                    key={prog}
                    style={{ background: pi % 2 === 0 ? "transparent" : "var(--off-white)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--crimson-pale)")}
                    onMouseLeave={e => (e.currentTarget.style.background = pi % 2 === 0 ? "transparent" : "var(--off-white)")}
                  >
                    <td style={programCellStyle}>{shortProgram(prog)}</td>
                    {acadYears.map(yr => {
                      const val = pivot[prog]?.[yr];
                      return (
                        <td key={yr} style={cellStyle}>
                          {val != null ? val.toLocaleString("en-IN") : (
                            <span style={{ color: "var(--ink-100)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{
                      ...cellStyle,
                      fontWeight:  600,
                      color:       total ? "var(--crimson-dark)" : "var(--ink-100)",
                      borderLeft:  "1px solid var(--border)",
                      background:  "var(--crimson-pale)",
                    }}>
                      {total != null ? total.toLocaleString("en-IN") : "—"}
                    </td>
                  </tr>
                );
              })}

              {/* Grand total row */}
              {programs.length > 1 && (
                <tr style={{ background: "var(--off-white)", borderTop: "2px solid var(--border)" }}>
                  <td style={{ ...programCellStyle, fontWeight: 700, color: "var(--ink-900)" }}>
                    Grand Total
                  </td>
                  {acadYears.map(yr => {
                    const colTotal = programs.reduce((sum, prog) => {
                      const v = pivot[prog]?.[yr];
                      return v != null ? sum + v : sum;
                    }, 0);
                    return (
                      <td key={yr} style={{ ...cellStyle, fontWeight: 600 }}>
                        {colTotal > 0 ? colTotal.toLocaleString("en-IN") : (
                          <span style={{ color: "var(--ink-100)" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{
                    ...cellStyle,
                    fontWeight: 700,
                    color:      "var(--crimson-dark)",
                    borderLeft: "1px solid var(--border)",
                    background: "var(--crimson-pale)",
                  }}>
                    {grandTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          // No year data — simple program → value list
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th style={programHeaderStyle}>Program</th>
                <th style={headerStyle}>Intake</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog, pi) => {
                const val = pivot[prog]?.["__nototal__"] ?? programTotal(prog);
                return (
                  <tr key={prog} style={{ background: pi % 2 === 0 ? "transparent" : "var(--off-white)" }}>
                    <td style={programCellStyle}>{shortProgram(prog)}</td>
                    <td style={cellStyle}>
                      {val != null ? val.toLocaleString("en-IN") : <span style={{ color: "var(--ink-100)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}