
import React, { useState, useRef, useCallback, createContext, useContext, memo } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Sparkles, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const ToastCard = memo(({ toast, onClose }: { toast: ToastItem; onClose: () => void }) => {
  const config = {
    success: { icon: <CheckCircle2 size={20} />, styles: "bg-emerald-600 text-white shadow-emerald-200" },
    error: { icon: <AlertCircle size={20} />, styles: "bg-rose-600 text-white shadow-rose-200" },
    warning: { icon: <AlertTriangle size={20} />, styles: "bg-amber-500 text-white shadow-amber-200" },
    info: { icon: <Sparkles size={20} />, styles: "bg-indigo-600 text-white shadow-indigo-200" },
  }[toast.type];

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, x: 50, scale: 0.8, rotate: 5 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      className={`pointer-events-auto relative flex items-center gap-4 px-8 py-5 rounded-[2rem] shadow-2xl border border-white/20 min-w-[320px] ${config.styles}`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">{config.icon}</div>
      <p className="text-sm font-black tracking-tight flex-1">{toast.message}</p>
      <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={16} /></button>
    </MotionDiv>
  );
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, any>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-10 right-10 z-[9999] flex flex-col gap-4 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
