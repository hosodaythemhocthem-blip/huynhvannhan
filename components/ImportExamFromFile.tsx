import { useState } from "react";
import mammoth from "mammoth";
import { Upload, Trash2, Loader2, Save } from "lucide-react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ExamService } from "../services/exam.service";

const MAX_FILE_SIZE_MB = 10;

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

        const { value } = await mammoth.convertToHtml({
          arrayBuffer: buffer,
        });

        setPreview(value);
        setFile(file);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        setPreview(
          `<p class="text-amber-600 font-bold">PDF đã tải lên. Nội dung sẽ được hiển thị sau khi lưu.</p>`
        );
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
      await ExamService.createExam(
        {
          id: "",
          title: file.name,
          description: preview || "",
          teacherId,
        } as any,
        file
      );

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
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
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

      {/* Preview */}
      {preview && (
        <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: preview }}
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Save size={16} />
              Lưu đề
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
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
