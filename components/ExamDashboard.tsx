import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Sparkles, BookOpen, Clock, 
  Trophy, Zap, Filter, Layers, GraduationCap, AlertTriangle, X
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
  
  // --- STATE ---
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [studentTab, setStudentTab] = useState<'assigned' | 'practice'>('assigned');
  
  // Modal State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  
  // State cho Modal Giao Bài
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [assignClassId, setAssignClassId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // --- 1. KHỞI TẠO ---
  useEffect(() => {
    // Xóa ngay các trạng thái thi cũ để tránh kẹt
    localStorage.removeItem('current_exam');
    localStorage.removeItem('exam_progress');
    
    console.log("🚀 Dashboard mounting... User:", user);
    fetchData();

    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, (payload) => {
        console.log("⚡ Realtime update:", payload);
        fetchExams(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    await fetchExams(true);
    setLoading(false);
  };

  const fetchExams = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      console.log("📡 Fetching exams from Supabase...");
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("✅ Data received:", data); 
      setExams(data || []);
      
    } catch (err: any) {
      console.error("❌ Error fetching exams:", err);
      setErrorMsg(err.message || "Lỗi kết nối Supabase");
      showToast("Lỗi tải dữ liệu: " + err.message, "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- 2. LOGIC LỌC AN TOÀN ---
  const filteredExams = useMemo(() => {
    if (!exams) return [];
    
    let result = exams.filter(e => {
        const title = e.title || ""; 
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (!isTeacher) {
      if (studentTab === 'assigned') {
        return result.filter(e => e.class_id && e.class_id === user.class_id);
      } else {
        return result.filter(e => !e.class_id);
      }
    }
    return result; 
  }, [exams, searchTerm, studentTab, isTeacher, user.class_id]);

  // --- 3. HÀNH ĐỘNG ---
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này không? Dữ liệu sẽ không thể khôi phục.")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) {
      showToast("Đã xóa đề thi!", "success");
      setExams(exams.filter(e => e.id !== id));
    } else {
      showToast("Lỗi khi xóa: " + error.message, "error");
    }
  };

  // 🚀 THÊM MỚI: Khóa/Mở khóa đề thi
  const handleToggleLock = async (exam: Exam) => {
    try {
      const newStatus = !exam.is_locked;
      const { error } = await supabase.from('exams').update({ is_locked: newStatus }).eq('id', exam.id);
      if (error) throw error;
      
      showToast(newStatus ? "🔒 Đã khóa đề thi!" : "🔓 Đã mở khóa đề thi!", "success");
      // Cập nhật lại state local ngay lập tức để UI đổi màu
      setExams(exams.map(e => e.id === exam.id ? { ...e, is_locked: newStatus } : e));
    } catch (err: any) {
      showToast("Lỗi cập nhật trạng thái: " + err.message, "error");
    }
  };

  // 🚀 THÊM MỚI: Lưu thông tin Giao bài
  const submitAssignExam = async () => {
    if (!assigningExam) return;
    setIsAssigning(true);
    try {
      // Nếu bỏ trống classId -> Đề trở thành Luyện tập tự do (Public)
      const targetClassId = assignClassId.trim() === "" ? null : assignClassId.trim();
      
      const { error } = await supabase
        .from('exams')
        .update({ class_id: targetClassId })
        .eq('id', assigningExam.id);
        
      if (error) throw error;
      
      showToast(targetClassId ? `Đã giao bài cho lớp ${targetClassId}!` : "Đã chuyển thành đề Luyện tập tự do!", "success");
      setAssigningExam(null);
      setAssignClassId("");
      fetchExams(false);
    } catch (err: any) {
      showToast("Lỗi giao bài: " + err.message, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // --- RENDER ---
  if (isEditorOpen) return <ExamEditor user={user} classId={user.class_id || ""} exam={editingExam} aiGeneratedData={parsedExamData} onClose={() => { setIsEditorOpen(false); setParsedExamData(null); }} />;
  if (takingExam) return <StudentQuiz exam={takingExam} user={user} onClose={() => setTakingExam(null)} />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {isTeacher ? <Layers className="text-indigo-600"/> : <GraduationCap className="text-indigo-600"/>}
                {isTeacher ? "Quản Lý Đề Thi" : "Góc Học Tập"}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                 {loading ? "Đang đồng bộ dữ liệu..." : `Hệ thống có ${exams.length} đề thi.`}
              </p>
            </div>

            {isTeacher && (
              <div className="flex gap-3">
                <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 font-bold rounded-xl hover:bg-violet-100 transition-all border border-violet-100">
                  <Sparkles size={18}/> AI Import
                </button>
                <button onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 transition-all">
                  <Zap size={18} fill="currentColor"/> Tạo Đề Mới
                </button>
              </div>
            )}
          </div>

          {!isTeacher && (
            <div className="flex gap-8 mt-6 border-b border-slate-100">
              <button onClick={() => setStudentTab('assigned')} className={`pb-3 font-bold text-sm flex items-center gap-2 relative ${studentTab === 'assigned' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Clock size={18}/> Bài Được Giao
                {studentTab === 'assigned' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"/>}
              </button>
              <button onClick={() => setStudentTab('practice')} className={`pb-3 font-bold text-sm flex items-center gap-2 relative ${studentTab === 'practice' ? 'text-emerald-600' : 'text-slate-400'}`}>
                <BookOpen size={18}/> Luyện Tự Do
                {studentTab === 'practice' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"/>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* THANH TÌM KIẾM */}
        <div className="mb-8 relative max-w-lg mx-auto md:mx-0">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Tìm kiếm tên đề thi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm"
          />
        </div>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
            <AlertTriangle size={24}/>
            <div>
              <p className="font-bold">Đã xảy ra lỗi kết nối!</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* LOADING & DATA GRID */}
        {loading ? (
          <div className="text-center py-20">
             <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"/>
             <p className="text-slate-500 font-medium">Đang tải dữ liệu từ Supabase...</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredExams.map((exam) => {
                const safeQuestionCount = Array.isArray(exam.questions) ? exam.questions.length : 0;
                
                return (
                  <motion.div 
                    key={exam.id} layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <ExamCard 
                      exam={exam} 
                      role={user.role}
                      questionCount={safeQuestionCount}
                      onView={() => setTakingExam(exam)}
                      onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }}
                      onDelete={() => handleDelete(exam.id!)}
                      onToggleLock={() => handleToggleLock(exam)} 
                      onAssign={(e) => { setAssigningExam(e); setAssignClassId(e.class_id || ""); }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {!loading && filteredExams.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <div className="text-6xl mb-4 opacity-20">📭</div>
                <p className="font-bold text-lg">Không tìm thấy đề thi nào.</p>
                {isTeacher && <p className="text-sm mt-2">Hãy thử nhấn nút "Tạo Đề Mới" để bắt đầu nhé!</p>}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <ImportExamFromFile isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={(data) => { setIsImportModalOpen(false); setParsedExamData(data); setIsEditorOpen(true); }} />

      {/* 🚀 MODAL GIAO BÀI (Chỉ hiện khi bấm nút Giao bài trên Card) */}
      <AnimatePresence>
        {assigningExam && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="bg-indigo-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-black text-lg flex items-center gap-2"><Trophy size={20}/> Giao Bài Tập</h3>
                <button onClick={() => setAssigningExam(null)} className="hover:bg-indigo-500 p-1.5 rounded-lg transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên đề thi</label>
                  <p className="text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">{assigningExam.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mã Lớp (Class ID)</label>
                  <input 
                    type="text" 
                    value={assignClassId}
                    onChange={(e) => setAssignClassId(e.target.value)}
                    placeholder="VD: LOP-12A1"
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-medium text-slate-900 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    * Mẹo: Nếu để trống ô này, đề thi sẽ được đưa vào mục <b>"Luyện tập tự do"</b> (tất cả học sinh đều thấy).
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setAssigningExam(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Hủy
                  </button>
                  <button 
                    onClick={submitAssignExam} disabled={isAssigning}
                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center"
                  >
                    {isAssigning ? "Đang xử lý..." : "Xác nhận Giao"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ExamDashboard;
