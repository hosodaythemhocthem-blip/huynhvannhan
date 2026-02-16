import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "nhanlms_active_session_pro_v71";

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
   AUTH SERVICE – CLEAN PRODUCTION VERSION
========================================================= */
export const authService = {
  /* =========================================================
     GET CURRENT USER
  ========================================================= */
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;
      return JSON.parse(data) as User;
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

    /* ===============================
       CHECK APPROVAL (STUDENT)
    =============================== */
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

    /* ===============================
       UPDATE CLASS INFO
    =============================== */
    await supabase
      .from("users")
      .update({
        classId: classInfo.id,
        className: classInfo.name,
        role: "student",
        isApproved: false,
      })
      .eq("id", data.user.id);
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
     GET PENDING STUDENTS
  ========================================================= */
  async getPendingStudents(): Promise<User[]> {
    const { data } = await supabase
      .from("users")
      .select();

    return (data || []).filter(
      (u: User) => u.role === "student" && !u.isApproved
    );
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearSession();
  },
};
