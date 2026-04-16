"use client";

import { useRouter } from "next/navigation";
import RankingView from "@/app/components/RankingView";
import type { SearchHit } from "@/app/search/page";

export default function RankingPage() {
  const router = useRouter();

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
          background: "var(--white)",
          padding: "0 32px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Logo / Home */}
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

        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--ink-500)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Rankings
        </span>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => router.push("/search")}
            style={{
              fontSize: "0.75rem",
              background: "none",
              border: "1px solid var(--border)",
              padding: "4px 12px",
              cursor: "pointer",
            }}
          >
            ← Back to Search
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main
        style={{
          flex: 1,
          animation: "fadeUp 0.35s var(--ease-out) both",
        }}
      >
        <RankingView
          onSelectInstitute={(hit: SearchHit) => {
            // Navigate to search page with selected institute
            router.push(`/search?selected=${hit.institute_code}`);
          }}
        />
      </main>
    </div>
  );
}