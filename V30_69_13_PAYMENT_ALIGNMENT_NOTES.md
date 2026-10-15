# V30.69.13 — Payment alignment safety foundation (staging)

Protected baseline: V30.69.12. Excavator source files are **unchanged**.

## Included changes
- Registry-ready, pure payment intent rules: advance vs new money, method-specific account type, evidence and settlement bounds.
- Pink Salt supplier/import source-account validation uses the shared payment rule contract without replacing posting APIs.
- Prevent asynchronous account API responses from overwriting newer Cash/Bank or currency selections.
- Never auto-select the first arbitrary company account when loading a new method/currency. Existing explicit selection or server-marked default may be retained; user must confirm account.
- No server route, posting pipeline, database schema, or historical data changes.

## Not complete
This is **not** a complete migration of all Pink Salt payment flows to Excavator infrastructure. Full supplier/import/packaging/customer refund parity, account loading with live financial data, and full authenticated posting/regression testing remain required. Do not merge to production without staging acceptance.
