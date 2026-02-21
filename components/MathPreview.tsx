import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathPreviewProps {
  content: string;
  className?: string;
}

const MathPreview: React.FC<MathPreviewProps> = ({ content, className = "" }) => {
  // Memoize và tiền xử lý nội dung để KaTeX không bị lỗi cú pháp khi thiếu dấu cách
  const formattedContent = useMemo(() => {
    if (!content) return "";
    return content.replace(/\n/g, '  \n');
  }, [content]);

  // Định nghĩa các components chuẩn type để tránh lỗi Vercel
  const markdownComponents: Components = {
    img: ({ node, ...props }) => (
      <img 
        {...props} 
        className="max-h-64 rounded-xl shadow-md border border-slate-200 my-4 mx-auto block object-contain" 
        alt={props.alt || "Nội dung câu hỏi"} 
        loading="lazy"
      />
    ),
    p: ({ node, ...props }) => (
      <p {...props} className="mb-2 leading-relaxed whitespace-pre-wrap break-words" />
    )
  };

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 overflow-x-auto custom-scrollbar ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};

// Bọc React.memo để tối ưu hiệu suất render Toán học
export default React.memo(MathPreview);
