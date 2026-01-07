import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Plus, Users, BarChart, Gamepad2, GraduationCap, FileText, Cloud, RefreshCw, CheckCircle
} from 'lucide-react';
import { TabType, Exam, UserRole, TeacherAccount } from './types';
import ExamCard from './components/ExamCard';
import ExamEditor from './components/ExamEditor';
import LoginScreen from './components/LoginScreen';
import ClassManagement from './components/ClassManagement';
import GradeManagement from './components/GradeManagement';
import GameManagement from './components/GameManagement';
import StudentQuiz from './components/StudentQuiz';
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
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [previewingExam, setPreviewingExam] = useState<Exam | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Hàm tải dữ liệu từ Firebase về
  const loadFromCloud = useCallback(async (username: string) => {
    setSyncStatus('syncing');
    try {
      const data = await SyncService.pullData(SyncService.generateSyncId(username));
      if (data && data.exams) {
        setExams(data.exams);
        localStorage.setItem(`exams_${username}`, JSON.stringify(data.exams));
      }
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    if (teacher) {
      loadFromCloud(teacher.username);
    }
  }, [teacher, loadFromCloud]);

  // Hàm đẩy dữ liệu lên Firebase
  const syncToCloud = useCallback(async (currentExams: Exam[]) => {
    if (!teacher) return;
    setSyncStatus('syncing');
    const syncId = SyncService.generateSyncId(teacher.username);
    const dataToSync = {
      teacherName: teacher.name,
      exams: currentExams,
      lastSync: new Date().toISOString()
    };
    const success = await SyncService.pushData(syncId, dataToSync);
    setSyncStatus(success ? 'synced' : 'error');
  }, [teacher]);

  const handleSaveExam = async (data: Partial<Exam>) => {
    if (!teacher) return;
    let updatedExams: Exam[];
    if (editingExam) {
      updatedExams = exams.map(e => e.id === editingExam.id ? { ...e, ...data } as Exam : e);
    } else {
      const newExam: Exam = { 
        id: `DE${Date.now().toString().slice(-4)}`, 
        title: data.title || 'Đề thi không tên',
        createdAt: new Date().toLocaleDateString('vi-VN'),
        questionCount: data.questions?.length || 0,
        questions: data.questions || [],
        isLocked: false,
        assignedClassIds: []
      };
      updatedExams = [newExam, ...exams];
    }
    
    setExams(updatedExams);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updatedExams));
    setIsEditorOpen(false);
    
    // Đẩy lên Firebase ngay lập tức
    await syncToCloud(updatedExams);
  };

  const handleDeleteExam = async (id: string) => {
    if (!teacher || !window.confirm("Thầy muốn xóa đề thi này?")) return;
    const updatedExams = exams.filter(e => e.id !== id);
    setExams(updatedExams);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updatedExams));
    await syncToCloud(updatedExams);
  };

  const handleSelectRole = (role: UserRole, data?: any) => {
    setUserRole(role);
    localStorage.setItem('current_role', role);
    if (role === UserRole.TEACHER && data) {
      setTeacher(data);
      localStorage.setItem('current_teacher', JSON.stringify(data));
    }
  };

  if (userRole === UserRole.GUEST) return <LoginScreen onSelectRole={handleSelectRole} />;
  if (previewingExam) return <StudentQuiz exam={previewingExam} onExit={() => setPreviewingExam(null)} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black">Thầy: {teacher?.name}</h1>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                {syncStatus === 'synced' ? 'Đã lưu Firebase' : 'Đang đồng bộ'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => syncToCloud(exams)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-blue-50 border border-slate-100 transition-colors">
            <Cloud size={18} />
          </button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-black border border-red-100 uppercase">
            Thoát
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <nav className="bg-white border-b border-slate-200">
           <div className="flex max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
              <TabButton active={activeTab === TabType.EXAMS} label="KHO ĐỀ THI" icon={<BookOpen size={16} />} onClick={() => setActiveTab(TabType.EXAMS)} />
              <TabButton active={activeTab === TabType.CLASSES} label="LỚP HỌC" icon={<Users size={16} />} onClick={() => setActiveTab(TabType.CLASSES)} />
              <TabButton active={activeTab === TabType.GRADES} label="BẢNG ĐIỂM" icon={<BarChart size={16} />} onClick={() => setActiveTab(TabType.GRADES)} />
              <TabButton active={activeTab === TabType.GAMES} label="TRÒ CHƠI" icon={<Gamepad2 size={16} />} onClick={() => setActiveTab(TabType.GAMES)} />
           </div>
        </nav>

        <main className="max-w-7xl mx-auto w-full p-6">
          {activeTab === TabType.EXAMS && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight">
                  <FileText className="text-blue-600" size={20} /> Bài tập của Thầy
                </h3>
                <button 
                  onClick={() => { setEditingExam(null); setIsEditorOpen(true); }} 
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 text-sm transition-all active:scale-95"
                >
                  <Plus size={18} /> SOẠN ĐỀ MỚI
                </button>
              </div>
              
              {exams.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Kho đề đang trống. Hãy soạn đề đầu tiên!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map(exam => (
                    <ExamCard key={exam.id} exam={exam} onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }} onDelete={handleDeleteExam} onView={setPreviewingExam} onToggleLock={() => {}} onAssign={() => {}} />
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === TabType.CLASSES && <ClassManagement />}
          {activeTab === TabType.GRADES && <GradeManagement />}
          {activeTab === TabType.GAMES && <GameManagement />}
        </main>
      </div>

      {isEditorOpen && <ExamEditor onSave={handleSaveExam} onCancel={() => setIsEditorOpen(false)} initialExam={editingExam || undefined} />}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, label: string, icon: React.ReactNode, onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 font-black text-[11px] transition-all relative tracking-widest whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    {icon} {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
  </button>
);

export default App;
