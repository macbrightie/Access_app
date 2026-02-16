import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // 1. Fetch from DB
    const { data: file, error } = await supabaseAdmin
        .from('files')
        .select('file_path, is_public')
        .eq('slug', slug)
        .single()

    if (error || !file) {
        return new NextResponse('File not found', { status: 404 })
    }

    if (!file.is_public) {
        return new NextResponse('This file is currently unavailable.', { status: 404 }) // Or 404 to hide existence
    }

    // 2. Redirect to Storage URL
    // We assume public bucket.
    const { data } = supabaseAdmin.storage.from('files').getPublicUrl(file.file_path)

    if (!data.publicUrl) {
        return new NextResponse('Storage URL not found', { status: 500 })
    }

    return NextResponse.redirect(data.publicUrl)
}
