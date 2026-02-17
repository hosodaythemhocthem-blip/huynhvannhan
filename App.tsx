import { supabase } from "../supabase"
import { User } from "../types"

export const authService = {
  /* ======================================================
     LOGIN
  ====================================================== */
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      throw new Error("Sai tài khoản hoặc mật khẩu.")
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("Không tìm thấy hồ sơ người dùng.")
    }

    return profile as User
  },

  /* ======================================================
     REGISTER STUDENT
  ====================================================== */
  async register(
    email: string,
    fullName: string,
    classInfo: { id: string; name: string }
  ): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "12345678", // mật khẩu mặc định
    })

    if (error || !data.user) {
      throw new Error("Không thể đăng ký tài khoản.")
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: "student",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      class_id: classInfo.id,
    })

    if (profileError) {
      throw new Error("Không thể tạo hồ sơ người dùng.")
    }
  },

  /* ======================================================
     GET CURRENT USER
  ====================================================== */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return profile as User
  },

  /* ======================================================
     LOGOUT
  ====================================================== */
  async logout() {
    await supabase.auth.signOut()
  },
}
