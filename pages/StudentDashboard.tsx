import React, { useState, useEffect } from "react";
import { User, Class, ClassEnrollment } from "../types";
import { supabase } from "../supabase";
import { useToast } from "../components/Toast";
import { 
  School, Loader2, Clock, 
  CheckCircle2, ChevronRight, GraduationCap, Send, ListPlus, BookOpen, Calendar, Timer, Play
} from "lucide-react";

// Định nghĩa Type kết hợp từ Database
type MyEnrollment = ClassEnrollment & {
  target_class: Class;
};

interface Props {
  user: User;
  onTabChange?: (tab: string) => void; 
}

const StudentDashboard: React.FC<Props> = ({ user, onTabChange }) => {
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // 🚀 STATE MỚI ĐỂ LƯU BÀI TẬP ĐƯỢC GIAO
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    loadMyClasses();
    loadAllAvailableClasses();

    // 🚀 THÊM REALTIME: Lắng nghe trạng thái duyệt lớp
    const enrollmentSubscription = supabase
      .channel('public:class_enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_enrollments',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Có cập nhật trạng thái lớp học!', payload);
          loadMyClasses();
          
          if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
            showToast("Thầy/Cô giáo vừa duyệt cho em vào lớp!", "success");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentSubscription);
    };
  }, [user]);

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
      
      const myEnrollments = (data as unknown as MyEnrollment[]) || [];
      setEnrollments(myEnrollments);

      // 🚀 NẾU CÓ LỚP ĐÃ DUYỆT -> TẢI BÀI TẬP CỦA CÁC LỚP ĐÓ
      const approvedClasses = myEnrollments.filter(e => e.status === 'approved');
      if (approvedClasses.length > 0) {
        const classIds = approvedClasses.map(c => c.class_id);
        loadAssignments(classIds);
      } else {
        setAssignments([]);
      }

    } catch (err: any) {
      console.error(err);
      showToast("Không thể tải danh sách lớp học của bạn", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 HÀM ĐÃ ĐƯỢC THÊM CONSOLE.LOG ĐỂ BẮT BỆNH
  const loadAssignments = async (classIds: string[]) => {
    console.log("👉 1. Đang tìm bài tập cho các lớp có ID là:", classIds);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          due_date,
          class_id,
          classes (name),
          exam:exams (id, title, duration, total_points)
        `)
        .in('class_id', classIds)
        .order('due_date', { ascending: true });

      console.log("👉 2. Kết quả Supabase trả về:", data);
      
      if (error) {
        console.error("❌ 3. Lỗi từ Supabase:", error);
        throw error;
      }
      
      setAssignments(data || []);
    } catch (err) {
      console.error("Lỗi tải bài tập:", err);
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
      const { error: enrollError } = await supabase
        .from('class_enrollments')
        .insert({
          class_id: selectedClassId,
          student_id: user.id,
          status: 'pending' 
        });

      if (enrollError) {
        if (enrollError.code === '23505') {
          throw new Error("Em đã gửi yêu cầu vào lớp này rồi, vui lòng đợi thầy cô duyệt nhé!");
        }
        throw enrollError;
      }

      const joinedClass = allClasses.find(c => c.id === selectedClassId);
      showToast(`Đã gửi yêu cầu tham gia lớp ${joinedClass?.name}!`, "success");
      
      setSelectedClassId(""); 
      await loadMyClasses(); 
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi khi tham gia lớp", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleGoToClass = (classId: string) => {
    if (onTabChange) {
      localStorage.setItem('lms_current_class_id', classId);
      onTabChange("exams"); 
    }
  };

  const handleDoExam = (examId: string) => {
    if (onTabChange) {
      // Lưu lại ID đề thi muốn làm để trang Exams biết mà mở lên
      localStorage.setItem('lms_active_exam_id', examId);
      onTabChange("exams"); // Chuyển sang tab làm bài
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
                 <p className="text-indigo-200 text-sm mb-6">Lựa chọn lớp học em muốn tham gia từ danh sách bên dưới.</p>
                 <form onSubmit={handleJoinClass} className="space-y-4">
                    <div className="bg-indigo-700/50 p-2 rounded-2xl border border-indigo-500 focus-within:ring-2 focus-within:ring-white transition-all flex items-center">
                       <select 
                          required
                          className="w-full bg-transparent border-none outline-none font-bold text-white text-base cursor-pointer appearance-none px-2 py-1" 
                          value={selectedClassId} 
                          onChange={e => setSelectedClassId(e.target.value)}
                       >
                          <option value="" className="text-slate-800">-- Bấm để chọn lớp học --</option>
                          {allClasses.map(cls => (
                             <option key={cls.id} value={cls.id} className="text-slate-800">{cls.name}</option>
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

           {pendingList.length > 0 && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                 <h4 className="font-black text-amber-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={18} /> Đang chờ duyệt ({pendingList.length})
                 </h4>
                 <div className="space-y-3">
                    {pendingList.map(enroll => (
                       <div key={enroll.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
                          <span className="font-bold text-slate-700 truncate pr-2">Lớp: {enroll.target_class?.name || '---'}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-md font-black uppercase whitespace-nowrap">Đang xử lý</span>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </aside>

        {/* CỘT PHẢI: DANH SÁCH LỚP CHÍNH THỨC & BÀI TẬP */}
        <main className="lg:col-span-8 space-y-10">
           
           {/* PHẦN 1: BÀI TẬP MỚI ĐƯỢC GIAO */}
           <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                 <BookOpen className="text-rose-500" size={28} />
                 <h3 className="text-xl font-black text-slate-800">Bài tập cần làm ({assignments.length})</h3>
              </div>

              {assignments.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4">
                    {assignments.map(task => (
                       <div key={task.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md hover:border-rose-100 transition-all group">
                          <div className="flex items-center gap-5 w-full">
                             <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Timer size={24} />
                             </div>
                             <div>
                                <h4 className="font-black text-lg text-slate-800 group-hover:text-rose-600 transition-colors">
                                   {task.exam?.title || "Bài tập chưa có tên"}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                                   <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                      <School size={12}/> {task.classes?.name}
                                   </span>
                                   <span className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded-md">
                                      <Calendar size={12}/> Hạn nộp: {new Date(task.due_date).toLocaleString('vi-VN')}
                                   </span>
                                   <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                                      Thời gian: {task.exam?.duration} phút
                                   </span>
                                </div>
                             </div>
                          </div>
                          
                          <button 
                             onClick={() => handleDoExam(task.exam?.id)}
                             className="w-full sm:w-auto flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                             <Play size={16} /> Làm Bài
                          </button>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                    <p className="text-slate-500 font-medium">Hiện tại chưa có bài tập nào cần làm. Tuyệt vời! 🎉</p>
                 </div>
              )}
           </section>

           {/* PHẦN 2: LỚP HỌC CỦA TÔI */}
           <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                 <GraduationCap className="text-emerald-500" size={28} />
                 <h3 className="text-xl font-black text-slate-800">Lớp học của tôi</h3>
              </div>

              {activeList.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {activeList.map(enroll => (
                       <div 
                         key={enroll.id} 
                         onClick={() => handleGoToClass(enroll.class_id)}
                         className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all group cursor-pointer flex flex-col h-full"
                       >
                          <div className="flex items-start justify-between mb-4">
                             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <School size={24} />
                             </div>
                             <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full uppercase">
                                <CheckCircle2 size={12} /> Đã duyệt
                             </span>
                          </div>
                          
                          <h4 className="font-black text-xl text-slate-800 mb-1">{enroll.target_class?.name || 'Lớp ẩn danh'}</h4>
                          
                          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-emerald-600 font-bold text-sm">
                             <span>Vào không gian lớp</span>
                             <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[200px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                       <School size={32} />
                    </div>
                    <h4 className="text-lg font-black text-slate-700 mb-2">Chưa tham gia lớp nào</h4>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                       Em hãy chọn một lớp học ở khung bên trái và gửi yêu cầu tham gia nhé.
                    </p>
                 </div>
              )}
           </section>

        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
