import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Settings,
  Search,
  Bell,
  LogOut,
  User,
} from "lucide-react";

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
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 min-w-[18rem] bg-white border-r border-slate-200 hidden md:flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3 border-b">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-lg font-extrabold text-slate-800">
              Toán Học Cloud
            </div>
            <div className="text-xs text-slate-500">
              Hệ thống Huỳnh Văn Nhẫn
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition">
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm khóa học, bài giảng, nội dung..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-300 rounded-full text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">
                  Admin
                </div>
                <div className="text-xs text-slate-500">
                  Quản trị hệ thống
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* ================= CONTENT (WIDTH CONTROLLED) ================= */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
