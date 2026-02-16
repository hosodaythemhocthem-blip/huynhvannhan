import React, { useState, useMemo } from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import { RefreshCw, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const pageTitle = useMemo(() => {
    return activeTab.replace("-", " ").toUpperCase();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* BACKGROUND MESH GPU OPTIMIZED */}
      <div className="absolute inset-0 pointer-events-none z-0 will-change-transform">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[120px]" />
      </div>

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        collapsed={!isSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10 ${
          isSidebarOpen ? "lg:ml-72" : "lg:ml-24"
        }`}
      >
        {/* HEADER */}
        <Header user={user} activeTab={activeTab} />

        {/* SIDEBAR TOGGLE BUTTON */}
        <div className="absolute top-6 left-4 lg:left-6 z-50">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl hover:bg-indigo-600 transition-all"
          >
            {isSidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
        </div>

        {/* MAIN */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">
          {/* BREADCRUMB */}
          <div className="mb-10 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              LMS CORE / <span className="text-white">{pageTitle}</span>
            </p>
          </div>

          {/* CONTENT */}
          <div className="animate-in fade-in zoom-in-95 duration-700">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="mt-24 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <RefreshCw
                size={16}
                className="text-indigo-400 animate-spin-slow"
              />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Cơ sở dữ liệu vĩnh viễn
                </p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1 tracking-tighter">
                  Supabase Cloud Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span className="hover:text-indigo-400 cursor-pointer transition-colors">
                Điều khoản
              </span>
              <span className="hover:text-indigo-400 cursor-pointer transition-colors">
                Bản quyền Huỳnh Văn Nhẫn
              </span>
              <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20">
                v6.0-ELITE
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* AI ASSISTANT FIXED TYPE */}
      <AiAssistant
        user={{ id: user.id, fullName: user.fullName }}
        context={`Thầy đang xem phân hệ ${activeTab}`}
      />

      {/* CUSTOM ANIMATION */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;
