import React, { useState } from 'react';
import { 
  Plus, Trash2, Settings2, Save 
} from 'lucide-react';
import { Question, QuestionType, Exam } from '../types';
import { extractQuestionsFromText } from '../services/geminiService';
import { createExam } from '../services/exam.service';

interface ExamEditorProps {
  initialExam?: Exam;
  isThptPreset?: boolean;
  onCancel: () => void;
}

const ExamEditor: React.FC<ExamEditorProps> = ({
  initialExam,
  isThptPreset = false,
  onCancel
}) => {

  /* ===================== STATE ===================== */
  const [activeTab, setActiveTab] = useState<'manual' | 'quick'>('quick');
  const [activeSection, setActiveSection] = useState<1 | 2 | 3>(1);

  const [title, setTitle] = useState(
    initialExam?.title || (isThptPreset ? 'Đề ôn tập THPT 2025' : '')
  );
  const [duration, setDuration] = useState(initialExam?.duration ?? 90);
  const [maxScore, setMaxScore] = useState(initialExam?.maxScore ?? 10);

  const [part1Points, setPart1Points] = useState(0.25);
  const [part2Points, setPart2Points] = useState(1);
  const [part3Points, setPart3Points] = useState(0.5);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [rawText, setRawText] = useState('');
  const [rawAnswers, setRawAnswers] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  /* ===================== QUESTION ===================== */
  const handleAddQuestion = (section: 1 | 2 | 3) => {
    const id = crypto.randomUUID();
    if (section === 1) {
      setQuestions(q => [...q, {
        id,
        section,
        type: QuestionType.MULTIPLE_CHOICE,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }]);
    } else if (section === 2) {
      setQuestions(q => [...q, {
        id,
        section,
        type: QuestionType.TRUE_FALSE,
        text: '',
        options: [],
        subQuestions: [
          { id: 'a', text: '', correctAnswer: true },
          { id: 'b', text: '', correctAnswer: false },
          { id: 'c', text: '', correctAnswer: false },
          { id: 'd', text: '', correctAnswer: false }
        ],
        correctAnswer: null
      }]);
    } else {
      setQuestions(q => [...q, {
        id,
        section,
        type: QuestionType.SHORT_ANSWER,
        text: '',
        options: [],
        correctAnswer: ''
      }]);
    }
    setActiveTab('manual');
  };

  const updateQuestion = (id: string, data: Partial<Question>) => {
    setQuestions(q => q.map(i => i.id === id ? { ...i, ...data } : i));
  };

  /* ===================== AI ===================== */
  const handleAiUpdate = async () => {
    if (!rawText.trim()) return;
    setIsAiLoading(true);
    const text = `${rawText}\n\nĐÁP ÁN:\n${rawAnswers}`;
    const aiQs = await extractQuestionsFromText(text);
    setQuestions(q => [
      ...q,
      ...aiQs.map(i => ({
        ...i,
        id: crypto.randomUUID(),
        section: activeSection
      }))
    ]);
    setActiveTab('manual');
    setIsAiLoading(false);
  };

  /* ===================== SAVE ===================== */
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề');
      return;
    }

    await createExam({
      title,
      duration,
      maxScore,
      subject: 'Toán',
      teacherId: 'TEMP_TEACHER_ID', // 👉 sau gắn auth.uid
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        score:
          q.section === 1 ? part1Points :
          q.section === 2 ? part2Points :
          part3Points
      })),
      createdAt: Date.now()
    });

    alert('✅ Đã lưu đề thi');
    onCancel();
  };

  const list = questions.filter(q => q.section === activeSection);

  /* ===================== UI ===================== */
  return (
    <div className="fixed inset-0 bg-slate-50 z-50 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black">Biên soạn đề thi</h2>
          <div className="flex gap-4">
            <button onClick={onCancel} className="font-bold text-slate-400">Hủy</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black">
              <Save size={18}/> Lưu đề
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Tên đề thi"
            className="w-full p-4 border rounded-xl font-bold" />
        </div>

        <div className="flex gap-3">
          {[1,2,3].map(i => (
            <button key={i}
              onClick={() => setActiveSection(i as any)}
              className={`px-6 py-3 rounded-xl font-black ${activeSection===i?'bg-blue-600 text-white':'bg-white'}`}>
              Phần {i}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl space-y-6">
          {list.map((q, idx) => (
            <div key={q.id} className="border rounded-2xl p-6 space-y-3">
              <textarea
                value={q.text}
                onChange={e => updateQuestion(q.id,{text:e.target.value})}
                className="w-full p-3 border rounded-xl font-bold"
                placeholder={`Câu ${idx+1}`}
              />
            </div>
          ))}

          <button
            onClick={() => handleAddQuestion(activeSection)}
            className="w-full border-2 border-dashed p-6 rounded-2xl font-black text-blue-500">
            <Plus/> Thêm câu hỏi
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExamEditor;
