"use client";
// app/login/page.tsx
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get("from") ?? "/";

  const [mode, setMode]       = useState<Mode>("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body     = mode === "login"
      ? { email, password }
      : { name, email, password };

    try {
      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

    //   Redirect to original destination
    //   router.push(from === "/login" ? "/" : from);
    console.log("here")
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [mode, name, email, password, from, router]);

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "var(--paper)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "24px",
    }}>
      <div style={{
        width:      "100%",
        maxWidth:   440,
        background: "var(--white)",
        border:     "1px solid var(--border)",
        boxShadow:  "var(--shadow-md)",
        padding:    "40px 36px",
        animation:  "fadeUp 0.3s var(--ease-out) both",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{
            fontFamily:    "var(--font-display)",
            fontStyle:     "italic",
            fontSize:      "2rem",
            color:         "var(--crimson)",
            lineHeight:    1,
            marginBottom:  6,
          }}>
            NIRF
          </p>
          <p style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color:         "var(--ink-300)",
          }}>
            Institute Explorer
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display:       "flex",
          marginBottom:  28,
          border:        "1px solid var(--border)",
          overflow:      "hidden",
        }}>
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex:          1,
                padding:       "9px 0",
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                border:        "none",
                background:    mode === m ? "var(--crimson)" : "var(--off-white)",
                color:         mode === m ? "#fff" : "var(--ink-400)",
                cursor:        "pointer",
                transition:    "all 0.15s",
                fontWeight:    mode === m ? 600 : 400,
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <Field
              label="Full Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPass}
            placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error && (
            <p style={{
              fontFamily:  "var(--font-mono)",
              fontSize:    "0.7rem",
              color:       "var(--crimson)",
              background:  "var(--crimson-pale)",
              border:      "1px solid rgba(192,57,43,0.2)",
              padding:     "8px 12px",
              lineHeight:  1.5,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:     6,
              padding:       "11px 0",
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background:    loading ? "var(--border)" : "var(--crimson)",
              color:         loading ? "var(--ink-400)" : "#fff",
              border:        "none",
              cursor:        loading ? "wait" : "pointer",
              fontWeight:    600,
              transition:    "background 0.15s",
            }}
          >
            {loading
              ? (mode === "login" ? "Signing in…" : "Creating account…")
              : (mode === "login" ? "Sign In" : "Create Account")
            }
          </button>
        </form>

        <p style={{
          marginTop:  20,
          textAlign:  "center",
          fontFamily: "var(--font-mono)",
          fontSize:   "0.65rem",
          color:      "var(--ink-300)",
        }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{
              background:  "none",
              border:      "none",
              color:       "var(--crimson)",
              cursor:      "pointer",
              fontFamily:  "var(--font-mono)",
              fontSize:    "0.65rem",
              fontWeight:  600,
              padding:     0,
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Small reusable field ──────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label:        string;
  type:         string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color:         "var(--ink-400)",
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          fontFamily:  "var(--font-body)",
          fontSize:    "0.88rem",
          padding:     "9px 12px",
          border:      "1px solid var(--border)",
          background:  "var(--off-white)",
          color:       "var(--ink-900)",
          outline:     "none",
          transition:  "border-color 0.15s",
          width:       "100%",
          boxSizing:   "border-box" as const,
        }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--crimson)")}
        onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--border)")}
      />
    </div>
  );
}