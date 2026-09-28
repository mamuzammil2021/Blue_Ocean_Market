# Exact remaining accounting and acceptance decisions

The corrected owner instructions authorize technical implementation; they are not an accountant signature. All 30 occupied draft-code meanings remain the existing meanings, and all workbook replacements are inactive. The account-by-account signoff list is `accounting_spec/V30_57_COA_COLLISION_BY_COLLISION.md`; the 138-row proposal identifies equivalent system keys where supported, without inventing alternate numbers. Before approval, compare actual deployed IDs, extra accounts and journal references on an isolated Render database copy.

| Decision | Required approving authority | Current treatment |
|---|---|---|
| COA: 30 occupied draft-code collisions, reference headers, semantically equivalent accounts, account restrictions and any genuinely unused new code | Authorized accountant; owner accepts chart | Keep existing meanings and codes; draft mappings cannot post. |
| Fixed assets: capitalization thresholds/categories, useful lives, depreciation method/residual/effective date, impairment, sale proceeds/gain-loss accounts, partial disposal and ownership transfer treatment | Accountant; owner sets business policy | Existing protected postings only; new lifecycle intents are review drafts. |
| Accrual/prepaid: eligible recognition accounts, recognition/amortization dates and allocation basis | Accountant | Existing guarded workflow retained; no new assumed schedule/account policy. |
| Payroll: applicable jurisdiction, employee/employer taxes, deductions, contributions, withholding, statutory reports, effective dates and accounts | Accountant; owner confirms payroll choices | Existing salary-payable liability and actual Finance settlement link; tax rule drafts inactive. |
| Tax: applicable taxes, rates, jurisdiction, filing/withholding obligations, receivable/liability mappings and effective dates | Accountant | Configurable evidence-backed drafts are inactive. |
| Excavator: direct-cost eligibility, repair/logistics capitalization and Pakistan resale-share timing/FX | Accountant | Source and posted GL review, distinct market profitability; no new costing activation. |
| Pink Salt: SKU/lot costing method, eligible landed/direct cost, allocation, normal-loss absorption and abnormal-loss/write-off account | Accountant | Source trail and variance review; no fabricated SKU/WIP posted value. |
| Shared supplier credit: cross-category eligibility and any overpayment/reversal priority outside existing rules | Accountant; owner confirms supplier policy | Existing payment pool preserved; posted versus operational review flags differences. |
| Inter-BU: clearing account pairs, payroll pairing, elimination/posting method and close/reversal behavior | Accountant | Separate BU journals and read-only elimination/external view; no consolidation posting. |
| FX/close: authoritative rate source/date, revaluation interval, realized/unrealized accounts, reopening authority | Accountant; owner approves reopen authority | Existing currency trace, period locks and reversals preserved. |

## Evidence required before release

1. Provide an isolated, authorized copy of the **existing** Render SQLite database and representative uploads, including WAL/SHM or a consistent SQLite backup. Run migration and restart against that copy; compare account meanings, IDs, posted balances, journal/reversal links, source documents and uploads before/after. No production reset or disk overwrite.
2. Authenticate CEO, BU Manager, Finance and Accountant on staging; exercise source→journal→ledger, approval/reversal, EN/KR and desktop/mobile views with actual data. The current static and synthetic checks are recorded in `qa/V30_57_CONSOLIDATED_QA_REPORT.md`.
3. Document accountant mapping/policy approval, owner business acceptance, verified backup and rollback plan, then request explicit owner authorization before merge or deployment.
