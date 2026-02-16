
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  Sparkles,
  Trash2,
  Upload,
  Loader2,
  FileText,
  RotateCcw,
  BookOpen,
  ClipboardPaste,
  CheckCircle2,
  BrainCircuit,
  FileSearch,
  Download,
  Eye,
  Send,
  // Fix: Added PlusCircle to imports
  PlusCircle
} from "lucide-react";
import { supabase } from "../supabase";
import { askGemini, geminiService } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Cấu hình PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Props {
  course: any;
  onBack: () => void;
  role?: 'teacher' | 'student';
}

const CourseViewer: React.FC<Props> = ({ course, onBack, role = 'student' }) => {
  const isTeacher = role === 'teacher';
  const [lessons, setLessons] = useState<any[]>(course.lessons || []);
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id || null);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  const [quiz, setQuiz] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải dữ liệu bài học chi tiết
  useEffect(() => {
    if (activeLessonId) {
      const lesson = lessons.find(l => l.id === activeLessonId);
      setActiveLesson(lesson);
      setQuiz(null);
      setScore(null);
      setSelectedAnswers({});
    }
  }, [activeLessonId, lessons]);

  // 2. Trích xuất text từ Word/PDF để học tập
  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      return text;
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    return "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLesson) return;

    setUploading(true);
    try {
      const extractedText = await extractTextFromFile(file);
      // Cập nhật bài học với nội dung mới từ file
      const updatedLesson = { ...activeLesson, content: extractedText, file_name: file.name };
      await supabase.from('lessons').update(activeLesson.id, updatedLesson);
      
      setLessons(prev => prev.map(l => l.id === activeLesson.id ? updatedLesson : l));
      setActiveLesson(updatedLesson);
      alert("Đã trích xuất nội dung file vào bài học vĩnh viễn!");
    } catch (err) {
      alert("Lỗi xử lý file: " + err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. AI Sinh đề trắc nghiệm từ nội dung bài học
  const handleGenerateQuiz = async () => {
    if (!activeLesson?.content) return alert("Bài học chưa có nội dung để AI tạo đề!");
    
    setLoadingAI(true);
    try {
      const data = await geminiService.parseExamWithAI(`Tạo 5 câu hỏi trắc nghiệm toán học từ nội dung này: ${activeLesson.content}`);
      if (data && data.questions) {
        setQuiz(data);
      }
    } catch (err) {
      alert("AI đang bận, Thầy Nhẫn hãy thử lại sau nhé!");
    } finally {
      setLoadingAI(false);
    }
  };

  // 4. Xử lý Paste (Ctrl + V)
  const handlePasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const updatedLesson = { ...activeLesson, content: activeLesson.content + "\n" + text };
      await supabase.from('lessons').update(activeLesson.id, updatedLesson);
      setActiveLesson(updatedLesson);
      setLessons(prev => prev.map(l => l.id === activeLesson.id ? updatedLesson : l));
    } catch (err) {
      alert("Hãy dùng phím Ctrl + V");
    }
  };

  // 5. Xóa bài học vĩnh viễn
  const deleteActiveLesson = async () => {
    if (confirm("Thầy Nhẫn chắc chắn muốn xóa vĩnh viễn bài học này?")) {
      await supabase.from('lessons').delete(activeLesson.id);
      const newLessons = lessons.filter(l => l.id !== activeLesson.id);
      setLessons(newLessons);
      setActiveLessonId(newLessons[0]?.id || null);
    }
  };

  const submitQuiz = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === q.correctAnswer) correct++;
    });
    setScore(Math.round((correct / quiz.questions.length) * 10));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* SIDEBAR: Lesson Navigation */}
      <aside className="lg:w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all group"
        >
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-all">
             <ChevronLeft size={18} />
          </div>
          Quay lại khóa học
        </button>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Nội dung bài học</h4>
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLessonId(l.id)}
              className={`w-full text-left p-5 rounded-2xl transition-all flex items-center gap-4 group
                ${l.id === activeLessonId 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                  : "hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${l.id === activeLessonId ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                <FileText size={16} />
              </div>
              <span className="text-sm font-bold truncate">{l.title}</span>
            </button>
          ))}
        </div>

        {isTeacher && (
           <button className="w-full py-4 border-2 border-dashed border-slate-100 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
              <PlusCircle size={16} /> Thêm bài học mới
           </button>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 space-y-8">
        {activeLesson ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Lesson Header */}
            <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 block">Bài giảng chi tiết</span>
                       <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{activeLesson.title}</h2>
                    </div>
                    {isTeacher && (
                      <div className="flex gap-2">
                        <button onClick={handlePasteContent} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all" title="Dán nội dung (Ctrl+V)">
                           <ClipboardPaste size={20} />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all" title="Tải Word/PDF">
                           {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        </button>
                        <button onClick={deleteActiveLesson} className="p-4 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-2xl transition-all" title="Xóa vĩnh viễn">
                           <Trash2 size={20} />
                        </button>
                        <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx" onChange={handleFileUpload} />
                      </div>
                    )}
                  </div>

                  <div className="prose prose-indigo max-w-none">
                     <MathPreview content={activeLesson.content || "_Chưa có nội dung bài học. Thầy hãy tải file hoặc dán nội dung vào nhé!_"} className="text-lg text-slate-600 leading-relaxed font-medium" />
                  </div>
               </div>
            </div>

            {/* AI TOOLS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
                  <BrainCircuit size={80} className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black mb-4">Lumina AI Quiz</h3>
                     <p className="text-indigo-200 text-sm font-medium mb-8">Tự động tạo bộ câu hỏi trắc nghiệm thông minh từ nội dung bài giảng để ôn tập tức thì.</p>
                     <button 
                        onClick={handleGenerateQuiz}
                        disabled={loadingAI}
                        className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3"
                     >
                        {loadingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-indigo-600" />}
                        SINH ĐỀ AI NGAY
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between group">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-3">
                       <FileSearch className="text-emerald-500" /> Tài liệu đính kèm
                    </h3>
                    <p className="text-slate-400 text-sm font-medium mb-6">Tải xuống các tài liệu bổ trợ hoặc xem trực tiếp các file Word/PDF đã trích xuất.</p>
                  </div>
                  {activeLesson.file_name ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-100">
                       <div className="flex items-center gap-3">
                          <FileText className="text-emerald-600" size={20} />
                          <span className="text-xs font-black text-emerald-700 truncate max-w-[150px]">{activeLesson.file_name}</span>
                       </div>
                       <div className="flex gap-2">
                          <button className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                             <Eye size={16} />
                          </button>
                          <button className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">
                             <Download size={16} />
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-slate-50 rounded-2xl text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                       Chưa có file đính kèm
                    </div>
                  )}
               </div>
            </div>

            {/* QUIZ DISPLAY AREA */}
            {quiz && (
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-12 animate-in slide-in-from-bottom-12 duration-1000">
                 <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 tracking-tight">Thử thách ôn tập</h4>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Được tạo bởi Lumina AI</p>
                    </div>
                    {score !== null && (
                      <div className="flex items-center gap-4 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl">
                         <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Điểm số:</span>
                         <span className="text-3xl font-black">{score}/10</span>
                      </div>
                    )}
                 </div>

                 <div className="space-y-10">
                    {quiz.questions.map((q: any, idx: number) => (
                      <div key={idx} className="space-y-6 group">
                         <div className="flex gap-6">
                            <span className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg flex-shrink-0">
                               {idx + 1}
                            </span>
                            <div className="flex-1">
                               <MathPreview content={q.text} className="text-lg font-bold text-slate-800 leading-relaxed mb-6" />
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {q.options.map((opt: string, oIdx: number) => {
                                    const char = String.fromCharCode(65 + oIdx);
                                    const isSelected = selectedAnswers[idx] === char;
                                    const isCorrect = score !== null && q.correctAnswer === char;
                                    return (
                                      <button
                                        key={oIdx}
                                        onClick={() => score === null && setSelectedAnswers(prev => ({ ...prev, [idx]: char }))}
                                        className={`p-6 rounded-2xl border-2 text-left flex items-center gap-4 transition-all relative overflow-hidden
                                          ${isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-lg" : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200"}
                                          ${score !== null && isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-900" : ""}
                                          ${score !== null && isSelected && !isCorrect ? "bg-rose-50 border-rose-500 text-rose-900" : ""}`}
                                      >
                                         <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm
                                           ${isSelected ? "bg-indigo-600 text-white" : "bg-white text-slate-400"}`}>
                                           {char}
                                         </span>
                                         <MathPreview content={opt} />
                                         {score !== null && isCorrect && <CheckCircle2 className="absolute right-6 text-emerald-600" size={20} />}
                                      </button>
                                    );
                                  })}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>

                 {score === null ? (
                   <button 
                      onClick={submitQuiz}
                      className="w-full md:w-auto bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 mx-auto"
                   >
                      <Send size={24} /> NỘP BÀI KIỂM TRA
                   </button>
                 ) : (
                   <div className="flex flex-col md:flex-row gap-4 justify-center">
                      <button onClick={() => { setScore(null); setSelectedAnswers({}); }} className="flex items-center gap-3 px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all">
                         <RotateCcw size={18} /> LÀM LẠI THỬ THÁCH
                      </button>
                      <button onClick={() => setQuiz(null)} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl">
                         <CheckCircle2 size={18} /> HOÀN THÀNH BÀI HỌC
                      </button>
                   </div>
                 )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-slate-100 border-dashed">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 mb-8 animate-float">
               <BookOpen size={64} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Bắt đầu hành trình tri thức</h3>
            <p className="text-slate-400 max-w-xs font-medium">Hãy chọn một bài học ở danh sách bên trái để khám phá nội dung và chinh phục thử thách AI nhé.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
