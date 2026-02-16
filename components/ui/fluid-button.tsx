'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { playClickSound, playHoverSound } from '@/lib/sounds'
import { Button } from '@/components/ui/button'

interface FluidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    pending?: boolean
    progress?: number // 0 to 100
}

export function FluidButton({ className, children, pending, progress = 0, onClick, ...props }: FluidButtonProps) {

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        playClickSound()
        onClick?.(e)
    }

    const handleMouseEnter = () => {
        playHoverSound()
    }

    return (
        <motion.button
            type="submit"
            className={cn(
                "relative w-full h-12 rounded-full overflow-hidden group border border-transparent",
                "bg-black text-white font-medium text-base",
                className
            )}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={pending}
            {...(props as any)}
        >
            {/* Base Background (Black) */}
            <div className="absolute inset-0 bg-black z-0" />

            {/* Simulated Water Fill Progress Bar */}
            <motion.div
                className="absolute inset-y-0 left-0 z-10"
                style={{
                    background: "linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)", // Watery blue gradient
                    backgroundSize: "200% 100%",
                }}
                initial={{ width: "0%" }}
                animate={{
                    width: `${progress}%`,
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                    width: { duration: 0.3, ease: "easeOut" },
                    backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
            />

            {/* Content Layer */}
            <span className="relative z-20 flex items-center justify-center gap-2 mix-blend-normal">
                {pending ? (
                    <>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </>
                ) : children}
            </span>
        </motion.button>
    )
}
