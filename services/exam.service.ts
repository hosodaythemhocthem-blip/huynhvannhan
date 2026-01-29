import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/* =====================
   TYPES
===================== */

export type QuestionType = 'multiple_choice' | 'essay';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];        // trắc nghiệm
  correctAnswer?: string;    // trắc nghiệm
  score: number;             // điểm riêng từng câu
}

export interface Exam {
  id?: string;
  title: string;
  subject: string;
  teacherId: string;
  questions: ExamQuestion[];
  totalScore: number;
  createdAt?: any;
  updatedAt?: any;
}

/* =====================
   UTILS
===================== */

const calcTotalScore = (questions: ExamQuestion[]) =>
  questions.reduce((sum, q) => sum + (q.score || 0), 0);

/* =====================
   CRUD SERVICES
===================== */

// ➕ Tạo đề
export const createExam = async (exam: Exam) => {
  const totalScore = calcTotalScore(exam.questions);

  const docRef = await addDoc(collection(db, 'exams'), {
    ...exam,
    totalScore,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// ✏️ Cập nhật đề
export const updateExam = async (examId: string, data: Partial<Exam>) => {
  if (data.questions) {
    data.totalScore = calcTotalScore(data.questions);
  }

  const ref = doc(db, 'exams', examId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ❌ Xóa đề (chỉ khi GV/Admin chủ động)
export const deleteExam = async (examId: string) => {
  await deleteDoc(doc(db, 'exams', examId));
};

// 📄 Lấy chi tiết đề
export const getExamById = async (examId: string): Promise<Exam | null> => {
  const snap = await getDoc(doc(db, 'exams', examId));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Exam),
  };
};

// 📚 Lấy danh sách đề của giáo viên
export const getExamsByTeacher = async (teacherId: string): Promise<Exam[]> => {
  const q = query(
    collection(db, 'exams'),
    where('teacherId', '==', teacherId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Exam),
  }));
};

// 📚 Lấy toàn bộ đề (Admin)
export const getAllExams = async (): Promise<Exam[]> => {
  const snapshot = await getDocs(collection(db, 'exams'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Exam),
  }));
};
