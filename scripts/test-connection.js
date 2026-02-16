
const { config } = require('dotenv')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load env vars from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

async function testConnection() {
    console.log('Testing Supabase Connection...')

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('URL:', url)
    console.log('Key Length:', key ? key.length : 0)

    if (!url || !key || url.includes('your-project')) {
        console.error('ERROR: Invalid or missing environment variables.')
        console.error('Please update .env.local with real credentials.')
        return
    }

    const supabase = createClient(url, key)

    try {
        // Try to list buckets
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

        if (bucketError) {
            console.error('Supabase Storage Error:', bucketError.message)
        } else {
            console.log('Buckets found:', buckets.length)
            console.log('Bucket names:', buckets.map(b => b.name).join(', '))

            const filesBucket = buckets.find(b => b.name === 'files')
            if (!filesBucket) {
                console.log("Bucket 'files' not found. Attempting to create it...")
                const { data, error: createError } = await supabase.storage.createBucket('files', {
                    public: true,
                    fileSizeLimit: 52428800, // 50MB
                    allowedMimeTypes: null // allow all
                })

                if (createError) {
                    console.error('Failed to create bucket:', createError.message)
                } else {
                    console.log("Bucket 'files' created successfully!")
                }
            } else {
                console.log("Bucket 'files' exists.")
            }
        }

        // Try to access table
        const { count, error: tableError } = await supabase.from('files').select('*', { count: 'exact', head: true })

        if (tableError) {
            console.error('Supabase DB Error:', tableError.message)
        } else {
            console.log('DB Connection Successful. Files count:', count)
        }

    } catch (err) {
        console.error('Unexpected Error:', err)
    }
}

testConnection()
