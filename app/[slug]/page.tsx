import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

// Force dynamic to ensure DB check happens on every request
export const dynamic = 'force-dynamic'

export default async function FilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const { data: file, error } = await supabaseAdmin
        .from('files')
        .select('file_path, is_public')
        .eq('slug', slug)
        .single()

    if (error || !file) {
        notFound()
    }

    // If public, redirect to the storage URL
    if (file.is_public) {
        const { data } = supabaseAdmin.storage.from('files').getPublicUrl(file.file_path)
        if (data.publicUrl) {
            redirect(data.publicUrl)
        }
    }

    // If private, show the "Cool" Private Page
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center space-y-8 animate-in fade-in zoom-in duration-500">

                {/* Icon Wrapper */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-gray-100 rounded-full scale-110 animate-pulse" />
                    <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm z-10">
                        <Lock className="w-10 h-10 text-gray-900" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-black font-tex-gyre">
                        Access Restricted
                    </h1>
                    <p className="text-gray-500 text-lg font-light leading-relaxed max-w-md mx-auto">
                        This file has been made private by the owner.
                        Please reach out to them if you believe this is a mistake.
                    </p>
                </div>

                <div className="pt-8 flex justify-center gap-4">
                    <Button asChild variant="default" className="rounded-full bg-black text-white hover:bg-gray-900 h-12 px-8">
                        <Link href="/">
                            Go back home
                        </Link>
                    </Button>
                </div>

                <div className="pt-12">
                    <Image
                        src="/icons/Access_logo.svg"
                        alt="Access"
                        width={80}
                        height={32}
                        className="opacity-20 mx-auto grayscale"
                    />
                </div>
            </div>
        </div>
    )
}
