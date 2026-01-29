import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Firebase config - hvnn-8c48e
 */
const firebaseConfig = {
  apiKey: "AIzaSyDzLBvFEDEjTlvP-bYGE8gxB7Ce6-KwcXw",
  authDomain: "hvnn-8c48e.firebaseapp.com",
  projectId: "hvnn-8c48e",
  storageBucket: "hvnn-8c48e.appspot.com",
  messagingSenderId: "493379893878",
  appId: "1:493379893878:web:6b5ad4930c220d12fafd57",
  measurementId: "G-VBHS51JLC3",
};

/**
 * 🚀 Tránh initialize nhiều lần
 */
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase services
 */
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * 🛡️ Offline persistence
 */
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("⚠️ Firestore persistence: nhiều tab đang mở");
  } else if (err.code === "unimplemented") {
    console.warn("⚠️ Trình duyệt không hỗ trợ IndexedDB");
  }
});

export default app;
export const FIREBASE_CONFIG = firebaseConfig;
