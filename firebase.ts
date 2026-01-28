import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * 🔐 Firebase config
 * 👉 DÙNG ENV khi deploy (Vercel)
 * 👉 Local vẫn chạy bình thường
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

/**
 * 🚀 CHỐNG KHỞI TẠO LẠI APP
 * (Hot reload, redeploy, mở nhiều tab)
 */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

/**
 * 🔥 Firestore & Auth
 */
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * 🛡️ BẬT OFFLINE PERSISTENCE
 * 👉 Mạng chập chờn vẫn KHÔNG mất dữ liệu
 * 👉 Sync lại khi online
 */
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("⚠️ Firestore persistence: nhiều tab đang mở");
  } else if (err.code === "unimplemented") {
    console.warn("⚠️ Trình duyệt không hỗ trợ IndexedDB");
  }
});

export default app;
