
import { db } from './firebase';
import { 
  doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const SyncService = {
  generateSyncId: (username: string): string => {
    return `user_data_${username.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
  },

  // Lưu hoặc cập nhật tài khoản (Giáo viên/Học sinh)
  saveAccount: async (type: 'teachers' | 'students', data: any) => {
    try {
      console.log("Đang gửi dữ liệu lên Firebase:", data);
      const docRef = doc(db, type, data.username);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("Lỗi chi tiết từ Firebase:", e);
      return false;
    }
  },

  // Lấy danh sách giáo viên chờ duyệt
  getPendingTeachers: async () => {
    try {
      const q = query(collection(db, "teachers"), where("status", "==", "PENDING"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error fetching pending teachers:", e);
      return [];
    }
  },

  // Phê duyệt hoặc từ chối giáo viên
  updateTeacherStatus: async (username: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const docRef = doc(db, "teachers", username);
      await updateDoc(docRef, { status });
      return true;
    } catch (e) {
      console.error("Error updating status:", e);
      return false;
    }
  },

  pushData: async (syncId: string, data: any): Promise<boolean> => {
    try {
      const docRef = doc(db, 'app_sync', syncId);
      await setDoc(docRef, {
        payload: data,
        updatedAt: serverTimestamp(),
        source: "Vercel-App"
      }, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  pullData: async (syncId: string): Promise<any> => {
    try {
      const docRef = doc(db, 'app_sync', syncId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().payload : null;
    } catch (error) {
      return null;
    }
  }
};
