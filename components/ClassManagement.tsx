// components/ClassManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GraduationCap,
  Loader2,
  Upload
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacher_id: string;
  student_count: number;
}

const ClassManagement: React.FC = () => {

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadingClassId, setUploadingClassId] = useState<string | null>(null);

  /* =========================
     INIT USER + LOAD CLASSES
  ========================= */

  useEffect(() => {

    const init = async () => {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      await fetchClasses(user.id);
      setLoading(false);
    };

    init();

  }, []);

  const fetchClasses = async (uid: string) => {

    const { data, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        grade,
        teacher_id,
        class_members(count)
      `)
      .eq("teacher_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {

      const formatted = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        teacher_id: c.teacher_id,
        student_count: c.class_members?.length || 0
      }));

      setClasses(formatted);
    }
  };

  /* =========================
     ADD CLASS
  ========================= */

  const handleAddClass = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!newClassName.trim() || !userId || isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("classes").insert({
      name: newClassName.trim(),
      grade: newClassGrade,
      teacher_id: userId
    });

    if (error) {
      alert("❌ Lỗi khi thêm lớp");
    } else {
      setIsModalOpen(false);
      setNewClassName("");
      await fetchClasses(userId);
    }

    setIsSubmitting(false);
  };

  /* =========================
     DELETE CLASS
  ========================= */

  const handleDelete = async (id: string) => {

    if (!confirm("⚠️ Bạn chắc chắn muốn xóa lớp này?")) return;

    // Xóa materials trước
    const { data: materials } = await supabase
      .from("class_materials")
      .select("file_url")
      .eq("class_id", id);

    if (materials) {
      for (const m of materials) {
        const path = m.file_url.split("/class-materials/")[1];
        await supabase.storage
          .from("class-materials")
          .remove([path]);
      }
    }

    await supabase.from("class_materials").delete().eq("class_id", id);
    await supabase.from("classes").delete().eq("id", id);

    if (userId) await fetchClasses(userId);
  };

  /* =========================
     FILE TEXT EXTRACT
  ========================= */

  const extractText = async (file: File) => {

    let text = "";

    if (file.type === "application/pdf") {

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer)
      }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        text +=
          content.items
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ") + "\n";
      }

    } else if (file.type.includes("wordprocessingml")) {

      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;

    } else {
      throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    return text;
  };

  /* =========================
     FILE UPLOAD
  ========================= */

  const handleUpload = async (classId: string, file: File) => {

    setUploadingClassId(classId);

    try {

      const extracted = await extractText(file);
      const filePath = `${classId}/${uuidv4()}-${file.name}`;

      const { error } = await supabase.storage
        .from("class-materials")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } =
        supabase.storage
          .from("class-materials")
          .getPublicUrl(filePath);

      await supabase.from("class_materials").insert({
        class_id: classId,
        file_name: file.name,
        file_url: publicUrl,
        extracted_text: extracted
      });

    } catch (err: any) {
      alert(err.message);
    }

    setUploadingClassId(null);
  };

  /* =========================
     FILTER
  ========================= */

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* =========================
     UI (KHÔNG ĐỔI STRUCTURE)
  ========================= */

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <GraduationCap className="text-indigo-600" />
          Quản lý Lớp học
        </h2>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex gap-2 items-center"
        >
          <Plus size={18} /> Thêm lớp
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow overflow-hidden">

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : filteredClasses.map(c => (

          <div key={c.id}
            className="flex justify-between items-center p-5 border-b hover:bg-slate-50 transition">

            <div>
              <div className="font-bold">{c.name}</div>
              <div className="text-xs text-slate-400">
                Lớp {c.grade} · {c.student_count} học sinh
              </div>
            </div>

            <div className="flex gap-3 items-center">

              <input
                type="file"
                hidden
                onChange={(e) =>
                  e.target.files &&
                  handleUpload(c.id, e.target.files[0])
                }
              />

              <label className="p-2 border rounded-xl cursor-pointer">
                {uploadingClassId === c.id
                  ? <Loader2 className="animate-spin" size={16} />
                  : <Upload size={16} />}
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    e.target.files &&
                    handleUpload(c.id, e.target.files[0])
                  }
                />
              </label>

              <button
                onClick={() => handleDelete(c.id)}
                className="p-2 border rounded-xl text-rose-500"
              >
                <Trash2 size={16} />
              </button>

            </div>
          </div>

        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <form
            onSubmit={handleAddClass}
            className="bg-white p-8 rounded-3xl space-y-4 w-96"
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
