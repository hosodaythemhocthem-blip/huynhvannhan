import { supabase } from "../supabase";
import { User } from "../types";

const DEFAULT_TEACHER = {
  email: "huynhvannhan@gmail.com",
  password: "huynhvannhan2020",
  full_name: "Thầy Huỳnh Văn Nhẫn",
};

async function ensureDefaultTeacher() {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", DEFAULT_TEACHER.email)
    .single();

  if (!data) {
    await supabase.from("users").insert([
      {
        email: DEFAULT_TEACHER.email,
        password: DEFAULT_TEACHER.password,
        full_name: DEFAULT_TEACHER.full_name,
        role: "teacher",
        is_approved: true,
      },
    ]);
  }
}

export const authService = {
  async login(email: string, password: string): Promise<User | null> {
    await ensureDefaultTeacher();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) return null;

    if (!data.is_approved) {
      throw new Error("Tài khoản chưa được duyệt");
    }

    return data as User;
  },

  async registerStudent(
    email: string,
    password: string,
    full_name: string
  ) {
    const { error } = await supabase.from("users").insert([
      {
        email,
        password,
        full_name,
        role: "student",
        is_approved: false,
      },
    ]);

    if (error) throw error;
  },
};
