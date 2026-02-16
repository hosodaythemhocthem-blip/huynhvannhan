import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Đã xóa .tsx để fix lỗi build
import "./index.css";

/**
 * 🛡️ GLOBAL ERROR BOUNDARY - PHIÊN BẢN ELITE
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
    console.group("%c🚨 LMS Critical Error Detected", "color: #e11d48; font-weight: bold; font-size: 14px;");
    console.error("Error Detail:", error);
    console.error("Stack Trace:", errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8 text-center font-sans">
          <div className="max-w-lg bg-white/5 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-[100px]"></div>
            
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-rose-500/20">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic">Hệ thống đang bảo trì nhanh</h2>
            <p className="text-slate-400 font-medium mb-10 text-sm leading-relaxed px-4">
              Thầy Nhẫn đừng lo, một xung đột nhỏ vừa xảy ra. <b>Supabase</b> đã đóng gói dữ liệu của Thầy an toàn. Nhấn nút để làm mới ngay!
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="group relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all overflow-hidden shadow-lg shadow-indigo-600/20"
            >
              <span className="relative z-10">KHÔI PHỤC LMS NGAY</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 🚀 LAUNCH NHANLMS PRO V5.9 - ELITE CLOUD
 */
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  // 🎨 Branding Console VIP
  console.clear();
  console.log(
    "%cNhanLMS Pro v5.9%c Optimized for Thầy Nhẫn %c ⚡ Ready",
    "color: white; background: #6366f1; padding: 8px 16px; border-radius: 10px 0 0 10px; font-weight: 900; font-size: 14px;",
    "color: #6366f1; background: #f0f2ff; padding: 8px 16px; font-weight: 800; font-size: 14px;",
    "color: #10b981; background: #ecfdf5; padding: 8px 16px; border-radius: 0 10px 10px 0; font-weight: 800; font-size: 14px;"
  );

  root.render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
} else {
  console.error("❌ Critical: Root element #root not found!");
}
