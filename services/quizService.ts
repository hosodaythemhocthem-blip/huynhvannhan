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
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export async function getQuizResults() {
  const q = query(
    collection(db, "quizResults"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
