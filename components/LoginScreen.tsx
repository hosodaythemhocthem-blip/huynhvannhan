import { useState } from "react"

export default function LoginScreen() {
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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

            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition">
              {role === "teacher" ? "Đăng nhập giáo viên" : "Đăng nhập học sinh"}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500">
            Chưa có tài khoản?{" "}
            <span className="text-primary-600 font-medium cursor-pointer">
              Đăng ký
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
