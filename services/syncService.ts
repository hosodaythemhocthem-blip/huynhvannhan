
import { supabase } from "../supabase";
import { User } from "../types";

/**
 * DỊCH VỤ ĐỒNG BỘ DỮ LIỆU TOÀN DIỆN - NHANLMS SYNC PRO
 * Đảm bảo dữ liệu luôn nhất quán giữa LocalStorage và Supabase Cloud.
 * Được tinh chỉnh đặc biệt cho quy trình quản lý của Thầy Huỳnh Văn Nhẫn.
 */

export const SyncService = {
  
  /**
   * TẠO ID ĐỒNG BỘ DUY NHẤT DỰA TRÊN EMAIL
   */
  generateSyncId: (email: string): string => {
    return `sync_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  },

  /* ======================================================
     👤 QUẢN LÝ TÀI KHOẢN & PHÊ DUYỆT (Cloud Persistence)
  ====================================================== */

  /**
   * Lấy danh sách học sinh đang chờ phê duyệt
   * (Dành cho màn hình ClassManagement của Thầy Nhẫn)
   */
  async getPendingStudents(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .eq('role', 'student')
        .select();

      if (error) throw error;
      
      // Lọc những học sinh chưa được duyệt
      return (data as User[] || []).filter(u => !u.isApproved);
    } catch (err) {
      console.error("Lỗi lấy danh sách học sinh chờ duyệt:", err);
      return [];
    }
  },

  /**
   * Cập nhật trạng thái phê duyệt (Duyệt học sinh vào lớp)
   * Lưu vĩnh viễn trên Supabase
   */
  async approveStudent(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(userId, { 
          isApproved: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Lỗi phê duyệt học sinh:", err);
      return false;
    }
  },

  /* ======================================================
     🔄 ĐỒNG BỘ TRẠNG THÁI ỨNG DỤNG (Real-time App State)
  ====================================================== */

  /**
   * Đẩy dữ liệu trạng thái (Exams, Lessons, Config) lên Cloud
   * Thỏa mãn yêu cầu: Lưu lại vĩnh viễn mọi thao tác
   */
  async pushAppState(syncId: string, payload: any): Promise<boolean> {
    try {
      // Sử dụng Upsert logic: Nếu ID tồn tại thì Update, chưa có thì Insert
      const { error } = await supabase.from('app_sync').insert({
        id: syncId,
        payload: payload,
        updated_at: new Date().toISOString()
      });

      // Nếu báo lỗi đã tồn tại, tiến hành cập nhật bản ghi cũ
      if (error) {
        const { error: updateError } = await supabase
          .from('app_sync')
          .update(syncId, {
            payload: payload,
            updated_at: new Date().toISOString()
          });
        if (updateError) throw updateError;
      }
      return true;
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu lên Cloud:", err);
      return false;
    }
  },

  /**
   * Kéo dữ liệu trạng thái từ Cloud về máy Local
   */
  async pullAppState(syncId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('app_sync')
        .eq('id', syncId)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0].payload;
      }
      return null;
    } catch (err) {
      console.error("Lỗi lấy dữ liệu từ Cloud:", err);
      return null;
    }
  },

  /* ======================================================
     🗑 DỌN DẸP DỮ LIỆU
  ====================================================== */

  /**
   * Xóa vĩnh viễn dữ liệu đồng bộ (Dùng khi reset hệ thống)
   */
  async deleteSyncData(syncId: string): Promise<void> {
    await supabase.from('app_sync').delete(syncId);
  }
};
