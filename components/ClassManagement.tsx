import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Users, 
  GraduationCap, 
  Search, 
  X, 
  Loader2 
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../services/firebase";
import { subscribeToClasses } from "../services/dataServices";
import { ClassItem } from "../types";

/* =========================
   COMPONENT
========================= */
const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Data Realtime
  useEffect(() => {
    const unsubscribe = subscribeToClasses((data) => {
      setClasses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "classes"), {
        name: newClassName,
        grade: newClassGrade,
        teacher: "Huỳnh Văn Nhẫn", // Mặc định hoặc lấy từ Auth Context
        studentCount: 0,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewClassName("");
      setNewClassGrade("12");
    } catch (error) {
      alert("Lỗi khi thêm lớp: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Bạn có chắc chắn muốn xóa lớp này? Dữ liệu học sinh trong lớp có thể bị ảnh hưởng.")) return;
    try {
      await deleteDoc(doc(db, "classes", id));
    } catch (error) {
      alert("Không thể xóa lớp: " + error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="text-indigo-600" /> Quản lý Lớp học
          </h2>
          <p className="text-sm text-slate-500 font-medium">Danh sách các lớp đang hoạt động trên hệ thống</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên lớp..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus size={18} /> Thêm lớp
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên lớp</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Khối</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Giáo viên</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Sĩ số</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">
                    Không tìm thấy lớp học nào.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{c.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ID: {c.id.slice(0, 6)}...</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-black border border-slate-200">
                        {c.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {c.teacher}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                        <Users size={14} /> {c.studentCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        title="Xóa lớp"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ADD CLASS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Tạo lớp học mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên lớp</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="VD: 12A1 - Luyện thi ĐH"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khối</label>
                <div className="grid grid-cols-3 gap-3">
                  {["10", "11", "12"].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNewClassGrade(g)}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                        newClassGrade === g 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                          : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !newClassName.trim()}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                {isSubmitting ? "Đang tạo..." : "Xác nhận tạo lớp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
