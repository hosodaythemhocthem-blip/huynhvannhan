import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Star,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
  Search
} from "lucide-react";
import { Exam, User } from "../types";
import { supabase } from "../supabase";
import MathPreview from "../components/MathPreview";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/Toast";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  activeTab?: string;
  onStartExam?: (exam: Exam) => void;
}

const StudentDashboard: React.FC<Props> = ({ user, onStartExam }) => {
  const { showToast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "completed" | "lab">("available");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: ex, error: exError } = await supabase
          .from("exams")
          .select("*");

        if (exError) throw exError;

        const { data: sub, error: subError } = await supabase
          .from("submissions")
          .select("*")
          .eq("student_id", user.id);

        if (subError) throw subError;

        setExams(ex || []);
        setSubmissions(sub || []);
      } catch (error) {
        console.error(error);
        showToast("Lỗi đồng bộ dữ liệu Cloud.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [user.id, showToast]);

  const stats = useMemo(() => {
    const done = submissions.length;

    const avg =
      done > 0
        ? (
            submissions.reduce(
              (a: number, b: any) => a + (b.score || 0),
              0
            ) / done
          ).toFixed(1)
        : "0.0";

    return {
      done,
      avg,
      pending: Math.max(0, exams.length - done),
    };
  }, [exams, submissions]);

  const filtered = useMemo(() => {
    const list = exams.filter((e) =>
      e.title?.toLowerCase().includes(search.toLowerCase())
    );

    if (tab === "available")
      return list.filter(
        (e) => !submissions.find((s) => s.exam_id === e.id)
      );

    if (tab === "completed")
      return list.filter((e) =>
        submissions.find((s) => s.exam_id === e.id)
      );

    return [];
  }, [exams, submissions, tab, search]);

  return (
    <div className="space-y-12 pb-20">

      {/* HERO */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 text-white shadow-2xl"
      >
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold">
            <Zap size={14} />
            NhanLMS v6
          </div>

          <h1 className="text-5xl font-black">
            Chào {user.fullName?.split(" ").pop()} 👋
          </h1>

          <p className="text-lg">
            Bạn có <b>{stats.pending}</b> bài tập mới.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setTab("available")}
              className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold"
            >
              Làm bài
            </button>

            <button
              onClick={() => setTab("lab")}
              className="px-6 py-3 bg-white/20 rounded-xl font-bold"
            >
              AI Lab
            </button>
          </div>
        </div>
      </MotionDiv>

      {/* STATS */}
      <section className="grid md:grid-cols-3 gap-6">
        <StatCard label="Hoàn thành" value={stats.done} icon={<CheckCircle2 />} />
        <StatCard label="Điểm TB" value={stats.avg} icon={<Star />} />
        <StatCard label="Chưa làm" value={stats.pending} icon={<Clock />} />
      </section>

      {/* FILTER */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <TabBtn active={tab === "available"} onClick={() => setTab("available")} label="Đề mới" />
          <TabBtn active={tab === "completed"} onClick={() => setTab("completed")} label="Đã làm" />
          <TabBtn active={tab === "lab"} onClick={() => setTab("lab")} label="AI Lab" />
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="pl-8 pr-4 py-2 border rounded-lg"
            placeholder="Tìm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        {tab === "lab" ? (
          <MotionDiv
            key="lab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-10 rounded-3xl text-center shadow"
          >
            <Sparkles size={40} className="mx-auto mb-4 text-indigo-600" />
            <h3 className="text-xl font-bold">AI Study Lab</h3>
            <p>Dùng AI Assistant để hỏi bài toán nâng cao.</p>
          </MotionDiv>
        ) : (
          <MotionDiv
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div>Đang tải...</div>
            ) : filtered.length > 0 ? (
              filtered.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  sub={submissions.find((s) => s.exam_id === exam.id)}
                  onStart={onStartExam}
                />
              ))
            ) : (
              <div>Không có đề</div>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow flex gap-4 items-center">
    {icon}
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const TabBtn = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-bold ${
      active ? "bg-indigo-600 text-white" : "bg-gray-100"
    }`}
  >
    {label}
  </button>
);

const ExamCard = ({ exam, sub, onStart }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-between">
    <div>
      <FileText size={20} />
      <h4 className="font-bold mt-2">
        <MathPreview content={exam.title} />
      </h4>
    </div>

    <div className="mt-4 flex justify-between items-center">
      <span className="text-sm text-gray-400">
        {exam.duration || 30} phút
      </span>

      <button
        onClick={() => !sub && onStart?.(exam)}
        className={`px-4 py-2 rounded-lg text-sm font-bold ${
          sub ? "bg-gray-200" : "bg-indigo-600 text-white"
        }`}
      >
        {sub ? "Xem lại" : "Bắt đầu"}
      </button>
    </div>
  </div>
);

export default StudentDashboard;
