import { useEffect, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

import supabase, {
  uploadExamFile,
  deleteExamFile,
} from "./supabase";

export default function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    setExams(data || []);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("realtime-exams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exams" },
        loadData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title) return alert("Nhập tiêu đề");

    setLoading(true);

    let fileData = null;

    if (file) {
      fileData = await uploadExamFile(file);
    }

    if (editingId) {
      await supabase
        .from("exams")
        .update({
          title,
          content,
          file_url: fileData?.url,
          file_name: fileData?.fileName,
        })
        .eq("id", editingId);
    } else {
      await supabase.from("exams").insert({
        title,
        content,
        file_url: fileData?.url,
        file_name: fileData?.fileName,
      });
    }

    resetForm();
    setLoading(false);
  };

  const handleDelete = async (exam: any) => {
    if (exam.file_name) {
      await deleteExamFile(exam.file_name);
    }

    await supabase.from("exams").delete().eq("id", exam.id);
  };

  const handleEdit = (exam: any) => {
    setTitle(exam.title);
    setContent(exam.content);
    setEditingId(exam.id);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* FORM */}
        <div className="bg-white p-8 rounded-3xl shadow-lg space-y-4">
          <h2 className="text-3xl font-bold text-indigo-600">
            🚀 Quản lý đề thi Supabase
          </h2>

          <input
            className="w-full border p-4 rounded-xl"
            placeholder="Tiêu đề đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-4 rounded-xl"
            rows={4}
            placeholder="Ví dụ: $$x^2 + y^2 = z^2$$"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 transition"
            >
              {loading ? "Đang lưu..." : "💾 Lưu"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="bg-gray-400 text-white px-6 py-3 rounded-xl"
              >
                Hủy
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-8 rounded-3xl shadow-md space-y-4"
          >
            <h3 className="text-2xl font-semibold">
              {exam.title}
            </h3>

            {exam.content && (
              <div className="bg-slate-50 p-4 rounded-xl">
                {exam.content.includes("$$") ? (
                  <BlockMath
                    math={exam.content.replace(/\$\$/g, "")}
                  />
                ) : (
                  <p>{exam.content}</p>
                )}
              </div>
            )}

            {exam.file_url && (
              <div className="space-y-2">
                {exam.file_url.endsWith(".pdf") ? (
                  <iframe
                    src={exam.file_url}
                    className="w-full h-[500px] rounded-xl border"
                  />
                ) : (
                  <a
                    href={exam.file_url}
                    target="_blank"
                    className="text-indigo-600 underline"
                  >
                    📄 Tải file Word
                  </a>
                )}
              </div>
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
