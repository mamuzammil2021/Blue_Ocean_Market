# V30.69.49 — October 26 QA corrections

Built directly from the supplied V30.69.48 Supplier Settlement UI source.

This release addresses all ten consolidated points in QA POINTS 26 oct.docx. Read V30_69_49_QA_REPORT.md for the point-by-point implementation and verification record.

- Stable same-page tabs and targeted content refresh.
- In-place edits of unverified supplier advances and costs, preserving Finance identity and audited before/after values. Verified records remain locked.
- Payment clearance and Finance verification enforced on current import receiving APIs and UI.
- Measured receiving weight retained independently of bag count.
- Material creation returns to the Materials list.
- Packaging purchase summary, actions and detail presentation redesigned.
- One invoice action with fast in-page preview, PDF download, bounded caching and export progress.
- Posting Control queue URLs preserved after returning from record actions.
- Received packaging purchases locked; misleading list Close action removed.
- Searchable recipe material selection with selected-item quantities and removal.

## Run and deploy

Use Node 22. Run `npm ci`, then `npm start`. Keep the existing environment variables, persistent database, upload directory and Chrome/Chromium configuration. No destructive migration or financial cleanup runs on startup. This release adds no schema migration.

Back up the database and uploads before deployment. Deploy the complete matching release, including public assets and server/frontend-manifest.json. Health/startup checks reject mixed frontend assets.

For validation in an isolated test environment, run `npm run qa:release -- --browser`. Set CHROME_PATH to an installed Chrome/Chromium executable for PDF generation and browser checks. The tests create temporary databases and use synthetic records.

## Git

Create a new branch in your own checkout before copying this release. Do not pull, merge or change main as part of this update. This archive contains source only and has not been pushed or deployed.
