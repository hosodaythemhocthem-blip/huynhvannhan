// components/Sidebar.tsx

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
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
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

  return (
    <aside
      className={`bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-6 font-black text-lg tracking-wide">
        {!collapsed && "NhanLMS Pro"}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
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
          <LogOut size={20} />
          {!collapsed && "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
