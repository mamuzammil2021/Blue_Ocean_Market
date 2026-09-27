# Blue Ocean Market — V30.57.6 corrected decisions and Work-mode implementation instructions

**Status: owner direction for engineering; NOT signed accountant approval or production acceptance.** Source baseline: `Blue_Ocean_Market_V30_57_6_NODE22_VERIFIED_ACCOUNTING_STAGING_CANDIDATE.zip`. This document supersedes ambiguous instructions in the initial accountant-decision register, but does not amend posted books or approve jurisdiction-specific accounting treatments.

## 1. Owner direction: preserve the live Chart of Accounts

The draft workbook is a **reference specification**, not an instruction to renumber the deployed ledger. All 30 occupied code meanings in the original decision register must remain unchanged. Do not place a new parent/header account on an existing posting/control code, change an account's type, reparent it in a way that changes reporting, or silently redirect historical or future journal lines. Do not create arbitrary alternate numeric codes solely to claim workbook completion.

Build an account-mapping proposal based on the **actual current database and code references**, with fields `draft_code`, `draft_name`, `existing_code_and_meaning`, `proposed_new_code_if_needed`, `existing_equivalent_account_id`, `account_type`, `normal_balance`, `business_unit_scope`, `posting_eligibility`, `source_rule`, `migration_impact`, `decision_owner`, `approval_status`. Prefer mapping to an existing semantically equivalent account; create unused codes only after checking both seeded and deployed account records and their journal references. Keep draft-code labels as a separate reference taxonomy if desired; do not require draft header numbers to exist as live GL codes. No automatic remapping, merging, opening-balance replacement, or mutation of posted journals. Produce a collision-by-collision table and accountant signoff list.

**Decision for all 30 collisions:** keep the existing live meaning; draft replacement/alternate numbering is *not yet approved*. Any required net-new account receives a proposed unused code only, with status `Awaiting approval` and posting disabled until authorized signoff. This resolves the immediate engineering behavior without pretending the accounting-policy signoff is complete.

## 2. Distinguish engineering corrections from accountant policy decisions

Do **not** treat all 198 matrix rows tagged for signoff as 198 reasons to stop development. For each of the 499 rows, classify separately: (a) already implemented and evidence verified; (b) implementable technical control without policy choice; (c) implemented but requires accountant approval before activation; (d) genuinely policy-dependent design; (e) V30.58 scope. Link code paths, fixture names, actual functional test outcomes and remaining review evidence. The existing matrix counts are inventory, not proof of completion.

Technical safeguards can be implemented now: source-linked references, authorization, evidence validation, duplicate/idempotency checks, currency traceability, separate pending and posted balances, closed-period enforcement, audit/reversal linkage, and read-only reconciliation. Do not activate new tax rates, depreciation methods, costing methods, consolidation journals, or account mappings by assumption.

## 3. Specific accounting policy decision register (proposed implementation boundaries)

| Area | Engineering instruction now | Decision still requiring accountant/owner approval |
| --- | --- | --- |
| Fixed assets | Preserve asset register, linked **posted** acquisition/improvements, auditable location history, scheduled cash-neutral depreciation proposals and Posting Control; prevent duplicate depreciation, disposal after invalid/reversed sources, and double derecognition. Build guarded partial/sale/transfer workflows as drafts if feasible. | Capitalization threshold/categories, useful life, depreciation method, residual and effective date, impairment, proceeds/gain-loss mappings, ownership transfers and partial disposals. No automatic posting for unapproved pathways. |
| Accrued/prepaid | Keep recognition, payment and allocation distinct. Link settlement only to an existing eligible verified/evidenced Finance movement; do not generate another cash row. Show pending vs posted balances distinctly; schedules and reversals must respect period locks. | Eligible account mappings, recognition/amortization dates, allocation basis and applicable policy. |
| Payroll | Build payroll-batch liability, employee/BU dimensions, payslip/approval/evidence hooks and posted-liability reconciliation; use authorized drafts/proposals rather than invented salary payments. | Jurisdiction and payroll taxes/deductions, employer contributions, withholding mappings, statutory reporting, effective dates. |
| Tax | Build configurable tax-rule catalog, effective dates, jurisdiction, evidence, authority and liability/receivable reconciliation, **inactive by default**. | Actual applicable tax types, rates, filing and withholding obligations, account mappings and accountant approval. |
| Excavator inventory | Preserve per-machine source trail for purchase, approved capitalizable direct costs, allocations, sold-machine COGS, reversals and profit. Keep Korea machine trading results separate from Pakistan resale-share results. | Eligibility of each repair/logistics/direct cost, timing and FX policy for Pakistan resale-share recognition. |
| Pink Salt | Implement traceability/reconciliation across imports, goods in transit, raw lots, packaging SKU, WIP, finished SKU and gift-box BOM. Preserve existing operational postings; show source/GL differences without fabrication. | Costing method by SKU/lot, eligible landed/direct costs, allocation method, normal loss absorption and abnormal write-off account. |
| Shared supplier credit | Enforce one payment/advance pool per supplier, atomic available-balance checks, obligation-level allocations, reversal audit, no duplicate payment entry. | Cross-category eligibility and precise overpayment/reversal priority if not already governed by current policy. |
| Inter-BU | Keep separate BU journal dimensions, actual posted Due From/Due To matching, and read-only elimination preview. Ensure consolidated views do not double-count internal transfers. | Specific clearing-account pairs, payroll pairing, elimination/posting method, close/reversal behavior. |
| FX / close | Preserve payment currency/amount, FX to KRW, original source/rate, cash versus noncash distinctions, existing period-lock and reversal controls. | Approved rate source/date, revaluation frequency, realized/unrealized accounting and reopening authority. |

