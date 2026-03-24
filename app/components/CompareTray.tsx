"use client";
/**
 * CompareTray.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Floating bottom bar that appears in "compare mode".
 * Shows selected institutes as chips with remove buttons.
 * "Compare" button fires when 2+ selected.
 * Max 4 institutes.
 */

import React from "react";
import type { SearchHit } from "@/app/page";

const INST_COLORS = ["#c0392b", "#1a7a6e", "#7d4fa8", "#b5651d"];

interface Props {
  selected:  SearchHit[];
  onRemove:  (code: string) => void;
  onCompare: () => void;
  onClear:   () => void;
}

export default function CompareTray({ selected, onRemove, onCompare, onClear }: Props) {
  if (!selected.length) return null;

  const canCompare = selected.length >= 2;

  return (
    <div style={{
      position:   "fixed",
      bottom:     24,
      left:       "50%",
      transform:  "translateX(-50%)",
      zIndex:     80,
      background: "var(--white)",
      border:     "1px solid var(--border)",
      boxShadow:  "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
      padding:    "12px 16px",
      display:    "flex",
      alignItems: "center",
      gap:        12,
      minWidth:   320,
      maxWidth:   "calc(100vw - 48px)",
      animation:  "fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both",
    }}>

      {/* Label */}
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.65rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color:         "var(--ink-400)",
        flexShrink:    0,
        whiteSpace:    "nowrap",
      }}>
        Compare ({selected.length}/4)
      </span>

      {/* Institute chips */}
      <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
        {selected.map((hit, i) => (
          <div
            key={hit.institute_code}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              padding:    "4px 10px 4px 8px",
              border:     `1px solid ${INST_COLORS[i]}`,
              background: `${INST_COLORS[i]}12`,
              maxWidth:   220,
            }}
          >
            <div style={{
              width:      6,
              height:     6,
              borderRadius: "50%",
              background: INST_COLORS[i],
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily:   "var(--font-body)",
              fontSize:     "0.72rem",
              color:        "var(--ink-900)",
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              maxWidth:     170,
            }}>
              {hit.institute_name}
            </span>
            <button
              onClick={() => onRemove(hit.institute_code)}
              style={{
                background: "none",
                border:     "none",
                cursor:     "pointer",
                color:      INST_COLORS[i],
                fontFamily: "var(--font-mono)",
                fontSize:   "0.65rem",
                padding:    "0 0 0 2px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - selected.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              padding:    "4px 14px",
              border:     "1px dashed var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize:   "0.65rem",
              color:      "var(--ink-300)",
            }}
          >
            + add
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onClear}
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.65rem",
            letterSpacing: "0.06em",
            background:    "transparent",
            color:         "var(--ink-400)",
            border:        "1px solid var(--border)",
            padding:       "6px 12px",
            cursor:        "pointer",
          }}
        >
          Clear
        </button>
        <button
          onClick={onCompare}
          disabled={!canCompare}
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background:    canCompare ? "var(--crimson)" : "var(--border)",
            color:         canCompare ? "#fff" : "var(--ink-400)",
            border:        "none",
            padding:       "6px 18px",
            cursor:        canCompare ? "pointer" : "not-allowed",
            transition:    "background 0.15s",
            fontWeight:    600,
          }}
        >
          Compare →
        </button>
      </div>
    </div>
  );
}