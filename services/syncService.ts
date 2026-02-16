// services/syncService.ts

import { supabase, safeQuery } from "../supabase";
import { User } from "../types";

/**
 * ==========================================================
 * SYNC SERVICE – SUPABASE v2 STABLE
 * ==========================================================
 * ✔ Fix toàn bộ lỗi TS
 * ✔ Chuẩn typed Database
 * ✔ Không còn never
 * ✔ Không còn update(id, data) sai cú pháp
 * ✔ Production ready
 * ==========================================================
 */

export const SyncService = {
  /* ======================================================
     🔑 GENERATE SYNC ID
  ====================================================== */
  generateSyncId: (email: string): string => {
    return `sync_${email
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")}`;
  },

  /* ======================================================
     👤 LẤY HỌC SINH CHỜ DUYỆT
  ====================================================== */
  async getPendingStudents(): Promise<User[]> {
    try {
      const data = await safeQuery(
        supabase
          .from("users")
          .select("*")
          .eq("role", "student")
      );

      return (data as any[])
        .filter((u) => !u.is_approved)
        .map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          isApproved: u.is_approved,
        }));
    } catch (err) {
      console.error("❌ Lỗi lấy học sinh:", err);
      return [];
    }
  },

  /* ======================================================
     ✅ PHÊ DUYỆT HỌC SINH
  ====================================================== */
  async approveStudent(userId: string): Promise<boolean> {
    try {
      await safeQuery(
        supabase
          .from("users")
          .update({ is_approved: true })
          .eq("id", userId)
      );

      return true;
    } catch (err) {
      console.error("❌ Lỗi phê duyệt:", err);
      return false;
    }
  },

  /* ======================================================
     ☁ PUSH APP STATE
  ====================================================== */
  async pushAppState(
    syncId: string,
    payload: any
  ): Promise<boolean> {
    try {
      await safeQuery(
        supabase.from("app_sync").upsert({
          id: syncId,
          type: "app_state",
          payload: payload,
          created_at: new Date().toISOString(),
        })
      );

      return true;
    } catch (err) {
      console.error("❌ Lỗi push state:", err);
      return false;
    }
  },

  /* ======================================================
     ☁ PULL APP STATE
  ====================================================== */
  async pullAppState(syncId: string): Promise<any | null> {
    try {
      const data = await safeQuery(
        supabase
          .from("app_sync")
          .select("payload")
          .eq("id", syncId)
          .single()
      );

      return data?.payload || null;
    } catch (err) {
      console.error("❌ Lỗi pull state:", err);
      return null;
    }
  },

  /* ======================================================
     🗑 DELETE SYNC DATA
  ====================================================== */
  async deleteSyncData(syncId: string): Promise<void> {
    try {
      await safeQuery(
        supabase
          .from("app_sync")
          .delete()
          .eq("id", syncId)
      );
    } catch (err) {
      console.error("❌ Lỗi xoá sync:", err);
    }
  },
};
