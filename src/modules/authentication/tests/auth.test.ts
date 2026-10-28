import { expect,it } from 'vitest'
import { loginSchema,passwordSchema,safeNext } from '../schemas/auth'
import { authErrorKey } from '../services/auth'
it('validates login and password changes',()=>{
 expect(loginSchema.safeParse({email:'bad',password:''}).success).toBe(false)
 expect(loginSchema.safeParse({email:'USER@example.test',password:'existing-password'}).success).toBe(true)
 expect(passwordSchema.safeParse({password:'short',confirm:'short'}).success).toBe(false)
 expect(passwordSchema.safeParse({password:'long-safe-passphrase',confirm:'different'}).success).toBe(false)
})
it('prevents external and unapproved redirect paths',()=>{
 for(const path of ['https://evil.test','//evil.test','/unknown',null])expect(safeNext(path)).toBe('/access')
 expect(safeNext('/accept-invitation')).toBe('/accept-invitation')
})
it('maps backend errors without exposing SQL details',()=>{
 expect(authErrorKey({message:'FORBIDDEN: internal SQL context'})).toBe('auth.forbidden')
 expect(authErrorKey(new Error('Invalid login credentials'))).toBe('auth.invalidCredentials')
 expect(authErrorKey({message:'unrecognized private details'})).toBe('auth.requestFailed')
})
