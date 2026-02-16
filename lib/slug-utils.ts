import { nanoid } from 'nanoid'

export const SLUG_REGEX = /^[a-z0-9-]+$/
export const MIN_SLUG_LENGTH = 4
export const MAX_SLUG_LENGTH = 60

export const RESERVED_SLUGS = [
    'admin',
    'manage',
    'api',
    'upload',
    'login',
    'public',
    'assets',
    '_next'
]

export function isValidSlug(slug: string): boolean {
    if (!slug) return false
    if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) return false
    if (!SLUG_REGEX.test(slug)) return false
    if (RESERVED_SLUGS.includes(slug)) return false
    return true
}

export function generateSlug(): string {
    // Generate a random slug with lowercase letters and numbers
    // customAlphabet is better but for MVP simple random is ok, nanoid is simple.
    // Actually, let's use a simple custom generator if nanoid isn't installed.
    // We didn't install nanoid. Let's use standard Math.random for MVP to avoid deps if possible,
    // or just install nanoid. The prompt says "minimal", so let's keep deps low.
    // But nanoid is standard. I'll use a simple helper.

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}
