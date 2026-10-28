import { useState,type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink,Link,useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sprout,LayoutGrid,ShieldCheck,UserRound,Menu,X,LogOut,ArrowUpRight,Globe,LockKeyhole } from 'lucide-react'
import { useSession } from '../../lib/auth/session'
import { Button } from '../../components/ui/button'
import { authErrorKey } from '../../modules/authentication/services/errors'
export function AppShell({children}:{children:ReactNode}) {
 const {t,i18n}=useTranslation();const {status}=useSession();const navigate=useNavigate();const cache=useQueryClient()
 const [open,setOpen]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 const links=[{to:'/',icon:LayoutGrid,label:'workspace.overview'},{to:'/access',icon:ShieldCheck,label:'workspace.access'},{to:'/account',icon:UserRound,label:'workspace.account'}]
 return <div className="workspace-shell"><a href="#main" className="skip-link">{t('skip')}</a>
 {open && <button className="sidebar-backdrop" aria-label={t('workspace.closeMenu')} onClick={()=>setOpen(false)}/>}
 <aside className={`sidebar ${open?'sidebar-open':''}`} aria-label={t('navigation')}><div className="brand-row"><Link to="/" onClick={()=>setOpen(false)} className="brand"><span className="brand-icon"><Sprout size={26}/></span><span>FarmLife<span className="brand-caption">{t('workspace.brandCaption')}</span></span></Link><button className="mobile-only icon-button" onClick={()=>setOpen(false)} aria-label={t('workspace.closeMenu')}><X/></button></div>
 <div className="workspace-switch"><span className="workspace-switch-icon"><Sprout size={19}/></span><div><strong>{t('workspace.previewName')}</strong><span>{t('workspace.previewSub')}</span></div><LockKeyhole size={14}/></div>
 <p className="nav-section-label">{t('workspace.workspace')}</p><nav className="side-nav">{links.map(({to,icon:Icon,label})=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setOpen(false)} className={({isActive})=>isActive?'side-link active':'side-link'}><Icon size={19}/><span>{t(label)}</span></NavLink>)}</nav>
 <div className="sidebar-roadmap"><p className="nav-section-label">{t('workspace.comingNext')}</p>{['cattle','milk-production','inventory','finance'].map(id=><div className="planned-nav" key={id}><span className="planned-dot"/>{t(`modules.${id}`)}<LockKeyhole size={12}/></div>)}</div>
 <div className="sidebar-bottom"><div className="sidebar-note"><Sprout size={21}/><h3>{t('workspace.growTitle')}</h3><p>{t('workspace.growDescription')}</p><Link to="/" onClick={()=>setOpen(false)}>{t('workspace.seePlan')}<ArrowUpRight size={15}/></Link></div><div className="sidebar-country"><span>🇧🇩</span> {t('workspace.bangladesh')}<span className="ml-auto">BDT</span></div></div></aside>
 <div className="workspace-body"><header className="topbar"><div className="flex items-center gap-3"><button className="mobile-only icon-button" aria-label={t('workspace.openMenu')} onClick={()=>setOpen(true)}><Menu/></button><span className="breadcrumb">FarmLife <span>/</span> <strong>{t('workspace.workspace')}</strong></span></div><div className="topbar-actions"><span className="preview-badge"><span/>{t('workspace.preview')}</span><button className="language-button" onClick={()=>void i18n.changeLanguage(i18n.resolvedLanguage==='bn'?'en':'bn')} lang={i18n.resolvedLanguage==='bn'?'en':'bn'}><Globe size={16}/>{t('switchLanguage')}</button>{status==='signedIn'?<Button variant="outline" disabled={busy} className="gap-2" onClick={async()=>{setBusy(true);setError('');try{await import('../../modules/authentication/services/auth').then(module=>module.signOut());await cache.cancelQueries();cache.clear();navigate('/login',{replace:true})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}><LogOut size={16}/><span className="hidden sm:inline">{t('auth.signOut')}</span></Button>:<Button asChild className="gap-2"><Link to="/login"><LockKeyhole size={15}/>{t('auth.signIn')}</Link></Button>}</div></header>
 {error && <p role="alert" className="notice notice-amber m-4">{t(error)}</p>}
 <main id="main" className="workspace-main">{children}</main><footer className="workspace-footer"><span>© {new Date().getFullYear()} FarmLife ERP</span><span>{t('workspace.footer')}</span></footer></div></div>
}
