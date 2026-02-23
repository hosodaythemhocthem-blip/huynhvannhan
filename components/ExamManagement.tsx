// components/ExamManagement.tsx
import React, { useState, useEffect } from "react";
import { 
  FileText, Search, Sparkles, Plus, 
  Trash2, Edit3, Loader2, Clock, BarChart3, Users
} from "lucide-react";
import { supabase } from "../supabase";
import { User } from "../types";
import { useToast } from "./Toast";
import { motion } from "framer-motion";

interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  status: string;
  created_at: string;
}

interface Props {
  user: User;
}

const ExamManagement: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadExams();
    }
  }, [user]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải danh sách đề thi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          teacher_id: user.id,
          title: 'Đề thi mới (Chưa đặt tên)',
          duration: 45,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      showToast("Đã tạo khung đề thi mới!", "success");
      await loadExams();
      // Chỗ này sau này thầy có thể redirect sang trang Edit Exam (Thêm câu hỏi)
      // window.location.href = `/exam/edit/${data.id}`;
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tạo đề thi.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleAIAction = () => {
    // Tính năng chờ làm sau
    showToast("Tính năng AI tạo đề từ File đang được phát triển!", "info");
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (!window.confirm(`Thầy/Cô có chắc muốn xóa vĩnh viễn "${title}" không?`)) return;

    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      
      showToast("Đã xóa đề thi thành công.", "success");
      await loadExams();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi xóa đề thi.", "error");
    }
  };

  const filteredExams = exams.filter(ex => 
    (ex.title || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải kho đề thi...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER TƯƠNG TỰ HÌNH ẢNH MẪU */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Xin chào, Thầy {user.full_name?.split(' ').pop()} 👋
           </h2>
           <p className="text-slate-500 font-medium mt-1">Quản lý kho đề thi và ngân hàng câu hỏi của thầy.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={handleAIAction}
             className="px-6 py-3.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 group"
           >
              <Sparkles size={18} className="text-indigo-500 group-hover:animate-pulse" /> 
              Tạo bằng AI (File)
           </button>
           <button 
             onClick={handleCreateManual}
             disabled={creating}
             className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
           >
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />}
              Tạo thủ công
           </button>
        </div>
      </header>

      {/* THỐNG KÊ (STATS CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
               <FileText size={24} />
            </div>
            <div>
               <p className="text-slate-400 font-medium text-sm mb-1">Tổng số đề thi</p>
               <h3 className="text-3xl font-black text-slate-800">{exams.length}</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
               <Users size={24} />
            </div>
            <div>
               <p className="text-slate-400 font-medium text-sm mb-1">Học sinh hoạt động</p>
               <h3 className="text-3xl font-black text-slate-800">--</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
               <BarChart3 size={24} />
            </div>
            <div>
               <p className="text-slate-400 font-medium text-sm mb-1">Lượt làm bài tuần này</p>
               <h3 className="text-3xl font-black text-slate-800">--</h3>
            </div>
         </div>
      </div>

      {/* TÌM KIẾM */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Tìm kiếm đề thi theo tên..." 
          className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700 placeholder:text-slate-300" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* DANH SÁCH ĐỀ THI */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredExams.map((exam, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               key={exam.id} 
               className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col h-full relative"
             >
                {/* Góc phải trên: Nút sửa & Xóa */}
                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Chỉnh sửa đề">
                      <Edit3 size={16} />
                   </button>
                   <button 
                     onClick={() => handleDeleteExam(exam.id, exam.title)}
                     className="p-2 bg-slate-50 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" 
                     title="Xóa đề"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>

                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-4">
                   <FileText size={20} />
                </div>
                
                <h4 className="font-black text-lg text-slate-800 mb-2 pr-16 line-clamp-2">{exam.title}</h4>
                <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2">
                   {exam.description || "Chưa có mô tả cho đề thi này."}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-bold">
                   <div className="flex items-center gap-1.5">
                      <Clock size={14} /> {exam.duration} phút
                   </div>
                   <span className={`px-2 py-1 rounded-md uppercase tracking-wider ${exam.status === 'draft' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {exam.status === 'draft' ? 'Bản nháp' : 'Đã giao'}
                   </span>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <FileText size={40} />
           </div>
           <h4 className="text-lg font-black text-slate-700 mb-2">Chưa có đề thi nào</h4>
           <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Thầy có thể bấm "Tạo thủ công" hoặc "Tạo bằng AI" ở góc trên để bắt đầu thêm ngân hàng câu hỏi nhé.
           </p>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
