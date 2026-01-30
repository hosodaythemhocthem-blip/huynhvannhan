
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocs,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { Exam, Grade, Course, ClassItem } from "../types";

// EXAMS
export const subscribeToExams = (callback: (exams: Exam[]) => void) => {
  const q = query(collection(db, "exams"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const exams = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exam));
    callback(exams);
  });
};

export const saveExam = async (exam: Exam) => {
  const examRef = doc(collection(db, "exams"), exam.id);
  await setDoc(examRef, { ...exam, updatedAt: Date.now() });
};

export const deleteExam = async (examId: string) => {
  await deleteDoc(doc(db, "exams", examId));
};

// GRADES
export const saveGrade = async (grade: Grade) => {
  await addDoc(collection(db, "grades"), { ...grade, timestamp: Date.now() });
};

export const subscribeToGrades = (callback: (grades: Grade[]) => void) => {
  const q = query(collection(db, "grades"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const grades = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Grade));
    callback(grades);
  });
};

// CLASSES
export const subscribeToClasses = (callback: (classes: ClassItem[]) => void) => {
  return onSnapshot(collection(db, "classes"), (snapshot) => {
    const classes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassItem));
    callback(classes);
  });
};

// COURSES
export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
  return onSnapshot(collection(db, "courses"), (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
    callback(courses);
  });
};
