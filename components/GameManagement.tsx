import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ChevronDown,
  Gamepad2,
  Trophy,
  Target,
  Dices,
  Play,
  ArrowLeft,
  RotateCw,
} from "lucide-react";
import { Class } from "../types";

/* =========================
   TYPES
========================= */

type GameId = "duck-race" | "lucky-wheel" | "math-battle";

interface GameManagementProps {
  classes: Class[];
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

const GameManagement: React.FC<GameManagementProps> = ({
  classes,
}) => {
  const [selectedClassId, setSelectedClassId] =
    useState<string>("");
  const [activeGameId, setActiveGameId] =
    useState<GameId | null>(null);

  const selectedClass = useMemo(
    () =>
      classes.find(
        (c) => c.id === selectedClassId
      ) ?? null,
    [classes, selectedClassId]
  );

  const games = useMemo(
    () => [
      {
        id: "duck-race" as GameId,
        title: "Trò chơi Đua vịt",
        description:
          "Thi đua giải toán nhanh để đưa vịt về đích sớm nhất.",
        gradient:
          "from-yellow-400 to-orange-500",
        icon: (
          <Target
            size={32}
            className="text-white"
          />
        ),
      },
      {
        id: "lucky-wheel" as GameId,
        title: "Quay số may mắn",
        description:
          "Chọn ngẫu nhiên học sinh trả lời câu hỏi.",
        gradient:
          "from-purple-500 to-indigo-600",
        icon: (
          <Dices
            size={32}
            className="text-white"
          />
        ),
      },
      {
        id: "math-battle" as GameId,
        title: "Đấu trường Toán học",
        description:
          "Chia đội đối kháng trực tiếp trên bảng điểm.",
        gradient:
          "from-blue-500 to-cyan-600",
        icon: (
          <Trophy
            size={32}
            className="text-white"
          />
        ),
      },
    ],
    []
  );

  /* =========================
     ROUTER GAME
  ========================= */

  if (
    activeGameId === "duck-race" &&
    selectedClass
  ) {
    return (
      <DuckRaceArena
        className={selectedClass.name}
        onBack={() =>
          setActiveGameId(null)
        }
      />
    );
  }

  if (
    activeGameId === "lucky-wheel" &&
    selectedClass
  ) {
    return (
      <LuckyWheelArena
        className={selectedClass.name}
        onBack={() =>
          setActiveGameId(null)
        }
      />
    );
  }

  if (
    activeGameId === "math-battle" &&
    selectedClass
  ) {
    return (
      <MathBattleArena
        className={selectedClass.name}
        onBack={() =>
          setActiveGameId(null)
        }
      />
    );
  }

  /* =========================
     DEFAULT SCREEN
  ========================= */

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* SELECT CLASS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="text-xs font-black text-indigo-600 uppercase tracking-widest">
          Chọn lớp học
        </label>

        <div className="relative mt-3">
          <select
            value={selectedClassId}
            onChange={(e) =>
              setSelectedClassId(
                e.target.value
              )
            }
            className="w-full border border-slate-200 rounded-xl px-4 py-3 appearance-none font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          >
            <option value="">
              -- Chọn lớp --
            </option>
            {classes.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* GAME LIST */}
      {selectedClass ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-4 shadow-md`}
              >
                {game.icon}
              </div>

              <h4 className="font-black text-lg text-slate-800 mb-1">
                {game.title}
              </h4>

              <p className="text-sm text-slate-500 mb-6 leading-relaxed min-h-[60px]">
                {game.description}
              </p>

              <button
                onClick={() =>
                  setActiveGameId(
                    game.id
                  )
                }
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
              >
                <Play size={16} />
                Bắt đầu
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-24">
          <Gamepad2
            size={64}
            className="mx-auto mb-4 opacity-30"
          />
          <p className="font-bold">
            Vui lòng chọn lớp để bắt đầu
          </p>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   DUCK RACE ARENA
============================================================ */

interface Duck {
  id: number;
  name: string;
  progress: number;
}

const DuckRaceArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  const [racing, setRacing] =
    useState(false);
  const [winner, setWinner] =
    useState<string | null>(null);

  const [ducks, setDucks] =
    useState<Duck[]>([
      { id: 1, name: "Trâm Anh", progress: 0 },
      { id: 2, name: "Minh Khang", progress: 0 },
      { id: 3, name: "Bảo Ngọc", progress: 0 },
    ]);

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const startRace = () => {
    if (racing) return;

    setWinner(null);
    setRacing(true);

    timerRef.current = setInterval(() => {
      setDucks((prev) =>
        prev.map((d) => ({
          ...d,
          progress: Math.min(
            100,
            d.progress +
              Math.random() * 10
          ),
        }))
      );
    }, 150);
  };

  useEffect(() => {
    if (!racing) return;

    const checkWinner = setInterval(() => {
      setDucks((prev) => {
        const win = prev.find(
          (d) => d.progress >= 100
        );
        if (win) {
          setWinner(win.name);
          setRacing(false);
          if (timerRef.current)
            clearInterval(
              timerRef.current
            );
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(checkWinner);
  }, [racing]);

  const resetRace = () => {
    if (racing) return;
    setWinner(null);
    setDucks((prev) =>
      prev.map((d) => ({
        ...d,
        progress: 0,
      }))
    );
  };

  useEffect(() => {
    return () => {
      if (timerRef.current)
        clearInterval(
          timerRef.current
        );
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm animate-in fade-in">
      <div className="flex justify-between mb-8">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <h2 className="font-black text-yellow-500">
          Đua Vịt – {className}
        </h2>
      </div>

      {winner && (
        <div className="mb-6 text-xl font-black text-emerald-600 text-center">
          🎉 Người thắng: {winner}
        </div>
      )}

      {ducks.map((d) => (
        <div key={d.id} className="mb-4">
          <div className="flex justify-between text-sm font-semibold mb-1">
            <span>{d.name}</span>
            <span>{Math.round(d.progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-yellow-400 transition-all duration-150"
              style={{
                width: `${d.progress}%`,
              }}
            />
          </div>
        </div>
      ))}

      <div className="flex gap-4 mt-6">
        <button
          onClick={resetRace}
          className="px-4 py-2 border rounded-xl"
        >
          Reset
        </button>

        <button
          onClick={startRace}
          disabled={racing}
          className="px-6 py-2 bg-yellow-500 text-white rounded-xl font-bold disabled:opacity-50"
        >
          Bắt đầu
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   LUCKY WHEEL
============================================================ */

const LuckyWheelArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  const students = [
    "Trâm Anh",
    "Minh Khang",
    "Bảo Ngọc",
    "Gia Huy",
  ];

  const [winner, setWinner] =
    useState<string | null>(null);
  const [spinning, setSpinning] =
    useState(false);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    setTimeout(() => {
      const random =
        students[
          Math.floor(
            Math.random() *
              students.length
          )
        ];
      setWinner(random);
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm animate-in fade-in">
      <button
        onClick={onBack}
        className="mb-6 text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={20} />
      </button>

      <h2 className="text-3xl font-black text-purple-600 mb-6">
        Vòng quay – {className}
      </h2>

      {winner && (
        <div className="mb-6 text-2xl font-black text-emerald-600">
          🎉 {winner}
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black disabled:opacity-50"
      >
        {spinning
          ? "Đang quay..."
          : "Quay ngay"}
      </button>
    </div>
  );
};

/* ============================================================
   MATH BATTLE
============================================================ */

const MathBattleArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm animate-in fade-in">
      <button
        onClick={onBack}
        className="mb-6 text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
      </button>

      <h2 className="text-3xl font-black text-blue-600 mb-4">
        Đấu trường – {className}
      </h2>

      <p className="text-slate-500">
        Sắp tích hợp realtime Supabase
        để thi đấu trực tiếp.
      </p>
    </div>
  );
};

export default GameManagement;
