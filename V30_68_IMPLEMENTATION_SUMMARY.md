# Blue Ocean Market V30.68.0 — Important-Only Email Notifications

Built directly on V30.67.0. This build does not broaden email into routine system activity.

## Implemented
- Central important-only email promotion layer on top of the existing in-app notification engine.
- Existing in-app notifications remain unchanged and authoritative.
- Email delivery uses the existing encrypted SMTP configuration and system email logs.
- Company/BU/user Notification settings continue to govern email; `email_enabled` must be enabled.
- Added explicit important-email controls: high-risk approvals, Finance/Accounting corrections, payroll payment-account changes, security/access events, and critical system failures.
- High-risk approval filtering uses approval level/priority and sensitive action/source types (Finance, payment, refund, void, correction, payroll, bank/account, posting/journal, security/access).
- Approval changes-required/resubmission/CEO-review and failed approved-action execution are email eligible only when the underlying approval is high risk.
- Finance correction required/reminder and Accounting correction required are email eligible.
- Employee payment-account change requests email eligible approvers; approval/rejection outcome can email the employee/requester.
- Sensitive access/profile/permission/approval-authority changes create a security notification to the affected user and can be emailed.
- Manual backup failure records a failed backup and raises a critical system notification to CEO/System Administrator recipients.
- Per-user/language EN/KR plain-text templates and direct workspace links.
- Deduplication table prevents repeat email for the same important event/user.
- Email failures never roll back or block the business transaction; they are logged for review.

## Explicitly kept in-app only
- Routine task assignment/reminders/overdue tasks.
- Ordinary low-stock notifications.
- Successful payments, receipts, postings, verifications and approvals.
- Normal sales/orders and documents.
- General dashboard warnings and informational notifications.

## Required configuration
1. Configure SMTP in System Settings → Email / SMTP Settings.
2. Set production `APP_ENCRYPTION_KEY` and `APP_BASE_URL`.
3. Enable Notifications → Email Enabled.
4. Keep Critical Email Only enabled (default).
5. Use Test Email and confirm Email Logs.

No database reset is required. Schema additions are additive.
