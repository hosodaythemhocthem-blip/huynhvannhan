import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Upload, FileText } from "lucide-react";
import { supabase } from "../supabase";
import { geminiService } from "../services/geminiService";
import ExamCard from "./ExamCard";
import ExamEditor from "./ExamEditor"; // Component này sẽ tạo ở dưới
import { useToast } from "./Toast";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { User, Exam } from "../types";

// Cấu hình Worker cho PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  user: User;
}

const ExamDashboard: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State quản lý việc Edit/Tạo mới
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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

  // Xử lý Upload file đề thi (Word/PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      let text = "";
      // 1. Extract Text
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ");
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }

      // 2. Parse with Gemini
      const aiResponse = await geminiService.parseExamWithAI(text);
      
      if (!aiResponse || !aiResponse.questions) {
        throw new Error("Không nhận diện được câu hỏi");
      }

      // 3. Create Exam in DB
      const newExam: Partial<Exam> = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: "Được tạo tự động từ file tải lên",
        created_by: user.id,
        is_locked: true, // Mặc định khóa để GV sửa trước
        questions: aiResponse.questions // Lưu JSON câu hỏi vào cột questions
      };

      const { data, error } = await supabase.from('exams').insert(newExam).select().single();
      if (error) throw error;

      showToast(`Đã tạo đề: ${newExam.title}`, "success");
      fetchExams();
      
      // Mở Editor ngay để chỉnh sửa
      setEditingExam(data);
      setIsEditorOpen(true);

    } catch (err) {
      console.error(err);
      showToast("Lỗi xử lý file đề thi", "error");
    } finally {
      setIsProcessingFile(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa đề thi này?")) return;
    try {
      await supabase.from('exams').delete().eq('id', id);
      setExams(prev => prev.filter(e => e.id !== id));
      showToast("Đã xóa đề thi", "success");
    } catch (err) {
      showToast("Lỗi xóa đề", "error");
    }
  };

  const handleToggleLock = async (exam: Exam) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_locked: !exam.is_locked })
        .eq('id', exam.id);
      
      if (error) throw error;
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_locked: !e.is_locked } : e));
      showToast(exam.is_locked ? "Đã mở khóa đề" : "Đã khóa đề", "success");
    } catch (err) {
      showToast("Lỗi cập nhật", "error");
    }
  };

  // Mở Editor
  const openEditor = (exam?: Exam) => {
    setEditingExam(exam || null);
    setIsEditorOpen(true);
  };

  if (isEditorOpen) {
    return (
      <ExamEditor 
        user={user}
        exam={editingExam} 
        onClose={() => { setIsEditorOpen(false); fetchExams(); }} 
      />
    );
  }

  const filteredExams = exams.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-2xl font-black text-slate-800">Ngân Hàng Đề Thi</h2>
           <p className="text-sm text-slate-500">Quản lý và tổ chức thi trực tuyến</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
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
               {/* Upload Button */}
               <label className={`flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-50 hover:text-indigo-600 transition-all ${isProcessingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                 {isProcessingFile ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}
                 <span className="hidden sm:inline">Upload Word/PDF</span>
                 <input type="file" hidden accept=".pdf,.docx,.doc" onChange={handleFileUpload}/>
               </label>

               {/* Create Button */}
               <button 
                 onClick={() => openEditor()}
                 className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
               >
                 <Plus size={18}/> <span className="hidden sm:inline">Tạo Đề Mới</span>
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
              questionCount={Array.isArray(exam.questions) ? exam.questions.length : 0}
              onView={() => { /* Logic làm bài thi - sẽ tích hợp StudentQuiz sau */ }}
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
    </div>
  );
};

export default ExamDashboard;
