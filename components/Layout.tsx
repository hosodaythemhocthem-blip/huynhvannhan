// components/Layout.tsx

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { User } from "../types";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AiAssistant from "./AiAssistant";
import Toast from "./Toast";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("lms_sidebar_state");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("lms_sidebar_state", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const pageTitle = useMemo(
    () => activeTab.replace("-", " ").toUpperCase(),
    [activeTab]
  );

  useEffect(() => {
    localStorage.setItem("lms_last_active", Date.now().toString());
  }, [activeTab]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        collapsed={!isSidebarOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all ${
          isSidebarOpen ? "lg:ml-72" : "lg:ml-24"
        }`}
      >
        <Header user={user} activeTab={activeTab} />

        <button
          onClick={toggleSidebar}
          className="absolute top-5 left-5 z-50 bg-white p-2 rounded shadow"
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>

        <main className="flex-1 p-8">
          <h2 className="text-xs font-bold text-slate-500 mb-6">
            LMS / {pageTitle}
          </h2>
          {children}
        </main>
      </div>

      <AiAssistant
        user={{ id: user.id, fullName: user.fullName }}
        context={`Đang xem ${activeTab}`}
      />

      <Toast />
    </div>
  );
};

export default memo(Layout);
