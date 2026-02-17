import { supabase } from "../supabase"
import { User } from "../types"

/* ======================================================
   AUTH SERVICE - LMS PRO MAX VERSION
====================================================== */

export const authService = {
  /* ================= SIGN IN ================= */
  async signIn(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.error("Login error:", error?.message)
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      console.error("Profile error:", profileError?.message)
      return null
    }

    if (profile.status === "pending") {
      throw new Error("Tài khoản đang chờ giáo viên duyệt.")
    }

    if (profile.status === "suspended") {
      throw new Error("Tài khoản đã bị khóa.")
    }

    localStorage.setItem("lms_user", JSON.stringify(profile))

    return profile as User
  },

  /* ================= SIGN UP STUDENT ================= */
  async signUpStudent(
    email: string,
    password: string,
    full_name: string
  ): Promise<boolean> {
    if (password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự.")
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error || !data.user) {
      console.error(error?.message)
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
      console.error(insertError.message)
      return false
    }

    return true
  },

  /* ================= ENSURE DEFAULT TEACHER ================= */
  async ensureDefaultTeacher(): Promise<void> {
    const email = "huynhvannhan@gmail.com"

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existing) return

    const { data, error } = await supabase.auth.signUp({
      email,
      password: "huynhvannhan2020",
    })

    if (error || !data.user) {
      console.error("Create teacher auth error:", error?.message)
      return
    }

    const now = new Date().toISOString()

    await supabase.from("users").insert({
      id: data.user.id,
      email,
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
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return !error
  },

  /* ================= SIGN OUT ================= */
  async signOut(): Promise<void> {
    await supabase.auth.signOut()
    localStorage.removeItem("lms_user")
  },

  /* ================= GET CURRENT USER ================= */
  getCurrentUser(): User | null {
    const stored = localStorage.getItem("lms_user")
    return stored ? JSON.parse(stored) : null
  },
}
