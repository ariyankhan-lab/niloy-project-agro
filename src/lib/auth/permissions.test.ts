import { describe, expect, it } from 'vitest'
import { can, type Grant } from './permissions'
const grants: Grant[] = [{organizationId:'a',branchId:'one',permission:'branch.read'}]
describe('scope checks (UI only)', () => {
 it('allows the granted location', () => expect(can(grants,'branch.read',{organizationId:'a',branchId:'one'})).toBe(true))
 it('denies another organization', () => expect(can(grants,'branch.read',{organizationId:'b',branchId:'one'})).toBe(false))
 it('denies another branch and organization-wide use', () => {expect(can(grants,'branch.read',{organizationId:'a',branchId:'two'})).toBe(false);expect(can(grants,'branch.read',{organizationId:'a'})).toBe(false)})
 it('denies ungranted permission', () => expect(can(grants,'membership.write',{organizationId:'a',branchId:'one'})).toBe(false))
 it('allows explicit organization-wide grant in that organization only', () => expect(can([{organizationId:'a',branchId:null,permission:'branch.read'}],'branch.read',{organizationId:'a',branchId:'two'})).toBe(true))
})
