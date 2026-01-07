import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Dịch vụ đồng bộ hóa Cloud - Kết nối Vercel & Firebase hvnn-8c48e
 */
export const SyncService = {
  /**
   * Tạo ID duy nhất cho mỗi giáo viên (Ví dụ: user_data_nhan)
   */
  generateSyncId: (username: string): string => {
    return `user_data_${username.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
  },

  /**
   * Đẩy toàn bộ dữ liệu (Đề thi, cấu hình) lên Firebase
   */
  pushData: async (syncId: string, data: any): Promise<boolean> => {
    if (!navigator.onLine) return false;

    try {
      // Lưu vào collection 'app_sync' trong Firestore
      const docRef = doc(db, 'app_sync', syncId);
      
      await setDoc(docRef, {
        payload: data,
        teacherName: data.teacherName || "Huỳnh Văn Nhẫn",
        lastUpdate: serverTimestamp(),
        source: "Vercel-App"
      }, { merge: true });

      console.log("✅ Đã sao lưu lên Firebase hvnn-8c48e thành công!");
      return true;
    } catch (error) {
      console.error("❌ Lỗi đồng bộ Firebase:", error);
      return false;
    }
  },

  /**
   * Lấy dữ liệu từ Cloud về khi Thầy đăng nhập hoặc làm mới trang
   */
  pullData: async (syncId: string): Promise<any> => {
    if (!navigator.onLine) return null;
    
    try {
      const docRef = doc(db, 'app_sync', syncId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.payload || null;
      }
      return null;
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu Cloud:", error);
      return null;
    }
  }
};
