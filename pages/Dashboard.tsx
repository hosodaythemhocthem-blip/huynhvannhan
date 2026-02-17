import React from "react"
import { User } from "../types"

interface Props {
  user: User
}

const Dashboard: React.FC<Props> = ({ user }) => {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold">
        Xin chào {user.full_name} 👋
      </h1>

      <p className="mt-4 text-slate-400">
        Vai trò: {user.role}
      </p>
    </div>
  )
}

export default Dashboard
