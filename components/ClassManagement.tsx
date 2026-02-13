// components/ClassManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  GraduationCap,
  Loader2,
  Upload,
  Copy,
  FileText,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";
import MathPreview from "./MathPreview";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacher_id: string;
  student_count: number;
}

interface Material {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= INIT ================= */

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await fetchClasses(user.id);
      setLoading(false);
    };

    init();
  }, []);

  /* ================= FETCH ================= */

  const fetchClasses = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", uid)
      .order("created_at", { ascending: false });

    if (!data) return;

    const formatted: ClassItem[] = [];

    for (const c of data) {
      const { count } = await supabase
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("class_id", c.id);

      formatted.push({
        id: c.id,
        name: c.name,
        grade: c.grade,
        teacher_id: c.teacher_id,
        student_count: count || 0,
      });

      await fetchMaterials(c.id);
    }

    setClasses(formatted);
  }, []);

  const fetchMaterials = async (classId: string) => {
    const { data } = await supabase
      .from("class_materials")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (data) {
      setMaterials((prev) => ({
        ...prev,
        [classId]: data,
      }));
    }
  };

  /* ================= ADD CLASS ================= */

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !userId || isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("classes").insert({
      name: newClassName.trim(),
      grade: newClassGrade,
      teacher_id: userId,
    });

    if (!error) {
      setIsModalOpen(false);
      setNewClassName("");
      await fetchClasses(userId);
    }

    setIsSubmitting(false);
  };

  /* ================= DELETE CLASS ================= */

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Xóa lớp sẽ mất toàn bộ dữ liệu?")) return;

    await supabase.from("class_materials").delete().eq("class_id", id);
    await supabase.from("classes").delete().eq("id", id);

    if (userId) await fetchClasses(userId);
  };

  /* ================= DELETE MATERIAL ================= */

  const handleDeleteMaterial = async (
    classId: string,
    materialId: string
  ) => {
    await supabase.from("class_materials").delete().eq("id", materialId);
    await fetchMaterials(classId);
  };

  /* ================= COPY ================= */

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /* ================= EXTRACT ================= */

  const extractText = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File tối đa 10MB");
    }

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
      }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ") + "\n";
      }

      return text;
    }

    if (file.type.includes("wordprocessingml")) {
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      return result.value;
    }

    throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
  };

  /* ================= UPLOAD ================= */

  const handleUpload = async (classId: string, file: File) => {
    if (uploadingId) return;

    setUploadingId(classId);

    try {
      const extracted = await extractText(file);
      const filePath = `${classId}/${uuidv4()}-${file.name}`;

      await supabase.storage
        .from("class-materials")
        .upload(filePath, file);

      const {
        data: { publicUrl },
      } = supabase.storage.from("class-materials").getPublicUrl(filePath);

      await supabase.from("class_materials").insert({
        class_id: classId,
        file_name: file.name,
        file_url: publicUrl,
        extracted_text: extracted,
      });

      await fetchMaterials(classId);
    } catch (err: any) {
      alert(err.message);
    }

    setUploadingId(null);
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black flex gap-2 items-center">
          <GraduationCap className="text-indigo-600" />
          Quản lý Lớp học
        </h2>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex gap-2 items-center shadow-lg"
        >
          <Plus size={18} /> Thêm lớp
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : classes.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            Chưa có lớp nào
          </div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="border-b">

              <div className="flex justify-between p-5 hover:bg-slate-50 transition">
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedClass(
                      expandedClass === c.id ? null : c.id
                    )
                  }
                >
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    Lớp {c.grade} · {c.student_count} học sinh
                  </div>
                </div>

                <div className="flex gap-3 items-center">

                  <label className="p-2 border rounded-xl cursor-pointer">
                    {uploadingId === c.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        e.target.files &&
                        handleUpload(c.id, e.target.files[0])
                      }
                    />
                  </label>

                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-2 border rounded-xl text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedClass === c.id &&
                materials[c.id]?.map((m) => (
                  <div
                    key={m.id}
                    className="bg-slate-50 p-4 border-t space-y-2"
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-2 items-center text-sm font-semibold">
                        <FileText size={16} />
                        {m.file_name}
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => copyText(m.extracted_text)}>
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteMaterial(c.id, m.id)
                          }
                          className="text-rose-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl max-h-60 overflow-auto">
                      <MathPreview content={m.extracted_text} />
                    </div>
                  </div>
                ))}

            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form
            onSubmit={handleAddClass}
            className="bg-white p-8 rounded-3xl space-y-4 w-96 shadow-xl"
          >
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Tên lớp"
              className="w-full border p-3 rounded-xl"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white p-3 rounded-xl"
            >
              {isSubmitting ? "Đang tạo..." : "Tạo lớp"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
