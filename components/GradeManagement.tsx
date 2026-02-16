
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronDown,
  Download,
  RotateCcw,
  Search,
  Trash2,
  Save,
  X,
  RefreshCw,
  Trophy,
  Users,
  BarChart3,
  CheckCircle2,
  ClipboardPaste,
  Filter,
  ArrowUpRight,
  Loader2,
  GraduationCap
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";

interface GradeManagementProps {
  classes?: any[];
  exams?: any[];
}

interface SubmissionRow {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  student_name?: string;
  exam_title?: string;
  created_at: string;
}

const GradeManagement: React.FC<GradeManagementProps> = ({ classes = [], exams = [] }) => {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  useEffect(() => {
    loadSubmissions();
  }, [selectedClassId, selectedExamId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      // Trong thực tế sẽ join với profiles và exams, ở đây dùng mock logic từ Supabase wrapper
      const { data } = await supabase.from('submissions').select();
      let filtered = data || [];
      
      if (selectedExamId) {
        filtered = filtered.filter((s: any) => s.exam_id === selectedExamId);
      }
      
      setSubmissions(filtered);
    } catch (err) {
      console.error("Lỗi tải bảng điểm");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed = submissions.filter(s => s.score >= 5).length;
    const avg = total > 0 ? (submissions.reduce((a, b) => a + b.score, 0) / total).toFixed(1) : "0.0";
    const excellence = submissions.filter(s => s.score >= 8).length;
    return { total, passed, avg, excellence };
  }, [submissions]);

  const filteredData = useMemo(() => {
    return submissions.filter(s => 
      (s.student_name || "Học sinh").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [submissions, searchTerm]);

  const handleUpdateScore = async (id: string) => {
    try {
      await supabase.from('submissions').update(id, { score: editScore });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, score: editScore } : s));
      setEditingId(null);
    } catch (err) {
      alert("Lỗi cập nhật vĩnh viễn.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Thầy Nhẫn chắc chắn muốn xóa vĩnh viễn bản ghi điểm này?")) {
      await supabase.from('submissions').delete(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handlePasteGrades = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const scores = text.split('\n').map(s => parseFloat(s)).filter(s => !isNaN(s));
      if (scores.length > 0 && confirm(`Thầy muốn cập nhật điểm cho ${scores.length} học sinh đầu tiên trong danh sách?`)) {
        // Logic cập nhật hàng loạt cho UI demo
        const newSubmissions = [...submissions];
        scores.forEach((score, idx) => {
          if (newSubmissions[idx]) {
             newSubmissions[idx].score = score;
             supabase.from('submissions').update(newSubmissions[idx].id, { score });
          }
        });
        setSubmissions(newSubmissions);
        alert("Đã cập nhật điểm hàng loạt thành công!");
      }
    } catch (err) {
      alert("Hãy dùng phím Ctrl + V");
    }
  };

  const exportCSV = () => {
    const header = "Học sinh,Đề thi,Điểm,Ngày nộp\n";
    const rows = filteredData.map(s => `${s.student_name || 'HS'},${s.exam_title || 'Đề'},${s.score},${new Date(s.created_at).toLocaleDateString()}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BangDiem_NhanLMS_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 📊 ANALYTICS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard 
            label="Tổng bài thi" 
            value={stats.total} 
            icon={<Users className="text-indigo-600" size={24} />} 
            color="bg-indigo-50"
         />
         <StatCard 
            label="Điểm trung bình" 
            value={stats.avg} 
            icon={<BarChart3 className="text-amber-600" size={24} />} 
            color="bg-amber-50"
         />
         <StatCard 
            label="Tỉ lệ Đạt (>=5)" 
            value={`${stats.total > 0 ? Math.round((stats.passed/stats.total)*100) : 0}%`} 
            icon={<CheckCircle2 className="text-emerald-600" size={24} />} 
            color="bg-emerald-50"
         />
         <StatCard 
            label="Học sinh Giỏi" 
            value={stats.excellence} 
            icon={<Trophy className="text-purple-600" size={24} />} 
            color="bg-purple-50"
         />
      </section>

      {/* 🔍 FILTERS & ACTIONS */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Tên học sinh..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 outline-none font-bold transition-all text-sm"
               />
            </div>
            
            <div className="flex items-center gap-2">
               <Filter size={16} className="text-slate-400" />
               <select 
                 value={selectedClassId}
                 onChange={(e) => setSelectedClassId(e.target.value)}
                 className="px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none text-sm appearance-none"
               >
                  <option value="">Tất cả lớp</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handlePasteGrades}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all"
              title="Dán điểm từ Excel (Ctrl+V)"
            >
               <ClipboardPaste size={18} /> DÁN ĐIỂM NHANH
            </button>
            <button 
              onClick={exportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
            >
               <Download size={18} /> XUẤT BÁO CÁO
            </button>
         </div>
      </section>

      {/* 📅 GRADES TABLE */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Học sinh</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Đề thi</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Điểm số</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ngày nộp</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                       <td colSpan={5} className="px-8 py-20 text-center">
                          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Đang tải dữ liệu Cloud...</p>
                       </td>
                    </tr>
                  ) : filteredData.length > 0 ? filteredData.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                {s.student_name?.charAt(0) || 'H'}
                             </div>
                             <span className="font-bold text-slate-800">{s.student_name || "Học sinh Demo"}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <MathPreview content={s.exam_title || "Đề kiểm tra định kỳ"} className="text-sm font-medium text-slate-500" />
                       </td>
                       <td className="px-8 py-6 text-center">
                          {editingId === s.id ? (
                            <div className="flex items-center justify-center gap-2 animate-in zoom-in-95">
                               <input 
                                 type="number" 
                                 step="0.1"
                                 value={editScore}
                                 onChange={(e) => setEditScore(parseFloat(e.target.value))}
                                 className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-center font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
                               />
                               <button onClick={() => handleUpdateScore(s.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Save size={16} /></button>
                               <button onClick={() => setEditingId(null)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"><X size={16} /></button>
                            </div>
                          ) : (
                            <span 
                              onClick={() => { setEditingId(s.id); setEditScore(s.score); }}
                              className={`px-4 py-2 rounded-xl font-black text-sm cursor-pointer hover:scale-110 transition-transform inline-block min-w-[50px]
                                ${s.score >= 8 ? 'bg-emerald-50 text-emerald-600' : s.score >= 5 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}
                            >
                               {s.score.toFixed(1)}
                            </span>
                          )}
                       </td>
                       <td className="px-8 py-6 text-center text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(s.created_at).toLocaleDateString()}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 size={18} />
                          </button>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={5} className="px-8 py-32 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 animate-float">
                             <BarChart3 size={40} />
                          </div>
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Chưa có bản ghi điểm nào cho tiêu chí này</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* 🔄 REFRESH BUTTON FLOATING */}
      <button 
        onClick={loadSubmissions}
        className="fixed bottom-10 right-32 w-14 h-14 bg-white border border-slate-100 text-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center hover:rotate-180 transition-all duration-500 active:scale-90"
      >
         <RefreshCw size={24} />
      </button>
    </div>
  );
};

/* =========================
   SUB-COMPONENTS
========================= */

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
     <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform`}>
        {/* Fix: Casting icon to any to allow size prop in cloneElement */}
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
     </div>
  </div>
);

export default GradeManagement;
