import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Copy,
  CheckCircle2,
  FileText,
  X,
  AlertCircle,
  Plus
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";

// Giả định component MathPreview đã có sẵn và hoạt động tốt với LaTeX
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

// Cấu hình Worker cho PDF.js (Sử dụng CDN ổn định)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- TYPES ---
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
  // --- STATE ---
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [previewExam, setPreviewExam] = useState<PreviewExam | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // --- 1. XỬ LÝ FILE (WORD / PDF) & DRAG DROP ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setProcessingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";

      if (file.name.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.name.endsWith(".pdf")) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const maxPages = pdf.numPages;
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          extractedText += pageText + "\n";
        }
      } else {
        alert("Định dạng không hỗ trợ! Vui lòng dùng .docx hoặc .pdf");
        return;
      }

      setTopic((prev) => (prev + "\n\n" + extractedText).trim());
    } catch (error) {
      console.error("Lỗi đọc file:", error);
      alert("Không thể đọc file. Vui lòng kiểm tra lại file của bạn.");
    } finally {
      setProcessingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // --- 2. XỬ LÝ AI (GEMINI) ---
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      // Giới hạn context window để đảm bảo tốc độ
      const context = topic.slice(0, 12000); 
      const data = await geminiService.parseExamWithAI(context);
      
      if (data?.questions?.length) {
        setPreviewExam(data);
      } else {
        alert("AI chưa nhận diện được câu hỏi nào. Hãy thử lại với nội dung rõ ràng hơn.");
      }
    } catch (err) {
      console.error(err);
      alert("Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. CRUD TRÊN GIAO DIỆN (XÓA / NHÂN BẢN) ---
  const deleteQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = previewExam.questions.filter((_, i) => i !== index);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  const duplicateQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = [...previewExam.questions];
    // Copy sâu (Deep copy) để tránh tham chiếu
    const clonedQuestion = JSON.parse(JSON.stringify(updatedQuestions[index]));
    updatedQuestions.splice(index + 1, 0, clonedQuestion);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  const clearTopic = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ nội dung đã nhập?")) {
      setTopic("");
    }
  };

  // --- 4. LƯU VÀO SUPABASE ---
  const saveToCloud = async () => {
    if (!previewExam || previewExam.questions.length === 0) return;
    if (!userId) {
      alert("Lỗi: Không tìm thấy thông tin giáo viên. Vui lòng đăng nhập lại.");
      return;
    }
    setLoading(true);

    try {
      const now = new Date().toISOString();

      // 4.1 Tạo Exam
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert({
          title: previewExam.title || "Đề thi AI Generated",
          teacher_id: userId,
          description: "Đề thi được tạo tự động bởi NhanLMS AI",
          is_locked: false,
          is_archived: false,
          raw_content: topic.slice(0, 5000), // Lưu một phần raw content để tham khảo
          total_points: previewExam.questions.length,
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (examError || !examData) throw new Error("Lỗi tạo đề thi: " + examError?.message);

      // 4.2 Tạo Questions
      const questionsToInsert = previewExam.questions.map((q, index) => ({
        exam_id: examData.id,
        content: q.text,
        type: "multiple_choice", 
        options: q.options,
        correct_answer: q.correctAnswer !== undefined ? String(q.correctAnswer) : "0",
        points: 1,
        order: index + 1,
        created_at: now,
        updated_at: now,
      }));

      const { error: questionError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionError) throw new Error("Lỗi lưu câu hỏi: " + questionError.message);

      alert("🎉 Đã lưu đề thi thành công vào hệ thống!");
      setPreviewExam(null);
      setTopic("");
    } catch (err: any) {
      console.error(err);
      alert(`Lưu thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          AI Trợ Lý Soạn Đề - NhanLMS
        </h1>
        <p className="text-slate-400">Tải lên file Word/PDF hoặc dán nội dung để AI bóc tách tự động</p>
      </div>

      {/* INPUT AREA */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow Effect Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Sparkles className="text-indigo-400 w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-200">Nội dung thô</span>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
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
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-600/50 transition-all text-sm font-medium"
                >
                    {processingFile ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    Tải file lên
                </button>
                {topic && (
                    <button 
                        onClick={clearTopic}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors"
                        title="Xóa nội dung"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Text Area / Drop Zone */}
        <div 
            className={`relative transition-all duration-300 ${dragActive ? "scale-[1.01]" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={`w-full h-64 p-5 bg-slate-950/50 text-slate-200 border-2 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-600 font-mono text-sm leading-relaxed resize-y custom-scrollbar
                ${dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700/50"}`}
                placeholder="Kéo thả file Word/PDF vào đây hoặc dán nội dung đề thi..."
            />
            
            {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl pointer-events-none">
                    <div className="text-center text-indigo-400">
                        <Upload className="w-10 h-10 mx-auto mb-2 animate-bounce" />
                        <p className="font-bold">Thả file vào đây để AI xử lý</p>
                    </div>
                </div>
            )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || processingFile}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/25 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            <span>{loading ? "Đang Phân Tích Dữ Liệu..." : "Bóc Tách Đề Thi Ngay"}</span>
          </button>
        </div>
      </div>

      {/* RESULT PREVIEW SECTION */}
      {previewExam && (
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-700/50 gap-4">
            <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                    {previewExam.title || "Kết Quả Bóc Tách"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Đã tìm thấy {previewExam.questions.length} câu hỏi</span>
                </div>
            </div>
            
            <button
              onClick={saveToCloud}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Lưu Vào Thư Viện
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {previewExam.questions.map((q, i) => (
                <motion.div
                  key={`${i}-${q.text.substring(0, 10)}`} // Unique key trick
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                >
                    {/* Floating Action Bar */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-lg z-10">
                        <button
                            onClick={() => duplicateQuestion(i)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors tooltip-trigger"
                            title="Nhân bản (Ctrl+V)"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-1" />
                        <button
                            onClick={() => deleteQuestion(i)}
                            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
                            title="Xóa câu này"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                  <div className="flex gap-5">
                    {/* Question Number */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-indigo-300 flex items-center justify-center font-bold border border-indigo-500/20 shadow-inner">
                            {i + 1}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="mb-4 text-slate-200 font-medium text-base leading-relaxed">
                        <MathPreview content={q.text} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, idx) => {
                          const isCorrect = String(q.correctAnswer) === String(idx);
                          return (
                            <div
                              key={idx}
                              className={`relative p-3.5 pl-4 rounded-xl border flex items-start gap-3 transition-all ${
                                isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                  : "bg-slate-900/50 border-slate-700/30 hover:bg-slate-700/50"
                              }`}
                            >
                                <span className={`font-bold mt-0.5 text-sm ${isCorrect ? "text-emerald-400" : "text-slate-500"}`}>
                                    {String.fromCharCode(65 + idx)}.
                                </span>
                                <div className={`flex-1 overflow-x-auto custom-scrollbar text-sm ${isCorrect ? "text-emerald-100" : "text-slate-300"}`}>
                                    <MathPreview content={opt} />
                                </div>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute top-3 right-3" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add Button at bottom */}
            {previewExam.questions.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Danh sách câu hỏi trống</p>
                </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AiExamGenerator;
