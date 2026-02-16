import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * 🚀 MathPreview Pro
 * - Render LaTeX inline & block
 * - Tối ưu performance
 * - Safe XSS
 * - Hỗ trợ Word / PDF import
 */

const MathPreview: React.FC<Props> = ({
  content = "",
  displayMode = false,
  className = "",
}) => {

  /**
   * 🔥 Smart Split Latex
   * Hỗ trợ:
   * $inline$
   * $$block$$
   */
  const parts = useMemo(() => {
    if (!content || typeof content !== "string") return [];

    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

    const result: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push(content.slice(lastIndex, match.index));
      }
      result.push(match[0]);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  }, [content]);

  return (
    <div
      className={`math-content leading-relaxed select-text break-words ${className}`}
    >
      {parts.map((part, i) => {
        const isMath =
          part.startsWith("$$") ||
          (part.startsWith("$") && part.endsWith("$"));

        if (!isMath) {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {part}
            </span>
          );
        }

        let formula = part;
        let isBlock = displayMode;

        if (part.startsWith("$$")) {
          formula = part.replace(/^\$\$|\$\$$/g, "");
          isBlock = true;
        } else {
          formula = part.replace(/^\$|\$$/g, "");
        }

        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: false, // 🔒 bảo mật
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\ZZ": "\\mathbb{Z}",
              "\\NN": "\\mathbb{N}",
              "\\vec": "\\overrightarrow",
              "\\abs": "\\left|#1\\right|",
            },
          });

          return (
            <span
              key={i}
              className={
                isBlock
                  ? "block my-6 p-6 bg-indigo-50 rounded-2xl overflow-x-auto shadow-inner"
                  : "inline-block px-1 font-semibold text-indigo-600"
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (error) {
          return (
            <span
              key={i}
              className="text-rose-500 font-mono text-sm bg-rose-50 px-2 py-1 rounded"
            >
              {part}
            </span>
          );
        }
      })}
    </div>
  );
};

export default React.memo(MathPreview);
