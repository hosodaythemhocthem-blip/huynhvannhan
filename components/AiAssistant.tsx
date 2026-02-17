import React, { useState, useRef, useCallback } from "react"
import {
  Upload,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  ClipboardPaste,
  X,
} from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import mammoth from "mammoth"
import MathPreview from "./MathPreview"
import { geminiService } from "../services/geminiService"
import { supabase } from "../supabase"
import { Question } from "../types"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface AIQuestion {
  text: string
  options: string[]
  correctAnswer?: number
}

interface PreviewExam {
  title: string
  questions: AIQuestion[]
}

interface Props {
  userId: string
}

const AiExamGenerator: React.FC<Props> = ({ userId }) => {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewExam, setPreviewExam] =
    useState<PreviewExam | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  /* ================= GENERATE ================= */

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)

    try {
      const data = await geminiService.parseExamWithAI(
        topic.slice(0, 8000)
      )

      if (data?.questions?.length) {
        setPreviewExam(data)
      }
    } catch (err) {
      alert("AI đang bận.")
    } finally {
      setLoading(false)
    }
  }

  /* ================= SAVE TO DB ================= */

  const saveToCloud = async () => {
    if (!previewExam) return
    setLoading(true)

    try {
      const now = new Date().toISOString()

      /* 1️⃣ Insert exam */
      const { data: examData, error: examError } =
        await supabase
          .from("exams")
          .insert({
            title: previewExam.title,
            teacher_id: userId,
            description: "AI Generated",
            is_locked: false,
            is_archived: false,
            file_url: null,
            raw_content: topic,
            total_points: previewExam.questions.length,
            version: 1,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single()

      if (examError || !examData)
        throw new Error("Insert exam failed")

      /* 2️⃣ Insert questions */
      const questionsToInsert: Partial<Question>[] =
        previewExam.questions.map((q, index) => ({
          exam_id: examData.id,
          content: q.text,
          type: "multiple_choice",
          options: q.options,
          correct_answer:
            q.correctAnswer !== undefined
              ? String(q.correctAnswer)
              : null,
          points: 1,
          order: index + 1,
          explanation: null,
          section: null,
          created_at: now,
          updated_at: now,
        }))

      const { error: questionError } = await supabase
        .from("questions")
        .insert(questionsToInsert)

      if (questionError)
        throw new Error("Insert question failed")

      alert("Đã lưu đề thành công!")
      setPreviewExam(null)
      setTopic("")
    } catch (err) {
      alert("Lỗi khi lưu đề.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="w-full p-4 bg-slate-50 rounded-xl"
        placeholder="Dán đề thô..."
      />

      <button
        onClick={handleGenerate}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Tạo đề
      </button>

      {previewExam && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-bold mb-4">
            {previewExam.title}
          </h3>

          {previewExam.questions.map((q, i) => (
            <div key={i} className="mb-6">
              <MathPreview content={q.text} />
              {q.options.map((opt, idx) => (
                <div key={idx}>
                  {String.fromCharCode(65 + idx)}.{" "}
                  <MathPreview content={opt} />
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={saveToCloud}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl"
          >
            <Save size={18} /> Lưu đề
          </button>
        </div>
      )}
    </div>
  )
}

export default AiExamGenerator
