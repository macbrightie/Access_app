import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4 select-none">
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <h1 className="text-[12rem] font-bold leading-none tracking-tighter opacity-5 font-tex-gyre select-none">
                    404
                </h1>
                <div className="space-y-2 relative -top-20">
                    <h2 className="text-3xl font-medium tracking-tight">Page not found</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="relative -top-10">
                    <Button asChild className="rounded-full bg-black hover:bg-zinc-800 text-white px-8 h-12">
                        <Link href="/" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
