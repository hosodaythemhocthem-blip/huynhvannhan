/**
 * LOCAL SUPABASE ENGINE - LMS PRO MAX VERSION
 * Stable – Type Safe – Persistent – Supabase Compatible
 */

import { User } from "./types";

const STORAGE_KEY = "nhanlms_permanent_final_v70_pro";

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

const generateId = (prefix = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

/* =====================================================
   AUTH
===================================================== */

const auth = {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
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

  async signUp({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const db = getDb();

    if (db.users.find((u) => u.email === email)) {
      return { data: null, error: { message: "Email đã tồn tại" } };
    }

    const newUser: User = {
      id: generateId("user"),
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

  async signOut() {
    const db = getDb();
    db.session.userId = null;
    saveDb(db);
    return { error: null };
  },

  async getUser() {
    const db = getDb();
    const user = db.users.find((u) => u.id === db.session.userId);
    return { data: { user }, error: null };
  },
};

/* =====================================================
   QUERY BUILDER (SUPABASE-LIKE)
===================================================== */

const from = (table: keyof LocalDB) => {
  let db = getDb();
  let data = [...(db[table] as any[])];

  let filterKey: string | null = null;
  let filterValue: any = null;

  const builder = {
    select() {
      return builder;
    },

    eq(column: string, value: any) {
      filterKey = column;
      filterValue = value;
      data = data.filter((item) => item?.[column] === value);
      return builder;
    },

    order(column: string, { ascending }: { ascending: boolean }) {
      data.sort((a, b) =>
        ascending
          ? a[column] > b[column]
            ? 1
            : -1
          : a[column] < b[column]
          ? 1
          : -1
      );
      return builder;
    },

    async single() {
      return {
        data: data[0] || null,
        error: null,
      };
    },

    async maybeSingle() {
      return {
        data: data[0] || null,
        error: null,
      };
    },

    async insert(item: any) {
      db = getDb();
      const items = Array.isArray(item) ? item : [item];

      const newItems = items.map((i) => ({
        ...i,
        id: i.id || generateId(),
        createdAt: new Date().toISOString(),
      }));

      (db[table] as any[]).push(...newItems);
      saveDb(db);

      return { data: newItems, error: null };
    },

    async upsert(items: any[], options?: { onConflict?: string }) {
      db = getDb();
      const key = options?.onConflict || "id";

      items.forEach((item) => {
        const index = (db[table] as any[]).findIndex(
          (row) => row[key] === item[key]
        );

        if (index >= 0) {
          (db[table] as any[])[index] = {
            ...db[table][index],
            ...item,
            updatedAt: new Date().toISOString(),
          };
        } else {
          (db[table] as any[]).push({
            ...item,
            id: item.id || generateId(),
            createdAt: new Date().toISOString(),
          });
        }
      });

      saveDb(db);
      return { error: null };
    },

    async update(updates: any) {
      db = getDb();

      db[table] = (db[table] as any[]).map((item) =>
        filterKey && item?.[filterKey] === filterValue
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );

      saveDb(db);
      return { error: null };
    },

    async delete() {
      db = getDb();

      db[table] = (db[table] as any[]).filter(
        (item) =>
          !(filterKey && item?.[filterKey] === filterValue)
      );

      saveDb(db);
      return { error: null };
    },

    async then(resolve: any) {
      resolve({ data, error: null });
    },
  };

  return builder;
};

/* =====================================================
   STORAGE (WORD / PDF SUPPORT)
===================================================== */

const storage = {
  from: (_bucket: string) => ({
    async upload(path: string, file: File) {
      const db = getDb();

      return new Promise((resolve) => {
        const reader = new FileReader();

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

    getPublicUrl(path: string) {
      return {
        data: {
          publicUrl: path,
        },
      };
    },
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
