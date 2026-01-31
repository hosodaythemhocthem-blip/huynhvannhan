import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/* =====================================================
   TYPES
===================================================== */
export type AccountType = "teachers" | "students";
export type TeacherStatus = "PENDING" | "APPROVED" | "REJECTED";

/* =====================================================
   SYNC SERVICE
===================================================== */
export const SyncService = {
  /* =========================
     Generate Sync ID
  ========================= */
  generateSyncId: (username: string): string => {
    return `user_data_${username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")}`;
  },

  /* =========================
     Save / Update Account
  ========================= */
  saveAccount: async (
    type: AccountType,
    data: { username: string; [key: string]: any }
  ): Promise<boolean> => {
    try {
      if (!data?.username) {
        throw new Error("Thiếu username khi lưu account");
      }

      const docRef = doc(db, type, data.username);

      await setDoc(
        docRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error("❌ saveAccount error:", error);
      return false;
    }
  },

  /* =========================
     Get Pending Teachers
  ========================= */
  getPendingTeachers: async (): Promise<any[]> => {
    try {
      const q = query(
        collection(db, "teachers"),
        where("status", "==", "PENDING")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("❌ getPendingTeachers error:", error);
      return [];
    }
  },

  /* =========================
     Update Teacher Status
  ========================= */
  updateTeacherStatus: async (
    username: string,
    status: TeacherStatus
  ): Promise<boolean> => {
    try {
      if (!username) throw new Error("Thiếu username");

      const docRef = doc(db, "teachers", username);

      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("❌ updateTeacherStatus error:", error);
      return false;
    }
  },

  /* =========================
     Push Sync Data
  ========================= */
  pushData: async (syncId: string, data: any): Promise<boolean> => {
    try {
      if (!syncId) throw new Error("Thiếu syncId");

      const docRef = doc(db, "app_sync", syncId);

      await setDoc(
        docRef,
        {
          payload: data,
          updatedAt: serverTimestamp(),
          source: "Vercel-App",
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error("❌ pushData error:", error);
      return false;
    }
  },

  /* =========================
     Pull Sync Data
  ========================= */
  pullData: async (syncId: string): Promise<any | null> => {
    try {
      if (!syncId) throw new Error("Thiếu syncId");

      const docRef = doc(db, "app_sync", syncId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) return null;

      return snapshot.data()?.payload ?? null;
    } catch (error) {
      console.error("❌ pullData error:", error);
      return null;
    }
  },
};
