# Blue Ocean Market V27.7.0

## Complete English/Korean localization

- Added a comprehensive Korean locale catalog covering 1,433 exact system phrases.
- Added 63 tested dynamic-message translation patterns for counts, statuses, reports, Finance reviews, tasks, payments, and Excavator events.
- Added language selection to the login screen so Korean is available before authentication.
- Kept the selected language persistent in local browser state and each user's profile.
- Translated system business-unit names and role display labels without changing their stored authorization values.
- Applied Korean-friendly typography, word wrapping, and locale-aware monetary formatting.
- Localized notifications, backend validation/error messages, confirmation workflows, modal content, placeholders, titles, and accessibility labels.
- Localized POS receipts and Excavator sale receipts.
- Added Korean Unicode output and selected-language rendering to generated Excavator sale PDFs.

## Release protection

- Added `qa/qa_v277_localization_complete.js` as the current release gate.
- The gate checks static interface text, literal backend messages, dynamic phrases, all major modules, language persistence, receipts, and PDF Unicode behavior.
- Preserved and passed the V27.6 data-integrity suite plus V27.5 Finance, Meetings, approval, performance, Excavator, and supplier-machine regression suites.

## Development policy

English and Korean are compulsory for every future system-managed string. User-entered business data remains unchanged and is never automatically translated.

