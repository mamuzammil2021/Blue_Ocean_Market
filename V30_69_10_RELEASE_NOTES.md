# V30.69.10 Pink Salt Import Actions — staging candidate

Source baseline: V30.69.9. No SQLite, database, Render storage or accounting-posting code was modified.

Changes:
- Available advance <= 0: both advance-choice buttons remain interactive to display an EN/KR explanation directing the user to New Payment Only; allocation remains blocked.
- Import Cost modal Cancel discards and closes without invoking Import Detail or Save. Existing Save handler unchanged.
- Import Detail hides + Payments when authoritative API outstanding_krw is <= 0.01; leaves it available for positive outstanding balances.

QA: Syntax checks; Chromium simulated DOM/click tests for both advance buttons, forbidden mode, cost Cancel, fully settled vs unpaid payment action.

LIMITATION: Browser QA is isolated/simulated, not authenticated live Render QA. Deploy to staging and confirm workflow, permissions, finance reconciliation, and EN/KR before production.
