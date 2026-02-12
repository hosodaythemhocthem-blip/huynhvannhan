import { supabase } from "./supabaseClient";

/* =====================================================
   TYPES
===================================================== */
export type AccountType = "TEACHER" | "STUDENT";
export type TeacherStatus = "PENDING" | "APPROVED" | "REJECTED";

/* =====================================================
   SYNC SERVICE (SUPABASE)
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
    role: AccountType,
    data: { username: string; full_name?: string }
  ): Promise<boolean> => {
    try {
      if (!data?.username) {
        throw new Error("Thiếu username khi lưu account");
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          username: data.username,
          full_name: data.full_name ?? "",
          role,
          status: role === "TEACHER" ? "PENDING" : "APPROVED",
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "TEACHER")
        .eq("status", "PENDING");

      if (error) throw error;

      return data ?? [];
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

      const { error } = await supabase
        .from("profiles")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("username", username);

      if (error) throw error;

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

      const { error } = await supabase
        .from("app_sync")
        .upsert({
          id: syncId,
          payload: data,
          source: "Vercel-App",
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

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

      const { data, error } = await supabase
        .from("app_sync")
        .select("payload")
        .eq("id", syncId)
        .single();

      if (error) return null;

      return data?.payload ?? null;
    } catch (error) {
      console.error("❌ pullData error:", error);
      return null;
    }
  },
};
