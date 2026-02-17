import React from "react";
import { BlockMath, InlineMath } from "react-katex";

interface Props {
  content: string;
}

const MathPreview: React.FC<Props> = ({ content }) => {
  const renderContent = () => {
    const parts = content.split(/(\$.*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const formula = part.slice(1, -1);
        return <InlineMath key={index} math={formula} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="prose max-w-none text-gray-800">
      {renderContent()}
    </div>
  );
};

export default MathPreview;
