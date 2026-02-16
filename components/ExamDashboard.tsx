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
  X,
  PlusCircle
} from "lucide-react";
import { OnlineExam } from "../types";
import ExamCard from "./ExamCard";
import ImportExamFromFile from "./ImportExamFromFile";
import AiExamGenerator from "./AiExamGenerator";
import { supabase } from "../supabase";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

interface Props {
  exams: OnlineExam[];
  onCreate: () => void;
  onAdd: (exam: OnlineExam) => void;
  onEdit: (exam: OnlineExam) => void;
  onDelete: (id: string) => void;
  onView?: (exam: OnlineExam) => void;
  userId: string;
}

const ExamDashboard: React.FC<Props> = ({
  exams,
  onCreate,
  onAdd,
  onEdit,
  onDelete,
  onView,
  userId
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTool, setActiveTool] = useState<'import' | 'ai' | null>(null);

  const filteredExams = useMemo(() => {
    if (!search.trim()) return exams;
    return exams.filter(exam => 
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.grade?.toLowerCase().includes(search.toLowerCase())
    );
  }, [exams, search]);

  const handlePermanentDelete = async (id: string) => {
    try {
      const { error } = await (supabase.from('exams') as any).delete().eq('id', id);
      if (error) throw error;
      onDelete(id);
      showToast("Đã xóa đề thi vĩnh viễn khỏi Cloud!", "success");
    } catch (err) {
      showToast("Lỗi khi xóa dữ liệu vĩnh viễn.", "error");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Dashboard */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
            <FileText className="text-indigo-600" size={36} /> Kho Đề Thi v6.0
          </h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
            Thầy Nhẫn đang quản lý {exams.length} đề thi vĩnh viễn
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveTool(activeTool === 'import' ? null : 'import')}
            className={`px-8 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'import' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <FileUp size={18} /> Nhập Word/PDF
          </button>
          <button 
            onClick={() => setActiveTool(activeTool === 'ai' ? null : 'ai')}
            className={`px-8 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'ai' ? 'bg-purple-600 text-white shadow-xl shadow-purple-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
          >
            <Wand2 size={18} /> Tạo Đề AI
          </button>
          <button 
            onClick={onCreate}
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-2"
          >
            <PlusCircle size={18} /> Tạo Thủ Công
          </button>
        </div>
      </header>

      {/* Area hiển thị Tool mở rộng */}
      <AnimatePresence>
        {activeTool && (
          <MotionDiv 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 rounded-[3rem] p-10 relative">
              <button 
                onClick={() => setActiveTool(null)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              {activeTool === 'import' ? (
                <ImportExamFromFile onImport={onAdd} />
              ) : (
                <AiExamGenerator userId={userId} onGenerate={onAdd} />
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Tìm kiếm và Lọc */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi theo tên hoặc khối lớp..." 
            className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid size={20}/></button>
           <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><List size={20}/></button>
        </div>
      </div>

      {/* Danh sách đề thi */}
      <section className="min-h-[400px]">
        {filteredExams.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
            {filteredExams.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                onEdit={onEdit}
                onDelete={handlePermanentDelete}
                onView={onView}
                role="teacher"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border border-slate-100 border-dashed">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <History size={40} className="text-slate-200" />
            </div>
            <p className="font-black text-xl text-slate-800 tracking-tight italic">Chưa tìm thấy đề thi phù hợp</p>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Thầy Nhẫn hãy thử thay đổi từ khóa tìm kiếm</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExamDashboard;
