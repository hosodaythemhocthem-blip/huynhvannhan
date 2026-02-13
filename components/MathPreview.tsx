"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathPreviewProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

const MathPreview: React.FC<MathPreviewProps> = ({
  content,
  displayMode = false,
  className = "",
}) => {
  const elements = useMemo(() => {
    if (!content) return null;

    const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    const result: React.ReactNode[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, blockMath, inlineMath] = match;
      const start = match.index;

      // Thêm text thường trước math
      if (start > lastIndex) {
        result.push(
          <span key={key++}>
            {content.slice(lastIndex, start)}
          </span>
        );
      }

      const mathExpression = blockMath || inlineMath;

      try {
        const html = katex.renderToString(mathExpression, {
          displayMode: !!blockMath || displayMode,
          throwOnError: false,
          strict: "ignore",
          output: "html",
        });

        result.push(
          <span
            key={key++}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        result.push(
          <span key={key++}>
            {mathExpression}
          </span>
        );
      }

      lastIndex = start + fullMatch.length;
    }

    // Thêm phần còn lại
    if (lastIndex < content.length) {
      result.push(
        <span key={key++}>
          {content.slice(lastIndex)}
        </span>
      );
    }

    return result;
  }, [content, displayMode]);

  return (
    <span className={className}>
      {elements}
    </span>
  );
};

export default MathPreview;
