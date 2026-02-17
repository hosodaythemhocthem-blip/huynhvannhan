import { supabase } from "../supabase"
import { User } from "../types"

export const authService = {
  /* ================= SIGN IN ================= */
  async signIn(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      throw new Error("Sai email hoặc mật khẩu.")
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("Không tìm thấy hồ sơ người dùng.")
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
      throw new Error("Email đã tồn tại hoặc không hợp lệ.")
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
      throw new Error("Lỗi tạo hồ sơ người dùng.")
    }

    return true
  },

  /* ================= ENSURE DEFAULT TEACHER ================= */
  async ensureDefaultTeacher(): Promise<void> {
    const email = "huynhvannhan@gmail.com"

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (existing) return

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "huynhvannhan2020",
      email_confirm: true,
    })

    if (error || !data.user) {
      console.error("Create teacher failed:", error?.message)
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

  /* ================= SIGN OUT ================= */
  async signOut(): Promise<void> {
    await supabase.auth.signOut()
    localStorage.removeItem("lms_user")
  },

  /* ================= GET CURRENT USER ================= */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    return profile ?? null
  },
}
