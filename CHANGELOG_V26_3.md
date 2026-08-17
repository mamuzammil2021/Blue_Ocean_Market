# Blue Ocean Market V26.3.0

## Excavator sale PDF redesign

- Rebuilt the generated Excavator machine-sale PDF as a professional multi-page report instead of a compressed label/value list.
- Uses the complete Open Machine information as the report source: machine identification, financial summary, purchase/supplier details, purchase payments, cost breakdown, parts, repairs, logistics, sale details, buyer information, buyer-payment snapshot, documents, lifecycle history, and final profit/loss.
- Added section headers, readable tables, two-column machine details, page headers/footers, page numbering, and clearer financial presentation.
- Keeps the generated PDF attached to the Excavator Documents section for later use.
- Updated the frontend cache version to 26.3.0.
- Updated the V19 static QA check to validate the current frontend version rather than an obsolete V19 cache marker.

## Verification

- Node syntax check: server.js PASS
- Node syntax check: db.js PASS
- Node syntax check: client.js PASS
- Existing static QA: PASS
- Generated sample PDF: valid PDF 1.4, 3 pages
- Sample PDF raster inspection: PASS
