import { z } from 'zod'
import { roles } from '../../../lib/auth/permissions'
export const loginSchema = z.object({email:z.email('auth.invalidEmail').transform(value=>value.trim().toLowerCase()),password:z.string().min(1,'auth.required')})
export const emailSchema = loginSchema.pick({email:true})
export const passwordSchema = z.object({password:z.string().min(12,'auth.passwordLength'),confirm:z.string()}).refine(value=>value.password===value.confirm,{path:['confirm'],message:'auth.passwordMismatch'})
export const organizationSchema = z.object({name:z.string().trim().min(1,'auth.required').max(200,'auth.tooLong')})
export const invitationSchema = z.object({email:z.email('auth.invalidEmail'),role:z.enum(roles,{error:'auth.required'}),branch:z.string().optional()})
export function safeNext(value: string | null) {return ['/access','/account','/accept-invitation'].includes(value ?? '') ? value! : '/access'}
