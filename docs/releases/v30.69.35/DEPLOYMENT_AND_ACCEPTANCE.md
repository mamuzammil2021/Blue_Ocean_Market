# V30.69.35 deployment and acceptance

This is a tested staging build. Do not interpret local fixture tests as approval to deploy, proof about an unseen production database, or validation of real bank/SMTP infrastructure.

## Prerequisites

- Node 22.x; install the exact lockfile with `npm ci`.
- The existing persistent SQLite database, uploads directory, environment configuration, JWT secret, and encrypted SMTP credentials must be preserved. Do not seed or initialize over an existing database.
- Take a consistent database backup and a separate uploads backup. Stop application writers for the explicit migration and initial upgrade. Keep the matching .34 source and environment configuration.
- Maintain the existing configured company accounts, Chart of Accounts mappings, L0–L5 reviewers, Accounting periods and Posting Control permissions. No replacement supplier registry, cash ledger or Chart of Accounts is installed.
- Chromium and the existing Korean fonts are needed by the production statement PDF service. Test the standard production Chromium CLI in staging; the local PDF evidence uses the documented test adapter.

## Backup and migration

Use new absolute paths for the backup and the real initialized database. The backup path must not already exist. Run from the delivered project root:

```bash
npm ci
node scripts/migrate-packaging.js --database /absolute/path/blue-ocean.sqlite --backup /absolute/path/backups/pre-v30.69.35.sqlite
```

The command takes a consistent SQLite backup, checks foreign keys, executes the additive packaging migration, and reports before/after stock and Finance counts. It does not initialize a new production database. Normal application startup retries the same idempotent schema migration and installs the approval rules/platform registrations.

The .35 migration adds receiving policy, revision, credit-note, reservation, production-return, cost-adjustment and external-invoice documents. It adds original receipt valuation snapshots, cancelled delivery quantities and carrying-value allocation fields. Original IDs, original transaction fields and existing Finance/accounting references survive. Existing allocation rows use their original `amount_krw` when the new carrying field is null. There is no historical stock or payment backfill.

## Upgrade

1. Restore the backup into an isolated staging environment with a copy of uploads. Disable external email delivery in staging.
2. Apply the migration and start the matching source with `npm start` and the existing environment paths.
3. Reconcile original material quantities by warehouse; supplier outstanding/advances by currency and KRW carrying basis; verified Finance record IDs; posted journal IDs, amounts and statuses. Compare to the pre-upgrade snapshot.
4. Confirm both supplier classifications, all permitted company account currencies, approver assignments, and source/journal links.
5. If receipts before invoices are needed, an authorized Accounting user requests a receiving policy from Stock & Usage. Select an existing liability ledger, enter the approved policy reference and reason, then complete required CEO authorization. No GRNI ledger or policy is silently invented. Existing receipts retain the original policy account.
6. Exercise the staging checklist below. Only deploy after the project owner completes that acceptance.

## Staging acceptance still required

- The actual production database and upload backup: upgrade and reconcile them in staging before production rollout.
- Real Render/persistent-disk restart and storage paths, configured SMTP delivery and important-only notification routing.
- Standard production Chromium PDF CLI and Korean fonts.
- Real bank evidence, agreed FX/conversion directions, account debits, supplier recipient confirmations, fees, invoice settlements and Accounting policy approval.
- Actual reviewer accounts and permission overrides, closed periods, real supplier statements and accountant approval of GRNI/variance account usage.
- Broader app-wide localization/error/notification states beyond the executed bilingual browser/PDF journeys.

No live bank transactions, external emails, production mutations, Git pushes or deployments were made by this build.

## Supported workflow rules and explicit boundaries

- Structural changes to a historical supplier/material/unit/currency identity require a new purchase or the controlled source correction chain. Historical lines are not reassigned to another supplier or SKU. Recognized amendments support existing-line quantities, agreed prices, discount/tax and header references, with a revision check and differential journal.
- Return excess accepted goods before reducing ordered quantities below net receipts. Resolve downstream production/stock and settlement dependencies before purchase cancellation. Reverse supplier refunds before reversing credit notes, and reverse external-cost payments before reversing that invoice. These are source-dependency safeguards, not silent deletion.
- Supplier credit notes link accepted goods returned to their original receipt. Rejected/quarantined goods remain outside usable stock; they are not treated as an already recognized inventory asset.
- Separately billed third-party capitalizable acquisition invoices are finalized after material receipts are complete. The parent supplier invoice must be recognized first. Held stock receives its reviewed acquisition-cost share; cost attributable to already issued packaging uses the reviewed existing General Expense variance treatment. This does not retroactively rewrite old finished lots or previously posted COGS. Pre-receipt external-invoice accrual/allocation and an accountant-selected retrospective finished-lot/COGS revaluation policy are not implemented in this build.
- The added multi-leg form supports outgoing Packaging Purchase payments. Incoming supplier refunds retain the shared normal bank-receipt conversion. Conversion inputs must reconcile after rounding; the system does not invent bank rates or intermediary amounts.
- The UI selects one native advance per settlement; another settlement can apply another advance. The API accepts multiple explicit selections. Native carrying-value and invoice settlement differences are separate non-cash FX entries. Legacy pool allocations remain available for backward compatibility. Historical supplier refunds without an advance ID retain the existing KRW pool treatment; the native projection consumes that refund carrying value in FIFO order. An exact historical per-advance refund identity cannot be reconstructed where none was recorded.
- Reservations protect material availability at the selected warehouse. No physical deduction occurs until confirmed production. Changing the reserved outputs or BOM requires releasing and reserving the revised plan.
- Partial unused-material returns preserve original batch/output snapshots and add cost corrections; whole-batch void reverses both consumption and these returns. Historical sold/allocated lot dependencies still require their existing controlled correction chain.

These boundaries must be reviewed against the intended operating process. The ZIP is not a claim that every possible case in the original acceptance list has been certified.

## Rollback

Before .35 activity, with writers stopped, restore the matching pre-upgrade database, source, uploads and environment as a coordinated rollback. After any .35 receipt, allocation, production, credit or payment activity, a code-only downgrade is unsafe. Prefer an audited roll-forward. Never overwrite newer financial/inventory records with an old backup. Posted journal reversals remain proposals until authorized Posting Control completes them.
