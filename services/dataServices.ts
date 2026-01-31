import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { Exam, Grade, Course, ClassItem } from "../types";

/* =========================
   EXAMS
========================= */
export const subscribeToExams = (
  callback: (exams: Exam[]) => void
) => {
  if (!db) return () => {};

  const q = query(
    collection(db, "exams"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const exams = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Exam),
      id: docSnap.id,
    }));

    callback(exams);
  });
};

export const saveExam = async (exam: Exam) => {
  if (!db) return;

  const { id, ...data } = exam;

  const examRef = doc(db, "exams", id);

  await setDoc(
    examRef,
    {
      ...data,
      updatedAt: Date.now(),
      createdAt: exam.createdAt ?? Date.now(),
    },
    { merge: true }
  );
};

export const deleteExam = async (examId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "exams", examId));
};

/* =========================
   GRADES
========================= */
export const saveGrade = async (grade: Grade) => {
  if (!db) return;

  await addDoc(collection(db, "grades"), {
    ...grade,
    timestamp: Date.now(),
  });
};

export const subscribeToGrades = (
  callback: (grades: Grade[]) => void
) => {
  if (!db) return () => {};

  const q = query(
    collection(db, "grades"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const grades = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Grade),
      id: docSnap.id,
    }));

    callback(grades);
  });
};

/* =========================
   CLASSES
========================= */
export const subscribeToClasses = (
  callback: (classes: ClassItem[]) => void
) => {
  if (!db) return () => {};

  return onSnapshot(
    collection(db, "classes"),
    (snapshot) => {
      const classes = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as ClassItem),
        id: docSnap.id,
      }));

      callback(classes);
    }
  );
};

/* =========================
   COURSES
========================= */
export const subscribeToCourses = (
  callback: (courses: Course[]) => void
) => {
  if (!db) return () => {};

  return onSnapshot(
    collection(db, "courses"),
    (snapshot) => {
      const courses = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Course),
        id: docSnap.id,
      }));

      callback(courses);
    }
  );
};
