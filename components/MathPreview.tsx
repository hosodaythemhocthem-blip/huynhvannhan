import React from 'react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Components } from 'react-markdown';

interface MathPreviewProps {
  content: string;
  className?: string;
}

const MathPreview: React.FC<MathPreviewProps> = ({ content, className = "" }) => {
  // Memoize nội dung để tránh replace liên tục khi re-render
  const formattedContent = React.useMemo(() => 
    content?.replace(/\n/g, '  \n') || "", 
    [content]
  );

  // Định nghĩa các components với kiểu dữ liệu chuẩn của react-markdown
  const markdownComponents: Components = {
    // Tùy chỉnh hiển thị ảnh trong đề thi
    img: ({ node, ...props }) => (
      <img 
        {...props} 
        className="max-h-64 rounded-lg shadow-sm border border-slate-200 my-2 mx-auto block" 
        alt={props.alt || "Exam content"} 
      />
    ),
    // Tùy chỉnh hiển thị đoạn văn
    p: ({ node, ...props }) => (
      <p {...props} className="mb-2 leading-relaxed" />
    )
  };

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 ${className}`}>
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

export default MathPreview;
