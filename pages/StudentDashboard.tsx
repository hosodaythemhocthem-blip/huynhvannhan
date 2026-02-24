import React, { useState, useEffect } from "react";
import { User, Class, ClassEnrollment } from "../types";
import { supabase } from "../supabase";
import { useToast } from "../components/Toast";
import { 
  School, Loader2, Clock, 
  CheckCircle2, ChevronRight, GraduationCap, Send, ListPlus
} from "lucide-react";

// Định nghĩa Type kết hợp từ Database
type MyEnrollment = ClassEnrollment & {
  target_class: Class;
};

interface Props {
  user: User;
}

const StudentDashboard: React.FC<Props> = ({ user }) => {
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  
  // State mới để lưu danh sách TẤT CẢ các lớp cho học sinh chọn
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMyClasses();
      loadAllAvailableClasses(); // Gọi hàm lấy danh sách lớp
    }
  }, [user]);

  // Hàm lấy danh sách tất cả các lớp trên hệ thống
  const loadAllAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllClasses(data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách lớp:", err);
    }
  };

  const loadMyClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          *,
          target_class:class_id(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnrollments((data as unknown as MyEnrollment[]) || []);
    } catch (err: any) {
      console.error(err);
      showToast("Không thể tải danh sách lớp học của bạn", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      showToast("Vui lòng chọn một lớp học!", "warning");
      return;
    }

    setJoining(true);
    try {
      // Chỉ cần Insert trực tiếp class_id mà học sinh đã chọn
      const { error: enrollError } = await supabase
        .from('class_enrollments')
        .insert({
          class_id: selectedClassId,
          student_id: user.id,
          status: 'pending' // Mặc định là chờ giáo viên duyệt
        });

      if (enrollError) {
        // Lỗi 23505 là mã lỗi của Postgres khi vi phạm Unique (đã xin vào rồi)
        if (enrollError.code === '23505') {
          throw new Error("Em đã gửi yêu cầu vào lớp này rồi, vui lòng đợi thầy cô duyệt nhé!");
        }
        throw enrollError;
      }

      const joinedClass = allClasses.find(c => c.id === selectedClassId);
      showToast(`Đã gửi yêu cầu tham gia lớp ${joinedClass?.name}!`, "success");
      
      setSelectedClassId(""); // Reset lại lựa chọn
      await loadMyClasses(); // Tải lại danh sách lớp của học sinh
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi tham gia lớp", "error");
    } finally {
      setJoining(false);
    }
  };

  const pendingList = enrollments.filter(e => e.status === 'pending');
  const activeList = enrollments.filter(e => e.status === 'approved');

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu học tập...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      
      {/* HEADER & THÔNG TIN HỌC SINH */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl text-white font-black text-2xl">
             {(user.full_name || 'H').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Xin chào, {user.full_name} 👋</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
               Học sinh • {user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: FORM CHỌN LỚP */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-indigo-500 opacity-30">
                 <ListPlus size={120} strokeWidth={1} />
              </div>
              
              <div className="relative z-10">
                 <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                    <School size={24} /> Chọn lớp tham gia
                 </h3>
                 <p className="text-indigo-200 text-sm mb-6">
                    Lựa chọn lớp học em muốn tham gia từ danh sách bên dưới.
                 </p>
                 
                 <form onSubmit={handleJoinClass} className="space-y-4">
                    <div className="bg-indigo-700/50 p-2 rounded-2xl border border-indigo-500 focus-within:ring-2 focus-within:ring-white transition-all flex items-center">
                       {/* THAY INPUT BẰNG SELECT DROPDOWN */}
                       <select 
                          required
                          className="w-full bg-transparent border-none outline-none font-bold text-white text-base cursor-pointer appearance-none px-2 py-1" 
                          value={selectedClassId} 
                          onChange={e => setSelectedClassId(e.target.value)}
                       >
                          <option value="" className="text-slate-800">-- Bấm để chọn lớp học --</option>
                          {allClasses.map(cls => (
                             <option key={cls.id} value={cls.id} className="text-slate-800">
                                {cls.name}
                             </option>
                          ))}
                       </select>
                    </div>
                    <button 
                      disabled={joining || !selectedClassId}
                      className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {joining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        GỬI YÊU CẦU
                    </button>
                 </form>
              </div>
           </div>

           {/* HIỂN THỊ CÁC LỚP ĐANG CHỜ DUYỆT */}
           {pendingList.length > 0 && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                 <h4 className="font-black text-amber-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={18} /> Đang chờ duyệt ({pendingList.length})
                 </h4>
                 <div className="space-y-3">
                    {pendingList.map(enroll => (
                       <div key={enroll.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
                          <span className="font-bold text-slate-700 truncate pr-2">
                             Lớp: {enroll.target_class?.name || '---'}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-md font-black uppercase whitespace-nowrap">
                             Đang xử lý
                          </span>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </aside>

        {/* CỘT PHẢI: DANH SÁCH LỚP CHÍNH THỨC */}
        <main className="lg:col-span-8 space-y-6">
           <div className="flex items-center gap-3 mb-6 px-2">
              <GraduationCap className="text-slate-400" size={28} />
              <h3 className="text-xl font-black text-slate-800">Lớp học của tôi</h3>
           </div>

           {activeList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {activeList.map(enroll => (
                    <div key={enroll.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group cursor-pointer flex flex-col h-full">
                       <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                             <School size={24} />
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full uppercase">
                             <CheckCircle2 size={12} /> Đã duyệt
                          </span>
                       </div>
                       
                       <h4 className="font-black text-xl text-slate-800 mb-1">{enroll.target_class?.name || 'Lớp ẩn danh'}</h4>
                       
                       <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-bold text-sm">
                          <span>Vào không gian lớp</span>
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <School size={40} />
                 </div>
                 <h4 className="text-lg font-black text-slate-700 mb-2">Chưa tham gia lớp nào</h4>
                 <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Em hãy chọn một lớp học ở khung bên trái và gửi yêu cầu tham gia để bắt đầu nhé.
                 </p>
              </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
