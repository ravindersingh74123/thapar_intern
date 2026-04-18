"use client";
/**
 * DownloadChartButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A small button that, when clicked, screenshots the nearest .chart-capture
 * ancestor (or a ref target) using html2canvas and downloads it as a PNG.
 *
 * Usage:
 *   Wrap your chart card content with a div that has className="chart-capture"
 *   and drop <DownloadChartButton filename="my-chart" /> inside the card.
 */

import React, { useCallback, useState } from "react";

interface Props {
  /** Base filename without extension, e.g. "nirf-scores-trend" */
  filename?: string;
  /** Optional explicit ref to the element to capture.
   *  If omitted, walks up the DOM to find the nearest .chart-capture ancestor. */
  targetRef?: React.RefObject<HTMLElement | null>;
}

const MONO = "'IBM Plex Mono', monospace";
const BORDER = "#e4e2dd";
const INK300 = "#a8a49c";
const CRIMSON = "#c0392b";

export default function DownloadChartButton({
  filename = "chart",
  targetRef,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      setLoading(true);

      // ✅ CAPTURE SYNCHRONOUSLY (before any await)
      const button = e.currentTarget as HTMLElement | null;

      try {
        const html2canvas = (await import("html2canvas")).default;

        let el: HTMLElement | null = null;

        if (targetRef?.current) {
          el = targetRef.current;
        } else if (button) {
          // ✅ safest approach
          el =
            button.closest(".chart-capture") ??
            button.closest("[data-chart-card]") ??
            button.parentElement;
        }

        if (!el) {
          console.warn("DownloadChartButton: no target element found");
          return;
        }

        const origOverflow = el.style.overflow;
        const origHeight = el.style.height;
        el.style.overflow = "visible";
        el.style.height = "auto";

        await new Promise((r) => setTimeout(r, 80));

        const canvas = await html2canvas(el, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          width: el.scrollWidth,
          height: el.scrollHeight,
          windowWidth: el.scrollWidth,
          windowHeight: el.scrollHeight,
        });

        el.style.overflow = origOverflow;
        el.style.height = origHeight;

        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Chart download failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [filename, targetRef],
  );

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download chart as PNG"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: MONO,
        fontSize: "0.6rem",
        letterSpacing: "0.07em",
        textTransform: "uppercase" as const,
        padding: "3px 10px",
        border: `1px solid ${loading ? BORDER : INK300}`,
        background: "transparent",
        color: loading ? INK300 : INK300,
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = CRIMSON;
          e.currentTarget.style.color = CRIMSON;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = INK300;
        e.currentTarget.style.color = INK300;
      }}
    >
      {loading ? (
        <>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
          Saving…
        </>
      ) : (
        <>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ↓ PNG
        </>
      )}
    </button>
  );
}
