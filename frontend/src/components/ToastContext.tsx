"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function SingleToast({
  id,
  message,
  type,
  onDismiss,
}: ToastItem & { onDismiss: (id: string) => void }) {
  const styles: Record<ToastType, string> = {
    error: "bg-red-950/95 border-red-800 text-red-100",
    success: "bg-green-950/95 border-green-800 text-green-100",
    info: "bg-purple-950/95 border-purple-800 text-purple-100",
  };

  const icons: Record<ToastType, React.ReactNode> = {
    error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
    success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    info: <Info size={16} className="text-purple-400 shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles[type]} max-w-sm shadow-xl`}
    >
      {icons[type]}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <SingleToast key={t.id} {...t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
