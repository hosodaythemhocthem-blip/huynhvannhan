
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  UserCircle, 
  Lock, 
  X, 
  ShieldCheck,
  CheckCircle2,
  Users2,
  School,
  ChevronRight,
  Search,
  Briefcase,
  Settings,
  Cloud,
  ExternalLink,
  Info,
  Check,
  UserCheck,
  Loader2
} from 'lucide-react';
import { UserRole, TeacherAccount, StudentAccount } from '../types';
import { SyncService } from '../services/syncService';

interface LoginScreenProps {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const [view, setView] = useState<'selection' | 'student_login' | 'student_register' | 'teacher_login' | 'teacher_register' | 'admin_login'>('selection');
  
  // Auth States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form States
  const [teacherSearch, setTeacherSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [matchedTeacher, setMatchedTeacher] = useState<TeacherAccount | null>(null);
  const [allApprovedTeachers, setAllApprovedTeachers] = useState<TeacherAccount[]>([]);

  const ADMIN_USERNAME = 'huynhvannhan';

  useEffect(() => {
    const accounts: TeacherAccount[] = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    setAllApprovedTeachers(accounts.filter(t => t.status === 'APPROVED'));
  }, [view]);

  const handleOpenApiKeyDialog = async () => {
    try {
      const aiStudio = (window as any).aistudio;
      if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
        await aiStudio.openSelectKey();
      } else {
        alert("Tính năng này chỉ khả dụng trong môi trường AI Studio.");
      }
    } catch (err) {
      console.error("Lỗi khi mở hộp thoại API:", err);
    }
  };

