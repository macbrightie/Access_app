import { randomBytes } from 'crypto'

export function generateToken(): string {
    // Generate a cryptographically secure random string (12 bytes -> 24 hex chars)
    return randomBytes(12).toString('hex')
}
