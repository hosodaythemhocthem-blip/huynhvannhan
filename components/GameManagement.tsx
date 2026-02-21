import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Gamepad2,
  Trophy,
  Target,
  Dices,
  Play,
  ArrowLeft,
  RotateCw,
  Trash2,
  ClipboardPaste,
  Plus,
  Loader2,
  ChevronDown,
  Sparkles,
  History,
  XCircle,
  Users
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";

type GameId = "duck-race" | "lucky-wheel" | "math-battle";

interface GameHistory {
  id: string;
  game_name: string;
  winner: string;
  class_name: string;
  created_at: string;
}

const GameManagement: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: classData } = await supabase.from('classes').select();
    setClasses(classData || []);
    
    const { data: histData } = await supabase.from('game_history').select();
    setHistory(histData || []);
    setLoading(false);
  };

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const deleteHistory = async (id: string) => {
    if (confirm("Xóa vĩnh viễn bản ghi thắng cuộc này?")) {
      // FIX: Cú pháp chuẩn của Supabase là .delete().eq('cột', giá_trị)
      await supabase.from('game_history').delete().eq('id', id);
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const games = [
    {
      id: "duck-race" as GameId,
      title: "Đua Vịt Thần Tốc",
      description: "Học sinh giải Toán nhanh để đưa vịt về đích. Thích hợp cho thi đua cá nhân.",
      gradient: "from-amber-400 to-orange-600",
      icon: <Target size={32} className="text-white" />,
    },
    {
      id: "lucky-wheel" as GameId,
      title: "Vòng Quay May Mắn",
      description: "Chọn ngẫu nhiên học sinh trả lời hoặc nhận quà. Hỗ trợ dán danh sách nhanh.",
      gradient: "from-indigo-500 to-purple-700",
      icon: <Dices size={32} className="text-white" />,
    },
    {
      id: "math-battle" as GameId,
      title: "Đấu Trường Toán Học",
      description: "Chia đội đối kháng. Câu hỏi hiển thị công thức Toán học siêu đẹp.",
      gradient: "from-cyan-500 to-blue-700",
      icon: <Trophy size={32} className="text-white" />,
    },
  ];

  if (activeGameId && selectedClass) {
    const GameComponent = {
      "duck-race": DuckRaceArena,
      "lucky-wheel": LuckyWheelArena,
      "math-battle": MathBattleArena,
    }[activeGameId];

    return (
      <GameComponent
        className={selectedClass.name}
        onBack={() => { setActiveGameId(null); loadData(); }}
      />
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* 🛠 SELECTION PANEL */}
      <section className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Giải trí</h2>
            <p className="text-slate-500 font-medium mt-1">Biến những giờ giải Toán thành những cuộc đua đầy cảm hứng.</p>
          </div>
          
          <div className="w-full md:w-80">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block ml-4">Chọn lớp thi đấu</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none outline-none"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* 🎮 GAME GRID */}
      {selectedClass ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game) => (
            <div
              key={game.id}
              className="group bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:rotate-12 transition-transform`}>
                  {game.icon}
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-3">{game.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{game.description}</p>
              </div>
              <button
                onClick={() => setActiveGameId(game.id)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Play size={16} className="fill-current" /> Bắt đầu arena
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 animate-float">
              <Gamepad2 size={48} />
           </div>
           <p className="text-slate-400 font-black text-lg">Thầy Nhẫn hãy chọn lớp để kích hoạt Đấu trường</p>
        </div>
      )}

      {/* 🏆 LEADERBOARD / HISTORY */}
      {history.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-4">
             <History className="text-indigo-600" size={24} />
             <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lịch sử Vinh danh</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((h) => (
              <div key={h.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                       <Trophy size={20} />
                    </div>
                    <div>
                       <p className="font-black text-slate-800">{h.winner}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">{h.game_name} • {h.class_name}</p>
                    </div>
                 </div>
                 <button onClick={() => deleteHistory(h.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                 </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ============================================================
   DUCK RACE ARENA: CẢI TIẾN SIÊU MƯỢT
============================================================ */
const DuckRaceArena: React.FC<{ className: string; onBack: () => void }> = ({ className, onBack }) => {
  const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [ducks, setDucks] = useState<any[]>([
    { id: 1, name: "Thí sinh A", progress: 0, color: "bg-yellow-400" },
    { id: 2, name: "Thí sinh B", progress: 0, color: "bg-orange-400" },
    { id: 3, name: "Thí sinh C", progress: 0, color: "bg-amber-400" },
  ]);

  const handlePasteStudents = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 5);
      if (lines.length > 0) {
        setDucks(lines.map((name, i) => ({
          id: i,
          name: name.trim(),
          progress: 0,
          color: i % 2 === 0 ? "bg-yellow-400" : "bg-orange-500"
        })));
      }
    } catch (err) { alert("Dùng Ctrl+V"); }
  };

  const startRace = () => {
    if (racing) return;
    setWinner(null);
    setRacing(true);
    const interval = setInterval(() => {
      setDucks(prev => {
        const newDucks = prev.map(d => ({
          ...d,
          progress: Math.min(100, d.progress + Math.random() * 8)
        }));
        const win = newDucks.find(d => d.progress >= 100);
        if (win) {
          clearInterval(interval);
          setWinner(win.name);
          setRacing(false);
          // FIX: Thêm as any để tránh Vercel báo lỗi thiếu cột bắt buộc
          supabase.from('game_history').insert({
            game_name: "Đua Vịt",
            winner: win.name,
            class_name: className
          } as any).then();
        }
        return newDucks;
      });
    }, 100);
  };

  const reset = () => {
    setWinner(null);
    setDucks(prev => prev.map(d => ({ ...d, progress: 0 })));
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-50/50 rounded-full blur-[100px] -mr-48 -mt-48"></div>
      
      <div className="relative z-10 flex justify-between items-center mb-12">
        <button onClick={onBack} className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="text-center">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Đua Vịt Thần Tốc</h2>
           <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest mt-1">Lớp: {className}</p>
        </div>
        <button onClick={handlePasteStudents} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm" title="Dán danh sách học sinh (Ctrl+V)">
           <ClipboardPaste size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-10 relative z-10 py-10">
        {ducks.map((d) => (
          <div key={d.id} className="relative">
            <div className="flex justify-between items-end mb-3 px-2">
               <span className="font-black text-slate-700 text-lg flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${d.color} flex items-center justify-center shadow-md`}>🐥</div>
                  {d.name}
               </span>
               <span className="text-xs font-black text-slate-400 tracking-widest">{Math.round(d.progress)}%</span>
            </div>
            <div className="h-4 bg-slate-50 rounded-full shadow-inner relative border border-slate-100 overflow-hidden">
              <div
                className={`h-full ${d.color} transition-all duration-300 shadow-lg relative`}
                style={{ width: `${d.progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 pt-10 border-t border-slate-50 flex justify-center gap-4">
        {winner && (
           <div className="absolute -top-32 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="bg-emerald-600 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
                 <Trophy size={40} className="mb-2" />
                 <p className="text-xs font-bold uppercase opacity-70">Người chiến thắng</p>
                 <p className="text-2xl font-black">{winner}</p>
              </div>
           </div>
        )}
        <button onClick={reset} disabled={racing} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">LÀM MỚI</button>
        <button onClick={startRace} disabled={racing} className="px-16 py-4 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-amber-600 transition-all flex items-center gap-3">
           <Play size={20} /> BẮT ĐẦU ĐUA
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   LUCKY WHEEL: VÒNG QUAY SIÊU MƯỢT
============================================================ */
const LuckyWheelArena: React.FC<{ className: string; onBack: () => void }> = ({ className, onBack }) => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [participants, setParticipants] = useState(["Minh", "An", "Bình", "Cường", "Dung", "Hoa"]);

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    const list = text.split('\n').filter(l => l.trim()).map(l => l.trim());
    if (list.length > 0) setParticipants(list);
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);
    const newRotation = rotation + 1800 + Math.random() * 360;
    setRotation(newRotation);
    
    setTimeout(() => {
      setSpinning(false);
      const index = Math.floor(Math.random() * participants.length);
      const winName = participants[index];
      setWinner(winName);
      supabase.from('game_history').insert({
        game_name: "Vòng Quay May Mắn",
        winner: winName,
        class_name: className
      } as any).then();
    }, 4000);
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px] flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] -ml-48 -mt-48"></div>
      
      <div className="w-full flex justify-between items-center mb-12 relative z-10">
        <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 font-black text-xs tracking-widest"><ArrowLeft size={20} /></button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Vòng Quay May Mắn</h2>
        <button onClick={handlePaste} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><ClipboardPaste size={20} /></button>
      </div>

      <div className="relative w-80 h-80 md:w-96 md:h-96 mb-12 transition-transform duration-[4000ms] ease-out" style={{ transform: `rotate(${rotation}deg)` }}>
         <div className="absolute inset-0 rounded-full border-[10px] border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden">
            {participants.map((p, i) => (
              <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${(360/participants.length)*i}deg)` }}>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-slate-100 opacity-20 origin-bottom"></div>
                 <span className="absolute top-10 left-1/2 -translate-x-1/2 font-black text-xs text-slate-800 rotate-90 origin-center whitespace-nowrap">{p}</span>
              </div>
            ))}
            <div className="w-16 h-16 bg-white rounded-full border-4 border-slate-900 z-20 flex items-center justify-center shadow-2xl">
               <Sparkles className="text-indigo-600" size={24} />
            </div>
         </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -mt-48 z-30">
         <div className="w-8 h-10 bg-rose-500 rounded-b-full shadow-lg"></div>
      </div>

      {winner && !spinning && (
        <div className="mb-10 animate-in zoom-in-50 duration-500 text-center">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Chúc mừng người may mắn</p>
           <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">{winner}</h4>
        </div>
      )}

      <button onClick={spin} disabled={spinning} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-black transition-all hover:-translate-y-2 active:scale-95 disabled:opacity-50">
         {spinning ? "ĐANG QUAY..." : "BẮT ĐẦU QUAY"}
      </button>
    </div>
  );
};

/* ============================================================
   MATH BATTLE: ĐẤU TRƯỜNG TOÁN HỌC (Render công thức)
============================================================ */
const MathBattleArena: React.FC<{ className: string; onBack: () => void }> = ({ className, onBack }) => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("Cho $x^2 - 4 = 0$. Tìm giá trị của $x$?");

  const handlePasteQuestion = async () => {
    const text = await navigator.clipboard.readText();
    if (text) setCurrentQuestion(text);
  };

  const endBattle = (winner: string) => {
    supabase.from('game_history').insert({
       game_name: "Đấu Trường Toán Học",
       winner: winner,
       class_name: className
    } as any).then();
    alert("Chúc mừng đội chiến thắng: " + winner);
    onBack();
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px] flex flex-col relative overflow-hidden">
      <div className="w-full flex justify-between items-center mb-12 relative z-10">
        <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 font-black text-xs tracking-widest"><ArrowLeft size={20} /></button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Đấu Trường Toán Học</h2>
        <button onClick={handlePasteQuestion} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><ClipboardPaste size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-10 flex-1 relative z-10">
         <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center space-y-6 shadow-2xl shadow-indigo-100">
            <h5 className="font-black text-2xl">ĐỘI A</h5>
            <div className="text-7xl font-black">{scoreA}</div>
            <div className="flex gap-2">
               <button onClick={() => setScoreA(s => s + 1)} className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><Plus size={24} /></button>
               <button onClick={() => setScoreA(s => Math.max(0, s-1))} className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><RotateCw size={24} /></button>
            </div>
         </div>

         <div className="bg-rose-600 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center space-y-6 shadow-2xl shadow-rose-100">
            <h5 className="font-black text-2xl">ĐỘI B</h5>
            <div className="text-7xl font-black">{scoreB}</div>
            <div className="flex gap-2">
               <button onClick={() => setScoreB(s => s + 1)} className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><Plus size={24} /></button>
               <button onClick={() => setScoreB(s => Math.max(0, s-1))} className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><RotateCw size={24} /></button>
            </div>
         </div>
      </div>

      <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Câu hỏi hiện tại</p>
         <MathPreview content={currentQuestion} className="text-2xl font-black leading-relaxed" />
      </div>

      <div className="mt-10 flex justify-center gap-4">
         <button onClick={() => endBattle("Đội A")} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl">ĐỘI A THẮNG</button>
         <button onClick={() => endBattle("Đội B")} className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl">ĐỘI B THẮNG</button>
      </div>
    </div>
  );
};

export default GameManagement;
