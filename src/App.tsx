import { useState } from "react";
import ExamCard, { Exam } from "./components/ExamCard";
import LoginScreen from "./components/LoginScreen";
import { UserRole } from "./types";

const exams: Exam[] = [
  {
    id: "1",
    title: "Đề kiểm tra Toán 6 – Chương 1",
    subject: "Toán",
    questionCount: 20,
  },
  {
    id: "2",
    title: "Đề HK1 Toán 7",
    subject: "Toán",
    questionCount: 30,
  },
];

function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // 🔐 LUÔN HIỆN LOGIN TRƯỚC
  if (!userRole) {
    return (
      <LoginScreen
        onSelectRole={(role) => {
          setUserRole(role);
        }}
      />
    );
  }

  // 📘 SAU KHI ĐĂNG NHẬP
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black mb-6">
          Quản lý đề thi Toán học
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
