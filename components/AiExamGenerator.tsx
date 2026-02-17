// src/components/AiExamGenerator.tsx
import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Copy,
  FileText,
  CheckCircle2
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";

import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

// Cấu hình Worker PDF.js
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

  /* ================= XỬ LÝ FILE WORD / PDF ================= */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";

      if (file.name.endsWith(".docx")) {
        // Đọc file Word bằng Mammoth
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.name.endsWith(".pdf")) {
        // Đọc file PDF bằng PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        alert("Chỉ hỗ trợ file .docx và .pdf");
        return;
      }

      // Nối text từ file vào nội dung hiện tại
      setTopic((prev) => (prev + "\n\n" + extractedText).trim());
    } catch (error) {
      console.error("Lỗi đọc file:", error);
      alert("Đã xảy ra lỗi khi đọc file. Vui lòng thử lại.");
    } finally {
      setProcessingFile(false);
      // Reset input file để có thể upload lại cùng 1 file
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ================= AI GENERATE ================= */
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      // Giới hạn số lượng ký tự để tránh quá tải API (8000 chars)
      const data = await geminiService.parseExamWithAI(topic.slice(0, 8000));
      if (data?.questions?.length) {
        setPreviewExam(data);
      } else {
        alert("AI không nhận diện được cấu trúc đề thi. Vui lòng kiểm tra lại nội dung.");
      }
    } catch (err) {
      console.error(err);
      alert("AI đang bận hoặc gặp lỗi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= THAO TÁC CÂU HỎI (XÓA / NHÂN BẢN) ================= */
  const deleteQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = previewExam.questions.filter((_, i) => i !== index);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  const duplicateQuestion = (index: number) => {
    if (!previewExam) return;
    const updatedQuestions = [...previewExam.questions];
    // Copy câu hỏi và chèn vào ngay sau nó (Tương đương thao tác Ctrl+V)
    const clonedQuestion = { ...updatedQuestions[index] };
    updatedQuestions.splice(index + 1, 0, clonedQuestion);
    setPreviewExam({ ...previewExam, questions: updatedQuestions });
  };

  /* ================= SAVE TO SUPABASE ================= */
  const saveToCloud = async () => {
    if (!previewExam || previewExam.questions.length === 0) return;
    setLoading(true);

    try {
      const now = new Date().toISOString();

      // 1️⃣ Lưu thông tin chung của Đề thi
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert({
          title: previewExam.title || "Đề thi tạo bằng AI",
          teacher_id: userId,
          description: "Được tự động tạo và bóc tách bởi NhanLMS AI",
          is_locked: false,
          is_archived: false,
          total_points: previewExam.questions.length,
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (examError || !examData) throw new Error("Lỗi khi lưu đề thi");

      // 2️⃣ Lưu danh sách câu hỏi
      const questionsToInsert = previewExam.questions.map((q, index) => ({
        exam_id: examData.id,
        content: q.text,
        type: "MCQ", // Có thể mở rộng theo loại câu hỏi sau
        options: q.options,
        correct_answer: q.correctAnswer !== undefined ? String(q.correctAnswer) : null,
        points: 1,
        order: index + 1,
        created_at: now,
        updated_at: now,
      }));

      const { error: questionError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionError) throw new Error("Lỗi khi lưu câu hỏi");

      alert("🎉 Đã lưu đề thi vĩnh viễn lên hệ thống thành công!");
      setPreviewExam(null); // Reset sau khi lưu
      setTopic("");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu đề vào CSDL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* KHU VỰC NHẬP DỮ LIỆU */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400" /> AI Tạo & Bóc Tách Đề Thi
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
            className="flex items-center gap-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 px-4 py-2 rounded-xl transition-all font-medium border border-indigo-500/30"
          >
            {processingFile ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
            Tải lên file Word/PDF
          </button>
        </div>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full h-48 p-4 bg-slate-950/50 text-slate-200 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono text-sm leading-relaxed"
          placeholder="Dán nội dung đề thô vào đây hoặc tải lên file Word/PDF để AI tự động bóc tách..."
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || processingFile}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {loading ? "AI Đang Xử Lý..." : "Bắt Đầu Bóc Tách"}
          </button>
        </div>
      </div>

      {/* KHU VỰC PREVIEW KẾT QUẢ */}
      {previewExam && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {previewExam.title}
            </h3>
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold">
              {previewExam.questions.length} câu hỏi
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {previewExam.questions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl hover:border-indigo-500/50 transition-colors group relative"
                >
                  {/* Thanh công cụ Xóa & Nhân bản */}
                  <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button
                      onClick={() => duplicateQuestion(i)}
                      className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition tooltip"
                      title="Nhân bản (Ctrl+V)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(i)}
                      className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-4">
                      {/* Nội dung câu hỏi (Render Toán học) */}
                      <div className="text-slate-200 font-medium">
                        <MathPreview content={q.text} />
                      </div>
                      
                      {/* Danh sách đáp án */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {q.options.map((opt, idx) => {
                          const isCorrect = q.correctAnswer === idx;
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-slate-900/50 border-slate-700/50"
                              }`}
                            >
                              <span className={`font-bold mt-0.5 ${isCorrect ? "text-emerald-400" : "text-slate-400"}`}>
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <div className={isCorrect ? "text-emerald-100" : "text-slate-300"}>
                                <MathPreview content={opt} />
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0 mt-1" />
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

          <div className="mt-8 flex justify-end">
            <button
              onClick={saveToCloud}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Lưu Đề Vĩnh Viễn Lên Cloud
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
