# Blue Ocean Market V30.69.41 — what changed and what remains

The audit confirmed that V30.69.40 had broad shared styling but still contained old internal layouts. Its “complete” wording was too broad. This corrective release fixes the verified gaps below and provides a complete Git-ready source tree on `feature/v30.69.41-tabler-screen-gaps`. Main and remote services were not modified.

## What I changed

- Replaced Accounting’s narrow second sidebar with two-level grouped top navigation and full-width content. Preserved every original route handler and permission check. The same Chart of Accounts destination remains reachable from both existing navigation labels.
- Reworked all 16 Settings sections into a full-width editing workspace below the scope controls and section navigation. Original company/BU/user precedence, section order and callbacks are retained.
- Applied explicit component variants to custom payroll, employee/profile, access, accounting and financial-account panels that previously bypassed the shared design system. Fixed the real sidebar anchor links, wrapping tabs and standalone filters/cart fields. Audit’s formerly 26px square controls now measure 36–38px on desktop and use touch density on mobile.
- Made six access-library create/edit screens, two manual-journal forms and three existing Approval/Task/Work Report details into full pages (11 screen variants). Added only eight route entries to the original router; existing record routes are retained. Access editors return to their exact profiles/groups/policies section; short confirmation dialogs remain intact.
- Fixed loan/foreign-loan navigation from All Units: it now shows a localized request to select a business unit, rather than an unsupported-route error. Actual loan forms still use the original BU-only API behavior.
- Fixed manual-journal save return navigation, which could save and then throw “accountingTab is not defined”. Creation stays Pending Review; correction keeps the same journal and evidence. Added the existing balance helper to the active form and corrected the ledger Credit label context.
- Kept task progress/comments on the routed record after save, and verified report acknowledgement through its original confirmation/reason service.
- Added Korean text for newly exposed access explanations, placeholders, journal actions and attachment policy messages. Named permission-matrix checkboxes by module/action. Reused existing labels, validators, focus behavior and dirty guards.
- Removed the superseded 6,154-byte Accounting injected stylesheet and its old sidebar toggle markup/listeners; replaced selected hard-coded module radii/weights with existing tokens. No whole bundle, server migration or financial handler was deleted.

## What was preserved

All server JavaScript remains byte-identical to protected V30.69.39. No schema, accounting policy, FX calculation, approval level, payment validation, stock/lot rule, mail policy, security header, authentication or production data change is part of this release. The original confirmation and processing services remain authoritative. Tests use disposable synthetic databases.

The latest Library source check before editing found our previous V30.69.40 generated delivery, with V30.69.39 still the latest protected business source; no newer protected source was found. Starting commit: c094e3561121c387398ef4451077696f23b7cc77. Protected ZIP SHA256: 4bfbd4101c96f5ae16a5b143688f0692a1ed167b8e4c6eaa8e11486a64776f9b.

## Verification

- 93 distinct internal/root destinations × 3 widths × EN/KR: 558 authenticated render captures; 54 access/editor/detail and 12 manual journal captures: **624 current captures**, plus **182 pre-change captures**. Widths: 1440, 820 and 390 CSS pixels. View/language/route readiness, uncaught errors and document overflow are checked.
- **17 release suites pass**, including a 19-suite financial/operational regression aggregate with **282 constituent PASS log lines**. This is a log-line count, not an invented count of unique assertions.
- Five standard profiles with independently assigned L0–L4 authority × three views × widths/languages: **90 browser cases**; existing L5 dual-approval protection retained.
- Access profile/group/policy validation, confirmation cancellation, dirty Back guard, confirmed create/edit, direct refresh, exact parent section and unknown-key states tested with persisted records.
- Manual journal create/correct with evidence, eligible balanced lines, one unposted proposal and retained identity tested. Task progress/comment and report acknowledgement persist through original controllers.
- Existing import/packaging receiving/cart, advances/FX, approval-before-verification, Finance/Accounting correction/posting, products/families/lots and production suites rerun.
- Two restarts preserve schema and rows in **254 tables** after original-baseline normalization (only three known registry updated_at refresh fields excluded). No production database is used.
- Synthetic 2,501-order/1,001-customer paging/search check passes across 12 responsive/language cases.
- Fresh Node 22.21 npm ci installs 116 packages; native SQLite, actual app startup, login and an authenticated catalogue read pass. The managed host needs pre-staged official Node headers for native compilation. Offline installation initially failed for an uncached npm archive; online retry succeeded.

