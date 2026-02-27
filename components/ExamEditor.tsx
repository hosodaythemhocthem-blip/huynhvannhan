import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// 1. ĐỊNH NGHĨA INTERFACE
export interface Statement {
  content: string; // HTML content
  isTrue: boolean;
}

export interface Question {
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'true_false_cluster';
  content: string;
  options: string[]; // HTML content
  correctAnswer?: number;
  correctText?: string;
  points?: number;
  statements?: Statement[];
  explanation?: string; // <-- THÊM MỚI: Lời giải chi tiết
}

export interface Exam {
  id?: string;
  title: string;
  timeLimit: number;
  questions: Question[];
}

interface ExamEditorProps {
  user: { id: string } | null;
  exam?: Exam | null;
  aiGeneratedData?: Partial<Exam> | null;
  onClose: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({ user, exam, aiGeneratedData, onClose }) => {
  const [title, setTitle] = useState(exam?.title || "Đề thi mới (Chưa đặt tên)");
  const [timeLimit, setTimeLimit] = useState<number>(exam?.timeLimit || 45);
  const [questions, setQuestions] = useState<Question[]>(exam?.questions || []);
  const [saving, setSaving] = useState(false);

  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
  }, [questions]);

  useEffect(() => {
    if (aiGeneratedData) {
      if (aiGeneratedData.title) setTitle(aiGeneratedData.title);
      if (aiGeneratedData.questions) {
        const formattedQs: Question[] = aiGeneratedData.questions.map((q: any) => ({
          type: q.type || 'multiple_choice',
          content: q.content || "",
          options: q.options || ["", "", "", ""],
          correctAnswer: q.correctAnswer || 0,
          correctText: q.correctText || "",
          points: q.points || 1,
          explanation: q.explanation || "",
          statements: q.statements || [
            { content: '', isTrue: true },
            { content: '', isTrue: false },
            { content: '', isTrue: true },
            { content: '', isTrue: false }
          ]
        }));
        setQuestions(formattedQs);
      }
    }
  }, [aiGeneratedData]);

  const handlePermanentSave = async () => {
    if (!title.trim()) return alert("Vui lòng nhập tên đề thi!");
    if (questions.length === 0) return alert("Chưa có câu hỏi nào để lưu!");
    if (timeLimit <= 0) return alert("Thời gian làm bài phải lớn hơn 0!");

    setSaving(true);
    try {
      const teacherId = user?.id;
      if (!teacherId) throw new Error("Bạn cần đăng nhập để lưu đề thi!");

      const examPayload = {
        title: title,
        time_limit: timeLimit,
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

      alert("🎉 Lưu thành công! Các hình ảnh và lời giải đã được lưu trữ.");
      onClose();
    } catch (error: any) {
      console.error("Lỗi lưu trữ:", error);
      alert(`Lỗi rồi: ${error.message || "Không thể kết nối Database"}`);
    } finally {
      setSaving(false);
    }
  };

  const updateStatement = (qIndex: number, sIndex: number, field: 'content' | 'isTrue', value: any) => {
    const newQs = [...questions];
    if (newQs[qIndex].statements) {
      newQs[qIndex].statements![sIndex] = { ...newQs[qIndex].statements![sIndex], [field]: value };
      setQuestions(newQs);
    }
  };

  // Module cho câu hỏi chính VÀ lời giải (Hỗ trợ full chức năng + chèn ảnh)
  const mainQuillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['image', 'formula'],
      ['clean']
    ],
  };

  // Module RÚT GỌN cho đáp án
  const miniQuillModules = {
    toolbar: [
      ['bold', 'italic', 'image', 'formula']
    ],
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col h-screen font-sans mt-20 border-t-4 border-indigo-600">
      
      {/* ÉP XUNG CSS CHO REACT QUILL ĐỂ CHỮ ĐEN 100% */}
      <style>{`
        .ql-editor {
          color: #0f172a !important; /* Đen đậm */
          font-size: 15px !important;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8 !important; /* Xám đậm cho placeholder */
          font-style: italic;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex justify-between items-center p-6 bg-slate-50 shadow-sm">
        <div className="flex flex-col gap-2">
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black text-indigo-900 bg-transparent outline-none border-b-2 border-indigo-200 focus:border-indigo-600 pb-1 w-[400px]"
            placeholder="Tên đề thi siêu cấp..."
          />
          <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
            <span>SỐ CÂU: {questions.length}</span>
            <span className="text-amber-500">TỔNG ĐIỂM: {totalPoints}</span>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 ml-2">
              ⏱️ <input 
                type="number" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="1"
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
                
                {/* TOOLBAR CÂU HỎI */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-sm">CÂU {qIndex + 1}</span>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const newQs = [...questions];
                        const newType = e.target.value as Question['type'];
                        newQs[qIndex].type = newType;
                        
                        if (newType === 'true_false') {
                          newQs[qIndex].options = ['Đúng', 'Sai'];
                          newQs[qIndex].correctAnswer = 0;
                        } else if (newType === 'multiple_choice') {
                          newQs[qIndex].options = ["", "", "", ""];
                          newQs[qIndex].correctAnswer = 0;
                        } else if (newType === 'true_false_cluster') {
                          newQs[qIndex].statements = [
                            { content: '', isTrue: true },
                            { content: '', isTrue: false },
                            { content: '', isTrue: true },
                            { content: '', isTrue: false }
                          ];
                        }
                        setQuestions(newQs);
                      }}
                      className="text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none hover:border-indigo-300 transition-colors"
                    >
                      <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                      <option value="true_false_cluster">Đúng/Sai (Nhiều ý a,b,c,d)</option>
                      <option value="short_answer">Trả lời ngắn</option>
                      <option value="true_false">Đúng / Sai (Cũ)</option>
                    </select>

                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-amber-300 transition-colors shadow-sm">
                      <span className="text-sm font-bold text-slate-500 mr-2">Điểm:</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={q.points !== undefined ? q.points : 1}
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIndex].points = Number(e.target.value);
                          setQuestions(newQs);
                        }}
                        className="w-14 text-amber-600 font-black bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  {/* NÚT XÓA NGUYÊN CÂU HỎI */}
                  <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-red-500 hover:text-white transition-colors ml-2">
                    🗑️ XÓA CÂU NÀY
                  </button>
                </div>

                {/* NỘI DUNG CÂU HỎI CHÍNH */}
                <div className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                  <ReactQuill 
                    theme="snow"
                    value={q.content}
                    onChange={(content) => {
                      const newQs = [...questions];
                      newQs[qIndex].content = content;
                      setQuestions(newQs);
                    }}
                    modules={mainQuillModules}
                    placeholder="Nhập nội dung câu hỏi hoặc Ctrl+V để dán ảnh..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="mt-4">
                  {/* TRẮC NGHIỆM ĐÁP ÁN (MULTIPLE CHOICE / TRUE FALSE) */}
                  {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                    <div className="grid grid-cols-2 gap-4">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${q.correctAnswer === oIdx ? 'border-green-500 bg-green-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                checked={q.correctAnswer === oIdx} 
                                onChange={() => {
                                  const newQs = [...questions];
                                  newQs[qIndex].correctAnswer = oIdx;
                                  setQuestions(newQs);
                                }}
                                className="w-5 h-5 accent-green-600 cursor-pointer"
                              />
                              <span className="font-bold text-indigo-700">Đáp án {String.fromCharCode(65 + oIdx)}</span>
                            </div>
                            
                            {/* NÚT XÓA TỪNG ĐÁP ÁN A, B, C, D */}
                            <button
                              onClick={() => {
                                const newQs = [...questions];
                                newQs[qIndex].options = newQs[qIndex].options.filter((_: any, i: number) => i !== oIdx);
                                if (newQs[qIndex].correctAnswer === oIdx) {
                                  newQs[qIndex].correctAnswer = 0; 
                                } else if (newQs[qIndex].correctAnswer !== undefined && newQs[qIndex].correctAnswer! > oIdx) {
                                  newQs[qIndex].correctAnswer! -= 1; 
                                }
                                setQuestions(newQs);
                              }}
                              className="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white text-xs font-bold px-2 py-1 rounded transition-colors"
                              title="Xóa đáp án này"
                            >
                              🗑️ Xóa đáp án
                            </button>
                          </div>
                          
                          {/* Ô NHẬP LIỆU */}
                          <div className="bg-white rounded-md overflow-hidden border border-slate-200 mini-quill">
                            {q.type === 'true_false' ? (
                              <input 
                                type="text"
                                value={q.options[oIdx]}
                                onChange={(e) => {
                                  const newQs = [...questions];
                                  newQs[qIndex].options[oIdx] = e.target.value;
                                  setQuestions(newQs);
                                }}
                                className="w-full p-2 text-sm font-bold text-slate-900 outline-none bg-transparent"
                              />
                            ) : (
                              <ReactQuill 
                                theme="snow"
                                value={q.options[oIdx]} 
                                onChange={(content) => {
                                  const newQs = [...questions];
                                  newQs[qIndex].options[oIdx] = content;
                                  setQuestions(newQs);
                                }}
                                modules={miniQuillModules}
                                placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + oIdx)}...`}
                              />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* NÚT THÊM ĐÁP ÁN */}
                      <button
                        onClick={() => {
                          const newQs = [...questions];
                          newQs[qIndex].options.push(""); 
                          setQuestions(newQs);
                        }}
                        className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all p-3"
                      >
                        + THÊM ĐÁP ÁN
                      </button>
                    </div>
                  )}

                  {/* ĐÚNG/SAI CẤU TRÚC MỚI (CLUSTER) */}
                  {q.type === 'true_false_cluster' && q.statements && (
                    <div className="space-y-4">
                      <div className="text-sm font-bold text-indigo-700 bg-indigo-50 p-2 rounded-lg inline-block mb-1">
                        👉 Dán ảnh (Ctrl+V) hoặc gõ text, rồi chọn Đúng/Sai:
                      </div>
                      {q.statements.map((stmt, sIdx) => (
                        <div key={sIdx} className="flex flex-col gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-300 transition-all focus-within:border-indigo-500">
                          
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-indigo-500 bg-indigo-50 w-8 h-8 flex items-center justify-center rounded-full uppercase">
                                {String.fromCharCode(97 + sIdx)} {/* Tự nhảy a, b, c, d... */}
                              </span>
                              
                              {/* Nút Chọn Đúng / Sai */}
                              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                <button
                                  onClick={() => updateStatement(qIndex, sIdx, 'isTrue', true)}
                                  className={`px-5 py-1.5 rounded-md text-sm font-black transition-all ${stmt.isTrue ? 'bg-green-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                >
                                  ĐÚNG
                                </button>
                                <button
                                  onClick={() => updateStatement(qIndex, sIdx, 'isTrue', false)}
                                  className={`px-5 py-1.5 rounded-md text-sm font-black transition-all ${!stmt.isTrue ? 'bg-red-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                >
                                  SAI
                                </button>
                              </div>
                            </div>

                            {/* NÚT XÓA TỪNG Ý (a,b,c,d) */}
                            <button
                              onClick={() => {
                                const newQs = [...questions];
                                newQs[qIndex].statements = newQs[qIndex].statements!.filter((_: any, i: number) => i !== sIdx);
                                setQuestions(newQs);
                              }}
                              className="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                              title="Xóa ý này"
                            >
                              🗑️ Xóa ý {String.fromCharCode(97 + sIdx)}
                            </button>
                          </div>

                          {/* Mini Editor cho từng ý a, b, c, d */}
                          <div className="bg-slate-50 rounded-md overflow-hidden border border-slate-200 mini-quill">
                            <ReactQuill
                              theme="snow"
                              value={stmt.content}
                              onChange={(content) => updateStatement(qIndex, sIdx, 'content', content)}
                              modules={miniQuillModules}
                              placeholder={`Nhập nội dung ý ${String.fromCharCode(97 + sIdx)} hoặc dán ảnh (Ctrl+V)...`}
                            />
                          </div>

                        </div>
                      ))}

                      {/* NÚT THÊM Ý CHO CÂU ĐÚNG/SAI */}
                      <button
                        onClick={() => {
                          const newQs = [...questions];
                          newQs[qIndex].statements!.push({ content: '', isTrue: true });
                          setQuestions(newQs);
                        }}
                        className="w-full flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all p-3"
                      >
                        + THÊM Ý MỚI
                      </button>
                    </div>
                  )}

                  {/* TRẢ LỜI NGẮN */}
                  {q.type === 'short_answer' && (
                    <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
                      <label className="text-sm font-bold text-slate-500">Nhập đáp án chính xác (Dùng để hệ thống chấm điểm tự động):</label>
                      <input 
                        type="text"
                        value={q.correctText || ''}
                        onChange={(e) => {
                          const newQs = [...questions];
                          newQs[qIndex].correctText = e.target.value;
                          setQuestions(newQs);
                        }}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium text-slate-900"
                        placeholder="Ví dụ: 1945, Hà Nội, H2O..."
                      />
                    </div>
                  )}

                  {/* THÊM MỚI: LỜI GIẢI CHI TIẾT CHO CÂU HỎI */}
                  <div className="mt-6 bg-blue-50/50 rounded-xl border-2 border-blue-100 p-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-2">
                      💡 Lời giải chi tiết (Hiển thị cho học sinh sau khi nộp bài):
                    </label>
                    <div className="bg-white rounded-md overflow-hidden border border-slate-200 text-slate-900">
                      <ReactQuill 
                        theme="snow"
                        value={q.explanation || ''}
                        onChange={(content) => {
                          const newQs = [...questions];
                          newQs[qIndex].explanation = content;
                          setQuestions(newQs);
                        }}
                        modules={mainQuillModules}
                        placeholder="Nhập lời giải hoặc Ctrl+V để dán ảnh giải thích..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setQuestions([...questions, { type: 'multiple_choice', content: "", options: ["", "", "", ""], correctAnswer: 0, correctText: "", points: 1, explanation: "" }])}
              className="w-full py-6 border-4 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
            >
              + THÊM CÂU HỎI MỚI
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW) */}
        <div className="w-[50%] h-full overflow-y-auto p-12 bg-slate-100">
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50">
             <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-black text-slate-800 uppercase flex-1 pr-4 leading-tight">{title}</h2>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold border border-indigo-100 whitespace-nowrap shadow-sm">
                    ⏱️ {timeLimit} Phút
                  </div>
                  <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-xl font-bold border border-amber-100 whitespace-nowrap text-sm shadow-sm">
                    ⭐ Tổng: {totalPoints} Điểm
                  </div>
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
                 <div key={i} className="mb-10 animate-in fade-in slide-in-from-bottom-4 border-b-2 border-slate-100 pb-10">
                   <div className="font-bold text-slate-800 flex items-start gap-2 mb-3">
                     <span className="text-indigo-600 whitespace-nowrap mt-1">Câu {i+1}:</span> 
                     <div 
                       className="prose prose-sm max-w-none flex-1 mt-1 break-words text-slate-900"
                       dangerouslySetInnerHTML={{ __html: q.content || "..." }} 
                     />
                     <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs whitespace-nowrap ml-2 mt-1">
                       {q.points !== undefined ? q.points : 1} đ
                     </span>
                   </div>
                   
                   <div className="pl-12">
                     {/* PREVIEW TRẮC NGHIỆM */}
                     {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                        <div className="grid grid-cols-2 gap-4">
                          {q.options?.map((label: string, oi: number) => (
                            <div key={oi} className={`text-sm rounded-lg p-3 transition-colors flex items-start gap-2 ${q.correctAnswer === oi ? 'text-green-800 bg-green-50 border border-green-200' : 'text-slate-700 hover:bg-slate-50 border border-slate-100'}`}>
                              <span className="font-bold text-slate-900 shrink-0">{String.fromCharCode(65 + oi)}.</span> 
                              <div 
                                className="prose prose-sm max-w-none break-words flex-1 overflow-hidden text-slate-900" 
                                dangerouslySetInnerHTML={{ __html: label || "..." }} 
                              />
                              {q.correctAnswer === oi && <span className="text-green-600 font-bold shrink-0">✓</span>}
                            </div>
                          ))}
                        </div>
                     )}

                     {/* PREVIEW CẤU TRÚC ĐÚNG SAI MỚI */}
                     {q.type === 'true_false_cluster' && q.statements && (
                        <div className="grid grid-cols-1 gap-3 mt-2">
                          {q.statements.map((stmt, sIdx) => (
                            <div key={sIdx} className="flex justify-between items-start text-sm rounded-xl p-4 bg-slate-50 border border-slate-200">
                              <div className="flex-1 pr-4 flex items-start gap-2 overflow-hidden">
                                <span className="font-black text-indigo-500 shrink-0">{String.fromCharCode(97 + sIdx)}.</span>
                                <div 
                                  className="prose prose-sm max-w-none text-slate-900 break-words flex-1"
                                  dangerouslySetInnerHTML={{ __html: stmt.content || "..." }}
                                />
                              </div>
                              <div className="flex gap-2 shrink-0 mt-1">
                                 {stmt.isTrue ? (
                                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-bold text-xs border border-green-200 shadow-sm">Đúng ✓</span>
                                 ) : (
                                   <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-bold text-xs border border-red-200 shadow-sm">Sai ✗</span>
                                 )}
                              </div>
                            </div>
                          ))}
                        </div>
                     )}

                     {/* PREVIEW TRẢ LỜI NGẮN */}
                     {q.type === 'short_answer' && (
                        <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg inline-block min-w-[200px] text-sm text-slate-400 mt-2 bg-slate-50">
                          {q.correctText ? <span className="text-green-600 font-bold">{q.correctText} ✓</span> : "Học sinh sẽ nhập đáp án vào đây..."}
                         </div>
                     )}

                     {/* PREVIEW LỜI GIẢI CHI TIẾT */}
                     {q.explanation && q.explanation !== '<p><br></p>' && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                          <span className="font-bold text-blue-700 block mb-2">💡 Lời giải chi tiết:</span>
                          <div 
                            className="prose prose-sm max-w-none text-slate-900 break-words"
                            dangerouslySetInnerHTML={{ __html: q.explanation }}
                          />
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
