// components/ClassManagement.tsx
import React, { useState, useEffect } from "react";
import { 
  Users, Trash2, CheckCircle2, Search, 
  Loader2, School, Plus, ListFilter, X, 
  ChevronRight, UserMinus, ShieldAlert, BadgeCheck
} from "lucide-react";
import { supabase } from "../supabase";
import { User, Class, ClassEnrollment } from "../types";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

// Định nghĩa Type kết hợp (Join) từ Database
type EnrollmentWithDetails = ClassEnrollment & {
  student: User;
  target_class: Class;
};

interface Props {
  user: User; // Thông tin giáo viên đang đăng nhập
}

const ClassManagement: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Tải danh sách các lớp của giáo viên này
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id) 
        .order('created_at', { ascending: false });
      
      if (classError) throw classError;
      setClasses(classData || []);

      if (classData && classData.length > 0) {
        const classIds = classData.map(c => c.id);

        // 2. Tải danh sách ghi danh (Enrollments)
        const { data: enrollmentData, error: enrollError } = await supabase
          .from('class_enrollments')
          .select(`
            *,
            student:student_id(*),
            target_class:class_id(*)
          `)
          .in('class_id', classIds)
          .order('created_at', { ascending: false });

        if (enrollError) throw enrollError;
        setEnrollments((enrollmentData as unknown as EnrollmentWithDetails[]) || []);
      } else {
        setEnrollments([]); 
      }

    } catch (err: any) {
      console.error("LỖI TẢI DỮ LIỆU:", err);
      showToast(`Lỗi tải data: ${err.message || err.details || "Không rõ"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsCreating(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase.from('classes').insert({ 
        name: newClassName.trim(),
        teacher_id: user.id, 
        invite_code: inviteCode,
        is_active: true
      });

      if (error) throw error;
      
      setNewClassName("");
      setShowCreateClass(false);
      showToast(`Đã tạo lớp "${newClassName}" thành công!`, "success");
      await loadAllData();
    } catch (err: any) {
      console.error("CHI TIẾT LỖI TẠO LỚP:", err);
      // Hiển thị LỖI TẬN GỐC ra màn hình
      showToast(`Lỗi tạo lớp: ${err.message || err.details || "Kiểm tra lại RLS hoặc Khóa ngoại"}`, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`CẢNH BÁO: Thầy có chắc muốn xóa lớp "${name}"?\nTất cả học sinh sẽ bị rời khỏi lớp này.`)) return;

    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      
      showToast(`Đã xóa lớp ${name}.`, "success");
      if (selectedClassId === id) setSelectedClassId(null);
      await loadAllData();
    } catch (err: any) {
      console.error("LỖI XÓA LỚP:", err);
      showToast(`Lỗi xóa lớp: ${err.message || "Không thể xóa"}`, "error");
    }
  };

  const approveEnrollment = async (enrollment: EnrollmentWithDetails) => {
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ 
            status: 'approved', 
            joined_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      if (error) throw error;
      
      showToast(`Đã duyệt ${enrollment.student.full_name} vào lớp ${enrollment.target_class.name}!`, "success");
      await loadAllData();
    } catch (err: any) {
      console.error("LỖI DUYỆT HS:", err);
      showToast(`Lỗi duyệt HS: ${err.message}`, "error");
    }
  };

  const removeOrRejectEnrollment = async (enrollmentId: string, studentName: string, isPending: boolean) => {
    const msg = isPending 
      ? `Từ chối yêu cầu vào lớp của ${studentName}?` 
      : `Đuổi em ${studentName} khỏi lớp? Hành động này không xóa tài khoản của em ấy.`;
      
    if (!window.confirm(msg)) return;
    
    try {
      const { error } = await supabase.from('class_enrollments').delete().eq('id', enrollmentId);
      if (error) throw error;
      
      showToast(isPending ? "Đã từ chối yêu cầu." : "Đã xóa học sinh khỏi lớp.", "info");
      await loadAllData();
    } catch (err: any) {
      console.error("LỖI XÓA HS:", err);
      showToast(`Lỗi xóa HS: ${err.message}`, "error");
    }
  };

  // --- BỘ LỌC DỮ LIỆU ---
  const filteredByClass = selectedClassId 
    ? enrollments.filter(e => e.class_id === selectedClassId)
    : enrollments;

  const searchedEnrollments = filteredByClass.filter(e => 
    (e.student?.full_name || "").toLowerCase().includes(search.toLowerCase()) || 
    (e.student?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingList = enrollments.filter(e => e.status === 'pending');
  const activeList = searchedEnrollments.filter(e => e.status === 'approved');

  const selectedClassData = classes.find(c => c.id === selectedClassId);
  const selectedClassName = selectedClassData?.name || null;

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
              {classes.length} Lớp • <span className="text-rose-500">{pendingList.length} Yêu cầu</span> • {enrollments.filter(e => e.status === 'approved').length} Học sinh
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
                  <button 
                    disabled={isCreating}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                      {isCreating ? <Loader2 size={18} className="animate-spin" /> : "XÁC NHẬN TẠO"}
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
                    className={`flex-1 flex flex-col justify-center p-4 rounded-2xl transition-all border ${selectedClassId === cls.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-3 font-bold text-sm w-full">
                        <School size={18} /> <span>{cls.name}</span>
                     </div>
                     <span className={`text-[10px] ml-7 mt-1 font-medium ${selectedClassId === cls.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        Mã mời: {cls.invite_code || '---'}
                     </span>
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

           {/* KHU VỰC DUYỆT HỌC SINH */}
           {pendingList.length > 0 && (
             <div className="bg-rose-50/50 border border-rose-100 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3 text-rose-600 px-2">
                   <ShieldAlert size={24} className="animate-pulse" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Cần Duyệt Gấp ({pendingList.length})</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {pendingList.map(enroll => (
                      <div key={enroll.id} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                               Xin vào lớp: {enroll.target_class?.name}
                            </span>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-rose-200">
                               {(enroll.student?.full_name || 'U').charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                               <h5 className="font-bold text-slate-800 truncate">{enroll.student?.full_name || 'Học sinh mới'}</h5>
                               <p className="text-xs text-slate-400 font-medium truncate">{enroll.student?.email}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 mt-auto">
                            <button onClick={() => approveEnrollment(enroll)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                               <CheckCircle2 size={16} /> Duyệt Ngay
                            </button>
                            <button onClick={() => removeOrRejectEnrollment(enroll.id, enroll.student?.full_name || 'Học sinh', true)} className="p-3 bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Từ chối">
                               <X size={18} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* DANH SÁCH LỚP HỌC CHÍNH THỨC */}
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
                       {activeList.length > 0 ? activeList.map(enroll => (
                          <tr key={enroll.id} className="group hover:bg-indigo-50/30 transition-all">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                      {(enroll.student?.full_name || 'U').charAt(0)}
                                   </div>
                                   <div>
                                      <span className="font-bold text-slate-800 block text-sm">{enroll.student?.full_name || 'Chưa cập nhật tên'}</span>
                                      <span className="text-[11px] text-slate-400 font-medium">{enroll.student?.email}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-white border border-slate-200 text-slate-600 shadow-sm">
                                   {enroll.target_class?.name || 'Lỗi dữ liệu'}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <button 
                                  onClick={() => removeOrRejectEnrollment(enroll.id, enroll.student?.full_name || 'Học sinh', false)} 
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Đuổi khỏi lớp"
                                >
                                   <UserMinus size={18} />
                                </button>
                             </td>
                          </tr>
                       )) : (
                          <tr>
                             <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-medium">
                                Không có học sinh nào trong danh sách này.
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
