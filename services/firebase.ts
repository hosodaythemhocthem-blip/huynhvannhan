
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sử dụng mã API trực tiếp của Thầy để Vercel không báo lỗi khi build
const firebaseConfig = {
  apiKey: "AIzaSyDzLBvFEDEjTlvP-bYGE8gxB7Ce6-KwcXw",
  authDomain: "hvnn-8c48e.firebaseapp.com",
  projectId: "hvnn-8c48e",
  storageBucket: "hvnn-8c48e.firebasestorage.app",
  messagingSenderId: "493379893878",
  appId: "1:493379893878:web:6b5ad4930c220d12fafd57",
  measurementId: "G-VBHS51JLC3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export const FIREBASE_CONFIG = firebaseConfig;
