'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { getFileDetails, toggleFilePrivacy, updateFileSlug, regenerateFileToken, prepareReplace, completeReplace } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowLeft, Copy, ExternalLink, RefreshCw, FileText, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CopyToast } from '@/components/ui/copy-toast'
import { CustomLoader } from '@/components/ui/custom-loader'
import { FileIcon } from '@/components/ui/file-icon'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"

// Mock icons for now if not available, replacing with Lucide/Image
// The user provided designs use specific icons. I will try to use Image if I can guess path, or Lucide as fallback.

export default function ManageFilePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const params = useParams()

    // useParams returns string or string[]
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : ''
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [fileData, setFileData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    // Form States
    const [isPrivate, setIsPrivate] = useState(false)
    const [editLinkSlug, setEditLinkSlug] = useState('')

    // Toast
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    useEffect(() => {
        if (!slug) return

        if (!token) {
            setError('Missing access token')
            setLoading(false)
            return
        }

        const fetchFile = async () => {
            try {
                const result = await getFileDetails(slug, token)
                if (result.success) {
                    setFileData(result.file)
                    setIsPrivate(!result.file.is_public)
                    setEditLinkSlug(result.file.slug)
                } else {
                    setError(result.error || 'Failed to verify credentials')
                }
            } catch (err) {
                setError('Failed to load file details')
            } finally {
                setLoading(false)
            }
        }

        fetchFile()
    }, [slug, token])

    // Toast query param check
    useEffect(() => {
        if (searchParams.get('toast') === 'link-updated') {
            setToastMessage('Link updated successfully')
            setShowToast(true)
            // Clean up URL
            router.replace(`/manage/${slug}?token=${token}`, { scroll: false })
        }
    }, [searchParams, slug, token, router])

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setToastMessage(`${label} copied`)
        setShowToast(true)
    }

    const [replacementFile, setReplacementFile] = useState<File | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleTogglePrivacy = async (checked: boolean) => {
        setIsPrivate(checked) // Optimistic
        const result = await toggleFilePrivacy(slug, token!, !checked) // checked=private, isPublic=!checked
        if (result.success) {
            setToastMessage(!checked ? 'Link made public' : 'Link made private')
            setShowToast(true)
        } else {
            setIsPrivate(!checked) // Revert
            setError(result.error || 'Failed to update privacy')
        }
    }

    const handleUpdateLink = async () => {
        if (!editLinkSlug || editLinkSlug === slug) return

        setIsUpdating(true)
        const result = await updateFileSlug(slug, token!, editLinkSlug)
        setIsUpdating(false)

        if (result.success) {
            // Redirect with toast flag
            router.push(`/manage/${result.newSlug}?token=${token}&toast=link-updated`)
        } else {
            setError(result.error || 'Failed to update link')
        }
    }

    const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)

    const handleRegenerateToken = async () => {
        setIsUpdating(true)
        const result = await regenerateFileToken(slug, token!)
        setIsUpdating(false)
        setIsRegenerateDialogOpen(false)

        if (result.success) {
            // Update URL with new token
            setToastMessage('Token regenerated successfully')
            setShowToast(true)
            router.push(`/manage/${slug}?token=${result.newToken}`)
        } else {
            setError(result.error || 'Failed to regenerate token')
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setReplacementFile(e.target.files[0])
        }
    }

    const handleReplaceFile = async () => {
        if (!replacementFile) return

        setIsUpdating(true)

        try {
            // 1. Prepare
            const prep = await prepareReplace(slug, token!, replacementFile.name, replacementFile.type)
            if (!prep.success || !prep.signedUrl || !prep.path) {
                setError(prep.error || 'Failed to prepare upload')
                setIsUpdating(false)
                return
            }

            // 2. Upload (Client Side)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', prep.signedUrl, true)
                xhr.setRequestHeader('Content-Type', replacementFile.type)
                xhr.onload = () => {
                    if (xhr.status === 200) resolve()
                    else reject(new Error(`Upload failed: ${xhr.status}`))
                }
                xhr.onerror = () => reject(new Error('Network error'))
                xhr.send(replacementFile)
            })

            // 3. Complete
            const result = await completeReplace(slug, token!, prep.path)

            setIsUpdating(false)

            if (result.success) {
                setReplacementFile(null)
                setToastMessage('File updated successfully')
                setShowToast(true)
                router.refresh()
            } else {
                setError(result.error || 'Failed to complete update')
            }

        } catch (err: any) {
            console.error(err)
            setIsUpdating(false)
            setError(err.message || 'Update failed')
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <CustomLoader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-300 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-100">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold text-black">Authentication Failed</h1>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>

                    <div className="pt-2">
                        <Button asChild className="rounded-full bg-black text-white hover:bg-gray-900 w-full h-12">
                            <Link href="/manage-access">Enter Token Again</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const fullPublicLink = `${window.location.origin}/${fileData.slug}`
    const manageLink = `${window.location.origin}/manage/${fileData.slug}?token=${token}`
    const whatsappText = `here is your new token: ${token}`
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Nav */}
            <Link
                href="/"
                className="text-gray-500 hover:text-black gap-2 hover:bg-transparent flex items-center self-center"
            >
                <ArrowLeft className="w-4 h-4" /> Go back
            </Link>

            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-black font-tex-gyre">Manage File</h1>
                <p className="text-gray-500">You can play around with file as you'd prefer here.</p>
            </div>

            {/* Main Dashboard Stack */}
            <div className="w-full space-y-4">

                {/* 1. Public Link Display */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 p-1 pl-4 pr-1 w-auto hover:shadow-md transition-shadow duration-300">
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full">
                            <Image src="/icons/link.svg" alt="" width={14} height={14} className="opacity-50" />
                        </div>

                        <span className="text-sm text-gray-500 font-medium">
                            onlyaccessme.vercel.app/
                            <span className="text-black bg-gray-100 px-2 py-0.5 rounded-md ml-1">{fileData.slug}</span>
                        </span>

                        <div className="ml-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full h-10 w-10 hover:bg-gray-50 border border-gray-200"
                                onClick={() => handleCopy(fullPublicLink, 'Link')}
                            >
                                <Image src="/icons/file-copy-big.svg" alt="Copy" width={20} height={20} className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>


                {/* 2. Replace File Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="bg-white rounded-2xl border border-gray-100 px-6 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <span className="text-base font-normal text-black font-tex-gyre">Replace file</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                                <FileIcon filename={replacementFile ? replacementFile.name : (fileData.file_path || 'file.pdf')} className="w-12 h-12" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {replacementFile ? replacementFile.name : (fileData.file_path.split('/').pop() || 'file.pdf')}
                                    </p>
                                    <p className="text-xs text-gray-400">{replacementFile ? 'Ready to upload' : 'Current file'}</p>
                                </div>
                                <label>
                                    <input type="file" className="hidden" onChange={handleFileSelect} />
                                    <div className="flex items-center gap-2 h-10 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 cursor-pointer transition-colors shadow-sm">
                                        <RefreshCw className="w-4 h-4" />
                                        Replace file
                                    </div>
                                </label>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* 3. Make Link Private Switch */}
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                    <span className="text-base font-normal text-black font-tex-gyre">Make link private</span>
                    <Switch checked={isPrivate} onCheckedChange={handleTogglePrivacy} className="scale-110 data-[state=checked]:bg-black" />
                </div>

                {/* 4. Regenerate Token Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="bg-white rounded-2xl border border-gray-100 px-6 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-normal text-black font-tex-gyre">Regenerate Token</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 space-y-4">
                            {/* Read-only token box */}
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 h-12">
                                <span className="text-sm text-gray-500 font-bakemono truncate flex-1">
                                    {manageLink}
                                </span>
                                <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-transparent" disabled={isUpdating}>
                                            <RefreshCw className={cn("w-4 h-4 text-gray-400", isUpdating && "animate-spin")} />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-white border-gray-100 rounded-3xl p-6">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-normal text-black">Regenerate Token?</DialogTitle>
                                            <DialogDescription className="text-gray-500">
                                                This will invalidate your current token immediately. You will need the new token to manage this file in the future.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="flex gap-2 sm:justify-end mt-4">
                                            <DialogClose asChild>
                                                <Button type="button" variant="ghost" className="rounded-full text-gray-500">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="button"
                                                onClick={handleRegenerateToken}
                                                className="rounded-full bg-red-500 hover:bg-red-600 text-white"
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? 'Regenerating...' : 'Yes, regenerate'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-6 pt-2">
                                <button
                                    className="flex items-center gap-2 text-sm font-medium text-black hover:opacity-70 transition-opacity"
                                    onClick={() => handleCopy(token || '', 'Token')}
                                >
                                    <Image src="/icons/file-copy-sm.svg" alt="" width={16} height={16} />
                                    Copy i-token
                                </button>

                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    <Image src="/icons/logos_whatsapp-icon.svg" alt="" width={16} height={16} />
                                    Save to whatsapp
                                </a>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* 5. Save Token to WhatsApp (Simple Link) */}
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between hover:shadow-md transition-shadow duration-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Image src="/icons/logos_whatsapp-icon.svg" alt="" width={20} height={20} className="w-5 h-5" />
                        <span className="text-base font-normal text-black font-tex-gyre">Save token to WhatsApp</span>
                    </div>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500">
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>

                {/* 6. Edit Link */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 hover:shadow-md transition-shadow duration-300">
                    <label className="text-sm font-medium text-gray-500 block mb-1">Edit Link:</label>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 shrink-0">
                            <Image src="/icons/link.svg" alt="" width={16} height={16} className="opacity-50" />
                        </div>

                        <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 h-12 bg-white focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden min-w-0">
                            <span className="text-sm text-gray-500 mr-1 shrink-0">onlyaccessme.vercel.app/</span>
                            <input
                                value={editLinkSlug}
                                onChange={(e) => setEditLinkSlug(e.target.value)}
                                className="flex-1 outline-none text-sm font-medium text-black bg-transparent min-w-[50px]"
                            />
                        </div>
                    </div>

                    {editLinkSlug !== slug && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                            <Button
                                onClick={handleUpdateLink}
                                disabled={isUpdating}
                                className="w-full rounded-full bg-white border border-gray-200 text-black hover:bg-gray-50 shadow-sm"
                            >
                                Save and copy
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Update Button */}
            {replacementFile && (
                <div className="w-full pt-4 animate-in fade-in slide-in-from-bottom-4">
                    <Button
                        onClick={handleReplaceFile}
                        disabled={isUpdating}
                        className="w-full h-14 rounded-full bg-[#111] hover:bg-black text-white text-lg font-medium shadow-xl"
                    >
                        {isUpdating ? 'Updating...' : 'Update file'}
                    </Button>
                </div>
            )}

            {!replacementFile && (
                <div className="w-full pt-4 grayscale opacity-50 pointer-events-none">
                    <Button
                        className="w-full h-14 rounded-full bg-[#111] text-white text-lg font-medium shadow-xl"
                    >
                        Update file
                    </Button>
                </div>
            )}

            <CopyToast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
        </div>
    )
}
