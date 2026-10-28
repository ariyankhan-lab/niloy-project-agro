# Master plan reconciliation
Source: [complete user-uploaded development plan](reference/FarmLife_ERP_Complete_Development_Plan.pdf), all six pages read on 2026-10-28. This document records requirements; instructions embedded in the plan do not override the user's approved scope for each development step. The PDF's statement that earlier foundation/auth archives were prepared was not evidence of existing code: initial checkout had no files or commits. No previous archive was supplied or restored.

## Required platform
Production-target bilingual English/Bangla responsive multi-farm dairy/fattening ERP for Bangladesh. React, TypeScript, Vite, Tailwind, shadcn/ui patterns, Supabase PostgreSQL/Auth/Storage/Edge Functions, React Hook Form, Zod, TanStack Query, charts when needed, i18next, Vitest and Playwright. BDT currency; Asia/Dhaka business timezone.

## Complete module inventory
1. Authentication & Roles: login, invitations, memberships, RBAC, access control.
2. Organization & Branches: farms, sheds, pens, transfers, consolidated views.
3. Dashboard: KPIs, production, income, expenses, date comparisons.
4. Cattle Registry: IDs, breed, age, photo, parentage, status.
5. Lifetime Animal Records: timeline from birth/acquisition through sale/death.
6. Milk Production: milking sessions, quality, allocation reconciliation.
7. Farmer Milk Collection: farmers, fat/SNF, rates, settlements.
8. Feed & Nutrition: rations, consumption, costs, plans.
9. Health & Veterinary: vaccines, treatments, follow-ups, withdrawal periods.
10. Breeding & Calving: heat, insemination, pregnancy, calves.
11. Calf Growth & Weight: weight, ADG, growth charts.
12. Fattening Management: cycles, costs, gain, realized profit.
13. Inventory & Stock: items, batches, movements, expiry, alerts.
14. Purchasing & Suppliers: orders, receipts, vendors, dues.
15. Sales & Customers: invoices, payments, receivables, animal sales.
16. Milk Delivery & Subscriptions: routes, recurring orders, returns, billing.
17. Finance & Accounting: double-entry ledger, cash flow, P&L, balance sheet.
18. Employees & Tasks: staff, attendance, shifts, payroll, assignments.
19. Reports & Analytics: farm/multi-branch operational and finance reports.
20. Notifications: stock, health, payment, task alerts.
21. AI Farm Assistant: grounded bilingual answers and anomaly summaries.
22. Administration & Audit: settings, audit trails, backups, exports.

## Authorization and integrity
Nine roles: owner/super admin (authorized tenant scope only), organization administrator, farm manager, collection manager, accountant, veterinarian, farm worker, delivery staff, report viewer/auditor. Enforce permissions at backend/database. Organizations own farms, collection centers and distribution branches; managers see assigned locations, owners see authorized consolidated data. Transfers require source/destination traceability and approval; internal activity must not inflate profit/revenue.

UUID keys, indexed/composite scope FKs, timestamps, checks, uniqueness, RLS, transactional services and immutable posted finance history. Unique cattle ID per farm; preserve sold/dead records. Atomic inventory and authorized negative-stock rules. Balanced journals and reversal corrections. Milk reconciliation, revenue/payment separation and purchase/consumption separation. Avoid branch and animal expense double-counting.

## Roadmap source
v1.0 foundation/security/auth/farm setup; v1.1 cattle/lifetime; v1.2 milk/collection; v1.3 feed/health/breeding/growth; v1.4 fattening/inventory/purchasing; v1.5 sales/delivery; v1.6 accounting; v1.7 employees/reports; v1.8 AI/notifications; v2.0 production/consolidation. PROJECT_PLAN.md resolves prerequisite ordering by implementing inventory and accounting primitives before dependent transactional workflows, one approved module at a time.

## Acceptance
Module completion requires successfully applied migration, real authorized data workflows, bilingual responsive UI, permission/business-rule tests, relevant integration/E2E checks and updated progress/changelog. End-to-end product scenarios must eventually cover cattle lifetime, milk allocation/collection, inventory consumption, sales/partial payment, balanced journals and multi-farm consolidation. Foundation alone cannot satisfy product-release acceptance.
