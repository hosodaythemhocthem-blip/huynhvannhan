
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, ArrowRight, UserCircle, Lock, X, ShieldCheck, CheckCircle2, 
  School, Briefcase, Settings, Loader2, Check, Search, Info
} from 'lucide-react';
import { UserRole, TeacherAccount, StudentAccount } from '../types';
import { SyncService } from '../services/syncService';
import { db } from '../services/firebase';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface LoginScreenProps {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const [view, setView] = useState<'selection' | 'student_login' | 'student_register' | 'teacher_login' | 'teacher_register' | 'admin_login'>('selection');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    const newAccount: any = {
      username,
      password, // Trong thực tế nên mã hóa
      name: fullName,
      school: schoolName,
      code: `GV${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      role: 'TEACHER'
    };

    const success = await SyncService.saveAccount('teachers', newAccount);
    if (success) {
      setMessage(`Đăng ký thành công! Vui lòng chờ Thầy Nhẫn phê duyệt tài khoản của bạn.`);
      setView('teacher_login');
      setUsername('');
      setPassword('');
    } else {
      setError('Lỗi kết nối Firebase. Vui lòng thử lại.');
    }
    setIsLoggingIn(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const docRef = doc(db, "teachers", username);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.password === password) {
          if (userData.status === 'APPROVED') {
            onSelectRole(UserRole.TEACHER, userData);
          } else if (userData.status === 'REJECTED') {
            setError('Tài khoản của bạn đã bị từ chối.');
          } else {
            setError('Tài khoản đang chờ Thầy Nhẫn phê duyệt.');
          }
        } else {
          setError('Mật khẩu không chính xác.');
        }
      } else {
        setError('Tài khoản không tồn tại trên hệ thống.');
      }
    } catch (err) {
      setError('Lỗi xác thực Firebase.');
    }
    setIsLoggingIn(false);
  };

  // Logic Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'huynhvannhan' && password === '12345678') { // Thay bằng pass của thầy
      onSelectRole(UserRole.ADMIN);
    } else {
      setError('Thông tin Admin không chính xác.');
    }
  };

  const handleLogout = () => {
    setView('selection');
    setError('');
    setMessage('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
      {view === 'selection' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
             <h1 className="text-5xl font-black text-[#1e293b] mb-3 tracking-tight uppercase italic">Kiến Thức Toán Học</h1>
             <p className="text-blue-600 font-bold uppercase tracking-[0.25em] text-[10px]">Cổng quản trị dành riêng cho Thầy Nhẫn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 w-full max-w-3xl">
            <div onClick={() => setView('teacher_login')} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Giáo Viên</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium italic">Đăng ký để Thầy Nhẫn phê duyệt vào hệ thống.</p>
              <div className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-blue-100">Vào cổng giáo viên <ArrowRight size={18} /></div>
            </div>

            <div onClick={() => setView('student_login')} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer opacity-80">
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Học Sinh</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium italic">Luyện tập và thi cử trực tuyến.</p>
              <div className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-orange-100">Vào cổng học sinh <ArrowRight size={18} /></div>
            </div>
          </div>

          <button 
            onClick={() => setView('admin_login')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
          >
            <ShieldCheck size={16} /> QUẢN TRỊ VIÊN
          </button>
        </div>
      )}

      {view !== 'selection' && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-50 relative">
            <button onClick={handleLogout} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"><X size={24} /></button>
            
            <div className="flex items-center gap-3 mb-10">
               <div className={`p-3 rounded-2xl text-white ${view === 'admin_login' ? 'bg-slate-900' : 'bg-blue-600'}`}>
                 {view === 'admin_login' ? <ShieldCheck size={28} /> : <UserCircle size={28} />}
               </div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                 {view === 'admin_login' ? 'Admin' : view.includes('login') ? 'Đăng nhập' : 'Đăng ký'}
               </h2>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100 flex items-center gap-2 animate-bounce-short"><Info size={16} /> {error}</div>}
            {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-2xl border border-emerald-100 flex items-center gap-2"><Check size={16} /> {message}</div>}

            <form onSubmit={view === 'teacher_register' ? handleTeacherRegister : (view === 'admin_login' ? handleAdminLogin : handleTeacherLogin)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-all" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                <input required type="password" title="password" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {view === 'teacher_register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                    <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trường học</label>
                    <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                </>
              )}

              <button disabled={isLoggingIn} type="submit" className={`w-full py-4.5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all mt-4 flex items-center justify-center gap-2 ${view === 'admin_login' ? 'bg-slate-900' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoggingIn ? 'Đang xác thực...' : (view === 'teacher_register' ? 'Đăng ký tài khoản' : 'Vào hệ thống')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              {view.startsWith('teacher') && (
                <button onClick={() => { setView(view === 'teacher_login' ? 'teacher_register' : 'teacher_login'); setError(''); setMessage(''); }} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors underline decoration-dotted">
                  {view === 'teacher_login' ? 'Tạo tài khoản giáo viên mới' : 'Quay lại đăng nhập'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
