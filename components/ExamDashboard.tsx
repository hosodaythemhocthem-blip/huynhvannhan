import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, FileText, Sparkles, BookOpen, Lock, Unlock, Users, CalendarDays, X, CheckCircle2 } from "lucide-react";
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State cho Bộ lọc và Sắp xếp
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // State quản lý Modal
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);

  // State quản lý học sinh đang làm bài
  const [takingExam, setTakingExam] = useState<Exam | null>(null);

  // 🚀 ĐÃ THÊM: Quản lý danh sách lớp học thật từ Database
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(""); // Lớp chọn để tạo đề

  // State quản lý Modal Giao Bài
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [selectedClass, setSelectedClass] = useState(""); 
  const [deadline, setDeadline] = useState("");

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  useEffect(() => {
    fetchExams();
    if (isTeacher) {
      fetchClasses();
    }
  }, []);

  // Lấy danh sách Lớp học từ Database
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase.from('classes').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setClasses(data);
        setSelectedClassId(data[0].id); // Mặc định chọn lớp đầu tiên để tạo đề
        setSelectedClass(data[0].id);   // Mặc định chọn lớp đầu tiên cho Modal giao bài
      }
    } catch (err) {
      console.error("Lỗi tải lớp:", err);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      showToast("Lỗi tải danh sách đề thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examOrId: any) => {
    const id = typeof examOrId === 'string' ? examOrId : examOrId?.id;
    if (!id || !confirm("⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn đề thi này không?")) return;
    try {
      await supabase.from('exams').delete().eq('id', id);
      setExams(prev => prev.filter(e => e.id !== id));
      showToast("Đã xóa đề thi thành công! 🗑️", "success");
    } catch (err) {
      showToast("Lỗi xóa đề", "error");
    }
  };

  const handleToggleLock = async (exam: any) => {
    try {
      const { error } = await supabase.from('exams').update({ is_locked: !exam.is_locked } as any).eq('id', exam.id);
      if (error) throw error;
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_locked: !e.is_locked } : e));
      showToast(exam.is_locked ? "🔓 Đã mở khóa đề thi" : "🔒 Đã khóa đề thi", "success");
    } catch (err) {
      showToast("Lỗi cập nhật trạng thái", "error");
    }
  };

  const openEditor = (exam?: Exam) => {
    if (isTeacher && !selectedClassId && !exam?.id) {
      showToast("Vui lòng đợi tải dữ liệu lớp học trước khi tạo đề!", "error");
      return;
    }
    setEditingExam(exam || null);
    setParsedExamData(null); 
    setIsEditorOpen(true);
  };

  const handleImportSuccess = (aiData: any) => {
    setParsedExamData(aiData); 
    setIsImportModalOpen(false); 
    setEditingExam(null); 
    setIsEditorOpen(true); 
  };

  // 🚀 ĐÃ FIX: Lệnh Giao Bài thật xuống Database
  const handleConfirmAssign = async () => {
    if (!selectedClass) return showToast("Vui lòng chọn lớp!", "error");
    if (!deadline) return showToast("Vui lòng chọn hạn nộp bài!", "error");
    
    try {
      const { error } = await supabase
        .from('exams')
        .update({ 
          class_id: selectedClass, 
          is_locked: false // Mở khóa luôn để học sinh làm
        } as any)
        .eq('id', assigningExam?.id);

      if (error) throw error;

      showToast(`Đã giao đề "${assigningExam?.title}" cho lớp thành công! 🚀`, "success");
      setAssigningExam(null); 
      fetchExams(); // Tải lại danh sách đề mới nhất
    } catch (error) {
      showToast("Lỗi khi giao đề thi", "error");
      console.error(error);
    }
  };

  // LOGIC LỌC ĐỀ THI: Bảo vệ học sinh khỏi các đề chưa mở
  let processedExams = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (!isTeacher) {
    // Nếu là học sinh, CHỈ được thấy đề đã mở khóa (is_locked = false)
    processedExams = processedExams.filter(e => !e.is_locked);
  } else {
    // Nếu là giáo viên, dùng bộ lọc bình thường
    if (filterStatus === 'locked') processedExams = processedExams.filter(e => e.is_locked);
    if (filterStatus === 'unlocked') processedExams = processedExams.filter(e => !e.is_locked);
  }

  if (sortBy === 'oldest') {
    processedExams.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  } else {
    processedExams.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  const stats = {
    total: exams.length,
    unlocked: exams.filter(e => !e.is_locked).length,
    locked: exams.filter(e => e.is_locked).length
  };

  // 🚀 RENDER MÀN HÌNH THEO TRẠNG THÁI
  if (isEditorOpen) {
    return (
      <ExamEditor 
        user={user}
        classId={selectedClassId} // 👈 ĐÃ TRUYỀN CLASS ID VÀO ĐÂY (Sẽ hết lỗi NULL)
        exam={editingExam} 
        aiGeneratedData={parsedExamData} 
        onClose={() => { setIsEditorOpen(false); setParsedExamData(null); fetchExams(); }} 
      />
    );
  }

  if (takingExam) {
    return (
      <StudentQuiz 
        exam={takingExam} 
        user={user} 
        onClose={() => { setTakingExam(null); fetchExams(); }} 
      />
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      
      {/* HEADER & THỐNG KÊ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 mb-2">
            Ngân Hàng Đề Thi
          </h1>
          <p className="text-slate-500 font-medium text-lg">Quản lý, phân tích và tổ chức thi trực tuyến thông minh</p>
        </div>

        {isTeacher && (
          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px] hover:shadow-md transition-shadow">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={24} /></div>
              <div>
                <p className="text-sm text-slate-400 font-semibold">Tổng số đề</p>
                <p className="text-2xl font-black text-slate-800">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px] hover:shadow-md transition-shadow">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Unlock size={24} /></div>
              <div>
                <p className="text-sm text-slate-400 font-semibold">Đang mở</p>
                <p className="text-2xl font-black text-slate-800">{stats.unlocked}</p>
              </div>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px] hover:shadow-md transition-shadow">
              <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Lock size={24} /></div>
              <div>
                <p className="text-sm text-slate-400 font-semibold">Đã khóa</p>
                <p className="text-2xl font-black text-slate-800">{stats.locked}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* THANH CÔNG CỤ TÌM KIẾM/LỌC */}
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col xl:flex-row justify-between items-center gap-4 sticky top-4 z-20">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18}/>
            <input 
              type="text" 
              placeholder="Nhập tên đề thi cần tìm..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
            />
          </div>
          
          <div className="flex gap-2">
            {isTeacher && (
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 font-medium cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unlocked">Chỉ đề đang mở</option>
                <option value="locked">Chỉ đề đã khóa</option>
              </select>
            )}
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 font-medium cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>

        {isTeacher && (
          <div className="flex gap-3 w-full xl:w-auto items-center">
            
            {/* 🚀 ĐÃ THÊM: Dropdown Chọn lớp trước khi tạo đề */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              title="Chọn lớp học để tạo đề"
              className="px-4 py-3 bg-indigo-50/80 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 font-bold cursor-pointer hidden sm:block max-w-[200px] truncate"
            >
              {classes.length === 0 ? <option value="">Đang tải lớp...</option> : classes.map(c => (
                <option key={c.id} value={c.id}>{c.name || 'Lớp chưa đặt tên'}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 xl:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Sparkles size={18} className="text-violet-500"/>
              <span className="whitespace-nowrap">AI Bóc Tách File</span>
            </button>
            <button 
              onClick={() => openEditor()}
              className="flex-1 xl:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-300 hover:shadow-indigo-400 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} strokeWidth={3}/> 
              <span className="whitespace-nowrap">Tạo Đề Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* KHU VỰC HIỂN THỊ ĐỀ THI */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
          <Loader2 className="animate-spin mb-4" size={48} strokeWidth={1.5}/>
          <p className="font-medium text-slate-500 animate-pulse">Đang đồng bộ dữ liệu siêu tốc...</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {processedExams.map(exam => (
              <motion.div 
                key={exam.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <ExamCard
                  exam={exam}
                  role={user.role}
                  questionCount={Array.isArray((exam as any).questions) ? (exam as any).questions.length : 0}
                  onView={() => setTakingExam(exam)} 
                  onEdit={() => openEditor(exam)}
                  onDelete={handleDelete}
                  onToggleLock={handleToggleLock}
                  onAssign={(examToAssign) => setAssigningExam(examToAssign)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {processedExams.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300"
            >
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                 <FileText size={40} className="text-indigo-300 absolute" />
                 <Sparkles size={20} className="text-violet-400 absolute top-4 right-4 animate-bounce" />
               </div>
               <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa tìm thấy đề thi nào!</h3>
               <p className="text-slate-500 font-medium max-w-md text-center mb-6">
                 {isTeacher ? "Thử thay đổi bộ lọc hoặc tạo một đề thi mới tinh xem sao." : "Hiện tại giáo viên chưa mở đề thi nào cho bạn."}
               </p>
               {isTeacher && (
                 <button onClick={() => openEditor()} className="text-indigo-600 font-bold hover:underline flex items-center gap-2 bg-indigo-50 px-6 py-3 rounded-xl">
                   Tạo đề thi ngay <Plus size={16}/>
                 </button>
               )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Modal AI */}
      <ImportExamFromFile isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={handleImportSuccess} />

      {/* MODAL GIAO BÀI (ASSIGN EXAM) */}
      <AnimatePresence>
        {assigningExam && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAssigningExam(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-100"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 relative">
                <button onClick={() => setAssigningExam(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Giao Bài Thi</h2>
                <p className="text-emerald-50 text-sm line-clamp-1 opacity-90">Đề: {assigningExam.title}</p>
              </div>

              <div className="p-6 space-y-5 bg-slate-50/50">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users size={16} className="text-indigo-500"/> Chọn Lớp Nhận Đề
                  </label>
                  {/* 🚀 ĐÃ FIX: Danh sách chọn lớp gọi từ Database thật */}
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm cursor-pointer font-medium"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name || `Lớp: ${c.id.substring(0,6)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={16} className="text-amber-500"/> Hạn chót nộp bài (Deadline)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm cursor-pointer font-medium"
                  />
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setAssigningExam(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button 
                  onClick={handleConfirmAssign}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Phát Đề Ngay 🚀
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamDashboard;
