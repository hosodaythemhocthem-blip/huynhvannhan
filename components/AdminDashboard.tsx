
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  LogOut, 
  ShieldCheck,
  KeyRound,
  X,
  Trash2
} from 'lucide-react';
import { TeacherAccount, AccountStatus } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isAdminPassModalOpen, setIsAdminPassModalOpen] = useState(false);
  const [adminOldPass, setAdminOldPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    setTeachers(accounts);
  }, []);

  const saveTeachers = (updated: TeacherAccount[]) => {
    setTeachers(updated);
    localStorage.setItem('teacher_accounts', JSON.stringify(updated));
    // Thông báo cho các tab/component khác
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateStatus = (username: string, status: AccountStatus) => {
    // Lấy dữ liệu mới nhất từ localStorage trước khi map để tránh mất dữ liệu do race condition
    const currentAccounts = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    const updated = currentAccounts.map((t: TeacherAccount) => 
      t.username === username ? { ...t, status } : t
    );
    saveTeachers(updated);
  };

  const handleDeleteTeacher = (username: string) => {
    if (!window.confirm("CẢNH BÁO: Xóa tài khoản Giáo viên này sẽ xóa toàn bộ dữ liệu liên quan. Tiếp tục?")) return;
    const currentAccounts = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    const updated = currentAccounts.filter((t: TeacherAccount) => t.username !== username);
    
    localStorage.removeItem(`exams_${username}`);
    localStorage.removeItem(`classes_${username}`);
    saveTeachers(updated);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !newPassword.trim()) return;
    const currentAccounts = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    const updated = currentAccounts.map((t: TeacherAccount) => 
      t.username === editingTeacher.username ? { ...t, password: newPassword } : t
    );
    
    saveTeachers(updated);
    setSuccessMsg(`Đã đổi mật khẩu cho GV ${editingTeacher.name}`);
    setTimeout(() => {
      setSuccessMsg('');
      setIsPasswordModalOpen(false);
      setEditingTeacher(null);
      setNewPassword('');
    }, 1500);
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPass = localStorage.getItem('admin_password') || '12345678';
    if (adminOldPass !== currentStoredPass) {
      setAdminError('Mật khẩu cũ không chính xác.');
      return;
    }
    localStorage.setItem('admin_password', adminNewPass);
    setSuccessMsg('Đã cập nhật mật khẩu Admin.');
    setTimeout(() => {
      setSuccessMsg('');
      setIsAdminPassModalOpen(false);
      setAdminOldPass('');
      setAdminNewPass('');
    }, 1500);
  };

  const filteredTeachers = teachers.filter(t => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <header className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-lg">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight italic">EduFlex Admin</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Quản trị hệ thống</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsAdminPassModalOpen(true)} className="px-6 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
            <KeyRound size={14} /> Bảo mật
          </button>
          <button onClick={onLogout} className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6 flex-grow w-full">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
             <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                <FilterTab active={filter === 'PENDING'} label="Chờ duyệt" onClick={() => setFilter('PENDING')} />
                <FilterTab active={filter === 'APPROVED'} label="Hợp lệ" onClick={() => setFilter('APPROVED')} />
                <FilterTab active={filter === 'ALL'} label="Tất cả" onClick={() => setFilter('ALL')} />
             </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-10 py-5">Giáo viên</th>
                <th className="px-10 py-5">Đơn vị</th>
                <th className="px-10 py-5 text-center">Trạng thái</th>
                <th className="px-10 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.username} className="hover:bg-slate-50/50 group transition-all">
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-800 text-base italic">{teacher.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">ID: {teacher.username}</div>
                  </td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-600">{teacher.school}</td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      teacher.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {teacher.status === 'APPROVED' ? 'Hợp lệ' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-end gap-2">
                      {teacher.status === 'PENDING' ? (
                        <button onClick={() => handleUpdateStatus(teacher.username, 'APPROVED')} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-md">
                          <CheckCircle size={18} />
                        </button>
                      ) : (
                        <button onClick={() => { setEditingTeacher(teacher); setIsPasswordModalOpen(true); }} className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white">
                          <KeyRound size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteTeacher(teacher.username)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTeachers.length === 0 && <div className="py-20 text-center text-slate-300 font-black italic">Không có dữ liệu phù hợp</div>}
        </div>
      </main>

      {/* Modals giữ nguyên logic cũ */}
      {isAdminPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bảo mật Admin</h3>
                 <button onClick={() => setIsAdminPassModalOpen(false)}><X size={24} className="text-slate-300" /></button>
              </div>
              <form onSubmit={handleUpdateAdminPassword} className="space-y-6">
                 <input required type="password" placeholder="Mật khẩu cũ" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold" value={adminOldPass} onChange={(e) => setAdminOldPass(e.target.value)} />
                 <input required type="password" placeholder="Mật khẩu mới" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold" value={adminNewPass} onChange={(e) => setAdminNewPass(e.target.value)} />
                 {adminError && <p className="text-xs text-red-500 font-bold uppercase">{adminError}</p>}
                 {successMsg && <p className="text-xs text-emerald-500 font-bold uppercase">{successMsg}</p>}
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Xác nhận</button>
              </form>
           </div>
        </div>
      )}

      {isPasswordModalOpen && editingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cấp mật khẩu mới</h3>
                 <button onClick={() => setIsPasswordModalOpen(false)}><X size={24} className="text-slate-300" /></button>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                 <p className="text-xs text-slate-400 font-bold uppercase">GV: {editingTeacher.name}</p>
                 <input required type="text" placeholder="Mật khẩu mới" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                 {successMsg && <p className="text-xs text-emerald-500 font-bold uppercase">{successMsg}</p>}
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Lưu thay đổi</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button onClick={onClick} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>
    {label}
  </button>
);

export default AdminDashboard;
