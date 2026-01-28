import React, { useEffect, useState } from 'react';
import { UserRole, Exam, Course } from '../types';
import { parseExamFile } from '../services/exam/parseExamService';
import { generateCourseOutline } from '../services/ai/geminiService';
import CourseViewer from '../components/course/CourseViewer';
import Dashboard from '../components/dashboard/Dashboard';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCourses(JSON.parse(localStorage.getItem('lumina_courses') || '[]'));
    setExams(JSON.parse(localStorage.getItem('lumina_exams') || '[]'));
  }, []);

  const handleUploadExam = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await parseExamFile(base64, file.type, file.name);
        const exam: Exam = {
          id: Date.now().toString(),
          title: data.title,
          duration: 90,
          questions: data.questions,
          createdAt: new Date().toLocaleDateString('vi-VN')
        };
        const updated = [exam, ...exams];
        setExams(updated);
        localStorage.setItem('lumina_exams', JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  const createCourseAI = async () => {
    const topic = prompt('Nhập chủ đề Toán');
    if (!topic) return;
    setLoading(true);
    try {
      const outline = await generateCourseOutline(topic);
      const course: Course = {
        id: Date.now().toString(),
        title: outline.title,
        description: outline.description,
        category: 'Toán học',
        instructor: 'Lumina AI',
        imageUrl: `https://picsum.photos/seed/${Math.random()}/800/400`,
        progress: 0,
        lessons: outline.lessons.map((l, i) => ({
          id: `l-${i}`,
          title: l.title,
          content: l.content,
          duration: l.duration,
          completed: false
        }))
      };
      const updated = [course, ...courses];
      setCourses(updated);
      localStorage.setItem('lumina_courses', JSON.stringify(updated));
    } finally {
      setLoading(false);
    }
  };

  if (!role) return <Dashboard.SelectRole onSelect={setRole} />;

  if (activeCourse) {
    return (
      <CourseViewer
        course={activeCourse}
        onBack={() => setActiveCourse(null)}
        onToggleLesson={(id) => {
          const updated = {
            ...activeCourse,
            lessons: activeCourse.lessons.map(l =>
              l.id === id ? { ...l, completed: !l.completed } : l
            )
          };
          setActiveCourse(updated);
          setCourses(courses.map(c => c.id === updated.id ? updated : c));
        }}
      />
    );
  }

  return (
    <Dashboard
      role={role}
      courses={courses}
      exams={exams}
      loading={loading}
      onUploadExam={handleUploadExam}
      onCreateCourse={createCourseAI}
      onOpenCourse={setActiveCourse}
      onLogout={() => setRole(null)}
    />
  );
};

export default App;
