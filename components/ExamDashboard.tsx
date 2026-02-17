import React, { useMemo, useState } from "react"
import { Exam } from "../types"
import ExamCard from "./ExamCard"

interface Props {
  exams: Exam[]
  onCreate: () => void
  onEdit: (exam: Exam) => void
  onDelete: (id: string) => void
  onToggleLock: (exam: Exam) => void
}

const ExamDashboard: React.FC<Props> = ({
  exams,
  onCreate,
  onEdit,
  onDelete,
  onToggleLock,
}) => {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return exams
    return exams.filter((e) =>
      e.title
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [exams, search])

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <input
          placeholder="Tìm đề..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border p-3 rounded-xl"
        />

        <button
          onClick={onCreate}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl"
        >
          Tạo đề
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleLock={onToggleLock}
          />
        ))}
      </div>
    </div>
  )
}

export default ExamDashboard
