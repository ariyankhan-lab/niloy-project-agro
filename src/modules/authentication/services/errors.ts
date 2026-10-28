export function authErrorKey(error: unknown) {
 const message=error instanceof Error ? error.message : typeof error==='object' && error && 'message' in error ? String(error.message) : ''
 if(message.includes('UNCONFIGURED')) return 'auth.unconfigured'
 if(/Invalid login credentials|invalid_credentials/i.test(message)) return 'auth.invalidCredentials'
 if(/Email not confirmed/i.test(message)) return 'auth.unconfirmed'
 if(/INVALID_INVITATION/.test(message)) return 'auth.invalidInvitation'
 if(/LAST_OWNER/.test(message)) return 'auth.lastOwner'
 if(/ALREADY_MEMBER/.test(message)) return 'auth.alreadyMember'
 if(/FORBIDDEN|permission denied|42501/.test(message)) return 'auth.forbidden'
 if(/rate|too many/i.test(message)) return 'auth.rateLimited'
 return 'auth.requestFailed'
}
