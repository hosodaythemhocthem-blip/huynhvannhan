/**
 * LOCAL SUPABASE ENGINE - LMS PRO MAX v2
 * Stable – Type Safe – Persistent – Supabase Compatible
 */

import { User } from "./types";

const STORAGE_KEY = "nhanlms_permanent_final_v80_pro";

/* =====================================================
   DATABASE STRUCTURE
===================================================== */

interface LocalDB {
  users: any[];
  exams: any[];
  submissions: any[];
  classes: any[];
  messages: any[];
  chats: any[];
  courses: any[];
  lessons: any[];
  game_history: any[];
  app_sync: any[];
  files: {
    id: string;
    path: string;
    content: string;
    file_type?: string;
    size?: number;
    uploadedAt: string;
  }[];
  session: { userId: string | null };
}

/* =====================================================
   HELPERS
===================================================== */

const generateId = (prefix = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

const now = () => new Date().toISOString();

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
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  exams: [],
  submissions: [],
  classes: [
    {
      id: "c1",
      name: "12A1 Chuyên Toán",
      teacherId: "teacher-nhan",
      createdAt: now(),
    },
    {
      id: "c2",
      name: "11B2 Nâng Cao",
      teacherId: "teacher-nhan",
      createdAt: now(),
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
   DB CORE
===================================================== */

const getDb = (): LocalDB => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const init = getInitialDb();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
};

const saveDb = (db: LocalDB) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

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
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      return { data: null, error: { message: "Sai tài khoản hoặc mật khẩu" } };
    }

    db.session.userId = user.id;
    user.lastLoginAt = now();
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

    if (db.users.some((u) => u.email === email)) {
      return { data: null, error: { message: "Email đã tồn tại" } };
    }

    const newUser: User = {
      id: generateId("user"),
      email,
      fullName,
      role: "student",
      isApproved: false,
      createdAt: now(),
      updatedAt: now(),
    };

    (newUser as any).password = password;

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
    return { data: { user: user || null }, error: null };
  },
};

/* =====================================================
   QUERY BUILDER
===================================================== */

const from = (table: keyof LocalDB) => {
  let db = getDb();
  let rows = [...(db[table] as any[])];

  let filterKey: string | null = null;
  let filterValue: any = null;

  const builder = {
    select() {
      return builder;
    },

    eq(column: string, value: any) {
      filterKey = column;
      filterValue = value;
      rows = rows.filter((r) => r?.[column] === value);
      return builder;
    },

    order(column: string, { ascending }: { ascending: boolean }) {
      rows.sort((a, b) =>
        ascending
          ? a[column] > b[column] ? 1 : -1
          : a[column] < b[column] ? 1 : -1
      );
      return builder;
    },

    async single() {
      return { data: rows[0] || null, error: null };
    },

    async insert(item: any) {
      db = getDb();
      const arr = Array.isArray(item) ? item : [item];

      const newItems = arr.map((i) => ({
        ...i,
        id: i.id || generateId(table),
        createdAt: now(),
      }));

      (db[table] as any[]).push(...newItems);
      saveDb(db);

      return { data: newItems, error: null };
    },

    async upsert(item: any, options?: { onConflict?: string }) {
      db = getDb();
      const key = options?.onConflict || "id";
      const arr = Array.isArray(item) ? item : [item];

      arr.forEach((i) => {
        const index = (db[table] as any[]).findIndex(
          (row) => row[key] === i[key]
        );

        if (index >= 0) {
          (db[table] as any[])[index] = {
            ...db[table][index],
            ...i,
            updatedAt: now(),
          };
        } else {
          (db[table] as any[]).push({
            ...i,
            id: i.id || generateId(table),
            createdAt: now(),
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
          ? { ...item, ...updates, updatedAt: now() }
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
      resolve({ data: rows, error: null });
    },
  };

  return builder;
};

/* =====================================================
   STORAGE (Word / PDF / Image)
===================================================== */

const storage = {
  from: (_bucket: string) => ({
    async upload(path: string, file: File) {
      const db = getDb();

      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
          db.files.push({
            id: generateId("file"),
            path,
            content: reader.result as string,
            file_type: file.type,
            size: file.size,
            uploadedAt: now(),
          });

          saveDb(db);

          resolve({
            data: { path },
            error: null,
          });
        };

        reader.readAsDataURL(file);
      });
    },

    getPublicUrl(path: string) {
      return {
        data: { publicUrl: path },
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
