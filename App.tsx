import { useEffect, useState } from "react";
import { supabase, uploadExamFile, deleteExamFile } from "./supabase";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Exam {
  id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export default function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  /* ================= LOAD ================= */

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExams(data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!title.trim()) return alert("Nhập tiêu đề");

    try {
      setLoading(true);

      let fileUrl = editingExam?.file_url || null;
      let fileName = editingExam?.file_name || null;

      if (file) {
        const uploaded = await uploadExamFile(file);
        if (!uploaded) throw new Error("Upload thất bại");

        fileUrl = uploaded.url;
        fileName = uploaded.fileName;
      }

      if (editingExam) {
        await supabase
          .from("exams")
          .update({ title, content, file_url: fileUrl, file_name: fileName })
          .eq("id", editingExam.id);
      } else {
        await supabase.from("exams").insert({
          title,
          content,
          file_url: fileUrl,
          file_name: fileName,
        });
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (exam: Exam) => {
    if (!confirm("Xác nhận xóa?")) return;

    try {
      if (exam.file_name) {
        await deleteExamFile(exam.file_name);
      }

      await supabase.from("exams").delete().eq("id", exam.id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (exam: Exam) => {
    setTitle(exam.title);
    setContent(exam.content);
    setEditingExam(exam);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setEditingExam(null);
  };

  /* ================= RENDER MATH ================= */

  const renderMath = (text: string) => {
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$$")) {
        return (
          <div key={index} className="my-4">
            <BlockMath>{part.replace(/\$\$/g, "")}</BlockMath>
          </div>
        );
      }

      if (part.startsWith("$")) {
        return (
          <InlineMath key={index}>
            {part.replace(/\$/g, "")}
          </InlineMath>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-100 p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="bg-white p-8 rounded-3xl shadow-xl space-y-5">
          <h2 className="text-3xl font-bold text-indigo-600">
            🚀 LMS Supabase PRO
          </h2>

          <input
            className="w-full border p-4 rounded-xl"
            placeholder="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-4 rounded-xl"
            rows={4}
            placeholder="Viết công thức như: $$x^2 + y^2 = z^2$$"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:scale-105 transition"
            >
              {loading ? "Đang lưu..." : "💾 Lưu"}
            </button>

            {editingExam && (
              <button
                onClick={resetForm}
                className="bg-gray-400 text-white px-6 py-3 rounded-xl"
              >
                Hủy
              </button>
            )}
          </div>
        </div>

        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-8 rounded-3xl shadow-md space-y-4"
          >
            <h3 className="text-2xl font-semibold">{exam.title}</h3>

            {exam.content && (
              <div className="bg-slate-50 p-4 rounded-xl text-lg">
                {renderMath(exam.content)}
              </div>
            )}

            {exam.file_url && (
              <iframe
                src={exam.file_url}
                className="w-full h-[600px] rounded-xl border"
              />
            )}

            <div className="flex gap-4">
              <button
                onClick={() => handleEdit(exam)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
              >
                ✏️ Sửa
              </button>

              <button
                onClick={() => handleDelete(exam)}
                className="bg-red-600 text-white px-4 py-2 rounded-xl"
              >
                ❌ Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
