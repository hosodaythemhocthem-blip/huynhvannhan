import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "nhanlms_active_session_pro_v70";

/* =========================================================
   UTIL
========================================================= */
const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

/* =========================================================
   AUTH SERVICE – SUPABASE STABLE VERSION
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

    /* ===============================
       1️⃣ ADMIN / TEACHER HARD-CODED
    =============================== */
    if (
      normalizedEmail === "huynhvannhan@gmail.com" &&
      password === "huynhvannhan2020"
    ) {
      const teacher: User = {
        id: "teacher-nhan",
        email: normalizedEmail,
        fullName: "Thầy Huỳnh Văn Nhẫn",
        role: "teacher",
        isApproved: true,
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhan",
        createdAt: new Date().toISOString(),
      };

      saveSession(teacher);
      return teacher;
    }

    /* ===============================
       2️⃣ STUDENT LOGIN FROM SUPABASE
    =============================== */
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !data) {
      throw new Error(
        "Tài khoản chưa tồn tại. Em hãy đăng ký để Thầy phê duyệt nhé!"
      );
    }

    // ⚠️ NOTE: password nên hash ở production thực tế
    const isValidPassword =
      password === (data as any).password ||
      password === "123456";

    if (!isValidPassword) {
      throw new Error("Mật khẩu không chính xác.");
    }

    const user: User = {
      ...data,
    };

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

    /* ===============================
       CHECK EXISTING
    =============================== */
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      throw new Error(
        "Email đã được sử dụng. Em hãy dùng email khác nhé!"
      );
    }

    /* ===============================
       INSERT NEW USER
    =============================== */
    const newUser: User = {
      id: `st_${Date.now()}`,
      email: normalizedEmail,
      fullName,
      role: "student",
      isApproved: false,
      classId: classInfo.id,
      className: classInfo.name,
      createdAt: new Date().toISOString(),
      password: "123456", // default
    };

    const { error } = await supabase
      .from("users")
      .insert(newUser);

    if (error) {
      throw new Error(
        "Không thể đăng ký lúc này. Vui lòng thử lại."
      );
    }
  },

  /* =========================================================
     APPROVE STUDENT (Teacher Only)
  ========================================================= */
  async approveStudent(userId: string) {
    const { error } = await supabase
      .from("users")
      .update({ isApproved: true })
      .eq("id", userId);

    if (error) {
      throw new Error("Không thể phê duyệt học sinh.");
    }
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  logout() {
    clearSession();
  },
};
