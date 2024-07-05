import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabaseService = process.env.SERVICE_ROLE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)
//using service role key for admin use
export const supabaseAdmin = createClient(supabaseUrl, supabaseService)