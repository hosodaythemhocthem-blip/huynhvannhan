// components/MathPreview.tsx

import React, { memo, useMemo } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
}

const MathPreview: React.FC<Props> = ({ content }) => {
  const parts = useMemo(() => {
    if (!content) return [];

    // tách $$block$$ và $inline$
    return content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
  }, [content]);

  if (!content) return null;

  return (
    <div className="prose max-w-none text-gray-800 bg-white p-4 rounded-lg border">
      {parts.map((part, index) => {
        try {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            const formula = part.slice(2, -2);
            return (
              <div key={index} className="my-2 overflow-x-auto">
                <BlockMath math={formula} />
              </div>
            );
          }

          if (part.startsWith("$") && part.endsWith("$")) {
            const formula = part.slice(1, -1);
            return <InlineMath key={index} math={formula} />;
          }

          return (
            <span key={index} className="whitespace-pre-wrap">
              {part}
            </span>
          );
        } catch {
          return (
            <span key={index} className="text-red-500">
              {part}
            </span>
          );
        }
      })}
    </div>
  );
};

export default memo(MathPreview);
