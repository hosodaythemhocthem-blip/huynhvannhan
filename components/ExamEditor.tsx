import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// 1. ĐỊNH NGHĨA PROPS
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

  // Hàm hiển thị thông báo
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

  // 3. HÀM LƯU ĐỀ THI
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

      const { error } = response;
      if (error) throw new Error(`DB Error: ${error.message}`);
      
      showToast("Đã lưu đề thi thành công!", "success");
      onClose(); 

    } catch (err: any) {
      alert(`Lỗi Lưu Đề: ${err.message}`);
      showToast("Lưu thất bại!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (!newQuestions[qIndex].options) newQuestions[qIndex].options = ["", "", "", ""];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { content: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // 4. RENDER GIAO DIỆN - ĐÃ FIX Z-INDEX
  return (
    // 🔥 FIX: Tăng z-index lên 100 để đè lên Header chính của App
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col h-screen font-sans overflow-hidden">
      
      {/* THANH HEADER NỘI BỘ */}
      <div className="flex justify-between items-center p-4 border-b bg-white shadow-md z-[110] relative">
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-bold text-indigo-900 border-b-2 border-transparent hover:border-indigo-300 focus:border-indigo-600 focus:outline-none bg-transparent w-1/2 px-2 py-1 transition-colors"
          placeholder="Nhập tên đề thi..."
        />
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu Đề Thi"}
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg transition-all shadow-sm active:scale-95"
          >
            ❌ Đóng
          </button>
        </div>
      </div>

      {/* KHU VỰC CHÍNH: CHIA 2 CỘT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* CỘT TRÁI: EDITOR */}
        <div className="w-1/2 h-full overflow-y-auto p-6 border-r border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-700">✏️ Trình chỉnh sửa câu hỏi</h3>
            <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
              Tổng: {questions.length} câu
            </span>
          </div>

          <div className="space-y-6 pb-24">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-indigo-600">Câu {qIndex + 1}</h4>
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors text-sm font-medium"
                  >
                    🗑️ Xóa
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Nội dung câu hỏi</label>
                    <textarea 
                      value={q.content || ""}
                      onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px]"
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === optIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                          className="w-4 h-4 text-indigo-600 cursor-pointer accent-indigo-600"
                        />
                        <span className="font-bold text-slate-500 w-6">{label}.</span>
                        <input 
                          type="text"
                          value={q.options?.[optIndex] || ""}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          className={`flex-1 p-2 border rounded-lg outline-none transition-colors ${q.correctAnswer === optIndex ? 'border-green-500 bg-green-50 font-medium' : 'border-slate-300 focus:border-indigo-500'}`}
                          placeholder={`Đáp án ${label}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-500 transition-all flex justify-center items-center gap-2"
            >
              ➕ Thêm câu hỏi mới
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: PREVIEW */}
        <div className="w-1/2 h-full overflow-y-auto p-8 bg-white">
          <h3 className="text-lg font-bold text-slate-700 border-b pb-4 mb-6 sticky top-0 bg-white z-10">
            👁️ Xem trước đề thi
          </h3>
          
          <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-8 underline decoration-indigo-200">{title}</h1>
            
            {questions.length === 0 ? (
              <div className="text-center text-slate-400 italic py-10">
                Chưa có câu hỏi nào. Hãy thêm câu hỏi ở cột bên trái!
              </div>
            ) : (
              questions.map((q, qIndex) => (
                <div key={qIndex} className="text-slate-800 pb-6 border-b border-slate-50 last:border-0">
                  <div className="font-medium mb-3">
                    <span className="font-bold text-indigo-700 mr-2">Câu {qIndex + 1}:</span> 
                    {q.content || "..."}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 pl-4">
                    {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                      <div key={optIndex} className={`flex items-start ${q.correctAnswer === optIndex ? 'font-bold text-green-700' : ''}`}>
                        <span className="mr-2">{label}.</span>
                        <span>{q.options?.[optIndex] || "..."}</span>
                        {q.correctAnswer === optIndex && <span className="ml-2 text-green-600">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamEditor;
