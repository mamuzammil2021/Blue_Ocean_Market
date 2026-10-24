# V30.69.47 — Receiving and Accounting

This build fixes issue decisions, confirmation and authorization, linked later/replacement receiving, supplier credits, refunds and follow-up navigation. Payments remain available independently of receiving holds; settled payments show a locked reason. Receiving holds explain the issue and quantity; completed quantities show history. Original per-bag weights remain visible and placeholders are lighter.

## Activate after deployment

Back up the production database and persistent files. Deploy using the existing Node 22 service and persistent paths. Sign in as CEO, select Pink Salt, open Receiving Accounting Settings (Receiving & Claims Policy), select **Apply Approved Workbook Settings**, review and authorize. Existing configured policies are preserved until this explicit action. No production settings were changed by preparing this ZIP.

Supplier claim credit becomes usable immediately after its Accounting journal is Posted. Agreement approval alone does not release credit. Supplier profiles show awaiting posting, available, used and remaining balances by currency; refund receivables stay separate. Issue screens link directly to Accounting and Finance records.

See V30_69_47_DEPLOYMENT_AND_GIT.md, V30_69_47_QA_REPORT.md and accounting_spec/Blue_Ocean_Accounting_Requirements_v4_V30_69_47_Receiving_Claims.xlsx. Earlier version documents are historical.
