import { supabase } from "../supabase";
import { User } from "../types";

export const SyncService = {
  generateSyncId: (email: string): string => {
    return `sync_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  },

  async getPendingStudents(): Promise<User[]> {
    try {
      const { data, error } = await (supabase.from('users') as any)
        .eq('role', 'student')
        .select();
      if (error) throw error;
      return (data as User[] || []).filter(u => !u.isApproved);
    } catch (err) {
      console.error("Lỗi lấy danh sách học sinh chờ duyệt:", err);
      return [];
    }
  },

  async approveStudent(userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('users') as any)
        .update(userId, { isApproved: true, updated_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Lỗi phê duyệt học sinh:", err);
      return false;
    }
  },

  async pushAppState(syncId: string, payload: any): Promise<boolean> {
    try {
      const { error } = await (supabase.from('app_sync') as any).insert({
        id: syncId,
        payload: payload,
        updated_at: new Date().toISOString()
      });
      if (error) {
        const { error: updateError } = await (supabase.from('app_sync') as any)
          .update(syncId, { payload: payload, updated_at: new Date().toISOString() });
        if (updateError) throw updateError;
      }
      return true;
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu lên Cloud:", err);
      return false;
    }
  },

  async pullAppState(syncId: string): Promise<any | null> {
    try {
      const { data, error } = await (supabase.from('app_sync') as any)
        .eq('id', syncId)
        .select();
      if (error) throw error;
      if (data && data.length > 0) return data[0].payload;
      return null;
    } catch (err) {
      console.error("Lỗi lấy dữ liệu từ Cloud:", err);
      return null;
    }
  },

  async deleteSyncData(syncId: string): Promise<void> {
    await (supabase.from('app_sync') as any).delete(syncId);
  }
};
