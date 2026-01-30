import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  Firestore,
} from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

/* =========================
   FIREBASE CONFIG
========================= */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDzLBvFEDEjTlvP-bYGE8gxB7Ce6-KwcXw",
  authDomain: "hvnn-8c48e.firebaseapp.com",
  projectId: "hvnn-8c48e",
  storageBucket: "hvnn-8c48e.appspot.com",
  messagingSenderId: "493379893878",
  appId: "1:493379893878:web:6b5ad4930c220d12fafd57",
  measurementId: "G-VBHS51JLC3",
};

/* =========================
   INIT APP (SAFE)
========================= */
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(FIREBASE_CONFIG);
  console.info("🔥 Firebase initialized");
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
   ⚠️ PHẢI chạy SAU khi browser sẵn sàng
========================= */
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err: any) => {
    switch (err.code) {
      case "failed-precondition":
        console.warn(
          "⚠️ Firestore persistence bị tắt (mở nhiều tab)"
        );
        break;
      case "unimplemented":
        console.warn(
          "⚠️ Trình duyệt không hỗ trợ IndexedDB"
        );
        break;
      default:
        console.warn("⚠️ Firestore persistence error:", err);
    }
  });
}

export default app;
