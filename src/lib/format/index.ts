export type Language = 'en' | 'bn'
export const TIME_ZONE = 'Asia/Dhaka'
export const CURRENCY = 'BDT'
const locale = (language: Language) => language === 'bn' ? 'bn-BD' : 'en-BD'
export const formatMoney = (value: number, language: Language = 'en') => new Intl.NumberFormat(locale(language), {style:'currency',currency:CURRENCY}).format(value)
export const formatDate = (value: Date | string, language: Language = 'en') => new Intl.DateTimeFormat(locale(language), {timeZone:TIME_ZONE,year:'numeric',month:'short',day:'numeric'}).format(new Date(value))
// DB money is numeric decimal text, never JS floating point for ledger calculations.
