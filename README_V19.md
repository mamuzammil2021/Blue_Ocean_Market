# Blue Ocean Market V19

## Excavator Operations — clean rebuild

V19 removes the conflicting legacy/V17 Excavator UI code that was overriding the simple V18 implementation. The browser now has one active `excavator()` implementation.

### Simple workflow
1. Buy Machine
2. Add Costs
3. Sell Machine
4. Payments

A machine remains a persistent deal that can be reopened later. Costs include logistics, repair, parts, customs duty, tax/VAT, shipping/freight, commission, documentation/clearance and other cost. Each cost can be included in machine cost or treated as a business expense. Base currency is KRW.

### Sale reliability
V19 adds an atomic `/api/excavator/assets/:id/complete-sale` endpoint so sale transaction creation, machine status/lifecycle update, customer association and lifecycle history are committed together.

### Frontend
`public/index.html` loads `/client.js?v=19`, and the active frontend is `public/client.js`.

### Validation
- Node syntax check: `public/client.js`, `server/server.js`, `server/db.js`
- Duplicate active Excavator UI function removed
- V17 Excavator override block removed
- Atomic sale endpoint added

The project still requires `npm install` on the target Mac before running because dependencies are not bundled.
