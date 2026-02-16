
import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🛡️ GLOBAL ERROR BOUNDARY - NGƯỜI GÁC CỔNG HỆ THỐNG
 * Đảm bảo LMS không bao giờ bị sập hoàn toàn khi có lỗi runtime.
 */
class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log lỗi vĩnh viễn vào Console để Thầy Nhẫn dễ dàng kiểm tra
    console.group("%c🚨 LMS Critical Error Detected", "color: #e11d48; font-weight: bold; font-size: 14px;");
    console.error("Error Detail:", error);
    console.error("Stack Trace:", errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-center font-sans">
          <div className="max-w-lg bg-white/5 backdrop-blur-3xl p-16 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            
            <div className="w-24 h-24 bg-rose-500/20 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic">Oops! Có một lỗi nhỏ...</h2>
            <p className="text-slate-400 font-medium mb-12 text-base leading-relaxed">
              Thầy Nhẫn ơi, hệ thống vừa gặp một sự cố kỹ thuật nhẹ. Đừng lo lắng, dữ liệu của Thầy vẫn được <b>Supabase Cloud</b> lưu trữ vĩnh viễn. 
              Hãy thử nhấn nút bên dưới để khôi phục nhé!
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all active:scale-95 shadow-xl"
            >
              KHỞI ĐỘNG LẠI LMS PRO
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 🚀 KHỞI CHẠY NHANLMS PRO V5.8 - PREMIUM EDITION
 */
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  // 🎨 Stylish Console Branding - Đẳng cấp Thầy Nhẫn
  console.clear();
  console.log(
    "%cNhanLMS Pro v5.8%c High-Performance Active %c Cloud Synced",
    "color: white; background: #4f46e5; padding: 10px 15px; border-radius: 12px 0 0 12px; font-weight: 900; font-size: 16px; font-family: 'Plus Jakarta Sans', sans-serif;",
    "color: #4f46e5; background: #e0e7ff; padding: 10px 15px; font-weight: 800; font-size: 16px;",
    "color: #059669; background: #dcfce7; padding: 10px 15px; border-radius: 0 12px 12px 0; font-weight: 800; font-size: 16px;"
  );
  console.log("%cDesign & Optimize for Thầy Huỳnh Văn Nhẫn", "color: #94a3b8; font-style: italic; font-weight: bold; margin-top: 5px;");

  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        {/* App.tsx đã có sẵn Router bên trong, chúng ta không cần bọc thêm ở đây */}
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("❌ Critical: Root element #root not found in index.html");
}
