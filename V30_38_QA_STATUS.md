# V30.38.0 QA Status

- `npm run qa:v338` — **35/35 PASS**
- V30.38 focused Chromium acceptance (`qa/browser_v338_release_audit.py`) — **18/18 PASS**
- Inherited V30.37 focused Chromium audit — **18/18 PASS**
- Inherited V30.36 stateful Chromium audit — **28/28 PASS**
- `npm run qa:v337` — PASS
- `npm run qa:v336` — PASS
- `npm run qa:v336:handlers` — PASS, **0 unresolved inline named handler/call targets**
- `npm run qa:v335` — PASS
- `npm run qa:v334` — PASS
- `npm run qa:v333` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:current` — **V30.38.0 CURRENT QA PASS**
- `npm run qa:render` — PASS
- Schema change — **ADDITIVE ONLY**: `counterparty_payment_account_history` + index
- Destructive migration/reset — **NONE**
- Existing data/uploads/backups/Render persistent disk — **PRESERVED / COMPATIBLE**

### Focused V30.38 acceptance coverage
- account Edit / Archive / History and Review & Confirm submission
- historical receiver snapshot protection
- exact seven Pakistan Resale sections and selected-section retention
- Pakistan → Korea Bank Transfers section
- collapsible Finance/Accounting filters with Posting statuses always visible
- Buy Machine new/existing supplier receiver-account defaults and return context
- shared browser/server Sell Machine settlement calculator
- ₩15,000 sale + ₩10,000 advance → ₩5,000 New Payment
- short-payment rejection and live recalculation after selling-price change
- mobile overflow safety
- Korean localization coverage for V30.38 user-facing additions

### Live runtime note
Run the following in the normal networked Node 22 Mac/Render environment:

```bash
npm ci
npm run qa:runtime
```
