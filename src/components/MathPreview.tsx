
import React, { useEffect, useRef, useState, memo } from 'react';

interface MathPreviewProps {
  math: string;
  className?: string;
  isBlock?: boolean;
}

const MathPreview: React.FC<MathPreviewProps> = memo(({ math, className = '', isBlock = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const prepareContent = (raw: string) => {
    if (!raw || raw.trim() === "") return "";
    let text = raw;

    // Tự động bao bọc bằng $ nếu chưa có dấu hiệu của LaTeX
    const mathSigns = ['\\', '^', '_', '{', '}'];
    const hasMathSigns = mathSigns.some(s => text.includes(s));
    
    if (hasMathSigns && !text.includes('$')) {
      text = `$${text}$`;
    }

    return text.replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    const MathJax = (window as any).MathJax;
    if (!containerRef.current) return;

    let isMounted = true;

    const renderMath = async () => {
      if (!isMounted) return;
      
      const processed = prepareContent(math);
      containerRef.current!.innerHTML = processed;

      if (MathJax && MathJax.typesetPromise) {
        try {
          await MathJax.typesetPromise([containerRef.current]);
          if (isMounted) setIsReady(true);
        } catch (err) {
          console.warn("MathJax render error", err);
          if (isMounted) setIsReady(true);
        }
      } else {
        // Fallback nếu MathJax chưa load xong
        setTimeout(renderMath, 500);
      }
    };

    renderMath();
    
    return () => {
      isMounted = false;
    };
  }, [math]);

  return (
    <div 
      ref={containerRef}
      className={`math-container tex2jax_process ${isBlock ? 'block text-center w-full' : 'inline-block'} ${className}`}
      style={{ 
        wordBreak: 'break-word',
        minHeight: '1.2em',
        opacity: isReady ? 1 : 0.7,
        transition: 'opacity 0.2s ease'
      }}
    />
  );
});

export default MathPreview;
