import React, { useEffect, useState } from "react"
import { User, Exam } from "../types"
import { dataService } from "../services/dataServices"
import { examService } from "../services/exam.service"

interface Props {
  user: User
  activeTab: string
}

const TeacherPortal: React.FC<Props> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    const data = await dataService.getExamsByTeacher(user.id)
    setExams(data)
  }

  const createExam = async () => {
    const exam = await examService.createExam({
      title: "Đề mới",
      teacher_id: user.id,
      description: null,
      is_locked: false,
      is_archived: false,
      file_url: null,
      raw_content: null,
    })

    if (exam) loadExams()
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">
        Giáo viên: {user.full_name}
      </h1>

      <button
        onClick={createExam}
        className="mb-6 px-4 py-2 bg-indigo-600 rounded-lg"
      >
        Tạo đề
      </button>

      <div className="space-y-4">
        {exams.map((e) => (
          <div key={e.id} className="bg-white/5 p-4 rounded-xl">
            <div className="font-bold">{e.title}</div>
            <div className="text-sm text-slate-400">
              {e.description || "Không có mô tả"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeacherPortal
