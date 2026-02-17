import React, { useState, useRef } from "react"
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

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface AIQuestion {
  text: string
  options?: string[]
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
  const [previewExam, setPreviewExam] = useState<PreviewExam | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ================= PDF ================= */
  const extractPDFText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

    let text = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items
        .map((item: any) => item.str)
        .join(" ") + "\n"
    }

    return text
  }

  /* ================= DOCX ================= */
  const extractDocxText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  }

  /* ================= GENERATE ================= */
  const handleGenerate = async () => {
    if (!topic.trim()) return

    setLoading(true)
    try {
      const data = await geminiService.parseExamWithAI(
        topic.slice(0, 8000)
      )
      setPreviewExam(data)
    } catch (err) {
      console.error(err)
      alert("AI lỗi rồi 😅")
    } finally {
      setLoading(false)
    }
  }

  /* ================= SAVE ================= */
  const saveToCloud = async () => {
    if (!previewExam) return
    setLoading(true)

    try {
      const now = new Date().toISOString()

      const totalPoints = previewExam.questions.length * 10

      const { data: examData, error } = await supabase
        .from("exams")
        .insert({
          title: previewExam.title,
          teacher_id: userId,
          description: "AI Generated",
          is_locked: false,
          is_archived: false,
          file_url: null,
          raw_content: topic,
          total_points: totalPoints,
          version: 1,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) throw error

      const questionsPayload = previewExam.questions.map(
        (q, index) => ({
          exam_id: examData.id,
          content: q.text,
          type: q.options ? "multiple_choice" : "essay",
          options: q.options ?? null,
          correct_answer:
            q.correctAnswer !== undefined
              ? String(q.correctAnswer)
              : null,
          points: 10,
          order: index + 1,
          created_at: now,
          updated_at: now,
        })
      )

      const { error: qError } = await supabase
        .from("questions")
        .insert(questionsPayload)

      if (qError) throw qError

      alert("🎉 Lưu thành công!")
      setPreviewExam(null)
      setTopic("")
    } catch (err) {
      console.error(err)
      alert("Lỗi lưu Supabase")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl">
        <h3 className="text-2xl font-black mb-6">
          AI Exam Engine 🚀
        </h3>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-6 bg-slate-50 rounded-xl min-h-[180px]"
          placeholder="Dán nội dung đề..."
        />

        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            GENERATE
          </button>
        </div>
      </div>

      {previewExam && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-between mb-6">
            <h4 className="font-bold text-xl">
              {previewExam.title}
            </h4>

            <button
              onClick={saveToCloud}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl flex gap-2"
            >
              <Save size={16} /> LƯU
            </button>
          </div>

          {previewExam.questions.map((q, i) => (
            <div key={i} className="mb-6">
              <strong>Câu {i + 1}</strong>
              <MathPreview content={q.text} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AiExamGenerator
