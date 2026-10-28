# Finance & Accounting
Status: planned. Foundation primitives do not complete this module.

Dependencies: organization.
Proposed data: accounts, journal_entries, journal_lines, financial_periods. Tables are not present unless listed in DATABASE.md as implemented.

## Delivery acceptance
- Approve detailed workflows and permission matrix before implementing this module.
- Add forward-only migrations with organization and location integrity, indexes, constraints and RLS.
- Deliver real authenticated workflows with English and Bangla labels, validation, loading, empty and error states.
- Test allowed and denied roles, cross-organization and cross-branch access, concurrency and business invariants.
- Run unit, database integration, end-to-end, lint, typecheck and build checks; document actual results.
- Update PROGRESS.md and CHANGELOG.md, then stop for approval.
