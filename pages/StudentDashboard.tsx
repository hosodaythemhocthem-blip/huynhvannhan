import React from "react"
import { User } from "../types"

interface Props {
  user: User
  activeTab: string
  onStartExam: (exam: any) => void
}

const StudentDashboard: React.FC<Props> = ({ user }) => {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold">
        Học sinh: {user.full_name}
      </h1>

      <p className="mt-4 text-slate-400">
        Trạng thái: {user.status}
      </p>
    </div>
  )
}

export default StudentDashboard
