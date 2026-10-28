import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../../lib/auth/session'
export function RequireSession({children}:{children:ReactNode}) {
 const {status}=useSession();const location=useLocation();const {t}=useTranslation()
 if(status==='loading')return <p role="status">{t('auth.checking')}</p>
 if(status!=='signedIn')return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}${location.hash}`} replace/>
 return children
}
