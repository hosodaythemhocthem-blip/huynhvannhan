import { supabase } from "../supabase"

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      throw error
    }

    return data
  },

  async register(email: string, password: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Register error:", error.message)
      throw error
    }

    // insert profile
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        role,
        status: role === "teacher" ? "active" : "pending",
        display_name:
          role === "teacher"
            ? "Thầy Huỳnh Văn Nhẫn"
            : "Học sinh mới",
      })
    }

    return data
  },
}
