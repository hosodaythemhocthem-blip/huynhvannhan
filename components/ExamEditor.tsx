import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Style mặc định của Quill

interface ExamEditorProps {
  user: any;
  exam: any;
  aiGeneratedData: any;
  onClose: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ user, exam, aiGeneratedData, onClose }) => {
  const [title, setTitle] = useState(exam?.title || "Đề thi mới (Chưa đặt tên)");
  const [timeLimit, setTimeLimit] = useState<number>(exam?.timeLimit || 45); // NÚT THỜI GIAN
  const [questions, setQuestions] = useState<any[]>(exam?.questions || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aiGeneratedData) {
      if (aiGeneratedData.title) setTitle(aiGeneratedData.title);
      if (aiGeneratedData.questions) {
        // Đảm bảo các câu hỏi cũ có định dạng type mặc định
        const formattedQs = aiGeneratedData.questions.map((q: any) => ({
          ...q,
          type: q.type || 'multiple_choice',
          correctText: q.correctText || ""
        }));
        setQuestions(formattedQs);
      }
    }
  }, [aiGeneratedData]);

  // HÀM LƯU VĨNH VIỄN VÀO DATABASE
  const handlePermanentSave = async () => {
    if (!title.trim()) return alert("Vui lòng nhập tên đề thi!");
    if (questions.length === 0) return alert("Chưa có câu hỏi nào để lưu!");

    setSaving(true);
    try {
      const teacherId = user?.id;
      if (!teacherId) throw new Error("Bạn cần đăng nhập để lưu đề thi!");

      const examPayload = {
        title: title,
        time_limit: timeLimit, // Thêm thời gian vào payload
        questions: questions,
        teacher_id: teacherId,
        updated_at: new Date().toISOString(),
        is_locked: false
      };

      let result;
      if (exam?.id) {
        result = await supabase.from('exams').update(examPayload).eq('id', exam.id);
      } else {
        result = await supabase.from('exams').insert([examPayload]);
      }

      if (result.error) throw result.error;

      alert("🎉 Đỉnh luôn bạn ơi! Đề thi đã được lưu vĩnh viễn vào hệ thống.");
      onClose();

    } catch (error: any) {
      console.error("Lỗi lưu trữ:", error);
      alert(`Lỗi rồi: ${error.message || "Không thể kết nối Database"}`);
    } finally {
      setSaving(false);
    }
  };

  // Cấu hình thanh công cụ của Editor
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['image', 'formula'],
      ['clean']
    ],
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col h-screen font-sans mt-20 border-t-4 border-indigo-600">
      
      {/* THANH CÔNG CỤ RIÊNG BIỆT */}
      <div className="flex justify-between items-center p-6 bg-slate-50 shadow-sm">
        <div className="flex flex-col gap-2">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black text-indigo-900 bg-transparent outline-none border-b-2 border-indigo-200 focus:border-indigo-600 pb-1"
            placeholder="Tên đề thi siêu cấp..."
          />
          <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
            <span>SỐ CÂU: {questions.length}</span>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200">
              ⏱️ <input 
                type="number" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-12 text-center outline-none text-indigo-600 font-black bg-transparent"
              /> Phút
            </div>
          </div>
        </div>

        <div className="flex gap-4">
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
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-black">CÂU {qIndex + 1}</span>
                    {/* MENU CHỌN LOẠI CÂU HỎI */}
                    <select
                      value={q.type || 'multiple_choice'}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[qIndex].type = e.target.value;
                        if (e.target.value === 'true_false') {
                          newQs[qIndex].options = ['Đúng', 'Sai'];
                          newQs[qIndex].correctAnswer = 0;
                        } else if (e.target.value === 'multiple_choice') {
                          newQs[qIndex].options = ["", "", "", ""];
                        }
                        setQuestions(newQs);
                      }}
                      className="text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                      <option value="true_false">Đúng / Sai</option>
                      <option value="short_answer">Trả lời ngắn</option>
                    </select>
                  </div>
                  <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-400 font-bold text-xs hover:text-red-600">🗑️ XÓA CÂU NÀY</button>
                </div>

                {/* KHUNG SOẠN THẢO DÁN ẢNH BẰNG CTRL+V */}
                <div className="mb-4 bg-white rounded-xl overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={q.content}
                    onChange={(content) => {
                      const newQs = [...questions];
                      newQs[qIndex].content = content;
                      setQuestions(newQs);
                    }}
                    modules={quillModules}
                    placeholder="Nhập nội dung câu hỏi hoặc Ctrl+V để dán ảnh..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* ĐỔI GIAO DIỆN ĐÁP ÁN THEO LOẠI CÂU HỎI */}
                <div className="mt-4">
                  {/* Giao diện: Trắc nghiệm hoặc Đúng/Sai */}
                  {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                    <div className={`grid ${q.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`flex items-center gap-2 p-3 rounded-xl border-2 ${q.correctAnswer === oIdx ? 'border-green-500 bg-green-50' : 'border-white bg-white'}`}>
                          <input 
                            type="radio" 
                            checked={q.correctAnswer === oIdx} 
                            onChange={() => {
                              const newQs = [...questions];
                              newQs[qIndex].correctAnswer = oIdx;
                              setQuestions(newQs);
                            }}
                            className="w-4 h-4 accent-green-600 cursor-pointer"
                          />
                          <span className="font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                          <input 
                            type="text" 
                            value={q.options[oIdx]} 
                            readOnly={q.type === 'true_false'} // Khoá nhập liệu nếu là câu Đúng/Sai
                            onChange={(e) => {
                              const newQs = [...questions];
                              newQs[qIndex].options[oIdx] = e.target.value;
                              setQuestions(newQs);
                            }}
                            className={`bg-transparent outline-none w-full text-sm ${q.type === 'true_false' ? 'font-bold text-slate-700 cursor-default' : ''}`}
                            placeholder="Nhập đáp án..."
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Giao diện: Trả lời ngắn */}
                  {q.type === 'short_answer' && (
                    <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border-2 border-slate-100">
                      <label className="text-sm font-bold text-slate-500">Nhập đáp án chính xác (Dùng để hệ thống chấm điểm tự động):</label>
                      <input 
                        type="text"
                        value={q.correctText || ''}
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIndex].correctText = e.target.value;
                          setQuestions(newQs);
                        }}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium"
                        placeholder="Ví dụ: 1945, Hà Nội, H2O..."
                      />
                    </div>
                  )}
                </div>

              </div>
            ))}
            <button 
              onClick={() => setQuestions([...questions, { type: 'multiple_choice', content: "", options: ["", "", "", ""], correctAnswer: 0, correctText: "" }])}
              className="w-full py-6 border-4 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black hover:border-indigo-400 hover:text-indigo-600 transition-all"
            >
              + THÊM CÂU HỎI MỚI
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC */}
        <div className="w-1/2 h-full overflow-y-auto p-12 bg-slate-50">
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200">
             <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black text-slate-800 uppercase flex-1">{title}</h2>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold border border-indigo-100 whitespace-nowrap">
                  ⏱️ {timeLimit} Phút
                </div>
             </div>
             <div className="w-20 h-2 bg-indigo-600 mb-10 rounded-full"></div>
             
             {questions.length === 0 ? (
               <div className="text-center py-20">
                 <div className="text-6xl mb-4 opacity-20">📝</div>
                 <p className="text-slate-400 italic font-medium">Đề thi đang trống</p>
               </div>
             ) : (
               questions.map((q, i) => (
                 <div key={i} className="mb-10 animate-in fade-in slide-in-from-bottom-4">
                   <div className="font-bold text-slate-800 flex gap-2">
                     <span className="text-indigo-600 whitespace-nowrap">Câu {i+1}:</span> 
                     {/* Cần dùng dangerouslySetInnerHTML để hiển thị HTML và hình ảnh từ Quill */}
                     <span 
                       className="prose prose-sm max-w-none"
                       dangerouslySetInnerHTML={{ __html: q.content || "..." }} 
                     />
                   </div>
                   
                   <div className="mt-4 pl-12">
                     {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                        <div className={`grid ${q.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                          {q.options?.map((label: string, oi: number) => (
                            <div key={oi} className={`text-sm ${q.correctAnswer === oi ? 'text-green-600 font-black bg-green-50 p-2 rounded-lg inline-block' : 'text-slate-500 p-2'}`}>
                              {String.fromCharCode(65 + oi)}. {label || "..."} {q.correctAnswer === oi && "✓"}
                            </div>
                          ))}
                        </div>
                     )}

                     {q.type === 'short_answer' && (
                        <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg inline-block min-w-[200px] text-sm text-slate-400">
                          {q.correctText ? <span className="text-green-600 font-bold">{q.correctText} ✓</span> : "Học sinh sẽ nhập đáp án vào đây..."}
                        </div>
                     )}
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
