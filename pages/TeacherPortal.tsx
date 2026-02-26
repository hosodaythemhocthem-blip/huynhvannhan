import React, { useEffect, useState } from "react";
import { User, Exam } from "../types";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Trash2,
  Plus,
  Search,
  FileText,
  Users,
  Clock,
  Edit3,
  BarChart3,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

// GỌI CÁC COMPONENT CẦN THIẾT
import ImportExamFromFile from "../components/ImportExamFromFile";
import ExamEditor from "../components/ExamEditor";
import ClassManagement from "../components/ClassManagement";

interface Props {
  user: User;
  activeTab: string;
}

const TeacherPortal: React.FC<Props> = ({ user, activeTab }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // STATE QUẢN LÝ MODAL AI VÀ EDITOR
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [parsedExamData, setParsedExamData] = useState<any>(null);

  // STATE QUẢN LÝ MODAL GIAO BÀI
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (activeTab === "exams" || activeTab === "dashboard") {
      loadExams();
    }
  }, [user.id, activeTab]);

  const loadExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setExams(data as Exam[]);
    }
    setLoading(false);
  };

  const createExam = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title: "Đề thi mới (Chưa đặt tên)",
          teacher_id: user.id,
          description: "",
          is_locked: false,
          is_archived: false,
          total_points: 10,
          version: 1,
          duration: 45,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        alert(`Không thể tạo đề thi. Lỗi: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data) {
        alert("Tạo đề thi nháp thành công!"); 
        await loadExams(); 
      }
    } catch (err) {
      alert("Đã xảy ra lỗi không xác định!");
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm("Thầy có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) return;
    await supabase.from("exams").delete().eq("id", id);
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const openEditor = (exam: Exam | null = null) => {
    setEditingExam(exam);
    setParsedExamData(null);
    setIsEditorOpen(true);
  };

  const handleImportSuccess = (aiData: any) => {
    setParsedExamData(aiData);
    setIsImportModalOpen(false);
    setEditingExam(null);
    setIsEditorOpen(true);
  };

  // --- HÀM MỞ MODAL GIAO ĐỀ ---
  const handleAssignExam = (exam: Exam) => {
    setAssigningExam(exam);
    setSelectedClass(""); // Reset form
    setDeadline("");      // Reset form
  };

  // --- HÀM XÁC NHẬN GIAO ĐỀ (GỬI LÊN DATABASE) ---
  const confirmAssign = () => {
    if (!selectedClass) {
      alert("⚠️ Thầy vui lòng chọn lớp để giao bài nhé!");
      return;
    }
    if (!deadline) {
      alert("⚠️ Thầy vui lòng đặt hạn nộp bài nhé!");
      return;
    }

    // TẠM THỜI HIỂN THỊ THÔNG BÁO THÀNH CÔNG (Sau này sẽ gọi hàm Insert vào DB ở đây)
    alert(`🎉 Đã giao đề "${assigningExam?.title}" thành công!\nLớp nhận: ${selectedClass}\nHạn nộp: ${new Date(deadline).toLocaleString('vi-VN')}`);
    
    // Đóng Modal
    setAssigningExam(null);
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isEditorOpen) {
    return (
      <ExamEditor 
        user={user}
        exam={editingExam} 
        aiGeneratedData={parsedExamData}
        onClose={() => { 
          setIsEditorOpen(false); 
          setParsedExamData(null);
          loadExams(); 
        }} 
      />
    );
  }

  const renderExamDashboard = () => (
    <div className="p-8">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 mb-2">
              Xin chào, {user?.full_name || "Thầy cô"} 👋 
            </h1>
            <p className="text-slate-500">Quản lý kho đề thi và lớp học của thầy.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="group px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm transition-all flex items-center gap-2 font-semibold"
            >
              <Sparkles size={20} className="text-indigo-500" />
              Tạo bằng AI (File)
            </button>
            <button
              onClick={createExam}
              className="group px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 font-semibold"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Tạo thủ công
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng số đề thi</p>
              <h3 className="text-2xl font-bold text-slate-800">{exams.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Học sinh hoạt động</p>
              <h3 className="text-2xl font-bold text-slate-800">--</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Lượt làm bài tuần này</p>
              <h3 className="text-2xl font-bold text-slate-800">--</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi theo tên..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
              <FileText className="text-slate-300 w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">Chưa có đề thi nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((e) => (
              <div
                key={e.id}
                className="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div className="flex gap-1">
                    
                    {/* --- NÚT GIAO ĐỀ --- */}
                    <button 
                      onClick={() => handleAssignExam(e)}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors z-10 relative"
                      title="Giao đề cho lớp"
                    >
                      <Send size={18} />
                    </button>

                    <button 
                      onClick={() => openEditor(e)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors z-10 relative"
                      title="Chỉnh sửa"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteExam(e.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors z-10 relative"
                      title="Xóa đề"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                  {e.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                  {e.description || "Chưa có mô tả cho đề thi này."}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t pt-4">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {e.updated_at ? new Date(e.updated_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                  </div>
                  <div className="ml-auto font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                    v{e.version}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "classes":
        return <div className="p-8"><ClassManagement user={user} /></div>; 
      case "dashboard":
      case "exams":
      default:
        return renderExamDashboard(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {renderContent()}

      <ImportExamFromFile
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* --- MODAL GIAO BÀI CHO LỚP --- */}
      {assigningExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Lớp nền đen mờ */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setAssigningExam(null)}
          ></div>

          {/* Nội dung Modal */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 relative">
              <button 
                onClick={() => setAssigningExam(null)} 
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Giao Bài Thi</h2>
              <p className="text-emerald-50 text-sm line-clamp-1 opacity-90">Đề: {assigningExam.title}</p>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-5 bg-slate-50">
              {/* Chọn Lớp */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Users size={16} className="text-indigo-500"/> Chọn Lớp Nhận Đề
                </label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                >
                  <option value="" disabled>-- Vui lòng chọn lớp --</option>
                  <option value="Lớp 10A1">Lớp 10A1 - Toán Cơ Bản</option>
                  <option value="Lớp 10A2">Lớp 10A2 - Toán Nâng Cao</option>
                  <option value="Lớp 11B1">Lớp 11B1 - Luyện Thi</option>
                  <option value="Tất cả các lớp">Giao cho tất cả các lớp đang quản lý</option>
                </select>
              </div>

              {/* Hạn Nộp */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <CalendarDays size={16} className="text-amber-500"/> Hạn chót nộp bài (Deadline)
                </label>
                <input 
                  type="datetime-local" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setAssigningExam(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy Bỏ
              </button>
              <button 
                onClick={confirmAssign}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95"
              >
                Phát Đề Ngay 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
