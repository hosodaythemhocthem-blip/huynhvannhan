import { useEffect, useState } from "react";
import { BlockMath } from "react-katex";
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

  const handleSave = async () => {
    if (!title) return alert("Nhập tiêu đề");

    let fileData = null;

    if (file) {
      fileData = await uploadExamFile(file);
    }

    await supabase.from("exams").insert({
      title,
      content,
      file_url: fileData?.url || null,
      file_name: fileData?.fileName || null,
    });

    setTitle("");
    setContent("");
    setFile(null);
  };

  const handleDelete = async (exam: any) => {
    if (exam.file_name) {
      await deleteExamFile(exam.file_name);
    }

    await supabase
      .from("exams")
      .delete()
      .eq("id", exam.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      <div className="max-w-4xl mx-auto space-y-6">

        {/* FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-card space-y-4">
          <h2 className="text-2xl font-bold text-primary-600">
            Quản lý đề thi
          </h2>

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Tiêu đề đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-xl"
            rows={4}
            placeholder="Nhập nội dung (vd: $$x^2 + y^2 = z^2$$)"
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

          <button
            onClick={handleSave}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-500 transition"
          >
            💾 Lưu đề
          </button>
        </div>

        {/* LIST */}
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-6 rounded-2xl shadow-soft"
          >
            <h3 className="text-xl font-semibold">
              {exam.title}
            </h3>

            {exam.content && (
              <div className="mt-3">
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
              <div className="mt-4">
                <iframe
                  src={exam.file_url}
                  className="w-full h-[400px] rounded-xl border"
                />
              </div>
            )}

            <button
              onClick={() => handleDelete(exam)}
              className="mt-4 bg-danger text-white px-4 py-2 rounded-xl"
            >
              ❌ Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
