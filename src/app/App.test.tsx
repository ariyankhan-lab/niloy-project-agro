import { render,screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { beforeEach,expect,it } from 'vitest'
import i18n from '../lib/i18n'
import { App } from './App'
import { SessionContext } from '../lib/auth/session'
import en from '../locales/en/common.json'
import bn from '../locales/bn/common.json'
beforeEach(async()=>{await i18n.changeLanguage('en')})
function view(path='/'){
 return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={[path]}><SessionContext.Provider value={{session:null,status:'unconfigured'}}><App/></SessionContext.Provider></MemoryRouter></QueryClientProvider>)
}
it('shows an honest project workspace with 22 scoped modules',()=>{
 view();expect(screen.getByRole('heading',{level:1})).toHaveTextContent(en.workspace.overviewTitle)
 expect(screen.getByRole('status')).toHaveTextContent(en.workspace.noData)
 expect(screen.getAllByRole('listitem').length).toBe(26)
})
it('switches to Bangla and persists the document language',async()=>{
 view();await userEvent.click(screen.getByRole('button',{name:'বাংলা'}))
 expect(screen.getByRole('heading',{level:1})).toHaveTextContent(bn.workspace.overviewTitle)
 expect(document.documentElement.lang).toBe('bn');expect(localStorage.getItem('farmlife.language')).toBe('bn')
})
it('filters and searches actual module scope',async()=>{
 view();await userEvent.click(screen.getByRole('button',{name:'Herd & care'}))
 expect(screen.getAllByRole('listitem')).toHaveLength(10)
 await userEvent.type(screen.getByRole('textbox',{name:'Find a module…'}),'nonsense')
 expect(screen.getByText(en.workspace.noResults)).toBeInTheDocument()
})
it('keeps all nested translation keys aligned',()=>{
 function paths(value:object,prefix=''):string[]{return Object.entries(value).flatMap(([key,item])=>typeof item==='object'?paths(item,`${prefix}${key}.`):[`${prefix}${key}`])}
 expect(paths(en)).toEqual(paths(bn))
})
it('handles unknown routes',()=>{view('/missing');expect(screen.getByRole('heading',{level:1})).toHaveTextContent(en.notFound)})
it('guards account routes and shows unconfigured auth honestly',async()=>{
 view('/account');expect(await screen.findByRole('heading',{name:en.auth.loginTitle})).toBeInTheDocument()
 expect(screen.getByRole('status')).toHaveTextContent(en.auth.unconfigured)
 expect(screen.getByRole('button',{name:'Sign in'})).toBeDisabled()
})
it('provides the password recovery route',async()=>{
 view('/forgot-password');expect(await screen.findByRole('heading',{name:en.auth.recoveryTitle})).toBeInTheDocument()
 expect(screen.getByRole('textbox',{name:'Email address'})).toBeInTheDocument()
})
