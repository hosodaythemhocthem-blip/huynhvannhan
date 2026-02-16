import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = 'nhanlms_active_session_pro_v59';

export const authService = {
  // Lấy thông tin phiên đăng nhập hiện tại
  getCurrentUser(): User | null {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  // Logic đăng nhập siêu mượt
  async login(email: string, pass: string): Promise<User> {
    // 1. Kiểm tra tài khoản Thầy Nhẫn (Ưu tiên số 1)
    if (email === "huynhvannhan@gmail.com" && (pass === "huynhvannhan2020" || pass === "huynhvannhan2020aA@")) {
      const teacher: User = { 
        id: "teacher-nhan", 
        email, 
        fullName: "Thầy Huỳnh Văn Nhẫn", 
        role: "teacher", 
        isApproved: true,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhan"
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(teacher));
      return teacher;
    }

    // 2. Kiểm tra tài khoản học sinh trong Supabase
    const { data: users } = await supabase.from('users').select();
    const user = (users as User[] || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error("Tài khoản này chưa tồn tại trong hệ thống. Em hãy đăng ký nhé!");
    }

    // 3. Kiểm tra mật khẩu (Mặc định cho học sinh hoặc mật khẩu riêng)
    const isValidPass = pass === "123456" || pass === "huynhvannhan2020" || (user as any).password === pass;
    
    if (isValidPass) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error("Mật khẩu không chính xác, thầy/em kiểm tra lại nhé!");
  },

  // Logic đăng ký cho học sinh (Trạng thái mặc định: Chờ duyệt)
  async register(email: string, fullName: string, classInfo: { id: string, name: string }): Promise<void> {
    const { data: existing } = await supabase.from('users').select();
    const isTaken = (existing as User[] || []).some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (isTaken) {
      throw new Error("Email này đã được sử dụng. Em hãy dùng email khác hoặc liên hệ Thầy Nhẫn nhé.");
    }

    const newUser: User = { 
      id: `st_${Date.now()}`, 
      email: email.toLowerCase(), 
      fullName, 
      role: "student", 
      isApproved: false, // Luôn là false để Thầy duyệt
      classId: classInfo.id,
      className: classInfo.name,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('users').insert(newUser);
    if (error) throw new Error("Hệ thống bận, không thể đăng ký lúc này.");
  },

  // Đăng xuất và làm sạch hệ thống
  logout() {
    localStorage.removeItem(SESSION_KEY);
    // Điều hướng về trang chủ và làm mới để xóa các trạng thái cũ
    window.location.href = '/';
  }
};
