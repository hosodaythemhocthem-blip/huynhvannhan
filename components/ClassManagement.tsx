
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  UserCheck,
  Flag,
  KeyRound,
  X,
  Lock,
  Save,
  Download,
  AlertCircle,
  UploadCloud,
  Loader2,
  UserMinus,
  Check
} from 'lucide-react';
import { Class, StudentAccount, TeacherAccount } from '../types';

interface ClassManagementProps {
  teacher: TeacherAccount;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ teacher }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [view, setView] = useState<'students' | 'requests'>('students');

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentAccount | null>(null);
  const [newStudentPass, setNewStudentPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedClasses = JSON.parse(localStorage.getItem(`classes_${teacher.username}`) || '[]');
    setClasses(savedClasses);

    const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    setStudents(allStudents.filter(s => s.teacherUsername === teacher.username));
  }, [teacher.username]);

  const saveAllData = (updatedClasses: Class[], updatedStudents: StudentAccount[]) => {
    setClasses(updatedClasses);
    setStudents(updatedStudents.filter(s => s.teacherUsername === teacher.username));
    localStorage.setItem(`classes_${teacher.username}`, JSON.stringify(updatedClasses));
    localStorage.setItem('student_accounts', JSON.stringify(updatedStudents));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: Class = {
      id: `C${Date.now().toString().slice(-6)}`,
      name: newClassName,
      studentCount: 0
    };
    const updated = [...classes, newClass];
    saveAllData(updated, JSON.parse(localStorage.getItem('student_accounts') || '[]'));
    setNewClassName('');
    setIsAddingClass(false);
  };

  const handleDeleteClass = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA lớp này? Học sinh trong lớp sẽ được chuyển về trạng thái chờ duyệt.")) return;
    
    const updatedClasses = classes.filter(c => c.id !== id);
    const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    const updatedStudents = allStudents.map(s => {
      if (s.classId === id) return { ...s, classId: 'pending', status: 'PENDING' as const };
      return s;
    });

    saveAllData(updatedClasses, updatedStudents);
    if (selectedClassId === id) setSelectedClassId(null);
  };

  const handleDeleteStudent = (username: string) => {
    if (!window.confirm("XÓA hoàn toàn tài khoản học sinh này và mọi dữ liệu liên quan? Thao tác không thể hoàn tác.")) return;
    
    const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    const studentToDelete = allStudents.find(s => s.username === username);
    const updatedStudents = allStudents.filter(s => s.username !== username);

    let updatedClasses = [...classes];
    if (studentToDelete && studentToDelete.classId !== 'pending') {
      updatedClasses = classes.map(c => 
        c.id === studentToDelete.classId ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c
      );
    }

    const allGrades = JSON.parse(localStorage.getItem('grades') || '[]');
    const updatedGrades = allGrades.filter((g: any) => g.studentName !== studentToDelete?.name);
    localStorage.setItem('grades', JSON.stringify(updatedGrades));

    saveAllData(updatedClasses, updatedStudents);
  };

  const handleApproveStudent = (username: string, targetClassId: string) => {
    if (!targetClassId) {
      alert('Vui lòng chọn lớp để xếp cho học sinh trước khi duyệt.');
      return;
    }
    const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    const updatedStudents = allStudents.map(s => {
      if (s.username === username) return { ...s, status: 'APPROVED' as const, classId: targetClassId };
      return s;
    });
    
    const updatedClasses = classes.map(c => c.id === targetClassId ? { ...c, studentCount: c.studentCount + 1 } : c);
    saveAllData(updatedClasses, updatedStudents);
  };

  const handleRejectStudent = (username: string) => {
    if (!window.confirm('Từ chối yêu cầu đăng ký của học sinh này?')) return;
    const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
    const updatedStudents = allStudents.filter(s => s.username !== username);
    saveAllData(classes, updatedStudents);
  };

  const downloadTemplate = () => {
    // Header CSV với BOM để hiển thị đúng tiếng Việt trong Excel
    const headers = "Họ và Tên,Tên đăng nhập,Mật khẩu\n";
    const exampleRows = "Nguyễn Văn A,nguyenvana,123456\nTrần Thị B,tranthib,123456";
    const csvContent = "\uFEFF" + headers + exampleRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mau_nhap_hoc_sinh_${selectedClass?.name || 'lop'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const previewData = [];
      
      // Bỏ qua dòng tiêu đề
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Xử lý cả dấu phẩy và dấu chấm phẩy (tùy khu vực Excel)
        const parts = line.includes(';') ? line.split(';') : line.split(',');
        if (parts.length >= 3) {
          previewData.push({
            name: parts[0].replace(/"/g, '').trim(),
            username: parts[1].replace(/"/g, '').trim(),
            password: parts[2].replace(/"/g, '').trim()
          });
        }
      }
      
      if (previewData.length > 0) {
        setBulkPreview(previewData);
        setIsBulkModalOpen(true);
      } else {
        alert("File không đúng định dạng hoặc không có dữ liệu học sinh!");
      }
      // Reset input để có thể chọn lại cùng file
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmBulkAdd = () => {
    if (!selectedClassId) return;
    setIsProcessing(true);

    setTimeout(() => {
      const allStudents: StudentAccount[] = JSON.parse(localStorage.getItem('student_accounts') || '[]');
      const newAccounts: StudentAccount[] = bulkPreview.map(item => ({
        username: item.username,
        password: item.password || '123456',
        name: item.name,
        classId: selectedClassId,
        status: 'APPROVED',
        createdAt: new Date().toLocaleDateString('vi-VN'),
        teacherUsername: teacher.username
      }));

      // Lọc bỏ những username đã tồn tại
      const filteredNew = newAccounts.filter(na => !allStudents.some(as => as.username === na.username));
      const updatedAll = [...allStudents, ...filteredNew];
      const updatedClasses = classes.map(c => c.id === selectedClassId ? { ...c, studentCount: c.studentCount + filteredNew.length } : c);

      saveAllData(updatedClasses, updatedAll);
      setIsProcessing(false);
      setIsBulkModalOpen(false);
      setBulkPreview([]);
      alert(`Đã nhập thành công ${filteredNew.length} học sinh mới vào lớp.`);
    }, 800);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.classId === selectedClassId && s.status === 'APPROVED');
  const pendingStudents = students.filter(s => s.status === 'PENDING');

  const [approvalSelections, setApprovalSelections] = useState<Record<string, string>>({});

  return (
    <div className="flex gap-6 h-[700px] animate-in fade-in duration-300">
      <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Danh sách Lớp</h3>
          <button 
            onClick={() => setIsAddingClass(true)}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isAddingClass && (
            <div className="p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/30 space-y-3 animate-in slide-in-from-top-2">
              <input 
                autoFocus
                type="text" 
                placeholder="Tên lớp (VD: 9A1)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAddingClass(false)} className="px-3 py-1 text-xs font-bold text-slate-400">Hủy</button>
                <button onClick={handleAddClass} className="px-5 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg">LƯU</button>
              </div>
            </div>
          )}

          {classes.map((cls) => (
            <div key={cls.id} className="group relative">
              <button
                onClick={() => { setSelectedClassId(cls.id); setView('students'); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  selectedClassId === cls.id && view === 'students'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                    : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedClassId === cls.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="font-black text-sm">{cls.name}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{cls.studentCount} Học sinh</div>
                  </div>
                </div>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-orange-50/50">
           <button 
             onClick={() => { setSelectedClassId(null); setView('requests'); }}
             className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${view === 'requests' ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-100'}`}
           >
             <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                <UserCheck size={16} /> Yêu cầu duyệt
             </div>
             {pendingStudents.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white">{pendingStudents.length}</span>}
           </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {view === 'requests' ? (
          <div className="flex flex-col h-full">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
               <div>
                 <h2 className="text-2xl font-black text-slate-800 italic">Duyệt Đăng Ký</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Tổng cộng: {pendingStudents.length} học sinh</p>
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
                {pendingStudents.map(student => (
                  <div key={student.username} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-800">{student.name}</div>
                          <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Khối: {student.requestedClassName}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <select 
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black outline-none"
                          value={approvalSelections[student.username] || ''}
                          onChange={(e) => setApprovalSelections({...approvalSelections, [student.username]: e.target.value})}
                        >
                          <option value="">-- Xếp lớp --</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => handleApproveStudent(student.username, approvalSelections[student.username])} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><CheckCircle size={18} /></button>
                        <button onClick={() => handleRejectStudent(student.username)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                     </div>
                  </div>
                ))}
                {pendingStudents.length === 0 && <div className="py-20 text-center text-slate-300 font-black italic">Không có yêu cầu chờ duyệt</div>}
             </div>
          </div>
        ) : selectedClassId ? (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <div>
                <h2 className="text-2xl font-black text-slate-800 italic">Lớp {selectedClass?.name}</h2>
                <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{classStudents.length} Học sinh thành viên</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                  title="Tải file mẫu nhập học sinh"
                >
                  <Download size={16} /> File mẫu
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                  <FileSpreadsheet size={16} /> Nhập Excel
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classStudents.map(student => (
                    <div key={student.username} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all group border-l-4 border-l-blue-500">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                           {student.name.charAt(0)}
                         </div>
                         <div>
                           <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                           <div className="text-[10px] text-slate-400 font-bold italic">@{student.username}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => handleDeleteStudent(student.username)} className="p-2 text-red-300 hover:text-red-500" title="Xóa tài khoản học sinh"><UserMinus size={18} /></button>
                         <button className="p-2 text-slate-300 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                      </div>
                    </div>
                  ))}
                  {classStudents.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 italic">Lớp chưa có học sinh</div>}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Users size={64} className="opacity-10 mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-xs">Chọn lớp hoặc danh sách duyệt</p>
          </div>
        )}
      </div>

      {/* Bulk Preview Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="p-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                       <FileSpreadsheet size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800">Xem trước danh sách học sinh</h3>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Phát hiện: {bulkPreview.length} học sinh trong file</p>
                    </div>
                 </div>

                 <div className="max-h-[400px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-slate-50/30">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 sticky top-0">
                          <tr>
                             <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ tên</th>
                             <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</th>
                             <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {bulkPreview.map((item, idx) => (
                             <tr key={idx} className="bg-white">
                                <td className="px-5 py-3 text-sm font-bold text-slate-700 italic">{item.name}</td>
                                <td className="px-5 py-3 text-sm text-slate-500">{item.username}</td>
                                <td className="px-5 py-3 text-sm text-slate-400">••••••</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => setIsBulkModalOpen(false)}
                      className="flex-1 py-4.5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={confirmBulkAdd}
                      disabled={isProcessing}
                      className="flex-1 py-4.5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      {isProcessing ? 'Đang nhập...' : 'Xác nhận Nhập ngay'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
