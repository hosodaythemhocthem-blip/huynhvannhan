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
  // Đã thêm tham số class_id vào hàm này
  async signUpStudent(
    email: string,
    password: string,
    full_name: string,
    class_id: string 
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

    const newUserId = data.user.id;

    // 2. Lưu thông tin vào bảng public.users
    const { error: insertError } = await supabase.from("users").insert({
      id: newUserId,
      email: email,
      full_name: full_name,
      role: "student",     
      status: "pending",   
      created_at: now(),
      updated_at: now(),
    });

    if (insertError) {
      console.error("Lỗi chèn dữ liệu vào bảng users:", insertError);
      throw new Error("Lỗi tạo hồ sơ người dùng.");
    }

    // 3. BƯỚC QUAN TRỌNG NHẤT: Ghi nhận yêu cầu xin vào lớp
    if (class_id) {
      const { error: enrollError } = await supabase.from("class_enrollments").insert({
        student_id: newUserId,
        class_id: class_id,
        status: "pending" // Chờ Giáo viên duyệt
      });

      if (enrollError) {
        console.error("Lỗi ghi nhận lớp học:", enrollError);
        throw new Error("Tạo tài khoản thành công nhưng lỗi khi xin vào lớp. Vui lòng thử lại sau!");
      }
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
