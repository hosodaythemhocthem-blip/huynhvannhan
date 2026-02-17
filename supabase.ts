/**
 * LMS PRO MAX V4
 * Strict Mode Safe – Auto Migration – Versioned – Soft Delete
 */

import { User, BaseEntity } from "./types";

/* =====================================================
   CONFIG
===================================================== */

const STORAGE_KEY = "nhanlms_pro_max_v4";
const DB_VERSION = 4;

/* =====================================================
   TYPES
===================================================== */

interface LocalDB {
  __version: number;

  users: any[];
  exams: any[];
  submissions: any[];
  classes: any[];
  courses: any[];
  files: any[];

  session: { userId: string | null };
}

/* =====================================================
   HELPERS
===================================================== */

const now = () => new Date().toISOString();

const generateId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID()}`;

const injectBase = <T extends object>(
  data: T,
  userId?: string
): T & BaseEntity => ({
  id: (data as any).id ?? generateId("id"),
  createdAt: now(),
  updatedAt: now(),
  createdBy: userId,
  updatedBy: userId,
  isDeleted: false,
  version: 1,
  ...data,
});

/* =====================================================
   INITIAL DB
===================================================== */

const createInitialDb = (): LocalDB => ({
  __version: DB_VERSION,

  users: [
    injectBase<User & { password: string }>(
      {
        id: "teacher-nhan",
        email: "huynhvannhan@gmail.com",
        fullName: "Thầy Huỳnh Văn Nhẫn",
        role: "teacher",
        isApproved: true,
        isActive: true,
        password: "huynhvannhan2020",
      },
      "system"
    ),
  ],

  exams: [],
  submissions: [],
  classes: [],
  courses: [],
  files: [],

  session: { userId: null },
});

/* =====================================================
   CORE DB
===================================================== */

const getDb = (): LocalDB => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = createInitialDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }

    const parsed = JSON.parse(raw);

    if (!parsed.__version || parsed.__version !== DB_VERSION) {
      const migrated = {
        ...createInitialDb(),
        ...parsed,
        __version: DB_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return parsed;
  } catch {
    const fresh = createInitialDb();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
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
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password &&
        !u.isDeleted
    );

    if (!user)
      return { data: null, error: { message: "Sai tài khoản." } };

    if (!user.isActive)
      return { data: null, error: { message: "Tài khoản bị khóa." } };

    user.lastLoginAt = now();
    db.session.userId = user.id;
    saveDb(db);

    const { password: _, ...safe } = user;

    return { data: { user: safe }, error: null };
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

    if (
      db.users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
    )
      return { data: null, error: { message: "Email đã tồn tại." } };

    const newUser = injectBase({
      email,
      fullName,
      role: "student",
      isApproved: false,
      isActive: true,
      password,
    });

    db.users.push(newUser);
    saveDb(db);

    const { password: _, ...safe } = newUser;

    return { data: { user: safe }, error: null };
  },

  async signOut() {
    const db = getDb();
    db.session.userId = null;
    saveDb(db);
    return { error: null };
  },

  async getUser() {
    const db = getDb();
    const user = db.users.find(
      (u) => u.id === db.session.userId && !u.isDeleted
    );
    if (!user) return { data: { user: null }, error: null };

    const { password: _, ...safe } = user;
    return { data: { user: safe }, error: null };
  },
};

/* =====================================================
   QUERY BUILDER
===================================================== */

const from = (table: keyof LocalDB) => {
  let db = getDb();
  let rows = [...(db[table] as any[])];

  const applySoftFilter = () =>
    rows.filter((r) => !r.isDeleted);

  return {
    select() {
      rows = applySoftFilter();
      return this;
    },

    eq(column: string, value: any) {
      rows = applySoftFilter().filter(
        (r) => r[column] === value
      );
      return this;
    },

    async insert(data: any) {
      db = getDb();
      const arr = Array.isArray(data) ? data : [data];

      const injected = arr.map((i) =>
        injectBase(i, db.session.userId || "system")
      );

      (db[table] as any[]).push(...injected);
      saveDb(db);

      return { data: injected, error: null };
    },

    async update(updates: any) {
      db = getDb();
      (db[table] as any[]) = (db[table] as any[]).map(
        (item) =>
          rows.some((r) => r.id === item.id)
            ? {
                ...item,
                ...updates,
                updatedAt: now(),
                version: item.version + 1,
              }
            : item
      );
      saveDb(db);
      return { error: null };
    },

    async delete() {
      db = getDb();
      (db[table] as any[]) = (db[table] as any[]).map(
        (item) =>
          rows.some((r) => r.id === item.id)
            ? { ...item, isDeleted: true }
            : item
      );
      saveDb(db);
      return { error: null };
    },

    then(resolve: any) {
      resolve({ data: rows, error: null });
    },
  };
};

/* =====================================================
   STORAGE
===================================================== */

const storage = {
  from: () => ({
    async upload(path: string, file: File) {
      const db = getDb();

      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
          db.files.push(
            injectBase({
              fileName: file.name,
              fileUrl: reader.result,
              fileType: file.type,
              fileSize: file.size,
              uploadedBy: db.session.userId,
            })
          );

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
      return { data: { publicUrl: path } };
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
