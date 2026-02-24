import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface ExamEditorProps {
  user: any;
  exam: any;
  aiGeneratedData: any;
  onClose: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ user, exam, aiGeneratedData, onClose }) => {
  const [title, setTitle] = useState(exam?.title || "Đề thi mới (Chưa đặt tên)");
  const [questions, setQuestions] = useState<any[]>(exam?.questions || []);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    alert(`[${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    if (aiGeneratedData) {
      if (aiGeneratedData.title) setTitle(aiGeneratedData.title);
      if (aiGeneratedData.questions) setQuestions(aiGeneratedData.questions);
    }
  }, [aiGeneratedData]);

  const handleSave = async () => {
    if (!title.trim()) return showToast("Vui lòng nhập tên đề thi!", "error");
    if (questions.length === 0) return showToast("Đề thi cần ít nhất 1 câu hỏi!", "warning");
    setSaving(true);
    try {
      if (!user?.id) throw new Error("Vui lòng đăng nhập lại!");
      const payload = {
        title,
        questions, 
        updated_at: new Date().toISOString(),
        teacher_id: user.id,
        is_locked: true,
      };
      const { error } = exam?.id 
        ? await supabase.from('exams').update(payload).eq('id', exam.id)
        : await supabase.from('exams').insert([payload]);

      if (error) throw error;
      showToast("Lưu đề thi thành công!", "success");
      onClose(); 
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
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

  return (
    // FIX CHÍNH: Thêm z-[99999] cực cao và background đục hoàn toàn
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col h-screen font-sans overflow-hidden">
      
      {/* THANH HEADER MỚI: Dùng h-20 để đảm bảo che hết thanh tìm kiếm cũ */}
      <div className="h-20 flex justify-between items-center px-8 border-b-2 border-slate-100 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black text-slate-800 outline-none w-full max-w-md bg-transparent border-b-2 border-transparent focus:border-indigo-500 transition-all"
            placeholder="Nhập tên đề thi..."
          />
        </div>

        {/* NÚT BẤM: Đẩy sang trái một chút bằng margin-right để không bao giờ chạm tới khu vực Avatar cũ */}
        <div className="flex gap-4 items-center mr-10">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu Đề Thi"}
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold rounded-2xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* CỘT TRÁI: EDITOR */}
        <div className="w-1/2 h-full overflow-y-auto p-8 border-r border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-700">✏️ Nội dung câu hỏi</h3>
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-tighter">
               {questions.length} CÂU HỎI
            </span>
          </div>

          <div className="space-y-6 pb-32">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-600 font-black">CÂU {qIndex + 1}</span>
                  <button onClick={() => {
                    const newQs = questions.filter((_, i) => i !== qIndex);
                    setQuestions(newQs);
                  }} className="text-slate-400 hover:text-red-500 text-sm font-bold">🗑️ Xóa</button>
                </div>
                <textarea 
                  value={q.content || ""}
                  onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 min-h-[100px]"
                  placeholder="Nhập nội dung câu hỏi..."
                />
                <div className="grid grid-cols-1 gap-3">
                  {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                    <div key={optIndex} className={`flex items-center gap-3 p-3 rounded-2xl border ${q.correctAnswer === optIndex ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}>
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === optIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                        className="w-5 h-5 accent-green-600"
                      />
                      <span className="font-bold text-slate-400">{label}.</span>
                      <input 
                        type="text"
                        value={q.options?.[optIndex] || ""}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="flex-1 bg-transparent outline-none"
                        placeholder={`Đáp án ${label}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setQuestions([...questions, { content: "", options: ["", "", "", ""], correctAnswer: 0 }])}
              className="w-full py-6 border-2 border-dashed border-slate-300 text-slate-400 font-bold rounded-3xl hover:border-indigo-500 hover:text-indigo-600 transition-all"
            >
              + THÊM CÂU HỎI MỚI
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: PREVIEW */}
        <div className="w-1/2 h-full overflow-y-auto p-12 bg-white">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-800 uppercase">{title}</h2>
              <div className="w-20 h-2 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
            </div>
            {questions.length === 0 ? (
              <div className="text-center py-20 text-slate-300">
                <div className="text-6xl mb-4">📝</div>
                <p className="italic font-bold">Chưa có nội dung xem trước</p>
              </div>
            ) : (
              questions.map((q, i) => (
                <div key={i} className="mb-10">
                  <p className="font-bold text-slate-800 mb-4 flex gap-2">
                    <span className="text-indigo-600">Câu {i+1}:</span> {q.content || "..."}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    {['A', 'B', 'C', 'D'].map((label, oi) => (
                      <div key={oi} className={`text-sm ${q.correctAnswer === oi ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                        {label}. {q.options?.[oi] || "..."}
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
