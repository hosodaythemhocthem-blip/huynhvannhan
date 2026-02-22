// pages/Dashboard.tsx
import React, { useState } from "react";
import { User } from "../types";
import ImportExamFromFile from "../components/ImportExamFromFile";
import ExamEditor from "../components/ExamEditor";

interface Props {
  user: User;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  // Bật/tắt Modal tải file
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Bật/tắt Trình soạn thảo (Editor)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Data tạm thời từ AI
  const [parsedExamData, setParsedExamData] = useState<any>(null);

  // Xử lý khi AI đọc xong file thành công
  const handleImportSuccess = (examData: any) => {
    console.log("✨ Dữ liệu đề thi AI trả về:", examData);
    setParsedExamData(examData);
    setIsImportModalOpen(false); // Đóng modal import
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
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo đề thi từ File
          </button>
        )}
      </div>

      {/* Khu vực thông báo và nút chuyển tiếp sang Editor */}
      {parsedExamData && !isEditorOpen && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
              <span>✅</span> Trích xuất thành công: {parsedExamData.title || "Đề thi mới"}
            </h2>
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
              {parsedExamData.questions?.length || 0} câu hỏi
            </span>
          </div>
          
          <p className="text-slate-400 mb-6 text-sm">
            Dữ liệu đã được bóc tách. Nhấn nút bên dưới để mở Trình soạn thảo, kiểm tra lại công thức Toán học, điều chỉnh nếu cần và lưu vào hệ thống nhé!
          </p>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-green-900/50 flex items-center gap-2"
            >
              Tiếp tục chỉnh sửa / Lưu đề thi
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Gọi Component Modal Import */}
      <ImportExamFromFile
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Gọi Component Trình soạn thảo (Khi bật sẽ phủ toàn màn hình) */}
      {isEditorOpen && (
        <ExamEditor
          user={user}
          exam={null} // Truyền null vì đang tạo đề mới
          aiGeneratedData={parsedExamData} // Đổ data AI vào đây!
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
