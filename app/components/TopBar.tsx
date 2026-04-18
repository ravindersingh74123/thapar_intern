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
    <header
      style={{
        position:     "sticky",
        top:          0,
        zIndex:       100,
        background:   "#0f1f2e",
        borderBottom: "1px solid rgba(42,172,184,0.18)",
        height:       54,
        display:      "flex",
        alignItems:   "center",
        padding:      "0 24px",
        gap:          16,
        boxShadow:    "0 1px 12px rgba(0,0,0,0.18)",
      }}
    >
      {/* ── Logo ── */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <img
          src="/logo.webp"
          alt="BanavatNest"
          style={{ height: 30, width: "auto", objectFit: "contain" }}
        />
        <div style={{ width: 1, height: 22, background: "rgba(42,172,184,0.3)" }} />
        <span style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color:         "#2aacb8",
          fontWeight:    600,
        }}>
          NIRF Explorer
        </span>
      </Link>

      {/* ── Nav links ── */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
        <NavLink href="/search">Search</NavLink>
        <NavLink href="/ranking">Rankings</NavLink>
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── User menu ── */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            background:   "transparent",
            border:       "1px solid rgba(42,172,184,0.25)",
            borderRadius: 4,
            padding:      "5px 10px 5px 6px",
            cursor:       "pointer",
            transition:   "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(42,172,184,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(42,172,184,0.25)")}
        >
          {/* Avatar circle */}
          <div style={{
            width:          28,
            height:         28,
            borderRadius:   "50%",
            background:     "linear-gradient(135deg, #2aacb8, #1a7a85)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontFamily:     "var(--font-mono)",
            fontSize:       "0.62rem",
            fontWeight:     700,
            color:          "#fff",
            flexShrink:     0,
            letterSpacing:  "0.05em",
          }}>
            {initials}
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize:   "0.75rem",
              fontWeight: 600,
              color:      "#e8f4f5",
              lineHeight: 1.2,
              margin:     0,
              maxWidth:   140,
              overflow:   "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {user.name}
            </p>
            <p style={{
              fontFamily:   "var(--font-mono)",
              fontSize:     "0.58rem",
              color:        "rgba(42,172,184,0.7)",
              lineHeight:   1.2,
              margin:       0,
              maxWidth:     140,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {user.email}
            </p>
          </div>
          {/* Chevron */}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="rgba(42,172,184,0.6)" strokeWidth="2.5"
            style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Click-outside overlay */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 10 }}
              onClick={() => setMenuOpen(false)}
            />
            <div style={{
              position:     "absolute",
              top:          "calc(100% + 6px)",
              right:        0,
              zIndex:       20,
              background:   "#0f1f2e",
              border:       "1px solid rgba(42,172,184,0.2)",
              boxShadow:    "0 8px 24px rgba(0,0,0,0.3)",
              minWidth:     180,
              animation:    "fadeUp 0.15s ease both",
            }}>
              <div style={{
                padding:      "12px 16px",
                borderBottom: "1px solid rgba(42,172,184,0.12)",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "rgba(42,172,184,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>
                  Signed in as
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#e8f4f5", margin: 0, fontWeight: 500 }}>
                  {user.name}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "rgba(42,172,184,0.6)", margin: 0 }}>
                  {user.email}
                </p>
              </div>

              <div style={{ padding: "6px 0" }}>
                <DropdownItem href="/search" icon="🔍" label="Search Institutes" onClick={() => setMenuOpen(false)} />
                <DropdownItem href="/ranking" icon="📊" label="View Rankings" onClick={() => setMenuOpen(false)} />
              </div>

              <div style={{ padding: "6px 0", borderTop: "1px solid rgba(42,172,184,0.12)" }}>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    width:      "100%",
                    display:    "flex",
                    alignItems: "center",
                    gap:        8,
                    padding:    "9px 16px",
                    background: "transparent",
                    border:     "none",
                    cursor:     loggingOut ? "wait" : "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize:   "0.78rem",
                    color:      loggingOut ? "rgba(255,100,80,0.4)" : "rgba(255,100,80,0.8)",
                    textAlign:  "left",
                    transition: "background 0.1s, color 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!loggingOut) e.currentTarget.style.background = "rgba(255,100,80,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
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

// ── Small nav link ────────────────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.65rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color:         "rgba(200,230,232,0.6)",
        textDecoration:"none",
        padding:       "4px 10px",
        borderRadius:  3,
        transition:    "color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#2aacb8";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(42,172,184,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,230,232,0.6)";
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
      }}
    >
      {children}
    </Link>
  );
}

// ── Dropdown menu item ────────────────────────────────────────────────────────

function DropdownItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            8,
        padding:        "9px 16px",
        fontFamily:     "var(--font-body)",
        fontSize:       "0.78rem",
        color:          "rgba(200,230,232,0.75)",
        textDecoration: "none",
        transition:     "background 0.1s, color 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(42,172,184,0.08)";
        (e.currentTarget as HTMLAnchorElement).style.color = "#2aacb8";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,230,232,0.75)";
      }}
    >
      <span style={{ fontSize: "0.8rem" }}>{icon}</span>
      {label}
    </Link>
  );
}