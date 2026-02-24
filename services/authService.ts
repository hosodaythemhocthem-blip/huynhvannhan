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
    full_name: string,
    class_id: string 
  ): Promise<void> {
    // 1. Kiểm tra cơ bản
    if (password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự.");
    }

    // 2. Tạo tài khoản trong hệ thống Auth của Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
        }
      }
    });

    // Bắt lỗi Supabase cực chuẩn để báo ra UI
    if (error) {
      console.error("Lỗi Supabase Auth:", error);
      if (error.message.includes("User already registered")) {
        throw new Error("Email này đã được sử dụng. Vui lòng dùng email khác!");
      }
      if (error.message.includes("Password should be at least")) {
        throw new Error("Mật khẩu quá yếu. Supabase yêu cầu mật khẩu dài hơn!");
      }
      throw new Error(error.message || "Lỗi không xác định khi đăng ký.");
    }

    if (!data.user) {
      throw new Error("Không thể tạo tài khoản lúc này, vui lòng thử lại sau.");
    }

    const newUserId = data.user.id;

    // 3. Lưu thông tin vào bảng public.users
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
      throw new Error("Đăng ký thành công nhưng lỗi tạo hồ sơ hệ thống.");
    }

    // 4. BƯỚC QUAN TRỌNG: Ghi nhận yêu cầu xin vào lớp
    if (class_id) {
      const { error: enrollError } = await supabase.from("class_enrollments").insert({
        student_id: newUserId,
        class_id: class_id,
        status: "pending" // Chờ Giáo viên duyệt
      });

      if (enrollError) {
        console.error("Lỗi ghi nhận lớp học:", enrollError);
        throw new Error("Đăng ký thành công nhưng lỗi xin vào lớp. Hãy báo cho Thầy Nhẫn!");
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
