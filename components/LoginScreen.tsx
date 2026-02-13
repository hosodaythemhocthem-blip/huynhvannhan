import { useState } from "react"
import { supabase } from "../supabase"

export default function LoginScreen() {
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* =========================
     HANDLE LOGIN
  ========================= */
  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const user = data.user
      if (!user) throw new Error("Không tìm thấy user")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile) {
        throw new Error("Tài khoản chưa được thiết lập profile.")
      }

      if (profile.role !== role) {
        throw new Error("Sai vai trò đăng nhập.")
      }

      if (role === "student" && !profile.approved) {
        throw new Error("Tài khoản đang chờ giáo viên duyệt.")
      }

      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     HANDLE REGISTER (STUDENT)
  ========================= */
  const handleRegister = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!fullName) throw new Error("Vui lòng nhập họ tên.")

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error("Không tạo được user")

      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "student",
        approved: false,
      })

      alert("Đăng ký thành công! Chờ giáo viên duyệt.")
      setIsRegister(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="bg-white shadow-premium rounded-2xl p-8 space-y-6">

          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary-700">
              LMS Toán Học AI
            </h1>
            <p className="text-slate-500 text-sm">
              Hệ thống học tập thông minh
            </p>
          </div>

          {/* Role Switch */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                role === "student"
                  ? "bg-white shadow-soft text-primary-600"
                  : "text-slate-500"
              }`}
            >
              Học sinh
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                role === "teacher"
                  ? "bg-white shadow-soft text-primary-600"
                  : "text-slate-500"
              }`}
            >
              Giáo viên
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {isRegister && (
              <input
                type="text"
                placeholder="Họ và tên"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            {!isRegister ? (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {loading
                  ? "Đang xử lý..."
                  : role === "teacher"
                  ? "Đăng nhập giáo viên"
                  : "Đăng nhập học sinh"}
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đăng ký học sinh"}
              </button>
            )}
          </div>

          {/* Footer */}
          {role === "student" && (
            <p className="text-center text-sm text-slate-500">
              {!isRegister ? (
                <>
                  Chưa có tài khoản?{" "}
                  <span
                    className="text-primary-600 font-medium cursor-pointer"
                    onClick={() => setIsRegister(true)}
                  >
                    Đăng ký
                  </span>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <span
                    className="text-primary-600 font-medium cursor-pointer"
                    onClick={() => setIsRegister(false)}
                  >
                    Đăng nhập
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
