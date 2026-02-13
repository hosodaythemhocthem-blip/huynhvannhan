import { supabase } from "../supabase"

export interface UserProfile {
  id: string
  email: string
  role: "teacher" | "student"
  display_name: string
  approved: boolean
}

export const authService = {
  /* ==============================
     LOGIN
  ============================== */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error("Không tìm thấy user")
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("Không tìm thấy hồ sơ người dùng")
    }

    // Nếu là student nhưng chưa được duyệt
    if (profile.role === "student" && !profile.approved) {
      throw new Error("Tài khoản đang chờ giáo viên duyệt")
    }

    return {
      session: data.session,
      user: profile as UserProfile,
    }
  },

  /* ==============================
     REGISTER
  ============================== */
  async register(
    email: string,
    password: string,
    role: "teacher" | "student"
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error("Đăng ký thất bại")
    }

    // Insert profile
    const { error: insertError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      role,
      display_name:
        role === "teacher"
          ? "Thầy Huỳnh Văn Nhẫn"
          : "Học sinh mới",
      approved: role === "teacher",
    })

    if (insertError) {
      throw new Error("Tạo hồ sơ thất bại")
    }

    return data
  },

  /* ==============================
     LOGOUT
  ============================== */
  async logout() {
    await supabase.auth.signOut()
  },

  /* ==============================
     GET CURRENT USER
  ============================== */
  async getCurrentUser(): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return profile ?? null
  },
}
