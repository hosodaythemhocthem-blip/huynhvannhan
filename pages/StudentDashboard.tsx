// pages/StudentDashboard.tsx
import React from "react";
import { User } from "../types";

interface Props {
  user: User;
}

const StudentDashboard: React.FC<Props> = ({
  user,
}) => {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold">
        Học sinh: {user.full_name}
      </h1>

      <div className="mt-6 bg-white/5 p-6 rounded-xl">
        <p className="text-slate-400">
          Trạng thái tài khoản:
        </p>

        <p className="mt-2 font-bold text-indigo-400">
          {user.status}
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;
