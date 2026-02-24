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

  useEffect(() => {
    if (aiGeneratedData) {
      if (aiGeneratedData.title) setTitle(aiGeneratedData.title);
      if (aiGeneratedData.questions) setQuestions(aiGeneratedData.questions);
    }
  }, [aiGeneratedData]);

  // HÀM LƯU VĨNH VIỄN VÀO DATABASE
  const handlePermanentSave = async () => {
    if (!title.trim()) return alert("Vui lòng nhập tên đề thi!");
    if (questions.length === 0) return alert("Chưa có câu hỏi nào để lưu!");

    setSaving(true);
    try {
      // 1. Kiểm tra User ID (Bắt buộc phải có để lưu vĩnh viễn)
      const teacherId = user?.id;
      if (!teacherId) throw new Error("Bạn cần đăng nhập để lưu đề thi!");

      const examPayload = {
        title: title,
        questions: questions,
        teacher_id: teacherId,
        updated_at: new Date().toISOString(),
        is_locked: false // Cho phép chỉnh sửa sau này
      };

      let result;
      if (exam?.id) {
        // Cập nhật nếu đề đã tồn tại
        result = await supabase.from('exams').update(examPayload).eq('id', exam.id);
      } else {
        // Thêm mới nếu là đề mới tạo
        result = await supabase.from('exams').insert([examPayload]);
      }

      if (result.error) throw result.error;

      alert("🎉 Đỉnh luôn bạn ơi! Đề thi đã được lưu vĩnh viễn vào hệ thống.");
      onClose(); // Đóng trình soạn thảo sau khi lưu thành công

    } catch (error: any) {
      console.error("Lỗi lưu trữ:", error);
      alert(`Lỗi rồi: ${error.message || "Không thể kết nối Database"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    // FIX GIAO DIỆN: Đẩy toàn bộ Editor xuống 80px để tránh cái Header bị đè
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col h-screen font-sans mt-20 border-t-4 border-indigo-600">
      
      {/* THANH CÔNG CỤ RIÊNG BIỆT */}
      <div className="flex justify-between items-center p-6 bg-slate-50 shadow-sm">
        <div className="flex flex-col">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black text-indigo-900 bg-transparent outline-none border-b-2 border-indigo-200 focus:border-indigo-600 pb-1"
            placeholder="Tên đề thi siêu cấp..."
          />
          <span className="text-xs text-slate-500 font-bold mt-1">SỐ CÂU HIỆN TẠI: {questions.length}</span>
        </div>

        <div className="flex gap-4">
          {/* NÚT LƯU SIÊU ĐỈNH - KHÔNG BỊ ĐÈ NỮA */}
          <button 
            onClick={handlePermanentSave} 
            disabled={saving}
            className={`px-10 py-3 ${saving ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'} text-white font-black rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center gap-2`}
          >
            {saving ? "🚀 ĐANG LƯU..." : "💾 LƯU VĨNH VIỄN"}
          </button>
          
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
            ĐÓNG
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: NHẬP LIỆU */}
        <div className="w-1/2 h-full overflow-y-auto p-8 border-r-2 border-slate-100 bg-white">
          <div className="space-y-8 pb-40">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 relative group">
                <div className="flex justify-between mb-4">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-black">CÂU {qIndex + 1}</span>
                  <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-400 font-bold text-xs hover:text-red-600">🗑️ XÓA CÂU NÀY</button>
                </div>
                <textarea 
                  value={q.content}
                  onChange={(e) => {
                    const newQs = [...questions];
                    newQs[qIndex].content = e.target.value;
                    setQuestions(newQs);
                  }}
                  className="w-full p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none mb-4 min-h-[100px]"
                  placeholder="Nhập câu hỏi tại đây..."
                />
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((opt, oIdx) => (
                    <div key={oIdx} className={`flex items-center gap-2 p-3 rounded-xl border-2 ${q.correctAnswer === oIdx ? 'border-green-500 bg-green-50' : 'border-white bg-white'}`}>
                      <input 
                        type="radio" 
                        checked={q.correctAnswer === oIdx} 
                        onChange={() => {
                          const newQs = [...questions];
                          newQs[qIndex].correctAnswer = oIdx;
                          setQuestions(newQs);
                        }}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="font-bold text-slate-400">{opt}.</span>
                      <input 
                        type="text" 
                        value={q.options[oIdx]} 
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIndex].options[oIdx] = e.target.value;
                          setQuestions(newQs);
                        }}
                        className="bg-transparent outline-none w-full text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setQuestions([...questions, { content: "", options: ["", "", "", ""], correctAnswer: 0 }])}
              className="w-full py-6 border-4 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black hover:border-indigo-400 hover:text-indigo-600 transition-all"
            >
              + THÊM CÂU HỎI MỚI
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC */}
        <div className="w-1/2 h-full overflow-y-auto p-12 bg-slate-50">
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200">
             <h2 className="text-3xl font-black text-center text-slate-800 mb-2 uppercase">{title}</h2>
             <div className="w-20 h-2 bg-indigo-600 mx-auto mb-10 rounded-full"></div>
             
             {questions.length === 0 ? (
               <div className="text-center py-20">
                 <div className="text-6xl mb-4 opacity-20">📝</div>
                 <p className="text-slate-400 italic font-medium">Đề thi đang trống</p>
               </div>
             ) : (
               questions.map((q, i) => (
                 <div key={i} className="mb-10 animate-in fade-in slide-in-from-bottom-4">
                   <p className="font-bold text-slate-800 flex gap-2">
                     <span className="text-indigo-600">Câu {i+1}:</span> {q.content || "..."}
                   </p>
                   <div className="grid grid-cols-2 gap-4 mt-4 pl-8">
                     {['A', 'B', 'C', 'D'].map((label, oi) => (
                       <div key={oi} className={`text-sm ${q.correctAnswer === oi ? 'text-green-600 font-black' : 'text-slate-500'}`}>
                         {label}. {q.options[oi] || "..."} {q.correctAnswer === oi && "✓"}
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
