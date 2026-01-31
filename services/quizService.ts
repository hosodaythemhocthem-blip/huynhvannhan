import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* =====================================================
   TYPES
===================================================== */
export interface QuizResult {
  studentName: string;
  score: number;
  answers: any;
  createdAt?: any;
}

/* =====================================================
   SAVE QUIZ RESULT
===================================================== */
export async function saveQuizResult(data: QuizResult) {
  try {
    const docRef = await addDoc(collection(db, "quizResults"), {
      ...data,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("❌ saveQuizResult error:", error);
    throw error;
  }
}

/* =====================================================
   GET QUIZ RESULTS (DESC)
===================================================== */
export async function getQuizResults(): Promise<
  (QuizResult & { id: string })[]
> {
  try {
    const q = query(
      collection(db, "quizResults"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as QuizResult),
    }));
  } catch (error) {
    console.error("❌ getQuizResults error:", error);
    return [];
  }
}
