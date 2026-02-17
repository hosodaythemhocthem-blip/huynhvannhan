// components/Header.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  Search,
  Command,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Settings,
} from "lucide-react";
import { User } from "../types";
import { supabase } from "../supabase";

interface HeaderProps {
  user: User;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  /* Scroll effect */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Online status */
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  /* Close dropdown on ESC */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  /* User initials */
  const initials = useMemo(() => {
    if (!user.full_name) return "";
    return user.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  }, [user.full_name]);

  /* Logout */
  const handleLogout = useCallback(async () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    localStorage.removeItem("lms_user");
    window.location.href = "/";
  }, []);

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log("Searching:", searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 px-8 flex items-center justify-between h-20 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      {/* SEARCH */}
      <div className="flex-1 max-w-xl relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full pl-10 pr-16 py-3 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-1">
          <Command size={12} /> K
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <span
          className={`text-xs font-bold ${
            isOnline ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>

        <button className="relative p-2 rounded-lg hover:bg-slate-100">
          <Bell size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              {initials}
            </div>
            <ChevronDown size={16} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border py-3">
              <div className="px-4 pb-3 border-b text-xs text-slate-500">
                {user.email}
              </div>

              <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2">
                <UserIcon size={14} /> Hồ sơ
              </button>

              <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2">
                <Settings size={14} /> Cài đặt
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
