// services/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Cấu hình Firebase
 * Dùng biến môi trường để chạy được trên Vercel
 * (KHÔNG hard-code key)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Tránh lỗi Firebase initialize nhiều lần
 * (xảy ra khi reload / Vercel / hot reload)
 */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

/**
 * Firestore Database
 * Lưu dữ liệu vĩnh viễn, ai mở link cũng thấy
 */
export const db = getFirestore(app);
