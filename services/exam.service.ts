// services/exam.service.ts
import { db } from './firebase';
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
  serverTimestamp
} from 'firebase/firestore';
import { Exam } from '../types';

const EXAMS_COLLECTION = 'exams';

export const ExamService = {
  // ➕ Tạo đề thi
  async createExam(exam: Exam) {
    const ref = await addDoc(collection(db, EXAMS_COLLECTION), {
      ...exam,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false
    });
    return ref.id;
  },

  // ✏️ Cập nhật đề thi
  async updateExam(examId: string, data: Partial<Exam>) {
    const ref = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // 📥 Lấy đề thi theo ID
  async getExamById(examId: string): Promise<Exam | null> {
    const ref = doc(db, EXAMS_COLLECTION, examId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Exam;
  },

  // 📚 Lấy danh sách đề (cho GV / Admin)
  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    const q = query(
      collection(db, EXAMS_COLLECTION),
      where('teacherId', '==', teacherId),
      where('isArchived', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam));
  },

  // 🗑️ Xóa mềm đề thi
  async archiveExam(examId: string) {
    const ref = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(ref, {
      isArchived: true,
      updatedAt: serverTimestamp()
    });
  }
};
