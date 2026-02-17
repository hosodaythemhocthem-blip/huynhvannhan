// components/Toast.tsx
import React, {
  useState,
  useRef,
  useCallback,
  createContext,
  useContext,
  memo,
  useEffect,
} from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div;

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};

const ToastCard = memo(
  ({
    toast,
    onClose,
  }: {
    toast: ToastItem;
    onClose: () => void;
  }) => {
    const config = {
      success: {
        icon: <CheckCircle2 size={20} />,
        styles: "bg-emerald-600 text-white",
      },
      error: {
        icon: <AlertCircle size={20} />,
        styles: "bg-rose-600 text-white",
      },
      warning: {
        icon: <AlertTriangle size={20} />,
        styles: "bg-amber-500 text-white",
      },
      info: {
        icon: <Sparkles size={20} />,
        styles: "bg-indigo-600 text-white",
      },
    }[toast.type];

    return (
      <MotionDiv
        layout
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.25 }}
        className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl min-w-[300px] ${config.styles}`}
      >
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          {config.icon}
        </div>

        <p className="text-sm font-semibold flex-1">
          {toast.message}
        </p>

        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition"
        >
          <X size={16} />
        </button>
      </MotionDiv>
    );
  }
);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));

    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();

      setToasts((prev) => [...prev, { id, message, type }]);

      timers.current[id] = setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
