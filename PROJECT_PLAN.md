# Project plan

## Initial approved scope
Foundation: project tooling, responsive honest shell, localization, public Supabase client/session primitives, schema/RLS baseline, module boundaries, architecture and automated verification. Foundation is verified. The user subsequently approved further PDF-based development and a preview; current work is Authentication & Roles plus workspace presentation. Stop before the next module. Authentication has passed local live acceptance; hosted production rollout is separate.

## Architecture and dependencies
Organization → branch (farm / collection / distribution) → farm subtype. Shared identity and database authorization precede every business operation. Inventory and accounting primitives must exist before stock/financial workflows claim correctness. Module implementation is sequential; a roadmap version is a product grouping, not permission to build several modules simultaneously.

| Order | Module | Prerequisites and delivery focus |
| --- | --- | --- |
| F | Foundation (current) | Toolchain, architecture, migrations/RLS, bilingual shell and checks |
| 1 | Authentication & Roles (in development) | F; invitations, first-owner provisioning, sessions, explicit permission loading |
| 2 | Organization & Branches | 1; farm/branch workflows, sheds, pens, access assignment |
| 3 | Administration & Audit baseline | 1–2; audit emission, settings, private attachments |
| 4 | Cattle Registry | 2–3; IDs, breed, age, photos, parentage/status |
| 5 | Lifetime Animal Records | 4; events, relationships, approved transfers |
| 6 | Inventory & Stock | 2–3; atomic quantities, batches, expiry, transfer contracts |
| 7 | Finance & Accounting | 2–3; chart, balanced posting engine, periods, reversals |
| 8 | Milk Production | 4,6; sessions, quality, reconciliation |
| 9 | Farmer Milk Collection | 2,7; farmers, quality, rates, settlements; batch link to 6,8 |
| 10 | Feed & Nutrition | 4,6,7; ration/consumption and exact costing |
| 11 | Health & Veterinary | 4,6; treatments, medicine, withdrawals |
| 12 | Breeding & Calving | 4,11; pregnancy/calving and calf records |
| 13 | Calf Growth & Weight | 4; weight/ADG history |
| 14 | Fattening Management | 7,10,11,13; cycles, costs, realized profit |
| 15 | Purchasing & Suppliers | 6–7; receipts/payables, no consumption double-counting |
| 16 | Sales & Customers | 4,6–9; invoices, payments, receivables, animal sales |
| 17 | Milk Delivery & Subscriptions | 8–9,16; recurring orders, routes, returns, billing |
| 18 | Employees & Tasks | 2,7; shifts, assignments, attendance, payroll |
| 19 | Reports & Analytics | Approved operational modules + 7; authorized consolidated reads |
| 20 | Dashboard | 19; real KPIs/date comparisons only |
| 21 | Notifications | Approved event contracts; delivery preferences/deduplication |
| 22 | AI Farm Assistant | 19,3; grounded retrieval, bilingual output, strict scope |
| R | Production/multi-branch gate | All approved workflows; audit/export, consolidation, security/performance, backup/restore, reviewed deployment |

The original version roadmap is retained in docs/MASTER_PLAN.md. Inventory/accounting implementation is deliberately earlier than dependent posting features. Finance reports grow only with real postings; full accounting reporting is verified again at integration gates. Detailed per-module specs live in docs/modules/ and must be refined on approval.

## Foundation acceptance
- Empty repository inspected and master plan reconciled; no existing implementation overwritten.
- React/TypeScript/Vite/Tailwind with shared UI, routing and responsive shell builds.
- All 22 module directories/specifications exist without fake functional routes.
- English/Bangla toggle persists; BDT and Asia/Dhaka formatting tested.
- Typed optional Supabase connection, session lifecycle and fail-closed configuration.
- Versioned tenancy migration; scoped FK/RLS, role metadata and denied privilege escalation tested.
- Lint/type/unit/database/build/browser checks executed and reported with actual scope.
- Required documentation, .env.example and GitHub CI prepared with no real credentials.
- Record hosted integration/production limitations and stop before module 1.

## Per-module acceptance
Approved migrations apply on a fresh and prior supported schema. Authorized workflows use real data and satisfy constraints/concurrency invariants. Responsive English/Bangla UI includes input validation, errors and empty states. Backend/RLS tests include anonymous/nonmember, cross-tenant, cross-branch and denied-role access; frontend hiding is insufficient. Domain tests verify exact money, stock, balances and event consistency as applicable. Relevant unit/integration/E2E, lint, typecheck and build pass; update documentation and report risks. Stop and obtain approval before the next module.
