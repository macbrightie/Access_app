'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFileSlug } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { isValidSlug, MAX_SLUG_LENGTH } from '@/lib/slug-utils'

interface SlugEditDialogProps {
    currentSlug: string
    token: string
}

export default function SlugEditDialog({ currentSlug, token }: SlugEditDialogProps) {
    const [open, setOpen] = useState(false)
    const [newSlug, setNewSlug] = useState(currentSlug)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSave() {
        setError(null)
        if (newSlug === currentSlug) {
            setOpen(false)
            return
        }
        if (!isValidSlug(newSlug)) {
            setError('Invalid slug format')
            return
        }

        setLoading(true)
        const res = await updateFileSlug(currentSlug, token, newSlug)
        setLoading(false)

        if (res.success && res.newSlug) {
            setOpen(false)
            // Redirect to new manage URL
            router.push(`/manage/${res.newSlug}?token=${token}`)
        } else {
            setError(res.error || 'Failed to update slug')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Edit Slug</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Slug</DialogTitle>
                    <DialogDescription>
                        Checking availability... This will change your public link immediately. The old link will stop working.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right">
                            Slug
                        </Label>
                        <Input
                            id="slug"
                            value={newSlug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                if (val.length <= MAX_SLUG_LENGTH) setNewSlug(val)
                            }}
                            className="col-span-3"
                        />
                    </div>
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
