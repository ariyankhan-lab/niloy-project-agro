import { z } from 'zod'
const schema = z.object({
 VITE_SUPABASE_URL: z.url().refine(v => { try { const u = new URL(v); return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost','127.0.0.1'].includes(u.hostname)) } catch { return false } }),
 VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})
export function parseSupabaseConfig(input: Record<string, unknown>) {
 const result = schema.safeParse(input)
 return result.success ? { url: result.data.VITE_SUPABASE_URL, key: result.data.VITE_SUPABASE_PUBLISHABLE_KEY } : null
}
export const supabaseConfig = parseSupabaseConfig(import.meta.env)
