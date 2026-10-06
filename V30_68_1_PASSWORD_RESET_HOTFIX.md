# V30.68.1 Password Reset UX Hotfix

- Reset email links using `?reset=<token>` now open a dedicated Set New Password screen before normal login boot.
- New Password + Confirm New Password are required. Server-side security policy remains authoritative.
- Successful reset revokes/clears the browser session and returns to Sign In.
- Forgot Password no longer displays developer/local test URLs or raw reset tokens in the UI.
- Forgot Password confirmation is privacy-safe and always tells the requester to check email if the account exists.
- Existing secure token hashing, 30-minute expiry, SMTP delivery, APP_BASE_URL trust, rate limiting, and auth-version session revocation are preserved.
