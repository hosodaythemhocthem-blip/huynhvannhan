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
  const extractPDFText = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

    let text = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str).join(" ") + "\n"
    }

    return text
  }

  /* ================= DOCX ================= */
  const extractDocxText = async (file: File) => {
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
      alert("AI lỗi rồi thầy ơi 😅")
    } finally {
      setLoading(false)
    }
  }

  /* ================= FILE IMPORT ================= */
  const handleFileUpload = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("File tối đa 5MB")
      return
    }

    setLoading(true)
    try {
      let text = ""

      if (file.type === "application/pdf") {
        text = await extractPDFText(file)
      } else {
        text = await extractDocxText(file)
      }

      setTopic(text)
    } catch {
      alert("Không đọc được file")
    } finally {
      setLoading(false)
    }
  }

  /* ================= SAVE RELATIONAL ================= */
  const saveToCloud = async () => {
    if (!previewExam) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert({
          title: previewExam.title,
          teacher_id: userId,
          description: "AI Generated",
          is_locked: false,
          is_archived: false,
          file_url: null,
          raw_content: topic,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (examError) throw examError

      const questionsPayload = previewExam.questions.map((q) => ({
        exam_id: examData.id,
        content: q.text,
        type: q.options ? "multiple_choice" : "essay",
        options: q.options ?? null,
        correct_answer:
          q.correctAnswer !== undefined
            ? String(q.correctAnswer)
            : null,
        created_at: now,
        updated_at: now,
      }))

      const { error: qError } = await supabase
        .from("questions")
        .insert(questionsPayload)

      if (qError) throw qError

      alert("🎉 Lưu thành công vĩnh viễn!")
      setPreviewExam(null)
      setTopic("")
    } catch (err) {
      console.error(err)
      alert("Lỗi lưu Supabase")
    } finally {
      setLoading(false)
    }
  }

  /* ================= DELETE QUESTION ================= */
  const deleteQuestion = (index: number) => {
    if (!previewExam) return
    setPreviewExam({
      ...previewExam,
      questions: previewExam.questions.filter((_, i) => i !== index),
    })
  }

  /* ================= PASTE ================= */
  const handlePaste = async (index?: number) => {
    try {
      const text = await navigator.clipboard.readText()

      if (index === undefined) {
        setTopic((prev) => prev + text)
      } else if (previewExam) {
        const updated = [...previewExam.questions]
        updated[index].text += text
        setPreviewExam({ ...previewExam, questions: updated })
      }
    } catch {
      alert("Không đọc được clipboard")
    }
  }

  return (
    <div className="space-y-8">
      {/* INPUT */}
      <div className="bg-white p-8 rounded-3xl shadow-xl">
        <h3 className="text-2xl font-black mb-6">
          AI Exam Engine v9.0 🚀
        </h3>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-6 bg-slate-50 rounded-xl min-h-[180px]"
          placeholder="Dán nội dung đề..."
        />

        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-3 hover:bg-slate-100 rounded-lg"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={() => handlePaste()}
            className="p-3 hover:bg-indigo-50 rounded-lg"
          >
            <ClipboardPaste size={18} />
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            GENERATE
          </button>
        </div>

        <input
          hidden
          type="file"
          ref={fileRef}
          accept=".pdf,.doc,.docx"
          onChange={(e) =>
            e.target.files && handleFileUpload(e.target.files[0])
          }
        />
      </div>

      {/* PREVIEW */}
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
            <div
              key={i}
              className="p-6 bg-slate-50 rounded-xl mb-6 relative"
            >
              <button
                onClick={() => deleteQuestion(i)}
                className="absolute top-3 right-3 text-rose-500"
              >
                <X size={16} />
              </button>

              <div className="flex justify-between mb-2">
                <strong>Câu {i + 1}</strong>
                <button
                  onClick={() => handlePaste(i)}
                  className="text-indigo-600 text-sm flex gap-1"
                >
                  <ClipboardPaste size={14} />
                  Paste
                </button>
              </div>

              <MathPreview content={q.text} />

              {q.options?.map((opt, idx) => (
                <div key={idx} className="ml-4 mt-2">
                  {String.fromCharCode(65 + idx)}.{" "}
                  <MathPreview content={opt} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AiExamGenerator
