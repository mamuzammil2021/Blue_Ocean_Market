# Blue Ocean Market V30.35.0
## Workflow Validation & Pagination Integrity

Built on protected V30.34.0 Stable UI Chrome & Slow-Connection Integrity.

### Implemented
- Buy Machine token payment shows one Pay From company account followed by one Paid To supplier receiver account.
- Supplier receiver account requests are short-lived cached and the supplier default account is auto-selected when available.
- Add / Manage supplier receiver accounts remains a nested child workflow; closing restores the Buy Machine context and refreshes its receiver selector.
- Form validation is deferred until blur and repeated at submit, avoiding disruptive error styling while users are typing.
- Sell Machine keeps Payment Amount synchronized with the selling-price settlement requirement.
- Buyer Advance + New Payment is supported; Payment Amount represents only New Payment Required after the selected buyer advance allocation.
- Sold / Completed machines hide Purchase Edit for normal users and the backend rejects direct purchase edits for non-CEO users.
- Verified/posted machine costs show as locked and direct edit launch is blocked; existing controlled correction/void/reversal workflows remain authoritative.
- Accounting Posting Control is compacted by removing the introductory flow/summary region and gains From/To date filtering.
- Finance records gain From/To date filtering composed with search/status/type/evidence filtering.
- Shared pagination is applied to large rendered tables: default 25 rows, selectable 25/50/100, range/total, Previous/Next and compact mobile behavior.
- Pagination runs after existing search/filter/date visibility rules and does not rebuild page chrome.
- V30.34 targeted-refresh / slow-connection integrity is retained; no full page reload was added.

### Data / migration safety
- No destructive migration.
- No schema change required by V30.35.
- Existing SQLite database, uploads, documents, audit and lifecycle records remain compatible.
