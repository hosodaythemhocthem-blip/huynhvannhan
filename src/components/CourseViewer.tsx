import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../services/firebase";

/* =========================
   KIỂU DỮ LIỆU
========================= */

interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacherName?: string;
}

interface Lesson {
  id: string;
  title: string;
  content?: string;
  order?: number;
  createdAt?: any;
}

/* =========================
   PROPS
========================= */
interface CourseViewerProps {
  courseId: string;
  onBack?: () => void;
}

/* =========================
   COMPONENT
========================= */

const CourseViewer: React.FC<CourseViewerProps> = ({
  courseId,
  onBack,
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] =
    useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD THÔNG TIN KHÓA HỌC
  ========================= */
  useEffect(() => {
    const loadCourse = async () => {
      const ref = doc(db, "courses", courseId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCourse({
          id: snap.id,
          ...(snap.data() as Omit<Course, "id">),
        });
      }
    };
    loadCourse();
  }, [courseId]);

  /* =========================
     LOAD BÀI HỌC (REALTIME)
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "courses", courseId, "lessons"),
      orderBy("order", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Lesson, "id">),
      }));
      setLessons(data);
      setSelectedLesson((prev) => prev ?? data[0] ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, [courseId]);

  /* =========================
     GIAO DIỆN
  ========================= */

  if (loading) return <p>⏳ Đang tải khóa học...</p>;
  if (!course) return <p>❌ Không tìm thấy khóa học</p>;

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 16 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ marginBottom: 8 }}
          >
            ← Quay lại
          </button>
        )}

        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          📘 {course.title}
        </h2>

        <div style={{ fontSize: 14, color: "#475569" }}>
          Khối: <strong>{course.grade}</strong>
          {course.teacherName && (
            <> · GV: {course.teacherName}</>
          )}
        </div>

        {course.description && (
          <p style={{ marginTop: 8 }}>
            {course.description}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
        }}
      >
        {/* DANH SÁCH BÀI */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <h4 style={{ fontWeight: 700, marginBottom: 8 }}>
            📚 Bài học
          </h4>

          {lessons.length === 0 && (
            <p>Chưa có bài học</p>
          )}

          {lessons.map((l, i) => (
            <div
              key={l.id}
              onClick={() => setSelectedLesson(l)}
              style={{
                padding: 8,
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 6,
                background:
                  selectedLesson?.id === l.id
                    ? "#e0f2fe"
                    : "#ffffff",
                border:
                  selectedLesson?.id === l.id
                    ? "1px solid #38bdf8"
                    : "1px solid #e5e7eb",
              }}
            >
              {i + 1}. {l.title}
            </div>
          ))}
        </div>

        {/* NỘI DUNG BÀI */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
            minHeight: 300,
          }}
        >
          {!selectedLesson && (
            <p>Chọn một bài học để xem nội dung</p>
          )}

          {selectedLesson && (
            <>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                {selectedLesson.title}
              </h3>

              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {selectedLesson.content ||
                  "Chưa có nội dung bài học."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
