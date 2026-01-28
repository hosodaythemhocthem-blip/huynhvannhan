import React, { useState } from "react";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { UserRole, AccountStatus } from "../types";
import { SyncService } from "../services/syncService";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

/* =========================
   CONFIG
========================= */
const ADMIN_ACCOUNT = {
  username: "huynhvannhan",
  password: "12345678", // demo
};

interface LoginScreenProps {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const [view, setView] = useState<
    | "selection"
    | "teacher_login"
    | "teacher_register"
    | "student_login"
    | "admin_login"
  >("selection");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => {
    setError("");
    setMessage("");
    setLoading(false);
  };

  /* =========================
     TEACHER REGISTER
  ========================= */
  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      if (!username || !password || !fullName || !schoolName) {
        throw new Error("Vui lòng nhập đầy đủ thông tin");
      }

      const clean = username.trim().toLowerCase();
      const account = {
        username: clean,
        password: password.trim(),
        name: fullName.trim(),
        school: schoolName.trim(),
        status: "PENDING" as AccountStatus,
        role: UserRole.TEACHER,
        createdAt: new Date().toISOString(),
      };

      await SyncService.saveAccount("teachers", account);
      setMessage("Đăng ký thành công – chờ Admin phê duyệt");
      setTimeout(() => {
        setView("teacher_login");
        setPassword("");
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* =========================
     TEACHER LOGIN
  ========================= */
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const ref = doc(db, "teachers", username.trim().toLowerCase());
      const snap = await getDoc(ref);

      if (!snap.exists()) throw new Error("Tài khoản không tồn tại");
      const user = snap.data();

      if (user.password !== password.trim())
        throw new Error("Mật khẩu không đúng");
      if (user.status !== "APPROVED")
        throw new Error("Tài khoản chưa được phê duyệt");

      onSelectRole(UserRole.TEACHER, user);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* =========================
     ADMIN LOGIN
  ========================= */
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (
        username === ADMIN_ACCOUNT.username &&
        password === ADMIN_ACCOUNT.password
      ) {
        onSelectRole(UserRole.ADMIN);
      } else {
        setError("Sai thông tin Admin");
        setLoading(false);
      }
    }, 400);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
      {/* ===== CHỌN VAI TRÒ ===== */}
      {view === "selection" && (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
              Toán Học Cloud
            </h1>
            <p className="mt-2 text-slate-500 tracking-widest uppercase text-sm">
              Hệ thống Huỳnh Văn Nhẫn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div
              onClick={() => {
                setView("teacher_login");
                reset();
              }}
              className="cursor-pointer rounded-xl p-8 bg-slate-50 hover:bg-white shadow hover:shadow-xl transition"
            >
              <Briefcase className="text-blue-600 mb-4" size={40} />
              <h2 className="text-xl font-bold mb-1">Giáo viên</h2>
              <p className="text-sm text-slate-500">
                Quản lý lớp học, đề thi, chấm điểm
              </p>
            </div>

            <div
              onClick={() => {
                setView("student_login");
                reset();
              }}
              className="cursor-pointer rounded-xl p-8 bg-slate-50 hover:bg-white shadow hover:shadow-xl transition"
            >
              <GraduationCap className="text-orange-500 mb-4" size={40} />
              <h2 className="text-xl font-bold mb-1">Học sinh</h2>
              <p className="text-sm text-slate-500">
                Làm bài, xem kết quả, theo dõi tiến độ
              </p>
            </div>
          </div>

          <div
            onClick={() => {
              setView("admin_login");
              reset();
            }}
            className="mt-10 mx-auto w-fit flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800"
          >
            <ShieldCheck size={18} />
            <span className="text-xs font-bold tracking-widest">ADMIN</span>
          </div>
        </div>
      )}

      {/* ===== FORM ===== */}
      {view !== "selection" && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
          <button
            onClick={() => setView("selection")}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X />
          </button>

          {error && (
            <div className="mb-4 flex gap-2 items-center bg-red-50 text-red-600 p-3 rounded text-sm">
              <Info size={16} /> {error}
            </div>
          )}

          {message && (
            <div className="mb-4 flex gap-2 items-center bg-emerald-50 text-emerald-600 p-3 rounded text-sm">
              <CheckCircle2 size={16} /> {message}
            </div>
          )}

          <form
            onSubmit={
              view === "teacher_register"
                ? handleTeacherRegister
                : view === "admin_login"
                ? handleAdminLogin
                : handleTeacherLogin
            }
            className="space-y-4"
          >
            <input
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {view === "teacher_register" && (
              <>
                <input
                  className="w-full p-3 rounded-lg border border-slate-300"
                  placeholder="Họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <input
                  className="w-full p-3 rounded-lg border border-slate-300"
                  placeholder="Trường học"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </>
            )}

            <button
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "Vào hệ thống"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
