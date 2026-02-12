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

interface GameManagementProps {
  classes: Class[];
}

type GameId = "duck-race" | "lucky-wheel" | "math-battle";

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
          "Chọn ngẫu nhiên học sinh trả lời câu hỏi hoặc nhận thưởng.",
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
            trò chơi
          </p>
        </div>
      )}
    </div>
  );
};

/* =========================
   DUCK RACE
========================= */

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
    useState<boolean>(false);
  const [ducks, setDucks] =
    useState<Duck[]>([
      {
        id: 1,
        name: "Trâm Anh",
        progress: 0,
      },
      {
        id: 2,
        name: "Minh Khang",
        progress: 0,
      },
      {
        id: 3,
        name: "Bảo Ngọc",
        progress: 0,
      },
    ]);

  const timerRef =
    useRef<NodeJS.Timeout | null>(null);

  const startRace = useCallback(() => {
    if (racing) return;

    setRacing(true);

    timerRef.current = setInterval(() => {
      setDucks((prev) =>
        prev.map((d) => ({
          ...d,
          progress: Math.min(
            100,
            d.progress +
              Math.random() * 8 +
              2
          ),
        }))
      );
    }, 200);

    setTimeout(() => {
      if (timerRef.current)
        clearInterval(
          timerRef.current
        );
      setRacing(false);
    }, 5000);
  }, [racing]);

  const resetRace = useCallback(() => {
    if (racing) return;
    setDucks((prev) =>
      prev.map((d) => ({
        ...d,
        progress: 0,
      }))
    );
  }, [racing]);

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
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>

        <h2 className="font-black text-yellow-500 text-lg">
          Đua Vịt – {className}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={resetRace}
            disabled={racing}
            className="p-2 rounded-xl border hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={startRace}
            disabled={racing}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold disabled:opacity-50 transition"
          >
            <Play size={16} /> Đua
          </button>
        </div>
      </div>

      {ducks.map((d) => (
        <div
          key={d.id}
          className="mb-4"
        >
          <div className="flex justify-between text-sm font-semibold mb-1">
            <span>{d.name}</span>
            <span>
              {Math.round(d.progress)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-yellow-400 rounded-full transition-all duration-200"
              style={{
                width: `${d.progress}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* =========================
   LUCKY WHEEL
========================= */

const LuckyWheelArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  const [spinning, setSpinning] =
    useState<boolean>(false);
  const [winner, setWinner] =
    useState<string | null>(null);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    setTimeout(() => {
      setWinner(
        "🎉 Một học sinh may mắn!"
      );
      setSpinning(false);
    }, 2000);
  }, [spinning]);

  return (
    <div className="relative bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm animate-in fade-in">
      <button
        onClick={onBack}
        className="absolute left-6 top-6 text-slate-400 hover:text-indigo-600 transition"
      >
        <ArrowLeft size={20} />
      </button>

      <h2 className="text-3xl font-black text-purple-600 mb-8">
        Vòng quay – {className}
      </h2>

      {winner && (
        <div className="mb-6 text-2xl font-black text-emerald-600">
          {winner}
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning}
        className="px-12 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-lg disabled:opacity-50 transition"
      >
        {spinning
          ? "Đang quay..."
          : "Quay ngay"}
      </button>
    </div>
  );
};

/* =========================
   MATH BATTLE
========================= */

const MathBattleArena: React.FC<{
  className: string;
  onBack: () => void;
}> = ({ className, onBack }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm text-center animate-in fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <h2 className="text-3xl font-black text-blue-600 mb-4">
        Đấu trường – {className}
      </h2>

      <p className="text-slate-500">
        Tính năng đang được nâng cấp
        cho chế độ thi đấu trực tiếp
        realtime.
      </p>
    </div>
  );
};

export default GameManagement;
