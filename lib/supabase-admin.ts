import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Note: This client should ONLY be used on the server side.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
})
