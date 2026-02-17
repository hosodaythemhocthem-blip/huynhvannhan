import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Copy,
  CheckCircle2,
  FileText
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";

import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

// Cấu hình Worker PDF.js bản ổn định
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface AIQuestion {
  text: string;
  options: string[];
  correctAnswer?: number;
}

interface PreviewExam {
  title: string;
  questions: AIQuestion[];
}

interface Props {
  userId: string;
}

const AiExamGenerator: React.FC<Props> = ({ userId }) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [previewExam, setPreviewExam] = useState<PreviewExam | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ================= 1. XỬ LÝ ĐỌC FILE WORD / PDF ================= */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";

      if (file.name.endsWith(".docx")) {
        // Đọc Word
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.name.endsWith(".pdf")) {
        // Đọc PDF
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        alert("Hệ thống chỉ hỗ trợ định dạng .docx và .pdf");
        return;
      }

      // Nối nội dung mới vào ô văn bản hiện tại
      setTopic((prev) => (prev + "\n\n" + extractedText).trim());
    } catch (error) {
      console.error("Lỗi đọc file:", error);
      alert("Đã xảy ra lỗi khi đọc file. File có thể bị hỏng hoặc bị khóa.");
    } finally {
      setProcessingFile(false);
      if (fileRef.current) fileRef.current.value = ""; // Reset input
    }
  };

  /* ================= 2. GỌI AI GENERATE ================= */
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      // Giới hạn ký tự để AI không bị quá tải
      const data = await geminiService.parseExamWithAI(topic.slice(0, 8000));
      
      if (data?.questions?.length) {
        setPreviewExam(data);
      } else {
        alert("AI không nhận diện được câu hỏi. Vui lòng kiểm tra lại cấu trúc văn bản.");
      }
    } catch (err) {
      console.error(err);
      alert("Hệ thống AI đang bận hoặc gặp sự cố. Thầy vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= 3. THAO TÁC CÂU HỎI (XÓA / NHÂN BẢN) ================= */
  const deleteQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = previewExam.questions.filter((_, i) => i !== index);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  const duplicateQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = [...previewExam.questions];
    // Nhân bản (Ctrl+V) câu hỏi hiện tại và chèn ngay bên dưới
    const clonedQuestion = { ...updatedQuestions[index] };
    updatedQuestions.splice(index + 1, 0, clonedQuestion);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  /* ================= 4. LƯU VĨNH VIỄN LÊN CLOUD ================= */
  const saveToCloud = async () => {
    if (!previewExam || previewExam.questions.length === 0) return;
    setLoading(true);

    try {
      const now = new Date().toISOString();

      // Bước 1: Tạo Đề thi (Exam)
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert({
          title: previewExam.title || "Đề thi tự động bởi AI",
          teacher_id: userId,
          description: "NhanLMS AI Generated",
          is_locked: false,
          is_archived: false,
          file_url: null,
          raw_content: topic,
          total_points: previewExam.questions.length,
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (examError || !examData) throw new Error("Không thể tạo bản ghi Đề thi.");

      // Bước 2: Tạo danh sách Câu hỏi (Questions)
      const questionsToInsert = previewExam.questions.map((q, index) => ({
        exam_id: examData.id,
        content: q.text,
        type: "multiple_choice", 
        options: q.options,
        correct_answer: q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
        points: 1,
        order: index + 1,
        explanation: null,
        section: null,
        created_at: now,
        updated_at: now,
      }));

      const { error: questionError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionError) throw new Error("Lỗi khi lưu danh sách câu hỏi.");

      alert("🎉 Đã lưu đề thi vĩnh viễn lên NhanLMS Cloud thành công!");
      setPreviewExam(null);
      setTopic("");
    } catch (err) {
      console.error(err);
      alert("Quá trình lưu dữ liệu thất bại. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* --- KHU VỰC NHẬP LIỆU --- */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400 w-6 h-6" /> 
            AI Bóc Tách Đề Thông Minh
          </h2>
          
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            ref={fileRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processingFile}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-5 py-2.5 rounded-xl transition-all font-semibold border border-indigo-500/30 w-full md:w-auto justify-center"
          >
            {processingFile ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            Tải lên Word / PDF
          </button>
        </div>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full h-56 p-5 bg-slate-950/50 text-slate-200 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono text-sm leading-relaxed resize-y custom-scrollbar"
          placeholder="Dán nội dung đề thô vào đây hoặc tải lên file Word/PDF. AI của NhanLMS sẽ tự động nhận diện câu hỏi, đáp án và công thức Toán học..."
        />

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || processingFile}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none w-full md:w-auto justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "AI Đang Xử Lý Dữ Liệu..." : "Bắt Đầu Bóc Tách"}
          </button>
        </div>
      </div>

      {/* --- KHU VỰC KẾT QUẢ AI (PREVIEW) --- */}
      {previewExam && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-5">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {previewExam.title || "Đề thi mới"}
            </h3>
            <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-500/20">
              Tổng: {previewExam.questions.length} câu
            </span>
          </div>

          <div className="space-y-5">
            <AnimatePresence>
              {previewExam.questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-800/40 border border-slate-700/50 p-5 md:p-6 rounded-2xl hover:border-indigo-500/40 transition-colors group relative overflow-hidden"
                >
                  {/* Thanh công cụ: Xóa & Nhân bản */}
                  <div className="absolute top-4 right-4 flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity gap-2 bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg border border-slate-600/50">
                    <button
                      onClick={() => duplicateQuestion(i)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-md transition"
                      title="Nhân bản câu này (Ctrl+V)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(i)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-md transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black flex-shrink-0 border border-indigo-500/20">
                      {i + 1}
                    </div>
                    
                    <div className="flex-1 space-y-4 w-full">
                      {/* Nội dung câu hỏi */}
                      <div className="text-slate-200 font-medium text-[15px] leading-relaxed pr-16 md:pr-0">
                        <MathPreview content={q.text} />
                      </div>
                      
                      {/* Đáp án */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {q.options.map((opt, idx) => {
                          const isCorrect = q.correctAnswer === idx;
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                  : "bg-slate-900/50 border-slate-700/50"
                              }`}
                            >
                              <span className={`font-bold mt-0.5 ${isCorrect ? "text-emerald-400" : "text-slate-400"}`}>
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <div className={`flex-1 overflow-x-auto custom-scrollbar ${isCorrect ? "text-emerald-50" : "text-slate-300"}`}>
                                <MathPreview content={opt} />
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
            <button
              onClick={saveToCloud}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
              Lưu Đề Lên NhanLMS Cloud
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
