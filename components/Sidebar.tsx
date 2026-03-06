import React, { memo, useMemo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  LineChart,
  LogOut,
  Users,
  FileText,
  ShieldCheck,
  Gamepad2,
  X 
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean; // Cho phép optional để tránh lỗi nếu quên truyền
  onClose: () => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  isOpen = false, // Mặc định là false (ẩn)
  onClose,
}) => {
  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
      { id: "courses", icon: BookOpen, label: "Khóa học" },
      {
        id: "exams",
        icon: FileText,
        label: user.role === "teacher" ? "Quản lý đề thi" : "Kỳ thi",
      },
      { id: "ai", icon: Bot, label: "Trợ lý AI" },
      { id: "progress", icon: LineChart, label: "Tiến độ" },
    ];

    if (user.role === "teacher") {
      baseItems.splice(3, 0,
        { id: "classes", icon: Users, label: "Quản lý lớp" },
        { id: "games", icon: Gamepad2, label: "Đấu trường" }
      );
    }

    if (user.email === "huynhvannhan@gmail.com") {
      baseItems.push({
        id: "admin",
        icon: ShieldCheck,
        label: "Quản trị",
      });
    }

    return baseItems;
  }, [user.role, user.email]);

  const handleTabClick = (id: string) => {
    onTabChange(id);
    onClose(); 
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className="bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl w-72"
        style={{ 
          // Ép buộc trượt ra ngoài và ẩn đi khi isOpen = false
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: isOpen ? 'visible' : 'hidden',
          zIndex: 70 
        }}
      >
        <div className="h-20 flex items-center justify-between px-6 font-black text-lg tracking-wide whitespace-nowrap overflow-hidden">
          <span>NhanLMS Pro</span>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 -mr-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="whitespace-nowrap block">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="whitespace-nowrap block">
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
