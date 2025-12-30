
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Plus, LogOut, Users, BarChart, Gamepad2, User, GraduationCap, Briefcase, Settings, UserCircle, FileText, Cloud, CloudOff, Loader2
} from 'lucide-react';
import { TabType, Exam, UserRole, TeacherAccount, StudentAccount, Class, Grade } from './types';
import ExamCard from './components/ExamCard';
import ExamEditor from './components/ExamEditor';
import LoginScreen from './components/LoginScreen';
import ClassManagement from './components/ClassManagement';
import GradeManagement from './components/GradeManagement';
import GameManagement from './components/GameManagement';
import StudentQuiz from './components/StudentQuiz';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { SyncService } from './services/syncService';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('current_role') as UserRole) || UserRole.GUEST);
  const [teacher, setTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('current_teacher');
    return saved ? JSON.parse(saved) : null;
  });
  const [student, setStudent] = useState<StudentAccount | null>(() => {
    const saved = localStorage.getItem('current_student');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<TabType>(TabType.EXAMS);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'standard' | 'thpt'>('standard');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [previewingExam, setPreviewingExam] = useState<Exam | null>(null);
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null); 
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const displayName = student?.name || teacher?.name || 'Người dùng';

  const loadLocalData = useCallback(() => {
    const user = teacher || student;
    if (user) {
      const savedClasses = JSON.parse(localStorage.getItem(`classes_${user.username}`) || '[]');
      setClasses(savedClasses);
      if (teacher) {
        const savedExams = JSON.parse(localStorage.getItem(`exams_${teacher.username}`) || '[]');
        setExams(savedExams);
      }
      if (student) {
        const teacherExams = JSON.parse(localStorage.getItem(`exams_${student.teacherUsername}`) || '[]');
        setExams(teacherExams);
      }
    }
  }, [teacher, student]);

  const syncToCloud = useCallback(async () => {
    const user = teacher || student;
    if (!user) return;

    setSyncStatus('syncing');
    const syncId = SyncService.generateSyncId(user.username);
    
    const dataToSync = {
      exams: teacher ? JSON.parse(localStorage.getItem(`exams_${user.username}`) || '[]') : [],
      classes: teacher ? JSON.parse(localStorage.getItem(`classes_${user.username}`) || '[]') : [],
      grades: JSON.parse(localStorage.getItem('grades') || '[]'),
      student_accounts: JSON.parse(localStorage.getItem('student_accounts') || '[]'),
      lastSync: new Date().toISOString()
    };

    const success = await SyncService.pushData(syncId, dataToSync);
    setSyncStatus(success ? 'synced' : 'error');
  }, [teacher, student]);

  useEffect(() => {
    loadLocalData();
    window.addEventListener('storage', loadLocalData);
    return () => window.removeEventListener('storage', loadLocalData);
  }, [loadLocalData]);

  const handleSaveExam = async (data: Partial<Exam>) => {
    if (!teacher) return;
    let updatedExams: Exam[];
    if (editingExam) {
      updatedExams = exams.map(e => e.id === editingExam.id ? { ...e, ...data } as Exam : e);
    } else {
      const newExam = { 
        ...data, 
        id: `TN${Date.now().toString().slice(-4)}`, 
        createdAt: new Date().toLocaleDateString('vi-VN'),
        questionCount: data.questions?.length || 0,
        isLocked: false,
        assignedClassIds: []
      } as Exam;
      updatedExams = [newExam, ...exams];
    }
    setExams(updatedExams);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updatedExams));
    setIsEditorOpen(false);
    await syncToCloud();
  };

  const handleDeleteExam = async (id: string) => {
    if (!teacher || !window.confirm("Xóa đề thi này?")) return;
    const updatedExams = exams.filter(e => e.id !== id);
    setExams(updatedExams);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updatedExams));
    await syncToCloud();
  };

  const handleSelectRole = (role: UserRole, data?: any) => {
    setUserRole(role);
    localStorage.setItem('current_role', role);
    if (role === UserRole.TEACHER && data) {
      setTeacher(data);
      localStorage.setItem('current_teacher', JSON.stringify(data));
    }
    if (role === UserRole.STUDENT && data) {
      setStudent(data);
      localStorage.setItem('current_student', JSON.stringify(data));
    }
  };

  const handleLogout = () => {
    setUserRole(UserRole.GUEST);
    setTeacher(null);
    setStudent(null);
    localStorage.removeItem('current_role');
    localStorage.removeItem('current_teacher');
    localStorage.removeItem('current_student');
  };

  if (userRole === UserRole.GUEST) return <LoginScreen onSelectRole={handleSelectRole} />;
  if (userRole === UserRole.ADMIN) return <AdminDashboard onLogout={handleLogout} />;
  if (previewingExam) return <StudentQuiz studentName={displayName} exam={previewingExam} onFinish={() => {}} onExit={() => setPreviewingExam(null)} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner relative">
            <UserCircle size={32} />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
               {syncStatus === 'syncing' ? <Loader2 size={14} className="text-blue-500 animate-spin" /> : 
                syncStatus === 'synced' ? <Cloud size={14} className="text-emerald-500" /> : 
                <CloudOff size={14} className="text-red-500" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">GV: {teacher?.name || 'Huỳnh Văn Nhẫn'}</h1>
              {syncStatus === 'synced' && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase">Cloud Secured</span>}
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{teacher?.school || 'THCS Long Trung'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all">
            <Settings size={16} /> Thông tin
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-500 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all group">
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" /> Thoát
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {userRole === UserRole.STUDENT && student ? (
          <div className="p-8"><StudentDashboard student={student} exams={exams} onTakeExam={setPreviewingExam} /></div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="bg-white border-b border-slate-200">
               <div className="flex max-w-7xl mx-auto px-4">
                  <TabButton active={activeTab === TabType.EXAMS} label="Quản Lý Đề Thi" icon={<BookOpen size={18} />} onClick={() => setActiveTab(TabType.EXAMS)} />
                  <TabButton active={activeTab === TabType.CLASSES} label="Quản Lý Lớp Học" icon={<Users size={18} />} onClick={() => setActiveTab(TabType.CLASSES)} />
                  <TabButton active={activeTab === TabType.GRADES} label="Quản Lý Điểm" icon={<BarChart size={18} />} onClick={() => setActiveTab(TabType.GRADES)} />
                  <TabButton active={activeTab === TabType.GAMES} label="Trò Chơi" icon={<Gamepad2 size={18} />} onClick={() => setActiveTab(TabType.GAMES)} />
               </div>
            </div>

            <div className="max-w-7xl mx-auto w-full p-8 flex-1">
              {activeTab === TabType.EXAMS && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-wider">Kho Đề Thi</h3>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => { setEditorMode('thpt'); setEditingExam(null); setIsEditorOpen(true); }} 
                        className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-8 py-3.5 rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all uppercase text-xs tracking-widest active:scale-95"
                      >
                        <FileText size={18} className="text-red-500" /> ĐỀ THPT
                      </button>
                      <button 
                        onClick={() => { setEditorMode('standard'); setEditingExam(null); setIsEditorOpen(true); }} 
                        className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all uppercase text-xs tracking-widest active:scale-95"
                      >
                        <Plus size={20} /> Soạn Đề Mới (2025)
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {exams.map(exam => (
                      <ExamCard key={exam.id} exam={exam} onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }} onDelete={handleDeleteExam} onView={setPreviewingExam} onToggleLock={() => {}} onAssign={setAssigningExam} />
                    ))}
                  </div>
                </div>
              )}
              {activeTab === TabType.CLASSES && teacher && <ClassManagement teacher={teacher} />}
              {activeTab === TabType.GRADES && <GradeManagement classes={classes} exams={exams} />}
              {activeTab === TabType.GAMES && <GameManagement classes={classes} />}
            </div>
          </div>
        )}
      </div>

      <footer className="py-6 px-8 text-center bg-white border-t border-slate-100 mt-auto">
        <p className="text-xs font-black text-slate-400 italic flex items-center justify-center gap-2">
          <Briefcase size={14} className="text-blue-600" />
          Thiết kế bởi Thầy <span className="text-slate-700 not-italic uppercase">Huỳnh Văn Nhẫn</span>
          <GraduationCap size={14} className="text-slate-400" />
        </p>
      </footer>

      {isEditorOpen && (
        <ExamEditor 
          isThptPreset={editorMode === 'thpt'} 
          initialExam={editingExam || undefined} 
          onSave={handleSaveExam} 
          onCancel={() => setIsEditorOpen(false)} 
        />
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, label: string, icon: React.ReactNode, onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-10 py-5 font-bold text-sm transition-all relative ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
  >
    {icon} {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
  </button>
);

export default App;
