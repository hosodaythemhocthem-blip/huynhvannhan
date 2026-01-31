import React, { useMemo, useState } from "react";
import { Bell, Search, Command } from "lucide-react";

interface HeaderProps {
  userName: string;
}

const Header: React.FC<HeaderProps> = ({ userName }) => {
  const [search, setSearch] = useState("");

  const initials = useMemo(() => {
    if (!userName?.trim()) return "?";
    return userName
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [userName]);

  return (
    <header className="h-20 px-10 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50">
      {/* ================= SEARCH ================= */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm khóa học, bài thi..."
            aria-label="Tìm kiếm"
            className="w-full pl-12 pr-14 py-3 bg-slate-100/50 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-sm font-medium transition-all outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 uppercase pointer-events-none">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button
          aria-label="Thông báo"
          className="relative p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        {/* User */}
        <div className="flex items-center gap-4 cursor-pointer select-none">
          <div className="text-right">
            <div className="text-sm font-black text-slate-800 leading-none">
              {userName || "Giảng viên"}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Giảng viên
            </div>
          </div>

          <div className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-white shadow-lg shadow-indigo-100 flex items-center justify-center text-white font-black text-xs">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
