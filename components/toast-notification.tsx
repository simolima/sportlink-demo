'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message: string
  duration?: number
}

interface ToastNotificationProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const bgColor = {
    success: 'bg-success/10 border-success',
    error: 'bg-error/10 border-error',
    info: 'bg-info/10 border-info',
    warning: 'bg-warning/10 border-warning',
  }[toast.type]

  const textColor = {
    success: 'text-success',
    error: 'text-error',
    info: 'text-info',
    warning: 'text-warning',
  }[toast.type]

  const iconColor = {
    success: 'text-success',
    error: 'text-error',
    info: 'text-info',
    warning: 'text-warning',
  }[toast.type]

  return (
    <div
      className={`${bgColor} ${textColor} border rounded-lg shadow-lg p-4 flex items-start gap-3 transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
        }`}
    >
      <div className={`${iconColor} font-bold text-lg`}>
        {toast.type === 'success' && '✓'}
        {toast.type === 'error' && '✕'}
        {toast.type === 'info' && 'ℹ'}
        {toast.type === 'warning' && '⚠'}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{toast.title}</h4>
        <p className="text-xs mt-1 opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onDismiss(toast.id), 300)
        }}
        className={`${iconColor} hover:opacity-70 transition-opacity`}
      >
        <X size={16} />
      </button>
    </div>
  )
}
