"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathPreviewProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

/* =====================================================
   LATEX TOKENIZER (KHÔNG DÙNG REGEX NGU NGỐC)
===================================================== */
type Token =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

function tokenizeLatex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (input[i] === "$") {
      const isBlock = input[i + 1] === "$";
      const delimiter = isBlock ? "$$" : "$";
      const start = i + delimiter.length;

      let end = input.indexOf(delimiter, start);

      if (end !== -1) {
        const math = input.slice(start, end).trim();

        tokens.push({
          type: isBlock ? "block" : "inline",
          value: math,
        });

        i = end + delimiter.length;
        continue;
      }
    }

    // text thường
    let nextMath = input.indexOf("$", i);
    if (nextMath === -1) nextMath = input.length;

    tokens.push({
      type: "text",
      value: input.slice(i, nextMath),
    });

    i = nextMath;
  }

  return tokens;
}

/* =====================================================
   SAFE RENDER KATEX
===================================================== */
function renderLatex(latex: string, block: boolean) {
  try {
    return katex.renderToString(latex, {
      displayMode: block,
      throwOnError: false,
      strict: "ignore",
      trust: true,
      output: "html",
    });
  } catch {
    return `<span class="text-red-500">${latex}</span>`;
  }
}

/* =====================================================
   COMPONENT
===================================================== */
const MathPreview: React.FC<MathPreviewProps> = ({
  content,
  displayMode = false,
  className = "",
}) => {
  const elements = useMemo(() => {
    if (!content) return null;

    const tokens = tokenizeLatex(content);

    return tokens.map((token, index) => {
      if (token.type === "text") {
        return <span key={index}>{token.value}</span>;
      }

      const html = renderLatex(token.value, token.type === "block" || displayMode);

      return (
        <span
          key={index}
          className="math-fragment"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [content, displayMode]);

  return <span className={`math-preview ${className}`}>{elements}</span>;
};

export default MathPreview;
