"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [adminpass, setAdminPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoad] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoad(true);

      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password, adminpass };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError("Network error — please try again");
      } finally {
        setLoad(false);
      }
    },
    [mode, name, email, password, adminpass, router],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef7f3] to-[#f8faf9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-700 mb-4">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">NIRF Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            National Institutional Ranking Framework
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-150 ${
                  mode === m
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500  focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500  focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                placeholder={
                  mode === "register"
                    ? "At least 6 characters"
                    : "Your password"
                }
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500  focus:border-transparent transition"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminpass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "At least 6 characters"
                      : "Admin password"
                  }
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500  focus:border-transparent transition"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 disabled:bg-teal-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 mt-2"
            >
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          NIRF Analytics · Institute Explorer
        </p>
      </div>
    </div>
  );
}
