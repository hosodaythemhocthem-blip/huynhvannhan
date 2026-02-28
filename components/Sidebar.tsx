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
  X // Thêm icon X để đóng menu trên mobile
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
  // Thêm 2 props mới để xử lý mobile
  isMobileOpen?: boolean; 
  onCloseMobile?: () => void; 
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
  collapsed = false,
  isMobileOpen = false,
  onCloseMobile,
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

  // Xử lý khi click vào tab: chuyển tab và tự động đóng Sidebar trên mobile
  const handleTabClick = (id: string) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Lớp phủ Overlay màu đen trên Mobile - Bấm vào đây cũng sẽ đóng menu */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Chính */}
      <aside
        className={`bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-50
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} /* Ẩn/hiện trên mobile */
          md:translate-x-0 /* Luôn hiện trên Desktop */
          ${collapsed ? "w-72 md:w-24" : "w-72"} /* Mobile luôn giữ w-72, Desktop thu phóng tùy collapsed */
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 font-black text-lg tracking-wide whitespace-nowrap overflow-hidden">
          <span className={collapsed ? "block md:hidden" : "block"}>NhanLMS Pro</span>
          
          {/* Nút đóng Sidebar trên Mobile */}
          <button 
            onClick={onCloseMobile} 
            className="md:hidden text-slate-400 hover:text-white p-2 -mr-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
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
                title={collapsed ? label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "block md:hidden" : "block"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "block md:hidden" : "block"}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
