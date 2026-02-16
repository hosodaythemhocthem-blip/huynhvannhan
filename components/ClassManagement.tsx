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
      const { data: userData } = await supabase.from('users').select();
      const { data: classData } = await supabase.from('classes').select();
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
      const { data } = await supabase.from('classes').insert({ name: newClassName.trim() });
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
        await supabase.from('classes').delete(id);
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
      await supabase.from('users').update(id, { isApproved: true });
      showToast("Đã duyệt học sinh vào lớp!", "success");
      await loadAllData();
    } catch (err) {
      showToast("Lỗi phê duyệt.", "error");
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Xóa vĩnh viễn học sinh này khỏi hệ thống? Dữ liệu điểm số sẽ mất sạch.")) {
      try {
        await supabase.from('users').delete(id);
        showToast("Đã xóa học sinh.", "info");
        await loadAllData();
      } catch (err) {
        showToast("Lỗi khi xóa.", "error");
      }
    }
  };

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
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cloud Synced Permanent...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
             <School className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Quản lý Lớp & Học sinh</h2>
            <p className="text-slate-400 font-medium">Thầy Nhẫn có <span className="text-indigo-600 font-black">{classes.length} lớp</span> và <span className="text-rose-500 font-black">{pendingList.length} học sinh chờ duyệt</span>.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateClass(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-black transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={24} strokeWidth={3} /> TẠO LỚP MỚI
        </button>
      </header>

      <AnimatePresence>
        {showCreateClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-12 rounded-[4rem] w-full max-w-lg shadow-3xl relative">
               <button onClick={() => setShowCreateClass(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={32}/></button>
               <h3 className="text-3xl font-black text-slate-900 mb-2 italic">Thêm lớp học mới</h3>
               <form onSubmit={handleCreateClass} className="space-y-6">
                  <input autoFocus required type="text" placeholder="Tên lớp (VD: 12A1 Chuyên Toán)" className="w-full px-8 py-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700 shadow-inner text-lg" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                  <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all uppercase tracking-widest">LƯU LỚP HỌC</button>
               </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ListFilter size={14} /> Danh mục lớp học
              </h3>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{classes.length} Lớp</span>
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
                      ${selectedClassId === cls.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-4 truncate"><School size={20} className="shrink-0" /> {cls.name}</div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                    className="p-4 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm group-hover:scale-105 active:scale-90"
                    title="Xóa lớp vĩnh viễn"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
           </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
           <div className="relative w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input type="text" placeholder="Tìm tên học sinh trong hệ thống..." className="w-full pl-16 pr-6 py-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={search} onChange={e => setSearch(e.target.value)} />
           </div>

           {pendingList.length > 0 && !selectedClassId && (
             <div className="space-y-6">
                <h4 className="text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] px-4 flex items-center gap-2"><ShieldAlert size={14} className="animate-bounce" /> Yêu cầu phê duyệt mới ({pendingList.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {pendingList.map(user => (
                     <MotionDiv key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[3rem] border border-rose-100 shadow-xl shadow-rose-50/50 flex flex-col justify-between group hover:border-rose-300 transition-all">
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{user.fullName.charAt(0)}</div>
                           <div className="overflow-hidden">
                              <h5 className="font-black text-slate-800 text-lg leading-tight truncate">{user.fullName}</h5>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.className || 'Chưa phân lớp'}</p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => approveUser(user.id)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl transition-all flex items-center justify-center gap-2"><CheckCircle2 size={16} /> DUYỆT VÀO LỚP</button>
                           <button onClick={() => deleteUser(user.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><UserMinus size={18} /></button>
                        </div>
                     </MotionDiv>
                   ))}
                </div>
             </div>
           )}

           <div className="space-y-6">
              <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] px-4">
                 {selectedClassId ? `Học sinh lớp: ${classes.find(c => c.id === selectedClassId)?.name}` : 'Toàn bộ học sinh đã duyệt'}
              </h4>
              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-50">
                       <tr>
                          <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
                          <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp đăng ký</th>
                          <th className="px-10 py-7 text-right"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {approvedList.length > 0 ? approvedList.map(user => (
                         <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">{user.fullName.charAt(0)}</div>
                                  <div><span className="font-bold text-slate-800 block text-sm">{user.fullName}</span><span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.email}</span></div>
                               </div>
                            </td>
                            <td className="px-10 py-6"><span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase border border-slate-200">{user.className || 'N/A'}</span></td>
                            <td className="px-10 py-6 text-right">
                               <button onClick={() => deleteUser(user.id)} className="p-3 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </td>
                         </tr>
                       )) : (
                         <tr><td colSpan={3} className="py-24 text-center"><Info className="mx-auto text-slate-100 mb-6" size={56} /><p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Hệ thống chưa ghi nhận học sinh trong danh sách này</p></td></tr>
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
