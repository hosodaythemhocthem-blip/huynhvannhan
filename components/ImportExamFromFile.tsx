import { useState, useCallback } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import DOMPurify from "dompurify";
import {
  Upload,
  Trash2,
  Loader2,
  Save,
  Clipboard,
  Pencil,
} from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ExamService } from "../services/exam.service";
import { supabase } from "../supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_FILE_SIZE_MB = 10;
const BUCKET = "exam-files";

export default function ImportExamFromFile({
  teacherId,
  onCreated,
}: {
  teacherId: string;
  onCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  /* =========================
     PARSE LATEX
  ========================= */
  const renderMath = (content: string) => {
    const blocks = content.split("$$");

    return blocks.map((block, i) => {
      if (i % 2 === 1) {
        return <BlockMath key={i}>{block}</BlockMath>;
      }

      const inlineParts = block.split("$");

      return inlineParts.map((part, j) =>
        j % 2 === 1 ? (
          <InlineMath key={`${i}-${j}`}>{part}</InlineMath>
        ) : (
          <span
            key={`${i}-${j}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(part),
            }}
          />
        )
      );
    });
  };

  /* =========================
     SPLIT QUESTIONS
  ========================= */
  const splitQuestions = (text: string) => {
    const cleaned = text.replace(/\r/g, "");
    return cleaned
      .split(/\n\s*\n/)
      .map((q) => q.trim())
      .filter(Boolean);
  };

  /* =========================
     HANDLE FILE
  ========================= */
  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert("File quá lớn");
      return;
    }

    setLoading(true);

    try {
      let content = "";

      if (file.name.endsWith(".docx")) {
        const buffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
        content = value;
      } else if (file.name.endsWith(".pdf")) {
        const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map((s: any) => s.str).join(" ") + "\n\n";
        }
      } else {
        alert("Không hỗ trợ định dạng này");
        return;
      }

      setFile(file);
      setQuestions(splitQuestions(content));
    } catch (err) {
      console.error(err);
      alert("Lỗi đọc file");
    }

    setLoading(false);
  };

  /* =========================
     SAVE EXAM
  ========================= */
  const handleSave = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const filePath = `${teacherId}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      await ExamService.createExam({
        title: file.name,
        teacherId,
        fileUrl: data.publicUrl,
        questions,
      } as any);

      alert("Lưu đề thành công");

      setQuestions([]);
      setFile(null);

      onCreated?.();
    } catch (err) {
      console.error(err);
      alert("Lỗi lưu đề");
    }

    setLoading(false);
  };

  /* =========================
     DELETE QUESTION
  ========================= */
  const deleteQuestion = (index: number) => {
    if (!confirm("Xóa câu này?")) return;

    setQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* =========================
     PASTE
  ========================= */
  const pasteQuestion = async (index: number) => {
    const text = await navigator.clipboard.readText();
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index ? text : q
      )
    );
  };

  /* =========================
     EDIT
  ========================= */
  const saveEdit = () => {
    if (editingIndex === null) return;

    setQuestions((prev) =>
      prev.map((q, i) =>
        i === editingIndex ? editValue : q
      )
    );

    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">

      <label className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg">
        {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
        Upload Word / PDF
        <input
          type="file"
          accept=".docx,.pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow border space-y-4">

              {editingIndex === index ? (
                <>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full border rounded-xl p-3"
                  />
                  <button
                    onClick={saveEdit}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Lưu chỉnh sửa
                  </button>
                </>
              ) : (
                <div className="prose max-w-none">
                  {renderMath(q)}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingIndex(index);
                    setEditValue(q);
                  }}
                  className="bg-yellow-500 text-white px-3 py-2 rounded-xl flex items-center gap-2"
                >
                  <Pencil size={16} /> Sửa
                </button>

                <button
                  onClick={() => deleteQuestion(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded-xl flex items-center gap-2"
                >
                  <Trash2 size={16} /> Xóa
                </button>

                <button
                  onClick={() => pasteQuestion(index)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-2"
                >
                  <Clipboard size={16} /> Ctrl + V
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2"
          >
            <Save size={18} /> Lưu toàn bộ đề
          </button>
        </div>
      )}
    </div>
  );
}
