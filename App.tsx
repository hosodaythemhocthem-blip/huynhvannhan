import { useEffect, useState, useCallback } from "react";
import { supabase, uploadExamFile, deleteExamFile, getSignedFileUrl } from "./supabase";
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

/* ================= LOGIN COMPONENT ================= */

function LoginForm({ onLogin, loading }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 to-slate-200">
      <div className="bg-white p-10 rounded-3xl shadow-xl space-y-5 w-96">
        <h2 className="text-2xl font-bold text-indigo-600">
          Đăng nhập LMS
        </h2>

        <input
          className="w-full border p-3 rounded-xl"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          onClick={() => onLogin(username, password)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl w-full disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}

/* ================= APP ================= */

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setCheckingAuth(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth changed:", session);
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const toEmail = (username: string) =>
    `${username.trim().toLowerCase()}@lms.local`;

  const handleLogin = async (username: string, password: string) => {
    if (!username || !password) {
      return alert("Nhập đầy đủ thông tin");
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });

    setLoading(false);

    if (error) {
      alert("Sai tài khoản hoặc mật khẩu");
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

    if (!error && data) {
      const enriched = await Promise.all(
        data.map(async (exam) => {
          if (exam.file_name) {
            const signedUrl = await getSignedFileUrl(exam.file_name);
            return { ...exam, file_url: signedUrl };
          }
          return exam;
        })
      );

      setExams(enriched);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  /* ================= UI FLOW ================= */

  if (checkingAuth) {
    return <div className="p-10">Đang kiểm tra đăng nhập...</div>;
  }

  if (!session) {
    return <LoginForm onLogin={handleLogin} loading={loading} />;
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

        {/* FORM + LIST CỦA BẠN ĐẶT Ở ĐÂY */}
      </div>
    </div>
  );
}
