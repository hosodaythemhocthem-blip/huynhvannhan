import { useEffect, useState, useCallback } from "react";
import { supabase, uploadExamFile, deleteExamFile } from "./supabase";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

/* ================= TYPES ================= */

interface Exam {
  id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  user_id: string;
}

/* ================= APP ================= */

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /* ================= LOAD DATA ================= */

  const loadData = useCallback(async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error) setExams(data || []);
  }, [session]);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!title.trim()) return alert("Nhập tiêu đề");

    setLoading(true);

    let fileUrl = editingExam?.file_url || null;
    let fileName = editingExam?.file_name || null;

    if (file) {
      const uploaded = await uploadExamFile(file);
      if (uploaded) {
        fileUrl = uploaded.url;
        fileName = uploaded.fileName;
      }
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
        user_id: session.user.id,
      });
    }

    await loadData();
    resetForm();
    setLoading(false);
  };

  const handleDelete = async (exam: Exam) => {
    if (!confirm("Xác nhận xóa?")) return;

    if (exam.file_name) await deleteExamFile(exam.file_name);

    await supabase.from("exams").delete().eq("id", exam.id);

    await loadData();
  };

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
          <BlockMath key={index}>
            {part.replace(/\$\$/g, "")}
          </BlockMath>
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

  /* ================= LOGIN UI ================= */

  if (checkingAuth) return <div className="p-10">Đang kiểm tra đăng nhập...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 to-slate-200">
        <div className="bg-white p-10 rounded-3xl shadow-xl space-y-5 w-96">
          <h2 className="text-2xl font-bold text-indigo-600">Đăng nhập LMS</h2>

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border p-3 rounded-xl"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={handleLogin}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl w-full disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </div>
    );
  }

  /* ================= LMS UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-100 p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-indigo-600">
            🚀 LMS Supabase PRO
          </h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Đăng xuất
          </button>
        </div>

        {/* Bạn giữ nguyên form + list như cũ */}

      </div>
    </div>
  );
}
