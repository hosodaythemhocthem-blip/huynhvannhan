import { User } from "../types"
import { supabase } from "../supabase"

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.user)
      throw new Error("Sai tài khoản hoặc mật khẩu.")

    return data.user
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  async logout() {
    await supabase.auth.signOut()
  },
}
