# Blue Ocean Market V30.24.2 — QA Report

## Automated current/source QA

`npm run qa:current` — **PASS**.

New V30.24.2 coverage includes:
- child dialog closes one level only and restores the preserved parent DOM/state;
- close-after-save can refresh the restored parent without creating a duplicate nested level;
- ESC and backdrop handling are scoped to the topmost dialog;
- Close (X) has protected non-overlapping space beside attachment/dialog actions;
- Finance correction sends its own Finance ID to reference validation;
- reference validation excludes linked/mirrored rows belonging to the same logical payment;
- legacy `Unassigned KRW Bank` is not offered/accepted as an interactive payment account;
- Accounting Posting evidence preview inherits the same nested-dialog viewer behavior.

The complete QA console output is included at `qa/V30_24_2_STATIC_QA_RESULTS.txt`.

## Runtime smoke

Not claimed in this container. The clean source package excludes `node_modules`, and `better-sqlite3` is not available in the current build environment. Before production acceptance, run in the normal networked Node 22 environment:

```bash
npm ci
npm run qa:current
npm run qa:runtime
npm start
```

## Targeted manual regression checklist

1. Finance Verification → Correct & Resubmit → View Current Receipt → Close (X): only preview closes; correction form and all unsaved values remain.
2. Repeat with very long receipt filename on desktop/mobile: Download Original and Close (X) do not overlap.
3. Correct Finance entry without changing its reference: no self-duplicate error.
4. Create/use another active transaction on the same Company Financial Account with that reference: duplicate remains blocked.
5. Same reference on a different actual Company Financial Account: allowed with warning.
6. Accounting → Posting Control → Posting Review → Open Evidence → Close: only evidence preview closes; Posting Review stays open.
7. Repeat nested child dialogs/history/previews in Buyers, Suppliers, Machines, Documents/SOPs, Approvals and Reports; close one level at a time with X, backdrop and ESC.
8. Verify legacy `Unassigned KRW Bank` historical records remain viewable but the placeholder cannot be selected for a new/corrected transaction.
