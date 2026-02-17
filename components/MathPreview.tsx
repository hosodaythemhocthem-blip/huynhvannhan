import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * 🚀 MathPreview PRO MAX
 * - Hỗ trợ $...$, $$...$$, \(...\), \[...\]
 * - Tự động tối ưu render
 * - Macro mạnh cho Toán VN
 * - Không crash khi lỗi công thức
 */

const MathPreview: React.FC<Props> = ({
  content = "",
  displayMode = false,
  className = "",
}) => {

  /**
   * Regex bắt:
   * $$block$$
   * $inline$
   * \[block\]
   * \(inline\)
   */
  const parts = useMemo(() => {
    if (!content || typeof content !== "string") return [];

    const regex =
      /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([^\\\n]+?\\\))/g;

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

  /**
   * Không có toán → render text thường
   */
  if (!parts.length) {
    return (
      <div className={`whitespace-pre-wrap ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`math-content leading-relaxed select-text break-words transition-all ${className}`}
    >
      {parts.map((part, i) => {
        const isMath =
          part.startsWith("$") ||
          part.startsWith("\\(") ||
          part.startsWith("\\[");

        if (!isMath) {
          return (
            <span key={i} className="whitespace-pre-wrap opacity-90">
              {part}
            </span>
          );
        }

        let formula = part;
        let isBlock = displayMode;

        // $$block$$
        if (part.startsWith("$$")) {
          formula = part.replace(/^\$\$|\$\$$/g, "");
          isBlock = true;
        }
        // $inline$
        else if (part.startsWith("$")) {
          formula = part.replace(/^\$|\$$/g, "");
        }
        // \[block\]
        else if (part.startsWith("\\[")) {
          formula = part.replace(/^\\\[|\\\]$/g, "");
          isBlock = true;
        }
        // \(inline\)
        else if (part.startsWith("\\(")) {
          formula = part.replace(/^\\\(|\\\)$/g, "");
        }

        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: false,
            macros: {
              "\\R": "\\mathbb{R}",
              "\\Z": "\\mathbb{Z}",
              "\\N": "\\mathbb{N}",
              "\\Q": "\\mathbb{Q}",
              "\\RR": "\\mathbb{R}",
              "\\ZZ": "\\mathbb{Z}",
              "\\NN": "\\mathbb{N}",
              "\\QQ": "\\mathbb{Q}",
              "\\vec": "\\overrightarrow{#1}",
              "\\abs": "\\left|#1\\right|",
              "\\he": "\\left\\{\\begin{aligned}#1\\end{aligned}\\right.",
              "\\hoac": "\\left[\\begin{aligned}#1\\end{aligned}\\right.",
              "\\dfrac": "\\displaystyle\\frac{#1}{#2}",
              "\\lim": "\\displaystyle\\lim",
            },
          });

          return (
            <span
              key={i}
              className={
                isBlock
                  ? "block my-4 p-6 bg-white border border-indigo-100 rounded-2xl overflow-x-auto shadow-sm text-center"
                  : "inline-block px-1 font-medium text-indigo-700"
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <span
              key={i}
              className="text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-200 text-sm"
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
