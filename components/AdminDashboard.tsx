import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  LogOut,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { SyncService } from "../services/syncService";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // ✅ CHECK ADMIN QUYỀN TRUY CẬP
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") {
      alert("Bạn không có quyền truy cập trang này");
      window.location.href = "/";
    }
  }, []);

  // ✅ LOAD GIÁO VIÊN CHỜ DUYỆT
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await SyncService.getPendingTeachers();
      setPendingTeachers(data);
    } catch (err) {
      alert("Không thể tải danh sách giáo viên");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ✅ DUYỆT / TỪ CHỐI
  const handleAction = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (
      status === "REJECTED" &&
      !confirm("Bạn chắc chắn muốn từ chối giáo viên này?")
    )
      return;

    setActionId(id);
    const success = await SyncService.updateTeacherStatus(id, status);

    if (success) {
      setPendingTeachers((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Có lỗi xảy ra khi cập nhật");
    }
    setActionId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">
              Hệ thống Quản trị
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              ADMIN PANEL
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600 rounded-xl text-xs font-black transition-all"
        >
          <LogOut size={16} /> THOÁT
        </button>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto w-full p-8 flex-1">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase">
              Duyệt giáo viên
            </h1>
            <p className="text-slate-500 font-medium italic">
              Giáo viên chỉ được sử dụng hệ thống sau khi admin duyệt
            </p>
          </div>

          <button
            onClick={fetchTeachers}
            className="p-3 bg-white border rounded-2xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">
                  Giáo viên
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">
                  Trường
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">
                  Ngày đăng ký
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pendingTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400">
                    Không có giáo viên chờ duyệt
                  </td>
                </tr>
              ) : (
                pendingTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-8 py-6">
                      <p className="font-black">{t.fullName}</p>
                      <p className="text-xs text-slate-400">
                        {t.email}
                      </p>
                    </td>

                    <td className="px-8 py-6 text-sm text-slate-600">
                      {t.school || "—"}
                    </td>

                    <td className="px-8 py-6 text-xs text-slate-400">
                      {t.createdAt?.seconds
                        ? new Date(
                            t.createdAt.seconds * 1000
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          disabled={actionId === t.id}
                          onClick={() =>
                            handleAction(t.id, "APPROVED")
                          }
                          className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <UserCheck size={16} /> Duyệt
                        </button>

                        <button
                          disabled={actionId === t.id}
                          onClick={() =>
                            handleAction(t.id, "REJECTED")
                          }
                          className="px-5 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                          <UserX size={16} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-8 text-center border-t flex flex-col items-center gap-2">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Firebase + Vercel Secure LMS
        </p>
        <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-bold">
          <CheckCircle size={12} /> KẾT NỐI ỔN ĐỊNH
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
