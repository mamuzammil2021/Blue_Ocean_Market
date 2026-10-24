# V30.69.44 implementation and acceptance

## Baseline and scope

Input: `Blue_Ocean_V30_69_44_DEVELOPMENT_CHECKPOINT.zip`. Protected predecessor: V30.69.43, SHA-256 `97c1eecdce00b3339db2dc626ebb5f467ad27d4f5fb77d0d8f9f4a327c748438`, matching `docs/receiving-redesign/BASELINE.json`. Work was isolated on `feature/v30.69.44-receiving-completion`. The complete 24-section authorized brief remains in the source.

The source package is a tested development handoff for staging acceptance. Production deployment, live bank reconciliation, email delivery and business policy approval were not performed by this build.

## Architecture and data

One shared `server/receiving/` service owns Import and Packaging receipt facts, inspection dispositions, discrepancies, claims, approval execution, allocations, refunds, reports and supplier balance integration. Import and Packaging retain their existing purchase masters and valuation rules. The existing supplier master, Finance engine, Accounting Posting Control, approval/task/notification infrastructure and payment engine remain the owners of their respective records.

Fifteen additive `pink_receiving_*` tables hold source baselines, receipts, lines, compensating events, cases, settlement obligations, allocations, refunds, policies, governed actions, audit history, formal quantity closures, links to native payments, migration version and excess charges. `pink_salt_import_items.receiving_unit_cost_krw` adds a receiving valuation basis. The existing durable operation-receipt table supports safe recovery. Receipt lines, disposition events and receiving history have database immutability triggers; corrections append events and linked reversals.

Quantities use fixed four-decimal units; agreed money uses integer cents. Original invoice currency, claim currency, source-account currency and KRW carrying/receipt values remain distinct. Accounting proposals continue through the existing final Posting Control.

## Completed feature checklist

| Authorized area | Delivered behavior | Verification |
| --- | --- | --- |
| 1–3 Scope, baseline, shared workflow | Shared Import/Packaging engine; full-page routes and existing centralized suppliers | Baseline hash, UI contract, API and browser suites |
| 4 Multi-line receiving | Prefill all expected lines; employee physical check remains unchecked; independent physical/accepted/quarantine/rejected entries; Review & Confirm | Receiving API, six EN/KR viewport combinations, real submissions |
| 5 Partial deliveries | Durable cumulative sessions, remaining balances, concurrency/version checks, formal closure and compensating reversal | Base, extended, concurrency and retry suites |
| 6 Discrepancies | Eleven reasons, multiple line discrepancies, stock-versus-bag dimensions, overlap/reconciliation controls | Base and extended suites |
| 7 Responsibility | Supplier/company/carrier/pending investigation; percentage, value and quantity allocation; precise 85/15 calculator | Extended API and responsive browser tests |
| 8 Cases | Stable claim URL, receipt/source links, evidence, employee/follow-up, proposals, approval, partial agreement, linked disputes and controlled amendment | Extended, approvals, supplier/profile and browser suites |
| 9 Settlements | Later delivery, quality-dependent replacement, bill reduction, future credit, actual refunds, mixed methods and company loss | Base/extended/approval/assurance suites |
| 10 Supplier profile | Claims & Adjustments in existing profile; separate cash advance, adjustment credit and refund sources; original-currency balances and statement reconciliation | Native statement/profile comparisons and credit browser test |
| 11 Future purchase payment | Native payment form combines cash advance, adjustment credit and new payment atomically; credit-only moves no cash | 500 + 300 + 200 API case and actual credit-only browser save |
| 12 Imports | Multi-category receipts, independent bags/net weight, raw-source traceability and preserved landed-cost snapshots | Multi-line/weight discrepancy and production suites |
| 13 Packaging | Material conversion, partial/full receipt, quarantine, returns, replacements, stock projections and BOM integration | Packaging API/browser and production suites |
| 14 Dispositions | Controlled quarantine/release/reject/return/disposal and receipt reversal; stock dependencies and closed periods enforced | Receiving/extended/production suites |
| 15 Finance and currencies | Exactly one Finance row per real refund/new payment; non-cash credits remain allocations; KRW/USD/PKR and evidenced cross-currency valuation | Base/extended/Finance posting and inherited FX regressions |
| 16 Approval | Existing configured authority, contextual task, notifications, independent approval, stale-source and revoked-maker checks; approval before Finance verification | Six receiving approval groups plus inherited payment/approval suites |
| 17 Tabler/UI | Scoped Tabler, full-page receiving/claims, calculator, deep refresh, Back/Forward, localized inline errors and compact modal layout | UI contract, EN/KR responsive, keyboard and browser suites |
| 18 Reports | Import/Packaging receiving, case, responsibility, credits/refunds, original currencies and supplier reports in HTML/CSV/PDF | Four report types × two languages × three formats; rendered PDF review |
| 19 Migration | Additive, repeatable migration; original historical rows retained; no fabricated historical claims/cash/stock | 254 predecessor tables compared across upgrade and two startups |
| 20 Reliability | Transactional writes, idempotency, committed-operation lookup, concurrent allocation/refund locking and rollback on injected failures | Assurance, browser fault injection and restart suites |
| 21 QA matrix | Receiving/claims/settlements/currencies, production, migration, UI and inherited regressions | Final gate JSON and QA report |
| 22 Acceptance | Completed development acceptance on synthetic data with target-host acceptance still required | Final gate and recorded limitations |
| 23 Delivery | Versioned complete source, current QA/architecture/migration/deployment/Git documents | Source export verification |
| 24 Company policy | CEO-authorized mappings, credit availability stage and currency permissions; unsupported financial policy stays inactive | Approval policy tests and policy setup instructions |

## Fixes completed after the supplied checkpoint

1. Receiving and refund requests now send their durable operation key in both the request header and payload. Shared request wrappers can no longer substitute a different key and strand refresh recovery.
2. A lost refund success response triggers an operation-status lookup and displays the recorded result. The duplicate-reference check cannot trap a successfully saved refund in an unresolved retry form.
3. Inline errors target the active receiving dialog before its background page.
4. Credit-only payment confirmation explicitly displays adjustment credit separately from cash advance and explains that it moves no new cash.
5. Raw production consumption now records the actual storage-location deductions, with transactional availability checks. Production reversal preserves those location dimensions through the existing compensating-movement flow.
6. Receipt/disposition reversal checks both location and total available inventory, including historical unassigned movements, before removing stock.
7. Packaging Stock & Usage derives unified quarantine and rejected balances from immutable facts/events, independently of usable inventory; rejected quantities have a separate column.
8. Receiving reports identify supplier, purchase, invoice currency, original invoice, KRW carrying value and explicit valuation direction.
9. Added real browser financial execution, production/weighted-cost/restart acceptance and a V44 release gate. Historical browser tests were copied to V44 owners with only the authorized full-page receiving expectations updated; material, purchase, warehouse, approval and financial assertions remain.

## Policy decisions and limits

The release does not select real company GL accounts or approve company financial policy. CEO must authorize the policy screen before financial claim agreements can execute. Review credit availability at Approved versus Posted, cross-currency credit/refund permissions, and the supplied GL mappings. Monetary authority comes from the existing L0–L5 configuration; no real monetary thresholds were invented.

The agreed claim value and explicit settlement methods determine recovery. Freight/customs recovery, carrier/insurer recovery and abnormal loss treatment must be supported by an evidenced agreement and approved account mappings; they are never inferred from shortage quantity. No automatic cross-BU credit use or automatic disputed-credit spending is introduced. Historical stock rows are not retroactively relabeled by location.
