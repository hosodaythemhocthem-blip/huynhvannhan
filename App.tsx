import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Users, BarChart, Gamepad2,
  GraduationCap, FileText, Cloud, RefreshCw, CheckCircle
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

const App: React.FC = () => {
  // ===== AUTH STATE =====
  const [userRole, setUserRole] = useState<UserRole>(
    () => (localStorage.getItem('current_role') as UserRole) || UserRole.GUEST
  );

  const [teacher, setTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('current_teacher');
    return saved ? JSON.parse(saved) : null;
  });

  // ===== UI STATE =====
  const [activeTab, setActiveTab] = useState<TabType>(TabType.EXAMS);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [previewingExam, setPreviewingExam] = useState<Exam | null>(null);

  // ===== DATA STATE =====
  const [exams, setExams] = useState<Exam[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // ===== CLOUD LOAD =====
  const loadFromCloud = useCallback(async (username: string) => {
    setSyncStatus('syncing');
    try {
      const data = await SyncService.pullData(
        SyncService.generateSyncId(username)
      );
      if (data?.exams) {
        setExams(data.exams);
        localStorage.setItem(`exams_${username}`, JSON.stringify(data.exams));
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    if (teacher) loadFromCloud(teacher.username);
  }, [teacher, loadFromCloud]);

  // ===== CLOUD SYNC =====
  const syncToCloud = useCallback(async (currentExams: Exam[]) => {
    if (!teacher) return;
    setSyncStatus('syncing');

    const payload = {
      teacherName: teacher.name,
      exams: currentExams,
      lastSync: new Date().toISOString()
    };

    const ok = await SyncService.pushData(
      SyncService.generateSyncId(teacher.username),
      payload
    );

    setSyncStatus(ok ? 'synced' : 'error');
  }, [teacher]);

  // ===== EXAM HANDLERS =====
  const handleSaveExam = async (data: Partial<Exam>) => {
    if (!teacher) return;

    const updatedExams: Exam[] = editingExam
      ? exams.map(e => e.id === editingExam.id ? { ...e, ...data } as Exam : e)
      : [{
          id: `DE${Date.now().toString().slice(-4)}`,
          title: data.title || 'Đề thi không tên',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          questionCount: data.questions?.length || 0,
          questions: data.questions || [],
          isLocked: false,
          assignedClassIds: []
        }, ...exams];

    setExams(updatedExams);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updatedExams));
    setIsEditorOpen(false);
    setEditingExam(null);

    await syncToCloud(updatedExams);
  };

  const handleDeleteExam = async (id: string) => {
    if (!teacher || !window.confirm('Thầy muốn xóa đề thi này?')) return;
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updated));
    await syncToCloud(updated);
  };

  // ===== LOGIN =====
  const handleSelectRole = (role: UserRole, data?: TeacherAccount) => {
    setUserRole(role);
    localStorage.setItem('current_role', role);
    if (role === UserRole.TEACHER && data) {
      setTeacher(data);
      localStorage.setItem('current_teacher', JSON.stringify(data));
    }
  };

  // ===== EARLY RETURNS =====
  if (userRole === UserRole.GUEST) {
    return <LoginScreen onSelectRole={handleSelectRole} />;
  }

  if (previewingExam) {
    return <StudentQuiz exam={previewingExam} onExit={() => setPreviewingExam(null)} />;
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="font-black">Thầy: {teacher?.name}</h1>
            <div className="flex items-center gap-1 text-[10px] font-bold">
              {syncStatus === 'syncing'
                ? <RefreshCw size={12} className="animate-spin text-amber-500" />
                : <CheckCircle size={12} className="text-emerald-600" />
              }
              {syncStatus === 'synced' ? 'Đã lưu Firebase' : 'Đang đồng bộ'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => syncToCloud(exams)} className="p-2 bg-slate-50 rounded-lg">
            <Cloud size={18} />
          </button>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-black"
          >
            Thoát
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav className="bg-white border-b">
        <div className="flex max-w-7xl mx-auto px-4 overflow-x-auto">
          <Tab label="KHO ĐỀ THI" icon={<BookOpen size={16} />} active={activeTab === TabType.EXAMS} onClick={() => setActiveTab(TabType.EXAMS)} />
          <Tab label="LỚP HỌC" icon={<Users size={16} />} active={activeTab === TabType.CLASSES} onClick={() => setActiveTab(TabType.CLASSES)} />
          <Tab label="BẢNG ĐIỂM" icon={<BarChart size={16} />} active={activeTab === TabType.GRADES} onClick={() => setActiveTab(TabType.GRADES)} />
          <Tab label="TRÒ CHƠI" icon={<Gamepad2 size={16} />} active={activeTab === TabType.GAMES} onClick={() => setActiveTab(TabType.GAMES)} />
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto w-full p-6">
        {activeTab === TabType.EXAMS && (
          <>
            <div className="flex justify-between mb-6">
              <h3 className="font-black flex items-center gap-2">
                <FileText size={18} /> Bài tập của Thầy
              </h3>
              <button
                onClick={() => { setEditingExam(null); setIsEditorOpen(true); }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2"
              >
                <Plus size={18} /> Soạn đề mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onEdit={() => { setEditingExam(exam); setIsEditorOpen(true); }}
                  onDelete={handleDeleteExam}
                  onView={setPreviewingExam}
                  onToggleLock={() => {}}
                  onAssign={() => {}}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === TabType.CLASSES && <ClassManagement />}
        {activeTab === TabType.GRADES && <GradeManagement />}
        {activeTab === TabType.GAMES && <GameManagement />}
      </main>

      {isEditorOpen && (
        <ExamEditor
          initialExam={editingExam || undefined}
          onSave={handleSaveExam}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};

const Tab = ({ label, icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-[11px] font-black tracking-widest
      ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
  >
    {icon} {label}
  </button>
);

export default App;
