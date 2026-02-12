import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathPreviewProps {
  math: string;
  className?: string;
  isBlock?: boolean;
}

/* =====================
   Helpers
===================== */

/**
 * Tự động detect LaTeX nếu user không bọc $...$
 */
const normalizeMathInput = (raw: string): string => {
  if (!raw) return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Nếu đã có $ hoặc $$ thì giữ nguyên
  if (/\${1,2}.*?\${1,2}/.test(trimmed)) {
    return trimmed;
  }

  // Detect ký hiệu toán phổ biến
  const mathSigns = [
    "\\",
    "^",
    "_",
    "{",
    "}",
    "\\frac",
    "\\sqrt",
    "\\int",
    "\\sum",
    "\\lim",
  ];

  const hasMath = mathSigns.some((s) => trimmed.includes(s));

  if (hasMath) {
    return `$${trimmed}$`;
  }

  return trimmed;
};

/**
 * Render nội dung có cả text + math
 */
const renderMixedContent = (
  container: HTMLDivElement,
  content: string,
  displayMode: boolean
) => {
  // Regex bắt $...$ và $$...$$
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;

  container.innerHTML = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, blockMath, inlineMath] = match;
    const start = match.index;

    // Thêm text trước math
    if (start > lastIndex) {
      const text = content.slice(lastIndex, start);
      container.appendChild(document.createTextNode(text));
    }

    const mathExpression = blockMath || inlineMath;
    const span = document.createElement("span");

    try {
      katex.render(mathExpression, span, {
        displayMode: !!blockMath || displayMode,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch (err) {
      span.textContent = mathExpression;
    }

    container.appendChild(span);
    lastIndex = start + fullMatch.length;
  }

  // Thêm phần text còn lại
  if (lastIndex < content.length) {
    container.appendChild(
      document.createTextNode(content.slice(lastIndex))
    );
  }
};

/* =====================
   Component
===================== */

const MathPreview: React.FC<MathPreviewProps> = memo(
  ({ math, className = "", isBlock = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState<boolean>(false);

    const normalized = useMemo(() => {
      return normalizeMathInput(math);
    }, [math]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let cancelled = false;
      setIsReady(false);

      try {
        renderMixedContent(container, normalized, isBlock);
      } catch (err) {
        console.warn("KaTeX render error:", err);
      }

      if (!cancelled) {
        setIsReady(true);
      }

      return () => {
        cancelled = true;
      };
    }, [normalized, isBlock]);

    return (
      <div
        ref={containerRef}
        className={`math-preview ${
          isBlock ? "block w-full text-center" : "inline-block"
        } ${className}`}
        style={{
          wordBreak: "break-word",
          minHeight: "1.2em",
          opacity: isReady ? 1 : 0.7,
          transition: "opacity 0.15s ease",
        }}
      />
    );
  }
);

MathPreview.displayName = "MathPreview";

export default MathPreview;
