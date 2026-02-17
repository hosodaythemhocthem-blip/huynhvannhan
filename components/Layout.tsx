import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo,
} from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
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
  /* ===============================
     SIDEBAR STATE (PERSISTENT)
  =============================== */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("lms_sidebar_state");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("lms_sidebar_state", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  /* ===============================
     PAGE TITLE MEMO
  =============================== */
  const pageTitle = useMemo(() => {
    return activeTab.replace("-", " ").toUpperCase();
  }, [activeTab]);

  /* ===============================
     AUTO SESSION CHECK
  =============================== */
  useEffect(() => {
    const interval = setInterval(() => {
      const lastActive = localStorage.getItem("lms_last_active");
      if (lastActive) {
        const diff = Date.now() - Number(lastActive);
        if (diff > 1000 * 60 * 60 * 6) {
          onLogout();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [onLogout]);

  /* ===============================
     UPDATE ACTIVITY
  =============================== */
  useEffect(() => {
    localStorage.setItem("lms_last_active", Date.now().toString());
  }, [activeTab]);

  /* ===============================
     TOGGLE SIDEBAR
  =============================== */
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-200">

      {/* BACKGROUND GPU */}
      <div className="absolute inset-0 pointer-events-none z-0">
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

      {/* MAIN */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10 ${
          isSidebarOpen ? "lg:ml-72" : "lg:ml-24"
        }`}
      >
        <Header user={user} activeTab={activeTab} />

        {/* TOGGLE BUTTON */}
        <div className="absolute top-6 left-4 lg:left-6 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl hover:bg-indigo-600 transition-all"
          >
            {isSidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
        </div>

        {/* CONTENT */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">

          {/* BREADCRUMB */}
          <div className="mb-10 flex items-center gap-3">
            <div className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              LMS CORE / <span className="text-white">{pageTitle}</span>
            </p>
          </div>

          {/* CHILDREN */}
          <div className="animate-fade-in">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="mt-24 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 hover:opacity-100 transition-opacity">

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
                v7.0-ELITE
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* AI ASSISTANT */}
      <AiAssistant
        user={{ id: user.id, fullName: user.fullName }}
        context={`Thầy đang xem phân hệ ${activeTab}`}
      />

      {/* TOAST GLOBAL */}
      <Toast />

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default memo(Layout);
