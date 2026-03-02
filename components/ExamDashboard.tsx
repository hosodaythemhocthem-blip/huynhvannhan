import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Sparkles, BookOpen, Lock, Unlock, 
  Users, CalendarDays, X, CheckCircle2, Clock, AlertCircle, 
  LayoutGrid, List, BarChart3, GraduationCap, Filter
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
  
  // --- STATE MANAGEMENT ---
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [studentTab, setStudentTab] = useState<'assigned' | 'practice'>('assigned');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Thêm chế độ xem List/Grid

  // Modal State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  
  // Assign Modal State
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [assignClassTarget, setAssignClassTarget] = useState(""); 
  const [deadline, setDeadline] = useState("");

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // --- 1. INITIALIZATION & REALTIME ---
  useEffect(() => {
    fetchData();
    // Realtime Subscription
    const channel = supabase.channel('exams_dashboard_update')
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
    if (data && data.length > 0) {
      setClasses(data);
      setAssignClassTarget(data[0].id);
    }
  };

  const fetchExams = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Lấy toàn bộ data và lọc ở client để đảm bảo tính reactive cao nhất
      // (Lưu ý: Với Production lớn nên lọc từ Server và dùng RLS)
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải dữ liệu.", "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- 2. LOGIC XỬ LÝ DỮ LIỆU (MEMOIZED) ---
  const filteredExams = useMemo(() => {
    let result = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));

    if (isTeacher) {
      if (filterStatus === 'locked') result = result.filter(e => e.is_locked);
      if (filterStatus === 'unlocked') result = result.filter(e => !e.is_locked);
    } else {
      // Logic Học Sinh
      if (studentTab === 'assigned') {
        // Cần check user.class_id. Nếu user chưa có class_id thì trả về rỗng hoặc logic khác
        result = result.filter(e => e.class_id === user.class_id && !e.is_locked);
      } else {
        // Bài tự luyện (không gán lớp cụ thể)
        result = result.filter(e => !e.class_id && !e.is_locked);
      }
    }
    return result;
  }, [exams, searchTerm, filterStatus, studentTab, isTeacher, user.class_id]);

  const stats = useMemo(() => {
    return {
      total: exams.length,
      active: exams.filter(e => !e.is_locked).length,
      assigned: exams.filter(e => e.class_id).length
    };
  }, [exams]);

  // --- 3. ACTIONS ---
  const handleAssignConfirm = async () => {
    if (!assignClassTarget || !deadline) return showToast("Vui lòng nhập đủ thông tin!", "error");
    try {
      const { error } = await supabase.from('exams').update({ 
        class_id: assignClassTarget, 
        is_locked: false, 
        // Lưu metadata deadline (nên có cột riêng trong DB, đây là workaround)
        description: `Hạn chót: ${new Date(deadline).toLocaleString('vi-VN')}` 
      } as any).eq('id', assigningExam?.id);

      if (error) throw error;
      showToast("Đã giao bài thành công!", "success");
      setAssigningExam(null);
    } catch (err) {
      showToast("Lỗi khi giao bài", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) showToast("Đã xóa đề thi", "success");
    else showToast("Xóa thất bại", "error");
  };

  // --- RENDER HELPERS ---
  if (isEditorOpen) return <ExamEditor user={user} classId={assignClassTarget} exam={editingExam} aiGeneratedData={parsedExamData} onClose={() => { setIsEditorOpen(false); setParsedExamData(null); }} />;
  if (takingExam) return <StudentQuiz exam={takingExam} user={user} onClose={() => setTakingExam(null)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-slate-50">
      
      {/* HEADER & WELCOME SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
          {isTeacher ? "Trung Tâm Khảo Thí" : "Góc Học Tập Của Bạn"}
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-slate-500 text-lg">
            {isTeacher 
              ? "Quản lý đề thi, ngân hàng câu hỏi và tiến độ học sinh." 
              : "Chào mừng trở lại! Hãy xem các bài tập cần hoàn thành hôm nay."}
          </p>
          
          {/* STATS MINI DASHBOARD (TEACHER ONLY) */}
          {isTeacher && (
            <div className="flex gap-4">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={18}/></div>
                <div><div className="text-xs text-slate-500 font-bold uppercase">Tổng Đề</div><div className="font-bold text-slate-800">{stats.total}</div></div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18}/></div>
                <div><div className="text-xs text-slate-500 font-bold uppercase">Đang Mở</div><div className="font-bold text-slate-800">{stats.active}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col xl:flex-row gap-4 justify-between items-center transition-all">
        
        {/* Search & Filter Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Tìm kiếm đề thi..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl outline-none transition-all shadow-sm"
            />
          </div>
          
          {/* Filter Chips */}
          {isTeacher ? (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['all', 'unlocked', 'locked'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterStatus === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {status === 'all' ? 'Tất cả' : status === 'unlocked' ? 'Đang mở' : 'Đã khóa'}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setStudentTab('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${studentTab === 'assigned' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                Bài Tập Lớp {exams.filter(e => e.class_id === user.class_id && !e.is_locked).length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
              </button>
              <button 
                onClick={() => setStudentTab('practice')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${studentTab === 'practice' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >
                Luyện Tự Do
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons (Teacher) */}
        {isTeacher && (
          <div className="flex gap-3 w-full xl:w-auto">
             <button onClick={() => setIsImportModalOpen(true)} className="flex-1 xl:flex-none px-4 py-3 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all flex justify-center items-center gap-2 whitespace-nowrap">
              <Sparkles size={18}/> <span className="hidden md:inline">AI Import</span>
            </button>
            
            <button onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} className="flex-1 xl:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 whitespace-nowrap">
              <Plus size={20}/> Tạo Đề Mới
            </button>
          </div>
        )}
      </div>

      {/* EXAM GRID / LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-[280px] bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex justify-between">
                <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse"/>
                <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse"/>
              </div>
              <div className="h-6 bg-slate-100 rounded-lg w-3/4 animate-pulse"/>
              <div className="h-4 bg-slate-100 rounded-lg w-1/2 animate-pulse"/>
              <div className="mt-auto h-10 bg-slate-100 rounded-xl w-full animate-pulse"/>
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredExams.map((exam) => (
              <motion.div 
                key={exam.id} 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ExamCard 
                  exam={exam} 
                  role={user.role}
                  questionCount={Array.isArray(exam.questions) ? exam.questions.length : 0}
                  onView={() => setTakingExam(exam)}
                  onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }}
                  onDelete={() => handleDelete(exam.id)}
                  onToggleLock={async () => {/* Implement lock logic here */}}
                  onAssign={(e) => setAssigningExam(e)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredExams.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Search size={48} className="text-slate-300"/>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi nào</h3>
              <p className="text-slate-500">Thử thay đổi bộ lọc hoặc tạo bài thi mới nhé.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* --- MODAL GIAO BÀI (ASSIGN) --- */}
      <AnimatePresence>
        {assigningExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} 
              onClick={() => setAssigningExam(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{scale: 0.95, opacity: 0, y: 10}} 
              animate={{scale: 1, opacity: 1, y: 0}} 
              exit={{scale: 0.95, opacity: 0, y: 10}} 
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">Giao Bài Thi</h3>
                    <p className="opacity-80 text-sm mt-1 line-clamp-1">{assigningExam.title}</p>
                  </div>
                  <button onClick={() => setAssigningExam(null)} className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors">
                    <X size={18}/>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Users size={16} className="text-indigo-500"/> Chọn Lớp Áp Dụng
                  </label>
                  <div className="relative">
                    <select 
                      value={assignClassTarget} 
                      onChange={e => setAssignClassTarget(e.target.value)} 
                      className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700"
                    >
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <CalendarDays size={16} className="text-indigo-500"/> Hạn Nộp Bài
                  </label>
                  <input 
                    type="datetime-local" 
                    value={deadline} 
                    onChange={e => setDeadline(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  />
                  <p className="text-xs text-slate-400 mt-2 ml-1">* Học sinh sẽ thấy deadline này trên thẻ bài thi.</p>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button onClick={() => setAssigningExam(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Hủy Bỏ</button>
                  <button onClick={handleAssignConfirm} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                    Xác Nhận Giao
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Import Modal */}
      <ImportExamFromFile 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={(data) => { setIsImportModalOpen(false); setParsedExamData(data); setIsEditorOpen(true); }} 
      />
    </div>
  );
};

export default ExamDashboard;
