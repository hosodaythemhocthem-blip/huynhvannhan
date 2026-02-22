import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, FileText, Sparkles } from "lucide-react";
import { supabase } from "../supabase";
import ExamCard from "./ExamCard";
import ExamEditor from "./ExamEditor"; 
import { useToast } from "./Toast";
import { User, Exam } from "../types";
import ImportExamFromFile from "./ImportExamFromFile"; // Thêm dòng này

interface Props {
  user: User;
}

const ExamDashboard: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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
    
    if (!confirm("Bạn chắc chắn muốn xóa đề thi này?")) return;
    try {
      await supabase.from('exams').delete().eq('id', id);
      setExams(prev => prev.filter(e => e.id !== id));
      showToast("Đã xóa đề thi", "success");
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
      showToast(exam.is_locked ? "Đã mở khóa đề" : "Đã khóa đề", "success");
    } catch (err) {
      showToast("Lỗi cập nhật", "error");
    }
  };

  // Mở Editor tạo thủ công hoặc sửa đề cũ
  const openEditor = (exam?: Exam) => {
    setEditingExam(exam || null);
    setParsedExamData(null); // Reset data AI nếu có
    setIsEditorOpen(true);
  };

  // Xử lý khi Modal AI bóc tách file thành công
  const handleImportSuccess = (aiData: any) => {
    console.log("Data từ AI:", aiData);
    setParsedExamData(aiData); // Lưu data AI vào state
    setIsImportModalOpen(false); // Đóng modal
    setEditingExam(null); // Đảm bảo là tạo mới
    setIsEditorOpen(true); // Mở thẳng Editor lên để nạp data
  };

  if (isEditorOpen) {
    return (
      <ExamEditor 
        user={user}
        exam={editingExam} 
        aiGeneratedData={parsedExamData} // Truyền data AI vào Editor (nếu có)
        onClose={() => { 
          setIsEditorOpen(false); 
          setParsedExamData(null); 
          fetchExams(); 
        }} 
      />
    );
  }

  const filteredExams = exams.filter(e => (e.title || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-2xl font-black text-slate-800">Ngân Hàng Đề Thi</h2>
           <p className="text-sm text-slate-500">Quản lý và tổ chức thi trực tuyến</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Tìm kiếm đề thi..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {isTeacher && (
            <div className="flex gap-2">
               {/* Nút Mở Modal AI Import */}
               <button 
                 onClick={() => setIsImportModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-3 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-xl cursor-pointer hover:bg-indigo-50 transition-all shadow-sm"
               >
                 <Sparkles size={18} className="text-indigo-500"/>
                 <span className="hidden sm:inline">Tạo bằng AI (File)</span>
               </button>

               {/* Nút Tạo Đề Thủ Công */}
               <button 
                 onClick={() => openEditor()}
                 className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
               >
                 <Plus size={18}/> <span className="hidden sm:inline">Tạo Thủ Công</span>
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Exams */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              role={user.role}
              questionCount={Array.isArray((exam as any).questions) ? (exam as any).questions.length : 0}
              onView={() => { /* Logic làm bài thi */ }}
              onEdit={() => openEditor(exam)}
              onDelete={handleDelete}
              onToggleLock={handleToggleLock}
            />
          ))}
          
          {filteredExams.length === 0 && (
             <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FileText size={32}/>
                </div>
                <p className="text-slate-500 font-medium">Chưa có đề thi nào phù hợp</p>
             </div>
          )}
        </div>
      )}

      {/* Bảng Modal AI Import lơ lửng */}
      <ImportExamFromFile
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default ExamDashboard;
