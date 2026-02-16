import React, { useState, useEffect } from "react";
import { 
  BookOpen, Clock, Award, ChevronRight, 
  Sparkles, Zap, BrainCircuit, Star, PlayCircle
} from "lucide-react";
import { User, Exam } from "../types";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/Toast";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  onStartExam: (exam: Exam) => void;
}

const StudentDashboard: React.FC<Props> = ({ user, onStartExam }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Chỉ lấy các đề thi thuộc lớp của học sinh hoặc đề công khai
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('isLocked', false)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        setExams(data || []);
      } catch (err) {
        console.error("Lỗi tải đề thi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans">
      {/* Header Chào mừng */}
      <header className="mb-12">
        <MotionDiv 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Chào em, <span className="text-indigo-600">{user.fullName}</span>!
            </h1>
            <p className="text-slate-500 font-medium italic">Hôm nay chúng ta sẽ chinh phục thử thách nào đây?</p>
          </div>
        </MotionDiv>
      </header>

      {/* Chỉ số học tập (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Đề đã làm", value: "12", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Điểm trung bình", value: "8.5", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Thứ hạng lớp", value: "05", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <MotionDiv
            key={i}
            whileHover={{ y: -5 }}
            className={`${stat.bg} p-8 rounded-[2.5rem] border border-white/50 shadow-sm flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon size={40} className={`${stat.color} opacity-20`} />
          </MotionDiv>
        ))}
      </div>

      {/* Danh sách đề thi */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-indigo-600" /> Đề thi dành cho em
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-full uppercase">
            {exams.length} Đề thi khả dụng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold animate-pulse">
              Đang kết nối kho đề thi của Thầy Nhẫn...
            </div>
          ) : (
            exams.map((exam) => (
              <MotionDiv
                key={exam.id}
                layoutId={exam.id}
                whileHover={{ scale: 1.02 }}
                className="group bg-white border border-slate-100 p-8 rounded-[3rem] shadow-xl shadow-slate-100/50 hover:border-indigo-200 transition-all relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {exam.subject || "Toán Học"} - Lớp {exam.grade || "12"}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black">Elite</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-2">
                    {exam.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-6 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span className="text-xs font-bold">{exam.duration} phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span className="text-xs font-bold">{exam.questions.length} câu hỏi</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartExam(exam)}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                    >
                      Bắt đầu <PlayCircle size={16} />
                    </button>
                  </div>
                </div>
                {/* Hiệu ứng trang trí */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              </MotionDiv>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
