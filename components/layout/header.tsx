'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CopyToast } from '@/components/ui/copy-toast'

export function Header() {
    const pathname = usePathname()
    const isManagePage = pathname === '/manage-access'

    const [showToast, setShowToast] = useState(false)

    return (
        <header className="fixed top-0 w-full flex items-center justify-between px-6 py-6 bg-transparent z-50">
            <Link href="/" className="flex items-center gap-1">
                <Image src="/icons/Access_logo.svg" alt="Access" width={100} height={40} className="h-10 w-auto" />
            </Link>

            <div className="flex items-center gap-6">
                <Link
                    href={isManagePage ? '#' : '/manage-access'}
                    className={cn(
                        "text-sm transition-colors flex items-center gap-2",
                        isManagePage ? "text-gray-300 cursor-default pointer-events-none" : "text-gray-600 hover:text-black"
                    )}
                    aria-disabled={isManagePage}
                >
                    <Image src="/icons/managefile.svg" alt="" width={16} height={16} className={cn("w-4 h-4", isManagePage && "opacity-30")} />
                    Manage file
                </Link>
                <Button
                    variant="outline"
                    className="hidden md:flex rounded-full gap-2 text-sm font-normal px-4 py-2 border-gray-200 shadow-sm hover:bg-gray-50 bg-white"
                    onClick={() => setShowToast(true)}
                >
                    <Image src="/icons/Chrome.svg" alt="" width={16} height={16} className="w-4 h-4" />
                    Install Extension
                </Button>
            </div>

            <CopyToast
                show={showToast}
                message="Coming soon! This extension will be live in a few days."
                onClose={() => setShowToast(false)}
            />
        </header>
    )
}
