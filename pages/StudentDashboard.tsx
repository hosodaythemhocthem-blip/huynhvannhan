// pages/StudentDashboard.tsx
import React, { useState, useEffect } from "react";
import { User, Class, ClassEnrollment } from "../types";
import { supabase } from "../supabase";
import { useToast } from "../components/Toast";
import { 
  School, Key, Loader2, Clock, 
  CheckCircle2, ChevronRight, GraduationCap, Send
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
  const [loading, setLoading] = useState(true);
  
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMyClasses();
    }
  }, [user]);

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
      showToast("Không thể tải danh sách lớp học", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoining(true);
    try {
      const code = inviteCode.trim().toUpperCase();

      // 1. Tìm lớp học có mã code này
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (classError || !classData) {
        throw new Error("Mã lớp không tồn tại hoặc đã bị khóa!");
      }

      // 2. Tạo yêu cầu tham gia (Insert vào class_enrollments)
      const { error: enrollError } = await supabase
        .from('class_enrollments')
        .insert({
          class_id: classData.id,
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

      showToast(`Đã gửi yêu cầu tham gia lớp ${classData.name}!`, "success");
      setInviteCode("");
      await loadMyClasses(); // Tải lại danh sách
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
             {(user.full_name || 'H').charAt(0)}
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
        
        {/* CỘT TRÁI: FORM NHẬP MÃ LỚP */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-indigo-500 opacity-30">
                 <Key size={120} strokeWidth={1} />
              </div>
              
              <div className="relative z-10">
                 <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                    <School size={24} /> Xin vào lớp mới
                 </h3>
                 <p className="text-indigo-200 text-sm mb-6">
                    Nhập mã mời (6 ký tự) do giáo viên cung cấp để tham gia lớp học.
                 </p>
                 
                 <form onSubmit={handleJoinClass} className="space-y-4">
                    <div className="bg-indigo-700/50 p-2 rounded-2xl border border-indigo-500 focus-within:ring-2 focus-within:ring-white transition-all flex items-center">
                       <input 
                          type="text" 
                          placeholder="MÃ MỜI LỚP" 
                          required
                          maxLength={6}
                          className="w-full bg-transparent border-none outline-none font-black text-white text-center text-xl placeholder:text-indigo-400 tracking-[0.2em] uppercase" 
                          value={inviteCode} 
                          onChange={e => setInviteCode(e.target.value)} 
                       />
                    </div>
                    <button 
                      disabled={joining || !inviteCode}
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
                       <p className="text-sm text-slate-400 font-medium mb-6">Mã lớp: {enroll.target_class?.invite_code || '---'}</p>
                       
                       <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-bold text-sm">
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
                    Em hãy xin Mã mời (gồm 6 ký tự) từ giáo viên và nhập vào khung bên trái để bắt đầu nhé.
                 </p>
              </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
