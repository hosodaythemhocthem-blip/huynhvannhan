import React, { useState, useRef } from "react";
import { Upload, Loader2, Save, Trash2, X, ClipboardPaste } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { Exam, Question, QuestionType } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  teacherId: string;
  onCreated?: (exam: Exam) => void;
}

const ImportExamFromFile: React.FC<Props> = ({ teacherId, onCreated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [parsedExam, setParsedExam] = useState<Exam | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const now = () => new Date().toISOString();

  const createQuestion = (text: string, order: number): Question => ({
    id: crypto.randomUUID(),
    type: QuestionType.MCQ,
    content: text,
    options: [],
    correctAnswer: 0,
    points: 1,
    order,
    createdAt: now(),
    updatedAt: now(),
    isDeleted: false,
    version: 1,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let rawText = "";

      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          rawText += text.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        rawText = result.value;
      }

      const lines = rawText.split("\n").filter(Boolean);

      const questions = lines.map((line, idx) =>
        createQuestion(line.trim(), idx + 1)
      );

      const exam: Exam = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        teacherId,
        description: "",
        questions,
        isLocked: false,
        isArchived: false,
        createdAt: now(),
        updatedAt: now(),
        isDeleted: false,
        version: 1,
      };

      setParsedExam(exam);
      showToast("Đã trích xuất nội dung thành công!", "success");
    } catch {
      showToast("Lỗi đọc file.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedExam) return;

    setLoading(true);
    const { data, error } = await supabase.from("exams").insert(parsedExam);

    if (!error) {
      showToast("Đã lưu đề thi vĩnh viễn!", "success");
      onCreated?.(data[0]);
      setParsedExam(null);
    } else {
      showToast("Lỗi lưu dữ liệu.", "error");
    }

    setLoading(false);
  };

  const removeQuestion = (id: string) => {
    if (!parsedExam) return;
    setParsedExam({
      ...parsedExam,
      questions: parsedExam.questions.filter(q => q.id !== id),
    });
  };

  return (
    <div>
      {!parsedExam ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed p-10 text-center cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "Tải Word / PDF"}
          <input hidden ref={fileRef} type="file" accept=".pdf,.docx" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{parsedExam.title}</h2>

          {parsedExam.questions.map(q => (
            <div key={q.id} className="border p-4 relative">
              <button
                onClick={() => removeQuestion(q.id)}
                className="absolute top-2 right-2 text-red-500"
              >
                <Trash2 size={16} />
              </button>
              <MathPreview content={q.content} />
            </div>
          ))}

          <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2">
            <Save size={16} /> Lưu vĩnh viễn
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportExamFromFile;
