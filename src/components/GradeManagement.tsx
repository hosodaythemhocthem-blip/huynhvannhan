
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  Download, 
  Eye, 
  Trash2, 
  RotateCcw, 
  BarChart, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  X,
  UserX
} from 'lucide-react';
import { Class, Exam, Grade, StudentAccount } from '../types';

interface GradeManagementProps {
  classes: Class[];
  exams: Exam[];
}

const GradeManagement: React.FC<GradeManagementProps> = ({ classes, exams }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>('');
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [allStudents, setAllStudents] = useState<StudentAccount[]>([]);
  const [showUnsubmittedModal, setShowUnsubmittedModal] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const grades: Grade[] = JSON.parse(localStorage.getItem('grades') || '[]');
      const students: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
      setAllGrades(grades);
      setAllStudents(students);
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredGrades = useMemo(() => {
    let result = allGrades;
    if (selectedClassId) {
      result = result.filter(g => g.classId === selectedClassId || (selectedClassId === 'preview' && g.classId === 'preview'));
    }
    if (selectedExamTitle) {
      result = result.filter(g => g.examTitle === selectedExamTitle);
    }
    return result;
  }, [allGrades, selectedClassId, selectedExamTitle]);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  
  const studentsInClass = useMemo(() => 
    allStudents.filter(s => s.classId === selectedClassId && s.status === 'APPROVED'),
  [allStudents, selectedClassId]);

  const submittedStudentNames = useMemo(() => Array.from(new Set(filteredGrades.map(g => g.studentName))), [filteredGrades]);
  const unsubmittedStudents = useMemo(() => studentsInClass.filter(s => !submittedStudentNames.includes(s.name)), [studentsInClass, submittedStudentNames]);

  const scoreStats = useMemo(() => {
    const stats = { gioid: 0, kha: 0, tb: 0, yeu: 0, kem: 0 };
    filteredGrades.forEach(g => {
      if (g.score >= 8) stats.gioid++;
      else if (g.score >= 6.5) stats.kha++;
      else if (g.score >= 5) stats.tb++;
      else if (g.score >= 3.5) stats.yeu++;
      else stats.kem++;
    });
    return stats;
  }, [filteredGrades]);

  const handleDeleteGrade = (id: string) => {
    if (!window.confirm("Xóa kết quả này?")) return;
    const updated = allGrades.filter(g => g.id !== id);
    localStorage.setItem('grades', JSON.stringify(updated));
    setAllGrades(updated);
  };

  const totalStudentsCount = studentsInClass.length;
  const submittedCount = submittedStudentNames.length;
  const notSubmittedCount = unsubmittedStudents.length;
  const submittedPercent = totalStudentsCount > 0 ? (submittedCount / totalStudentsCount * 100).toFixed(1) : "0.0";
  const notSubmittedPercent = totalStudentsCount > 0 ? (notSubmittedCount / totalStudentsCount * 100).toFixed(1) : "0.0";
  const passedCount = filteredGrades.filter(g => g.score >= 5).length;
  const passRate = submittedCount > 0 ? (passedCount / submittedCount * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn Lớp</label>
            <div className="relative">
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-700 font-bold focus:border-blue-500 outline-none transition-all cursor-pointer text-sm"
              >
                <option value="">-- Chọn lớp để xem --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="preview">Xem thử (Preview Mode)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn Đề thi</label>
            <div className="relative">
              <select 
                value={selectedExamTitle}
                onChange={(e) => setSelectedExamTitle(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-700 font-bold focus:border-blue-500 outline-none transition-all cursor-pointer text-sm"
              >
                <option value="">-- Chọn đề thi --</option>
                {exams.map(e => <option key={e.id} value={e.title}>{e.title}</option>)}
                {Array.from(new Set(allGrades.map(g => g.examTitle))).filter(t => !exams.some(e => e.title === t)).map(t => (
                  <option key={t} value={t}>{t} (Đã cũ)</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-emerald-100 text-[11px] uppercase tracking-widest">
              <Download size={18} /> Excel
            </button>
            <button 
              onClick={() => { setSelectedClassId(''); setSelectedExamTitle(''); }}
              className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
          <h3 className="flex items-center gap-3 font-black text-slate-800 uppercase text-[11px] tracking-widest">
            <BarChart size={18} className="text-blue-500" /> Thống kê tổng quan
          </h3>
        </div>
        
        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Tình trạng nộp bài
            </h4>
            <div className="space-y-4">
              <div className="bg-[#f0fdf4] border border-[#dcfce7] p-5 rounded-2xl flex justify-between items-center group cursor-default">
                <span className="text-[#15803d] font-black text-sm uppercase">Đã làm</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#15803d]">{submittedCount}/{totalStudentsCount || submittedCount}</span>
                  <span className="text-[11px] text-[#15803d]/60 font-black ml-1">({submittedPercent}%)</span>
                </div>
              </div>
              <div className="bg-[#fef2f2] border border-[#fee2e2] p-5 rounded-2xl flex justify-between items-center group">
                <span className="text-[#b91c1c] font-black text-sm uppercase">Chưa làm</span>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-2xl font-black text-[#b91c1c]">{notSubmittedCount}</span>
                    <span className="text-[11px] text-[#b91c1c]/60 font-black ml-1">({notSubmittedPercent}%)</span>
                  </div>
                  <button 
                    onClick={() => setShowUnsubmittedModal(true)}
                    className="p-2 bg-white text-[#ef4444] rounded-lg shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 border-x border-slate-100 px-10 text-slate-700">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Phổ điểm
            </h4>
            <div className="space-y-3.5">
              <ScoreItem label="Giỏi (≥8)" color="text-green-600" count={scoreStats.gioid} total={submittedCount} />
              <ScoreItem label="Khá (6.5-8)" color="text-blue-600" count={scoreStats.kha} total={submittedCount} />
              <ScoreItem label="TB (5-6.5)" color="text-slate-600" count={scoreStats.tb} total={submittedCount} />
              <ScoreItem label="Yếu (3.5-5)" color="text-orange-600" count={scoreStats.yeu} total={submittedCount} />
              <ScoreItem label="Kém (<3.5)" color="text-red-600" count={scoreStats.kem} total={submittedCount} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 self-start">
              <CheckCircle2 size={14} /> Tỉ lệ đạt (≥5.0)
            </h4>
            <div className="relative flex flex-col items-center">
              <div className="text-4xl font-black text-[#0369a1] tabular-nums">{passRate}%</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Trên trung bình</div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 text-center">
                <div className="text-[10px] font-black text-[#15803d] uppercase tracking-widest mb-1">Đạt</div>
                <div className="text-2xl font-black text-[#15803d]">{passedCount}</div>
              </div>
              <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-4 text-center">
                <div className="text-[10px] font-black text-[#ef4444] uppercase tracking-widest mb-1">Chưa đạt</div>
                <div className="text-2xl font-black text-[#ef4444]">{submittedCount - passedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Bài thi</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Lần thi</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Điểm số</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Gian lận</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Nộp lúc</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredGrades.length > 0 ? (
              filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-800 text-sm italic">{grade.studentName}</td>
                  <td className="px-8 py-6 text-slate-500 text-sm font-medium">{grade.examTitle}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase">#{grade.attempt}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-5 py-2 rounded-2xl font-black text-base shadow-sm ${grade.score >= 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {grade.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase">
                      <AlertTriangle size={12} />
                      {grade.cheatingRisk}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center text-slate-400 text-xs font-bold italic tracking-tight">{grade.submittedAt}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm">
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteGrade(grade.id)}
                        className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-40 text-center text-slate-300 font-black uppercase tracking-[0.4em] italic">
                  Vui lòng chọn Lớp và Đề thi để xem danh sách điểm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showUnsubmittedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowUnsubmittedModal(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"
              >
                <X size={24} />
              </button>
              <div className="p-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                       <UserX size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800">Danh sách chưa nộp</h3>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lớp: {selectedClass?.name || 'Tất cả'}</p>
                    </div>
                 </div>
                 <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                    {unsubmittedStudents.map((s, idx) => (
                      <div key={s.username} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                        <span className="w-8 h-8 rounded-full bg-white text-slate-400 text-[10px] font-black flex items-center justify-center border border-slate-100">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-700 italic">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {s.username}</p>
                        </div>
                        <div className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">Chưa nộp</div>
                      </div>
                    ))}
                 </div>
                 <button onClick={() => setShowUnsubmittedModal(false)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest">Đóng</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ScoreItem: React.FC<{ label: string, color: string, count: number, total: number }> = ({ label, color, count, total }) => {
  const percent = total > 0 ? (count / total * 100).toFixed(1) : "0.0";
  return (
    <div className="flex justify-between items-center text-[12px] font-black">
      <span className={`${color} italic uppercase tracking-wider`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-800 text-sm tabular-nums">{count}</span>
        <span className="text-slate-400 font-bold text-[10px] tabular-nums">({percent}%)</span>
      </div>
    </div>
  );
};

export default GradeManagement;
