"use client";
interface Props {
  value:    string;
  onChange: (v: string) => void;
  loading:  boolean;
}

export default function SearchBar({ value, onChange, loading }: Props) {
  return (
    <div style={{ position: "relative" }}>
      {/* Search icon */}
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round"
        style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>

      <input
        type="text"
        autoFocus
        placeholder="Search institute name or code…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width:        "100%",
          padding:      "16px 48px 16px 48px",
          fontFamily:   "var(--font-body)",
          fontSize:     "1rem",
          color:        "var(--ink-900)",
          background:   "var(--white)",
          border:       "2px solid var(--border)",
          outline:      "none",
          boxShadow:    "var(--shadow-md)",
          transition:   "border-color 0.15s",
        }}
        onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--crimson)")}
        onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--border)")}
      />

      {/* Spinner or clear */}
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
        {loading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              style={{ animation: "spin 1s linear infinite" }}/>
          </svg>
        ) : value ? (
          <button
            onClick={() => onChange("")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink-300)", lineHeight: 1, padding: 2,
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        ) : null}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}