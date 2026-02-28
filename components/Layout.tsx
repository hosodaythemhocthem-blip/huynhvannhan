import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";

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
  // Trạng thái thu/phóng trên Desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  // Trạng thái ẩn/hiện trên Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("lms_sidebar_state");
        if (saved !== null) {
          setIsSidebarOpen(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc trạng thái Sidebar", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lms_sidebar_state", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("lms_last_active", Date.now().toString());
  }, [activeTab]);

  const pageTitle = useMemo(
    () => activeTab.replace(/-/g, " ").toUpperCase(),
    [activeTab]
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      
      {/* @ts-ignore */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        collapsed={!isSidebarOpen}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Điều chỉnh margin trái: Không có margin trên mobile (ml-0), có margin trên md trở lên */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative w-full ${
          isSidebarOpen ? "md:ml-72 ml-0" : "md:ml-24 ml-0"
        }`}
      >
        
        {/* @ts-ignore */}
        <Header user={user} activeTab={activeTab} />

        {/* Nút Hamburger cho Mobile */}
        <button
          onClick={toggleMobileMenu}
          className="absolute top-4 left-4 z-40 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95 md:hidden flex items-center justify-center"
          title="Mở menu"
        >
          <Menu size={20} />
        </button>

        {/* Nút Thu/Phóng cho Desktop */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-40 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95 hidden md:flex items-center justify-center"
          title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </button>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-12 md:mt-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-6 ml-12 md:ml-0"> {/* Đẩy text sang phải một chút trên mobile để không bị đè bởi nút Hamburger */}
              <h2 className="text-sm font-bold tracking-wide text-slate-400">
                LMS <span className="mx-2 text-slate-300">/</span>
                <span className="text-indigo-500">{pageTitle}</span>
              </h2>
            </div>

            <div className="animate-fade-in">{children}</div>
          </div>
        </main>
      </div>

      <AiAssistant
        user={{ id: user.id, full_name: user.full_name }}
        context={`Đang xem ${activeTab}`}
      />

      {/* @ts-ignore */}
      <Toast />
    </div>
  );
};

export default memo(Layout);
