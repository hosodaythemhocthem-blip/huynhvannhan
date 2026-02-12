import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  ChevronDown,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";
import { Class, Exam, Grade } from "../types";
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
    useState<string>("");
  const [selectedExamId, setSelectedExamId] =
    useState<string>("");

  const [submissions, setSubmissions] =
    useState<SubmissionRow[]>([]);
  const [loading, setLoading] =
    useState<boolean>(false);
  const [error, setError] =
    useState<string | null>(null);

  /* =========================
     LOAD FROM SUPABASE
  ========================= */

  const loadSubmissions = useCallback(async () => {
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

      if (error) {
        throw error;
      }

      const filtered =
        selectedClassId
          ? (data ?? []).filter(
              (s) =>
                s.exams?.class_id ===
                selectedClassId
            )
          : data ?? [];

      setSubmissions(filtered);
    } catch (err: any) {
      setError(
        err?.message ||
          "Không thể tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedExamId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  /* =========================
     DERIVED DATA
  ========================= */

  const filteredExams = useMemo(() => {
    if (!selectedClassId)
      return exams;
    return exams.filter(
      (e) =>
        e.classId ===
        selectedClassId
    );
  }, [exams, selectedClassId]);

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
              (sum, s) =>
                sum + s.score,
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
          : "0.0",
      avg,
    };
  }, [submissions]);

  /* =========================
     ACTIONS
  ========================= */

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Xóa bài nộp này?"
        )
      )
        return;

      try {
        const { error } =
          await supabase
            .from("submissions")
            .delete()
            .eq("id", id);

        if (error) throw error;

        setSubmissions((prev) =>
          prev.filter(
            (s) => s.id !== id
          )
        );
      } catch (err: any) {
        alert(
          err?.message ||
            "Không thể xóa."
        );
      }
    },
    []
  );

  const exportCSV = useCallback(() => {
    if (submissions.length === 0)
      return;

    const header =
      "Student,Exam,Score,Date\n";

    const rows = submissions
      .map((s) => {
        const name =
          s.profiles?.full_name ??
          "Unknown";
        const exam =
          s.exams?.title ??
          "Unknown";
        return `${name},${exam},${s.score},${new Date(
          s.created_at
        ).toLocaleString()}`;
      })
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
    link.setAttribute(
      "download",
      "grades.csv"
    );
    document.body.appendChild(
      link
    );
    link.click();
    document.body.removeChild(
      link
    );
  }, [submissions]);

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* FILTER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-5 items-end">
          <FilterSelect
            label="Chọn lớp"
            value={selectedClassId}
            onChange={
              setSelectedClassId
            }
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
            onChange={
              setSelectedExamId
            }
            options={[
              {
                value: "",
                label:
                  "-- Tất cả đề --",
              },
              ...filteredExams.map(
                (e) => ({
                  value: e.id,
                  label: e.title,
                })
              ),
            ]}
          />

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
            >
              <Download size={16} />
              CSV
            </button>

            <button
              onClick={() => {
                setSelectedClassId("");
                setSelectedExamId("");
              }}
              className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Tổng bài nộp"
          value={stats.total}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Đạt"
          value={stats.passed}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Tỉ lệ đạt (%)"
          value={stats.passRate}
          icon={<AlertTriangle />}
        />
        <StatCard
          label="Điểm TB"
          value={stats.avg}
          icon={<CheckCircle2 />}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">
            {error}
          </div>
        ) : submissions.length ===
          0 ? (
          <div className="p-10 text-center text-slate-400">
            Không có dữ liệu.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">
                  Học sinh
                </th>
                <th className="px-4 py-3 text-left">
                  Đề thi
                </th>
                <th className="px-4 py-3">
                  Điểm
                </th>
                <th className="px-4 py-3">
                  Ngày nộp
                </th>
                <th className="px-4 py-3">
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
                      {s.exams?.title ??
                        "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {s.score}
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

/* =========================
   SMALL COMPONENTS
========================= */

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) => (
  <div className="flex-1 min-w-[220px] space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-sm"
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs uppercase text-slate-400 font-bold">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800 mt-1">
        {value}
