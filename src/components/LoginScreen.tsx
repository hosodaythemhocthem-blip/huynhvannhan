import React, { useState } from 'react';
import {
  GraduationCap, ArrowRight, UserCircle, X, ShieldCheck,
  CheckCircle2, Briefcase, Loader2, Info
} from 'lucide-react';
import { UserRole, AccountStatus } from '../types';
import { SyncService } from '../services/syncService';
import { db } from '../services/firebase';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================
   CONFIG
========================= */
const ADMIN_ACCOUNT = {
  username: 'huynhvannhan',
  password: '12345678', // demo – production chuyển env
};

interface LoginScreenProps {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const [view, setView] = useState<
    'selection' |
    'student_login' |
    'student_register' |
    'teacher_login' |
    'teacher_register' |
    'admin_login'
  >('selection');

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

  /* =========================
     TEACHER REGISTER
  ========================= */
  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError('');
    setMessage('');

    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername || !password || !fullName || !schoolName) {
        throw new Error('Vui lòng nhập đầy đủ thông tin');
      }

      const newAccount = {
        username: cleanUsername,
        password: password.trim(),
        name: fullName.trim(),
        school: schoolName.trim(),
        code: `GV${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING' as AccountStatus,
        createdAt: new Date().toISOString(),
        role: UserRole.TEACHER,
      };

      const success = await SyncService.saveAccount('teachers', newAccount);

      if (!success) {
        throw new Error('Không thể kết nối Firebase');
      }

      setMessage('Đăng ký thành công! Tài khoản đang chờ Admin phê duyệt.');
      setTimeout(() => {
        setView('teacher_login');
        setUsername(cleanUsername);
        setPassword('');
        setIsLoggingIn(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
      setIsLoggingIn(false);
    }
  };

  /* =========================
     TEACHER LOGIN
  ========================= */
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError('');

    try {
      const ref = doc(db, 'teachers', username.trim().toLowerCase());
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        throw new Error('Tài khoản không tồn tại');
      }

      const user = snap.data();

      if (user.password !== password.trim()) {
        throw new Error('Mật khẩu không đúng');
      }

      if (user.status !== 'APPROVED') {
        throw new Error(
          user.status === 'REJECTED'
            ? 'Tài khoản đã bị từ chối'
            : 'Tài khoản đang chờ phê duyệt'
        );
      }

      onSelectRole(UserRole.TEACHER, user);
    } catch (err: any) {
      setError(err.message || 'Lỗi xác thực');
      setIsLoggingIn(false);
    }
  };

  /* =========================
     ADMIN LOGIN
  ========================= */
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError('');

    setTimeout(() => {
      if (
        username === ADMIN_ACCOUNT.username &&
        password === ADMIN_ACCOUNT.password
      ) {
        onSelectRole(UserRole.ADMIN);
      } else {
        setError('Thông tin Admin không đúng');
        setIsLoggingIn(false);
      }
    }, 400);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
      {/* ===== SELECTION ===== */}
      {view === 'selection' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-[#1e293b] mb-3 uppercase italic">
              Toán Học Cloud
            </h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.25em] text-[10px]">
              Hệ thống Huỳnh Văn Nhẫn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 w-full max-w-3xl">
            <div
              onClick={() => { setView('teacher_login'); resetForm(); }}
              className="bg-white rounded-[40px] p-10 shadow border flex flex-col items-center cursor-pointer hover:shadow-2xl"
            >
              <Briefcase size={40} className="mb-6 text-blue-600" />
              <h2 className="text-2xl font-black uppercase">Giáo viên</h2>
            </div>

            <div
              onClick={() => { setView('student_login'); resetForm(); }}
              className="bg-white rounded-[40px] p-10 shadow border flex flex-col items-center cursor-pointer hover:shadow-2xl"
            >
              <GraduationCap size={40} className="mb-6 text-orange-500" />
              <h2 className="text-2xl font-black uppercase">Học sinh</h2>
            </div>
          </div>

          <button
            onClick={() => { setView('admin_login'); resetForm(); }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase"
          >
            <ShieldCheck size={16} /> ADMIN
          </button>
        </div>
      )}

      {/* ===== FORM ===== */}
      {view !== 'selection' && (
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[40px] p-10 shadow relative">
            <button onClick={() => setView('selection')} className="absolute top-6 right-6">
              <X />
            </button>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded">
                <Info size={14} /> {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded">
                <CheckCircle2 size={14} /> {message}
              </div>
            )}

            <form
              onSubmit={
                view === 'teacher_register'
                  ? handleTeacherRegister
                  : view === 'admin_login'
                    ? handleAdminLogin
                    : handleTeacherLogin
              }
              className="space-y-4"
            >
              <input
                required
                disabled={isLoggingIn}
                placeholder="Username"
                className="w-full p-3 rounded border"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                required
                disabled={isLoggingIn}
                type="password"
                placeholder="Password"
                className="w-full p-3 rounded border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {view === 'teacher_register' && (
                <>
                  <input
                    required
                    disabled={isLoggingIn}
                    placeholder="Họ và tên"
                    className="w-full p-3 rounded border"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <input
                    required
                    disabled={isLoggingIn}
                    placeholder="Trường học"
                    className="w-full p-3 rounded border"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </>
              )}

              <button
                disabled={isLoggingIn}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded"
              >
                {isLoggingIn ? <Loader2 className="animate-spin mx-auto" /> : 'Vào hệ thống'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
