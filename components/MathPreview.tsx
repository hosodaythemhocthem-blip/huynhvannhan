import React from 'react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathPreviewProps {
  content: string;
  className?: string;
}

const MathPreview: React.FC<MathPreviewProps> = ({ content, className = "" }) => {
  // Xử lý xuống dòng để Markdown hiểu đúng
  const formattedContent = content?.replace(/\n/g, '  \n') || "";

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Tùy chỉnh hiển thị ảnh trong đề thi
          img: ({node, ...props}) => (
            <img 
              {...props} 
              className="max-h-64 rounded-lg shadow-sm border border-slate-200 my-2 mx-auto" 
              alt="Exam content" 
            />
          ),
          // Tùy chỉnh hiển thị đoạn văn
          p: ({node, ...props}) => <p {...props} className="mb-2 leading-relaxed" />
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MathPreview;
