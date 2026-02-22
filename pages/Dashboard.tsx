// pages/Dashboard.tsx
import React, { useState } from "react";
import { User } from "../types";
import ImportExamFromFile from "../components/ImportExamFromFile";

interface Props {
  user: User;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  // State quản lý bật/tắt Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State lưu tạm dữ liệu đề thi sau khi AI bóc tách xong để hiển thị (Preview)
  const [parsedExamData, setParsedExamData] = useState<any>(null);

  // Hàm xử lý khi AI chạy xong và trả về kết quả
  const handleImportSuccess = (examData: any) => {
    console.log("✨ Dữ liệu đề thi AI trả về:", examData);
    setParsedExamData(examData);
    setIsModalOpen(false); // Đóng modal
  };

  return (
    <div className="p-8 text-white">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Xin chào {user.full_name} 👋
          </h1>
          <p className="mt-2 text-slate-400">
            Vai trò: <span className="uppercase font-semibold text-indigo-400">{user.role}</span>
          </p>
        </div>

        {/* Nút Tạo đề thi (Chỉ hiển thị cho Giáo viên và Admin) */}
        {(user.role === "teacher" || user.role === "admin") && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo đề thi từ File
          </button>
        )}
      </div>

      {/* Khu vực hiển thị tạm kết quả (Preview) sau khi AI bóc tách xong */}
      {parsedExamData && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span>✅</span> Trích xuất thành công: {parsedExamData.title || "Đề thi mới"}
            </h2>
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
              {parsedExamData.questions?.length || 0} câu hỏi
            </span>
          </div>
          
          <p className="text-slate-400 mb-4 text-sm">
            Dữ liệu JSON thô đã được lưu vào State. Thầy có thể xem chi tiết trong Console Log hoặc hộp bên dưới:
          </p>
          
          <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto text-sm text-slate-300 max-h-96 custom-scrollbar">
            {JSON.stringify(parsedExamData, null, 2)}
          </pre>

          <div className="mt-4 flex justify-end">
             {/* Chỗ này sau này nối với nút chuyển sang trang ExamEditor */}
            <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Tiếp tục chỉnh sửa / Lưu đề thi ➡️
            </button>
          </div>
        </div>
      )}

      {/* Gọi Component Modal */}
      <ImportExamFromFile
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Dashboard;
