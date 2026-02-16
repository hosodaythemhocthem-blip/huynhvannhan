/**
 * LOCAL SUPABASE ENGINE - LMS PRO VERSION
 * Tương thích types.ts mới
 * Không lỗi TS - Không any bừa bãi
 */

import { User } from "./types";

const STORAGE_KEY = "nhanlms_permanent_final_v64_pro";

/* =====================================================
   DATABASE STRUCTURE
===================================================== */

interface LocalDB {
  users: User[];
  exams: any[];
  submissions: any[];
  classes: any[];
  messages: any[];
  chats: any[];
  courses: any[];
  lessons: any[];
  game_history: any[];
  app_sync: any[];
  files: { path: string; content: string }[];
  session: { userId: string | null };
}

/* =====================================================
   INITIAL DB
===================================================== */

const getInitialDb = (): LocalDB => ({
  users: [
    {
      id: "teacher-nhan",
      email: "huynhvannhan@gmail.com",
      fullName: "Thầy Huỳnh Văn Nhẫn",
      role: "teacher",
      isApproved: true,
      password: "huynhvannhan2020",
      createdAt: new Date().toISOString(),
    },
  ],
  exams: [],
  submissions: [],
  classes: [
    {
      id: "c1",
      name: "12A1 Chuyên Toán",
      teacherId: "teacher-nhan",
      createdAt: new Date().toISOString(),
    },
    {
      id: "c2",
      name: "11B2 Nâng Cao",
      teacherId: "teacher-nhan",
      createdAt: new Date().toISOString(),
    },
  ],
  messages: [],
  chats: [],
  courses: [],
  lessons: [],
  game_history: [],
  app_sync: [],
  files: [],
  session: { userId: null },
});

/* =====================================================
   DB HELPERS
===================================================== */

const getDb = (): LocalDB => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = getInitialDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return getInitialDb();
  }
};

const saveDb = (db: LocalDB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

/* =====================================================
   AUTH SYSTEM
===================================================== */

const auth = {
  signInWithPassword: async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const db = getDb();
    const user = db.users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return { data: null, error: { message: "Sai tài khoản hoặc mật khẩu" } };
    }

    db.session.userId = user.id;
    saveDb(db);

    return { data: { user }, error: null };
  },

  signUp: async ({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    const db = getDb();

    if (db.users.find((u) => u.email === email)) {
      return { data: null, error: { message: "Email đã tồn tại" } };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      password,
      fullName,
      role: "student",
      isApproved: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    return { data: { user: newUser }, error: null };
  },

  signOut: async () => {
    const db = getDb();
    db.session.userId = null;
    saveDb(db);
    return { error: null };
  },

  getUser: async () => {
    const db = getDb();
    const user = db.users.find((u) => u.id === db.session.userId);
    return { data: { user }, error: null };
  },
};

/* =====================================================
   QUERY BUILDER
===================================================== */

const from = (table: keyof LocalDB) => {
  const db = getDb();
  let tableData = Array.isArray(db[table]) ? [...(db[table] as any[])] : [];

  let filterCol: string | null = null;
  let filterVal: any = null;

  const builder: any = {
    select: async () => ({ data: tableData, error: null }),

    eq: (column: string, value: any) => {
      filterCol = column;
      filterVal = value;
      tableData = tableData.filter(
        (item) => String(item?.[column]) === String(value)
      );
      return builder;
    },

    insert: async (item: any) => {
      const db = getDb();
      const items = Array.isArray(item) ? item : [item];

      const newItems = items.map((i) => ({
        ...i,
        id: i.id || `id_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString(),
      }));

      (db[table] as any[]).push(...newItems);
      saveDb(db);

      return { data: newItems, error: null };
    },

    update: async (updates: any) => {
      const db = getDb();

      db[table] = (db[table] as any[]).map((item) =>
        filterCol && String(item?.[filterCol]) === String(filterVal)
          ? { ...item, ...updates }
          : item
      );

      saveDb(db);
      return { error: null };
    },

    delete: async () => {
      const db = getDb();

      db[table] = (db[table] as any[]).filter(
        (item) =>
          !(
            filterCol &&
            String(item?.[filterCol]) === String(filterVal)
          )
      );

      saveDb(db);
      return { error: null };
    },
  };

  return builder;
};

/* =====================================================
   STORAGE (FILE UPLOAD)
===================================================== */

const storage = {
  from: (_bucket: string) => ({
    upload: async (path: string, file: File) => {
      const db = getDb();

      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => {
          db.files.push({
            path,
            content: reader.result as string,
          });
          saveDb(db);
          resolve({ data: { path }, error: null });
        };
        reader.readAsDataURL(file);
      });
    },

    getPublicUrl: (path: string) => ({
      data: {
        publicUrl: path,
      },
    }),
  }),
};

/* =====================================================
   EXPORT
===================================================== */

export const supabase = {
  from,
  auth,
  storage,
};
