# V30.69.26 — Scope and controlled boundaries

- Recipient details belong to each Import Cost. No new recipient directory, autocomplete or saved bank-account master is created by this form.
- Previously saved payee/account records are preserved for history and older clients. No cleanup/deletion of those records is performed.
- Recipient account currency follows the chosen payment currency. Unsupported intermediate conversions remain blocked; cash cannot convert currencies.
- A historical account number that no longer matches its Finance masked snapshot must be re-entered and confirmed during correction. Existing snapshots are never replaced by changed master details automatically. Historical account holders need review because V30.69.25 did not store a separate holder snapshot.
- Existing policy-dependent FX/fee posting controls, Finance verification, original-user correction ownership, posting reversal/closed-period controls and received-inventory valuation locks remain.
- Testing uses isolated synthetic databases and authenticated local Chromium. No production deployment, real bank transfer or external email delivery is claimed.
- V30.69.25 statement performance evidence is inherited; this focused change does not modify statement generation.
