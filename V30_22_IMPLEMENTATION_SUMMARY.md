# Blue Ocean Market V30.22.0 — Implementation Summary

## Purpose
V30.22 is a stability/security release created after the full-system source audit and the browser defects found during manual testing. The goal is to remove overlapping global behavior, strengthen financial/security integrity and establish safer shared UI rules without rewriting the working business system.

## Review & Confirm
V30.21 contact/payment validation no longer registers a competing capture-mode form submit interceptor. V30.14 now owns the shared pipeline and invokes V30.21 business validation first when needed. A form is reviewed once, receives one bypass for the confirmed resubmission, and then continues into the existing idempotent protected API mutation path.

## Contact validation
Business Phone and Email validation is explicitly excluded from public authentication forms. Each enhanced input owns a unique status element referenced through `aria-describedby` and `aria-invalid`, eliminating the shared-parent selector that could place an Email error under Phone. International phone behavior from V30.21 remains: searchable country list data, flag/country/dial code, country-aware default and normalized E.164-style submitted value.

## Stored attachments
The public `/uploads` static route is disabled. `server/v322.js` provides authenticated View, Download and metadata endpoints. The server resolves the stored filename to known business/document/finance/payroll records, enforces BU and applicable sensitive/module access, and streams files with private/no-store and nosniff headers. The V30.21 viewer now obtains an authenticated Blob and then offers preview/open and Download Original.

## Financial integrity
For interactive real-money forms, configured payment-account defaults are only a preselection convenience: the server requires the actual `payment_account_id`. Payment references are normalized and persisted. Same-account normalized duplicates are rejected by the authoritative server guard; where historical data contains no duplicates a partial unique SQLite index is also created. The early UI check now queries normalized indexed data rather than scanning only the latest 5,000 Finance records.

Manual Finance creation and approved large-Finance execution also persist the normalized reference and exact financial account. Existing source-linked Finance synchronization retains the same guard.

## Authentication/security
- Persistent failed-login telemetry and a 15-minute throttle window.
- Session duration reads the effective Security setting.
- JWTs contain `auth_version`; password changes, admin password resets, deactivation/archive and reset-password actions revoke older sessions.
- Password creation/change uses the central effective System Settings policy.
- Forgot-password raw tokens are sent to the user but only their SHA-256 hash is used for lookup/storage in the new field.
- Production reset links prefer required `APP_BASE_URL`.
- SMTP/AI secret encryption uses `APP_ENCRYPTION_KEY` when configured, with legacy JWT-secret decryption fallback so existing encrypted settings are not broken.

## History preservation
`DELETE /api/users/:id` retains compatibility with the UI/API verb but semantically archives the target: it deactivates the account, revokes sessions, removes manager assignment and preserves the user row and audit history. Historical references therefore remain resolvable.

## Numbering and migrations
Generated transaction/document numbers now use an atomic SQLite UPSERT sequence table keyed by table/prefix/year rather than `COUNT(*) + 1`. V30.22 also introduces `schema_migrations` as the registry for its new additive changes. Full conversion of older historical migration code remains a future consolidation task.

## UI workflow foundation
Buyer detail ordering no longer moves Pakistan Resale Profit Share above Buyer Details. The new V30.22 UI overlay standardizes normal modal semantics, top-right Close (X), Escape behavior, focus restoration and better oversized-dialog handling. This is a foundation only: the standing rule remains to progressively move heavy multi-section workflows to dedicated screens rather than creating new large modals.

## Production PDF support
The Docker image installs Chromium, Noto CJK fonts and supporting certificates, and sets `CHROME_PATH=/usr/bin/chromium` for existing PDF generation paths.

## Deliberately not claimed as complete
- The entire historical frontend/backend version-overlay architecture has not been rewritten in this release.
- Every legacy heavy modal has not been converted to a page; conversion is progressive.
- Legacy monetary `REAL` fields have not been globally migrated to fixed-decimal/minor-unit storage because that requires a controlled accounting migration.
- Full Playwright browser automation is documented as a QA plan but is not bundled as a new dependency in this local-test release.


## Release verification
- Current static/source regression suite: **274 / 274 checks passed**.
- Runtime smoke release identity was corrected to V30.22.0.
- Dependency-backed runtime smoke remains for the target environment because dependency installation timed out in the build container.
