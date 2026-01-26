import React, { useState, useEffect, useCallback } from 'react';
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
import AiExamGenerator from './components/AiExamGenerator';
import AdminDashboard from './components/AdminDashboard';

import { SyncService } from './services/syncService';

const App: React.FC = () => {
  // ===== AUTH =====
  const [userRole, setUserRole] = useState<UserRole>(
    () => (localStorage.getItem('current_role') as UserRole) || UserRole.GUEST
  );

  const [teacher, setTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('current_teacher');
    return saved ? JSON.parse(saved) : null;
  });

  // ===== UI =====
  const [activeTab, setActiveTab] = useState<TabType>(TabType.EXAMS);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [previewingExam, setPreviewingExam] = useState<Exam | null>(null);

  // ===== DATA =====
  const [exams, setExams] = useState<Exam[]>([]);
  const [syncStatus, setSyncStatus] =
    useState<'synced' | 'syncing' | 'error'>('synced');

  // =========================
  // 🔐 PHÂN QUYỀN SỚM
  // =========================
  if (userRole === UserRole.GUEST) {
    return <LoginScreen onSelectRole={handleSelectRole} />;
  }

  if (userRole === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  if (userRole === UserRole.TEACHER && !teacher) {
    localStorage.clear();
    window.location.reload();
    return null;
  }

  // =========================
  // ☁️ LOAD CLOUD
  // =========================
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

  // =========================
  // ☁️ SYNC CLOUD
  // =========================
  const syncToCloud = useCallback(
    async (currentExams: Exam[]) => {
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
    },
    [teacher]
  );

  // =========================
  // 💾 SAVE / DELETE EXAM
  // =========================
  const handleSaveExam = async (data: Partial<Exam>) => {
    if (!teacher) return;

    const updated: Exam[] = editingExam
      ? exams.map(e =>
          e.id === editingExam.id ? { ...e, ...data } as Exam : e
        )
      : [
          {
            id: `DE${Date.now().toString().slice(-4)}`,
            title: data.title || 'Đề thi không tên',
            createdAt: new Date().toLocaleDateString('vi-VN'),
            questionCount: data.questions?.length || 0,
            questions: data.questions || [],
            isLocked: false,
            assignedClassIds: []
          },
          ...exams
        ];

    setExams(updated);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updated));
    setIsEditorOpen(false);
    setEditingExam(null);
    await syncToCloud(updated);
  };

  const handleDeleteExam = async (id: string) => {
    if (!teacher || !window.confirm('Thầy muốn xóa đề thi này?')) return;
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updated));
    await syncToCloud(updated);
  };

  // =========================
  // 🎓 PREVIEW
  // =========================
  if (previewingExam) {
    return (
      <StudentQuiz
        exam={previewingExam}
        onExit={() => setPreviewingExam(null)}
      />
    );
  }

  // =========================
  // 🎨 UI GIÁO VIÊN
  // =========================
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GraduationCap />
          <div>
            <div className="font-black">Thầy: {teacher?.name}</div>
            <div className="text-xs flex items-center gap-1">
              {syncStatus === 'syncing'
                ? <RefreshCw size={12} className="animate-spin" />
                : <CheckCircle size={12} className="text-green-600" />}
              {syncStatus === 'synced' ? 'Đã lưu' : 'Đang đồng bộ'}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-red-600 font-bold"
        >
          Thoát
        </button>
      </header>

      {/* NAV */}
      <nav className="bg-white border-b flex">
        <Tab label="KHO ĐỀ" icon={<BookOpen size={16} />} active={activeTab === TabType.EXAMS} onClick={() => setActiveTab(TabType.EXAMS)} />
        <Tab label="LỚP" icon={<Users size={16} />} active={activeTab === TabType.CLASSES} onClick={() => setActiveTab(TabType.CLASSES)} />
        <Tab label="ĐIỂM" icon={<BarChart size={16} />} active={activeTab === TabType.GRADES} onClick={() => setActiveTab(TabType.GRADES)} />
        <Tab label="TRÒ CHƠI" icon={<Gamepad2 size={16} />} active={activeTab === TabType.GAMES} onClick={() => setActiveTab(TabType.GAMES)} />
      </nav>

      {/* CONTENT */}
      <main className="p-6">
        {activeTab === TabType.EXAMS && (
          <>
            <button
              onClick={() => {
                setEditingExam(null);
                setIsEditorOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
            >
              + Soạn đề mới
            </button>

            <AiExamGenerator
              onGenerate={(exam) => {
                const updated = [exam, ...exams];
                setExams(updated);
                localStorage.setItem(`exams_${teacher.username}`, JSON.stringify(updated));
                syncToCloud(updated);
              }}
            />

            <div className="grid grid-cols-3 gap-4 mt-6">
              {exams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onEdit={() => {
                    setEditingExam(exam);
                    setIsEditorOpen(true);
                  }}
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
    className={`px-6 py-3 flex items-center gap-2 font-bold text-xs
      ${active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}
  >
    {icon} {label}
  </button>
);

export default App;
