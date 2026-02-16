import React, { useState, useEffect } from "react";
import { GraduationCap, Mail, Lock, User as UserIcon, Loader2, ArrowRight, ShieldCheck, Zap, UserPlus, School } from "lucide-react";
import { User } from "../types";
import { authService } from "../services/authService";
import { supabase } from "../supabase";
import { useToast } from "../components/Toast";
import { motion, AnimatePresence } from "framer-motion";

// Định nghĩa kiểu cho Motion để tránh lỗi TypeScript build
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
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Tải danh sách lớp học vĩnh viễn từ Supabase/LocalStorage
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data } = await supabase.from('classes').select();
        setClasses(data || []);
      } catch (err) {
        console.error("Lỗi đồng bộ danh sách lớp:", err);
      }
    };
    loadClasses();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Gọi login đã được nâng cấp trong authService
        const user = await authService.login(email.trim(), password);
        onLogin(user);
        showToast(`Chào mừng Thầy/Em ${user.fullName} quay trở lại!`, "success");
      } else {
        // Logic đăng ký dành cho học sinh
        if (!fullName.trim()) throw new Error("Vui lòng nhập họ và tên của em.");
        if (!selectedClassId) throw new Error("Vui lòng chọn lớp học của em.");
        
        const cls = classes.find(c => String(c.id) === String(selectedClassId));
        if (!cls) throw new Error("Lớp học không hợp lệ.");

        await authService.register(email.trim(), fullName.trim(), { id: cls.id, name: cls.name });
        
        showToast("Đăng ký thành công! Đang chờ Thầy Nhẫn duyệt em vào lớp nhé.", "success");
        setIsLogin(true); // Chuyển về màn hình đăng nhập sau khi đăng ký
        
        // Reset form đăng ký
        setFullName("");
        setSelectedClassId("");
      }
    } catch (err: any) {
      showToast(err.message || "Đã có lỗi xảy ra.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Hiệu ứng nền Aura siêu đẹp */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/15 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px]"></div>

      <AnimatePresence mode="wait">
        <MotionDiv 
          key={isLogin ? "login" : "register"}
          initial={{ opacity: 0, scale: 0.95, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -30 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 group hover:scale-110 transition-transform duration-300">
              {isLogin ? <GraduationCap size={44} className="text-indigo-600" /> : <UserPlus size={44} className="text-indigo-600" />}
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
              NhanLMS <span className="text-indigo-500">Elite</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-80">
              {isLogin ? "Hệ Thống Quản Trị Học Tập Pro" : "Tham Gia Cộng Đồng Toán Học"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Họ và tên học sinh</label>
                  <div className="relative">
                    <UserIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-16 pr-8 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all" placeholder="Tên của em là..." />
                  </div>
                </div>
                
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Chọn lớp học của em</label>
                  <div className="relative">
                    <School className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <select 
                      required 
                      value={selectedClassId} 
                      onChange={e => setSelectedClassId(e.target.value)}
                      className="w-full pl-16 pr-8 py-4 bg-[#0f172a] border border-white/10 rounded-[1.5rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="" disabled>-- Chọn lớp học --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-16 pr-8 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all" placeholder="email@gmail.com" />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-16 pr-8 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all" placeholder="••••••••" />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg tracking-[0.1em] shadow-lg hover:bg-indigo-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 mt-8 active:scale-95 disabled:opacity-50 group">
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "VÀO HỆ THỐNG" : "GỬI YÊU CẦU DUYỆT")}
              {!loading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 items-center">
              <button 
                type="button"
                onClick={() => {
                   setIsLogin(!isLogin);
                   setFullName("");
                }} 
                className="text-white font-bold text-sm uppercase hover:text-indigo-400 transition-colors tracking-[0.1em]"
              >
                {isLogin ? "Học sinh mới? Đăng ký tại đây" : "Đã có tài khoản? Đăng nhập ngay"}
              </button>
              
              <div className="flex items-center gap-6 opacity-40">
                 <div className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-indigo-400" /> Supabase Protected
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest">
                    <Zap size={14} className="text-amber-400" /> Elite v5.9
                 </div>
              </div>
          </div>
        </MotionDiv>
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
