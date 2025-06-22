"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Automatické odstranění po 5 sekundách
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500 border-green-600 text-white";
      case "error":
        return "bg-red-500 border-red-600 text-white";
      case "info":
        return "bg-blue-500 border-blue-600 text-white";
      default:
        return "bg-gray-500 border-gray-600 text-white";
    }
  };

  return (
    <div
      className={cn(
        "flex w-80 items-center justify-between rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out",
        getToastStyles(),
      )}
    >
      <div className="flex-1">
        <h4 className="font-semibold">{toast.title}</h4>
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 rounded-full p-1 transition-colors hover:bg-white/20"
      >
        <X size={16} />
      </button>
    </div>
  );
}
