import React, { useState, useEffect } from "react";
import { 
  Users, Trash2, CheckCircle2, Search, 
  Loader2, School, Plus, ListFilter, X, 
  ChevronRight, UserMinus, ShieldAlert, BadgeCheck
} from "lucide-react";
import { supabase } from "../supabase";
import { User } from "../types";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

type ExtendedUser = User & {
  role?: string;
  class_name?: string | null;
  status?: string;
};

interface ClassItem {
  id: string;
  name: string;
  created_at?: string;
  teacher_id?: string;
}

interface Props {
  user: User;
}

const ClassManagement: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    if (user && user.id) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id) 
        .order('name', { ascending: true });
      
      if (userError) {
        console.error("Lỗi tải users:", userError);
      }
      if (classError) throw classError;
      
      // 🚀 LOG BẮT BỆNH: F12 lên xem có danh sách học sinh ở đây không nhé!
      console.log("📦 Dữ liệu Users từ Database:", userData);
      
      setUsers((userData as ExtendedUser[]) || []);
      setClasses((classData as ClassItem[]) || []);
    } catch (err) {
      console.error("Lỗi data:", err);
      showToast("Không thể tải dữ liệu lớp học", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const { error } = await supabase.from('classes').insert({ 
        name: newClassName.trim(),
        teacher_id: user.id, 
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      setNewClassName("");
      setShowCreateClass(false);
      showToast(`Đã tạo lớp "${newClassName}" thành công!`, "success");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tạo lớp mới.", "error");
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`CẢNH BÁO: Thầy có chắc muốn xóa lớp "${name}"?\nHọc sinh trong lớp này sẽ mất thông tin lớp.`)) return;

    try {
      await supabase.from('users').update({ class_name: null }).eq('class_name', name);
      
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      
      showToast(`Đã xóa lớp ${name}.`, "success");
      if (selectedClassId === id) setSelectedClassId(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Không thể xóa lớp.", "error");
    }
  };

  const approveUser = async (targetUser: ExtendedUser) => {
    try {
      const targetClass = classes.find(c => c.id === selectedClassId)?.name;
      const finalClassName = targetClass || targetUser.class_name || null;

      if (!finalClassName) {
        alert("⚠️ Thầy vui lòng click chọn một lớp ở danh mục bên trái trước để hệ thống biết xếp em này vào lớp nào nhé!");
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ 
            status: 'active', 
            class_name: finalClassName 
        })
        .eq('id', targetUser.id);

      if (error) throw error;
      
      showToast(`Đã duyệt em ${targetUser.full_name} vào lớp ${finalClassName}!`, "success");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Lỗi phê duyệt học sinh.", "error");
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn tài khoản học sinh này? Hành động không thể hoàn tác.")) return;
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      showToast("Đã xóa hồ sơ học sinh.", "info");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi xóa học sinh.", "error");
    }
  };

  // 🚀 ĐÃ SỬA: Lọc cực chuẩn không sợ sai hoa/thường hay khoảng trắng
  const studentList = users.filter(u => 
    u.role?.trim().toLowerCase() === 'student' || 
    u.role?.trim().toLowerCase() === 'hocsinh'
  );
  
  const selectedClassData = classes.find(c => c.id === selectedClassId);
  const selectedClassName = selectedClassData?.name || null;

  const classStudents = selectedClassName
    ? studentList.filter(u => u.class_name === selectedClassName)
    : studentList;

  const filteredStudents = classStudents.filter(u => 
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // 🚀 ĐÃ SỬA: Lấy chính xác status pending để hiển thị khu vực cần duyệt
  const pendingList = studentList.filter(u => u.status?.trim().toLowerCase() === 'pending');
  const activeList = filteredStudents.filter(u => u.status?.trim().toLowerCase() === 'active');

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu lớp học...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      <header className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl">
             <School className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">QUẢN LÝ LỚP HỌC</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
              {classes.length} Lớp • <span className="text-rose-500">{pendingList.length} Chờ duyệt</span> • {users.length} Tài khoản
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateClass(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95 z-10"
        >
          <Plus size={20} strokeWidth={3} /> Tạo Lớp Mới
        </button>
      </header>

      <AnimatePresence>
        {showCreateClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative overflow-hidden"
            >
               <button onClick={() => setShowCreateClass(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"><X size={28}/></button>
               <h3 className="text-2xl font-black text-slate-800 mb-2">Thêm Lớp Mới</h3>
               <p className="text-slate-500 text-sm mb-8">Nhập tên lớp để quản lý học sinh (VD: 12A1)</p>
               
               <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <input 
                        autoFocus required 
                        type="text" 
                        placeholder="Tên lớp..." 
                        className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-lg placeholder:text-slate-400" 
                        value={newClassName} 
                        onChange={e => setNewClassName(e.target.value)} 
                    />
                  </div>
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg">
                      XÁC NHẬN TẠO
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <aside className="lg:col-span-4 space-y-4">
           <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ListFilter size={14} /> Danh mục
              </h3>
           </div>
           
           <div className="space-y-3">
              <button 
                onClick={() => setSelectedClassId(null)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all font-bold text-sm border ${selectedClassId === null ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
              >
                 <span className="flex items-center gap-3"><Users size={18} /> Tất cả học sinh</span>
                 {selectedClassId === null && <ChevronRight size={16} />}
              </button>

              {classes.map(cls => (
                <div key={cls.id} className="group relative flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`flex-1 flex items-center justify-between p-5 rounded-2xl transition-all font-bold text-sm border ${selectedClassId === cls.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                     <span className="flex items-center gap-3"><School size={18} /> {cls.name}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="p-4 bg-white border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100 absolute right-0 translate-x-[110%] group-hover:translate-x-0 z-20"
                    title="Xóa lớp vĩnh viễn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
           </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
           <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm học sinh theo tên hoặc email..." 
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700 placeholder:text-slate-300" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
           </div>

           {pendingList.length > 0 && (
             <div className="bg-rose-50/50 border border-rose-100 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3 text-rose-600 px-2">
                   <ShieldAlert size={24} className="animate-pulse" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Cần Duyệt Gấp ({pendingList.length})</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {pendingList.map(u => (
                      <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 flex flex-col gap-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-rose-200">
                               {(u.full_name || 'U').charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                               <h5 className="font-bold text-slate-800 truncate">{u.full_name || 'Học sinh mới'}</h5>
                               <p className="text-xs text-slate-400 font-medium truncate">{u.email}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 mt-auto">
                            <button onClick={() => approveUser(u)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                               <CheckCircle2 size={16} /> Duyệt Ngay
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="p-3 bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                               <UserMinus size={18} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <BadgeCheck className="text-emerald-500" size={24} />
                    {selectedClassName ? `Học Sinh Lớp ${selectedClassName}` : 'Danh Sách Chính Thức'}
                 </h4>
                 <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{activeList.length} em</span>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                       <tr>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {activeList.length > 0 ? activeList.map(u => (
                          <tr key={u.id} className="group hover:bg-indigo-50/30 transition-all">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                      {(u.full_name || 'U').charAt(0)}
                                   </div>
                                   <div>
                                      <span className="font-bold text-slate-800 block text-sm">{u.full_name || 'Chưa cập nhật tên'}</span>
                                      <span className="text-[11px] text-slate-400 font-medium">{u.email}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${u.class_name ? 'bg-white border-slate-200 text-slate-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                   {u.class_name || 'Chưa xếp lớp'}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <button 
                                  onClick={() => deleteUser(u.id)} 
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Xóa học sinh này"
                                >
                                   <Trash2 size={18} />
                                </button>
                             </td>
                          </tr>
                       )) : (
                          <tr>
                             <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-medium">
                                Không có học sinh nào trong danh sách.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default ClassManagement;
