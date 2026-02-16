import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Sparkles, Trash2, Upload, Loader2, FileText,
  RotateCcw, BookOpen, ClipboardPaste, CheckCircle2, 
  PlusCircle, Save, X, BrainCircuit, MessageCircle
} from "lucide-react";
import { supabase } from "../supabase";
import { geminiService } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

// Cấu hình PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  course: any;
  onBack: () => void;
  role?: 'teacher' | 'student';
}

const CourseViewer: React.FC<Props> = ({ course, onBack, role = 'student' }) => {
  const isTeacher = role === 'teacher';
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    loadLessons();
  }, [course.id]);

  const loadLessons = async () => {
    const { data } = await (supabase.from('lessons').select('*').eq('course_id', course.id).order('order_index', { ascending: true }) as any);
    if (data) {
      setLessons(data);
      if (data.length > 0) setActiveLesson(data[0]);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm("Thầy Nhẫn muốn xóa bài giảng này vĩnh viễn?")) {
      await (supabase.from('lessons').delete().eq('id', id) as any);
      loadLessons();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiProcessing(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + " ";
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }

      // Dùng AI tạo Quiz từ text
      const aiQuiz = await geminiService.parseExamWithAI(text);
      if (aiQuiz) {
        setQuiz(aiQuiz);
        alert("AI đã trích xuất câu hỏi từ file thành công!");
      }
    } catch (err) {
      alert("Lỗi xử lý file.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handlePasteContent = async () => {
    const text = await navigator.clipboard.readText();
    // Logic cập nhật bài học hiện tại bằng nội dung vừa dán
    alert("Đã nhận nội dung dán!");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header Toolbar */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">{course.title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lớp {course.grade} • Thầy Huỳnh Văn Nhẫn</p>
          </div>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-3">
            <button onClick={handlePasteContent} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <ClipboardPaste size={20} />
            </button>
            <label className="cursor-pointer p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <Upload size={18} /> {isAiProcessing ? "ĐANG XỬ LÝ..." : "TẢI FILE TẠO QUIZ"}
              <input type="file" hidden accept=".pdf,.docx" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Bài giảng */}
        <div className="w-80 bg-white border-r overflow-y-auto p-6 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Nội dung khóa học</h3>
          {lessons.map((lesson, idx) => (
            <div 
              key={lesson.id} 
              onClick={() => setActiveLesson(lesson)}
              className={`p-5 rounded-[1.5rem] cursor-pointer transition-all border relative group ${activeLesson?.id === lesson.id ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${activeLesson?.id === lesson.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {idx + 1}
                </span>
                <span className={`font-bold text-sm truncate ${activeLesson?.id === lesson.id ? 'text-white' : 'text-slate-700'}`}>
                  {lesson.title}
                </span>
              </div>
              {isTeacher && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Vùng hiển thị chính */}
        <main className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {quiz ? (
              <MotionDiv 
                key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                  <div>
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                      <BrainCircuit className="text-indigo-400" /> AI Challenge
                    </h4>
                    <p className="text-indigo-300 text-xs font-bold uppercase mt-2">Bóc tách từ file tài liệu của Thầy</p>
                  </div>
                  <button onClick={() => setQuiz(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <MathPreview content={`${i + 1}. ${q.text}`} className="text-lg font-bold text-slate-800 mb-6" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-4">
                            <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-indigo-600 shadow-sm">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <MathPreview content={opt} className="text-sm font-bold text-slate-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            ) : activeLesson ? (
              <MotionDiv 
                key={activeLesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto bg-white p-12 rounded-[4rem] shadow-sm border border-slate-50"
              >
                <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-8 leading-none">
                  {activeLesson.title}
                </h1>
                <div className="prose prose-slate max-w-none font-medium text-slate-600 leading-loose">
                   {/* Giả lập nội dung bài học */}
                   <MathPreview content={activeLesson.content || "Nội dung bài học đang được Thầy Nhẫn cập nhật..."} />
                </div>
              </MotionDiv>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <BookOpen size={80} className="mb-6 opacity-20" />
                <p className="font-black uppercase tracking-[0.3em] text-xs">Vui lòng chọn bài giảng</p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default CourseViewer;
