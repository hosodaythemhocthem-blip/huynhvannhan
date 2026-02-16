
import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = 'nhanlms_active_session_pro_v59';

export const authService = {
  getCurrentUser(): User | null {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  async login(email: string, pass: string): Promise<User> {
    if (email === "huynhvannhan@gmail.com" && (pass === "huynhvannhan2020" || pass === "huynhvannhan2020aA@")) {
      const teacher: User = { 
        id: "teacher-nhan", 
        email, 
        fullName: "Thầy Huỳnh Văn Nhẫn", 
        role: "teacher", 
        isApproved: true 
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(teacher));
      return teacher;
    }

    const { data: users } = await supabase.from('users').select();
    const user = (users as User[] || []).find(u => u.email === email);
    
    if (!user) throw new Error("Tài khoản không tồn tại. Em hãy đăng ký nhé!");

    if (pass === "123456" || pass === "huynhvannhan2020") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error("Mật khẩu không chính xác!");
  },

  async register(email: string, fullName: string, classInfo: { id: string, name: string }): Promise<void> {
    const { data: existing } = await supabase.from('users').select();
    const isTaken = (existing as User[] || []).some(u => u.email === email);
    if (isTaken) throw new Error("Email này đã được sử dụng rồi em nhé.");

    const newUser: User = { 
      id: `st_${Date.now()}`, 
      email, 
      fullName, 
      role: "student", 
      isApproved: false,
      classId: classInfo.id,
      className: classInfo.name
    };
    const { error } = await supabase.from('users').insert(newUser);
    if (error) throw new Error("Lỗi hệ thống khi đăng ký.");
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }
};
