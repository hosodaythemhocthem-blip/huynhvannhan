import { createExam } from '../services/exam.service';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Settings2, X, Save, FileText, CheckCircle, Shuffle, Repeat, Info, LayoutGrid, ListChecks, Type
} from 'lucide-react';
import MathPreview from './MathPreview';
import { Question, QuestionType, Exam, SubQuestion } from '../types';
import { extractQuestionsFromText } from '../services/geminiService';

interface ExamEditorProps {
  initialExam?: Exam;
  isThptPreset?: boolean;
  onSave: (data: Partial<Exam>) => void;
  onCancel: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ initialExam, isThptPreset = false, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'quick'>('quick');
  const [activeSection, setActiveSection] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState(initialExam?.title || (isThptPreset ? 'Đề ôn tập THPT 2025' : ''));
  const [duration, setDuration] = useState(initialExam?.duration ?? (isThptPreset ? 90 : 15));
  const [maxScore, setMaxScore] = useState(initialExam?.maxScore ?? 10);
  
  // Scoring Config
  const [part1Points, setPart1Points] = useState(initialExam?.scoringConfig?.part1Points ?? 0.25);
  const [part2Points, setPart2Points] = useState(initialExam?.scoringConfig?.part2Points ?? 1.0);
  const [part3Points, setPart3Points] = useState(initialExam?.scoringConfig?.part3Points ?? 0.5);

  const [freeMode, setFreeMode] = useState(true);
  const [allowRetake, setAllowRetake] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [examCode, setExamCode] = useState('TEST01');

  const [rawText, setRawText] = useState('');
  const [rawAnswers, setRawAnswers] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>(initialExam?.questions || []);

