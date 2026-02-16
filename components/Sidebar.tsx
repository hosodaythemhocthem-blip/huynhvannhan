
import React, { memo, useMemo, useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, Bot, LineChart, GraduationCap,
  ChevronLeft, ChevronRight, LogOut, Users, FileText, ShieldCheck, Gamepad2
} from "lucide-react";
import { motion } from "framer-motion";
import { User } from "../types";

const MotionAside = motion.aside as any;
const MotionSpan = motion.span as any;

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  icon: any;
  label: string;
  badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, onLogout }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  const navItems = useMemo(() => {
    const items: NavItem[] = [
      { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
      { id: "courses", icon: BookOpen, label: "Khóa học" },
      { id: "exams", icon: FileText, label: user.role === 'teacher' ? "Quản lý đề thi" : "Kỳ thi" },
    ];

    if (user.role === 'teacher') {
      items.push({ id: "classes", icon: Users, label: "Quản lý lớp" });
      items.push({ id: "games", icon: Gamepad2, label: "Đấu trường" });
    }

    items.push({ id: "ai", icon: Bot, label: "Trợ lý AI", badge: 1 });
    items.push({ id: "progress", icon: LineChart, label: "Tiến độ" });
    
    if (user.email === 'huynhvannhan@gmail.com') {
      items.push({ id: "admin", icon: ShieldCheck, label: "Quản trị" });
    }
    return items;
  }, [user.role, user.email]);

  return (
    <MotionAside
      animate={{ width: collapsed ? 96 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }}
      className="bg-slate-950/40 backdrop-blur-3xl border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-[60]"
    >
      <div className="h-24 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_25px_rgba(79,70,229,0.4)] shrink-0">
            <GraduationCap size={24} />
          </div>
          {!collapsed && (
            <MotionSpan initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-xl text-white tracking-tighter shrink-0 italic">
              NhanLMS<span className="text-indigo-400">Pro</span>
            </MotionSpan>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative group
                ${isActive ? "bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)]" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
            >
              <item.icon size={22} className={isActive ? "text-white" : "group-hover:text-indigo-400 transition-colors"} />
              {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  NEW
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold">
          <LogOut size={22} />
          {!collapsed && <span className="text-sm">Đăng xuất</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="w-full h-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-500 hover:text-indigo-400 transition-all">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </MotionAside>
  );
};

export default memo(Sidebar);
