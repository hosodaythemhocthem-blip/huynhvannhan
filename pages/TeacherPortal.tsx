import React, { useMemo } from "react";
import { ApprovalStatus, UserRole } from "../types";

/**
 * TeacherPortal
 * - GIỮ NGUYÊN 100% UI
 * - An toàn với user null / thiếu field
 * - Tương thích auth.service mới
 */

interface TeacherUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: ApprovalStatus;
  name?: string;
}

interface Props {
  user: TeacherUser | null;
  onCreateExam?: () => void;
}

const TeacherPortal: React.FC<Props> = ({ user, onCreateExam }) => {
  /* =========================
     SAFE STATUS
  ========================= */
  const status = useMemo<ApprovalStatus>(() => {
    if (!user) return ApprovalStatus.PENDING;
    return user.status ?? ApprovalStatus.PENDING;
  }, [user]);

  const isApproved = status === ApprovalStatus.APPROVED;
  const isRejected = status === ApprovalStatus.REJECTED;

  /* =========================
     REJECTED
  ========================= */
  if (isRejected) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white rounded-[2.5rem] p-12 shadow-2xl border border-rose-50 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase italic tracking-tight">
          Truy cập bị từ chối
        </h2>

        <p className="text-slate-500 mb-8 leading-relaxed font-medium">
          Tài khoản giáo viên của thầy/cô đã bị từ chối bởi Admin.
          Nếu có thắc mắc, vui lòng liên hệ quản trị hệ thống.
        </p>
      </div>
    );
  }

  /* =========================
     MAIN UI
  ========================= */
  return (
    <div className="w-full animate-in fade-in duration-500">
      {isApproved ? (
        /* =========================
           APPROVED
        ========================= */
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-indigo-50 flex flex-col md:flex-row justify-between items-center gap-6 group overflow-hidden relative">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-50/50 rounded-full group-hover:scale-110 transition-transform duration-700" />

            <div className="text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-100 shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                TÀI KHOẢN ĐÃ ĐƯỢC DUYỆT
              </div>

              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight italic">
                Chào {user?.name || user?.email || "Giáo viên"}
              </h2>

              <p className="text-slate-500 text-sm font-medium">
                Thầy/cô có thể bắt đầu biên soạn, quản lý và lưu trữ đề thi Toán học
                ngay bây giờ.
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateExam}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all transform hover:scale-105 active:scale-95 relative z-10"
            >
              + TẠO ĐỀ THI MỚI
            </button>
          </div>
        </div>
      ) : (
        /* =========================
           PENDING
        ========================= */
        <div className="bg-white rounded-[48px] p-12 md:p-16 shadow-2xl border border-slate-50 text-center max-w-2xl mx-auto relative overflow-hidden animate-in zoom-in-95">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-400" />

          <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase italic">
            Chờ Admin phê duyệt
          </h2>

          <p className="text-slate-500 mb-8 text-lg leading-relaxed font-medium">
            Tài khoản giáo viên đã được đăng ký thành công và đang chờ Admin kiểm
            duyệt. Toàn bộ dữ liệu sẽ được bảo toàn tuyệt đối.
          </p>

          <div className="inline-flex items-center gap-3 px-8 py-4 bg-amber-50 rounded-full text-amber-700 font-black uppercase tracking-widest text-[10px] border border-amber-100 shadow-sm">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            Trạng thái: Chờ xác minh
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
