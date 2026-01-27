import ExamCard, { Exam } from "./components/ExamCard";

export default function App() {
  const exams: Exam[] = [
    {
      id: "EX01",
      title: "Đề HK1 Toán 6",
      subject: "Toán học",
      questionCount: 20,
    },
    {
      id: "EX02",
      title: "Đề Giữa Kỳ Toán 7",
      subject: "Toán học",
      questionCount: 25,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">
        📘 Quản lý đề thi Toán
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onEdit={(id) => alert("Sửa đề: " + id)}
            onDelete={(id) => alert("Xóa đề: " + id)}
          />
        ))}
      </div>
    </div>
  );
}
