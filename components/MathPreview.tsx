
import React, { useMemo } from "react";
import katex from "katex";

interface Props {
  content: string;
  displayMode?: boolean;
  className?: string;
}

const MathPreview: React.FC<Props> = ({ content = "", displayMode = false, className = "" }) => {
  const parts = useMemo(() => {
    if (!content) return [];
    // Tách văn bản dựa trên $...$ và $$...$$
    return content.split(/(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g);
  }, [content]);

  return (
    <div className={`math-content ${className}`}>
      {parts.map((part, i) => {
        const isMath = /^\$.*\$$|^(\$\$.*\$\$)$|^\\\[.*\\\]$|^\\\(.*\\\)$/.test(part);
        if (!isMath) return <span key={i} className="whitespace-pre-wrap">{part}</span>;

        let formula = part;
        let isBlock = displayMode;

        if (part.startsWith('$$') || part.startsWith('\\[')) {
          formula = part.replace(/^\$\$|^\\\[|\$\$|\\\]$/g, '');
          isBlock = true;
        } else {
          formula = part.replace(/^\$|^\\\(|\$|\\\)$/g, '');
        }

        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: isBlock,
            throwOnError: false,
            trust: true,
            strict: false
          });
          return (
            <span
              key={i}
              className={isBlock ? "block my-4 p-4 bg-slate-50 rounded-2xl border border-slate-100" : "inline-block px-1"}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={i} className="text-red-500 font-mono">{part}</span>;
        }
      })}
    </div>
  );
};

export default MathPreview;
