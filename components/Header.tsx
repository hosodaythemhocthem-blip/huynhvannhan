
import React, { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Search, 
  Command, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Sparkles,
  CloudCheck,
  Zap,
  LayoutGrid,
  Settings,
  BellRing
} from "lucide-react";
import { User } from "../types";
import { supabase } from "../supabase";

interface HeaderProps {
  user: User;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ user, activeTab }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Theo dõi hiệu ứng cuộn trang
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = useMemo(() => {
    return user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  }, [user.fullName]);

  const handleLogout = () => {
    if(confirm("Thầy Nhẫn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('nhanlms_current_user');
      window.location.reload();
    }
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 px-8 flex items-center justify-between h-24
      ${isScrolled ? "bg-white/80 backdrop-blur-2xl shadow-xl shadow-slate-200/50 h-20" : "bg-transparent"}`}>
      
      {/* 🔍 SEARCH BAR SECTION */}
      <div className="flex-1 max-w-xl">
        <div className="group relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm đề thi, công thức, học sinh..."
            className="w-full pl-14 pr-20 py-4 bg-white/50 border border-slate-100 rounded-[2rem] text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-200 shadow-sm"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 bg-white text-[10px] font-black text-slate-300 uppercase pointer-events-none">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      {/* ⚡ RIGHT CONTROLS */}
      <div className="flex items-center gap-8">
        
        {/* Sync Status */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 group cursor-help" title="Dữ liệu đã được lưu vĩnh viễn trên Supabase">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cloud Synced</span>
        </div>

        {/* Notifications */}
        <button className="relative p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all active:scale-90">
           <Bell size={24} />
           <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>
        </button>

        <div className="h-10 w-px bg-slate-200" />

        {/* USER PROFILE DROP */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-4 p-2 pr-4 rounded-[2rem] transition-all group
              ${isProfileOpen ? "bg-white shadow-xl ring-1 ring-slate-100" : "hover:bg-white/50"}`}
          >
            <div className="relative">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-100 flex items-center justify-center text-white font-black text-sm group-hover:rotate-6 transition-transform">
                  {initials}
               </div>
               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-lg border-2 border-white flex items-center justify-center">
                  <Zap size={10} className="text-white fill-current" />
               </div>
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-tight tracking-tight">
                {user.fullName}
              </p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                {user.role === 'teacher' ? 'Giảng viên Cao cấp' : 'Học sinh Ưu tú'}
              </p>
            </div>
            
            <ChevronDown 
              size={18} 
              className={`text-slate-300 transition-transform duration-300 ${isProfileOpen ? "rotate-180 text-indigo-600" : ""}`} 
            />
          </button>

          {/* DROPDOWN MENU */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 py-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="px-6 py-4 border-b border-slate-50 mb-2">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Tài khoản</p>
                   <p className="text-xs font-bold text-slate-600 truncate">{user.email}</p>
                </div>
                
                <button className="w-full px-6 py-3.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><UserIcon size={16} /></div>
                  Hồ sơ cá nhân
                </button>

                <button className="w-full px-6 py-3.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Settings size={16} /></div>
                  Cấu hình hệ thống
                </button>

                <div className="px-4 mt-2 pt-2 border-t border-slate-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-4 text-left text-sm font-black text-rose-500 hover:bg-rose-50 rounded-2xl flex items-center gap-3 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center"><LogOut size={16} /></div>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
