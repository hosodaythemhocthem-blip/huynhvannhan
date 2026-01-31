import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

/**
 * Firebase config
 * Project: hvnn-8c48e
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

// =========================
// Init Firebase (chống init trùng tuyệt đối)
// =========================
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// =========================
// Firebase services (singleton)
// =========================
let db: Firestore;
let auth: Auth;

try {
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("🔥 Firebase init error:", error);
  throw error;
}

// =========================
// Exports
// =========================
export { app, db, auth };

// Giữ lại để file khác dùng nếu cần
export const FIREBASE_CONFIG = firebaseConfig;
