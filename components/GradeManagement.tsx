import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Search,
  Trash2,
  Save,
  X,
  RefreshCw,
  Trophy,
  Users,
  BarChart3,
  CheckCircle2,
  ClipboardPaste,
  Filter,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";

/* ================= TYPES ================= */

interface GradeManagementProps {
  classes?: any[];
  exams?: any[];
}

interface SubmissionRow {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  student_name?: string;
  exam_title?: string;
  created_at: string;
}

/* ================= COMPONENT ================= */

const GradeManagement: React.FC<GradeManagementProps> = ({
  classes = [],
  exams = [],
}) => {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  /* ================= LOAD ================= */

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (err) {
      console.error("Lỗi tải bảng điểm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed = submissions.filter((s) => s.score >= 5).length;
    const avg =
      total > 0
        ? (
            submissions.reduce((a, b) => a + b.score, 0) / total
          ).toFixed(1)
        : "0.0";
    const excellence = submissions.filter((s) => s.score >= 8).length;

    return { total, passed, avg, excellence };
  }, [submissions]);

  const filteredData = useMemo(() => {
    return submissions.filter((s) =>
      (s.student_name || "Học sinh")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [submissions, searchTerm]);

  /* ================= UPDATE SCORE ================= */

  const handleUpdateScore = async (id: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ score: editScore })
        .eq("id", id);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, score: editScore } : s
        )
      );

      setEditingId(null);
    } catch (err) {
      alert("Lỗi cập nhật điểm.");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa vĩnh viễn bản ghi điểm này?")) return;

    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.filter((s) => s.id !== id)
      );
    } catch (err) {
      alert("Lỗi khi xóa.");
    }
  };

  /* ================= BULK PASTE ================= */

  const handlePasteGrades = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const scores = text
        .split("\n")
        .map((s) => parseFloat(s))
        .filter((s) => !isNaN(s));

      if (!scores.length) return;

      if (
        !confirm(
          `Cập nhật ${scores.length} học sinh đầu tiên?`
        )
      )
        return;

      for (let i = 0; i < scores.length; i++) {
        if (!submissions[i]) break;

        await supabase
          .from("submissions")
          .update({ score: scores[i] })
          .eq("id", submissions[i].id);
      }

      await loadSubmissions();
      alert("Đã cập nhật hàng loạt thành công!");
    } catch {
      alert("Không thể đọc clipboard.");
    }
  };

  /* ================= EXPORT CSV ================= */

  const exportCSV = () => {
    const header = "Học sinh,Đề thi,Điểm,Ngày nộp\n";

    const rows = filteredData
      .map(
        (s) =>
          `${s.student_name || "HS"},${s.exam_title || "Đề"},${
            s.score
          },${new Date(s.created_at).toLocaleDateString()}`
      )
      .join("\n");

    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BangDiem_${Date.now()}.csv`;
    link.click();
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard label="Tổng bài" value={stats.total} icon={<Users />} />
        <StatCard label="TB" value={stats.avg} icon={<BarChart3 />} />
        <StatCard
          label="Đạt"
          value={`${stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}%`}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Giỏi"
          value={stats.excellence}
          icon={<Trophy />}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <input
          placeholder="Tìm học sinh..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={handlePasteGrades}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          <ClipboardPaste size={16} /> Dán điểm
        </button>

        <button
          onClick={exportCSV}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="p-4">Học sinh</th>
              <th>Đề</th>
              <th className="text-center">Điểm</th>
              <th className="text-center">Ngày</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-10">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredData.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-4 font-bold">
                  {s.student_name || "Học sinh"}
                </td>

                <td>
                  <MathPreview content={s.exam_title || "Đề"} />
                </td>

                <td className="text-center">
                  {editingId === s.id ? (
                    <>
                      <input
                        type="number"
                        value={editScore}
                        onChange={(e) =>
                          setEditScore(parseFloat(e.target.value))
                        }
                        className="w-16 border text-center"
                      />
                      <button onClick={() => handleUpdateScore(s.id)}>
                        <Save size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span
                      onClick={() => {
                        setEditingId(s.id);
                        setEditScore(s.score);
                      }}
                      className="cursor-pointer font-bold"
                    >
                      {s.score.toFixed(1)}
                    </span>
                  )}
                </td>

                <td className="text-center text-sm">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>

                <td className="text-right pr-4">
                  <button onClick={() => handleDelete(s.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={loadSubmissions}
        className="fixed bottom-10 right-10 bg-white border p-4 rounded-xl shadow-lg"
      >
        <RefreshCw />
      </button>
    </div>
  );
};

/* ================= STAT CARD ================= */

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactElement;
}> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-xl border flex items-center gap-4">
    {icon}
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default GradeManagement;
