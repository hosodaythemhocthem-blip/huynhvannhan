import { supabase } from "../supabase";
import type { AppUser, UserRole } from "../types";

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Không tìm thấy user");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile)
      throw new Error("Không tìm thấy hồ sơ người dùng");

    if (
      profile.role === "student" &&
      profile.approval_status !== "approved"
    ) {
      throw new Error("Tài khoản đang chờ duyệt");
    }

    return {
      session: data.session,
      user: profile as AppUser,
    };
  },

  async register(
    email: string,
    password: string,
    role: UserRole,
    fullName: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Đăng ký thất bại");

    const { error: insertError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      role,
      full_name: fullName,
      approval_status: role === "teacher" ? "approved" : "pending",
    });

    if (insertError) throw new Error(insertError.message);

    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<AppUser | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile ?? null;
  },
};
