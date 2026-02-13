import React, { useMemo } from "react";
import { ApprovalStatus, AppUser } from "../types";

interface Props {
  user: AppUser | null;
  onCreateExam?: () => void;
}

const TeacherPortal: React.FC<Props> = ({ user, onCreateExam }) => {

  const status = useMemo<ApprovalStatus>(() => {
    if (!user) return ApprovalStatus.PENDING;
    return user.approval_status ?? ApprovalStatus.PENDING;
  }, [user]);

  const isApproved = status === ApprovalStatus.APPROVED;
  const isRejected = status === ApprovalStatus.REJECTED;

  if (!user) return null;

  if (isRejected) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white rounded-[2.5rem] p-12 shadow-2xl border border-rose-50 text-center animate-fadeIn">
        <h2 className="text-2xl font-black text-rose-600 mb-4 uppercase tracking-tight">
          Truy cập bị từ chối
        </h2>
        <p className="text-slate-500 leading-relaxed">
          Tài khoản giáo viên đã bị từ chối bởi Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      {isApproved ? (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-indigo-50 flex flex-col md:flex-row justify-between items-center gap-6">

            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                Chào {user.full_name || user.email}
              </h2>

              <p className="text-slate-500 text-sm font-medium">
                Thầy/cô có thể bắt đầu tạo và quản lý đề thi.
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateExam}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:scale-105 transition-all text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl"
            >
              + TẠO ĐỀ THI MỚI
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[48px] p-12 shadow-2xl border border-slate-50 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase">
            Chờ Admin phê duyệt
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Tài khoản đang chờ duyệt.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
