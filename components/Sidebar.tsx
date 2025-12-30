
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Bot, LineChart, Settings, GraduationCap } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { to: '/courses', icon: <BookOpen size={20} />, label: 'Khóa học' },
    { to: '/ai-tutor', icon: <Bot size={20} />, label: 'Trợ lý AI' },
    { to: '/progress', icon: <LineChart size={20} />, label: 'Tiến độ' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Cài đặt' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <GraduationCap size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight">NexusLMS</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Cần hỗ trợ?</p>
          <p className="text-sm font-semibold mb-3">Nâng cấp lên Pro để sử dụng AI không giới hạn.</p>
          <button className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition-colors">
            Nâng cấp ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
