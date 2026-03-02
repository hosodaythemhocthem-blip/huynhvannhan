import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Sparkles, BookOpen, Clock, 
  Trophy, Zap, Filter, Layers, GraduationCap
} from "lucide-react";
import { supabase } from "../supabase";
import ExamCard from "./ExamCard";
import ExamEditor from "./ExamEditor"; 
import ImportExamFromFile from "./ImportExamFromFile"; 
import StudentQuiz from "./StudentQuiz"; 
import { useToast } from "./Toast";
import { User, Exam } from "../types";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  user: User;
}

const ExamDashboard: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // --- STATE GIAO DIỆN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [studentTab, setStudentTab] = useState<'assigned' | 'practice'>('assigned');
  
  // --- STATE MODAL / CHỨC NĂNG ---
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null); // Cho giáo viên
  
  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // --- 1. KHỞI TẠO & REALTIME ---
  useEffect(() => {
    // 🔥 QUAN TRỌNG: Xóa trạng thái kẹt bài thi cũ để fix lỗi màn hình trắng
    localStorage.removeItem('current_exam'); 
    localStorage.removeItem('exam_progress');
    
    fetchData();
    
    // Đăng ký nhận sự kiện thay đổi từ DB (Realtime)
    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => fetchExams(false))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchExams(true), isTeacher && fetchClasses()]);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*');
    if (data) setClasses(data);
  };

  const fetchExams = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Lấy tất cả đề thi về, sau đó lọc ở Client để giao diện mượt mà hơn
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error(err);
      showToast("Không tải được dữ liệu đề thi", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- 2. LOGIC LỌC DỮ LIỆU THÔNG MINH (MEMOIZED) ---
  const filteredExams = useMemo(() => {
    let result = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));

    if (!isTeacher) {
      if (studentTab === 'assigned') {
        // Tab 1: Bài tập lớp (Có class_id khớp với user HOẶC bài được giao cụ thể)
        // Dựa trên ảnh DB của bạn, dòng 2 có class_id -> Sẽ hiện ở đây nếu user thuộc lớp đó
        return result.filter(e => e.class_id && e.class_id === user.class_id);
      } else {
        // Tab 2: Luyện tự do (class_id là NULL - Public)
        // Dựa trên ảnh DB của bạn, dòng 1 và 3 có class_id là NULL -> Sẽ hiện ở đây
        return result.filter(e => !e.class_id);
      }
    }
    return result; // Giáo viên thấy tất cả
  }, [exams, searchTerm, studentTab, isTeacher, user.class_id]);

  // Thống kê nhanh cho Header
  const stats = useMemo(() => ({
    total: exams.length,
    assigned: exams.filter(e => e.class_id === user.class_id).length,
    practice: exams.filter(e => !e.class_id).length
  }), [exams, user.class_id]);

  // --- 3. XỬ LÝ SỰ KIỆN ---
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) showToast("Đã xóa đề thi!", "success");
    else showToast("Xóa thất bại!", "error");
  };

  // --- RENDER ---
  if (isEditorOpen) return <ExamEditor user={user} classId="" exam={editingExam} aiGeneratedData={parsedExamData} onClose={() => { setIsEditorOpen(false); setParsedExamData(null); }} />;
  
  // Khi đang làm bài -> Render StudentQuiz
  if (takingExam) return <StudentQuiz exam={takingExam} user={user} onClose={() => setTakingExam(null)} />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {isTeacher ? <Layers className="text-indigo-600"/> : <GraduationCap className="text-indigo-600"/>}
                {isTeacher ? "Quản Trị Đề Thi" : "Góc Học Tập"}
              </h1>
              <p className="text-slate-500 font-medium mt-1 ml-1">
                {isTeacher 
                  ? `Hệ thống đang lưu trữ ${exams.length} đề thi.` 
                  : `Chào ${user.email?.split('@')[0]}, hôm nay bạn muốn ôn tập gì?`}
              </p>
            </div>

            {/* NÚT CHỨC NĂNG CHO GIÁO VIÊN */}
            {isTeacher && (
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setIsImportModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 font-bold rounded-xl hover:bg-violet-100 transition-all border border-violet-100">
                  <Sparkles size={18}/> <span className="hidden sm:inline">AI Import</span>
                </button>
                <button onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 transition-all">
                  <Zap size={18} fill="currentColor"/> Tạo Đề Mới
                </button>
              </div>
            )}
          </div>

          {/* TAB CHUYỂN ĐỔI CHO HỌC SINH */}
          {!isTeacher && (
            <div className="flex gap-8 mt-6 border-b border-slate-100">
              <button 
                onClick={() => setStudentTab('assigned')}
                className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all relative ${studentTab === 'assigned' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Clock size={18}/> Bài Tập Được Giao
                {stats.assigned > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{stats.assigned}</span>}
                {studentTab === 'assigned' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"/>}
              </button>
              <button 
                onClick={() => setStudentTab('practice')}
                className={`pb-3 font-bold text-sm flex items-center gap-2 transition-all relative ${studentTab === 'practice' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BookOpen size={18}/> Luyện Tập Tự Do
                {stats.practice > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{stats.practice}</span>}
                {studentTab === 'practice' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"/>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* THANH TÌM KIẾM */}
        <div className="mb-8 relative max-w-lg mx-auto md:mx-0">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>

        {/* DANH SÁCH BÀI THI */}
        {loading ? (
          // SKELETON LOADING (Hiệu ứng khung xương)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-72 animate-pulse flex flex-col">
                <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4"/>
                <div className="h-6 bg-slate-100 w-3/4 rounded mb-2"/>
                <div className="h-4 bg-slate-100 w-1/2 rounded mb-6"/>
                <div className="mt-auto h-10 bg-slate-100 rounded-xl w-full"/>
              </div>
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredExams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ExamCard 
                    exam={exam} 
                    role={user.role}
                    questionCount={Array.isArray(exam.questions) ? exam.questions.length : 0}
                    onView={() => setTakingExam(exam)}
                    onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }}
                    onDelete={() => handleDelete(exam.id)}
                    onToggleLock={async () => {}} 
                    onAssign={(e) => setAssigningExam(e)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* EMPTY STATE - KHI KHÔNG CÓ DỮ LIỆU */}
            {filteredExams.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center text-center">
                <div className="w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <Filter size={64} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi nào</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  {searchTerm ? `Không có kết quả cho "${searchTerm}"` : (
                    !isTeacher && studentTab === 'assigned' ? "Tuyệt vời! Bạn đã hoàn thành hết bài tập về nhà." : "Chưa có đề thi nào trong mục này."
                  )}
                </p>
                {isTeacher && (
                   <button onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                     Tạo Bài Thi Mới Ngay
                   </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <ImportExamFromFile isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={(data) => { setIsImportModalOpen(false); setParsedExamData(data); setIsEditorOpen(true); }} />
    </div>
  );
};

export default ExamDashboard;
