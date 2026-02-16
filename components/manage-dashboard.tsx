'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileRecord } from '@/types/file'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Copy, RefreshCw, ArrowLeft, Link as LinkIcon, Save, Loader2, Check } from 'lucide-react'
import { replaceFile, toggleFilePrivacy, regenerateFileToken, updateFileSlug } from '@/app/actions'
import { MAX_SLUG_LENGTH, isValidSlug } from '@/lib/slug-utils'
import { cn } from '@/lib/utils'

interface ManageDashboardProps {
    file: FileRecord
}

export default function ManageDashboard({ file }: ManageDashboardProps) {
    const [isPublic, setIsPublic] = useState(file.is_public)
    const [loading, setLoading] = useState(false)
    const [replaceFileObj, setReplaceFileObj] = useState<File | null>(null)
    const [replaceError, setReplaceError] = useState<string | null>(null)

    // Inline Slug Edit State
    const [newSlug, setNewSlug] = useState(file.slug)
    const [isEditingSlug, setIsEditingSlug] = useState(false)
    const [slugLoading, setSlugLoading] = useState(false)

    const router = useRouter()

    const publicLink = `${window.location.host}/${file.slug}`
    const fullPublicLink = `${window.location.origin}/${file.slug}`
    // const manageLink = `${window.location.origin}/manage/${file.slug}?token=${file.edit_token}` // Not shown prominent in design, buried in regenerate

    const whatsappText = `Here is the file: ${fullPublicLink}`
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

    async function handleTogglePublic(checked: boolean) {
        setIsPublic(checked)
        const res = await toggleFilePrivacy(file.slug, file.edit_token, !checked) // Toggle based on current state (which was !checked)
        if (!res.success) {
            setIsPublic(!checked)
            alert('Failed to update visibility')
        }
    }

    async function handleReplaceFile() {
        if (!replaceFileObj) return
        setLoading(true)
        setReplaceError(null)

        const formData = new FormData()
        formData.append('file', replaceFileObj)

        const res = await replaceFile(file.slug, file.edit_token, formData)
        setLoading(false)

        if (res.success) {
            setReplaceFileObj(null)
            alert('File replaced successfully')
            router.refresh()
        } else {
            setReplaceError(res.error || 'Failed to replace file')
        }
    }

    async function handleRegenerateToken() {
        if (!confirm('Are you sure? The old manage link will stop working immediately.')) return

        setLoading(true)
        const res = await regenerateFileToken(file.slug, file.edit_token)
        setLoading(false)

        if (res.success && res.newToken) {
            router.push(`/manage/${file.slug}?token=${res.newToken}`)
        } else {
            alert('Failed to regenerate token')
        }
    }

    async function handleSaveSlug() {
        if (newSlug === file.slug) return
        if (!isValidSlug(newSlug)) {
            alert('Invalid slug')
            return
        }

        setSlugLoading(true)
        const res = await updateFileSlug(file.slug, file.edit_token, newSlug)
        setSlugLoading(false)

        if (res.success && res.newSlug) {
            router.push(`/manage/${res.newSlug}?token=${file.edit_token}`)
        } else {
            alert(res.error || 'Failed to update slug')
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-300">
            <Button variant="ghost" asChild className="self-start -ml-4 text-gray-500 hover:text-black gap-2">
                <Link href="/">
                    <ArrowLeft className="w-4 h-4" /> Go back
                </Link>
            </Button>

            <div className="text-center space-y-2">
                <h1 className="text-4xl font-normal tracking-tight text-black">Manage File</h1>
                <p className="text-gray-500 font-light">
                    You can play around with file as you'd prefer here.
                </p>
            </div>

            {/* Public Link Pill */}
            <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 p-1 pl-4 pr-1 shadow-sm w-full max-w-md">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 truncate flex-1 text-left">
                    Access.vercel.app/<span className="text-black font-medium">{file.slug}</span>
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-8 w-8 hover:bg-gray-100"
                    onClick={() => navigator.clipboard.writeText(fullPublicLink)}
                >
                    <Copy className="w-4 h-4 text-gray-600" />
                </Button>
            </div>

            {/* Actions Stack */}
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                <Accordion type="single" collapsible className="w-full">

                    {/* Replace File */}
                    <AccordionItem value="replace" className="border-b px-6">
                        <AccordionTrigger className="hover:no-underline py-6 text-base font-normal text-black">
                            Replace file
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">Upload a new file to replace the existing one. Public link stays the same.</p>
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        onChange={(e) => setReplaceFileObj(e.target.files?.[0] || null)}
                                        className="rounded-lg border-gray-200 bg-gray-50"
                                    />
                                </div>
                                {replaceError && <p className="text-sm text-red-500">{replaceError}</p>}
                                <Button
                                    onClick={handleReplaceFile}
                                    disabled={!replaceFileObj || loading}
                                    className="w-full bg-black text-white hover:bg-gray-800 rounded-full"
                                >
                                    {loading ? 'Replacing...' : 'Replace File'}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Make Link Private (Switch) - Custom Row */}
                    <div className="flex items-center justify-between px-6 py-6 border-b">
                        <span className="text-base font-normal text-black">Make link private</span>
                        <Switch checked={!isPublic} onCheckedChange={(c) => handleTogglePublic(!c)} />
                    </div>

                    {/* Regenerate Token */}
                    <AccordionItem value="regenerate" className="border-b px-6">
                        <AccordionTrigger className="hover:no-underline py-6 text-base font-normal text-black">
                            Regenerate Token
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                            <div className="space-y-4">
                                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                                    Warning: Regenerating the token will invalidate the current manage link. You will need to save the new one immediately.
                                </p>
                                <Button
                                    onClick={handleRegenerateToken}
                                    disabled={loading}
                                    variant="destructive"
                                    className="w-full rounded-full"
                                >
                                    {loading ? 'Regenerating...' : 'Regenerate Token'}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* WhatsApp */}
                    <div className="flex items-center justify-between px-6 py-6 border-b hover:bg-gray-50 transition-colors cursor-pointer group">
                        <span className="text-base font-normal text-black flex items-center gap-2">
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">📞</span>
                            Save token to WhatsApp
                        </span>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 group-hover:text-black">
                            <ArrowLeft className="w-4 h-4 rotate-180" /> {/* Using arrow as external link indicator if needed, or simple chevron */}
                        </a>
                    </div>

                </Accordion>

                {/* Edit Link Row */}
                <div className="p-6">
                    <Label className="text-sm text-gray-500 mb-2 block">Edit Link:</Label>
                    <div className="flex items-center w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-12 focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
                        <div className="pl-4 pr-1 flex items-center gap-2 border-r border-gray-100 bg-gray-50/50 h-full">
                            <LinkIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Access.vercel.app/</span>
                        </div>
                        <input
                            value={newSlug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                if (val.length <= MAX_SLUG_LENGTH) setNewSlug(val)
                            }}
                            onFocus={() => setIsEditingSlug(true)}
                            placeholder="my-file"
                            className="flex-1 h-full px-4 outline-none text-base placeholder:text-gray-300 bg-transparent"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="mr-1 h-8 w-8 rounded-full hover:bg-gray-100 text-green-600"
                            onClick={handleSaveSlug}
                            disabled={newSlug === file.slug || slugLoading}
                        >
                            {slugLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
