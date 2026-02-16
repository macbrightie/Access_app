'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface CopyToastProps {
    show: boolean
    message: string
    onClose: () => void
}

export function CopyToast({ show, message, onClose }: CopyToastProps) {
    React.useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [show, onClose])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-[#1F1F1F] text-white rounded-xl shadow-2xl border border-white/5 min-w-[300px]"
                >
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-sm font-medium">{message}</span>
                    <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 1L9 9M9 1L1 9" />
                        </svg>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
