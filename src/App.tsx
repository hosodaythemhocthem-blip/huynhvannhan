import { useState } from "react";
import ExamCard, { Exam } from "./components/ExamCard";
import LoginScreen from "./components/LoginScreen";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔐 BẮT BUỘC: HIỆN ĐĂNG NHẬP TRƯỚC
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // 📘 SAU ĐĂNG NHẬP MỚI HIỆN DANH SÁCH ĐỀ
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>
        Quản lý đề thi
      </h1>

      <div style={{ display: "grid", gap: 16 }}>
        {exams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}

export default App;
