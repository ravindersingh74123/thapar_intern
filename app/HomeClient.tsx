"use client";
// app/HomeClient.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  user: { name: string; email: string };
}

export default function HomeClient({ user }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "var(--paper)",
      display:     "flex",
      flexDirection: "column",
    }}>
      {/* ── Top bar ── */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background:   "var(--white)",
        padding:      "0 32px",
        height:       52,
        display:      "flex",
        alignItems:   "center",
        gap:          12,
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontStyle:  "italic",
          fontSize:   "1.1rem",
          color:      "var(--crimson)",
        }}>
          NIRF
        </span>
        <span style={{ color: "var(--border-dark)" }}>·</span>
        <span style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "0.78rem",
          color:         "var(--ink-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
          Institute Explorer
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "0.68rem",
            color:      "var(--ink-400)",
          }}>
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              background:    "transparent",
              color:         "var(--ink-400)",
              border:        "1px solid var(--border)",
              padding:       "4px 12px",
              cursor:        loggingOut ? "wait" : "pointer",
              transition:    "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--crimson)";
              e.currentTarget.style.borderColor = "var(--crimson)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ink-400)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 720, width: "100%" }}>
          <h1 style={{
            fontFamily:   "var(--font-display)",
            fontStyle:    "italic",
            fontSize:     "clamp(2.2rem, 5vw, 3.5rem)",
            color:        "var(--ink-900)",
            lineHeight:   1.1,
            marginBottom: 16,
          }}>
            National Institutional<br />Ranking Framework
          </h1>

          <p style={{
            fontFamily:   "var(--font-body)",
            fontSize:     "1rem",
            color:        "var(--ink-500)",
            marginBottom: 32,
          }}>
            Explore institutes, compare them, and analyze rankings — all in one place.
          </p>

          <div style={{
            display:        "flex",
            justifyContent: "center",
            gap:            12,
            flexWrap:       "wrap",
          }}>
            <Link href="/search" style={{
              textDecoration: "none",
              border:         "1px solid var(--crimson)",
              padding:        "10px 18px",
              fontSize:       "0.9rem",
              color:          "var(--crimson)",
              transition:     "all 0.15s",
            }}>
              🔍 Search Institutes
            </Link>
            <Link href="/ranking" style={{
              textDecoration: "none",
              border:         "1px solid var(--border)",
              padding:        "10px 18px",
              fontSize:       "0.9rem",
              color:          "var(--ink-700)",
            }}>
              📊 View Rankings
            </Link>
          </div>

          <p style={{
            marginTop:  28,
            fontFamily: "var(--font-mono)",
            fontSize:   "0.75rem",
            color:      "var(--ink-300)",
          }}>
            Try exploring IITs, IISc, or search by institute code
          </p>
        </div>
      </main>
    </div>
  );
}