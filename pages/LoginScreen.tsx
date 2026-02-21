import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { User } from "../types";
// import { authService } from "../services/authService";

interface Props {
  onLogin: (user: User) => void;
}

type AuthMode = "teacher" | "student-login" | "student-register";

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 1. LUỒNG GIÁO VIÊN
      if (mode === "teacher") {
        if (email.trim().toLowerCase() === "huynhvannhan@gmail.com" && password === "huynhvannhan2020") {
          const teacherUser: User = {
            id: "teacher-admin-nhan",
            email: email,
            full_name: "Thầy Huỳnh Văn Nhẫn",
            role: "teacher",
            avatar: "https://ui-avatars.com/api/?name=Huynh+Van+Nhan&background=4f46e5&color=fff&size=128",
          };
          onLogin(teacherUser);
        } else {
          throw new Error("Thông tin đăng nhập Giáo viên không chính xác!");
        }
      } 
      // 2. LUỒNG HỌC SINH ĐĂNG NHẬP
      else if (mode === "student-login") {
        if (!email || !password) throw new Error("Vui lòng nhập đầy đủ Email và Mật khẩu.");
        
        const studentUser: User = {
          id: `student-${Date.now()}`,
          email: email,
          full_name: "Học sinh Demo", 
          role: "student",
          status: "active"
        };
        onLogin(studentUser);
      } 
      // 3. LUỒNG HỌC SINH ĐĂNG KÝ
      else if (mode === "student-register") {
        if (!email || !password || !fullName) {
          throw new Error("Vui lòng điền đủ Họ tên, Email và Mật khẩu.");
        }
        alert(`Đã gửi yêu cầu đăng ký cho em: ${fullName}.\nHãy chờ Thầy Nhẫn duyệt nhé!`);
        setMode("student-login");
        setFullName("");
        setPassword("");
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã có lỗi không xác định xảy ra.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] relative flex items-center justify-center overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 p-4"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30 mb-6 transform rotate-3 hover:rotate-0 transition-all duration-500">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Nhan<span className="text-cyan-400">LMS</span> Elite
          </h1>
          <p className="text-slate-400 font-medium">Hệ sinh thái Toán học 4.0</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          
          {/* Tabs Switcher */}
          <div className="flex p-1 bg-slate-950/50 rounded-xl mb-8 border border-white/5 relative">
             <button
              onClick={() => switchMode("teacher")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all relative z-10 ${
                mode === "teacher" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Giáo viên
            </button>
            <button
              onClick={() => switchMode("student-login")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all relative z-10 ${
                mode !== "teacher" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Học sinh
            </button>

            {/* Active Tab Background */}
            <motion.div 
              layoutId="activeTab"
              className="absolute top-1 bottom-1 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"
              initial={false}
              animate={{
                left: mode === "teacher" ? "4px" : "50%",
                width: "calc(50% - 6px)",
                x: mode === "teacher" ? 0 : 2
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Error Box */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-medium"
                  >
                    <div className="w-1.5 h-8 bg-rose-500 rounded-full"></div>
                    {error}
                  </motion.div>
                )}

                {/* Teacher Specific Welcome */}
                {mode === "teacher" && (
                   <div className="text-center pb-2">
                     <p className="text-indigo-300 text-sm font-semibold">Cổng đăng nhập dành riêng cho Thầy Nhẫn</p>
                   </div>
                )}

                {/* Full Name Input (Register only) */}
                {mode === "student-register" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wide">Họ và tên</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wide">Email / Tài khoản</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                      placeholder={mode === "teacher" ? "huynhvannhan@gmail.com" : "student@email.com"}
                    />
                    {/* Checkmark if Teacher email is typed */}
                    {mode === "teacher" && email === "huynhvannhan@gmail.com" && (
                      <CheckCircle2 className="absolute right-4 top-3.5 w-5 h-5 text-emerald-500 animate-bounce" />
                    )}
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between ml-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mật khẩu</label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "teacher" ? "Truy cập Hệ thống" : mode === "student-login" ? "Đăng Nhập Ngay" : "Gửi Đăng Ký"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Footer Links */}
                {mode !== "teacher" && (
                  <div className="text-center mt-4">
                    <p className="text-slate-500 text-sm">
                      {mode === "student-login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                      <button
                        type="button"
                        onClick={() => switchMode(mode === "student-login" ? "student-register" : "student-login")}
                        className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline transition-all"
                      >
                        {mode === "student-login" ? "Đăng ký vào lớp" : "Đăng nhập ngay"}
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
