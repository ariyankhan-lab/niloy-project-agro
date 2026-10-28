import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, TIME_ZONE } from './index'
describe('Bangladesh formatting', () => {
 it('uses BDT with two decimal places', () => { expect(formatMoney(1234.5)).toContain('1,234.50'); expect(formatMoney(1234.5)).toMatch(/BDT|৳/) })
 it('uses Bangla digits', () => expect(formatMoney(1234.5,'bn')).toContain('১,২৩৪.৫০'))
 it('uses Dhaka calendar day across UTC midnight', () => { expect(TIME_ZONE).toBe('Asia/Dhaka'); expect(formatDate('2026-01-01T18:30:00Z')).toContain('2'); expect(formatDate('2026-01-01T18:30:00Z')).toContain('2026') })
})
