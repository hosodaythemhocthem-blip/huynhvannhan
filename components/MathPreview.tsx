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
  // Memoize và tiền xử lý nội dung để "dọn đường" cho KaTeX
  const formattedContent = useMemo(() => {
    if (!content) return "";
    let processed = content;

    // 1. Chuyển các dấu phân cách dạng \( \) và \[ \] về chuẩn $ và $$
    // Vì remark-math làm việc tốt nhất với $ và $$
    processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');

    // 2. Xóa bỏ dòng replace(\n) cũ của bạn vì nó làm vỡ cấu trúc \begin{cases} của KaTeX.
    // CSS whitespace-pre-wrap ở thẻ <p> bên dưới đã đủ để xử lý xuống dòng rồi!
    
    return processed;
  }, [content]);

  // Định nghĩa các components chuẩn type để tránh lỗi Vercel
  const markdownComponents: Components = {
    img: ({ node: _node, ...props }) => (
      <img 
        {...props} 
        className="max-h-64 rounded-xl shadow-md border border-slate-200 my-4 mx-auto block object-contain" 
        alt={props.alt || "Nội dung câu hỏi"} 
        loading="lazy"
      />
    ),
    p: ({ node: _node, ...props }) => (
      <p {...props} className="mb-2 leading-relaxed whitespace-pre-wrap break-words" />
    )
  };

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 overflow-x-auto custom-scrollbar ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        // 🔥 CẬP NHẬT QUAN TRỌNG: Thêm tuỳ chọn throwOnError: false
        // Nếu AI lỡ viết sai 1 ký tự, KaTeX sẽ hiển thị mã gốc màu đỏ thay vì làm "tàng hình" công thức
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={markdownComponents}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};

// Bọc React.memo để tối ưu hiệu suất render Toán học
export default React.memo(MathPreview);
