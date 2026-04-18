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