  // Hàm quan trọng: Khôi phục dữ liệu từ Cloud khi đăng nhập
  const restoreDataFromCloud = async (userUsername: string) => {
    const syncId = SyncService.generateSyncId(userUsername);
    const cloudData = await SyncService.pullData(syncId);
    
    if (cloudData) {
      console.log("Found cloud data, restoring...");
      // Khôi phục Exams
      if (cloudData.exams) localStorage.setItem(`exams_${userUsername}`, JSON.stringify(cloudData.exams));
      // Khôi phục Classes
      if (cloudData.classes) localStorage.setItem(`classes_${userUsername}`, JSON.stringify(cloudData.classes));
      // Khôi phục Grades (Hòa trộn dữ liệu)
      if (cloudData.grades) {
        const localGrades = JSON.parse(localStorage.getItem('grades') || '[]');
        const mergedGrades = [...localGrades, ...cloudData.grades.filter((cg: any) => !localGrades.some((lg: any) => lg.id === cg.id))];
        localStorage.setItem('grades', JSON.stringify(mergedGrades));
      }
      // Khôi phục Student Accounts (Hòa trộn)
      if (cloudData.student_accounts) {
        const localStudents = JSON.parse(localStorage.getItem('student_accounts') || '[]');
        const mergedStudents = [...localStudents, ...cloudData.student_accounts.filter((cs: any) => !localStudents.some((ls: any) => ls.username === cs.username))];
        localStorage.setItem('student_accounts', JSON.stringify(mergedStudents));
      }
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const accounts: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    const found = accounts.find(a => a.username === username && a.password === password);
    
    if (found) {
      if (found.status === 'PENDING') {
        setError('Tài khoản đang chờ Giáo viên duyệt.');
      } else {
        await restoreDataFromCloud(username);
        onSelectRole(UserRole.STUDENT, found);
      }
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
    setIsLoggingIn(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const accounts: TeacherAccount[] = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    const found = accounts.find(a => a.username === username && a.password === password);
    
    if (found) {
      if (found.status === 'APPROVED') {
        await restoreDataFromCloud(username);
        onSelectRole(UserRole.TEACHER, found);
      } else {
        setError('Tài khoản đang chờ phê duyệt.');
      }
    } else {
      setError('Thông tin đăng nhập không chính xác.');
    }
    setIsLoggingIn(false);
  };

  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedTeacher) {
      setError('Vui lòng chọn giáo viên của bạn trong danh sách bên dưới.');
      return;
    }

    const studentAccounts: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    if (studentAccounts.some(s => s.username === username)) {
      setError('Tên đăng nhập này đã được sử dụng.');
      return;
    }

    const newStudent: StudentAccount = {
      username,
      password,
      name: fullName,
      requestedClassName: studentClass,
      classId: 'pending',
      status: 'PENDING',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      teacherUsername: matchedTeacher.username
    };

    localStorage.setItem('student_accounts', JSON.stringify([...studentAccounts, newStudent]));
    setMessage(`Đăng ký thành công! Đang chờ phê duyệt từ thầy/cô ${matchedTeacher.name}. Dữ liệu của bạn sẽ tự động đồng bộ.`);
    setView('student_login');
    setFullName('');
    setUsername('');
    setPassword('');
    setStudentClass('');
    setMatchedTeacher(null);
  };

  const handleTeacherRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const accounts: TeacherAccount[] = JSON.parse(localStorage.getItem('teacher_accounts') || '[]');
    if (accounts.some(a => a.username === username)) {
      setError('Tên đăng nhập đã tồn tại.');
      return;
    }

    const newAccount: TeacherAccount = {
      username,
      password,
      name: fullName,
      school: schoolName,
      code: `GV${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING',
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    localStorage.setItem('teacher_accounts', JSON.stringify([...accounts, newAccount]));
    setMessage(`Đăng ký thành công! Toàn bộ bài giảng của bạn sẽ được sao lưu đám mây vĩnh viễn.`);
    setView('teacher_login');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedAdminPass = localStorage.getItem('admin_password') || '12345678';
    if (username === ADMIN_USERNAME && password === storedAdminPass) {
      onSelectRole(UserRole.ADMIN);
    } else {
      setError('Thông tin đăng nhập Quản trị viên không chính xác.');
    }
  };

  const handleLogout = () => {
    setView('selection');
    setUsername('');
    setPassword('');
    setError('');
    setMessage('');
    setMatchedTeacher(null);
    setTeacherSearch('');
  };

  // Fix: Defined filteredTeachers based on teacherSearch state to fix the error on line 331
  const filteredTeachers = allApprovedTeachers.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
    t.school.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4 text-slate-700">
      
      {view === 'selection' && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
             <h1 className="text-5xl font-extrabold text-[#1e293b] mb-3 tracking-tight">Kiến Thức Toán Học</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px]">Đồng bộ xuyên thiết bị & Sao lưu vĩnh viễn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-in fade-in zoom-in-95 duration-500 w-full">
            <div onClick={() => setView('student_login')} className="bg-white rounded-[48px] p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer h-full">
              <div className="w-20 h-20 bg-[#fff7ed] rounded-3xl flex items-center justify-center text-[#f26522] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <GraduationCap size={44} />
              </div>
              <h2 className="text-2xl font-black text-[#1e293b] mb-4">Dành cho Học sinh</h2>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed px-6 font-medium">Làm bài kiểm tra, xem điểm và trao đổi với trợ lý ảo.</p>
              <div className="w-full py-4.5 bg-[#f26522] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-[11px] mt-auto">Đăng nhập Học sinh <ArrowRight size={18} /></div>
            </div>

            <div onClick={() => setView('teacher_login')} className="bg-white rounded-[48px] p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer h-full">
              <div className="w-20 h-20 bg-[#eff6ff] rounded-3xl flex items-center justify-center text-[#2563eb] mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <Briefcase size={44} />
              </div>
              <h2 className="text-2xl font-black text-[#1e293b] mb-4">Dành cho Giáo viên</h2>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed px-6 font-medium">Quản lý lớp, soạn đề LaTeX và thống kê kết quả.</p>
              <div className="w-full py-4.5 bg-[#2563eb] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-[11px] mt-auto">Đăng nhập Giáo viên <ArrowRight size={18} /></div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000">
            <div className="flex flex-wrap justify-center items-center gap-6">
              <button onClick={() => setView('admin_login')} className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors flex items-center gap-2">
                <ShieldCheck size={14} /> Quản trị viên
              </button>
              <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full"></div>
              <button onClick={handleOpenApiKeyDialog} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-600 transition-all flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200">
                <Settings size={14} className="animate-spin-slow" /> Cấu hình API hệ thống
              </button>
            </div>
          </div>

          <div className="mt-12 animate-in fade-in duration-1000">
             <div className="bg-white/60 backdrop-blur-sm px-8 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
               <Briefcase size={14} className="text-blue-600" />
               <p className="text-[11px] font-black text-slate-400 italic">
                 Thiết kế bởi Thầy{" "}
                 <span className="text-slate-600 not-italic uppercase">Huỳnh Văn Nhẫn</span>
               </p>
             </div>
          </div>
        </div>
      )}

      {(view !== 'selection') && (
        <div className={`w-full ${view === 'student_register' ? 'max-w-2xl' : 'max-w-md'} animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center`}>
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-50 relative w-full mb-8">
            <button onClick={handleLogout} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"><X size={24} /></button>
            
            <div className="flex items-center gap-3 mb-10">
               <div className={`p-3 rounded-2xl text-white ${view === 'admin_login' ? 'bg-slate-900' : (view.startsWith('student') ? 'bg-orange-500' : 'bg-blue-600')}`}>
                 {view === 'admin_login' ? <ShieldCheck size={28} /> : (view.startsWith('student') ? <GraduationCap size={28} /> : <UserCircle size={28} />)}
               </div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                 {view === 'admin_login' ? 'Admin' : view.includes('login') ? 'Đăng nhập' : 'Đăng ký'}
               </h2>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100">{error}</div>}
            {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-2xl border border-emerald-100">{message}</div>}

            <form onSubmit={view.includes('register') ? (view.startsWith('student') ? handleStudentRegister : handleTeacherRegister) : (view === 'admin_login' ? handleAdminLogin : (view.startsWith('student') ? handleStudentLogin : handleTeacherLogin))} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                  <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-all" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                  <input required type="password" title="password" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              {view.includes('register') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                      <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    {view.startsWith('teacher') ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trường/Đơn vị</label>
                        <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp (VD: 9A1)</label>
                        <input required type="text" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" value={studentClass} onChange={(e) => setStudentClass(e.target.value.toUpperCase())} />
                      </div>
                    )}
                  </div>

                  {view === 'student_register' && (
                    <div className="space-y-3 pt-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn Giáo viên của bạn</label>
                        <div className="relative">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="text" 
                             placeholder="Lọc tên thầy cô..." 
                             className="pl-9 pr-4 py-1.5 bg-slate-100 rounded-full text-[11px] outline-none focus:ring-1 focus:ring-orange-300" 
                             value={teacherSearch}
                             onChange={(e) => setTeacherSearch(e.target.value)}
                           />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredTeachers.map(t => (
                          <button 
                            key={t.username} 
                            type="button" 
                            onClick={() => setMatchedTeacher(t)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                              matchedTeacher?.username === t.username 
                              ? 'border-orange-500 bg-orange-50 shadow-md' 
                              : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <p className="text-sm font-black text-slate-800 italic">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 truncate">{t.school}</p>
                            {matchedTeacher?.username === t.username && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                <Check size={14} strokeWidth={4} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button disabled={isLoggingIn} type="submit" className={`w-full py-4.5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all mt-6 flex items-center justify-center gap-2 ${view.startsWith('student') ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoggingIn ? 'Đang xác thực & đồng bộ...' : (view.includes('register') ? 'Thiết lập tài khoản' : 'Vào hệ thống ngay')}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-50 text-center flex flex-col gap-4">
              <button onClick={() => { setView(view.includes('login') ? (view.startsWith('student') ? 'student_register' : 'teacher_register') : (view.startsWith('student') ? 'student_login' : 'teacher_login')); setError(''); setMessage(''); setMatchedTeacher(null); }} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600">
                {view.includes('login') ? 'Chưa có tài khoản? Tạo mới ngay' : 'Đã có tài khoản? Quay lại Đăng nhập'}
              </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2 opacity-30 group cursor-default">
               <Briefcase size={12} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                 Thiết kế bởi Thầy{" "}
                 <span className="text-slate-600 uppercase">Huỳnh Văn Nhẫn</span>
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
