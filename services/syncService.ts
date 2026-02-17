import { supabase } from "../supabase"
import { User } from "../types"

export const SyncService = {
  generateSyncId(email: string): string {
    return `sync_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
  },

  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .eq("status", "pending")

    if (error) {
      console.error(error)
      return []
    }

    return data as User[]
  },

  async approveStudent(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return !error
  },

  async pushAppState(syncId: string, payload: any): Promise<boolean> {
    const { error } = await supabase
      .from("app_sync")
      .upsert({
        id: syncId,
        payload,
        updated_at: new Date().toISOString(),
      })

    return !error
  },

  async pullAppState(syncId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("app_sync")
      .select("*")
      .eq("id", syncId)
      .single()

    if (error || !data) return null
    return data.payload
  },

  async deleteSyncData(syncId: string): Promise<void> {
    await supabase.from("app_sync").delete().eq("id", syncId)
  },
}
