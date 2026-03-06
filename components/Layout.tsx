import React, { useState, useEffect, useMemo, memo } from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
import { Menu } from "lucide-react"; 

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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("lms_last_active", Date.now().toString());
  }, [activeTab]);

  const pageTitle = useMemo(
    () => activeTab.replace(/-/g, " ").toUpperCase(),
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      
      {/* @ts-ignore */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col w-full min-h-screen relative transition-all duration-300 ml-0">
        
        {/* NÚT BẤM MENU: Đã sửa thành fixed và z-[60] để luôn nổi lên trên cùng, không bị Header đè */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="fixed top-3 left-3 z-[60] bg-white/90 backdrop-blur-sm p-2.5 rounded-xl shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:shadow-lg hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Mở menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>

        {/* @ts-ignore */}
        <Header user={user} activeTab={activeTab} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-12 md:mt-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Thêm ml-14 để chữ "LMS / ..." không bị nút Menu đè lên */}
            <div className="flex items-center gap-2 mb-6 ml-14"> 
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
