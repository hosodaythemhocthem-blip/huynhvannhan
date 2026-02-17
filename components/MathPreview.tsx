import React from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
}

const MathPreview: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  const renderContent = () => {
    const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

    return parts.map((part, index) => {
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
    });
  };

  return (
    <div className="prose max-w-none text-gray-800 bg-white p-4 rounded-lg border">
      {renderContent()}
    </div>
  );
};

export default MathPreview;
