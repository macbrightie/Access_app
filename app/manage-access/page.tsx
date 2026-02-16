'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyToken } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function ManageAccessPage() {
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleAccess() {
        if (!token.trim()) {
            setError('Please enter a token')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await verifyToken(token.trim())
            if (result.success && result.slug) {
                router.push(`/manage/${result.slug}?token=${token.trim()}`)
            } else {
                setError(result.error || 'Invalid token')
                setLoading(false)
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <Link
                href="/"
                className="text-gray-500 hover:text-black gap-2 hover:bg-transparent flex items-center self-center"
            >
                <ArrowLeft className="w-4 h-4" /> Go back
            </Link>

            <div className="space-y-4">
                <h1 className="text-4xl font-normal tracking-tight text-black font-tex-gyre">Manage File</h1>
                <p className="text-gray-500">Enter your token to allow you manage your file.</p>
            </div>

            <div className="w-full space-y-4">
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your token to manage your file"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-black transition-all text-center placeholder:text-gray-400"
                />

                {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900 text-left">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handleAccess}
                    disabled={loading}
                    className="w-48 rounded-full h-11 bg-black hover:bg-gray-900 text-white font-medium"
                >
                    {loading ? 'Verifying...' : 'Access file'}
                </Button>
            </div>

            <div className="space-y-4 text-xs text-gray-500">
                <p>
                    If you can't find this token, go to your<br />
                    WhatsApp and search for <span className="font-bold text-black">"Access itoken"</span>
                </p>
                <p>
                    also, If you're having any issue reach out to<br />
                    <a href="mailto:hello.brightmac@gmail.com" className="font-bold text-black underline underline-offset-2">
                        me via email
                    </a>
                </p>
            </div>
        </div>
    )
}
