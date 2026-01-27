import {
  BookOpen,
  FileText,
  Users,
  PlusCircle,
} from "lucide-react";

interface DashboardProps {
  userRole?: "ADMIN" | "TEACHER" | "STUDENT";
  userName?: string;
  onNavigate?: (page: string) => void;
}

export default function Dashboard({
  userRole = "TEACHER",
  userName = "Huỳnh Văn Nhẫn",
  onNavigate,
}: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* ===== HERO ===== */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-800">
          Xin chào, {userName} 👋
        </h1>
        <p className="text-slate-500 mt-2">
          Chào mừng bạn quay lại hệ thống LMS Toán học
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate?.("exams")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            <PlusCircle size={18} />
            Tạo đề thi
          </button>

          <button
            onClick={() => onNavigate?.("classes")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
          >
            <Users size={18} />
            Quản lý lớp
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={BookOpen}
          title="Khóa học"
          value="12"
          note="Đang hoạt động"
        />
        <StatCard
          icon={FileText}
          title="Đề thi"
          value="38"
          note="Đã tạo"
        />
        <StatCard
          icon={Users}
          title="Học sinh"
          value="420"
          note="Đang tham gia"
        />
      </div>

      {/* ===== EMPTY / NEXT ===== */}
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <p className="text-slate-600 font-medium">
          Chưa có hoạt động gần đây
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Hãy tạo đề hoặc vào lớp để bắt đầu
        </p>
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

function StatCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: any;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Icon size={22} />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-800">
            {value}
          </div>
          <div className="text-sm font-medium text-slate-600">
            {title}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {note}
      </div>
    </div>
  );
}
