# V30.57 Accounting decisions and staging acceptance

The draft workbook is a proposal. These decisions require authorized accountant and owner signoff before the corresponding posting behavior is activated. The source preserves existing live account meanings. Approval may be entered in this register or supplied as a signed revised workbook.

## 1. Chart of accounts collisions

For each occupied code, retain the current live meaning and assign a new unused code to the draft concept, or approve a reconciled migration with opening balances and historical journal treatment. The staging candidate retains the live meaning until then.

| Draft code | Draft concept | Existing live meaning | Approved alternate code / decision |
| --- | --- | --- | --- |
| 1000 | ASSETS | Cash / Bank Clearing | Pending |
| 1100 | Cash & Bank | Accounts Receivable | Pending |
| 1110 | Cash in Hand | Pakistan Resale Profit Share Receivable | Pending |
| 1200 | Receivables | Excavator Inventory | Pending |
| 1300 | Advances & Prepayments | Pink Salt Supplier Advances | Pending |
| 1400 | Inventory | Employee Advances | Pending |
| 1500 | Fixed Assets | Inter-Business-Unit Receivable | Pending |
| 2000 | LIABILITIES | Accounts Payable - Suppliers | Pending |
| 2100 | Trade & Other Payables | Buyer / Customer Advances | Pending |
| 2110 | Trade Payables - Suppliers | Pakistan Resale Unallocated Credit | Pending |
| 2200 | Customer / Buyer Advances | Salary Payable | Pending |
| 2210 | Excavator Buyer Advances | Payroll Deductions Payable | Pending |
| 2300 | Taxes & Statutory Payables | Inter-Business-Unit Payable | Pending |
| 3000 | EQUITY | Owner Equity / Retained Earnings | Pending |
| 4000 | REVENUE | Excavator Sales Revenue | Pending |
| 4100 | Excavator Revenue | General Sales Revenue | Pending |
| 4200 | Pink Salt Revenue | Pink Salt Sales Revenue | Pending |
| 4300 | Other Income | Foreign Exchange Gain | Pending |
| 5000 | COST OF SALES | Excavator Cost of Goods Sold | Pending |
| 5100 | Excavator Cost of Sales | General Cost of Goods Sold | Pending |
| 5200 | Pink Salt Cost of Sales | Pink Salt Cost of Goods Sold | Pending |
| 6000 | OPERATING EXPENSES | Salary & Wages Expense | Pending |
| 6100 | Payroll & Staff Costs | Transport / Logistics Expense | Pending |
| 6200 | Office & Administration | Repair & Maintenance Expense | Pending |
| 6300 | Premises & Utilities | Parts / Spare Parts Expense | Pending |
| 6400 | Vehicles & Transport | General Operating Expense | Pending |
| 6500 | Maintenance & Consumables | Bank / Payment Fees | Pending |
| 6510 | Equipment Repairs & Maintenance | Marketplace / Platform Fees | Pending |
| 6600 | Depreciation & Amortization | Foreign Exchange Loss | Pending |
| 6610 | Depreciation Expense | Pink Salt Waste / Stock Loss | Pending |

## 2. Posting policies to approve

| Area | Decision needed | Current candidate behavior |
| --- | --- | --- |
| Fixed assets | Capitalizable categories, useful life, residual, improvements, ownership transfer, partial disposal, proceeds, gain/loss and impairment account mapping. | Existing posted acquisition can be registered; depreciation, improvement and fully depreciated zero-residual disposal require references and Posting Control. Other transitions are gated. |
| Pink Salt raw and packaging | Costing method by SKU/lot, landed-cost allocation and override, direct production costs, gift-box composition, normal loss absorbed versus abnormal loss expensed. | Source/GL differences are shown read-only. Existing operational postings are preserved; no draft rule is activated. |
| Supplier shared credit | Which Import/Packaging obligations may share an advance; allocation/reversal ordering and overpayment handling. | Active import allocations and payments are shown against purchase, with over-allocation flag; no new settlement is fabricated. |
| Excavator and Pakistan resale | Qualifying machine costs and Korea COGS; separate Pakistan profit-share recognition and FX treatment. | Korea machine trading profit is separate from Pakistan resale share. |
| Accrual and prepaid | Eligible expense/liability/prepaid accounts, recognition period, allocation of an existing Finance payment, amortization schedule. | Cash-neutral proposals and source links require explicit policy reference, verified posted source and Posting Control. |
| Inter-BU | Due From/To accounts, payroll pairing, elimination layer, period and reversal behavior. | Posted transfer-pair reconciliation and CEO preview only. |
| Tax and payroll | Applicable jurisdiction, rates, withheld/payable accounts, settlement evidence and employee liability policy. | No new automatic posting. |
| FX and close | Transaction-date rate, realized/unrealized differences, period lock, reconciliation approvals. | Existing controls stay in force; new draft codes/rules inactive. |

## 3. Staging acceptance inputs

- A copy of the existing Render SQLite database and representative upload tree, or authorized staging access to a restored copy. Keep the live persistent disk untouched.
- Test users/role assignments for CEO, BU Manager, Finance and Accountant, or a safe way to create them in staging.
- Signed decisions above and a resolved account-code mapping. For all 61 draft posting rules, identify approved/deferred rules and their source event, debit/credit accounts, evidence and reversal.
- Acceptance results: existing-data migrations, Finance one-receipt/one-record integrity, BU restrictions, posting and reversal, EN/KR UI on desktop/mobile, and persistent disk/uploads after restart.

## Scope boundary

The workbook matrix `accounting_spec/V30_57_6_WORKBOOK_TO_CODE_MATRIX.json` maps all 499 rows: 198 need accountant signoff, 119 point to existing source without end-to-end verification, 7 have partial source/fixture evidence, 95 are reference, and 80 are deferred to V30.58. A green source or fresh-database test is not an approval of those rows.
