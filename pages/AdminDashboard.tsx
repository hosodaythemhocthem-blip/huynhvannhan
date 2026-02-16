
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ClipboardPaste, 
  Loader2, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Sparkles,
  BarChart3,
  Mail,
  School,
  LogOut,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase";
import { User } from "../types";
import { useToast } from "../components/Toast";
import MathPreview from "../components/MathPreview";

const MotionDiv = motion.div as any;
const MotionTr = motion.tr as any;

/* ================= ADMIN CREDENTIALS ================= */
const ADMIN_AUTH = {
  username: "huynhvannhan",
  password: "huynhvannhan2020aA@", // Mật khẩu quản trị cấp cao
};

const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState({ user: "", pass: "" });
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  // 1. Xử lý Đăng nhập Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authData.user === ADMIN_AUTH.username && authData.pass === ADMIN_AUTH.password) {
      setIsAuthenticated(true);
      showToast("Chào mừng Super Admin Huỳnh Văn Nhẫn!", "success");
    } else {
      showToast("Thông tin quản trị không chính xác!", "error");
    }
  };

  // 2. Tải danh sách giáo viên từ Supabase
  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('users').select();
      const teacherList = (data as User[] || []).filter(u => u.role === 'teacher');
      setTeachers(teacherList);
    } catch (err) {
      showToast("Lỗi đồng bộ dữ liệu giáo viên.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) loadTeachers();
  }, [isAuthenticated, loadTeachers]);

  // 3. Phê duyệt Giáo viên
  const handleApprove = async (id: string) => {
    try {
      await supabase.from('users').update(id, { isApproved: true });
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, isApproved: true } : t));
      showToast("Đã phê duyệt giáo viên vào hệ thống!", "success");
    } catch (err) {
      showToast("Lỗi phê duyệt.", "error");
    }
  };

  // 4. Xóa vĩnh viễn Giáo viên
  const handleDelete = async (id: string) => {
    if (confirm("Thầy có chắc chắn muốn xóa vĩnh viễn tài khoản giáo viên này khỏi Supabase?")) {
      try {
        await supabase.from('users').delete(id);
        setTeachers(prev => prev.filter(t => t.id !== id));
        showToast("Đã xóa vĩnh viễn dữ liệu giáo viên.", "success");
      } catch (err) {
        showToast("Lỗi xóa dữ liệu.", "error");
      }
    }
  };

  // 5. Tìm kiếm & Ctrl+V
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      (t.fullName.toLowerCase().includes(search.toLowerCase()) || 
       t.email.toLowerCase().includes(search.toLowerCase())) &&
      (activeTab === 'pending' ? !t.isApproved : t.isApproved)
    );
  }, [teachers, search, activeTab]);

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    if (text) {
      setSearch(text);
      showToast("Đã dán từ Clipboard", "info");
    }
  };

  /* ================= UI ĐĂNG NHẬP ADMIN ================= */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] shadow-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Admin <span className="text-indigo-500">Access</span></h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Quyền quản trị tối cao</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input 
              type="text" placeholder="Admin Username" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={authData.user} onChange={e => setAuthData({...authData, user: e.target.value})}
            />
            <input 
              type="password" placeholder="Bảo mật Password" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={authData.pass} onChange={e => setAuthData({...authData, pass: e.target.value})}
            />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
              XÁC THỰC ADMIN
            </button>
          </form>
        </MotionDiv>
      </div>
    );
  }

  /* ================= UI DASHBOARD CHÍNH ================= */
  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 font-sans pb-32">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-16 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống Quản trị <span className="text-indigo-600">NhanLMS</span></h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" /> Xin chào, Super Admin Huỳnh Văn Nhẫn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
            <input 
              type="text" placeholder="Tìm giáo viên (Email, Tên)..." 
              className="pl-14 pr-14 py-4 w-72 md:w-96 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <button onClick={handlePaste} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 transition-all">
              <ClipboardPaste size={18} />
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="p-4 bg-white text-slate-400 rounded-2xl hover:text-rose-500 shadow-sm border border-slate-100 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatBox label="Tổng giáo viên" value={teachers.length} icon={<Users />} color="bg-indigo-600" />
        <StatBox label="Yêu cầu chờ duyệt" value={teachers.filter(t => !t.isApproved).length} icon={<UserPlus />} color="bg-rose-500" />
        <StatBox label="Đã kích hoạt" value={teachers.filter(t => t.isApproved).length} icon={<CheckCircle2 />} color="bg-emerald-500" />
      </section>

      {/* TEACHER MANAGEMENT TABLE */}
      <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex gap-4 p-2 bg-slate-200/50 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Chờ duyệt ({teachers.filter(t => !t.isApproved).length})
          </button>
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'approved' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Đã duyệt ({teachers.filter(t => t.isApproved).length})
          </button>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin Giáo viên</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cơ quan / Email</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                      <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Đang quét Cloud Supabase...</p>
                    </td>
                  </tr>
                ) : filteredTeachers.length > 0 ? filteredTeachers.map((t, idx) => (
                  <MotionTr 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={t.id} 
                    className="group hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:rotate-6 transition-transform">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg leading-tight">{t.fullName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mã GV: {t.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <Mail size={14} className="text-slate-300" /> {t.email}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <School size={14} className="text-slate-200" /> Hệ thống giáo dục NhanLMS
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                        {t.isApproved ? "Hoạt động" : "Chờ phê duyệt"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!t.isApproved && (
                          <button 
                            onClick={() => handleApprove(t.id)}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Phê duyệt ngay"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </MotionTr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-32 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Users size={40} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Không tìm thấy giáo viên nào</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

/* ================= COMPONENT CON ================= */

const StatBox = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-2xl transition-all">
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {/* Fix: Casting icon to any to allow size prop in cloneElement */}
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
      <ChevronRight className="text-slate-200" />
    </div>
  </div>
);

export default AdminDashboard;
