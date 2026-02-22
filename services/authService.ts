import { supabase } from "../supabase";
import { User } from "../types";

const now = () => new Date().toISOString();

export const authService = {
  /* ================= SIGN IN ================= */
  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error("Sai email hoặc mật khẩu.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Không tìm thấy hồ sơ người dùng.");
    }

    localStorage.setItem("lms_user", JSON.stringify(profile));
    return profile as User;
  },

  /* ================= SIGN UP STUDENT ================= */
  async signUpStudent(
    email: string,
    password: string,
    full_name: string
  ): Promise<void> {
    if (password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự.");
    }

    // 1. Tạo tài khoản trong hệ thống Auth của Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
        }
      }
    });

    if (error || !data.user) {
      console.error("Lỗi Supabase Auth:", error);
      throw new Error("Email đã tồn tại hoặc không hợp lệ.");
    }

    // 2. Lưu thông tin vào bảng public.users để Quản lý lớp query được
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email: email,
      full_name: full_name,
      role: "student",     // Cố định chữ thường
      status: "pending",   // Cố định chữ thường để code filter dễ dàng
      created_at: now(),
      updated_at: now(),
    });

    if (insertError) {
      console.error("Lỗi chèn dữ liệu vào bảng users:", insertError);
      throw new Error("Lỗi tạo hồ sơ người dùng.");
    }
  },

  /* ================= SIGN OUT ================= */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem("lms_user");
  },

  /* ================= GET CURRENT USER ================= */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return profile ?? null;
  },
};
