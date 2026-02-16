import { supabase } from "../supabase";
import { User } from "../types";

export const SyncService = {
  generateSyncId(email: string): string {
    return `sync_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  },

  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student");

    if (error || !data) return [];

    return data
      .filter((u) => !u.is_approved)
      .map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        isApproved: u.is_approved,
      }));
  },

  async approveStudent(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({ is_approved: true })
      .eq("id", userId);

    return !error;
  },

  async pushAppState(syncId: string, payload: any): Promise<boolean> {
    const { error } = await supabase.from("app_sync").upsert({
      id: syncId,
      type: "app_state",
      payload,
      created_at: new Date().toISOString(),
    });

    return !error;
  },

  async pullAppState(syncId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("app_sync")
      .select("payload")
      .eq("id", syncId)
      .single();

    if (error || !data) return null;
    return data.payload;
  },

  async deleteSyncData(syncId: string): Promise<void> {
    await supabase.from("app_sync").delete().eq("id", syncId);
  },
};
