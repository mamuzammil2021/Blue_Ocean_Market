# Blue Ocean Market V12 — Excavator + MIMI structure update

## MIMI Restaurant
- Moved Manage Tables into the Restaurant Tables area on the MIMI dashboard.
- POS uses restaurant tables but does not expose table-management controls.

## Excavator business unit
Implemented first testable Excavator workspace based directly on Blueprint v1.0:
- Equipment / export deal master
- Asset/deal number, equipment type, make, model, year, serial/chassis, condition and status
- Buying price and selling price
- Customer assignment
- Repair cost records
- Logistics/shipping records including mode, provider, origin, destination and tracking/container number
- Purchase and sale payment records with due/paid dates and status
- Excavator dashboard with equipment count, available/sold, purchase cost, repair/logistics cost, sales value, margin, receivables, payables and pending documents
- Business-unit isolation: Excavator APIs require the Excavator workspace to be selected
- CEO-only permanent deletion of an Excavator equipment/deal record

## Validation
- Node syntax checks pass for server, database and browser JavaScript.
- Runtime dependency installation was not available in this build environment, so live browser/database execution still needs to be tested on the Mac.
