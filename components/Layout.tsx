import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface LayoutProps {
  children?: React.ReactNode; 
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
  // --- STATE INITIALIZATION ---
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return true;
      const saved = localStorage.getItem("lms_sidebar_state");
      return saved !== null ? Boolean(JSON.parse(saved)) : true;
    } catch (e) {
      console.warn("Lỗi đọc trạng thái Sidebar từ LocalStorage", e);
      return true;
    }
  });

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("lms_sidebar_state", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("lms_last_active", Date.now().toString());
  }, [activeTab]);

  // --- MEMOIZED VALUES ---
  const pageTitle = useMemo(
    () => activeTab.replace(/-/g, " ").toUpperCase(),
    [activeTab]
  );

  // --- HANDLERS ---
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        collapsed={!isSidebarOpen}
      />

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative w-full
          ${isSidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}
      >
        {/* HEADER */}
        {/* FIX: Truyền thẻ Fragment rỗng <></> vào để thỏa mãn prop 'children' của TypeScript */}
        <Header user={user} activeTab={activeTab}>
          <></>
        </Header>

        {/* TOGGLE BUTTON */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-40 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95 hidden lg:flex items-center justify-center"
          title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </button>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-bold tracking-wide text-slate-400">
                LMS <span className="mx-2 text-slate-300">/</span> 
                <span className="text-indigo-500">{pageTitle}</span>
              </h2>
            </div>
            
            {/* Render Component Con */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* GLOBAL COMPONENTS */}
      <AiAssistant
        user={{ id: user.id, full_name: user.full_name }}
        context={`Đang xem ${activeTab}`}
      />

      <Toast />
    </div>
  );
};

export default memo(Layout);
