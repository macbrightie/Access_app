'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { generateSlug, isValidSlug, MAX_SLUG_LENGTH } from '@/lib/slug-utils'
import { uploadFile, checkSlugAvailability } from '@/app/actions'
import { FileUploadResponse } from '@/types/file'
import { AlertTriangle, ArrowLeft, FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { FileIcon } from '@/components/ui/file-icon'

import { FluidButton } from '@/components/ui/fluid-button'
import { CopyToast } from '@/components/ui/copy-toast'

// Submit button component
// Submit button removed in favor of direct usage with progress state logic

export default function UploadForm() {
    const [slug, setSlug] = useState('')
    const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successData, setSuccessData] = useState<FileUploadResponse | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [progress, setProgress] = useState(0)

    // Toast State
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setToastMessage(`${label} has been copied`)
        setShowToast(true)
    }

    // Debounce slug check
    useEffect(() => {
        const check = async () => {
            if (!slug || slug.length < 3) {
                setSlugAvailability('idle')
                return
            }

            setSlugAvailability('checking')
            // Add slight delay to avoid rapid requests and show spinner
            await new Promise(r => setTimeout(r, 500))

            const result = await checkSlugAvailability(slug)
            if (result.available) {
                setSlugAvailability('available')
            } else {
                setSlugAvailability('taken')
            }
        }

        const timeoutId = setTimeout(check, 500)
        return () => clearTimeout(timeoutId)
    }, [slug])

    // Auto-generate slug on mount REMOVED - User wants empty state
    // useEffect(() => {
    //     setSlug(generateSlug())
    // }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (slugAvailability === 'checking') {
            // wait or return? 
            return
        }

        setError(null)
        setSuccessData(null)
        setProgress(0)

        // Manual validations using State
        if (!file) {
            setError('Please select a file')
            return
        }
        if (file.size > 50 * 1024 * 1024) {
            setError('File is too large (max 50MB)')
            return
        }

        // Strict Requirement: User MUST edit URL
        if (!slug || slug.trim() === '') {
            setError('You have to edit your URL before uploading the file')
            return
        }

        if (slugAvailability === 'taken') {
            setError('URL is taken')
            return
        }

        if (!isValidSlug(slug)) {
            setError('Invalid slug')
            return
        }

        // Simulate Progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return 90
                const inc = prev < 50 ? 5 : 2
                return prev + inc
            })
        }, 100)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('slug', slug)

            const result = await uploadFile(null, formData)

            clearInterval(interval)
            setProgress(100)

            // Slight delay to show 100% before transitioning
            await new Promise(r => setTimeout(r, 400))

            if (result.success) {
                setSuccessData(result)
            } else {
                setError(result.error || 'Something went wrong')
                setProgress(0)
            }
        } catch (err) {
            clearInterval(interval)
            setProgress(0)
            setError('Network error or server failed')
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            // Update the hidden input
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(e.dataTransfer.files[0])
                fileInputRef.current.files = dataTransfer.files
            }
        }
    }

    // Success State
    if (successData && successData.slug && successData.edit_token) {
        const fullPublicLink = `${window.location.origin}/${successData.slug}`
        const manageLink = `${window.location.origin}/manage/${successData.slug}?token=${successData.edit_token}`
        const whatsappText = `🔗 Your file is live!

Public link:
${fullPublicLink}

Manage URL:
${manageLink}

iToken:
${successData.edit_token}

This public link stays the same even if you replace the file.

⚠️ Save this message.
If you lose the manage URL or iToken, you cannot edit the file.

Access Team`
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

        return (
            <>
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

                    {/* 1. Go Back Button - Centered */}
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSuccessData(null)
                            setSlug('')
                            setFile(null)
                        }}
                        className="text-gray-500 hover:text-black gap-2 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go back
                    </Button>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-normal tracking-tight text-black font-tex-gyre">Your Link is Ready</h1>
                        <p className="text-gray-500">Copy and manage your link as you'd prefer.</p>
                    </div>

                    {/* 2. Public Link Pill - Updated Design */}
                    <div className="flex items-center gap-3 bg-white rounded-full border border-gray-100 p-1 pl-4 pr-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-auto min-w-[320px]">
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full">
                            <Image src="/icons/link.svg" alt="" width={14} height={14} className="opacity-50" />
                        </div>

                        <div className="flex items-center gap-1.5 text-black font-medium text-lg tracking-tight">
                            <span className="opacity-40 font-normal">onlyaccessme.vercel.app/</span>
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded-md">{successData.slug}</span>
                        </div>

                        <div className="ml-auto pl-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full h-10 w-10 hover:bg-gray-50 border border-gray-200"
                                onClick={() => handleCopy(fullPublicLink, 'Link')}
                            >
                                <Image src="/icons/file-copy-big.svg" alt="Copy" width={20} height={20} />
                            </Button>
                        </div>
                    </div>

                    {/* 3. Token Card - Dark Theme */}
                    <div className="w-full max-w-xl bg-[#1A1A1A] text-white rounded-2xl p-8 space-y-6 shadow-2xl border border-gray-800 relative overflow-hidden">
                        {/* Glossy highlight */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 opacity-20" />

                        <div className="space-y-2 relative z-10">
                            <h3 className="text-lg font-medium tracking-wide">Save this i-token</h3>
                            <p className="text-gray-400 text-xs">Losing it means you cannot manage this file.</p>
                        </div>

                        <div className="bg-[#111] rounded-xl p-6 border border-[#333] relative group">
                            <code className="text-[#ccff00] text-xs whitespace-nowrap font-mono tracking-wide">
                                {manageLink}
                            </code>
                        </div>
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="flex gap-4 w-full justify-center">
                        <Button
                            variant="outline"
                            className="rounded-full h-11 px-6 gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                            onClick={() => handleCopy(successData.edit_token || '', 'i-token')}
                        >
                            <Image src="/icons/file-copy-sm.svg" alt="" width={16} height={16} />
                            <span className="text-sm font-medium">Copy i-token</span>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full h-11 px-6 gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <Image src="/icons/whatsapp-sm.svg" alt="" width={16} height={16} />
                                <span className="text-sm font-medium">Save to whatsapp</span>
                            </a>
                        </Button>
                    </div>
                </div>

                <CopyToast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
            </>
        )
    }

    // Upload State
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-black font-tex-gyre">
                    Create a link for your file
                </h1>
                <p className="text-gray-500 text-lg font-light">
                    Upload your file and get your link in return.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
                {/* Custom Dropzone */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "w-full h-64 border-2 border-dashed rounded-3xl bg-white transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center p-6 group relative overflow-hidden",
                        isDragging ? "border-black bg-gray-50 ring-4 ring-gray-100" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                        error ? "border-red-500 bg-red-50" : ""
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileIcon filename={file.name} className="w-16 h-16" />
                            <div className="space-y-1">
                                <p className="font-medium text-black">{file.name}</p>
                                <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 relative flex items-center justify-center mb-2">
                                <Image
                                    src="/icons/duo-icons_folder-open.svg"
                                    alt="Upload"
                                    width={64}
                                    height={64}
                                    className=""
                                />
                            </div>
                            <div className="space-y-2 z-10">
                                <p className="font-bold text-black text-base group-hover:scale-105 transition-transform">
                                    Drop your files here or click here to upload
                                </p>
                                <p className="text-sm text-gray-500 font-medium">
                                    Upload any file you want. however size limit is 50MB
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Slug Input - Matching Design */}
                {/* Slug Input - Matching Design */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 justify-center">
                        {/* Link Icon Circle */}
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                            <Image src="/icons/link.svg" alt="" width={16} height={16} className="opacity-60" />
                        </div>

                        {/* Domain Text */}
                        <span className="text-sm font-medium text-gray-900">onlyaccessme.vercel.app/</span>

                        {/* Edit Link Input */}
                        <div className="relative">
                            <input
                                name="slug"
                                value={slug}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                    if (val.length <= MAX_SLUG_LENGTH) setSlug(val)
                                }}
                                placeholder="edit link"
                                className={cn(
                                    "h-10 pl-4 pr-10 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-black w-40 transition-all text-center bg-white shadow-sm placeholder:text-gray-400",
                                    slugAvailability === 'taken' || error?.includes('edit your URL')
                                        ? "border-red-500 focus:border-red-500 ring-red-200 text-red-900"
                                        : slugAvailability === 'available'
                                            ? "border-green-500 focus:border-green-500 ring-green-200 text-green-900"
                                            : "border-gray-200 focus:border-black"
                                )}
                            />

                            {/* Status Icon */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {slugAvailability === 'checking' && (
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                                )}
                                {slugAvailability === 'available' && (
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                                {(slugAvailability === 'taken' || error?.includes('edit your URL')) && (
                                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px]">!</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Validation Message Below Input */}
                    <div className="h-6">
                        {slugAvailability === 'taken' && (
                            <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                URL is taken
                            </p>
                        )}
                        {error?.includes('edit your URL') && (
                            <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                You have to edit your URL before uploading the file
                            </p>
                        )}
                    </div>
                </div>

                {error && !error.includes('edit your URL') && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <FluidButton
                    pending={progress > 0}
                    progress={progress}
                >
                    Upload file
                </FluidButton>
            </form>
        </div>
    )
}
