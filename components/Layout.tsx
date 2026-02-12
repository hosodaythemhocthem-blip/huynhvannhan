import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Settings,
  Search,
  Bell,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import { authService } from "../services/authService";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "courses", label: "Courses", icon: BookOpen },
      { id: "achievements", label: "Achievements", icon: Award },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    []
  );

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authService.logout();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Lỗi đăng xuất");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 shadow-sm transition-all">

        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-4 border-b">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">
              Toán Học Cloud
            </h1>
            <p className="text-xs text-slate-500">
              Hệ thống Huỳnh Văn Nhẫn
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  active
                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:translate-x-1",
                ].join(" ")}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            {loggingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="h-16 flex items-center justify-between px-6 md:px-10">

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Tìm khóa học, đề thi, nội dung..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-5">

              <button
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-slate-800">
                    Admin
                  </div>
                  <div className="text-xs text-slate-500">
                    Quản trị hệ thống
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow">
                  <User size={18} />
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;
