"use client";
// app/components/TopBar.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Props {
  user: { name: string; email: string };
}

export default function TopBar({ user }: Props) {
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
    <header className="sticky top-0 z-50 h-[54px] flex items-center px-6 gap-4 border-[#ddeaed]/70 bg-white/70 backdrop-blur-xl border-b  shadow-md">

      {/* ── Logo ── */}
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <img
          src="/logo.png"
          alt="BanavatNest"
          className="h-[30px] w-auto object-contain"
        />
        <div className="w-[1px] h-[22px] bg-[#2aacb84d]" />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[#2aacb8]">
          NIRF Explorer
        </span>
      </Link>

      {/* ── Nav ── */}
      <nav className="flex items-center gap-1 ml-2">
        <NavLink href="/search">Search</NavLink>
        <NavLink href="/ranking">Rankings</NavLink>
      </nav>

      <div className="flex-1" />

      {/* ── User Menu ── */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 border border-[#2aacb840] hover:border-[#2aacb8] rounded px-3 py-1.5 transition"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2aacb8] to-[#1a7a85] flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>

          <div className="text-left max-w-[140px]">
            <p className="text-xs font-semibold text-[#e8f4f5] truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-[#2aacb8aa] truncate">
              {user.email}
            </p>
          </div>

          {/* Chevron */}
          <svg
            className={`w-3 h-3 text-[#2aacb899] transition ${
              menuOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />

            <div className="absolute right-0 mt-2 z-20 w-[190px] bg-[#0f1f2e] border border-[#2aacb833] shadow-xl animate-fadeUp">
              
              {/* User Info */}
              <div className="px-4 py-3 border-b border-[#2aacb820]">
                <p className="text-[10px] uppercase tracking-wider text-[#2aacb880]">
                  Signed in as
                </p>
                <p className="text-sm text-white font-medium">
                  {user.name}
                </p>
                <p className="text-xs text-[#2aacb8aa]">
                  {user.email}
                </p>
              </div>

              {/* Links */}
              <div className="py-1">
                <DropdownItem href="/search" label="Search Institutes" />
                <DropdownItem href="/ranking" label="View Rankings" />
              </div>

              {/* Logout */}
              <div className="border-t border-[#2aacb820] py-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition
                    ${
                      loggingOut
                        ? "text-red-400/40 cursor-wait"
                        : "text-red-400 hover:bg-red-500/10"
                    }`}
                >
                  {loggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
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
function DropdownItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-[#c8e6e8cc] hover:text-[#2aacb8] hover:bg-[#2aacb815] transition"
    >
      {label}
    </Link>
  );
}