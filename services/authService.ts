import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "nhanlms_active_session_pro_v72";

/* =========================================================
   SESSION HELPERS
========================================================= */

const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

/* =========================================================
   AUTH SERVICE – PRO MAX VERSION
========================================================= */

export const authService = {
  /* =========================================================
     GET CURRENT USER (SYNC WITH SUPABASE)
  ========================================================= */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Ưu tiên lấy từ supabase session
      const { data } = await supabase.auth.getUser();
      const user = data?.user as User | undefined;

      if (user) {
        saveSession(user);
        return user;
      }

      // fallback local
      const local = localStorage.getItem(SESSION_KEY);
      return local ? (JSON.parse(local) as User) : null;
    } catch {
      return null;
    }
  },

  /* =========================================================
     LOGIN
  ========================================================= */
  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Sai tài khoản hoặc mật khẩu.");
    }

    const user = data.user as User;

    // Kiểm tra phê duyệt nếu là học sinh
    if (user.role === "student" && !user.isApproved) {
      throw new Error(
        "Tài khoản đang chờ Thầy phê duyệt. Em vui lòng đợi nhé!"
      );
    }

    saveSession(user);
    return user;
  },

  /* =========================================================
     REGISTER STUDENT
  ========================================================= */
  async register(
    email: string,
    fullName: string,
    classInfo: { id: string; name: string }
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: "123456",
      fullName,
    });

    if (error || !data?.user) {
      throw new Error("Email đã tồn tại hoặc đăng ký thất bại.");
    }

    const userId = data.user.id;

    // Cập nhật thêm thông tin lớp
    const { error: updateError } = await supabase
      .from("users")
      .update({
        classId: classInfo.id,
        className: classInfo.name,
        role: "student",
        isApproved: false,
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error("Không thể cập nhật thông tin lớp.");
    }
  },

  /* =========================================================
     APPROVE STUDENT (Teacher)
  ========================================================= */
  async approveStudent(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ isApproved: true })
      .eq("id", userId);

    if (error) {
      throw new Error("Không thể phê duyệt học sinh.");
    }
  },

  /* =========================================================
     GET ALL STUDENTS
  ========================================================= */
  async getAllStudents(): Promise<User[]> {
    const { data } = await supabase.from("users").select();
    return (data as User[]).filter((u) => u.role === "student");
  },

  /* =========================================================
     GET PENDING STUDENTS
  ========================================================= */
  async getPendingStudents(): Promise<User[]> {
    const students = await this.getAllStudents();
    return students.filter((u) => !u.isApproved);
  },

  /* =========================================================
     GET APPROVED STUDENTS
  ========================================================= */
  async getApprovedStudents(): Promise<User[]> {
    const students = await this.getAllStudents();
    return students.filter((u) => u.isApproved);
  },

  /* =========================================================
     DELETE STUDENT
  ========================================================= */
  async deleteStudent(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      throw new Error("Không thể xóa học sinh.");
    }
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearSession();
  },
};
