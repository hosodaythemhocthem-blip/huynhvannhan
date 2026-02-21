import React, { memo, useMemo } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
  className?: string; // Cho phép tùy biến style từ bên ngoài
}

const MathPreview: React.FC<Props> = ({ content, className = "" }) => {
  // Tách nội dung thành các phần: Text thường, Block Math ($$...$$), Inline Math ($...$)
  const parts = useMemo(() => {
    if (!content) return [];
    // Regex này bắt: 
    // 1. $$...$$ (Block)
    // 2. $...$ (Inline) - loại trừ trường hợp \$ (dấu $ thoát)
    return content.split(/(\$\$[\s\S]*?\$\$|\$(?! \$)[^$]+\$)/g);
  }, [content]);

  if (!content) return null;

  return (
    <div className={`math-preview text-slate-800 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        // Trường hợp 1: Block Math ($$ ... $$)
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          return (
            <div key={index} className="my-4 overflow-x-auto overflow-y-hidden text-center py-2 bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
              <ErrorBoundary fallback={part}>
                 <BlockMath math={formula} />
              </ErrorBoundary>
            </div>
          );
        }

        // Trường hợp 2: Inline Math ($ ... $)
        if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1).trim();
          return (
            <span key={index} className="inline-block mx-0.5 text-indigo-900 font-serif">
              <ErrorBoundary fallback={part}>
                <InlineMath math={formula} />
              </ErrorBoundary>
            </span>
          );
        }

        // Trường hợp 3: Văn bản thường
        // Xử lý xuống dòng (\n) thành thẻ <br />
        return (
          <span key={index} className="whitespace-pre-wrap font-sans text-[15px]">
            {part}
          </span>
        );
      })}
    </div>
  );
};

// Component con để bắt lỗi render Katex mà không làm sập app
class ErrorBoundary extends React.Component<{ fallback: string; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <span className="text-rose-500 bg-rose-50 px-1 rounded text-sm font-mono border border-rose-200" title="Lỗi cú pháp LaTeX">
          {this.props.fallback}
        </span>
      );
    }
    return this.props.children;
  }
}

export default memo(MathPreview);
