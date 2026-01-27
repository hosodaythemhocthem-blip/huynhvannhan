import { useState } from "react";
import LoginScreen from "./components/LoginScreen";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔐 BẮT BUỘC ĐĂNG NHẬP TRƯỚC
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onSelectRole={() => setIsLoggedIn(true)}
      />
    );
  }

  // 📘 SAU ĐĂNG NHẬP (dashboard demo)
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-black text-slate-800 mb-6">
          📘 Bảng điều khiển LMS
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-lg mb-2">📄 Đề thi</h2>
            <p className="text-sm text-slate-600">
              Quản lý, tạo và phân phối đề
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-lg mb-2">🏫 Lớp học</h2>
            <p className="text-sm text-slate-600">
              Danh sách lớp & học sinh
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-lg mb-2">📊 Kết quả</h2>
            <p className="text-sm text-slate-600">
              Thống kê & phân tích điểm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
