import React from 'react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase mb-2 tracking-tight">Hệ thống Quản trị</h2>
        <p className="text-slate-500 mb-8 font-medium">Khu vực dành riêng cho quản lý cấp cao.</p>
        
        <div className="space-y-4">
          <button 
            onClick={onLogout} 
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase text-xs tracking-widest"
          >
            Đăng xuất hệ thống
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
