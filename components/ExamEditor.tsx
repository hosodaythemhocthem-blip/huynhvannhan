import React, { useState, useEffect, useCallback, useRef } from "react";
import { Exam, Question } from "../types";
import MathPreview from "./MathPreview";
import { examService } from "../services/exam.service";
import { geminiService } from "../services/geminiService";
import { 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Wand2, 
  FileText, 
  Check, 
  Eye, 
  EyeOff,
  MoreVertical
} from "lucide-react";

interface Props {
  exam?: Exam;
  teacherId: string;
}

const ExamEditor: React.FC<Props> = ({ exam, teacherId }) => {
  // State quản lý tiêu đề và danh sách câu hỏi
  const [title, setTitle] = useState(exam?.title ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // State cho UI
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Ref để debounce auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= KHỞI TẠO DỮ LIỆU ================= */
  useEffect(() => {
    if (exam?.raw_content) {
      // Logic parse đơn giản ban đầu, nếu raw_content là JSON string thì parse JSON, nếu không thì split text
      try {
        const parsed = JSON.parse(exam.raw_content);
        if (Array.isArray(parsed)) {
            setQuestions(parsed);
            if(parsed.length > 0) setActiveQuestionId(parsed[0].id);
            return;
        }
      } catch (e) {
        // Fallback: Nếu không phải JSON, tách theo dòng (legacy support)
        const lines = exam.raw_content.split(/\n+/).filter(Boolean);
        const mapped = lines.map((line, idx) => createEmptyQuestion(idx + 1, line));
        setQuestions(mapped);
        if(mapped.length > 0) setActiveQuestionId(mapped[0].id);
      }
    } else {
        // Nếu đề mới tinh, thêm 1 câu hỏi trống
        const q = createEmptyQuestion(1);
        setQuestions([q]);
        setActiveQuestionId(q.id);
    }
  }, [exam]);

  // Hàm tạo câu hỏi mới chuẩn cấu trúc
  const createEmptyQuestion = (order: number, content: string = ""): Question => ({
    id: crypto.randomUUID(),
    exam_id: exam?.id ?? "",
    content: content,
    type: "mcq", // Mặc định là trắc nghiệm
    options: [], // Sẽ chứa ["A...", "B...", "C...", "D..."]
    answer: "",
    points: 1,
    order: order,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  /* ================= AUTO SAVE LOGIC ================= */
  const triggerAutoSave = () => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(true);
    }, 3000); // Tự động lưu sau 3s ngừng gõ
  };

  useEffect(() => {
    // Lắng nghe Ctrl+S
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, title]); // Re-bind khi data thay đổi để lưu bản mới nhất

  /* ================= CRUD OPERATIONS ================= */
  const addQuestion = () => {
    const newQ = createEmptyQuestion(questions.length + 1);
    setQuestions(prev => [...prev, newQ]);
    setActiveQuestionId(newQ.id);
    triggerAutoSave();
    
    // Scroll xuống cuối (tùy chọn)
    setTimeout(() => {
        document.getElementById(`q-${newQ.id}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value, updated_at: new Date().toISOString() } : q
    ));
    triggerAutoSave();
  };

  const deleteQuestion = (id: string) => {
    // Không cần confirm nếu nội dung trống
    const q = questions.find(x => x.id === id);
    if (q && q.content.trim() !== "" && !window.confirm("Xóa câu hỏi này?")) return;

    setQuestions(prev => prev.filter(q => q.id !== id));
    triggerAutoSave();
  };

  const duplicateQuestion = (q: Question) => {
      const newQ = { 
          ...q, 
          id: crypto.randomUUID(), 
          order: questions.length + 1,
          updated_at: new Date().toISOString()
      };
      setQuestions(prev => [...prev, newQ]);
      setActiveQuestionId(newQ.id);
      triggerAutoSave();
  };

  /* ================= IMPORT & AI ================= */
  const handlePasteFromWord = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        // Hỏi người dùng muốn AI phân tích hay paste thô
        if (window.confirm("Bạn vừa paste một đoạn văn bản dài. Bạn có muốn AI tự động tách câu hỏi trắc nghiệm không?")) {
            setIsAiProcessing(true);
            try {
                // Gọi service AI đã định nghĩa (giả sử geminiService.parseExamWithAI trả về { questions: [...] })
                const result = await geminiService.parseExamWithAI(text);
                if (result && result.questions) {
                    const newQuestions = result.questions.map((q: any, idx: number) => ({
                        ...createEmptyQuestion(questions.length + idx + 1),
                        content: q.text || q.question, // Adapt tùy output của AI
                        options: q.options || [],
                        answer: q.correctAnswer || "",
                    }));
                    setQuestions(prev => [...prev, ...newQuestions]);
                    alert(`Đã thêm thành công ${newQuestions.length} câu hỏi!`);
                }
            } catch (err) {
                alert("AI đang bận, đã chuyển sang chế độ dán thường.");
                // Fallback dán thường vào câu đang active
                if (activeQuestionId) updateQuestion(activeQuestionId, 'content', text);
            } finally {
                setIsAiProcessing(false);
            }
        } else {
            // Paste thường vào câu hiện tại
            if (activeQuestionId) {
                const currentQ = questions.find(q => q.id === activeQuestionId);
                updateQuestion(activeQuestionId, 'content', (currentQ?.content || "") + "\n" + text);
            }
        }
    } catch (e) {
        alert("Trình duyệt không cho phép truy cập clipboard. Vui lòng dùng phím Ctrl+V.");
    }
  };

  /* ================= SAVE ================= */
  const handleSave = useCallback(async (isAuto = false) => {
    if (!title.trim()) {
       if (!isAuto) alert("Vui lòng nhập tiêu đề đề thi");
       return;
    }

    try {
      setSaving(true);
      // Serialize questions thành JSON string để lưu vào cột raw_content (hoặc tạo bảng questions riêng nếu backend hỗ trợ)
      // Ở đây mình lưu JSON vào raw_content để đơn giản hóa migration
      const contentToSave = JSON.stringify(questions);
      
      await examService.saveExam({
        id: exam?.id ?? crypto.randomUUID(),
        title,
        teacher_id: teacherId,
        description: `Gồm ${questions.length} câu hỏi.`,
        is_locked: false,
        is_archived: false,
        file_url: null,
        raw_content: contentToSave, 
        total_points: questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
        version: (exam?.version ?? 0) + 1,
      });

      setLastSaved(new Date());
      if (!isAuto) alert("Đã lưu thành công!");
    } catch (err) {
      console.error(err);
      if (!isAuto) alert("Lỗi khi lưu đề thi. Vui lòng kiểm tra kết nối.");
    } finally {
      setSaving(false);
    }
  }, [title, questions, teacherId, exam]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* --- TOP BAR --- */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4 flex-1">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <FileText size={20} />
            </div>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên đề thi..."
                className="text-lg font-bold text-slate-800 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 transition-colors w-full max-w-md placeholder-slate-400"
            />
        </div>

        <div className="flex items-center gap-3">
             <div className="text-xs text-slate-400 mr-2">
                {saving ? "Đang lưu..." : lastSaved ? `Đã lưu lúc ${lastSaved.toLocaleTimeString()}` : "Chưa lưu"}
             </div>
             
             <button
                onClick={handlePasteFromWord}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors border"
                title="Dán từ Clipboard (Hỗ trợ AI phân tích)"
            >
                {isAiProcessing ? <Wand2 className="animate-spin text-purple-600" size={16}/> : <Copy size={16} />}
                Paste & AI
             </button>

             <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${showPreview ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                Preview
             </button>

             <button
                onClick={() => handleSave(false)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
             >
                <Save size={16} /> Lưu Đề
             </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Question List & Edit */}
        <div className={`flex-1 overflow-y-auto p-6 transition-all ${showPreview ? 'pr-2' : ''}`}>
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                {questions.map((q, index) => (
                    <div 
                        key={q.id} 
                        id={`q-${q.id}`}
                        onClick={() => setActiveQuestionId(q.id)}
                        className={`group relative rounded-2xl border transition-all duration-200 ${activeQuestionId === q.id ? 'bg-white border-indigo-500 shadow-lg ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                    >
                        {/* Question Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                    Câu {index + 1}
                                </span>
                                <select 
                                    className="text-xs bg-transparent font-medium text-slate-600 outline-none cursor-pointer hover:text-indigo-600"
                                    value={q.type}
                                    onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                >
                                    <option value="mcq">Trắc nghiệm</option>
                                    <option value="essay">Tự luận</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => duplicateQuestion(q)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Nhân bản"><Copy size={14}/></button>
                                <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Xóa"><Trash2 size={14}/></button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="p-4">
                            <textarea
                                value={q.content}
                                onChange={(e) => updateQuestion(q.id, 'content', e.target.value)}
                                placeholder="Nhập nội dung câu hỏi (Hỗ trợ LaTeX: $x^2$)..."
                                className="w-full min-h-[100px] bg-transparent outline-none resize-y text-slate-700 leading-relaxed placeholder-slate-300 font-sans"
                                spellCheck={false}
                            />
                            
                            {/* Options Area (Chỉ hiện nếu là trắc nghiệm) */}
                            {q.type === 'mcq' && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Đáp án</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {['A', 'B', 'C', 'D'].map((optLabel, optIdx) => (
                                             <div key={optLabel} className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                                                    {optLabel}
                                                </div>
                                                <input 
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                                                    placeholder={`Đáp án ${optLabel}...`}
                                                    // Logic lưu options ở đây hơi phức tạp nếu dùng array, tạm thời để placeholder
                                                    // Thực tế bạn cần map options[optIdx] vào value
                                                />
                                                <input 
                                                    type="radio" 
                                                    name={`correct-${q.id}`} 
                                                    checked={q.answer === String(optIdx)}
                                                    onChange={() => updateQuestion(q.id, 'answer', String(optIdx))}
                                                    className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                                />
                                             </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Điểm số */}
                        <div className="px-4 py-2 border-t border-slate-100 flex justify-end">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Điểm:</span>
                                <input 
                                    type="number" 
                                    min="0" 
                                    step="0.5"
                                    value={q.points}
                                    onChange={(e) => updateQuestion(q.id, 'points', parseFloat(e.target.value))}
                                    className="w-16 border rounded px-2 py-1 text-center outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Nút thêm câu hỏi lớn ở dưới */}
                <button 
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                        <Plus size={20} className="text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    Thêm câu hỏi mới
                </button>
            </div>
        </div>

        {/* RIGHT: Live Preview (Ẩn hiện được) */}
        {showPreview && (
            <div className="w-1/2 bg-slate-100 border-l border-slate-200 overflow-y-auto p-8 hidden lg:block">
                <div className="bg-white min-h-[800px] shadow-xl rounded-none md:rounded-lg p-10 max-w-[21cm] mx-auto">
                    {/* Header giả lập giấy thi */}
                    <div className="text-center border-b-2 border-black pb-4 mb-8">
                        <h2 className="uppercase font-bold text-xl">{title || "ĐỀ THI MẪU"}</h2>
                        <p className="text-sm italic">Thời gian làm bài: 90 phút</p>
                    </div>

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="text-justify leading-relaxed">
                                <div className="font-bold inline mr-1">Câu {idx + 1}.</div>
                                <div className="inline">
                                    <MathPreview content={q.content} />
                                </div>
                                {q.type === 'mcq' && (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 ml-6">
                                        <div className="flex"><span className="font-bold mr-2">A.</span> ...</div>
                                        <div className="flex"><span className="font-bold mr-2">B.</span> ...</div>
                                        <div className="flex"><span className="font-bold mr-2">C.</span> ...</div>
                                        <div className="flex"><span className="font-bold mr-2">D.</span> ...</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                     <div className="mt-10 pt-4 border-t-2 border-black text-center text-sm font-bold">
                        --- HẾT ---
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExamEditor;
