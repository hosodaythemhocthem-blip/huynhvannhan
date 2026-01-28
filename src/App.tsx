import React, { useState, useEffect } from 'react';
import { UserRole } from './types/user';
import { Exam } from './types/exam';
import { Course } from './types/course';

import {
  Briefcase,
  GraduationCap,
  Upload,
  Sparkles,
  LogOut,
  BookOpen,
  Clock
} from 'lucide-react';

import { parseExamFile, generateCourseOutline } from './services/geminiService';
import CourseViewer from './components/CourseViewer';
import MathPreview from './components/MathPreview';

/* ===== localStorage keys ===== */
const LS_EXAMS = 'lumina_exams';
const LS_COURSES = 'lumina_courses';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'course_viewer'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  /* ===== load local data ===== */
  useEffect(() => {
    const e = localStorage.getItem(LS_EXAMS);
    const c = localStorage.getItem(LS_COURSES);
    if (e) setExams(JSON.parse(e));
    if (c) setCourses(JSON.parse(c));
  }, []);

  /* ===== import exam (Word/PDF) ===== */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const b64 = (reader.result as string).split(',')[1];
        const res = await parseExamFile(b64, file.type, file.name);

        if (!res || !Array.isArray(res.questions)) {
          throw new Error('Invalid exam format');
        }

        const newExam: Exam = {
          id: Date.now().toString(),
          title: res.title || file.name,
          duration: 90,
          questions: res.questions,
          createdAt: new Date().toLocaleDateString('vi-VN')
        };

        const updated = [newExam, ...exams];
        setExams(updated);
        localStorage.setItem(LS_EXAMS, JSON.stringify(updated));
        alert('Nạp đề thi thành công!');
      } catch (err) {
        alert('Lỗi xử lý tệp (Word/PDF).');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  /* ===== AI create course ===== */
  const createAICourse = async () => {
    const topic = prompt('Nhập chủ đề Toán bạn muốn AI soạn bài giảng:');
    if (!topic) return;

    setLoading(true);
    try {
      const outline = await generateCourseOutline(topic);

      const newCourse: Course = {
        id: Date.now().toString(),
        title: outline.title || topic,
        description: outline.description || '',
        category: outline.category || 'Toán học',
        instructor: 'Lumina AI',
        imageUrl: `https://picsum.photos/seed/${Math.random()}/800/400`,
        progress: 0,
        lessons: (outline.lessons || []).map((l: any, i: number) => ({
          id: `l-${i}`,
          title: l.title,
          content: l.content,
          duration: l.duration,
          completed: false
        }))
      };

      const updated = [newCourse, ...courses];
      setCourses(updated);
      localStorage.setItem(LS_COURSES, JSON.stringify(updated));
    } catch {
      alert('AI bận, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  /* ===== role select ===== */
  if (!role) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-6xl font-black italic mb-10">
          Lumina <span className="text-indigo-600">Math</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
          <button
            onClick={() => setRole(UserRole.TEACHER)}
            className="bg-white p-10 rounded-3xl shadow hover:-translate-y-1 transition"
          >
            <Briefcase size={32} className="mb-4 text-indigo-600" />
            <h3 className="text-2xl font-black italic">Giáo viên</h3>
          </button>

          <button
            onClick={() => setRole(UserRole.STUDENT)}
            className="bg-white p-10 rounded-3xl shadow hover:-translate-y-1 transition"
          >
            <GraduationCap size={32} className="mb-4 text-emerald-600" />
            <h3 className="text-2xl font-black italic">Học sinh</h3>
          </button>
        </div>
      </div>
    );
  }

  /* ===== main ===== */
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-16 bg-white border-b flex items-center justify-between px-6">
        <span
          className="font-black italic cursor-pointer"
          onClick={() => {
            setView('dashboard');
            setActiveCourse(null);
          }}
        >
          Lumina Math
        </span>
        <button onClick={() => setRole(null)}>
          <LogOut />
        </button>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {view === 'dashboard' ? (
          <>
            <div className="flex gap-4 mb-8">
              <label className="bg-emerald-600 text-white px-6 py-3 rounded cursor-pointer flex gap-2">
                <Upload size={18} /> Import đề
                <input type="file" hidden accept=".docx,.pdf" onChange={handleFileUpload} />
              </label>

              <button
                onClick={createAICourse}
                className="bg-indigo-600 text-white px-6 py-3 rounded flex gap-2"
              >
                <Sparkles size={18} /> AI soạn khóa học
              </button>
            </div>

            {loading && <p>Đang xử lý...</p>}

            {/* ===== Exams ===== */}
            <h3 className="font-black mb-4">Kho đề thi</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(e => (
                <div key={e.id} className="bg-white p-6 rounded shadow">
                  <h4 className="font-black italic mb-2">{e.title}</h4>

                  <div className="text-sm text-slate-500 mb-3 flex gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {e.duration}p
                    </span>
                    <span>{e.questions.length} câu</span>
                  </div>

                  {/* PREVIEW TOÁN (LaTeX) */}
                  {e.questions[0] && (
                    <MathPreview math={e.questions[0].content} />
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          activeCourse && (
            <CourseViewer
              course={activeCourse}
              onBack={() => setView('dashboard')}
              onToggleLesson={(id) => {
                const updated = {
                  ...activeCourse,
                  lessons: activeCourse.lessons.map(l =>
                    l.id === id ? { ...l, completed: !l.completed } : l
                  )
                };
                setActiveCourse(updated);

                const all = courses.map(c =>
                  c.id === updated.id ? updated : c
                );
                setCourses(all);
                localStorage.setItem(LS_COURSES, JSON.stringify(all));
              }}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
