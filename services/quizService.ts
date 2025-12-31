import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function saveQuizResult(data: {
  studentName: string;
  score: number;
  answers: any;
}) {
  return await addDoc(collection(db, "quizResults"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
