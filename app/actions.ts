'use server'

import { randomBytes } from 'crypto'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateToken } from '@/lib/token-utils'
import { isValidSlug, SLUG_REGEX } from '@/lib/slug-utils'
import { FileUploadResponse } from '@/types/file'
import { revalidatePath } from 'next/cache'

// --- Upload Action ---

export async function uploadFile(prevState: any, formData: FormData): Promise<FileUploadResponse> {
    try {
        const file = formData.get('file') as File
        const slug = formData.get('slug') as string

        if (!file) return { success: false, error: 'No file provided' }
        if (file.size > 50 * 1024 * 1024) return { success: false, error: 'File too large (max 50MB)' }

        if (!slug) return { success: false, error: 'Slug is required' }
        const normalizedSlug = slug.toLowerCase()

        if (!isValidSlug(normalizedSlug)) {
            return { success: false, error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only. Min 4 chars.' }
        }

        const { data: existing, error: checkError } = await supabaseAdmin
            .from('files')
            .select('id')
            .eq('slug', normalizedSlug)
            .single()

        // Single() returns error if no rows found, specifically code 'PGRST116'
        if (existing) {
            return { success: false, error: 'Slug is already taken' }
        }

        const path = `files/${normalizedSlug}`
        const fileBuffer = await file.arrayBuffer()

        // Fix: Use arrayBuffer directly or Buffer if needed, usually arrayBuffer is fine for node env with native fetch
        // but supabase-js in node might expect Buffer.
        const buffer = Buffer.from(fileBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('files')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError)
            return { success: false, error: `Upload failed: ${uploadError.message}` }
        }

        const editToken = generateToken()
        const { error: dbError } = await supabaseAdmin
            .from('files')
            .insert({
                slug: normalizedSlug,
                file_path: path,
                edit_token: editToken,
                is_public: true
            })

        if (dbError) {
            console.error('Supabase DB Insert Error:', dbError)
            return { success: false, error: `Database save failed: ${dbError.message}` }
        }

        return { success: true, slug: normalizedSlug, edit_token: editToken }
    } catch (error: any) {
        console.error('Server Action Error:', error)
        return { success: false, error: `Server error: ${error.message || 'Unknown error'}` }
    }
}

// --- Check Action ---
export async function checkSlugAvailability(slug: string) {
    if (!slug) return { available: false, error: 'Empty slug' }
    const normalizedSlug = slug.toLowerCase()

    if (!isValidSlug(normalizedSlug)) {
        return { available: false, error: 'Invalid slug' }
    }

    const { data: existing } = await supabaseAdmin
        .from('files')
        .select('id')
        .eq('slug', normalizedSlug)
        .single()

    if (existing) {
        return { available: false, error: 'Slug taken' }
    }

    return { available: true }
}

// --- Management Actions ---

export async function getFileDetails(slug: string, token: string) {
    if (!slug || !token) return { success: false, error: 'Missing credentials' }

    const { data: record, error } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('slug', slug)
        .eq('edit_token', token)
        .single()

    if (error || !record) {
        return { success: false, error: 'Invalid or expired token' }
    }

    return { success: true, file: record }
}

export async function verifyToken(token: string) {
    if (!token) return { success: false, error: 'Token is required' }

    // Simple lookup by token
    const { data: record, error } = await supabaseAdmin
        .from('files')
        .select('slug')
        .eq('edit_token', token)
        .single()

    if (error || !record) {
        return { success: false, error: 'Invalid token' }
    }

    return { success: true, slug: record.slug }
}

export async function toggleFilePrivacy(slug: string, token: string, isPublic: boolean) {
    const { error } = await supabaseAdmin
        .from('files')
        .update({ is_public: isPublic })
        .eq('slug', slug)
        .eq('edit_token', token)

    if (error) return { success: false, error: 'Failed to update privacy' }

    // revalidatePath(`/manage/${slug}`)
    return { success: true }
}

export async function updateFileSlug(currentSlug: string, token: string, newSlug: string) {
    if (!isValidSlug(newSlug)) return { success: false, error: 'Invalid slug format' }
    if (currentSlug === newSlug) return { success: false, error: 'New slug is same as old' }

    const { data: record, error: fetchError } = await supabaseAdmin.from('files').select('id, file_path').eq('slug', currentSlug).eq('edit_token', token).single()
    if (!record || fetchError) return { success: false, error: 'Unauthorized or not found' }

    // Check uniqueness
    const { data: existing } = await supabaseAdmin.from('files').select('id').eq('slug', newSlug).single()
    if (existing) return { success: false, error: 'Slug already taken' }

    // Move file in storage
    const oldPath = record.file_path
    const newPath = `files/${newSlug}`

    const { error: moveError } = await supabaseAdmin.storage.from('files').move(oldPath, newPath)
    if (moveError) return { success: false, error: 'Failed to move file in storage' }

    // Update DB
    const { error: dbError } = await supabaseAdmin.from('files').update({
        slug: newSlug,
        file_path: newPath,
        updated_at: new Date().toISOString()
    }).eq('id', record.id)

    if (dbError) {
        console.error('DB Update failed after storage move', dbError)
        return { success: false, error: 'Database update failed. File might be in inconsistent state.' }
    }

    return { success: true, newSlug }
}

export async function regenerateFileToken(slug: string, token: string) {
    const newToken = randomBytes(12).toString('hex')
    const { error } = await supabaseAdmin
        .from('files')
        .update({ edit_token: newToken })
        .eq('slug', slug)
        .eq('edit_token', token)

    if (error) return { success: false, error: 'Failed to regenerate token' }
    return { success: true, newToken }
}

export async function replaceFile(slug: string, token: string, formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No file provided' }

    // Verify token
    const { data: record } = await supabaseAdmin.from('files').select('id, file_path').eq('slug', slug).eq('edit_token', token).single()
    if (!record) return { success: false, error: 'Invalid token' }

    const path = record.file_path || `files/${slug}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(path, fileBuffer, {
            contentType: file.type,
            upsert: true
        })

    if (uploadError) {
        return { success: false, error: 'Upload failed' }
    }

    // Update updated_at
    await supabaseAdmin.from('files').update({
        updated_at: new Date().toISOString()
    }).eq('id', record.id)

    return { success: true }
}
