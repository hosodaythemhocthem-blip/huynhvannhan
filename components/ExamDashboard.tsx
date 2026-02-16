
import React, { useMemo, useState } from "react";
import { 
  Plus, 
  FileText, 
  Sparkles, 
  Search, 
  Trash2, 
  Loader2, 
  LayoutGrid, 
  List, 
  ClipboardPaste,
  Wand2,
  FileUp,
  History,
  AlertCircle,
  X
} from "lucide-react";
import { OnlineExam } from "../examFo";
import ExamCard from "./ExamCard";
import ImportExamFromFile from "./ImportExamFromFile";
import AiExamGenerator from "./AiExamGenerator";
import { supabase } from "../supabase";
import { useToast } from "./Toast";

interface Props {
  exams: OnlineExam[];
  onCreate: () => void;
  onAdd: (exam: OnlineExam) => void;
  onEdit: (exam: OnlineExam) => void;
  onDelete: (id: string) => void;
  onView?: (exam: OnlineExam) => void;
}

const ExamDashboard: React.FC<Props> = ({
  exams,
  onCreate,
  onAdd,
  onEdit,
  onDelete,
  onView,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTool, setActiveTool] = useState<'import' | 'ai' | null>(null);

  const filteredExams = useMemo(() => {
    if (!search.trim()) return exams;
    const s = search.toLowerCase();
    return exams.filter((exam) =>
      exam.title.toLowerCase().includes(s) || 
      exam.description.toLowerCase().includes(s)
    );
  }, [exams, search]);

  const handleQuickPasteCreate = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast("Bộ nhớ đệm trống. Thầy hãy copy nội dung đề thi trước nhé!", "warning");
        return;
      }
      setActiveTool('ai');
      showToast("Đã nhận nội dung! Thầy hãy tinh chỉnh lại trong trình AI nhé.", "success");
    } catch (err) {
      showToast("Hãy dùng Ctrl + V thủ công.", "info");
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("Thầy Nhẫn có chắc muốn xóa VĨNH VIỄN toàn bộ đề thi? Hành động này không thể khôi phục!")) {
      setLoading(true);
      try {
        for (const exam of exams) {
          await supabase.from('exams').delete(exam.id);
        }
        window.location.reload();
      } catch (err) {
        showToast("Lỗi khi xóa dữ liệu Cloud.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 🚀 CREATIVE ACTION HUB */}
      <section className="bg-white rounded-[4rem] p-10 md:p-14 border border-indigo-50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-14">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Khu vực Sáng tạo</h2>
            <p className="text-slate-500 font-medium mt-2 text-lg">Phòng lab AI & Công cụ quản lý đề thi tối tân của Thầy Nhẫn.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button
              onClick={onCreate}
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              <Plus size={22} /> SOẠN THỦ CÔNG
            </button>
            <button
              onClick={handleQuickPasteCreate}
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black text-sm hover:bg-indigo-100 transition-all border border-indigo-100"
              title="Tạo nhanh từ Clipboard (Ctrl+V)"
            >
              <ClipboardPaste size={22} /> DÁN ĐỀ NHANH
            </button>
            {exams.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="p-5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm"
                title="Xóa tất cả đề thi vĩnh viễn"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Trash2 size={22} />}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div 
             className={`group p-10 rounded-[3rem] transition-all duration-500 cursor-pointer relative overflow-hidden
               ${activeTool === 'ai' ? 'bg-indigo-600 text-white shadow-2xl ring-4 ring-indigo-200' : 'bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl'}`} 
             onClick={() => setActiveTool(activeTool === 'ai' ? null : 'ai')}
           >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <Sparkles className={`absolute -bottom-6 -right-6 transition-transform duration-700 ${activeTool === 'ai' ? 'text-white/20 scale-150' : 'text-slate-200 group-hover:scale-125'}`} size={160} />
              <div className="relative z-10">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${activeTool === 'ai' ? 'bg-white/20' : 'bg-indigo-600 text-white'}`}>
                    <Wand2 size={28} />
                 </div>
                 <h4 className="text-2xl font-black mb-3">Lumina AI Generator</h4>
                 <p className={`text-base font-medium leading-relaxed ${activeTool === 'ai' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Dùng AI chuyển ghi chú, văn bản thô hoặc công thức viết tay thành đề thi chuẩn tắc vĩnh viễn.
                 </p>
              </div>
           </div>

           <div 
             className={`group p-10 rounded-[3rem] transition-all duration-500 cursor-pointer relative overflow-hidden
               ${activeTool === 'import' ? 'bg-emerald-600 text-white shadow-2xl ring-4 ring-emerald-200' : 'bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-xl'}`} 
             onClick={() => setActiveTool(activeTool === 'import' ? null : 'import')}
           >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <FileUp className={`absolute -bottom-6 -right-6 transition-transform duration-700 ${activeTool === 'import' ? 'text-white/20 scale-150' : 'text-slate-200 group-hover:scale-125'}`} size={160} />
              <div className="relative z-10">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${activeTool === 'import' ? 'bg-white/20' : 'bg-emerald-600 text-white'}`}>
                    <FileUp size={28} />
                 </div>
                 <h4 className="text-2xl font-black mb-3">Nhập tệp Word / PDF</h4>
                 <p className={`text-base font-medium leading-relaxed ${activeTool === 'import' ? 'text-emerald-50' : 'text-slate-500'}`}>
                    Tự động nhận diện công thức LaTeX từ file tài liệu và lưu trữ vĩnh viễn vào hệ thống của Thầy.
                 </p>
              </div>
           </div>
        </div>

        {/* DYNAMIC TOOL RENDERER */}
        {activeTool && (
          <div className="mt-12 pt-12 border-t border-slate-100 animate-in slide-in-from-top-6 duration-700">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                   <h5 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">
                      {activeTool === 'import' ? "Trình nhập File thông minh" : "Trình tạo đề AI Lumina Pro"}
                   </h5>
                </div>
                <button onClick={() => setActiveTool(null)} className="p-3 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all">
                   <X size={20} />
                </button>
             </div>
             
             {activeTool === 'import' ? (
               <ImportExamFromFile 
                 teacherId="teacher-nhan"
                 onCreated={(exam) => {
                   onAdd(exam);
                   setActiveTool(null);
                 }} 
               />
             ) : (
               <AiExamGenerator userId="teacher-nhan" onGenerate={onAdd} />
             )}
          </div>
        )}
      </section>

      {/* 📚 EXAM LIBRARY */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
           <div className="flex items-center gap-5">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Thư viện Đề thi</h3>
              <div className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                 {filteredExams.length} Bản ghi vĩnh viễn
              </div>
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-96">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input
                   type="text"
                   placeholder="Tìm đề thi theo tiêu đề..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-14 pr-10 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 focus:ring-4 focus:ring-indigo-100 outline-none font-bold transition-all"
                 />
              </div>
              <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutGrid size={20} />
                 </button>
                 <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List size={20} />
                 </button>
              </div>
           </div>
        </div>

        {filteredExams.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10" 
            : "flex flex-col gap-6"
          }>
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onView={onView}
                onEdit={() => onEdit(exam)}
                onDelete={() => onDelete(exam.id)}
                role="teacher"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 group hover:border-indigo-100 transition-all">
            <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center shadow-inner mb-10 group-hover:scale-110 transition-transform duration-700">
              <FileText size={56} className="text-slate-200" />
            </div>
            <p className="font-black text-2xl text-slate-800 tracking-tight">Thư viện của Thầy đang trống</p>
            <p className="text-lg font-medium text-slate-400 mt-4 text-center max-w-sm leading-relaxed">
              Thầy Nhẫn hãy bắt đầu bằng việc dán đề thi nhanh từ Clipboard hoặc tải file Word lên nhé.
            </p>
            <button
              onClick={onCreate}
              className="mt-12 bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-base flex items-center gap-4 hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              <Sparkles size={24} /> BẮT ĐẦU NGAY
            </button>
          </div>
        )}
      </section>

      <footer className="flex flex-col md:flex-row items-center justify-center gap-10 py-12 opacity-30 hover:opacity-100 transition-all duration-500">
         <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            <History size={16} /> Cloud Synced Permanent
         </div>
         <div className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></div>
         <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            <AlertCircle size={16} /> Design for Thầy Huỳnh Văn Nhẫn v5.8
         </div>
      </footer>
    </div>
  );
};

export default ExamDashboard;
