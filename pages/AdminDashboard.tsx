import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { User } from "../types";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (!error && data) {
      setUsers(data as User[]);
    }

    setLoading(false);
  };

  const approveStudent = async (id: string) => {
    await supabase
      .from("profiles")
      .update({ status: "approved" }) // 🔥 FIX đúng type
      .eq("id", id);

    fetchUsers();
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">
        Quản lý người dùng
      </h1>

      <div className="space-y-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white/5 p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{u.full_name}</div>
              <div className="text-sm text-slate-400">
                {u.email}
              </div>
              <div className="text-xs text-slate-500">
                Role: {u.role} | Status: {u.status}
              </div>
            </div>

            {u.role === "student" &&
              u.status === "pending" && (
                <button
                  onClick={() =>
                    approveStudent(u.id)
                  }
                  className="px-4 py-2 bg-indigo-600 rounded-lg text-sm"
                >
                  Duyệt
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
