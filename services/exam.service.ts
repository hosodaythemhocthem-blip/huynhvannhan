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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Exam } from '../types';

const EXAMS_COLLECTION = 'exams';

export const ExamService = {
  /* =========================
     ➕ CREATE
  ========================= */
  async createExam(exam: Exam): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    const { id, createdAt, updatedAt, ...data } = exam;

    const ref = await addDoc(collection(db, EXAMS_COLLECTION), {
      ...data,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  },

  /* =========================
     ✏️ UPDATE
  ========================= */
  async updateExam(
    examId: string,
    data: Partial<Exam>
  ): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const { id, createdAt, ...safeData } = data;

    const ref = doc(db, EXAMS_COLLECTION, examId);

    await updateDoc(ref, {
      ...safeData,
      updatedAt: serverTimestamp(),
    });
  },

  /* =========================
     📥 GET BY ID
  ========================= */
  async getExamById(examId: string): Promise<Exam | null> {
    if (!db) return null;

    const ref = doc(db, EXAMS_COLLECTION, examId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data() as Exam;

    if (data.isArchived) return null;

    return {
      ...data,
      id: snap.id,
    };
  },

  /* =========================
     📚 GET BY TEACHER
  ========================= */
  async getExamsByTeacher(
    teacherId: string
  ): Promise<Exam[]> {
    if (!db) return [];

    const q = query(
      collection(db, EXAMS_COLLECTION),
      where('teacherId', '==', teacherId),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      ...(d.data() as Exam),
      id: d.id,
    }));
  },

  /* =========================
     🗑️ ARCHIVE (SOFT DELETE)
  ========================= */
  async archiveExam(examId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const ref = doc(db, EXAMS_COLLECTION, examId);

    await updateDoc(ref, {
      isArchived: true,
      updatedAt: serverTimestamp(),
    });
  },
};
