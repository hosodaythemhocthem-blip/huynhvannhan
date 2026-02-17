import React, { useState, useEffect } from "react"
import {
  GraduationCap,
  UserPlus,
  Loader2,
} from "lucide-react"
import { User } from "../types"
import { authService } from "../services/authService"
import { supabase } from "../supabase"
import { useToast } from "../components/Toast"
import { motion, AnimatePresence } from "framer-motion"

const MotionDiv = motion.div as any

interface Props {
  onLogin: (user: User) => void
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const { showToast } = useToast()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("")
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  /* ================= LOAD CLASSES ================= */
  useEffect(() => {
    const loadClasses = async () => {
      const { data } = await supabase.from("classes").select()
      setClasses(data || [])
    }
    loadClasses()

    // đảm bảo teacher mặc định tồn tại
    authService.ensureDefaultTeacher()
  }, [])

  /* ================= HANDLE AUTH ================= */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const user = await authService.signIn(
          email.trim(),
          password
        )

        if (!user) throw new Error("Sai email hoặc mật khẩu.")

        if (user.role === "student" && user.status !== "approved") {
          throw new Error(
            "Tài khoản đang chờ giáo viên duyệt."
          )
        }

        showToast(
          `Chào mừng ${user.full_name}!`,
          "success"
        )

        onLogin(user)
      } else {
        if (!fullName.trim())
          throw new Error("Vui lòng nhập họ tên.")

        if (!selectedClassId)
          throw new Error("Vui lòng chọn lớp.")

        const success = await authService.signUpStudent(
          email.trim(),
          password,
          fullName.trim()
        )

        if (!success)
          throw new Error("Đăng ký thất bại.")

        showToast(
          "Đăng ký thành công! Chờ giáo viên duyệt.",
          "success"
        )

        setIsLogin(true)
        setFullName("")
        setSelectedClassId("")
      }
    } catch (err: any) {
      showToast(err.message || "Có lỗi xảy ra.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={isLogin ? "login" : "register"}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
              {isLogin ? (
                <GraduationCap size={40} className="text-indigo-600" />
              ) : (
                <UserPlus size={40} className="text-indigo-600" />
              )}
            </div>

            <h1 className="text-3xl font-black text-white">
              NhanLMS Elite
            </h1>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                />

                <select
                  required
                  value={selectedClassId}
                  onChange={(e) =>
                    setSelectedClassId(e.target.value)
                  }
                  className="w-full px-5 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
            />

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
            />

            <button
              disabled={loading}
              className="w-full bg-indigo-600 py-3 rounded-xl font-bold text-white flex justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isLogin ? (
                "ĐĂNG NHẬP"
              ) : (
                "ĐĂNG KÝ"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-400"
            >
              {isLogin
                ? "Học sinh mới? Đăng ký"
                : "Đã có tài khoản? Đăng nhập"}
            </button>
          </div>
        </MotionDiv>
      </AnimatePresence>
    </div>
  )
}

export default LoginScreen
