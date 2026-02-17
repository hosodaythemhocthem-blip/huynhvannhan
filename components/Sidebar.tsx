// components/Sidebar.tsx

import React, { memo, useMemo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  LineChart,
  GraduationCap,
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
    const items: NavItem[] = [
      { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
      { id: "courses", icon: BookOpen, label: "Khóa học" },
      {
        id: "exams",
        icon: FileText,
        label: user.role === "teacher" ? "Quản lý đề thi" : "Kỳ thi",
      },
    ];

    if (user.role === "teacher") {
      items.push({ id: "classes", icon: Users, label: "Quản lý lớp" });
      items.push({ id: "games", icon: Gamepad2, label: "Đấu trường" });
    }

    items.push({ id: "ai", icon: Bot, label: "Trợ lý AI" });
    items.push({ id: "progress", icon: LineChart, label: "Tiến độ" });

    if (user.email === "huynhvannhan@gmail.com") {
      items.push({ id: "admin", icon: ShieldCheck, label: "Quản trị" });
    }

    return items;
  }, [user.role, user.email]);

  return (
    <aside
      className={`bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col transition-all ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="h-20 flex items-center px-6 font-black text-lg">
        {!collapsed && "NhanLMS Pro"}
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-indigo-600"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10"
        >
          <LogOut size={20} />
          {!collapsed && "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
