import React, { useEffect, useRef, useState, memo } from 'react';

interface MathPreviewProps {
  math: string;
  className?: string;
  isBlock?: boolean;
}

const MathPreview: React.FC<MathPreviewProps> = memo(
  ({ math, className = '', isBlock = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    /* =====================
       Utils
    ===================== */
    const prepareContent = (raw: string) => {
      if (!raw || raw.trim() === '') return '';

      let text = raw.trim();

      // Nhận diện có dấu hiệu LaTeX không
      const mathSigns = ['\\', '^', '_', '{', '}', '\\frac', '\\sqrt'];
      const hasMathSigns = mathSigns.some(s => text.includes(s));

      // Nếu có dấu hiệu toán mà chưa có $
      if (hasMathSigns && !/\$.*\$/.test(text)) {
        text = `$${text}$`;
      }

      // Xuống dòng HTML (tránh MathJax hiểu sai)
      return text.replace(/\n/g, '<br/>');
    };

    /* =====================
       Effect render MathJax
    ===================== */
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let cancelled = false;
      setIsReady(false);

      const renderMath = async () => {
        if (cancelled) return;

        const MathJax = (window as any).MathJax;
        const content = prepareContent(math);

        // Clear nội dung cũ trước khi render
        container.innerHTML = content;

        if (MathJax?.typesetPromise) {
          try {
            await MathJax.typesetPromise([container]);
          } catch (err) {
            console.warn('MathJax render error:', err);
          }
          if (!cancelled) setIsReady(true);
        } else {
          // MathJax chưa load → thử lại 1 lần
          setTimeout(() => {
            if (!cancelled) renderMath();
          }, 400);
        }
      };

      renderMath();

      return () => {
        cancelled = true;
      };
    }, [math]);

    /* =====================
       Render
    ===================== */
    return (
      <div
        ref={containerRef}
        className={`math-container tex2jax_process ${
          isBlock ? 'block text-center w-full' : 'inline-block'
        } ${className}`}
        style={{
          wordBreak: 'break-word',
          minHeight: '1.2em',
          opacity: isReady ? 1 : 0.7,
          transition: 'opacity 0.2s ease'
        }}
      />
    );
  }
);

export default MathPreview;
