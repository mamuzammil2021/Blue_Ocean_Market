# Blue Ocean Market V30.70.9

- Excavator Buy Machine accepts an empty Make or Model. Saving from another screen returns to the Excavator Machine List. Purchases with a zero token skip token payment validation.
- The purchase deletion review identifies linked token payments and explains how each will be handled. Unverified Finance entries are voided, verified proposals are cancelled before posting, and posted payments receive a pending reversal in Accounting Posting Control. The original Finance and journal records and the purchase deletion audit remain available.
- The Sell Machine form responds to repeated changes between Export Sale and Local Sale. Export destination fields are active for export sales.
- Shared record tables use compact icon controls for standard row actions including Open and Delete. The Actions column sizes to its controls. Icons have localized hover and focus labels and retain their permissions and confirmations. The development standard in [AGENTS.md](AGENTS.md) applies to future screens.

Run `npm run qa:nov9` for the targeted PostgreSQL-compatible and Chromium tests. The screen matrix covers 294 desktop, tablet and phone cases in English and Korean.
