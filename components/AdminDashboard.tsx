
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, LogOut, Users, RefreshCw, CheckCircle } from 'lucide-react';
import { SyncService } from '../services/syncService';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    const data = await SyncService.getPendingTeachers();
    setPendingTeachers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAction = async (username: string, status: 'APPROVED' | 'REJECTED') => {
    setActionId(username);
    const success = await SyncService.updateTeacherStatus(username, status);
    if (success) {
      setPendingTeachers(prev => prev.filter(t => t.username !== username));
    } else {
      alert("Có lỗi xảy ra khi thực hiện thao tác.");
    }
    setActionId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Hệ thống Quản trị</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">ADMIN: HUYNH VAN NHAN</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600 rounded-xl text-xs font-black transition-all">
          <LogOut size={16} /> THOÁT
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full p-8 flex-1">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Duyệt Giáo Viên</h1>
            <p className="text-slate-500 font-medium italic">Chỉ những giáo viên được duyệt mới có thể đăng nhập vào Vercel.</p>
          </div>
          <button onClick={fetchTeachers} className="p-3 bg-white border border-slate-100 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giáo viên</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin trường</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày đăng ký</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quyết định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">Đang tải dữ liệu từ Firebase...</td></tr>
                ) : pendingTeachers.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">Hiện không có yêu cầu nào</td></tr>
                ) : (
                  pendingTeachers.map((t) => (
                    <tr key={t.username} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{t.name}</p>
                            <p className="text-xs text-slate-400 font-bold tracking-tighter">ID: {t.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-600">{t.school}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Mã GV: {t.code}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs text-slate-400 font-bold">{t.createdAt}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            disabled={actionId === t.username}
                            onClick={() => handleAction(t.username, 'APPROVED')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            <UserCheck size={16} /> Duyệt
                          </button>
                          <button 
                            disabled={actionId === t.username}
                            onClick={() => handleAction(t.username, 'REJECTED')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            <UserX size={16} /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center border-t border-slate-100 flex flex-col items-center gap-2">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Hệ thống bảo mật Firebase hvnn-8c48e</p>
        <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-bold">
          <CheckCircle size={12} /> KẾT NỐI VỚI VERCEL ỔN ĐỊNH
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
