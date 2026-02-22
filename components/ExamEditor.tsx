import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
// Import thêm các icon bạn đang dùng (nếu có)
// import { Save, X } from 'lucide-react';

// 1. ĐỊNH NGHĨA PROPS (Khớp với bên TeacherPortal truyền vào)
interface ExamEditorProps {
  user: any;
  exam: any;
  aiGeneratedData: any;
  onClose: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ user, exam, aiGeneratedData, onClose }) => {
  // 2. KHAI BÁO STATE
  const [title, setTitle] = useState(exam?.title || "Đề thi mới (Tạo từ File)");
  const [questions, setQuestions] = useState<any[]>(exam?.questions || []);
  const [saving, setSaving] = useState(false);

  // Hàm hiển thị thông báo (Nếu dự án bạn đã có hàm showToast riêng thì cứ dùng hàm cũ nhé)
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    alert(`[${type.toUpperCase()}] ${message}`);
  };

  // Nạp dữ liệu AI bóc tách được (nếu có)
  useEffect(() => {
    if (aiGeneratedData) {
      if (aiGeneratedData.title) setTitle(aiGeneratedData.title);
      if (aiGeneratedData.questions) setQuestions(aiGeneratedData.questions);
    }
  }, [aiGeneratedData]);

  // 3. HÀM LƯU ĐỀ THI CỦA BẠN (Giữ nguyên 100%)
  const handleSave = async () => {
    if (!title.trim()) return showToast("Vui lòng nhập tên đề thi!", "error");
    if (questions.length === 0) return showToast("Đề thi cần ít nhất 1 câu hỏi!", "warning");

    setSaving(true);
    try {
      if (!user || !user.id) {
        throw new Error("Không tìm thấy ID tài khoản giáo viên. Vui lòng thử đăng xuất và đăng nhập lại!");
      }

      const payload = {
        title,
        questions, 
        updated_at: new Date().toISOString(),
        teacher_id: user.id,
        is_locked: true,
      };

      let response;
      if (exam?.id) {
        response = await supabase.from('exams').update(payload).eq('id', exam.id).select();
      } else {
        response = await supabase.from('exams').insert([payload]).select();
      }

      const { data, error } = response;

      if (error) {
        console.error("Chi tiết lỗi Supabase:", error);
        throw new Error(`DB Error: ${error.message || error.details} (Mã: ${error.code})`);
      }
      
      showToast("Đã lưu đề thi thành công!", "success");
      onClose(); 

    } catch (err: any) {
      console.error("Lỗi Catch Block:", err);
      alert(`Lỗi Lưu Đề:\n${err.message || "Không rõ nguyên nhân"}\n\n(Chụp lại lỗi này gửi cho mình nếu bạn vẫn chưa lưu được nhé!)`);
      showToast("Lưu thất bại!", "error");
    } finally {
      setSaving(false);
    }
  };

  // 4. PHẦN RENDER GIAO DIỆN
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen">
      {/* THANH HEADER CHỨA NÚT LƯU VÀ ĐÓNG */}
      <div className="flex justify-between items-center p-4 border-b bg-slate-50">
        <h2 className="text-xl font-bold text-indigo-900">
          {title}
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "💾 Lưu Đề"}
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* KHU VỰC CHÍNH */}
      <div className="flex-1 overflow-hidden">
        {/* !!! QUAN TRỌNG !!!
          BẠN HÃY DÁN PHẦN CODE CHIA 2 CỘT (Cột trái câu hỏi, Cột phải Xem trước) 
          CỦA BẠN VÀO KHU VỰC NÀY NHÉ! 
        */}
        <div className="p-8 text-center text-slate-500">
          (Khu vực hiển thị danh sách câu hỏi của bạn)
        </div>
      </div>
    </div>
  );
};

// 5. CHỐT HẠ: DÒNG NÀY SẼ CỨU RỖI VERCEL CỦA CHÚNG TA!
export default ExamEditor;
