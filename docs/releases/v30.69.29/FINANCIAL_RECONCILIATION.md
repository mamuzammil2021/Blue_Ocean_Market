# V30.69.29 financial reconciliation evidence

The focused server suite records the exact transaction matrix in `qa/evidence/36929-qa15-server.json`. The authenticated browser suite independently verifies stored amounts, account IDs and Finance counts in `36929-qa15-browser.json`.

A representative bank payment settles USD 100 of an invoice carried at KRW 1,300/USD. The selected KRW company account is debited KRW 141,000: USD 100 at bank rate KRW 1,400/USD plus KRW 1,000 fee. Invoice carrying settlement is KRW 130,000; fee is KRW 1,000; FX difference is KRW 10,000. The actual endpoint accepts the payment without quote reference/source/time and creates one linked Finance outflow. The proposal remains balanced and policy/posting controls remain applicable.

The browser independently records USD 20 from a KRW account at 1,400 plus KRW 1,000 fee: KRW 29,000 actual debit, confirmed recipient USD 20, one new Finance record and no fabricated quote metadata. The amount stays estimated until the single evidence confirmation review is accepted.

Advance Only uses existing funds and creates no additional Finance record. Both applies the existing advance and creates exactly one new Finance movement for its new cash component. Separate fee debits retain their existing distinct real-movement treatment.

An unverified cost amendment preserves the immutable original amount/accounts and reverses/replaces its linked projection, Finance effect and pending proposal atomically. Old rows remain in history as reversed/voided; only one active authoritative version affects balances. Repeated submission returns the same replacement. Routine pre-verification amendments notify Finance for verification rather than falsely claiming a requested correction.

Verified direct edits, invented correction requests and legacy edit attempts cannot mutate bank snapshots. Actual assigned original-user corrections retain task linkage, replacement references and pending Finance acceptance. Posted corrections create controlled reversal proposals and preserve the original posted journal; the replacement cannot bypass the linked reversal gate. Received-inventory and closed-period restrictions remain.

The V30.69.28 upgrade test checks all historical transaction/cost/Finance fields, recipient snapshots, COA IDs/codes and movement counts through restarts. No schema migration, financial backfill or production-data rewrite is added by this release.
