import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Layout from "./components/Layout";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // 🔐 BẮT BUỘC ĐĂNG NHẬP
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onSelectRole={() => setIsLoggedIn(true)}
      />
    );
  }

  // ✅ SAU ĐĂNG NHẬP → DÙNG LAYOUT FULL
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Content bên trong mới giới hạn chiều rộng */}
      <div className="max-w-7xl mx-auto">
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
    </Layout>
  );
}

export default App;
