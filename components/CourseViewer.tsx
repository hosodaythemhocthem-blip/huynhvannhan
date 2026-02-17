import React, { useEffect, useState } from "react"
import { ChevronLeft, Trash2, Upload, BrainCircuit, X } from "lucide-react"
import { supabase } from "../supabase"
import { geminiService } from "../services/geminiService"
import MathPreview from "./MathPreview"
import * as pdfjsLib from "pdfjs-dist"
import mammoth from "mammoth"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  order_index: number
}

interface Course {
  id: string
  title: string
  grade: number
}

interface Props {
  course: Course
  onBack: () => void
  role?: "teacher" | "student"
}

const CourseViewer: React.FC<Props> = ({
  course,
  onBack,
  role = "student",
}) => {
  const isTeacher = role === "teacher"

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activeLesson, setActiveLesson] =
    useState<Lesson | null>(null)

  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLessons()
  }, [course.id])

  const loadLessons = async () => {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true })

    if (data) {
      setLessons(data)
      if (data.length > 0) setActiveLesson(data[0])
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Xóa bài giảng này?")) return
    await supabase.from("lessons").delete().eq("id", id)
    loadLessons()
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    try {
      let text = ""

      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({
          data: buffer,
        }).promise

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items
            .map((item: any) => item.str)
            .join(" ")
        }
      } else {
        const buffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({
          arrayBuffer: buffer,
        })
        text = result.value
      }

      const aiQuiz =
        await geminiService.parseExamWithAI(text)

      if (aiQuiz?.questions?.length) {
        setQuiz(aiQuiz)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r p-4 space-y-4">
        <button onClick={onBack}>
          <ChevronLeft />
        </button>

        {lessons.map((lesson, idx) => (
          <div
            key={lesson.id}
            onClick={() => setActiveLesson(lesson)}
            className="p-3 border rounded cursor-pointer"
          >
            {idx + 1}. {lesson.title}

            {isTeacher && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteLesson(lesson.id)
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <main className="flex-1 p-10 overflow-y-auto">
        {quiz ? (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="font-bold text-xl flex gap-2">
                <BrainCircuit /> AI Quiz
              </h2>
              <button onClick={() => setQuiz(null)}>
                <X />
              </button>
            </div>

            {quiz.questions.map(
              (q: any, i: number) => (
                <div key={i}>
                  <MathPreview
                    content={`${i + 1}. ${q.text}`}
                  />
                </div>
              )
            )}
          </div>
        ) : activeLesson ? (
          <div>
            <h1 className="text-2xl font-bold mb-6">
              {activeLesson.title}
            </h1>

            <MathPreview
              content={
                activeLesson.content ||
                "Đang cập nhật..."
              }
            />
          </div>
        ) : (
          <div>Chọn bài giảng</div>
        )}

        {isTeacher && (
          <label className="mt-8 inline-block">
            <Upload />
            <input
              type="file"
              hidden
              accept=".pdf,.docx"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </main>
    </div>
  )
}

export default CourseViewer
