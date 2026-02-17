/**
 * LOCAL SUPABASE ENGINE - LMS PRO MAX v3
 * Fully Type Safe – Persistent – Stable – AI Ready
 */

import { User } from "./types";

/* =======================================================
   STORAGE KEY
======================================================= */

const STORAGE_KEY = "nhanlms_permanent_final_v90_pro";

/* =======================================================
   TYPES
======================================================= */

export interface Message {
  id: string;
  user_id: string;
  role: "user" | "ai";
  text: string;
  file_name?: string;
  createdAt: string;
  updatedAt?: string;
}

interface LocalFile {
  id: string;
  path: string;
  content: string;
  file_type?: string;
  size?: number;
  uploadedAt: string;
}

interface LocalDB {
  users: UserWithPassword[];
  exams: any[];
  submissions: any[];
  classes: any[];
  messages: Message[];
  chats: any[];
  courses: any[];
  lessons: any[];
  game_history: any[];
  app_sync: any[];
  files: LocalFile[];
  session: { userId: string | null };
}

interface UserWithPassword extends User {
  password: string;
  lastLoginAt?: string;
}

/* =======================================================
   HELPERS
======================================================= */

const generateId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID()}`;

const now = () => new Date().toISOString();

/* =======================================================
   INITIAL DATABASE
======================================================= */

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

/* =======================================================
   CORE DB
======================================================= */

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

/* =======================================================
   AUTH SYSTEM
======================================================= */

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
      return {
        data: null,
        error: { message: "Sai tài khoản hoặc mật khẩu" },
      };
    }

    db.session.userId = user.id;
    user.lastLoginAt = now();
    saveDb(db);

    const { password: _, ...safeUser } = user;

    return { data: { user: safeUser }, error: null };
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

    const newUser: UserWithPassword = {
      id: generateId("user"),
      email,
      fullName,
      role: "student",
      isApproved: false,
      password,
      createdAt: now(),
      updatedAt: now(),
    };

    db.users.push(newUser);
    saveDb(db);

    const { password: _, ...safeUser } = newUser;

    return { data: { user: safeUser }, error: null };
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

    if (!user) return { data: { user: null }, error: null };

    const { password: _, ...safeUser } = user;
    return { data: { user: safeUser }, error: null };
  },
};

/* =======================================================
   QUERY BUILDER
======================================================= */

const from = <T extends keyof LocalDB>(table: T) => {
  let db = getDb();
  let rows = [...(db[table] as any[])];
  let filterKey: string | null = null;
  let filterValue: any = null;

  const applyFilter = () => {
    if (!filterKey) return rows;
    return rows.filter((r) => r?.[filterKey!] === filterValue);
  };

  return {
    select() {
      rows = applyFilter();
      return this;
    },

    eq(column: string, value: any) {
      filterKey = column;
      filterValue = value;
      rows = applyFilter();
      return this;
    },

    order(column: string, { ascending }: { ascending: boolean }) {
      rows.sort((a, b) =>
        ascending
          ? a[column] > b[column] ? 1 : -1
          : a[column] < b[column] ? 1 : -1
      );
      return this;
    },

    async single() {
      return { data: rows[0] || null, error: null };
    },

    async insert(item: any) {
      db = getDb();
      const arr = Array.isArray(item) ? item : [item];

      const newItems = arr.map((i) => ({
        ...i,
        id: i.id || generateId(String(table)),
        createdAt: now(),
        updatedAt: now(),
      }));

      (db[table] as any[]).push(...newItems);
      saveDb(db);

      return {
        data: newItems.length === 1 ? newItems[0] : newItems,
        error: null,
      };
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

    async deleteAll() {
      db = getDb();
      db[table] = [];
      saveDb(db);
      return { error: null };
    },

    then(resolve: any) {
      resolve({ data: rows, error: null });
    },
  };
};

/* =======================================================
   STORAGE (Word / PDF / Image)
======================================================= */

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

/* =======================================================
   EXPORT
======================================================= */

export const supabase = {
  from,
  auth,
  storage,
};
