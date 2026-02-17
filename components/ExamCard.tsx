import React, { memo, useState } from "react"
import { Play, Edit3, Trash2, Lock, Unlock } from "lucide-react"
import { Exam } from "../types"

interface Props {
  exam: Exam
  questionCount?: number
  onView?: (exam: Exam) => void
  onEdit?: (exam: Exam) => void
  onDelete?: (id: string) => void
  onToggleLock?: (exam: Exam) => void
  role?: "teacher" | "student"
}

const ExamCard: React.FC<Props> = ({
  exam,
  questionCount = 0,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  role = "teacher",
}) => {
  const isTeacher = role === "teacher"
  const [loading, setLoading] = useState(false)

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="flex justify-between mb-4">
        <h3 className="font-bold text-lg">
          {exam.title}
        </h3>

        <button
          onClick={() => onToggleLock?.(exam)}
          className="p-2"
        >
          {exam.is_locked ? (
            <Lock size={16} />
          ) : (
            <Unlock size={16} />
          )}
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-6">
        {questionCount} câu hỏi
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onView?.(exam)}
          className="bg-slate-900 text-white px-4 py-2 rounded"
        >
          <Play size={14} /> Làm bài
        </button>

        {isTeacher && (
          <>
            <button
              onClick={() => onEdit?.(exam)}
              className="px-4 py-2 border rounded"
            >
              <Edit3 size={14} />
            </button>

            <button
              onClick={() => onDelete?.(exam.id)}
              className="px-4 py-2 border rounded text-rose-600"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default memo(ExamCard)
