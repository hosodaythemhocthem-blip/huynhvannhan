// services/syncService.ts

import { supabase } from "../supabase"
import { User } from "../types"

interface AppSyncPayload {
  id: string
  payload: unknown
  updated_at: string
}

export const syncService = {
  /* ======================================================
     GENERATE SYNC ID
  ====================================================== */
  generateSyncId(email: string): string {
    return `sync_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
  },

  /* ======================================================
     GET PENDING STUDENTS
  ====================================================== */
  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("status", "pending")

    if (error) {
      console.error("getPendingStudents error:", error)
      return []
    }

    return (data ?? []) as User[]
  },

  /* ======================================================
     APPROVE STUDENT
  ====================================================== */
  async approveStudent(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("approveStudent error:", error)
      return false
    }

    return true
  },

  /* ======================================================
     PUSH APP STATE
  ====================================================== */
  async pushAppState(
    syncId: string,
    payload: unknown
  ): Promise<boolean> {
    const { error } = await supabase
      .from("app_sync")
      .upsert({
        id: syncId,
        payload,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error("pushAppState error:", error)
      return false
    }

    return true
  },

  /* ======================================================
     PULL APP STATE
  ====================================================== */
  async pullAppState(syncId: string): Promise<unknown | null> {
    const { data, error } = await supabase
      .from("app_sync")
      .select("*")
      .eq("id", syncId)
      .single()

    if (error || !data) {
      console.error("pullAppState error:", error)
      return null
    }

    return (data as AppSyncPayload).payload
  },

  /* ======================================================
     DELETE SYNC DATA
  ====================================================== */
  async deleteSyncData(syncId: string): Promise<boolean> {
    const { error } = await supabase
      .from("app_sync")
      .delete()
      .eq("id", syncId)

    if (error) {
      console.error("deleteSyncData error:", error)
      return false
    }

    return true
  },
}


/* ======================================================
   GOOGLE DRIVE SYNC (MỚI THÊM)
====================================================== */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-L5D7ZgFUgsU1yAA2IS1bvNDzgFxw5ncjUNd5gDIKvp2VULhXLsxLn3wplpy6pmmjHw/exec";

export type DriveFolderType = 'hoc_sinh' | 'nhom' | 'diem';

export const saveToDrive = async (type: DriveFolderType, fileName: string, dataObj: any) => {
  try {
    const contentString = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj, null, 2);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // QUAN TRỌNG: Bỏ qua lỗi CORS chặn từ trình duyệt
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        type: type,
        fileName: fileName.endsWith('.json') || fileName.endsWith('.txt') ? fileName : `${fileName}.json`,
        content: contentString
      }),
    });

    console.log("✅ Đã gửi lệnh lưu lên Drive!");
    return { status: "success" };

  } catch (error) {
    console.error("❌ Lỗi khi lưu vào Google Drive:", error);
    throw error;
  }
};
