import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, FileText, Sparkles, BookOpen, Lock, Unlock, Filter, ArrowUpDown } from "lucide-react";
import { supabase } from "../supabase";
import ExamCard from "./ExamCard";
import ExamEditor from "./ExamEditor"; 
import { useToast } from "./Toast";
import { User, Exam } from "../types";
import ImportExamFromFile from "./ImportExamFromFile"; 

interface Props {
  user: User;
}

const ExamDashboard: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Nâng cấp: State cho Bộ lọc và Sắp xếp
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // State quản lý việc Edit/Tạo mới
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // State quản lý Modal AI Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedExamData, setParsedExamData] = useState<any>(null);

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải danh sách đề thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examOrId: any) => {
    const id = typeof examOrId === 'string' ? examOrId : examOrId?.id;
    if (!id) return;
    
    if (!confirm("⚠️ Chà, bạn có chắc chắn muốn xóa vĩnh viễn đề thi này không?")) return;
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
      const { error } = await supabase
        .from('exams')
        .update({ is_locked: !exam.is_locked } as any)
        .eq('id', exam.id);
      
      if (error) throw error;
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_locked: !e.is_locked } : e));
      showToast(exam.is_locked ? "🔓 Đã mở khóa đề thi" : "🔒 Đã khóa đề thi", "success");
    } catch (err) {
      showToast("Lỗi cập nhật trạng thái", "error");
    }
  };

  const openEditor = (exam?: Exam) => {
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

  // Nâng cấp: Logic Lọc và Sắp xếp mượt mà
  let processedExams = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));
  if (filterStatus === 'locked') processedExams = processedExams.filter(e => e.is_locked);
  if (filterStatus === 'unlocked') processedExams = processedExams.filter(e => !e.is_locked);
  
  if (sortBy === 'oldest') {
    processedExams.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  } else {
    processedExams.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  // Nâng cấp: Thống kê nhanh
  const stats = {
    total: exams.length,
    unlocked: exams.filter(e => !e.is_locked).length,
    locked: exams.filter(e => e.is_locked).length
  };

  if (isEditorOpen) {
    return (
      <ExamEditor 
        user={user}
        exam={editingExam} 
        aiGeneratedData={parsedExamData} 
        onClose={() => { 
          setIsEditorOpen(false); 
          setParsedExamData(null); 
          fetchExams(); 
        }} 
      />
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      
      {/* HEADER & THỐNG KÊ SIÊU KINH ĐIỂN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 mb-2">
            Ngân Hàng Đề Thi
          </h1>
          <p className="text-slate-500 font-medium text-lg">Quản lý, phân tích và tổ chức thi trực tuyến thông minh</p>
        </div>

        {/* Thẻ Thống Kê */}
        <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px]">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={24} /></div>
            <div>
              <p className="text-sm text-slate-400 font-semibold">Tổng số đề</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px]">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Unlock size={24} /></div>
            <div>
              <p className="text-sm text-slate-400 font-semibold">Đang mở</p>
              <p className="text-2xl font-black text-slate-800">{stats.unlocked}</p>
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px]">
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Lock size={24} /></div>
            <div>
              <p className="text-sm text-slate-400 font-semibold">Đã khóa</p>
              <p className="text-2xl font-black text-slate-800">{stats.locked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ (CONTROL BAR) - GLASSMORPHISM */}
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col xl:flex-row justify-between items-center gap-4 sticky top-4 z-10">
        
        {/* Tìm kiếm & Lọc */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Nhập tên đề thi cần tìm..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 font-medium cursor-pointer appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unlocked">Chỉ đề đang mở</option>
              <option value="locked">Chỉ đề đã khóa</option>
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 font-medium cursor-pointer appearance-none"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>

        {/* Nút Action */}
        {isTeacher && (
          <div className="flex gap-3 w-full xl:w-auto">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 xl:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Sparkles size={18} className="text-violet-500"/>
              <span>AI Bóc Tách File</span>
            </button>

            <button 
              onClick={() => openEditor()}
              className="flex-1 xl:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-300 hover:shadow-indigo-400 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} strokeWidth={3}/> 
              <span>Tạo Đề Mới</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedExams.map(exam => (
            <div key={exam.id} className="group transition-all duration-300 hover:-translate-y-1">
              <ExamCard
                exam={exam}
                role={user.role}
                questionCount={Array.isArray((exam as any).questions) ? (exam as any).questions.length : 0}
                onView={() => { /* Logic làm bài thi */ }}
                onEdit={() => openEditor(exam)}
                onDelete={handleDelete}
                onToggleLock={handleToggleLock}
              />
            </div>
          ))}
          
          {processedExams.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                 <FileText size={40} className="text-indigo-300 absolute" />
                 <Sparkles size={20} className="text-violet-400 absolute top-4 right-4 animate-bounce" />
               </div>
               <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa tìm thấy đề thi nào!</h3>
               <p className="text-slate-500 font-medium max-w-md text-center mb-6">
                 Không có dữ liệu khớp với tìm kiếm của bạn, hoặc bạn chưa tạo đề thi nào. Hãy thử tạo một đề thi mới bằng AI xem sao!
               </p>
               {isTeacher && (
                 <button onClick={() => openEditor()} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
                   Tạo đề thi đầu tiên ngay <Plus size={16}/>
                 </button>
               )}
            </div>
          )}
        </div>
      )}

      {/* Modal AI */}
      <ImportExamFromFile
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default ExamDashboard;
