# Changelog — V28.0.0

## Mobile and responsive UI

- Added an off-canvas mobile sidebar, dimmed overlay, accessible open/close labels and navigation auto-close.
- Added phone/tablet layouts for top navigation, cards, forms, action bars, data tables, notifications and modal/confirmation sheets.
- Added minimum touch sizes and safer overflow behavior for Korean and English text.

## Korean-first bilingual coverage

- Preserved Korean as the first and default language.
- Added Korean output for all V28 static labels, dynamic messages, API errors, evidence validations and correction states.
- Preserved canonical database values and user-entered content without automatic translation.

## Buyer Requirements

- Added machine name, type, make, model, min/max year, serial/chassis, condition, location, maximum budget, quantity, status and notes.
- Added View, Edit, Delete and Matches actions.
- Added server-side matching against available supplier-machine listings.

## Form-state reliability

- Dirty state now reacts only to trusted user input.
- Successful multipart and JSON saves reset dirty state before closing or replacing forms.
- Removed direct Excavator fetch paths that bypassed shared save handling.

## Mandatory Excavator evidence

- Enforced receipt/evidence for purchase tokens, machine payments, buyer payments, sale payments, resale-profit receipts, repairs, logistics, parts and other payment-related cost entries.
- Enforced validation on both client and server.
- Linked evidence to Excavator/Buyer document history and Finance source records.
- Added receipt links to the machine payment history response.

## Finance corrections and performance

- Added correction request records with assignee, requester, reason, requested changes, severity, deadline, response, evidence, timestamps, outcome and resubmission count.
- Added notifications and a dedicated Finance correction queue.
- Added assigned-user view, correction, evidence upload and resubmission workflow.
- Added verification-driven resolution/rejection and a complete audit trail.
- Added correction volume, overdue, response-time and resubmission metrics to People & Performance.

## Release engineering

- Version and cache identity updated to 28.0.0.
- Node.js 22.x pinned for native SQLite compatibility locally and on Render.
- Added V28 static/source QA and live runtime API QA.
- Updated Git/Render deployment instructions and ignore rules verification.
