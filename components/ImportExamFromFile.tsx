import { useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import DOMPurify from "dompurify";
import { Upload, Trash2, Loader2, Save } from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ExamService } from "../services/exam.service";
import { supabase } from "../lib/supabase";

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
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

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
          <span key={`${i}-${j}`} dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(part),
          }} />
        )
      );
    });
  };

  /* =========================
     HANDLE FILE
  ========================= */
  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File quá lớn (> ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    setLoading(true);

    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const buffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });

        setPreview(value);
        setFile(file);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((s: any) => s.str).join(" ") + "\n";
        }

        setPreview(text);
        setFile(file);
      } else {
        alert("Định dạng không hỗ trợ");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi đọc file");
    }

    setLoading(false);
  };

  /* =========================
     SAVE TO SUPABASE
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

      await ExamService.createExam(
        {
          id: "",
          title: file.name,
          description: preview || "",
          teacherId,
          fileUrl: data.publicUrl,
        } as any,
        file
      );

      alert("Lưu đề thành công!");

      setPreview(null);
      setFile(null);

      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      alert("Lỗi lưu đề");
    }

    setLoading(false);
  };

  /* =========================
     DELETE PREVIEW
  ========================= */
  const handleDelete = () => {
    if (confirm("Bạn có chắc muốn xóa preview?")) {
      setPreview(null);
      setFile(null);
    }
  };

  return (
    <div className="space-y-6">

      <label className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
        {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
        Upload Word / PDF
        <input
          type="file"
          accept=".docx,.pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {preview && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border space-y-6">

          <div className="prose max-w-none text-slate-800 leading-relaxed">
            {renderMath(preview)}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <Save size={16} />
              Lưu đề
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <Trash2 size={16} />
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