The final regression run caught a frozen translation-pattern catalogue integration error. It was fixed by assigning a copied catalogue, and every failed browser suite was rerun. A report-review test now waits for the actual PUT response before asserting persistence. Original failures and rerun provenance are retained; the accepted 17-suite summary is PASS.

## Remaining work and release status

**The broader system-wide structural migration remains partial.** Generic Sales/Purchases creation, Add User, older Excavator edit forms and several domain-specific dialogs still retain original layouts under the shared Tabler styling. These need further screen-specific design review and, where complex, explicit full-page conversion. They are not marked complete merely because they render with the theme. All possible populated/error/status/permission/BU combinations are not visually certified.

OS screen-reader testing, Safari/Firefox testing, native target-host Chrome PDF generation, production load/capacity and business-owner staging acceptance are not completed here. Browser-native date/file controls use the browser/OS locale; this is distinct from the app’s EN/KR labels. Empty fixture states do not prove populated-screen design acceptance.

**Ready for controlled staging review of this corrective release, not production approval or a claim that the entire migration is finished.** No push, merge, email, deployment or persistent-disk action was performed.

## All 15 instruction sections

| Section | Status / evidence |
| --- | --- |
| 1 Mission | Corrective screen improvements delivered; full structural migration explicitly partial. |
| 2 Inputs/branch | Latest-source check, protected hashes and new feature branch; no main edits. |
| 3 Audit/map | Root renderer inventory retained; new 93-destination catalogue, before/after evidence and explicit gaps. |
| 4 Tabler/license | Original pinned MIT Tabler 1.7.0 subset, 58 Sass sources/33 MIT SVGs retained; no new runtime dependency. |
| 5 Components | Named domain adapters, navigation and standalone controls; original tokens reused. |
| 6 Navigation | Sole router, eight entries, exact parent sections, refresh/Back/dirty checks; other complex forms remain partial. |
| 7 Tables/forms | Shared controls, safe scroll/action layout and original validation; paging and selected real submissions tested. |
| 8 Critical behavior | Protected server unchanged; existing financial/operational suites and new manual-journal outcomes pass. |
| 9 EN/KR/accessibility | Two languages, names, keyboard/focus/reflow checks; real assistive-technology certification remains untested. |
| 10 Cleanup | Verified Accounting style/DOM cleanup and token migration; uncertain bundles retained. |
| 11 Checkpoints | Baseline → audit → targeted changes → regression/repair → staging package; no full-completion claim. |
| 12 QA | 17 accepted suites, screenshots, role checks, install/native/startup and disposable data evidence. |
| 13 Release discipline | Source/asset cost, server integrity and deployment safeguards; no live changes. |
| 14 Deliverables | Full source ZIP, checksums, audit/mapping/architecture/cleanup/QA/changelog/release/deployment docs, separate QA evidence. |
| 15 Decision policy | No protected-source ambiguity/license/policy change/data-integrity stop encountered; presentation decisions made conservatively. |

## Asset cost

V30.69.40 → V30.69.41 entry assets: 65 → 66. Raw entry bytes including index: 3,193,934 → 3,202,086 (+8,152). Per-file gzip estimate: 823,865 → 825,939 (+2,074). These are static estimates, not observed HTTP compression or production timing gains. New domain coverage adds bytes. No speed improvement is claimed.
