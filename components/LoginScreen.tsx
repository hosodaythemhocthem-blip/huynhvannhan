
import React, { useState } from 'react';
import { 
  GraduationCap, ArrowRight, UserCircle, X, ShieldCheck, CheckCircle2, 
  Briefcase, Loader2, Info
} from 'lucide-react';
import { UserRole } from '../types';
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

  const resetForm = () => {
    setError('');
    setMessage('');
    setIsLoggingIn(false);
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setError('');
    setMessage('');

    try {
      // Chuẩn hóa dữ liệu trước khi gửi
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername || !password) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }

      const newAccount = {
        username: cleanUsername,
        password: password.trim(),
        name: fullName.trim(),
        school: schoolName.trim(),
        code: `GV${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING',
        createdAt: new Date().toLocaleDateString('vi-VN'),
        role: 'TEACHER'
      };

      const success = await SyncService.saveAccount('teachers', newAccount);
      
      if (success) {
        setMessage(`Đăng ký thành công! Đang chờ Thầy Nhẫn phê duyệt.`);
        setTimeout(() => {
          setView('teacher_login');
          setUsername(cleanUsername);
          setPassword('');
          setIsLoggingIn(false);
        }, 2000);
      } else {
        setError('Kết nối Cloud thất bại. Thầy hãy kiểm tra lại cấu hình Firebase.');
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống. Thầy vui lòng thử lại.');
      setIsLoggingIn(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError('');

    try {
      const docRef = doc(db, "teachers", username.trim().toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.password === password.trim()) {
          if (userData.status === 'APPROVED') {
            onSelectRole(UserRole.TEACHER, userData);
          } else {
            setError(userData.status === 'REJECTED' ? 'Tài khoản đã bị từ chối.' : 'Tài khoản đang chờ phê duyệt.');
            setIsLoggingIn(false);
          }
        } else {
          setError('Mật khẩu không đúng.');
          setIsLoggingIn(false);
        }
      } else {
        setError('Tài khoản không tồn tại.');
        setIsLoggingIn(false);
      }
    } catch (err) {
      setError('Lỗi xác thực Cloud.');
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      if (username === 'huynhvannhan' && password === '12345678') {
        onSelectRole(UserRole.ADMIN);
      } else {
        setError('Thông tin Admin sai.');
        setIsLoggingIn(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
      {view === 'selection' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
             <h1 className="text-5xl font-black text-[#1e293b] mb-3 tracking-tight uppercase italic">Toán Học Cloud</h1>
             <p className="text-blue-600 font-bold uppercase tracking-[0.25em] text-[10px]">Hệ thống Huỳnh Văn Nhẫn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 w-full max-w-3xl">
            <div onClick={() => { setView('teacher_login'); resetForm(); }} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Giáo Viên</h2>
              <div className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-blue-100">Vào cổng <ArrowRight size={18} /></div>
            </div>

            <div onClick={() => { setView('student_login'); resetForm(); }} className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer">
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Học Sinh</h2>
              <div className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-orange-100">Luyện tập <ArrowRight size={18} /></div>
            </div>
          </div>

          <button onClick={() => { setView('admin_login'); resetForm(); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
            <ShieldCheck size={16} /> ADMIN
          </button>
        </div>
      )}

      {view !== 'selection' && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-50 relative">
            <button onClick={() => setView('selection')} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"><X size={24} /></button>
            
            <div className="flex items-center gap-3 mb-10">
               <div className={`p-3 rounded-2xl text-white ${view === 'admin_login' ? 'bg-slate-900' : 'bg-blue-600'}`}>
                 {view === 'admin_login' ? <ShieldCheck size={28} /> : <UserCircle size={28} />}
               </div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                 {view === 'admin_login' ? 'Admin' : view.includes('login') ? 'Đăng nhập' : 'Đăng ký'}
               </h2>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100 flex items-center gap-2 animate-pulse"><Info size={16} /> {error}</div>}
            {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-2xl border border-emerald-100 flex items-center gap-2"><CheckCircle2 size={16} /> {message}</div>}

            <form onSubmit={view === 'teacher_register' ? handleTeacherRegister : (view === 'admin_login' ? handleAdminLogin : handleTeacherLogin)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <input required disabled={isLoggingIn} type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 disabled:opacity-50" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                <input required disabled={isLoggingIn} type="password" title="password" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 disabled:opacity-50" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {view === 'teacher_register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                    <input required disabled={isLoggingIn} type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm disabled:opacity-50" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trường học</label>
                    <input required disabled={isLoggingIn} type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm disabled:opacity-50" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                </>
              )}

              <button disabled={isLoggingIn} type="submit" className={`w-full py-4.5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all mt-4 flex items-center justify-center gap-2 ${view === 'admin_login' ? 'bg-slate-900' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'} disabled:opacity-70`}>
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoggingIn ? 'Đang gửi Cloud...' : (view === 'teacher_register' ? 'Đăng ký ngay' : 'Vào hệ thống')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              {view.startsWith('teacher') && !isLoggingIn && (
                <button 
                  type="button"
                  onClick={() => { setView(view === 'teacher_login' ? 'teacher_register' : 'teacher_login'); resetForm(); }} 
                  className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors underline decoration-dotted"
                >
                  {view === 'teacher_login' ? 'Tạo tài khoản mới' : 'Quay lại đăng nhập'}
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