  const handleAddQuestion = (section: 1 | 2 | 3) => {
    const id = Date.now().toString() + Math.random();
    let newQ: Question;
    if (section === 1) {
      newQ = { id, type: QuestionType.MULTIPLE_CHOICE, section: 1, text: '', options: ['', '', '', ''], correctAnswer: 0 };
    } else if (section === 2) {
      newQ = { 
        id, type: QuestionType.TRUE_FALSE, section: 2, text: '', options: [], 
        subQuestions: [
          { id: 'a', text: '', correctAnswer: true },
          { id: 'b', text: '', correctAnswer: true },
          { id: 'c', text: '', correctAnswer: false },
          { id: 'd', text: '', correctAnswer: false }
        ],
        correctAnswer: null 
      };
    } else {
      newQ = { id, type: QuestionType.SHORT_ANSWER, section: 3, text: '', options: [], correctAnswer: '' };
    }
    setQuestions([...questions, newQ]);
    setActiveTab('manual');
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } as Question : q));
  };

  const handleAiUpdate = async () => {
    if (!rawText.trim()) return;
    setIsAiLoading(true);
    const fullText = `${rawText}\n\nĐÁP ÁN: ${rawAnswers}`;
    const newQs = await extractQuestionsFromText(fullText);
    if (newQs.length > 0) {
      setQuestions([...questions, ...newQs.map(q => ({
        ...q,
        id: Date.now().toString() + Math.random(),
        section: activeSection,
        type: activeSection === 1 ? QuestionType.MULTIPLE_CHOICE : (activeSection === 2 ? QuestionType.TRUE_FALSE : QuestionType.SHORT_ANSWER)
      }))]);
      setActiveTab('manual');
    }
    setIsAiLoading(false);
  };

  const handleSave = () => {
    if (!title.trim()) { alert('Vui lòng nhập tên đề thi'); return; }
    onSave({ 
      title, duration, maxScore, 
      questions,
      scoringConfig: { part1Points, part2Points, part3Points },
      isLocked: false
    });
  };

  const filteredQuestions = questions.filter(q => q.section === activeSection);

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[100] flex flex-col overflow-y-auto custom-scrollbar font-sans p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-4xl font-black text-[#1e293b] tracking-tight">Biên Soạn Đề Thi</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cấu trúc 3 phần chuẩn THPT 2025</p>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={onCancel} className="text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Hủy bỏ</button>
            <button onClick={handleSave} className="px-10 py-3 bg-[#0f172a] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Lưu đề thi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Đề Thi</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-base outline-none focus:border-blue-500 shadow-sm" placeholder="VD: Đề thi thử THPT Quốc Gia" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian (phút)</label>
                      <input value={duration} onChange={e => setDuration(Number(e.target.value))} type="number" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-base" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thang điểm</label>
                      <input value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} type="number" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-base" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Content Editor Section */}
            <div className="space-y-6">
               <div className="flex gap-4">
                  <SectionToggle active={activeSection === 1} num={1} label="Lựa chọn" onClick={() => setActiveSection(1)} />
                  <SectionToggle active={activeSection === 2} num={2} label="Đúng / Sai" onClick={() => setActiveSection(2)} />
                  <SectionToggle active={activeSection === 3} num={3} label="Trả lời ngắn" onClick={() => setActiveSection(3)} />
               </div>

               <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit">
                  <button onClick={() => setActiveTab('manual')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-500'}`}>Thủ công</button>
                  <button onClick={() => setActiveTab('quick')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quick' ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-500'}`}>Nhập nhanh (Text)</button>
               </div>

               <div className="bg-[#f0f9ff] rounded-[40px] p-8 border border-blue-100">
                  {activeTab === 'quick' ? (
                    <div className="bg-white rounded-3xl p-6 space-y-4">
                       <textarea value={rawText} onChange={e => setRawText(e.target.value)} className="w-full h-[300px] p-6 bg-slate-50 rounded-2xl border-none outline-none font-bold text-base" placeholder={`Nhập nội dung cho Phần ${activeSection}...`} />
                       <textarea value={rawAnswers} onChange={e => setRawAnswers(e.target.value)} className="w-full h-[80px] p-6 bg-slate-50 rounded-2xl border-none outline-none font-bold text-base text-blue-600" placeholder="Đáp án: 1.A 2.B..." />
                       <button onClick={handleAiUpdate} disabled={isAiLoading} className="w-full py-4 bg-[#0ea5e9] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">
                         {isAiLoading ? "ĐANG XỬ LÝ..." : `Cập nhật Phần ${activeSection}`}
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       {filteredQuestions.map((q, idx) => (
                         <div key={q.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative group">
                            <span className="absolute top-6 left-6 px-3 py-1 bg-slate-100 text-slate-400 rounded-lg font-black text-[10px] uppercase">CÂU {idx + 1}</span>
                            <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-6 right-6 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                            
                            <div className="mt-8 space-y-6">
                               <textarea value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-base border-none outline-none" placeholder="Nội dung câu hỏi..." />
                               {q.type === QuestionType.MULTIPLE_CHOICE && (
                                 <div className="grid grid-cols-2 gap-4">
                                   {q.options.map((opt, oIdx) => (
                                     <div key={oIdx} className="flex items-center gap-3">
                                       <button onClick={() => updateQuestion(q.id, { correctAnswer: oIdx })} className={`w-8 h-8 rounded-lg font-black border-2 ${q.correctAnswer === oIdx ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-100 text-slate-300'}`}>{String.fromCharCode(65+oIdx)}</button>
                                       <input value={opt} onChange={e => { const newO = [...q.options]; newO[oIdx] = e.target.value; updateQuestion(q.id, { options: newO }) }} className="flex-1 bg-transparent border-b border-slate-100 outline-none p-1 font-bold text-sm" placeholder="Phương án..." />
                                     </div>
                                   ))}
                                 </div>
                               )}
                               {q.type === QuestionType.TRUE_FALSE && (
                                 <div className="space-y-3">
                                   {q.subQuestions?.map((sub, sIdx) => (
                                     <div key={sub.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                        <span className="font-black text-slate-400 text-xs w-6">{sub.id})</span>
                                        <input value={sub.text} onChange={e => { const newS = [...(q.subQuestions || [])]; newS[sIdx].text = e.target.value; updateQuestion(q.id, { subQuestions: newS }) }} className="flex-1 bg-transparent border-none outline-none text-sm font-bold" />
                                        <div className="flex bg-white rounded-lg p-1 border">
                                           <button onClick={() => { const newS = [...(q.subQuestions || [])]; newS[sIdx].correctAnswer = true; updateQuestion(q.id, { subQuestions: newS }) }} className={`px-4 py-1 rounded-md text-[9px] font-black uppercase ${sub.correctAnswer ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}>Đúng</button>
                                           <button onClick={() => { const newS = [...(q.subQuestions || [])]; newS[sIdx].correctAnswer = false; updateQuestion(q.id, { subQuestions: newS }) }} className={`px-4 py-1 rounded-md text-[9px] font-black uppercase ${!sub.correctAnswer ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400'}`}>Sai</button>
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                               )}
                               {q.type === QuestionType.SHORT_ANSWER && (
                                 <input value={q.correctAnswer} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} className="w-full p-4 bg-slate-900 text-white rounded-xl font-mono text-lg" placeholder="Kết quả số..." />
                               )}
                            </div>
                         </div>
                       ))}
                       <button onClick={() => handleAddQuestion(activeSection)} className="w-full py-10 border-2 border-dashed border-blue-200 rounded-[40px] flex flex-col items-center justify-center gap-4 text-blue-300 hover:bg-white hover:border-blue-400 transition-all">
                          <Plus size={32} />
                          <span className="font-black uppercase tracking-widest text-xs">Thêm câu hỏi mới vào Phần {activeSection}</span>
                       </button>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Settings2 size={16} className="text-blue-500" /> Thiết lập điểm
                </h4>
                <div className="space-y-4">
                   <ScoringItem label="Phần I (MCQ)" desc="Điểm cho mỗi câu đúng" value={part1Points} onChange={setPart1Points} />
                   <ScoringItem label="Phần II (T/F)" desc="Điểm cho câu đúng 4 ý" value={part2Points} onChange={setPart2Points} />
                   <ScoringItem label="Phần III (Short)" desc="Điểm cho mỗi câu đúng" value={part3Points} onChange={setPart3Points} />
                </div>
                <div className="pt-4 border-t border-slate-50">
                   <p className="text-[9px] text-slate-400 italic leading-relaxed">
                      * Phần II được chấm lũy tiến tự động: 1 ý đúng = 10% điểm, 2 ý = 25%, 3 ý = 50%, 4 ý = 100% điểm câu đó.
                   </p>
                </div>
             </div>

             <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-4">
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Làm lại nhiều lần</span>
                  <input type="checkbox" checked={allowRetake} onChange={e => setAllowRetake(e.target.checked)} className="w-5 h-5 rounded-md" />
                </label>
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Trộn đề (Shuffle)</span>
                  <input type="checkbox" checked={shuffleMode} onChange={e => setShuffleMode(e.target.checked)} className="w-5 h-5 rounded-md" />
                </label>
                <div className="pt-4 flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Mã đề:</span>
                   <span className="text-sm font-black text-blue-600">TN{examCode}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-20">
           <button onClick={handleSave} className="flex items-center gap-3 bg-[#0ea5e9] text-white px-12 py-5 rounded-3xl font-black shadow-2xl hover:bg-blue-600 transition-all uppercase text-sm tracking-widest active:scale-95">
             <Save size={24} /> Lưu Đề Thi (Phát hành)
           </button>
        </div>
      </div>
    </div>
  );
};

const SectionToggle: React.FC<{ active: boolean, num: number, label: string, onClick: () => void }> = ({ active, num, label, onClick }) => (
  <button onClick={onClick} className={`flex-1 p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-2 ${active ? 'bg-white border-blue-500 shadow-xl' : 'bg-white/60 border-transparent text-slate-400'}`}>
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${active ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{num}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ScoringItem: React.FC<{ label: string, desc: string, value: number, onChange: (v: number) => void }> = ({ label, desc, value, onChange }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
       <span className="text-xs font-black text-slate-700">{label}</span>
       <input type="number" step="0.05" value={value} onChange={e => onChange(Number(e.target.value))} className="w-16 text-right font-black text-blue-600 outline-none text-sm" />
    </div>
    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{desc}</p>
  </div>
);

export default ExamEditor;
