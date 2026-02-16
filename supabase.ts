const STORAGE_KEY = 'nhanlms_permanent_final_v61';

const getInitialDb = () => ({ 
  users: [
    { id: "teacher-nhan", email: "huynhvannhan@gmail.com", fullName: "Thầy Huỳnh Văn Nhẫn", role: "teacher", isApproved: true }
  ], 
  exams: [], 
  submissions: [],
  classes: [
    { id: "c1", name: "12A1 Chuyên Toán" },
    { id: "c2", name: "11B2 Nâng Cao" }
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
    return getInitialDb();
  }
};

const saveDb = (db: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("LocalStorage Save Error:", e);
  }
};

export const supabase = {
  from: (table: string) => {
    const db = getDb();
    let tableData = Array.isArray(db[table]) ? [...db[table]] : [];
    let filterCol: string | null = null;
    let filterVal: any = null;

    const builder = {
      select: async () => ({ data: tableData, error: null }),
      eq: (column: string, value: any) => {
        filterCol = column;
        filterVal = value;
        tableData = tableData.filter((item: any) => item && String(item[column]) === String(value));
        return builder;
      },
      insert: async (item: any) => {
        const currentDb = getDb();
        if (!Array.isArray(currentDb[table])) currentDb[table] = [];
        const items = Array.isArray(item) ? item : [item];
        const newItems = items.map(i => ({ 
          ...i, 
          id: String(i.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`), 
          created_at: i.created_at || new Date().toISOString() 
        }));
        currentDb[table] = [...newItems, ...currentDb[table]];
        saveDb(currentDb);
        return { data: Array.isArray(item) ? newItems : newItems[0], error: null };
      },
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
        return { error: null };
      },
      update: async (id: any, updates: any) => {
        const currentDb = getDb();
        const targetId = updates ? String(id) : (filterCol === 'id' ? String(filterVal) : null);
        const actualUpdates = updates || id;
        if (targetId) {
          currentDb[table] = currentDb[table].map((i: any) => i && String(i.id) === targetId ? { ...i, ...actualUpdates } : i);
        } else if (filterCol) {
          currentDb[table] = currentDb[table].map((i: any) => i && String(i[filterCol!]) === String(filterVal) ? { ...i, ...actualUpdates } : i);
        }
        saveDb(currentDb);
        return { error: null };
      },
      delete: async (idOrNothing?: any) => {
        const currentDb = getDb();
        const targetId = idOrNothing ? String(idOrNothing) : (filterCol === 'id' ? String(filterVal) : null);
        if (targetId) {
          currentDb[table] = currentDb[table].filter((i: any) => i && String(i.id) !== targetId);
        } else if (filterCol) {
          currentDb[table] = currentDb[table].filter((i: any) => i && String(i[filterCol!]) !== String(filterVal));
        }
        saveDb(currentDb);
        return { error: null };
      }
    };
    return builder;
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: path } })
    })
  }
};
