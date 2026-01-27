import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config
 * Project: hvnn-8c48e
 */
const firebaseConfig = {
  apiKey: "AIzaSyDzLBvFEDEjTlvP-bYGE8gxB7Ce6-KwcXw",
  authDomain: "hvnn-8c48e.firebaseapp.com",
  projectId: "hvnn-8c48e",
  storageBucket: "hvnn-8c48e.firebasestorage.app",
  messagingSenderId: "493379893878",
  appId: "1:493379893878:web:6b5ad4930c220d12fafd57",
  measurementId: "G-VBHS51JLC3",
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Init Firestore
export const db = getFirestore(app);

export const FIREBASE_CONFIG = firebaseConfig;
