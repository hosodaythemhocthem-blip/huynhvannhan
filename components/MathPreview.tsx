
import React, { useMemo } from "react";
import katex from "katex";

interface Props {
  content: string;
  displayMode?: boolean;
  className?: string;
}

const MathPreview: React.FC<Props> = ({ content = "", displayMode = false, className = "" }) => {
  const parts = useMemo(() => {
    if (typeof content !== 'string' || !content) return [""];
    // Tách nội dung theo dấu $ hoặc $$ nhưng thông minh hơn để tránh lỗi split
    return content.split(/(\$\$.*?\$\$|\$.*?\$)/gs).filter(Boolean);
  }, [content]);

  return (
    <div className={`math-content select-text leading-relaxed ${className}`}>
      {parts.map((part, i) => {
        const isMath = /^\$.*\$$|^(\$\$.*\$\$)$/s.test(part);
        if (!isMath) return <span key={i} className="whitespace-pre-wrap">{part}</span>;

        let formula = part;
        let isBlock = displayMode;
        
        if (part.startsWith('$$')) {
          formula = part.replace(/^\$\$|\$\$$/g, '');
          isBlock = true;
        } else {
          formula = part.replace(/^\$|\$$/g, '');
        }

        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: isBlock,
            throwOnError: false,
            trust: true,
            strict: false,
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\ZZ": "\\mathbb{Z}",
              "\\vec": "\\overrightarrow",
              "\\int": "\\int_{#1}^{#2}",
              "\\lim": "\\lim_{#1 \\to #2}"
            }
          });
          return (
            <span
              key={i}
              className={isBlock 
                ? "block my-6 p-8 bg-indigo-500/5 rounded-3xl border border-white/5 overflow-x-auto shadow-inner" 
                : "inline-block px-1 font-serif text-indigo-400 font-bold"}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={i} className="text-rose-500 font-mono text-xs">{part}</span>;
        }
      })}
    </div>
  );
};

export default MathPreview;
