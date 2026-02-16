
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import AiAssistant from './AiAssistant';
import { RefreshCw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onTabChange, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans selection:bg-indigo-500/20 selection:text-indigo-200 relative overflow-hidden">
      
      {/* 🎭 PREMIUM BACKGROUND MESH */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] bg-indigo-400/5 rounded-full blur-[100px]"></div>
      </div>

      {/* 🛡 SIDEBAR */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout} 
      />

      {/* 🚀 MAIN CONTENT */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out relative z-10 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-24'}`}>
        
        <Header user={user} activeTab={activeTab} />

        <main className="flex-1 p-6 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">
          
          <div className="mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
             <div className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
               LMS Core / <span className="text-white">{activeTab.replace('-', ' ')}</span>
             </p>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-700">
             {children}
          </div>

          <footer className="mt-24 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
             <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-indigo-400 animate-spin-slow" />
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cơ sở dữ liệu vĩnh viễn</p>
                   <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1 tracking-tighter">Supabase Cloud Connected</p>
                </div>
             </div>

             <div className="flex items-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span className="hover:text-indigo-400 cursor-pointer transition-colors">Điều khoản</span>
                <span className="hover:text-indigo-400 cursor-pointer transition-colors">Bản quyền Huỳnh Văn Nhẫn</span>
                <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20">
                   v5.8.0-ELITE
                </div>
             </div>
          </footer>
        </main>
      </div>

      <AiAssistant 
        user={{ id: user.id, displayName: user.fullName }} 
        context={`Thầy đang xem phân hệ ${activeTab}`}
      />

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default Layout;
