// FULL SUPABASE UPGRADE - PRO VERSION

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Users,
  GraduationCap,
  Search,
  X,
  Loader2,
  Upload,
  FileText
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  student_count: number;
}

const ClassManagement: React.FC = () => {

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingClassId, setUploadingClassId] = useState<string | null>(null);

  /* =========================
     LOAD DATA REALTIME
  ========================= */

  useEffect(() => {

    const fetchData = async () => {
      const { data } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      setClasses(data || []);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("realtime-classes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  /* =========================
     ADD CLASS
  ========================= */

  const handleAddClass = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!newClassName.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("classes").insert({
      name: newClassName.trim(),
      grade: newClassGrade,
      teacher: "Huỳnh Văn Nhẫn",
      student_count: 0
    });

    if (error) {
      alert("❌ Lỗi khi thêm lớp");
    } else {
      setIsModalOpen(false);
      setNewClassName("");
      setNewClassGrade("12");
    }

    setIsSubmitting(false);
  };

  /* =========================
     DELETE CLASS
  ========================= */

  const handleDelete = async (id: string) => {

    if (!confirm("⚠️ Bạn chắc chắn muốn xóa lớp này?")) return;

    await supabase.from("classes").delete().eq("id", id);

    await supabase.storage
      .from("class-materials")
      .remove([`${id}`]);
  };

  /* =========================
     FILE UPLOAD
  ========================= */

  const extractText = async (file: File) => {

    let text = "";

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ");
      }
    }

    else if (file.type.includes("wordprocessingml")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    }

    else {
      throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    return text;
  };

  const handleUpload = async (classId: string, file: File) => {

    setUploadingClassId(classId);

    try {

      const extracted = await extractText(file);

      const filePath = `${classId}/${Date.now()}-${file.name}`;

      const { data } = await supabase.storage
        .from("class-materials")
        .upload(filePath, file);

      const publicUrl = supabase.storage
        .from("class-materials")
        .getPublicUrl(data?.path || "").data.publicUrl;

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
     UI
  ========================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
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

      {/* TABLE */}
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
                Lớp {c.grade} · {c.teacher}
              </div>
            </div>

            <div className="flex gap-3 items-center">

              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={(e) =>
                  e.target.files &&
                  handleUpload(c.id, e.target.files[0])
                }
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border rounded-xl"
              >
                {uploadingClassId === c.id
                  ? <Loader2 className="animate-spin" size={16} />
                  : <Upload size={16} />}
              </button>

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

      {/* MODAL ADD CLASS (GIỮ NGUYÊN CẤU TRÚC CỦA BẠN) */}
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
