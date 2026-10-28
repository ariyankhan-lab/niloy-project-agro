import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../locales/en/common.json'
import bn from '../../locales/bn/common.json'
let language = 'en'
try { language = localStorage.getItem('farmlife.language') === 'bn' ? 'bn' : 'en' } catch { /* Storage can be unavailable. */ }
void i18n.use(initReactI18next).init({resources:{en:{translation:en},bn:{translation:bn}},lng:language,fallbackLng:'en',supportedLngs:['en','bn'],interpolation:{escapeValue:false}})
function applyLanguage(lng: string) {
 document.documentElement.lang = lng
 document.documentElement.dir = 'ltr'
 try { localStorage.setItem('farmlife.language',lng) } catch { /* Preference persistence is optional. */ }
}
i18n.on('languageChanged',applyLanguage)
applyLanguage(language)
export default i18n