## 4. Required Work-mode corrections on exact V30.57.6 source

1. Inspect the source and the supplied accountant register, `accounting_spec/original_v2_reference.json`, `accounting_spec/V30_57_6_WORKBOOK_TO_CODE_MATRIX.json`, and the original V2 workbook if supplied. Do not use V30.57.5 as the starting source.
2. Create the full collision-by-collision mapping and separately identify current live database differences from seed accounts. Never edit production to gather this information; use a safe database copy when available.
3. Finish technically implementable V30.57 workflows together in **one consolidated build**: guarded fixed-asset lifecycle; accrual/prepaid settlement; configurable but inactive tax/payroll accounting; Excavator and Pink Salt end-to-end inventory reconciliation; supplier credit and inter-BU controls; professional submenu UI; exact existing-COA account selector; targeted, ledger-grounded charts. Do not claim policy-gated flows are live.
4. Every cash posting must reference the **one actual Finance record**. Sale recognition or an advance allocation cannot fabricate a receipt; a ₩9,500 sale funded by ₩9,000 prior advance and ₩500 new receipt produces only the ₩500 new money movement. Maintain Finance Verified vs Accounting Posted distinctions.
5. Implement safe migration and validation against an isolated *copy* of existing Render SQLite and representative uploads. Preserve original source IDs, journals, account meanings and files. Never reset or overwrite the current Render disk.
6. Test CEO, BU Manager, Finance and Accountant permissions; full source-to-journal-to-ledger drilldown; posting/approval/reversal; EN/KR and desktop/mobile; staged restart/persistence. Run inherited QA **and** current functional tests. A source check or fresh DB smoke is not existing-data acceptance.
7. Update the 499-row matrix with `implementation_status`, `policy_status`, `code_reference`, `test_reference`, `evidence_level`, `blocking_reason`, `decision_owner`, and `next_action`. Do not convert unverified mappings into `passed`.
8. Deliver **one Git-ready consolidated V30.57 ZIP** with implementation summary, proposed COA mapping, corrected decision register, QA artifacts, remaining approvals, and precise deployment status. Do not push, merge or deploy without explicit permission.

## 5. Acceptance and signoff gates

**Engineering gate:** syntax/build, regression suites, source/GL reconciliation, absence of duplicate Finance movements, permission and transaction integrity, database-copy migration and restart behavior.

**Accounting gate:** authorized accountant signs the proposed COA mapping, account restrictions, depreciation/costing policies, payroll/tax jurisdiction/rates, FX and inter-BU treatment. Owner signs business choices and deployment acceptance. Neither signature is implied by this instruction.

**Staging gate:** authenticated browser tests against a restored existing-data copy with representative uploads. Confirm no balance changes from deployment alone, posted journals immutable except controlled reversals, correct opening/carry-forward balances, and persistent files after restart.

**Production gate:** all applicable gates documented, explicit owner authorization to merge/deploy and a verified backup/rollback plan. Any unsigned policy-specific feature remains inactive with clear UI explanation, not silently omitted or automatically enabled.

## 6. Message to Work mode

> Continue directly from the attached V30.57.6 source. Apply this corrected decision register as engineering direction, not as accountant signoff. Complete all technically safe V30.57 requirements in one consolidated development pass, protect existing account codes and the live SQLite disk, and keep genuinely policy-dependent posting disabled until approval. Provide one final Git-ready ZIP with a row-level COA proposal, evidence-backed 499-row matrix, complete regression results and an explicit staging/production status. Do not stop after a small checkpoint or claim live Render verification from fresh-database tests. Do not push or deploy without my permission.
