
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  ChevronRight, 
  Star, 
  LayoutDashboard, 
  History,
  Gamepad2,
  PlayCircle,
  Trash2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Exam, StudentAccount, Grade } from '../types';
import MathPreview from './MathPreview';

interface StudentDashboardProps {
  student: StudentAccount;
  exams: Exam[];
  onTakeExam: (exam: Exam) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, exams, onTakeExam }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'results'>('overview');
  const [myGrades, setMyGrades] = useState<Grade[]>([]);

  // Lọc đề thi dựa trên assignedClassIds (Mảng ID)
  const myClassExams = exams.filter(e => {
    if (e.assignedClassIds && e.assignedClassIds.includes(student.classId)) return true;
    
    // Fallback cho trường hợp học sinh chưa duyệt lớp nhưng giáo viên gán qua tên lớp (Dựa trên logic đăng ký cũ)
    if (student.classId === 'pending' && e.assignedClass === student.requestedClassName) return true;
    
    return false;
  });

  useEffect(() => {
    const loadGrades = () => {
      const allGrades: Grade[] = JSON.parse(localStorage.getItem('grades') || '[]');
      setMyGrades(allGrades.filter(g => g.studentName === student.name));
    };
    
    loadGrades();
    window.addEventListener('storage', loadGrades);
    return () => window.removeEventListener('storage', loadGrades);
  }, [student.name, activeTab]);

  const handleDeleteGrade = (id: string) => {
    if (!window.confirm('Xóa kết quả lần thi này?')) return;
    const allGrades: Grade[] = JSON.parse(localStorage.getItem('grades') || '[]');
    const updatedGrades = allGrades.filter(g => g.id !== id);
    localStorage.setItem('grades', JSON.stringify(updatedGrades));
    setMyGrades(updatedGrades.filter(g => g.studentName === student.name));
  };

  const stats = [
    { label: 'Đề thi đã làm', value: myGrades.length, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Điểm trung bình', value: myGrades.length ? (myGrades.reduce((a, b) => a + b.score, 0) / myGrades.length).toFixed(1) : '0.0', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bài thi sắp tới', value: myClassExams.filter(e => !myGrades.some(g => g.examTitle === e.title)).length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black mb-3 italic">Chào {student.name.split(' ').pop()}! 👋</h1>
          <p className="text-blue-100 font-medium leading-relaxed opacity-90">
            Hôm nay bạn có <strong className="text-white underline">{stats[2].value} bài tập mới</strong> đã được giáo viên giao cho lớp <strong>{student.requestedClassName || 'của bạn'}</strong>.
          </p>
          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => setActiveTab('exams')}
              className="px-10 py-3.5 bg-white text-blue-700 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-xl"
            >
              Làm bài ngay
            </button>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-5%] opacity-10 rotate-12 pointer-events-none">
          <Trophy size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className={`${stat.bg} ${stat.color} p-4.5 rounded-2xl shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <nav className="flex border-b border-slate-100 bg-slate-50/30 p-2">
          <TabItem active={activeTab === 'overview'} label="Tổng quan" icon={<LayoutDashboard size={18} />} onClick={() => setActiveTab('overview')} />
          <TabItem active={activeTab === 'exams'} label="Đề thi khối lớp" icon={<BookOpen size={18} />} onClick={() => setActiveTab('exams')} />
          <TabItem active={activeTab === 'results'} label="Kết quả của tôi" icon={<History size={18} />} onClick={() => setActiveTab('results')} />
        </nav>

        <div className="p-10">
          {activeTab === 'overview' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-8">
                    <PlayCircle className="text-blue-500" /> Bài thi giáo viên vừa giao
                  </h3>
                  <div className="space-y-4">
                    {myClassExams.slice(0, 3).map(exam => (
                      <div key={exam.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[28px] flex justify-between items-center group hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('exams')}>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base italic">{exam.title}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{exam.questionCount} Câu • {exam.duration} Phút</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                      </div>
                    ))}
                    {myClassExams.length === 0 && (
                      <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[32px] text-slate-300 text-xs font-black uppercase tracking-widest italic leading-relaxed">
                        Hiện giáo viên chưa giao bài nào<br/>cho khối lớp của bạn.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-8">
                    <Gamepad2 className="text-purple-500" /> Giải trí trí tuệ
                  </h3>
                  <div className="bg-[#5d5dff] rounded-[32px] p-10 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-100">
                    <div className="relative z-10">
                      <h4 className="text-2xl font-black mb-3 italic">Arena Đua Vịt 🦆</h4>
                      <p className="text-blue-100 text-[11px] font-bold uppercase tracking-widest leading-loose max-w-[220px]">Giải toán siêu tốc để đưa chú vịt của bạn về đích!</p>
                      <button className="mt-8 px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Vào Arena Lớp</button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] text-[160px] opacity-10 rotate-[-15deg] group-hover:rotate-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none">🦆</div>
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
              {myClassExams.map(exam => {
                const isDone = myGrades.some(g => g.examTitle === exam.title);
                return (
                  <div key={exam.id} className={`bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden flex flex-col ${isDone ? 'border-emerald-100' : ''}`}>
                    <div className="absolute top-0 right-0">
                      <span className={`px-5 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-widest shadow-sm ${isDone ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {isDone ? 'Đã nộp bài' : 'Đang mở'}
                      </span>
                    </div>
                    <div className="mb-6 mt-2">
                       <h4 className="text-2xl font-black text-slate-800 pr-8 leading-tight italic">
                        <MathPreview math={exam.title} />
                      </h4>
                    </div>
                    <div className="flex gap-3 mb-10">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{exam.duration} Phút</div>
                      <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{exam.questionCount} Câu</div>
                    </div>
                    <div className="mt-auto">
                      {exam.isLocked ? (
                        <div className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100">
                           <Lock size={14} /> Bài thi đã khóa
                        </div>
                      ) : (
                        <button 
                          onClick={() => onTakeExam(exam)}
                          className={`w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
                            isDone ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                          }`}
                        >
                          {isDone ? 'Làm lại bài này' : 'Bắt đầu ngay'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {myClassExams.length === 0 && (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300 space-y-4">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center opacity-10">
                      <BookOpen size={60} />
                   </div>
                   <p className="font-black uppercase tracking-[0.4em] text-sm italic">Chưa có bài tập cho lớp của bạn</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-4 p-5 bg-blue-50/50 text-blue-700 rounded-[28px] border border-blue-100">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Thông báo hệ thống</p>
                   <p className="text-xs font-bold leading-relaxed opacity-80">Kết quả học tập của bạn được lưu trữ an toàn. Giáo viên sẽ dựa vào bảng điểm này để đánh giá năng lực.</p>
                </div>
              </div>

              <div className="rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Tên đề thi</th>
                      <th className="px-10 py-6 text-center">Lần nộp</th>
                      <th className="px-10 py-6 text-center">Kết quả</th>
                      <th className="px-10 py-6 text-center">Ngày giờ nộp</th>
                      <th className="px-10 py-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myGrades.map((grade, idx) => (
                      <tr key={grade.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6 font-black text-slate-800 text-base italic">{grade.examTitle}</td>
                        <td className="px-10 py-6 text-center">
                          <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-400">LẦN {myGrades.length - idx}</span>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <span className={`px-6 py-2.5 rounded-2xl font-black text-lg shadow-sm ${grade.score >= 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {grade.score.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-center text-slate-400 text-xs font-bold italic tracking-tight">{grade.submittedAt}</td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-red-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myGrades.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] italic">Chưa có kết quả nộp bài</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const TabItem: React.FC<{ active: boolean, label: string, icon: React.ReactNode, onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4.5 flex items-center justify-center gap-3 transition-all rounded-[24px] font-black text-[11px] uppercase tracking-widest ${
      active ? 'bg-white shadow-xl text-blue-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {icon} {label}
  </button>
);

export default StudentDashboard;
