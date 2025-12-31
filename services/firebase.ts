// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzLBvFEDEjTlvP-bYGE8gxB7Ce6-KwcXw",
  authDomain: "hvnn-8c48e.firebaseapp.com",
  projectId: "hvnn-8c48e",
  storageBucket: "hvnn-8c48e.appspot.com", // SỬA CHUẨN
  messagingSenderId: "493379893878",
  appId: "1:493379893878:web:6b5ad4930c220d12fafd57",
  measurementId: "G-VBHS51JLC3",
};

// Initialize Firebase (CHỈ 1 LẦN)
export const app = initializeApp(firebaseConfig);

// Analytics: chỉ chạy phía trình duyệt
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Firebase services dùng cho LMS
export const auth = getAuth(app);
export const db = getFirestore(app);
