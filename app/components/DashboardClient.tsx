//app/components/DashboardClient.tsx
"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Building2,
  Layers3,
  Activity,
  Clock,
} from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Props {
  user: { name: string; email: string };
}

const stats = [
  {
    label: "Institutes indexed",
    value: "6,000+",
    sub: "Across all categories",
    icon: Building2,
  },
  {
    label: "Ranking parameters",
    value: "10",
    sub: "NIRF methodology",
    icon: TrendingUp,
  },
  {
    label: "Data freshness",
    value: "96%",
    sub: "Verified quality",
    icon: ShieldCheck,
  },
  {
    label: "Monthly searches",
    value: "42K",
    sub: "+18% vs last month",
    icon: Activity,
  },
];

const features = [
  {
    title: "Smart Search",
    desc: "Find institutes by name, code, category, or region.",
    icon: Search,
    bg: "#e0f6f9",
    color: "#2c9fb0",
  },
  {
    title: "Live Rankings",
    desc: "Explore NIRF rankings with category-wise breakdown.",
    icon: BarChart3,
    bg: "#dce2ec",
    color: "#24304d",
  },
  {
    title: "Compare",
    desc: "Compare multiple institutes side-by-side with clarity.",
    icon: Layers3,
    bg: "#e8f6da",
    color: "#4a8c1a",
  },
  {
    title: "Trusted data",
    desc: "NIRF-verified information, refreshed regularly.",
    icon: ShieldCheck,
    bg: "#e0f6f9",
    color: "#2c9fb0",
  },
];

const recentActivity = [
  { label: "NIRF data synced", time: "9:12 AM", color: "#2c9fb0" },
  { label: "High search activity", time: "8:40 AM", color: "#6bbf3d" },
  { label: "Comparison flow used", time: "Yesterday", color: "#24304d" },
];

const highlights = [
  "Compare institutes with live ranking data",
  "Search by name, category, or region",
  "Built for fast discovery",
  "NIRF-verified data sources",
  "Clean and trusted interface",
  "Explore all 10 ranking parameters",
];

// ─── Nest SVG mark ────────────────────────────────────────────────────────────

function NestMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 60 44" fill="none">
      <path
        d="M2 38 C12 24 26 20 42 25 C50 28 56 34 54 40"
        stroke="#c8d4e8"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <path
        d="M4 42 C14 28 28 24 44 29 C52 32 58 38 56 43"
        stroke="#c8d4e8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M5 32 C15 18 30 15 46 20 C54 23 58 30 55 36"
        stroke="#2c9fb0"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="17"
        cy="15"
        rx="6.5"
        ry="3.2"
        fill="#6bbf3d"
        transform="rotate(-32 17 15)"
      />
      <ellipse
        cx="38"
        cy="12"
        rx="6.5"
        ry="3.2"
        fill="#6bbf3d"
        transform="rotate(28 38 12)"
      />
      <ellipse
        cx="50"
        cy="24"
        rx="5.5"
        ry="2.8"
        fill="#6bbf3d"
        transform="rotate(15 50 24)"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardClient({ user }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Initials avatar
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f0f7f8] text-[#24304d]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(44,159,176,0.13) 0%, transparent 60%)",
            "radial-gradient(ellipse 40% 30% at 90% 80%, rgba(107,191,61,0.07) 0%, transparent 60%)",
          ].join(","),
        }}
      />

      {/* ══ HEADER ════════════════════════════════════════════════════════ */}
      {/* <TopBar user={user} /> */}

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="mb-14">
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "rgba(44,159,176,0.08)",
              border: "1px solid rgba(44,159,176,0.20)",
              color: "#2c9fb0",
            }}
          >
            <Sparkles size={11} />
            Platform Overview
          </div>

          {/* Two-column */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
            {/* Left */}
            <div>
              <h1
                className="mb-5 font-black leading-[0.92] tracking-[-0.04em]"
                style={{ fontSize: "clamp(48px, 7vw, 86px)" }}
              >
                Discover institutes
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, #2c9fb0 0%, #38bdf8 50%, #6bbf3d 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "shimmer 5s linear infinite",
                    display: "inline-block",
                  }}
                >
                  smarter.
                </span>
              </h1>

              <p
                className="mb-8 max-w-[500px] text-[15px] leading-[1.85]"
                style={{ color: "#6a8a98" }}
              >
                Explore rankings, compare institutions, and find the right
                academic fit through a clean, fast, and trusted interface.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  className="group flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "#2c9fb0",
                    boxShadow: "0 8px 24px rgba(44,159,176,0.28)",
                  }}
                >
                  <Search size={15} />
                  Search Institutes
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
                <Link
                  href="/ranking"
                  className="flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d0dde8",
                    color: "#24304d",
                  }}
                >
                  <BarChart3 size={15} />
                  View Rankings
                </Link>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-4">
              {/* Navy mission card */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-white"
                style={{ background: "#24304d" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
                  style={{ background: "rgba(44,159,176,0.12)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full"
                  style={{ background: "rgba(107,191,61,0.10)" }}
                />
                <div className="relative">
                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    Mission
                  </p>
                  <p className="text-xl font-black leading-snug">
                    Build with Purpose.
                    <br />
                    <span style={{ color: "#2c9fb0" }}>Nurture</span> to Impact.
                  </p>
                  <p
                    className="mt-3 text-[12px] leading-6"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    A trusted platform for academic discovery and NIRF ranking
                    exploration.
                  </p>
                  <div
                    className="mt-4 flex items-center gap-2 text-[12px]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: "#6bbf3d" }}
                    />
                    Fresh · Trustworthy · Modern
                  </div>
                </div>
              </div>

              {/* Live activity */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #ddeaed",
                  boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "#24304d" }}
                  >
                    Recent activity
                  </span>
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(107,191,61,0.10)" }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#6bbf3d" }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#4a8c1a" }}
                    >
                      Live
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {recentActivity.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        background: "#f8fcfd",
                        border: "1px solid #e8f2f5",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: "#24304d" }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "#94adb5" }}
                      >
                        <Clock size={10} />
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="mb-14">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ddeaed",
                    boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
                  }}
                >
                  <div className="mb-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: "rgba(44,159,176,0.10)" }}
                    >
                      <Icon size={16} style={{ color: "#2c9fb0" }} />
                    </div>
                  </div>
                  <div
                    className="text-[30px] font-black leading-none tracking-tight"
                    style={{ color: "#24304d" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="mt-1.5 text-[11px] font-semibold"
                    style={{ color: "#94adb5" }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="mt-1 text-[11px] font-medium"
                    style={{ color: "#2c9fb0" }}
                  >
                    {s.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="mb-14">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#ffffff",
              border: "1px solid #ddeaed",
              boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
            }}
          >
            <div
              className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "#2c9fb0" }}
            >
              What you can do
            </div>
            <div
              className="mb-6 text-[15px] font-bold"
              style={{ color: "#24304d" }}
            >
              Simple entry points for every user
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "#f8fcfd",
                      border: "1px solid #e8f2f5",
                    }}
                  >
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: f.bg }}
                    >
                      <Icon size={16} style={{ color: f.color }} />
                    </div>
                    <div
                      className="mb-1 text-[13px] font-bold"
                      style={{ color: "#24304d" }}
                    >
                      {f.title}
                    </div>
                    <div
                      className="text-[11px] leading-5"
                      style={{ color: "#7a9aaa" }}
                    >
                      {f.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── MARQUEE ───────────────────────────────────────────────────── */}
        <section
          className="overflow-hidden rounded-2xl py-4"
          style={{
            background: "#ffffff",
            border: "1px solid #ddeaed",
            boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "40px",
              width: "max-content",
              animation: "marquee 22s linear infinite",
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            {[...highlights, ...highlights].map((item, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-4 whitespace-nowrap text-[12px] font-semibold"
                style={{ color: "#7a9aaa" }}
              >
                {item}
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#2c9fb0" }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer
        className="relative z-10 mx-auto max-w-[1400px] px-6 pb-8 pt-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] lg:px-10"
        style={{ color: "#b8cdd4" }}
      >
        BanavatNest · Build with Purpose. Nurture to Impact.
      </footer>

      {/* ══ KEYFRAMES ═════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0%   center; }
          100% { background-position: 200% center; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* ── Nav Link ── */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[10px] uppercase tracking-wide text-[#c8e6e8aa] hover:text-[#2aacb8] hover:bg-[#2aacb815] px-3 py-1 rounded transition"
    >
      {children}
    </Link>
  );
}

/* ── Dropdown Item ── */
function DropdownItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-[#c8e6e8cc] hover:text-[#2aacb8] hover:bg-[#2aacb815] transition"
    >
      {label}
    </Link>
  );
}
