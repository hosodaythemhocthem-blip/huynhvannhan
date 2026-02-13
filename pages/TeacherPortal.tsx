import React, { useMemo } from "react";
import { ApprovalStatus } from "../types";
import { AppUser } from "../types";

/**
 * TeacherPortal
 * - Giữ nguyên UI
 * - Không crash nếu user null
 * - Tương thích AppUser từ authService
 */

interface Props {
  user: AppUser | null;
  onCreateExam?: () => void;
}

const TeacherPortal: React.FC<Props> = ({ user, onCreateExam }) => {
  /* =========================
     SAFE STATUS
  ========================= */

  const status = useMemo<ApprovalStatus>(() => {
    if (!user) return ApprovalStatus.PENDING;

    // Nếu authService dùng approved: boolean
    if (user.approved === true) return ApprovalStatus.APPROVED;
    if (user.approved === false) return ApprovalStatus.PENDING;

    return ApprovalStatus.PENDING;
  }, [user]);

  const isApproved = status === ApprovalStatus.APPROVED;
  const isRejected = status === ApprovalStatus.REJECTED;

  /* =========================
     SAFETY CHECK
  ========================= */

  if (!user) {
    return null;
  }

  /* =========================
     REJECTED
  ========================= */
  if (isRejected) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white rounded-[2.5rem] p-12 shadow-2xl border border-rose-50 text-center">
        <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase italic tracking-tight">
          Truy cập bị từ chối
        </h2>

        <p className="text-slate-500 mb-8 leading-relaxed font-medium">
          Tài khoản giáo viên đã bị từ chối bởi Admin.
        </p>
      </div>
    );
  }

  /* =========================
     MAIN UI
  ========================= */
  return (
    <div className="w-full">
      {isApproved ? (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-indigo-50 flex flex-col md:flex-row justify-between items-center gap-6 relative">

            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight italic">
                Chào {user.full_name || user.email || "Giáo viên"}
              </h2>

              <p className="text-slate-500 text-sm font-medium">
                Thầy/cô có thể bắt đầu tạo và quản lý đề thi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCreateExam?.()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl transition-all"
            >
              + TẠO ĐỀ THI MỚI
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[48px] p-12 shadow-2xl border border-slate-50 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase italic">
            Chờ Admin phê duyệt
          </h2>

          <p className="text-slate-500 mb-8 text-lg leading-relaxed font-medium">
            Tài khoản đang chờ duyệt.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
