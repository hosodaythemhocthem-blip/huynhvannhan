import React, { useState, useEffect, useMemo, memo } from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
import { Menu } from "lucide-react"; // Dùng duy nhất icon Menu cho gọn

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
  // Dùng 1 trạng thái duy nhất cho cả PC và Mobile (mặc định là ẩn)
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
        onClose={() => setIsMenuOpen(false)} // Truyền hàm đóng xuống Sidebar
      />

      {/* Nội dung chính LUÔN CHIẾM 100% chiều rộng (ml-0) */}
      <div className="flex-1 flex flex-col w-full min-h-screen relative transition-all duration-300 ml-0">
        
        {/* @ts-ignore */}
        <Header user={user} activeTab={activeTab} />

        {/* Nút bấm để MỞ menu - Cố định ở góc trái trên cùng */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-4 left-4 z-30 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center"
          title="Mở menu"
        >
          <Menu size={20} />
        </button>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-12 md:mt-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-6 ml-12"> {/* ml-12 để tránh chữ đè vào nút Menu */}
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
