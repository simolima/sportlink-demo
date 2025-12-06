'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import ToastNotification, { Toast, ToastType } from '@/components/toast-notification'

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (type: ToastType, title: string, message: string, duration?: number) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, title, message, duration }])
  }

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
