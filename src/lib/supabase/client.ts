import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/env'
import type { Database } from './database.types'
// No fallback project or service credentials; the shell works without a backend.
export const supabase = supabaseConfig ? createClient<Database>(supabaseConfig.url, supabaseConfig.key, {
 auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
}) : null
