# V30.69.26 — Simple Import Cost recipients

Based on protected V30.69.25. Import Cost now accepts a typed recipient name, optional contact/company/address details, and bank/payment-provider, account holder, account/payment identifier and optional country for non-cash payments. The selected payment currency is the recipient account currency; unsupported intermediary routes remain blocked.

Removed the saved-payee dropdown, Add Recipient step and receiver-account manager from this form. The authoritative company financial-account selector remains. Each new cost stores immutable recipient details with its FX transaction and operational cost; existing Finance snapshot fields hold the name/provider/holder, currency and masked account identifier. No new payee or reusable receiver-account master is created.

Cash clears and excludes bank details. Validation, required markers, focus, Review & Confirm, protected processing, idempotency, FX blur calculations, permissions, evidence, correction/reversal and targeted Import Detail refresh remain. Recipient edits invalidate prior amount confirmation. Correction guidance is a stable informational note, so clearing an error while leaving the reason field cannot shift the confirmation checkbox during a click.

Legacy registered payees/accounts remain available to historical API clients and records. The current correction form uses Finance snapshots and requires re-entry if a historical account number no longer matches the preserved masked identifier. A historical account-holder field was not previously snapshotted separately: an unchanged matching account can supply it for review; otherwise the user must enter and confirm it. No historical transaction is rewritten.

Shared code is registered through the existing Pink Salt settlement capability registry (`per_payment_recipient_snapshot`); Excavator handlers are unchanged.
