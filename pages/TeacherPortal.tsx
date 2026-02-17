// pages/TeacherPortal.tsx
import React, { useEffect, useState } from "react";
import { User, Exam } from "../types";
import { supabase } from "../supabase";
import {
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";

interface Props {
  user: User;
}

const TeacherPortal: React.FC<Props> = ({
  user,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", user.id);

    if (data) {
      setExams(data as Exam[]);
    }

    setLoading(false);
  };

  const createExam = async () => {
    const now =
      new Date().toISOString();

    await supabase.from("exams").insert({
      title: "Đề mới",
      teacher_id: user.id,
      description: null,
      is_locked: false,
      is_archived: false,
      file_url: null,
      raw_content: null,
      total_points: 0,
      version: 1,
      created_at: now,
      updated_at: now,
    });

    loadExams();
  };

  const deleteExam = async (
    id: string
  ) => {
    await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    loadExams();
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">
        Giáo viên: {user.full_name}
      </h1>

      <button
        onClick={createExam}
        className="mb-6 px-4 py-2 bg-indigo-600 rounded-lg flex items-center gap-2"
      >
        <Plus size={16} />
        Tạo đề
      </button>

      {loading && (
        <Loader2 className="animate-spin mb-4" />
      )}

      <div className="space-y-4">
        {exams.map((e) => (
          <div
            key={e.id}
            className="bg-white/5 p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <div className="font-bold">
                {e.title}
              </div>
              <div className="text-sm text-slate-400">
                {e.description ||
                  "Không có mô tả"}
              </div>
            </div>

            <button
              onClick={() =>
                deleteExam(e.id)
              }
              className="text-rose-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherPortal;
