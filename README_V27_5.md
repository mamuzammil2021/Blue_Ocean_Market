# Blue Ocean Market V27.5.0

Node.js + Express + SQLite management platform.

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## QA
```bash
npm run qa:current
```

## Languages
English is the default. Users can switch to Korean (한국어) from the top bar or save a preferred language in My Profile. User-entered business data is not translated.

## Finance verification
Finance records are reviewed against their linked source/evidence. Final verification requires evidence unless the CEO explicitly overrides it. Critical mismatches require CEO review. Corrections/resubmissions update the existing Finance record rather than creating a duplicate source transaction.

## Live deployment warning
The application currently uses SQLite and local file uploads. Before using Render or another ephemeral container for important business data, configure persistent database/upload storage or migrate those services to persistent infrastructure.
