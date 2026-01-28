import React from "react";
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

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { id: "courses", icon: BookOpen, label: "Khóa học" },
    { id: "ai", icon: Bot, label: "Trợ lý AI" },
    { id: "progress", icon: LineChart, label: "Tiến độ" },
    { id: "settings", icon: Settings, label: "Cài đặt" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <GraduationCap size={24} />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-800">
          NexusLMS
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-bold opacity-80 mb-1">Cần hỗ trợ?</p>
          <p className="text-sm font-semibold mb-3">
            Nâng cấp Pro để dùng AI không giới hạn.
          </p>
          <button className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-sm font-bold transition">
            Nâng cấp ngay
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
