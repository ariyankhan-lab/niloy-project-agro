import { expect, it } from 'vitest'
import { parseSupabaseConfig } from './env'
it('requires both public Supabase values', () => {expect(parseSupabaseConfig({})).toBeNull();expect(parseSupabaseConfig({VITE_SUPABASE_URL:'https://project.supabase.co'})).toBeNull()})
it('rejects malformed and remote insecure URLs', () => {for(const url of ['bad','http://example.com','ftp://example.com']) expect(parseSupabaseConfig({VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:'public-key'})).toBeNull()})
it('accepts HTTPS projects and local HTTP development', () => {for(const url of ['https://project.supabase.co','http://127.0.0.1:54321']) expect(parseSupabaseConfig({VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:'public-key'})).not.toBeNull()})
