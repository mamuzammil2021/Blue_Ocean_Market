# V30.40.0 Implementation Summary

## Baseline
Built directly from `V30.39.2 Core Runtime & Data Path Optimization`. V30.39.x performance/runtime protections remain in place.

## Users & Access redesign
- Reusable Access Profiles replace checkbox-heavy normal administration.
- Multiple profiles may be assigned to one user; each assignment can be global or BU-scoped.
- Reusable Permission Groups provide additive functional access.
- Primary Profile is display/default context only; other active profiles remain effective.
- Effective Access merges active profiles + groups + explicit Advanced overrides and exposes the grant source.
- Approval Authority and financial limits remain separate from normal permissions. L0–L4 are individual authority levels; L5 remains the separate dual Finance + CEO workflow.
- Bulk profile assignment, Clone Access, profile duplication and affected-user visibility are included.
- Shared profile library changes are limited to CEO / Owner or an authorized System Administrator. Delegated administrators remain scope/authority constrained.
- Legacy users migrate losslessly from their existing role to equivalent initial profile assignments.
- Global NULL-scope profile/group/approval-authority duplicates are normalized and uniquely constrained.
- Legacy template/copy paths synchronize with the new multi-profile model.

## Segregation of duties
- Non-CEO Finance reviewers cannot verify/request correction on Finance entries they created.
- Non-CEO Accounting users cannot final-post an Accounting proposal they created.
- L5 Finance-stage reviewer selection uses configured approval authority plus Finance verify permission; CEO remains the final L5 stage.

## System-wide QA/UI refinements
- Successful modal child actions auto-close and targeted-refresh their parent context.
- Receiver/payee account-number validation is enforced in client and server flows.
- Suitable sidebar/full-screen navigation supports normal browser new-tab behavior.
- Filters default collapsed and redundant Date Range headings are removed.
- Machine Purchase Cost appears first, followed by later costs in entry order.
- Verified cost/entry/transaction Void is hidden/restricted for normal users; CEO / Owner retains controlled authority.
- Chrome translation prompting is suppressed through page/runtime language metadata.
- Cash payment mode no longer requires an unnecessary receiver/payee bank account; electronic methods retain receiver requirements.
- Posting Control no longer repeats a Posting Control button while already on that screen.
- Accounting Proposal supports multiline wrapping.
- Actions columns are placed at the far right and action controls are right-aligned; sticky Actions are used where practical. Horizontal scrolling remains allowed for genuinely wide lists.

## Compatibility
No destructive reset. Existing database, evidence/uploads, backups and Render persistent storage are preserved. Live browser scripts: `i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`.
