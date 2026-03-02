import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Sparkles, BookOpen, Lock, Unlock, 
  Users, CalendarDays, X, CheckCircle2, Clock, AlertCircle, LayoutGrid, List
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
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [studentTab, setStudentTab] = useState<'assigned' | 'practice'>('assigned'); // Tab cho học sinh
  
  // Modal State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  
  // Assign Modal State
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>(""); 
  const [assignClassTarget, setAssignClassTarget] = useState(""); 
  const [deadline, setDeadline] = useState("");

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // --- 1. REALTIME & INITIAL FETCH ---
  useEffect(() => {
    fetchData();

    // Đăng ký nhận sự kiện thay đổi từ DB (Realtime)
    const channel = supabase
      .channel('exams_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, (payload) => {
        // Khi có thay đổi (thêm/sửa/xóa), tải lại danh sách nhẹ nhàng
        fetchExams(false); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchExams(true), isTeacher && fetchClasses()]);
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const { data } = await supabase.from('classes').select('*');
      if (data) {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
          setAssignClassTarget(data[0].id);
        }
      }
    } catch (error) { console.error("Lỗi tải lớp", error); }
  };

  const fetchExams = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      let query = supabase.from('exams').select('*').order('created_at', { ascending: false });

      // LOGIC QUAN TRỌNG: 
      // Nếu là học sinh: Chỉ lấy bài của lớp mình (assigned) HOẶC bài public (nếu có logic public)
      // Ở đây mình lấy hết về rồi lọc ở Client để đảm bảo Realtime mượt mà, 
      // nhưng tốt nhất là dùng RLS ở Supabase để bảo mật.
      
      const { data, error } = await query;
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error(err);
      showToast("Không thể đồng bộ dữ liệu đề thi", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- 2. ACTIONS ---
  const handleAssignConfirm = async () => {
    if (!assignClassTarget || !deadline) return showToast("Vui lòng nhập đủ thông tin!", "error");
    
    try {
      const { error } = await supabase.from('exams').update({ 
        class_id: assignClassTarget, 
        is_locked: false, // Mở khóa ngay
        description: `Hạn chót: ${new Date(deadline).toLocaleString('vi-VN')}` // Lưu deadline tạm vào desc hoặc tạo cột mới
      } as any).eq('id', assigningExam?.id);

      if (error) throw error;
      
      showToast("Đã giao bài thành công! Học sinh sẽ thấy ngay lập tức.", "success");
      setAssigningExam(null);
    } catch (err) {
      showToast("Lỗi khi giao bài", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa đề thi này? Hành động không thể hoàn tác.")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) showToast("Đã xóa đề thi", "success");
  };

  // --- 3. FILTER LOGIC (TRÁI TIM CỦA DASHBOARD) ---
  const getProcessedExams = () => {
    let filtered = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));

    if (isTeacher) {
      if (filterStatus === 'locked') filtered = filtered.filter(e => e.is_locked);
      if (filterStatus === 'unlocked') filtered = filtered.filter(e => !e.is_locked);
      return filtered;
    } else {
      // Logic cho Học Sinh
      if (studentTab === 'assigned') {
        // Tab 1: Bài được giao (Khớp class_id của user VÀ đang mở)
        // Lưu ý: user.class_id cần tồn tại trong object user
        return filtered.filter(e => e.class_id === user.class_id && !e.is_locked);
      } else {
        // Tab 2: Bài tự luyện (Không có class_id hoặc public)
        return filtered.filter(e => !e.class_id && !e.is_locked);
      }
    }
  };

  const displayExams = getProcessedExams();

  // --- 4. SUB-COMPONENTS ---
  if (isEditorOpen) return <ExamEditor user={user} classId={selectedClassId} exam={editingExam} aiGeneratedData={parsedExamData} onClose={() => { setIsEditorOpen(false); setParsedExamData(null); }} />;
  if (takingExam) return <StudentQuiz exam={takingExam} user={user} onClose={() => setTakingExam(null)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-slate-50/50">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            {isTeacher ? "Quản Lý Đề Thi" : "Góc Học Tập"}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {isTeacher 
              ? "Tạo đề, giao bài và theo dõi tiến độ học sinh." 
              : "Hoàn thành các bài tập được giao đúng hạn nhé!"}
          </p>
        </div>
        
        {/* TAB SWITCHER CHO HỌC SINH */}
        {!isTeacher && (
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
            <button 
              onClick={() => setStudentTab('assigned')}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${studentTab === 'assigned' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <AlertCircle size={18} /> Bài Được Giao
              {exams.filter(e => e.class_id === user.class_id && !e.is_locked).length > 0 && 
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
              }
            </button>
            <button 
              onClick={() => setStudentTab('practice')}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${studentTab === 'practice' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <BookOpen size={18} /> Tự Luyện Tập
            </button>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-30 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {isTeacher && (
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
             <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-xl outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-3 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-100 hover:bg-violet-100 transition-colors flex items-center gap-2 whitespace-nowrap">
              <Sparkles size={18}/> AI Import
            </button>
            
            <button onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
              <Plus size={20}/> Tạo Mới
            </button>
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        // LOADING SKELETON
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse p-6">
              <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"/>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"/>
              <div className="h-4 bg-slate-200 rounded w-1/2"/>
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {displayExams.map(exam => (
              <motion.div 
                key={exam.id} layout 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              >
                <ExamCard 
                  exam={exam} 
                  role={user.role}
                  questionCount={Array.isArray(exam.questions) ? exam.questions.length : 0}
                  onView={() => setTakingExam(exam)}
                  onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }}
                  onDelete={() => handleDelete(exam.id)}
                  onToggleLock={async () => {/* Logic toggle lock */}}
                  onAssign={(e) => setAssigningExam(e)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {displayExams.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={40} className="text-slate-300"/>
              </div>
              <h3 className="text-xl font-bold text-slate-700">Chưa có bài thi nào ở đây</h3>
              <p className="text-slate-500 mt-2">
                {isTeacher ? "Hãy bắt đầu tạo bài thi đầu tiên của bạn!" : "Hiện tại thầy cô chưa giao bài mới. Hãy nghỉ ngơi nhé!"}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* MODAL GIAO BÀI NHANH */}
      <AnimatePresence>
        {assigningExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={() => setAssigningExam(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"/>
            <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.95, opacity: 0}} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-indigo-600 p-6 text-white">
                <h3 className="text-xl font-bold">Giao Bài: {assigningExam.title}</h3>
                <p className="opacity-80 text-sm mt-1">Học sinh sẽ nhận được thông báo ngay lập tức.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Lớp Áp Dụng</label>
                  <select value={assignClassTarget} onChange={e => setAssignClassTarget(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hạn Nộp Bài</label>
                  <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setAssigningExam(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Hủy</button>
                  <button onClick={handleAssignConfirm} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Xác Nhận Giao</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ImportExamFromFile isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={(data) => { setIsImportModalOpen(false); setParsedExamData(data); setIsEditorOpen(true); }} />
    </div>
  );
};

export default ExamDashboard;
