import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  ChevronDown,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import { Class, Exam } from "../types";
import { supabase } from "../supabase";

/* =========================
   TYPES
========================= */

interface GradeManagementProps {
  classes: Class[];
  exams: Exam[];
}

interface SubmissionRow {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
  } | null;
  exams?: {
    id: string;
    title: string;
    class_id: string;
  } | null;
}

/* =========================
   COMPONENT
========================= */

const GradeManagement: React.FC<
  GradeManagementProps
> = ({ classes, exams }) => {
  const [selectedClassId, setSelectedClassId] =
    useState("");
  const [selectedExamId, setSelectedExamId] =
    useState("");

  const [submissions, setSubmissions] =
    useState<SubmissionRow[]>([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editScore, setEditScore] =
    useState<number>(0);

  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  /* =========================
     LOAD DATA
  ========================= */

  const loadSubmissions = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("submissions")
          .select(
            `
          id,
          exam_id,
          student_id,
          score,
          created_at,
          profiles:student_id (
            id,
            full_name
          ),
          exams:exam_id (
            id,
            title,
            class_id
          )
        `
          )
          .order("created_at", {
            ascending: false,
          });

        if (selectedExamId) {
          query = query.eq(
            "exam_id",
            selectedExamId
          );
        }

        const { data, error } =
          await query;

        if (error) throw error;

        const filtered =
          selectedClassId
            ? (data ?? []).filter(
                (s) =>
                  s.exams?.class_id ===
                  selectedClassId
              )
            : data ?? [];

        if (mounted.current)
          setSubmissions(filtered);
      } catch (err: any) {
        if (mounted.current)
          setError(
            err?.message ||
              "Không thể tải dữ liệu."
          );
      } finally {
        if (mounted.current)
          setLoading(false);
      }
    },
    [selectedClassId, selectedExamId]
  );

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  /* =========================
     UPDATE SCORE
  ========================= */

  const handleSaveScore =
    useCallback(
      async (id: string) => {
        try {
          const { error } =
            await supabase
              .from("submissions")
              .update({
                score: editScore,
              })
              .eq("id", id);

          if (error) throw error;

          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === id
                ? { ...s, score: editScore }
                : s
            )
          );

          setEditingId(null);
        } catch (err: any) {
          alert(
            err?.message ||
              "Không thể cập nhật điểm."
          );
        }
      },
      [editScore]
    );

  /* =========================
     DELETE
  ========================= */

  const handleDelete =
    useCallback(async (id: string) => {
      if (
        !window.confirm(
          "Bạn chắc chắn muốn xóa?"
        )
      )
        return;

      const { error } =
        await supabase
          .from("submissions")
          .delete()
          .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      setSubmissions((prev) =>
        prev.filter((s) => s.id !== id)
      );
    }, []);

  /* =========================
     STATS
  ========================= */

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed =
      submissions.filter(
        (s) => s.score >= 5
      ).length;

    const avg =
      total > 0
        ? (
            submissions.reduce(
              (a, b) =>
                a + b.score,
              0
            ) / total
          ).toFixed(2)
        : "0.00";

    return {
      total,
      passed,
      passRate:
        total > 0
          ? (
              (passed / total) *
              100
            ).toFixed(1)
          : "0",
      avg,
    };
  }, [submissions]);

  /* =========================
     EXPORT CSV
  ========================= */

  const exportCSV = () => {
    if (!submissions.length) return;

    const header =
      "Student,Exam,Score,Date\n";

    const rows = submissions
      .map(
        (s) =>
          `${s.profiles?.full_name ?? ""},${
            s.exams?.title ?? ""
          },${s.score},${new Date(
            s.created_at
          ).toLocaleString()}`
      )
      .join("\n");

    const blob = new Blob(
      [header + rows],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");
    link.href = url;
    link.download = "grades.csv";
    link.click();
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="space-y-8">

      {/* FILTER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex gap-4 flex-wrap">

          <FilterSelect
            label="Chọn lớp"
            value={selectedClassId}
            onChange={setSelectedClassId}
            options={[
              {
                value: "",
                label:
                  "-- Tất cả lớp --",
              },
              ...classes.map(
                (c) => ({
                  value: c.id,
                  label: c.name,
                })
              ),
            ]}
          />

          <FilterSelect
            label="Chọn đề"
            value={selectedExamId}
            onChange={setSelectedExamId}
            options={[
              {
                value: "",
                label:
                  "-- Tất cả đề --",
              },
              ...exams.map(
                (e) => ({
                  value: e.id,
                  label: e.title,
                })
              ),
            ]}
          />

          <button
            onClick={loadSubmissions}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reload
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tổng bài"
          value={stats.total}
        />
        <StatCard
          label="Đạt"
          value={stats.passed}
        />
        <StatCard
          label="Tỉ lệ (%)"
          value={stats.passRate}
        />
        <StatCard
          label="TB"
          value={stats.avg}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        {loading && (
          <div className="p-8 text-center">
            Đang tải...
          </div>
        )}

        {!loading && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  Học sinh
                </th>
                <th className="px-4 py-3 text-left">
                  Đề
                </th>
                <th className="px-4 py-3 text-center">
                  Điểm
                </th>
                <th className="px-4 py-3 text-center">
                  Ngày
                </th>
                <th className="px-4 py-3 text-center">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {submissions.map(
                (s) => (
                  <tr
                    key={s.id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      {s.profiles
                        ?.full_name ??
                        "Unknown"}
                    </td>

                    <td className="px-4 py-3">
                      {s.exams?.title}
                    </td>

                    <td className="px-4 py-3 text-center font-bold">

                      {editingId ===
                      s.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={
                              editScore
                            }
                            onChange={(e) =>
                              setEditScore(
                                Number(
                                  e.target
                                    .value
                                )
                              )
                            }
                            className="w-16 border rounded-lg px-2 py-1 text-center"
                          />
                          <button
                            onClick={() =>
                              handleSaveScore(
                                s.id
                              )
                            }
                            className="text-green-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setEditingId(
                                null
                              )
                            }
                            className="text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingId(
                              s.id
                            );
                            setEditScore(
                              s.score
                            );
                          }}
                          className="cursor-pointer hover:text-blue-600"
                        >
                          {s.score}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {new Date(
                        s.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleDelete(
                            s.id
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* SMALL */

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: any) => (
  <div className="min-w-[220px]">
    <label className="text-xs font-bold text-slate-400">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full border rounded-xl px-3 py-2 mt-1"
    >
      {options.map((o: any) => (
        <option
          key={o.value}
          value={o.value}
        >
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const StatCard = ({
  label,
  value,
}: any) => (
  <div className="bg-white border rounded-2xl p-4 text-center shadow-sm">
    <p className="text-xs text-slate-400 uppercase font-bold">
      {label}
    </p>
    <p className="text-2xl font-black text-slate-800 mt-1">
      {value}
    </p>
  </div>
);

export default GradeManagement;
