
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Plus, LogOut, Users, BarChart, Gamepad2, GraduationCap, Briefcase, Settings, UserCircle, FileText, Cloud, CloudOff, Loader2,
  CheckCircleIcon, RefreshCw
} from 'lucide-react';
import { TabType, Exam, UserRole, TeacherAccount, Class } from './types';
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
import { FIREBASE_CONFIG } from './services/firebase';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('current_role') as UserRole) || UserRole.GUEST);
  const [teacher, setTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('current_teacher');
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

  const isFirebaseConfigured = !!FIREBASE_CONFIG.apiKey;

  // Tải dữ liệu từ Firebase ngay khi vào App
  const loadFromCloud = useCallback(async (username: string) => {
    setSyncStatus('syncing');
    const data = await SyncService.pullData(SyncService.generateSyncId(username));
    if (data) {
      if (data.exams) {
        setExams(data.exams);
        localStorage.setItem(`exams_${username}`, JSON.stringify(data.exams));
      }
      if (data.classes) {
        setClasses(data.classes);
        localStorage.setItem(`classes_${username}`, JSON.stringify(data.classes));
      }
      setSyncStatus('synced');
    } else {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    if (teacher) {
      loadFromCloud(teacher.username);
    }
  }, [teacher, loadFromCloud]);

  const syncToCloud = useCallback(async () => {
    if (!teacher || !isFirebaseConfigured) return;

    setSyncStatus('syncing');
    const syncId = SyncService.generateSyncId(teacher.username);
    
    const dataToSync = {
      teacherName: teacher.name,
      exams: JSON.parse(localStorage.getItem(`exams_${teacher.username}`) || '[]'),
      classes: JSON.parse(localStorage.getItem(`classes_${teacher.username}`) || '[]'),
      lastSync: new Date().toISOString()
    };

    const success = await SyncService.pushData(syncId, dataToSync);
    setSyncStatus(success ? 'synced' : 'error');
  }, [teacher, isFirebaseConfigured]);

  const handleSaveExam = async (data: Partial<Exam>) => {
    if (!teacher) return;
    let updatedExams: Exam[];
    if (editingExam) {
      updatedExams = exams.map(e => e.id === editingExam.id ? { ...e, ...data } as Exam : e);
    } else {
      const newExam = { 
        ...data, 
        id: `DE${Date.now().toString().slice(-4)}`, 
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
    if (!teacher || !window.confirm("Thầy có chắc chắn muốn xóa đề thi này không?")) return;
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
  };

  const handleLogout = () => {
    setUserRole(UserRole.GUEST);
    setTeacher(null);
    localStorage.clear();
  };

  if (userRole === UserRole.GUEST) return <LoginScreen onSelectRole={handleSelectRole} />;
  if (previewingExam) return <StudentQuiz exam={previewingExam} onExit={() => setPreviewingExam(null)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <GraduationCap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-800">Thầy: {teacher?.name || 'Huỳnh Văn Nhẫn'}</h1>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircleIcon size={10} />}
                {syncStatus === 'synced' ? 'Đã kết nối Cloud' : 'Đang đồng bộ...'}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{teacher?.school || 'THCS LONG TRUNG'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={syncToCloud} title="Đồng bộ thủ công" className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
            <Cloud size={20} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-black hover:bg-red-600 hover:text-white transition-all border border-red-100">
            <LogOut size={18} /> THOÁT
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200">
           <div className="flex max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
              <TabButton active={activeTab === TabType.EXAMS} label="KHO ĐỀ THI" icon={<BookOpen size={18} />} onClick={() => setActiveTab(TabType.EXAMS)} />
              <TabButton active={activeTab === TabType.CLASSES} label="LỚP HỌC" icon={<Users size={18} />} onClick={() => setActiveTab(TabType.CLASSES)} />
              <TabButton active={activeTab === TabType.GRADES} label="BẢNG ĐIỂM" icon={<BarChart size={18} />} onClick={() => setActiveTab(TabType.GRADES)} />
              <TabButton active={activeTab === TabType.GAMES} label="TRÒ CHƠI" icon={<Gamepad2 size={18} />} onClick={() => setActiveTab(TabType.GAMES)} />
           </div>
        </div>

        <main className="max-w-7xl mx-auto w-full p-8">
          {activeTab === TabType.EXAMS && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                  <FileText className="text-blue-600" /> Quản lý bài kiểm tra
                </h3>
                <button 
                  onClick={() => { setEditorMode('standard'); setEditingExam(null); setIsEditorOpen(true); }} 
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Plus size={20} /> SOẠN ĐỀ MỚI
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.length > 0 ? (
                  exams.map(exam => (
                    <ExamCard key={exam.id} exam={exam} onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }} onDelete={handleDeleteExam} onView={setPreviewingExam} onToggleLock={() => {}} onAssign={setAssigningExam} />
                  ))
                ) : (
                  <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <CloudOff size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">Chưa có dữ liệu. Hãy soạn đề thi đầu tiên!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === TabType.CLASSES && teacher && <ClassManagement teacher={teacher} />}
          {activeTab === TabType.GRADES && <GradeManagement classes={classes} exams={exams} />}
          {activeTab === TabType.GAMES && <GameManagement classes={classes} />}
        </main>
      </div>

      <footer className="py-8 px-8 text-center bg-white border-t border-slate-100 mt-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Hệ thống được phát triển bởi Thầy <span className="text-blue-600">Huỳnh Văn Nhẫn</span>
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
    className={`flex items-center gap-3 px-8 py-5 font-black text-xs transition-all relative tracking-widest whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon} {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
  </button>
);

export default App;
