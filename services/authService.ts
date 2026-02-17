// services/authService.ts
import { supabase } from "../supabase"
import { User } from "../types"

/* ======================================================
   AUTH SERVICE - LMS PRO VERSION
====================================================== */

export const authService = {
  /* ================= SIGN IN ================= */
  async signIn(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.error("Login error:", error)
      return null
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (!profile) return null

    localStorage.setItem("lms_user", JSON.stringify(profile))

    return profile as User
  },

  /* ================= SIGN UP (STUDENT) ================= */
  async signUpStudent(
    email: string,
    password: string,
    full_name: string
  ): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error || !data.user) {
      console.error(error)
      return false
    }

    const now = new Date().toISOString()

    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email,
      full_name,
      role: "student",
      status: "pending",
      created_at: now,
      updated_at: now,
    })

    if (insertError) {
      console.error(insertError)
      return false
    }

    return true
  },

  /* ================= CREATE DEFAULT TEACHER ================= */
  async ensureDefaultTeacher(): Promise<void> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", "huynhvannhan@gmail.com")
      .maybeSingle()

    if (data) return

    const { data: authUser } = await supabase.auth.signUp({
      email: "huynhvannhan@gmail.com",
      password: "huynhvannhan2020",
    })

    if (!authUser?.user) return

    const now = new Date().toISOString()

    await supabase.from("users").insert({
      id: authUser.user.id,
      email: "huynhvannhan@gmail.com",
      full_name: "Thầy Huỳnh Văn Nhẫn",
      role: "teacher",
      status: "approved",
      created_at: now,
      updated_at: now,
    })
  },

  /* ================= APPROVE STUDENT ================= */
  async approveStudent(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({ status: "approved" })
      .eq("id", userId)

    return !error
  },

  /* ================= LOGOUT ================= */
  async signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem("lms_user")
  },

  /* ================= GET CURRENT USER ================= */
  getCurrentUser(): User | null {
    const stored = localStorage.getItem("lms_user")
    return stored ? JSON.parse(stored) : null
  },
}
