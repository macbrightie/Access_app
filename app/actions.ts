'use server'

import { randomBytes } from 'crypto'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateToken } from '@/lib/token-utils'
import { isValidSlug, SLUG_REGEX } from '@/lib/slug-utils'
import { FileUploadResponse } from '@/types/file'
import { revalidatePath } from 'next/cache'

// --- Upload Action ---

// --- Upload Actions (Signed URL Flow) ---

export async function prepareUpload(slug: string, fileName: string, fileType: string) {
    try {
        if (!slug) return { success: false, error: 'Slug is required' }
        const normalizedSlug = slug.toLowerCase()

        if (!isValidSlug(normalizedSlug)) {
            return { success: false, error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only. Min 4 chars.' }
        }

        // 1. Check if slug exists in DB
        const { data: existing } = await supabaseAdmin
            .from('files')
            .select('id')
            .eq('slug', normalizedSlug)
            .single()

        if (existing) {
            return { success: false, error: 'Slug is already taken' }
        }

        // 2. Generate Path
        const ext = fileName.split('.').pop() || 'bin'
        const path = `files/${normalizedSlug}.${ext}`

        // 3. Generate Signed Upload URL
        // invalidates in 60 seconds * 2 = 2 minutes
        const { data, error } = await supabaseAdmin.storage
            .from('files')
            .createSignedUploadUrl(path)

        if (error || !data) {
            console.error('Signed URL Error:', error)
            return { success: false, error: 'Failed to generate upload URL' }
        }

        return {
            success: true,
            signedUrl: data.signedUrl,
            path: path,
            token: data.token // Supabase token, not our edit token
        }

    } catch (error: any) {
        console.error('Prepare Upload Error:', error)
        return { success: false, error: error.message }
    }
}

export async function completeUpload(slug: string, path: string) {
    try {
        const normalizedSlug = slug.toLowerCase()

        // Double check slug availability (race condition prev)
        const { data: existing } = await supabaseAdmin.from('files').select('id').eq('slug', normalizedSlug).single()
        if (existing) return { success: false, error: 'Slug was taken during upload' }

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
            console.error('DB Insert Error:', dbError)
            return { success: false, error: 'Failed to save file record' }
        }

        return { success: true, slug: normalizedSlug, edit_token: editToken }

    } catch (error: any) {
        console.error('Complete Upload Error:', error)
        return { success: false, error: error.message }
    }
}

// Keeping checkSlugAvailability as is
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
    // Preserve extension
    const ext = oldPath.split('.').pop() || 'bin'
    // If oldPath didn't have extension (legacy data), just use bin or try to guess? 
    // For now assuming existing flow might create files without extension, so we just use what we found.
    // If oldPath was 'files/foo' (no dot), splits gives ['files/foo'], pop gives 'files/foo'. That's bad.
    // Better check:
    const parts = oldPath.split('.')
    const extension = parts.length > 1 ? parts.pop() : '' // If no extension, result is empty

    // Construct new path. If extension exists, add it.
    const newPath = extension ? `files/${newSlug}.${extension}` : `files/${newSlug}`

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

export async function prepareReplace(slug: string, token: string, fileName: string, fileType: string) {
    try {
        // Verify token
        const { data: record } = await supabaseAdmin.from('files').select('id, file_path').eq('slug', slug).eq('edit_token', token).single()
        if (!record) return { success: false, error: 'Invalid token' }

        // Determine new path with correct extension
        const ext = fileName.split('.').pop() || 'bin'
        const newPath = `files/${slug}.${ext}`

        // Generate Signed Upload URL
        const { data, error } = await supabaseAdmin.storage
            .from('files')
            .createSignedUploadUrl(newPath)

        if (error || !data) {
            return { success: false, error: 'Failed to generate upload URL' }
        }

        return {
            success: true,
            signedUrl: data.signedUrl,
            path: newPath
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function completeReplace(slug: string, token: string, path: string) {
    try {
        // Verify token
        const { data: record } = await supabaseAdmin.from('files').select('id').eq('slug', slug).eq('edit_token', token).single()
        if (!record) return { success: false, error: 'Invalid token' }

        // Update DB file_path and updated_at
        const { error } = await supabaseAdmin.from('files').update({
            file_path: path,
            updated_at: new Date().toISOString()
        }).eq('id', record.id)

        if (error) return { success: false, error: 'Failed to update file record' }

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
