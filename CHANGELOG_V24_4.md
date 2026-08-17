# Blue Ocean Market V24.4 — Full Excavator + Finance Requirements

Implemented from the requirements collected during Excavator testing.

## Excavator
- Supplier management tab within Excavator.
- Supplier contact/location details.
- Supplier available-machine list.
- Supplier machine requirements, including Buy/Exchange and exchange machine details.
- Existing supplier selection in Buy Machine.
- Machine Name retained and searchable.
- Purchase token + remaining balance tracking.
- Purchase payment status tracks token/balance.
- Sale requires 100% advance payment before completion.
- Sale/payment data posts to Finance automatically.
- Purchase/payment data posts to Finance automatically.
- Supplier requirement matching creates internal notifications when a newly purchased machine matches an active requirement.
- Multiple machine-stage documents remain supported.

## Finance
- Automatic Excavator purchase/sale/payment entries appear in Finance.
- Finance verification workflow: Pending Verification / Verified / Rejected.
- Verification restricted to Finance/Admin and CEO.
- Manual Finance Entry supports general expenses, salaries/wages and other income/expense categories.
- Manual Finance Entry supports multiple attachments.
- Finance entries show source and attachment count.

## Stability
- API responses use no-store cache headers.
- Health version bumped to 24.4.0.
