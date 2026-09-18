# Blue Ocean Market V30.36.0 — Complete Browser Button Audit & UX Hardening

## Baseline

Built directly on V30.35.0. V30.31 lifecycle/reversal controls, V30.33 targeted refresh, V30.34 stable UI chrome / slow-connection behavior and V30.35 workflow/pagination integrity remain authoritative. No database schema change is introduced.

## Browser audit scope

- 99 rendered navigation states across consolidated workspace plus Excavator, Pink Salt, MIMI Restaurant and Mango.
- 438 visible controls inventoried; 169 unique rendered controls were normalized for execution.
- Generic control execution completed without runtime application failures; state-dependent Accounting/Payroll controls were separately exercised in their mounted states.
- 28/28 high-risk stateful Chromium checks passed for Buy Machine, Sell Machine, permissions, cost locks, pagination/date filters, Finished Goods stock safeguards, Review & Confirm and responsive chrome.
- Expanded final source wiring sweep scanned 1,248 inline event attributes / 1,300 named call references (559 unique targets); no genuine unresolved named handler/call target was found.

## Defects found and fixed

1. **Contact validation while typing** — older V30.21 phone/email listeners could still show/remote-check validation during active typing. Input now sanitizes/updates silently; visible/remote validation occurs on blur and authoritative validation is repeated on submit.
2. **Payment-reference validation while typing** — duplicate/reference checking no longer runs from a typing debounce. It runs on blur, with account-change revalidation only after the reference has been touched.
3. **Blur focus regression** — V30.35 blur validation used `checkValidity()`, which dispatches `invalid`; the legacy invalid handler could refocus the field the user had just left. Blur now reads `validity.valid` without dispatching `invalid`. Submit-time validation still uses normal authoritative browser/application validation.
4. **Sell Machine typing validation** — remaining V30.26/V30.28 listeners called `checkValidity()` while users corrected sale fields. They now inspect `validity.valid` without causing an invalid event/focus jump.
5. **Pagination reset** — Finance, Accounting Posting Control, Excavator Machines and shared high-volume filtered lists now reset to page 1 when search/filter/date controls change, then render the filtered result set.

## Stateful workflow verification

Verified in Chromium with controlled API fixtures against the actual V30.36 frontend scripts:

- Buy Machine contains one authoritative Pay From and one Paid To field.
- Compatible company source account and supplier default receiver account are selected correctly.
- Supplier available-machine selection fills machine details.
- Add/Manage receiver-account child modal closes back to the same Buy Machine state.
- Sell Machine Record New Payment follows selling price.
- Buyer Advance + New Payment records only New Payment Required and recalculates when selling price changes.
- Validation remains quiet while typing and appears after blur.
- Sold-machine Purchase Edit is unavailable to normal users and retained as controlled access for CEO/Owner.
- Finance Verified / Accounting Posted machine cost cannot be directly edited.
- Finance and Posting Control date/search filters compose with pagination and reset to page 1.
- Finished Goods Archive/Delete remain blocked while stock exists and become available at zero stock.
- Review & Confirm opens and resolves correctly.
- Mobile/tablet test viewports have no body-level horizontal overflow.

## Runtime limitation

The browser audit uses the real application frontend code in Chromium with controlled API fixtures because this build environment cannot install the missing Node dependencies from the npm registry. Existing backend/source regression and Render-persistence suites remain the server-side safeguard. Run `npm ci && npm run qa:runtime` in a networked Node 22 environment before production acceptance.
