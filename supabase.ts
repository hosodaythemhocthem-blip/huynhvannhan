import { User, Exam, BaseEntity } from "./types"

const STORAGE_KEY = "lumina_lms_v6"

interface LocalDB {
  users: (User & { password: string })[]
  exams: Exam[]
  session: { userId: string | null }
}

const now = () => new Date().toISOString()

const generateId = () => crypto.randomUUID()

const createInitialDb = (): LocalDB => ({
  users: [
    {
      id: "teacher-nhan",
      email: "huynhvannhan@gmail.com",
      fullName: "Thầy Huỳnh Văn Nhẫn",
      role: "teacher",
      isApproved: true,
      isActive: true,
      password: "huynhvannhan2020",
      createdAt: now(),
      updatedAt: now(),
      isDeleted: false,
      version: 1,
    },
  ],
  exams: [],
  session: { userId: null },
})

const getDb = (): LocalDB => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const init = createInitialDb()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init))
    return init
  }
  return JSON.parse(raw)
}

const saveDb = (db: LocalDB) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))

/* ======================================================
   AUTH
====================================================== */

const auth = {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    const db = getDb()

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        !u.isDeleted
    )

    if (!user)
      return { data: null, error: { message: "Sai tài khoản." } }

    db.session.userId = user.id
    user.updatedAt = now()
    saveDb(db)

    const { password: _, ...safe } = user

    return { data: { user: safe }, error: null }
  },

  async signOut() {
    const db = getDb()
    db.session.userId = null
    saveDb(db)
    return { error: null }
  },

  async getUser() {
    const db = getDb()
    const user = db.users.find(
      (u) => u.id === db.session.userId && !u.isDeleted
    )

    if (!user) return { data: { user: null }, error: null }

    const { password: _, ...safe } = user
    return { data: { user: safe }, error: null }
  },
}

/* ======================================================
   SIMPLE QUERY (ONLY FOR EXAMS)
====================================================== */

const from = (table: "exams") => ({
  async select() {
    const db = getDb()
    return { data: db.exams.filter((e) => !e.isDeleted), error: null }
  },

  async insert(data: Exam) {
    const db = getDb()

    const exam: Exam = {
      ...data,
      id: data.id ?? generateId(),
      createdAt: now(),
      updatedAt: now(),
      isDeleted: false,
      version: 1,
    }

    db.exams.push(exam)
    saveDb(db)

    return { data: [exam], error: null }
  },

  async update(updates: Partial<Exam> & { id: string }) {
    const db = getDb()

    db.exams = db.exams.map((e) =>
      e.id === updates.id
        ? {
            ...e,
            ...updates,
            updatedAt: now(),
            version: e.version + 1,
          }
        : e
    )

    saveDb(db)
    return { error: null }
  },
})

export const supabase = {
  auth,
  from,
}
