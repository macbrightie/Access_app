'use client'

import { cn } from "@/lib/utils"
import Image from "next/image"

export function CustomLoader({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8", className)}>
            <div className="relative w-24 h-12 animate-logo-bounce">
                <Image
                    src="/icons/Access_logo.svg"
                    alt="Loading..."
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            <style jsx global>{`
                @keyframes logo-bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-6px);
                    }
                }
                .animate-logo-bounce {
                    animation: logo-bounce 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
