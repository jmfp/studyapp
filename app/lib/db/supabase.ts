import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseService = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)
//using service role key for admin use
export const supabaseAdmin = createClient(supabaseUrl, supabaseService)