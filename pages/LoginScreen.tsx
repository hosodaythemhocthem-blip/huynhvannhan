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
  Sparkles
} from "lucide-react";
import { User } from "../types";
// Import authService nếu Thầy đã có, ở đây em dùng logic để xử lý trực tiếp yêu cầu của Thầy
import { authService } from "../services/authService"; 

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Tạm dừng 1 chút để tạo cảm giác xử lý mượt mà
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 1. LUỒNG ĐĂNG NHẬP GIÁO VIÊN VIP
      if (mode === "teacher") {
        if (email === "huynhvannhan@gmail.com" && password === "huynhvannhan2020") {
          const teacherUser: User = {
            id: "teacher-admin-01",
            email: email,
            name: "Thầy Huỳnh Văn Nhẫn",
            role: "teacher",
            avatar: "https://ui-avatars.com/api/?name=Huynh+Van+Nhan&background=4f46e5&color=fff",
          };
          onLogin(teacherUser);
        } else {
          throw new Error("Tài khoản hoặc mật khẩu Giáo viên không chính xác!");
        }
      } 
      // 2. LUỒNG ĐĂNG NHẬP HỌC SINH
      else if (mode === "student-login") {
        // Thực tế Thầy sẽ gọi authService.signIn(email, password) ở đây
        // Tạm thời mock cho UI:
        if (!email || !password) throw new Error("Vui lòng nhập đầy đủ thông tin.");
        const studentUser: User = {
          id: `student-${Date.now()}`,
          email: email,
          name: "Học sinh Ẩn danh", // Sẽ lấy từ Database thực tế
          role: "student",
          status: "active" // Tương lai: kiểm tra xem có bị 'pending' không
        };
        onLogin(studentUser);
      } 
      // 3. LUỒNG ĐĂNG KÝ HỌC SINH (CHỜ DUYỆT)
      else if (mode === "student-register") {
        if (!email || !password || !fullName) {
          throw new Error("Vui lòng điền đủ thông tin để Thầy duyệt nhé!");
        }
        // Gọi API đăng ký lên Supabase ở đây. 
        // Sau đó chuyển về màn hình đăng nhập hoặc báo thành công.
        alert(`Đăng ký thành công cho: ${fullName}. Vui lòng chờ Thầy Nhẫn duyệt để vào lớp!`);
        setMode("student-login");
      }

    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
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
  };

  return (
    <div className="min-h-screen bg-[#020617] relative flex items-center justify-center overflow-hidden p-4">
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-[0_0_40px_rgba(79,70,229,0.15)] relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
            <Sparkles className="w-10 h-10 text-indigo-400 relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            Nhan<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">LMS</span> Elite
          </h1>
          <p className="text-slate-400 font-medium">Hệ Sinh Thái Toán Học Đỉnh Cao</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Top Tabs */}
          <div className="flex p-1 bg-slate-950/50 rounded-2xl mb-8 relative border border-white/5">
            <button
              onClick={() => switchMode("teacher")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${
                mode === "teacher" ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Giáo viên
            </button>
            <button
              onClick={() => switchMode("student-login")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${
                mode !== "teacher" ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Học sinh
            </button>
            
            {/* Tab Indicator Animation */}
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-xl transition-all duration-300 ease-in-out shadow-lg shadow-indigo-600/30 ${
              mode === "teacher" ? "left-1" : "left-[calc(50%+3px)]"
            }`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Cảnh báo lỗi */}
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                {/* Tên (Chỉ hiện khi Học sinh đăng ký) */}
                {mode === "student-register" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Họ và tên</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Email / Tài khoản</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder={mode === "teacher" ? "huynhvannhan@gmail.com" : "student@gmail.com"}
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-slate-300">Mật khẩu</label>
                    {mode !== "teacher" && mode !== "student-register" && (
                      <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Nút Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 mt-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {mode === "teacher" ? "Vào Bảng Điều Khiển" : mode === "student-login" ? "Đăng Nhập" : "Gửi Yêu Cầu Đăng Ký"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Chuyển đổi Đăng nhập / Đăng ký Học sinh */}
                {mode !== "teacher" && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-slate-400">
                      {mode === "student-login" ? "Chưa có tài khoản lớp Thầy Nhẫn?" : "Đã có tài khoản được duyệt?"}{" "}
                      <button
                        type="button"
                        onClick={() => switchMode(mode === "student-login" ? "student-register" : "student-login")}
                        className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                      >
                        {mode === "student-login" ? "Đăng ký ngay" : "Đăng nhập"}
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} Bản quyền thuộc về NhanLMS Pro.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
