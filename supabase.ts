const STORAGE_KEY = 'nhanlms_permanent_final_v61';

// Cấu trúc dữ liệu ban đầu siêu chuẩn cho LMS
const getInitialDb = () => ({ 
  users: [
    { 
      id: "teacher-nhan", 
      email: "huynhvannhan@gmail.com", 
      password: "huynhvannhan2020", // Mật khẩu mặc định của Thầy
      fullName: "Thầy Huỳnh Văn Nhẫn", 
      role: "teacher", 
      isApproved: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhan"
    }
  ], 
  exams: [], // Lưu đề thi (Word/PDF/AI bóc tách)
  submissions: [],
  classes: [
    { id: "c1", name: "12A1 Chuyên Toán", studentCount: 0 },
    { id: "c2", name: "11B2 Nâng Cao", studentCount: 0 }
  ],
  messages: [],
  chats: [],
  courses: [],
  lessons: [],
  game_history: [],
  app_sync: []
});

const getDb = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = getInitialDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Database Corrupted, resetting...");
    return getInitialDb();
  }
};

const saveDb = (db: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("LocalStorage Save Error (Dung lượng có thể đã đầy):", e);
  }
};

export const supabase = {
  // Bộ xử lý truy vấn thông minh
  from: (table: string) => {
    const db = getDb();
    let tableData = Array.isArray(db[table]) ? [...db[table]] : [];
    let filterCol: string | null = null;
    let filterVal: any = null;

    const builder = {
      // Lấy dữ liệu
      select: async (columns: string = "*") => {
        // Có thể mở rộng logic chọn cột ở đây nếu cần
        return { data: tableData, error: null };
      },

      // Bộ lọc dữ liệu (Hỗ trợ tìm kiếm học sinh, lớp học)
      eq: (column: string, value: any) => {
        filterCol = column;
        filterVal = value;
        tableData = tableData.filter((item: any) => item && String(item[column]) === String(value));
        return builder;
      },

      // Thêm mới (Hỗ trợ lưu vĩnh viễn đề thi Word/PDF)
      insert: async (item: any) => {
        const currentDb = getDb();
        if (!Array.isArray(currentDb[table])) currentDb[table] = [];
        
        const items = Array.isArray(item) ? item : [item];
        const newItems = items.map(i => ({ 
          ...i, 
          id: String(i.id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`), 
          created_at: i.created_at || new Date().toISOString() 
        }));

        currentDb[table] = [...newItems, ...currentDb[table]];
        saveDb(currentDb);
        return { data: Array.isArray(item) ? newItems : newItems[0], error: null };
      },

      // Cập nhật hoặc thêm mới (Dùng cho duyệt học sinh)
      upsert: async (item: any) => {
        const currentDb = getDb();
        if (!Array.isArray(currentDb[table])) currentDb[table] = [];
        const items = Array.isArray(item) ? item : [item];
        
        items.forEach(i => {
          const tid = String(i.id);
          const idx = currentDb[table].findIndex((existing: any) => existing && String(existing.id) === tid);
          if (idx > -1) {
            currentDb[table][idx] = { ...currentDb[table][idx], ...i, updated_at: new Date().toISOString() };
          } else {
            currentDb[table].push({ ...i, id: tid, created_at: new Date().toISOString() });
          }
        });
        saveDb(currentDb);
        return { data: item, error: null };
      },

      // Cập nhật thông tin (Dùng cho sửa đề thi)
      update: async (updates: any) => {
        const currentDb = getDb();
        if (filterCol) {
          currentDb[table] = currentDb[table].map((i: any) => 
            i && String(i[filterCol!]) === String(filterVal) ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
          );
        }
        saveDb(currentDb);
        return { error: null };
      },

      // Xóa dữ liệu (Fix lỗi xóa không được của Thầy)
      delete: async () => {
        const currentDb = getDb();
        if (filterCol) {
          currentDb[table] = currentDb[table].filter((i: any) => i && String(i[filterCol!]) !== String(filterVal));
          saveDb(currentDb);
          return { error: null };
        }
        return { error: "Cần dùng lệnh .eq() để xác định mục tiêu xóa" };
      }
    };
    return builder;
  },

  // Giả lập lưu trữ file (Hỗ trợ upload PDF/Word lên Drive/Local)
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        console.log(`Đang tải file lên ${bucket}/${path}...`);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: path } })
    })
  },

  // Giả lập hệ thống Auth (Xử lý đăng nhập của Thầy Nhẫn)
  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      const db = getDb();
      const user = db.users.find((u: any) => u.email === email && u.password === password);
      if (user) return { data: { user, session: { access_token: 'fake-token' } }, error: null };
      return { data: { user: null }, error: { message: "Sai email hoặc mật khẩu!" } };
    },
    signOut: async () => {
      console.log("Đã đăng xuất");
      return { error: null };
    }
  }
};
