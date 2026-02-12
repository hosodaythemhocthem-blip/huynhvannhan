import React, { memo, useMemo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  LineChart,
  Settings,
  GraduationCap,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const navItems: NavItem[] = useMemo(
    () => [
      { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
      { id: "courses", icon: BookOpen, label: "Khóa học" },
      { id: "ai", icon: Bot, label: "Trợ lý AI" },
      { id: "progress", icon: LineChart, label: "Tiến độ" },
      { id: "settings", icon: Settings, label: "Cài đặt" },
    ],
    []
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      {/* ================= LOGO ================= */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <GraduationCap size={22} />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-800 select-none">
          NexusLMS
        </span>
      </div>

      {/* ================= MENU ================= */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`}
            >
              <Icon
                size={20}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-indigo-500"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ================= CTA ================= */}
      <div className="p-4 border-t border-slate-100">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)] pointer-events-none" />
          <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-1">
            Cần hỗ trợ?
          </p>
          <p className="text-sm font-semibold mb-3 leading-snug">
            Nâng cấp <span className="font-black">Pro</span> để dùng AI không
            giới hạn.
          </p>
          <button
            type="button"
            className="relative z-10 w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-sm font-black transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Nâng cấp ngay
          </button>
        </div>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
