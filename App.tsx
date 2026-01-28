import React, { useEffect, useRef, useState } from "react";
import { UserRole, Exam, Course } from "../types";
import { parseExamFile } from "../services/exam/parseExamService";
import { generateCourseOutline } from "../services/ai/geminiService";
import CourseViewer from "../components/course/CourseViewer";
import Dashboard from "../components/dashboard/Dashboard";

const COURSES_KEY = "lumina_courses";
const EXAMS_KEY = "lumina_exams";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  const hydrated = useRef(false);

  /**
   * 🚀 Hydrate cache (1 lần duy nhất – StrictMode safe)
   */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    try {
      const cachedCourses = JSON.parse(
        localStorage.getItem(COURSES_KEY) || "[]"
      );
      const cachedExams = JSON.parse(
        localStorage.getItem(EXAMS_KEY) || "[]"
      );

      setCourses(Array.isArray(cachedCourses) ? cachedCourses : []);
      setExams(Array.isArray(cachedExams) ? cachedExams : []);
    } catch {
      localStorage.removeItem(COURSES_KEY);
      localStorage.removeItem(EXAMS_KEY);
    }
  }, []);

  /**
   * 🔐 Upload đề thi – async an toàn
   */
  const handleUploadExam = async (file: File) => {
    if (loading) return;
    setLoading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await parseExamFile(base64, file.type, file.name);

      const exam: Exam = {
        id: crypto.randomUUID(),
        title: data.title,
        duration: 90,
        questions: data.questions,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };

      setExams((prev) => {
        const updated = [exam, ...prev];
        localStorage.setItem(EXAMS_KEY, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🤖 Tạo khóa học AI
   */
  const createCourseAI = async () => {
    if (loading) return;

    const topic = prompt("Nhập chủ đề Toán");
    if (!topic) return;

    setLoading(true);
    try {
      const outline = await generateCourseOutline(topic);

      const course: Course = {
        id: crypto.randomUUID(),
        title: outline.title,
        description: outline.description,
        category: "Toán học",
        instructor: "Lumina AI",
        imageUrl: `https://picsum.photos/seed/${crypto.randomUUID()}/800/400`,
        progress: 0,
        lessons: outline.lessons.map((l, i) => ({
          id: `l-${i}`,
          title: l.title,
          content: l.content,
          duration: l.duration,
          completed: false,
        })),
      };

      setCourses((prev) => {
        const updated = [course, ...prev];
        localStorage.setItem(COURSES_KEY, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🎯 Chọn vai trò
   */
  if (!role) {
    return <Dashboard.SelectRole onSelect={setRole} />;
  }

  /**
   * 📘 Xem khóa học
   */
  if (activeCourse) {
    return (
      <CourseViewer
        course={activeCourse}
        onBack={() => setActiveCourse(null)}
        onToggleLesson={(id) => {
          setCourses((prevCourses) => {
            const updatedCourses = prevCourses.map((c) =>
              c.id === activeCourse.id
                ? {
                    ...c,
                    lessons: c.lessons.map((l) =>
                      l.id === id
                        ? { ...l, completed: !l.completed }
                        : l
                    ),
                  }
                : c
            );

            localStorage.setItem(
              COURSES_KEY,
              JSON.stringify(updatedCourses)
            );

            const updatedActive =
              updatedCourses.find((c) => c.id === activeCourse.id) ||
              null;
            setActiveCourse(updatedActive);

            return updatedCourses;
          });
        }}
      />
    );
  }

  /**
   * 🧭 Dashboard chính
   */
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
