
import React, { useState, useEffect } from "react";
import { GraduationCap, Mail, Lock, User as UserIcon, Loader2, ArrowRight, Sparkles, ShieldCheck, School } from "lucide-react";
import { User } from "../types";
import { authService } from "../services/authService";
import { supabase } from "../supabase";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

interface Props {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load danh sách lớp từ Supabase để học sinh chọn khi đăng ký
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data } = await supabase.from('classes').select();
        setClasses(data || []);
      } catch (err) {
        console.error("Lỗi load lớp học:", err);
      }
    };
    loadClasses();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const user = await authService.login(email, password);
        onLogin(user);
        showToast(`Chào mừng ${user.fullName} quay trở lại!`, "success");
      } else {
        // Kiểm tra thông tin đăng ký
        if (!fullName.trim()) throw new Error("Vui lòng nhập họ và tên của em.");
        if (!selectedClass) throw new Error("Vui lòng chọn lớp học của em.");
        
        const cls = classes.find(c => c.id === selectedClass);
        if (!cls) throw new Error("Lớp học không hợp lệ.");

        // Fix: Cung cấp đầy đủ 3 đối số cho phương thức register theo chữ ký trong authService.ts
        await authService.register(email, fullName, { id: cls.id, name: cls.name });
        showToast("Gửi yêu cầu thành công! Thầy Nhẫn sẽ phê duyệt sớm nhé.", "success");
        setIsLogin(true);
      }
    } catch (err: any) {
      showToast(err.message || "Đã có lỗi xảy ra.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px]"></div>

      <AnimatePresence mode="wait">
        <MotionDiv 
          key={isLogin ? "login" : "register"}
          initial={{ opacity: 0, scale: 0.95, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 md:p-20 shadow-[0_0_100px_rgba(79,70,229,0.1)] relative z-10"
        >
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-500/20 group hover:rotate-6 transition-transform">
              <GraduationCap size={56} className="text-indigo-600" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4 italic">NhanLMS <span className="text-indigo-500">Pro</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Hệ Sinh Thái Toán Học Toàn Diện</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-8">
            {!isLogin && (
              <>
                <div className="space-y-3 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Họ và tên của em</label>
                  <div className="relative">
                    <UserIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2.2rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" placeholder="Nguyễn Văn A" />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Chọn lớp học của em</label>
                  <div className="relative">
                    <School className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <select 
                      required 
                      value={selectedClass} 
                      onChange={e => setSelectedClass(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-slate-800 border border-white/10 rounded-[2.2rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2.2rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" placeholder="huynhvannhan@gmail.com" />
              </div>
            </div>

            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Mật khẩu bảo mật</label>
              <div className="relative">
                <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2.2rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" placeholder="••••••••" />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-lg tracking-[0.1em] shadow-3xl hover:bg-indigo-500 hover:-translate-y-1.5 transition-all flex items-center justify-center gap-4 mt-12 active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "VÀO HỆ THỐNG" : "ĐĂNG KÝ NGAY")}
              {!loading && <ArrowRight size={24} strokeWidth={3} />}
            </button>
          </form>

          <div className="mt-16 pt-10 border-t border-white/5 flex flex-col gap-8 items-center">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-slate-400 font-bold text-xs uppercase hover:text-indigo-400 transition-colors tracking-[0.2em]"
              >
                {isLogin ? "Chưa có tài khoản? Đăng ký học tập" : "Đã có tài khoản? Đăng nhập"}
              </button>
              
              <div className="flex items-center gap-6 opacity-30">
                 <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-indigo-400" /> Supabase Secured
                 </div>
                 <div className="w-1 h-1 bg-white rounded-full"></div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                    <Sparkles size={14} className="text-amber-400" /> Gemini Lumina Pro
                 </div>
              </div>
          </div>
        </MotionDiv>
      </AnimatePresence>

      {/* Floating Status Bar */}
      <div className="fixed bottom-10 left-10 hidden xl:flex items-center gap-4 opacity-20 hover:opacity-100 transition-opacity">
         <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
         <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Server Region: Asia-Pacific-SE1</span>
      </div>
    </div>
  );
};

export default LoginScreen;
