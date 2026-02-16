import React, { useState, useEffect } from "react";
import { 
  Users, Trash2, CheckCircle2, Search, 
  Loader2, School, Info, Plus, ListFilter, X, 
  ChevronRight, UserMinus, ShieldAlert 
} from "lucide-react";
import { supabase } from "../supabase";
import { User } from "../types";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

const ClassManagement: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('*');
      const { data: classData, error: classError } = await supabase.from('classes').select('*');
      
      if (userError || classError) throw new Error("Lỗi tải dữ liệu");
      
      setUsers(userData || []);
      setClasses(classData || []);
    } catch (err) {
      showToast("Lỗi đồng bộ dữ liệu Cloud.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const { error } = await (supabase.from('classes') as any).insert({ name: newClassName.trim() });
      if (error) throw error;
      
      setNewClassName("");
      setShowCreateClass(false);
      showToast(`Đã tạo lớp "${newClassName}" vĩnh viễn!`, "success");
      await loadAllData();
    } catch (err) {
      showToast("Không thể tạo lớp học.", "error");
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (confirm(`Thầy Nhẫn chắc chắn muốn xóa VĨNH VIỄN lớp "${name}"?\nHọc sinh trong lớp này sẽ không còn thuộc lớp nào.`)) {
      try {
        const { error } = await (supabase.from('classes') as any).delete().eq('id', id);
        if (error) throw error;
        
        showToast(`Đã xóa lớp ${name} thành công.`, "success");
        if (selectedClassId === id) setSelectedClassId(null);
        await loadAllData();
      } catch (err) {
        showToast("Lỗi khi xóa lớp.", "error");
      }
    }
  };

  const approveUser = async (id: string) => {
    try {
      const { error } = await (supabase.from('users') as any).update({ isApproved: true }).eq('id', id);
      if (error) throw error;
      
      showToast("Đã duyệt học sinh vào lớp!", "success");
      await loadAllData();
    } catch (err) {
      showToast("Lỗi phê duyệt.", "error");
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Xóa vĩnh viễn học sinh này khỏi hệ thống? Dữ liệu điểm số sẽ mất sạch.")) {
      try {
        const { error } = await (supabase.from('users') as any).delete().eq('id', id);
        if (error) throw error;
        
        showToast("Đã xóa học sinh.", "info");
        await loadAllData();
      } catch (err) {
        showToast("Lỗi khi xóa.", "error");
      }
    }
  };

  // Logic lọc danh sách
  const studentList = users.filter(u => u.role === 'student');
  const classStudents = selectedClassId 
    ? studentList.filter(u => u.classId === selectedClassId)
    : studentList;

  const filteredStudents = classStudents.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingList = studentList.filter(u => !u.isApproved);
  const approvedList = filteredStudents.filter(u => u.isApproved);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Đang đồng bộ dữ liệu Thầy Nhẫn...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans">
      {/* Header Section */}
      <header className="bg-white p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl animate-float">
             <School className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Quản lý Lớp Học</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
              {classes.length} Lớp • <span className="text-rose-500">{pendingList.length} Chờ duyệt</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateClass(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-black transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={24} strokeWidth={3} /> TẠO LỚP MỚI
        </button>
      </header>

      {/* Modal tạo lớp */}
      <AnimatePresence>
        {showCreateClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-12 rounded-[4rem] w-full max-w-lg shadow-3xl relative">
               <button onClick={() => setShowCreateClass(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
               <h3 className="text-3xl font-black text-slate-900 mb-6 italic tracking-tighter">THÊM LỚP MỚI</h3>
               <form onSubmit={handleCreateClass} className="space-y-6">
                  <input autoFocus required type="text" placeholder="Tên lớp (VD: 12A1 Chuyên Toán)" className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700 shadow-inner text-lg" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                  <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all uppercase tracking-widest">LƯU LẠI VĨNH VIỄN</button>
               </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Lớp học */}
        <aside className="lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ListFilter size={14} /> Danh mục lớp học
              </h3>
           </div>
           
           <div className="space-y-3">
              <button 
                onClick={() => setSelectedClassId(null)}
                className={`w-full flex items-center justify-between p-6 rounded-[2.2rem] transition-all font-black text-sm uppercase tracking-widest border
                  ${selectedClassId === null ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-4"><Users size={20} /> Tất cả học sinh</div>
                 <ChevronRight size={18} />
              </button>

              {classes.map(cls => (
                <div key={cls.id} className="relative group flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`flex-1 flex items-center justify-between p-6 rounded-[2.2rem] transition-all font-black text-sm uppercase tracking-widest border
                      ${selectedClassId === cls.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-4 truncate"><School size={20} /> {cls.name}</div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                    className="p-4 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    title="Xóa lớp vĩnh viễn"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
           </div>
        </aside>

        {/* Main Content: Học sinh */}
        <main className="lg:col-span-8 space-y-8">
           <div className="relative w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Tìm tên học sinh..." className="w-full pl-16 pr-6 py-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={search} onChange={e => setSearch(e.target.value)} />
           </div>

           {/* Pending Approval */}
           {pendingList.length > 0 && !selectedClassId && (
             <div className="space-y-6">
                <h4 className="text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] px-4 flex items-center gap-2"><ShieldAlert size={14} className="animate-pulse" /> Đang chờ Thầy Nhẫn duyệt ({pendingList.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {pendingList.map(user => (
                     <MotionDiv key={user.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-[3rem] border border-rose-100 shadow-xl shadow-rose-50/50 flex flex-col justify-between group">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{user.fullName.charAt(0)}</div>
                           <div>
                              <h5 className="font-black text-slate-800 text-lg leading-tight">{user.fullName}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => approveUser(user.id)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">DUYỆT VÀO LỚP</button>
                           <button onClick={() => deleteUser(user.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><UserMinus size={18} /></button>
                        </div>
                     </MotionDiv>
                   ))}
                </div>
             </div>
           )}

           {/* Approved List */}
           <div className="space-y-6">
              <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] px-4">
                 {selectedClassId ? `Danh sách học sinh lớp hiện tại` : 'Toàn bộ học sinh hệ thống'}
              </h4>
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-50">
                       <tr>
                          <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
                          <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp học</th>
                          <th className="px-10 py-7 text-right"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {approvedList.length > 0 ? approvedList.map(user => (
                         <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">{user.fullName.charAt(0)}</div>
                                  <div><span className="font-bold text-slate-800 block text-sm">{user.fullName}</span><span className="text-[10px] text-slate-400 font-bold uppercase">{user.email}</span></div>
                               </div>
                            </td>
                            <td className="px-10 py-6"><span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase border border-slate-200">{user.className || 'Chưa phân lớp'}</span></td>
                            <td className="px-10 py-6 text-right">
                               <button onClick={() => deleteUser(user.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </td>
                         </tr>
                       )) : (
                         <tr><td colSpan={3} className="py-24 text-center"><p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Hệ thống chưa ghi nhận học sinh</p></td></tr>
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
