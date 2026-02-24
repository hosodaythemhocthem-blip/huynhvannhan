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

  // 4. RENDER GIAO DIỆN
  return (
    // 🔥 LỚP BAO NGOÀI CÙNG: Dùng z-[9999] để đè bẹp Header chính và Avatar
    <div className="fixed inset-0 bg-slate-100 z-[9999] flex flex-col h-screen font-sans overflow-hidden">
      
      {/* THANH HEADER NỘI BỘ: Thiết kế lại để tách biệt hoàn toàn */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-lg z-[10000] relative">
        <div className="flex items-center gap-3 w-1/2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-slate-800 border-b-2 border-transparent hover:border-indigo-300 focus:border-indigo-600 focus:outline-none bg-transparent w-full px-1 py-1 transition-all"
            placeholder="Nhập tên đề thi..."
          />
        </div>

        {/* NHÓM NÚT BẤM: Thêm khoảng cách đệm bên phải để không bị Avatar đè lên */}
        <div className="flex gap-3 items-center">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              <><span>💾</span> Lưu Đề Thi</>
            )}
          </button>
          
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-600 font-semibold rounded-xl transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* KHU VỰC CHÍNH: CHIA 2 CỘT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* CỘT TRÁI: EDITOR */}
        <div className="w-1/2 h-full overflow-y-auto p-6 border-r border-slate-200 bg-slate-50/50">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-sm z-20 py-2">
            <h3 className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
              <span className="text-xl">✏️</span> Trình chỉnh sửa câu hỏi
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
              Tổng: {questions.length} câu
            </span>
          </div>

          <div className="space-y-6 pb-24">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                      {qIndex + 1}
                    </span>
                    <h4 className="font-bold text-slate-700">Câu hỏi {qIndex + 1}</h4>
                  </div>
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                  >
                    🗑️ Xóa câu
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <textarea 
                      value={q.content || ""}
                      onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all min-h-[100px] text-slate-700"
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                      <div key={optIndex} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${q.correctAnswer === optIndex ? 'border-green-500 bg-green-50/50' : 'border-slate-100 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === optIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                          className="w-5 h-5 accent-green-600 cursor-pointer"
                        />
                        <span className="font-bold text-slate-400 w-4">{label}.</span>
                        <input 
                          type="text"
                          value={q.options?.[optIndex] || ""}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          className="flex-1 bg-transparent outline-none text-slate-700"
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
              className="w-full py-5 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-2xl hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex justify-center items-center gap-2"
            >
              <span className="text-xl">➕</span> Thêm câu hỏi mới
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: PREVIEW */}
        <div className="w-1/2 h-full overflow-y-auto p-10 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-indigo-600 font-bold tracking-widest uppercase text-xs">Bản xem trước đề thi</span>
              <h1 className="text-3xl font-black text-slate-800 mt-2">{title}</h1>
              <div className="h-1.5 w-20 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="space-y-10 pb-24">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <span className="text-6xl mb-4">📄</span>
                  <p className="italic">Chưa có nội dung hiển thị</p>
                </div>
              ) : (
                questions.map((q, qIndex) => (
                  <div key={qIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex gap-3 mb-4">
                      <span className="font-black text-indigo-600">Câu {qIndex + 1}:</span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {q.content || "..."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                        <div key={optIndex} className={`flex items-start gap-2 ${q.correctAnswer === optIndex ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
                          <span>{label}.</span>
                          <span>{q.options?.[optIndex] || "..."}</span>
                          {q.correctAnswer === optIndex && <span className="text-lg">✓</span>}
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
    </div>
  );
};

export default ExamEditor;
