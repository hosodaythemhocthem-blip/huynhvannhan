import React, { useState } from 'react';
import {
  ChevronDown,
  Gamepad2,
  Trophy,
  Target,
  Dices,
  Play,
  Users,
  ArrowLeft,
  Flag,
  RotateCw
} from 'lucide-react';
import { Class } from '../types';

interface GameManagementProps {
  classes: Class[];
}

const GameManagement: React.FC<GameManagementProps> = ({ classes }) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const games = [
    {
      id: 'duck-race',
      title: 'Trò chơi Đua vịt',
      description: 'Thi đua giải toán nhanh để đưa vịt về đích sớm nhất.',
      gradient: 'from-yellow-400 to-orange-500',
      icon: <Target className="text-white" size={32} />
    },
    {
      id: 'lucky-wheel',
      title: 'Quay số may mắn',
      description: 'Chọn ngẫu nhiên học sinh trả lời câu hỏi hoặc nhận thưởng.',
      gradient: 'from-purple-500 to-indigo-600',
      icon: <Dices className="text-white" size={32} />
    },
    {
      id: 'math-battle',
      title: 'Đấu trường Toán học',
      description: 'Chia đội đối kháng trực tiếp trên bảng điểm.',
      gradient: 'from-blue-500 to-cyan-600',
      icon: <Trophy className="text-white" size={32} />
    }
  ];

  if (activeGameId === 'duck-race' && selectedClass) {
    return (
      <DuckRaceArena
        className={selectedClass.name}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'lucky-wheel' && selectedClass) {
    return (
      <LuckyWheelArena
        className={selectedClass.name}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Chọn lớp */}
      <div className="bg-white border rounded-2xl p-6">
        <label className="text-xs font-bold text-purple-600 uppercase">
          Chọn lớp học
        </label>
        <div className="relative mt-2">
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 appearance-none"
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Danh sách game */}
      {selectedClass ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map(game => (
            <div
              key={game.id}
              className="bg-white border rounded-3xl p-6 shadow hover:shadow-lg transition"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-4`}
              >
                {game.icon}
              </div>
              <h4 className="font-bold text-lg">{game.title}</h4>
              <p className="text-sm text-slate-500 mb-6">
                {game.description}
              </p>
              <button
                onClick={() => setActiveGameId(game.id)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2"
              >
                <Play size={16} /> Bắt đầu
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-24">
          <Gamepad2 size={64} className="mx-auto mb-4 opacity-30" />
          Chưa chọn lớp học
        </div>
      )}
    </div>
  );
};

/* ================= ĐUA VỊT ================= */

const DuckRaceArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  const [racing, setRacing] = useState(false);
  const [ducks, setDucks] = useState([
    { id: 1, name: 'Trâm Anh', progress: 0 },
    { id: 2, name: 'Minh Khang', progress: 0 },
    { id: 3, name: 'Bảo Ngọc', progress: 0 }
  ]);

  const startRace = () => {
    setRacing(true);
    const timer = setInterval(() => {
      setDucks(prev =>
        prev.map(d => ({
          ...d,
          progress: Math.min(100, d.progress + Math.random() * 10)
        }))
      );
    }, 200);

    setTimeout(() => {
      clearInterval(timer);
      setRacing(false);
    }, 5000);
  };

  const resetRace = () => {
    setDucks(d => d.map(x => ({ ...x, progress: 0 })));
  };

  return (
    <div className="bg-white border rounded-3xl p-8">
      <div className="flex justify-between mb-6">
        <button onClick={onBack} className="flex gap-2">
          <ArrowLeft /> Quay lại
        </button>
        <h2 className="font-black text-yellow-500">
          Đua Vịt – {className}
        </h2>
        <div className="flex gap-2">
          <button onClick={resetRace} disabled={racing}>
            <RotateCw />
          </button>
          <button onClick={startRace} disabled={racing}>
            <Play /> Đua
          </button>
        </div>
      </div>

      {ducks.map(d => (
        <div key={d.id} className="mb-3">
          <div className="flex justify-between text-sm">
            <span>{d.name}</span>
            <span>{Math.round(d.progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded">
            <div
              className="h-2 bg-yellow-400 rounded"
              style={{ width: `${d.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ================= QUAY SỐ ================= */

const LuckyWheelArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const spin = () => {
    setSpinning(true);
    setWinner(null);
    setTimeout(() => {
      setWinner('Ngẫu nhiên 1 học sinh');
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="bg-white border rounded-3xl p-8 text-center">
      <button onClick={onBack} className="absolute left-6 top-6">
        <ArrowLeft />
      </button>

      <h2 className="text-3xl font-black text-purple-600 mb-6">
        Vòng quay – {className}
      </h2>

      {winner && (
        <div className="mb-6 text-2xl font-bold text-green-600">
          {winner}
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black"
      >
        {spinning ? 'Đang quay...' : 'Quay ngay'}
      </button>
    </div>
  );
};

export default GameManagement;
