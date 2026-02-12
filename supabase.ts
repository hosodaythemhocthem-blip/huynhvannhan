import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  Firestore,
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

/* =========================
   FIREBASE CONFIG
   ⚠️ LẤY TỪ ENV – KHÔNG HARD CODE
========================= */
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/* =========================
   INIT APP (SAFE – SSR READY)
========================= */
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(FIREBASE_CONFIG);
  if (import.meta.env.DEV) {
    console.info("🔥 Firebase initialized");
  }
} else {
  app = getApp();
}

/* =========================
   SERVICES
========================= */
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

/* =========================
   OFFLINE PERSISTENCE
   ⚠️ CHỈ CHẠY Ở CLIENT
========================= */
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err: any) => {
    if (import.meta.env.DEV) {
      switch (err.code) {
        case "failed-precondition":
          console.warn("⚠️ Firestore persistence bị tắt (nhiều tab)");
          break;
        case "unimplemented":
          console.warn("⚠️ Trình duyệt không hỗ trợ IndexedDB");
          break;
        default:
          console.warn("⚠️ Firestore persistence error:", err);
      }
    }
  });
}

export default app;
