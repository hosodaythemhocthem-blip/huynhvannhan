
import React, { useState, useEffect } from 'react';
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
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const games = [
    {
      id: 'duck-race',
      title: 'Trò chơi Đua vịt',
      description: 'Thi đua giải toán nhanh để đưa vịt về đích sớm nhất.',
      color: 'bg-yellow-400',
      icon: <Target className="text-white" size={32} />,
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'lucky-wheel',
      title: 'Quay số may mắn',
      description: 'Chọn ngẫu nhiên học sinh trả lời câu hỏi hoặc nhận thưởng.',
      color: 'bg-purple-500',
      icon: <Dices className="text-white" size={32} />,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'math-battle',
      title: 'Đấu trường Toán học',
      description: 'Chia đội đối kháng trực tiếp trên bảng điểm thời gian thực.',
      color: 'bg-blue-500',
      icon: <Trophy className="text-white" size={32} />,
      gradient: 'from-blue-500 to-cyan-600'
    }
  ];

  if (activeGameId === 'duck-race' && selectedClass) {
    return <DuckRaceArena className={selectedClass.name} onBack={() => setActiveGameId(null)} />;
  }

  if (activeGameId === 'lucky-wheel' && selectedClass) {
    return <LuckyWheelArena className={selectedClass.name} onBack={() => setActiveGameId(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Class Selection Area */}
      <div className="bg-[#fdfaff] border border-[#f3e8ff] rounded-2xl p-6 shadow-sm">
        <div className="space-y-3">
          <label className="text-[12px] font-bold text-purple-600 uppercase tracking-wider ml-1">
            Chọn Lớp để Tổ chức Trò chơi:
          </label>
          <div className="relative">
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full appearance-none bg-white border border-purple-100 rounded-xl px-4 py-3 text-slate-600 font-medium focus:ring-2 focus:ring-purple-400 outline-none transition-all cursor-pointer text-[15px] shadow-sm"
            >
              <option value="">-- Vui lòng chọn lớp --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {/* 2. Content Area */}
      {selectedClassId ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Gamepad2 className="text-purple-500" /> Kho trò chơi lớp {selectedClass?.name}
            </h3>
            <span className="text-sm text-slate-400 font-medium italic">Chọn một trò chơi để bắt đầu tổ chức</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div 
                key={game.id} 
                className="group relative bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.gradient} opacity-[0.03] rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform`}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:rotate-6 transition-transform`}>
                    {game.icon}
                  </div>
                  
                  <h4 className="text-lg font-black text-slate-800 mb-2">{game.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                    {game.description}
                  </p>
                  
                  <button 
                    onClick={() => setActiveGameId(game.id)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    <Play size={16} fill="white" />
                    Bắt đầu chơi
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
              <Users size={20} />
            </div>
            <div>
              <h5 className="font-bold text-blue-800 text-sm">Gợi ý dành cho Giáo viên</h5>
              <p className="text-blue-600/70 text-xs mt-1 leading-relaxed">
                Trò chơi <strong>Đua vịt</strong> sẽ hiệu quả nhất khi bạn đã chuẩn bị sẵn một bộ đề thi ngắn (5-10 câu). Hệ thống sẽ tự động xếp hạng học sinh dựa trên tốc độ phản xạ và độ chính xác của câu trả lời.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-4">
          <div className="bg-slate-50 p-10 rounded-full">
            <Gamepad2 size={80} className="opacity-20" />
          </div>
          <p className="text-lg font-medium text-slate-400">Chưa chọn lớp học</p>
        </div>
      )}
    </div>
  );
};

/* --- TRÒ CHƠI ĐUA VỊT ARENA --- */
const DuckRaceArena: React.FC<{ className: string, onBack: () => void }> = ({ className, onBack }) => {
  const [racing, setRacing] = useState(false);
  const [ducks, setDucks] = useState([
    { id: 1, name: 'Trâm Anh', progress: 0, color: 'text-yellow-400' },
    { id: 2, name: 'Minh Khang', progress: 0, color: 'text-orange-400' },
    { id: 3, name: 'Bảo Ngọc', progress: 0, color: 'text-blue-400' },
    { id: 4, name: 'Gia Huy', progress: 0, color: 'text-green-400' },
    { id: 5, name: 'Tú Anh', progress: 0, color: 'text-pink-400' },
  ]);

  const startRace = () => {
    setRacing(true);
    const interval = setInterval(() => {
      setDucks(prev => {
        const next = prev.map(d => ({
          ...d,
          progress: Math.min(100, d.progress + Math.random() * 10)
        }));
        if (next.every(d => d.progress >= 100)) {
          clearInterval(interval);
          setRacing(false);
        }
        return next;
      });
    }, 200);
  };

  const resetRace = () => {
    setDucks(ducks.map(d => ({ ...d, progress: 0 })));
    setRacing(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors">
          <ArrowLeft size={20} /> Quay lại
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter">Arena: Đua Vịt 🦆</h2>
          <p className="text-slate-400 font-bold text-sm uppercase">Lớp {className}</p>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={racing}
            onClick={resetRace}
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            <RotateCw size={20} />
          </button>
          <button 
            disabled={racing}
            onClick={startRace}
            className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-yellow-900 rounded-xl font-black shadow-lg shadow-yellow-100 hover:bg-yellow-500 disabled:opacity-50 active:scale-95 transition-all"
          >
            <Play size={20} fill="currentColor" /> BẮT ĐẦU ĐUA
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative">
        {/* Finish Line */}
        <div className="absolute right-[60px] top-0 bottom-0 w-2 border-r-4 border-dashed border-slate-200 flex flex-col justify-around py-4">
           <Flag className="text-red-500 -mr-4" size={24} />
           <Flag className="text-red-500 -mr-4" size={24} />
        </div>

        {ducks.map((duck, idx) => (
          <div key={duck.id} className="relative h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center px-6">
            <span className="text-xs font-black text-slate-300 mr-4">LÀN {idx + 1}</span>
            <span className="font-bold text-slate-600 min-w-[100px] text-sm">{duck.name}</span>
            
            {/* The Track */}
            <div className="flex-1 h-2 bg-slate-200 rounded-full mx-6 relative">
               <div 
                 className={`absolute left-0 top-0 bottom-0 bg-yellow-400 rounded-full transition-all duration-300`}
                 style={{ width: `${duck.progress}%` }}
               ></div>
               
               {/* The Duck Icon */}
               <div 
                 className="absolute top-1/2 -translate-y-1/2 -ml-6 transition-all duration-300 flex flex-col items-center"
                 style={{ left: `${duck.progress}%` }}
               >
                 <div className="text-3xl filter drop-shadow-md transform -scale-x-100">🦆</div>
               </div>
            </div>
            
            <div className="w-12 text-right">
              <span className="text-[10px] font-black text-slate-400 italic">{Math.round(duck.progress)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold italic">!</div>
            <p className="text-yellow-800 text-sm font-medium"><b>Mẹo:</b> Mỗi khi học sinh trả lời đúng 1 câu hỏi LaTeX, vịt của em đó sẽ tiến thêm 10%.</p>
         </div>
      </div>
    </div>
  );
};

/* --- TRÒ CHƠI QUAY SỐ ARENA --- */
const LuckyWheelArena: React.FC<{ className: string, onBack: () => void }> = ({ className, onBack }) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  const spin = () => {
    setSpinning(true);
    setWinner(null);
    setTimeout(() => {
      setWinner("Ngô Võ Trâm Anh");
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-300 min-h-[600px] flex flex-col items-center justify-center text-center">
       <div className="absolute top-8 left-8">
         <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors">
            <ArrowLeft size={20} /> Quay lại
         </button>
       </div>

       <div className="mb-8">
          <h2 className="text-4xl font-black text-purple-600 tracking-tighter uppercase">Vòng Quay May Mắn</h2>
          <p className="text-slate-400 font-bold">Lớp {className}</p>
       </div>

       <div className="relative w-80 h-80 mb-12">
          {/* Wheel Visualization */}
          <div className={`w-full h-full rounded-full border-[12px] border-slate-800 shadow-2xl relative overflow-hidden transition-transform duration-[2000ms] ease-out ${spinning ? 'rotate-[1800deg]' : 'rotate-0'}`}>
             <div className="absolute inset-0 bg-red-400 rotate-0 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-blue-400 rotate-45 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-green-400 rotate-90 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-yellow-400 rotate-135 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-purple-400 rotate-180 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-pink-400 rotate-225 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-orange-400 rotate-270 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
             <div className="absolute inset-0 bg-indigo-400 rotate-315 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
          </div>
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 z-10"></div>
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border-4 border-slate-800 z-20"></div>
       </div>

       {winner && (
         <div className="mb-8 animate-in bounce-in duration-700">
            <p className="text-slate-400 font-bold uppercase text-xs mb-1">Người được chọn:</p>
            <h3 className="text-3xl font-black text-green-600">{winner}</h3>
         </div>
       )}

       <button 
         onClick={spin}
         disabled={spinning}
         className="px-12 py-4 bg-purple-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-purple-100 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
       >
         {spinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
       </button>
    </div>
  );
};

export default GameManagement;
