import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Dịch vụ đồng bộ hóa Cloud - Tối ưu cho Thầy Nhẫn
 */
export const SyncService = {
  /**
   * Tạo ID định danh dựa trên tên đăng nhập (ví dụ: user_data_nhan)
   */
  generateSyncId: (username: string): string => {
    return `user_data_${username.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
  },

  /**
   * Đẩy dữ liệu lên Cloud Firestore
   */
  pushData: async (syncId: string, data: any): Promise<boolean> => {
    if (!navigator.onLine) return false;

    try {
      const docRef = doc(db, 'app_sync', syncId);
      
      // Lưu payload và ghi chú thời gian cập nhật
      await setDoc(docRef, {
        payload: data,
        teacherName: data.teacherName || "Thầy Nhẫn",
        updatedAt: serverTimestamp(),
        platform: "Vercel-Production"
      }, { merge: true });

      console.log("✅ [Firebase] Dữ liệu đã được lưu an toàn!");
      return true;
    } catch (error) {
      console.error("❌ [Firebase] Lỗi đồng bộ:", error);
      return false;
    }
  },

  /**
   * Lấy dữ liệu mới nhất từ Cloud
   */
  pullData: async (syncId: string): Promise<any> => {
    if (!navigator.onLine) return null;
    
    try {
      const docRef = doc(db, 'app_sync', syncId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        return cloudData.payload || null;
      }
      return null;
    } catch (error) {
      console.error("❌ [Firebase] Lỗi tải dữ liệu:", error);
      return null;
    }
  }
};
