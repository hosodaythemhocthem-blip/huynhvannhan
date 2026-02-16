import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "nhanlms_active_session_v3";

/* =========================================================
   SESSION HELPERS
========================================================= */

const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const getLocalSession = (): User | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

/* =========================================================
   AUTH SERVICE – STABLE PRO VERSION
========================================================= */

export const authService = {
  /* =========================================================
     GET CURRENT USER (SYNC DB)
  ========================================================= */
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return getLocalSession();

      // Lấy thông tin đầy đủ từ bảng users
      const { data: dbUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error || !dbUser) return null;

      saveSession(dbUser);
      return dbUser as User;
    } catch {
      return null;
    }
  },

  /* =========================================================
     LOGIN
  ========================================================= */
  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Sai tài khoản hoặc mật khẩu.");
    }

    // Lấy user từ bảng users
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (dbError || !dbUser) {
      throw new Error("Không tìm thấy dữ liệu người dùng.");
    }

    // Nếu là student chưa duyệt
    if (dbUser.role === "student" && !dbUser.isApproved) {
      throw new Error("Tài khoản đang chờ Thầy phê duyệt.");
    }

    saveSession(dbUser);
    return dbUser as User;
  },

  /* =========================================================
     REGISTER STUDENT
  ========================================================= */
  async registerStudent(
    email: string,
    password: string,
    fullName: string,
    classInfo: { id: string; name: string }
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Email đã tồn tại hoặc đăng ký thất bại.");
    }

    const userId = data.user.id;

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: userId,
        email: normalizedEmail,
        fullName,
        role: "student",
        classId: classInfo.id,
        className: classInfo.name,
        isApproved: false,
      },
    ]);

    if (insertError) {
      throw new Error("Không thể tạo hồ sơ học sinh.");
    }
  },

  /* =========================================================
     APPROVE STUDENT
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
     GET STUDENTS
  ========================================================= */
  async getAllStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student");

    if (error) return [];
    return data as User[];
  },

  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("isApproved", false);

    if (error) return [];
    return data as User[];
  },

  async getApprovedStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("isApproved", true);

    if (error) return [];
    return data as User[];
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
