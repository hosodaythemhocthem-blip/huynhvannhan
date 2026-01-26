import React from "react";

/* =========================
   KIỂU DỮ LIỆU
========================= */
export interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacherName?: string;
  lessonCount?: number;
  createdAt?: any;
}

/* =========================
   PROPS
========================= */
interface CourseCardProps {
  course: Course;
  onOpen?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  role?: "ADMIN" | "TEACHER" | "STUDENT";
}

/* =========================
   COMPONENT
========================= */
const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpen,
  onEdit,
  onDelete,
  role = "STUDENT",
}) => {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 16,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* HEADER */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          📘 {course.title}
        </h3>

        <div style={{ fontSize: 13, color: "#475569" }}>
          Khối: <strong>{course.grade}</strong>
        </div>

        {course.teacherName && (
          <div style={{ fontSize: 13, color: "#475569" }}>
            Giáo viên: {course.teacherName}
          </div>
        )}

        {course.description && (
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#334155",
              lineHeight: 1.5,
            }}
          >
            {course.description}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 14 }}>
        {typeof course.lessonCount === "number" && (
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            📚 {course.lessonCount} bài học
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onOpen?.(course)}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Vào học
          </button>

          {(role === "TEACHER" || role === "ADMIN") && (
            <>
              <button
                onClick={() => onEdit?.(course)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                ✏️
              </button>

              <button
                onClick={() => onDelete?.(course)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #fecaca",
                  background: "#fee2e2",
                  color: "#991b1b",
                  cursor: "pointer",
                }}
              >
                🗑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
